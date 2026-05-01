import { Module } from '@nestjs/common';
import { AuditModule } from './modules/audit/audit.module';
import { AdministrationModule } from './modules/administration/administration.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { FileAssetsModule } from './modules/file-assets/file-assets.module';
import { MetadataSchemasModule } from './modules/metadata-schemas/metadata-schemas.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RolesModule } from './modules/roles/roles.module';
import { SearchModule } from './modules/search/search.module';
import { SignaturesModule } from './modules/signatures/signatures.module';
import { UsersModule } from './modules/users/users.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [
    AuthModule,
    HealthModule,
    AuditModule,
    UsersModule,
    RolesModule,
    DocumentsModule,
    FileAssetsModule,
    MetadataSchemasModule,
    WorkflowModule,
    SignaturesModule,
    SearchModule,
    NotificationsModule,
    AdministrationModule,
  ],
})
export class AppModule {}

