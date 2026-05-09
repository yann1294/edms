import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ContextIdFactory } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuditModule } from '../src/modules/audit/audit.module';
import { DocumentsService } from '../src/modules/documents/documents.service';
import { DocumentsModule } from '../src/modules/documents/documents.module';
import { DocumentVersionsModule } from '../src/modules/document-versions/document-versions.module';
import { DocumentVersionsController } from '../src/modules/document-versions/document-versions.controller';
import { DocumentVersionsService } from '../src/modules/document-versions/document-versions.service';
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

const orgId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function makeFile(): Express.Multer.File {
  const buffer = Buffer.from('hello');
  return { buffer, originalname: 'contract.pdf', mimetype: 'application/pdf', size: buffer.length } as any;
}

describe('DocumentVersionsService', () => {
  async function setup() {
    process.env.STORAGE_PROVIDER = 'minio';
    process.env.STORAGE_BUCKET = 'bucket';

    const moduleRef = await Test.createTestingModule({
      imports: [AuditModule, DocumentsModule, FileAssetsModule, DocumentVersionsModule],
    })
      .overrideProvider(STORAGE_SERVICE)
      .useValue({
        uploadObject: async () => {},
        getObjectMetadata: async () => null,
        getSignedDownloadUrl: async () => 'url',
        deleteObject: async () => {},
      } satisfies StorageService)
      .compile();

    const docs = moduleRef.get(DocumentsService);
    const files = moduleRef.get(FileAssetsService);
    const audit = moduleRef.get(AuditService);
    const fileRepo = moduleRef.get(FileAssetRepository);

    const document = docs.createDocument({ organizationId: orgId, actor, title: 'Doc' });
    const fileAsset = await files.upload({ organizationId: orgId, actor, file: makeFile() });

    const contextId = ContextIdFactory.create();
    moduleRef.registerRequestByContextId({ context: { user: actor } }, contextId);
    const versions = await moduleRef.resolve(DocumentVersionsService, contextId);

    return { moduleRef, docs, versions, audit, document, fileAsset, fileRepo };
  }

  it('first version creates version_number = 1 and updates current_version_id', async () => {
    const { versions, docs, document, fileAsset, audit } = await setup();
    const created = await versions.createVersion({ documentId: document.id, fileAssetId: fileAsset.id });
    expect(created.versionNumber).toBe(1);

    const updatedDoc = docs.getDocumentById({ id: document.id, organizationId: orgId });
    expect(updatedDoc.currentVersionId).toBe(created.id);

    const event = audit.list().find((e) => e.actionCode === 'document.version.created');
    expect((event?.metadata as any)?.versionNumber).toBe(1);
    expect((event?.metadata as any)?.fileAssetId).toBe(fileAsset.id);
  });

  it('multiple versions increment sequentially and current_version_id points to latest', async () => {
    const { versions, docs, document, fileAsset } = await setup();
    const v1 = await versions.createVersion({ documentId: document.id, fileAssetId: fileAsset.id });
    const v2 = await versions.createVersion({ documentId: document.id, fileAssetId: fileAsset.id });
    expect(v1.versionNumber).toBe(1);
    expect(v2.versionNumber).toBe(2);

    const updatedDoc = docs.getDocumentById({ id: document.id, organizationId: orgId });
    expect(updatedDoc.currentVersionId).toBe(v2.id);
  });

  it('rejects if file asset upload_status != completed', async () => {
    const { versions, document, fileRepo } = await setup();
    const pending = fileRepo.createPending({
      storageProvider: 'minio',
      bucketName: 'bucket',
      objectKey: 'k',
      originalFilename: 'x.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1,
      checksumSha256: '0'.repeat(64),
      encryptionStatus: null,
      previewObjectKey: null,
      thumbnailObjectKey: null,
      createdBy: actor.id,
    });

    await expect(
      versions.createVersion({ documentId: document.id, fileAssetId: pending.id }),
    ).rejects.toThrow(BadRequestException);
  });

  it('atomicity: if document update fails, current_version_id is not updated', async () => {
    process.env.STORAGE_PROVIDER = 'minio';
    process.env.STORAGE_BUCKET = 'bucket';

    const moduleRef = await Test.createTestingModule({
      imports: [AuditModule, DocumentsModule, FileAssetsModule, DocumentVersionsModule],
    })
      .overrideProvider(STORAGE_SERVICE)
      .useValue({
        uploadObject: async () => {},
        getObjectMetadata: async () => null,
        getSignedDownloadUrl: async () => 'url',
        deleteObject: async () => {},
      } satisfies StorageService)
      .compile();

    // Instead of trying to override the repository token (class-based), override the lookup service to throw on set.
    // (This keeps the test focused on atomic rollback behavior.)
    const docs = moduleRef.get(DocumentsService);
    const files = moduleRef.get(FileAssetsService);

    const document = docs.createDocument({ organizationId: orgId, actor, title: 'Doc' });
    const fileAsset = await files.upload({ organizationId: orgId, actor, file: makeFile() });

    const contextId = ContextIdFactory.create();
    moduleRef.registerRequestByContextId({ context: { user: actor } }, contextId);
    const versions = await moduleRef.resolve(DocumentVersionsService, contextId);

    // Monkey patch documents lookup to fail after version creation.
    const lookup: any = (versions as any).documentsLookup;
    const original = lookup.setCurrentVersionId.bind(lookup);
    lookup.setCurrentVersionId = () => {
      throw new Error('boom');
    };

    await expect(
      versions.createVersion({ documentId: document.id, fileAssetId: fileAsset.id }),
    ).rejects.toThrow(InternalServerErrorException);

    lookup.setCurrentVersionId = original;

    const updatedDoc = docs.getDocumentById({ id: document.id, organizationId: orgId });
    expect(updatedDoc.currentVersionId).toBeNull();
  });

  it('immutability: no update API for versions exists', async () => {
    const controller = new DocumentVersionsController({} as any);
    expect(typeof (controller as any).create).toBe('function');
    expect((controller as any).update).toBeUndefined();
    expect((controller as any).delete).toBeUndefined();
  });
});
