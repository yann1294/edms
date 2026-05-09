import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuditService } from '../src/modules/audit/audit.service';
import { FileAssetsModule } from '../src/modules/file-assets/file-assets.module';
import { FileAssetsService } from '../src/modules/file-assets/file-assets.service';
import { FileAssetRepository } from '../src/modules/file-assets/store/file-asset.repository';
import { STORAGE_SERVICE, StorageService } from '../src/modules/file-assets/storage/storage.service';
import { CurrentUser } from '../src/shared/current-user';

const actor: CurrentUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  email: 'u@example.com',
  firstName: 'U',
  lastName: 'S',
  status: 'active',
};

function makeFile(input: {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}): Express.Multer.File {
  return {
    buffer: input.buffer,
    originalname: input.originalname,
    mimetype: input.mimetype,
    size: input.buffer.length,
  } as any;
}

describe('FileAssetsService', () => {
  it('successful upload generates checksum and returns safe metadata', async () => {
    process.env.STORAGE_PROVIDER = 'minio';
    process.env.STORAGE_BUCKET = 'bucket';

    const uploaded: any[] = [];

    const moduleRef = await Test.createTestingModule({
      imports: [FileAssetsModule],
    })
      .overrideProvider(STORAGE_SERVICE)
      .useValue({
        uploadObject: async ({ objectKey, body, contentType }) => {
          uploaded.push({ objectKey, size: body.length, contentType });
        },
        getObjectMetadata: async () => null,
        getSignedDownloadUrl: async (objectKey: string) => `https://signed.example/${objectKey}`,
        deleteObject: async () => {},
      } satisfies StorageService)
      .compile();

    const service = moduleRef.get(FileAssetsService);
    const audit = moduleRef.get(AuditService);

    const result = await service.upload({
      organizationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      actor,
      file: makeFile({
        buffer: Buffer.from('hello'),
        originalname: 'contract.pdf',
        mimetype: 'application/pdf',
      }),
    });

    expect(result.id).toBeDefined();
    expect(result.originalFilename).toBe('contract.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.sizeBytes).toBe(5);
    expect(result.checksumSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.uploadStatus).toBe('completed');

    expect((result as any).bucketName).toBeUndefined();
    expect((result as any).objectKey).toBeUndefined();
    expect((result as any).storageProvider).toBeUndefined();

    expect(uploaded).toHaveLength(1);
    expect(uploaded[0]?.objectKey).toContain('/file-assets/');

    const events = audit.list().map((e) => e.actionCode);
    expect(events).toContain('file-asset.upload.started');
    expect(events).toContain('file-asset.upload.completed');
  });

  it('invalid MIME rejected', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FileAssetsModule],
    })
      .overrideProvider(STORAGE_SERVICE)
      .useValue({
        uploadObject: async () => {},
        getObjectMetadata: async () => null,
        getSignedDownloadUrl: async () => 'url',
        deleteObject: async () => {},
      } satisfies StorageService)
      .compile();

    const service = moduleRef.get(FileAssetsService);
    await expect(
      service.upload({
        organizationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        actor,
        file: makeFile({
          buffer: Buffer.from('x'),
          originalname: 'evil.exe',
          mimetype: 'application/x-msdownload',
        }),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('oversized file rejected', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FileAssetsModule],
    })
      .overrideProvider(STORAGE_SERVICE)
      .useValue({
        uploadObject: async () => {},
        getObjectMetadata: async () => null,
        getSignedDownloadUrl: async () => 'url',
        deleteObject: async () => {},
      } satisfies StorageService)
      .compile();

    const service = moduleRef.get(FileAssetsService);
    await expect(
      service.upload({
        organizationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        actor,
        file: makeFile({
          buffer: Buffer.alloc(10 * 1024 * 1024 + 1, 0),
          originalname: 'big.pdf',
          mimetype: 'application/pdf',
        }),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('upload failure marks failed and emits failure audit', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FileAssetsModule],
    })
      .overrideProvider(STORAGE_SERVICE)
      .useValue({
        uploadObject: async () => {
          throw new Error('nope');
        },
        getObjectMetadata: async () => null,
        getSignedDownloadUrl: async () => 'url',
        deleteObject: async () => {},
      } satisfies StorageService)
      .compile();

    const service = moduleRef.get(FileAssetsService);
    const audit = moduleRef.get(AuditService);
    const repo = moduleRef.get(FileAssetRepository);

    await expect(
      service.upload({
        organizationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        actor,
        file: makeFile({
          buffer: Buffer.from('hello'),
          originalname: 'contract.pdf',
          mimetype: 'application/pdf',
        }),
      }),
    ).rejects.toThrow(InternalServerErrorException);

    const failedEvent = audit.list().find((e) => e.actionCode === 'file-asset.upload.failed');
    expect(failedEvent?.resourceId).toBeDefined();

    const asset = repo.getById(failedEvent!.resourceId!);
    expect(asset.uploadStatus).toBe('failed');
  });

  it('download URL generated for completed asset', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FileAssetsModule],
    })
      .overrideProvider(STORAGE_SERVICE)
      .useValue({
        uploadObject: async () => {},
        getObjectMetadata: async () => null,
        getSignedDownloadUrl: async (objectKey: string) => `https://signed.example/${objectKey}`,
        deleteObject: async () => {},
      } satisfies StorageService)
      .compile();

    const service = moduleRef.get(FileAssetsService);
    const audit = moduleRef.get(AuditService);

    const uploaded = await service.upload({
      organizationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      actor,
      file: makeFile({
        buffer: Buffer.from('hello'),
        originalname: 'contract.pdf',
        mimetype: 'application/pdf',
      }),
    });

    const res = await service.createDownloadUrl({ fileAssetId: uploaded.id, actor });
    expect(res.url).toMatch(/^https:\/\/signed\.example\//);
    expect(audit.list().some((e) => e.actionCode === 'file-asset.download-url.created')).toBe(true);
  });
});

