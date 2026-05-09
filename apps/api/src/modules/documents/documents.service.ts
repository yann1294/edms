import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../../shared/current-user';
import { Document, DocumentListResult } from './document.types';
import { DocumentRepository } from './store/document.repository';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly repository: DocumentRepository,
  ) {}

  createDocument(input: {
    organizationId: string;
    actor: CurrentUser;
    title: string;
    description?: string | null;
    folderId?: string | null;
    documentTypeId?: string | null;
  }): Document {
    const title = input.title.trim();
    if (!title) throw new BadRequestException('title is required.');
    if (!input.organizationId || !isUUID(input.organizationId))
      throw new BadRequestException('organizationId must be a uuid.');
    if (input.folderId && !isUUID(input.folderId)) throw new BadRequestException('folderId must be a uuid.');
    if (input.documentTypeId && !isUUID(input.documentTypeId))
      throw new BadRequestException('documentTypeId must be a uuid.');

    const doc = this.repository.create({
      organizationId: input.organizationId,
      folderId: input.folderId ?? null,
      documentTypeId: input.documentTypeId ?? null,
      ownerUserId: input.actor.id,
      createdBy: input.actor.id,
      title,
      description: input.description ?? null,
      status: 'draft',
      confidentialityLevel: null,
      currentVersionId: null,
      archivedAtUtc: null,
    });

    this.auditService.record({
      actionCode: 'document.created',
      actorUserId: input.actor.id,
      resourceType: 'document',
      resourceId: doc.id,
      metadata: { title: doc.title },
    });

    return doc;
  }

  getDocumentById(input: { id: string; organizationId: string }): Document {
    const doc = this.repository.getById(input.id);
    if (doc.organizationId !== input.organizationId) {
      throw new NotFoundException('Document not found.');
    }
    return doc;
  }

  listDocuments(input: {
    organizationId: string;
    page: number;
    pageSize: number;
  }): DocumentListResult {
    const page = Number.isFinite(input.page) && input.page > 0 ? Math.floor(input.page) : 1;
    const pageSize =
      Number.isFinite(input.pageSize) && input.pageSize > 0 ? Math.min(Math.floor(input.pageSize), 100) : 20;

    const all = this.repository.listByOrg(input.organizationId);
    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);
    return { items, page, pageSize, total, hasNext: start + pageSize < total };
  }

  updateDocument(input: {
    id: string;
    organizationId: string;
    actor: CurrentUser;
    title?: string;
    description?: string | null;
    folderId?: string | null;
  }): Document {
    const existing = this.getDocumentById({ id: input.id, organizationId: input.organizationId });

    const patch: any = {};
    if (input.title !== undefined) {
      const t = input.title.trim();
      if (!t) throw new BadRequestException('title must not be empty.');
      patch.title = t;
    }
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.folderId !== undefined) {
      if (input.folderId !== null && !isUUID(input.folderId)) throw new BadRequestException('folderId must be a uuid.');
      patch.folderId = input.folderId;
    }

    const updated = this.repository.update(existing.id, patch);

    this.auditService.record({
      actionCode: 'document.updated',
      actorUserId: input.actor.id,
      resourceType: 'document',
      resourceId: updated.id,
      metadata: { title: updated.title },
    });

    return updated;
  }

  deleteDocument(input: { id: string; organizationId: string; actor: CurrentUser }): { id: string } {
    const existing = this.getDocumentById({ id: input.id, organizationId: input.organizationId });
    this.repository.delete(existing.id);

    this.auditService.record({
      actionCode: 'document.deleted',
      actorUserId: input.actor.id,
      resourceType: 'document',
      resourceId: existing.id,
      metadata: { title: existing.title },
    });

    return { id: existing.id };
  }
}
