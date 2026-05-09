import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentRepository } from './store/document.repository';
import { InMemoryDocumentsStore } from './store/in-memory-documents.store';

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [DocumentsController],
  providers: [InMemoryDocumentsStore, DocumentRepository, DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
