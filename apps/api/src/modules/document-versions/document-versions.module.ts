import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentsModule } from '../documents/documents.module';
import { FileAssetsModule } from '../file-assets/file-assets.module';
import { DocumentVersionsController } from './document-versions.controller';
import { DocumentVersionsService } from './document-versions.service';
import { DocumentVersionRepository } from './store/document-version.repository';
import { InMemoryDocumentVersionsStore } from './store/in-memory-document-versions.store';
import { FileAssetsLookupService } from './file-assets-lookup.service';
import { DocumentsLookupService } from './documents-lookup.service';

@Module({
  imports: [AuditModule, AuthModule, DocumentsModule, FileAssetsModule],
  controllers: [DocumentVersionsController],
  providers: [
    InMemoryDocumentVersionsStore,
    DocumentVersionRepository,
    FileAssetsLookupService,
    DocumentsLookupService,
    DocumentVersionsService,
  ],
  exports: [DocumentVersionsService],
})
export class DocumentVersionsModule {}
