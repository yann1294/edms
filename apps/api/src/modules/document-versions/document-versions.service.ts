import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Scope,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { REQUEST } from '@nestjs/core';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../../shared/current-user';
import { DocumentVersion } from './document-version.types';
import { DocumentVersionRepository } from './store/document-version.repository';
import { DocumentsLookupService } from './documents-lookup.service';
import { FileAssetsLookupService } from './file-assets-lookup.service';

@Injectable({ scope: Scope.REQUEST })
export class DocumentVersionsService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    private readonly auditService: AuditService,
    private readonly documentsLookup: DocumentsLookupService,
    private readonly fileAssetsLookup: FileAssetsLookupService,
    private readonly repository: DocumentVersionRepository,
  ) {}

  async createVersion(input: {
    documentId: string;
    fileAssetId: string;
    changeSummary?: string | null;
    isMajorVersion?: boolean;
  }): Promise<DocumentVersion> {
    const actor = (this.request as any)?.context?.user as CurrentUser | undefined;
    if (!actor) throw new BadRequestException('CurrentUser is required.');

    if (!isUUID(input.documentId)) throw new BadRequestException('documentId must be a uuid.');
    if (!isUUID(input.fileAssetId)) throw new BadRequestException('fileAssetId must be a uuid.');

    // Step 1 — verify document exists
    const document = this.documentsLookup.getById(input.documentId);

    // Step 2 — verify FileAsset exists and is completed
    const fileAsset = this.fileAssetsLookup.getById(input.fileAssetId);
    if (fileAsset.uploadStatus !== 'completed') {
      throw new BadRequestException('File asset is not ready.');
    }

    // Step 3 — next version number
    const last = this.repository.getLatestVersionNumber(document.id);
    const nextNumber = (last ?? 0) + 1;

    // Step 4/5 — "transaction": create version and update document.currentVersionId atomically
    let created: DocumentVersion | null = null;
    try {
      created = this.repository.create({
        documentId: document.id,
        versionNumber: nextNumber,
        fileAssetId: fileAsset.id,
        changeSummary: input.changeSummary ?? null,
        isMajorVersion: input.isMajorVersion ?? false,
        createdBy: actor.id,
      });

      this.documentsLookup.setCurrentVersionId(document.id, created.id);

      this.auditService.record({
        actionCode: 'document.version.created',
        actorUserId: actor.id,
        resourceType: 'document-version',
        resourceId: created.id,
        metadata: {
          documentId: document.id,
          versionId: created.id,
          versionNumber: created.versionNumber,
          fileAssetId: fileAsset.id,
        },
      });

      return created;
    } catch (err) {
      if (created) {
        this.repository.deleteById(created.id);
      }
      throw err instanceof BadRequestException ? err : new InternalServerErrorException('Version creation failed.');
    }
  }
}
