import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { FileAssetsController } from './file-assets.controller';
import { FileAssetsService } from './file-assets.service';
import { FileAssetRepository } from './store/file-asset.repository';
import { InMemoryFileAssetsStore } from './store/in-memory-file-assets.store';
import { STORAGE_SERVICE } from './storage/storage.service';
import { S3StorageService } from './storage/s3-storage.service';

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [FileAssetsController],
  providers: [
    InMemoryFileAssetsStore,
    FileAssetRepository,
    FileAssetsService,
    {
      provide: STORAGE_SERVICE,
      useClass: S3StorageService,
    },
  ],
  exports: [FileAssetsService],
})
export class FileAssetsModule {}
