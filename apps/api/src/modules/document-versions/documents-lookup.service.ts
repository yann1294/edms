import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DocumentRepository } from '../documents/store/document.repository';
import { Document } from '../documents/document.types';

@Injectable()
export class DocumentsLookupService {
  constructor(private readonly moduleRef: ModuleRef) {}

  getRepository(): DocumentRepository {
    const repo = this.moduleRef.get(DocumentRepository, { strict: false });
    if (!repo) throw new ServiceUnavailableException('Documents repository not available.');
    return repo;
  }

  getById(id: string): Document {
    return this.getRepository().getById(id);
  }

  setCurrentVersionId(documentId: string, versionId: string): Document {
    return this.getRepository().setCurrentVersionId(documentId, versionId);
  }
}

