import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import path from 'path';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../../shared/current-user';
import { FileAssetPublicDto, FileAsset } from './file-asset.types';
import { FileAssetRepository } from './store/file-asset.repository';
import { STORAGE_SERVICE, StorageService } from './storage/storage.service';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set<string>(['application/pdf', 'image/png', 'image/jpeg']);

function sha256Hex(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function sanitizeFilename(filename: string): string {
  const base = path.basename(filename || 'file');
  const trimmed = base.replace(/\0/g, '').trim();
  const normalized = trimmed.replace(/\s+/g, '_');
  const safe = normalized.replace(/[^a-zA-Z0-9._-]/g, '');
  const collapsed = safe.replace(/_{2,}/g, '_').replace(/\.{2,}/g, '.');
  const result = collapsed.length > 0 ? collapsed : 'file';
  return result.slice(0, 180);
}

function uploadObjectKey(input: {
  organizationId: string;
  fileAssetId: string;
  filename: string;
}): string {
  return `org/${input.organizationId}/file-assets/${input.fileAssetId}/original/${input.filename}`;
}

function toPublicDto(asset: FileAsset): FileAssetPublicDto {
  return {
    id: asset.id,
    originalFilename: asset.originalFilename,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    checksumSha256: asset.checksumSha256,
    uploadStatus: asset.uploadStatus,
    createdAtUtc: asset.createdAtUtc,
  };
}

@Injectable()
export class FileAssetsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly repository: FileAssetRepository,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async upload(input: {
    organizationId: string;
    file: Express.Multer.File;
    actor: CurrentUser;
  }): Promise<FileAssetPublicDto> {
    if (!input.file) throw new BadRequestException('file is required.');
    if (!Buffer.isBuffer(input.file.buffer)) throw new BadRequestException('file buffer is missing.');
    if (input.file.size <= 0) throw new BadRequestException('file is empty.');
    if (input.file.size > MAX_UPLOAD_SIZE_BYTES)
      throw new BadRequestException(`file exceeds max size of ${MAX_UPLOAD_SIZE_BYTES} bytes.`);
    if (!ALLOWED_MIME_TYPES.has(input.file.mimetype))
      throw new BadRequestException('mimeType is not allowed.');

    const fileAssetId = randomUUID();
    const filename = sanitizeFilename(input.file.originalname);
    const checksumSha256 = sha256Hex(input.file.buffer);
    const objectKey = uploadObjectKey({ organizationId: input.organizationId, fileAssetId, filename });

    const storageProvider = process.env.STORAGE_PROVIDER ?? 'unknown';
    const bucketName = process.env.STORAGE_BUCKET ?? 'unknown';

    const pending = this.repository.createPending({
      id: fileAssetId,
      storageProvider,
      bucketName,
      objectKey,
      originalFilename: filename,
      mimeType: input.file.mimetype,
      sizeBytes: input.file.size,
      checksumSha256,
      encryptionStatus: null,
      previewObjectKey: null,
      thumbnailObjectKey: null,
      createdBy: input.actor.id,
    });

    this.auditService.record({
      actionCode: 'file-asset.upload.started',
      actorUserId: input.actor.id,
      resourceType: 'file-asset',
      resourceId: pending.id,
      metadata: { mimeType: pending.mimeType, sizeBytes: pending.sizeBytes },
    });

    try {
      await this.storage.uploadObject({
        objectKey: pending.objectKey,
        body: input.file.buffer,
        contentType: pending.mimeType,
      });

      // TODO: integrate antivirus scanning / quarantine pipeline.

      const completed = this.repository.updateStatus(pending.id, 'completed');
      this.auditService.record({
        actionCode: 'file-asset.upload.completed',
        actorUserId: input.actor.id,
        resourceType: 'file-asset',
        resourceId: completed.id,
      });
      return toPublicDto(completed);
    } catch (err) {
      const failed = this.repository.updateStatus(pending.id, 'failed');
      this.auditService.record({
        actionCode: 'file-asset.upload.failed',
        actorUserId: input.actor.id,
        resourceType: 'file-asset',
        resourceId: failed.id,
        metadata: { errorName: (err as any)?.name ?? 'Error' },
      });
      throw new InternalServerErrorException('Upload failed.');
    }
  }

  async createDownloadUrl(input: { fileAssetId: string; actor: CurrentUser }): Promise<{ url: string }> {
    const asset = this.repository.getById(input.fileAssetId);
    if (asset.uploadStatus !== 'completed') {
      throw new BadRequestException('File asset is not available for download.');
    }

    const url = await this.storage.getSignedDownloadUrl(asset.objectKey);
    this.auditService.record({
      actionCode: 'file-asset.download-url.created',
      actorUserId: input.actor.id,
      resourceType: 'file-asset',
      resourceId: asset.id,
    });
    return { url };
  }
}

