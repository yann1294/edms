import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsEmpty, IsOptional, validate } from 'class-validator';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuditModule } from '../src/modules/audit/audit.module';
import { DocumentsService } from '../src/modules/documents/documents.service';
import { DocumentRepository } from '../src/modules/documents/store/document.repository';
import { InMemoryDocumentsStore } from '../src/modules/documents/store/in-memory-documents.store';
import { CurrentUser } from '../src/shared/current-user';

const actor: CurrentUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  email: 'u@example.com',
  firstName: 'U',
  lastName: 'S',
  status: 'active',
};

const orgId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

class UpdateDocumentDtoForTest {
  @IsOptional()
  @IsEmpty()
  status?: unknown;
}

describe('DocumentsService', () => {
  async function setup() {
    const moduleRef = await Test.createTestingModule({
      imports: [AuditModule],
      providers: [InMemoryDocumentsStore, DocumentRepository, DocumentsService],
    }).compile();

    return {
      audit: moduleRef.get(AuditService),
      service: moduleRef.get(DocumentsService),
    };
  }

  it('creates document with status draft and sets owner/createdBy', async () => {
    const { audit, service } = await setup();
    const doc = service.createDocument({
      organizationId: orgId,
      actor,
      title: 'My Doc',
      description: 'Desc',
      folderId: null,
      documentTypeId: null,
    });

    expect(doc.status).toBe('draft');
    expect(doc.organizationId).toBe(orgId);
    expect(doc.ownerUserId).toBe(actor.id);
    expect(doc.createdBy).toBe(actor.id);

    const created = audit.list().find((e) => e.actionCode === 'document.created');
    expect(created?.actorUserId).toBe(actor.id);
    expect(created?.resourceId).toBe(doc.id);
    expect((created?.metadata as any)?.title).toBe('My Doc');
  });

  it('updates allowed fields only and does not change status', async () => {
    const { audit, service } = await setup();
    const doc = service.createDocument({
      organizationId: orgId,
      actor,
      title: 'Before',
      description: null,
      folderId: null,
      documentTypeId: null,
    });

    const updated = service.updateDocument({
      id: doc.id,
      organizationId: orgId,
      actor,
      title: 'After',
      description: 'New desc',
      folderId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    });

    expect(updated.title).toBe('After');
    expect(updated.description).toBe('New desc');
    expect(updated.folderId).toBe('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
    expect(updated.status).toBe('draft');

    const event = audit.list().find((e) => e.actionCode === 'document.updated');
    expect(event?.resourceId).toBe(doc.id);
  });

  it('rejects empty title on create', async () => {
    const { service } = await setup();
    expect(() =>
      service.createDocument({
        organizationId: orgId,
        actor,
        title: '   ',
      }),
    ).toThrow(BadRequestException);
  });

  it('lists documents paginated', async () => {
    const { service } = await setup();
    service.createDocument({ organizationId: orgId, actor, title: 'Doc1' });
    service.createDocument({ organizationId: orgId, actor, title: 'Doc2' });
    service.createDocument({ organizationId: orgId, actor, title: 'Doc3' });

    const page1 = service.listDocuments({ organizationId: orgId, page: 1, pageSize: 2 });
    expect(page1.total).toBe(3);
    expect(page1.items).toHaveLength(2);
    expect(page1.hasNext).toBe(true);

    const page2 = service.listDocuments({ organizationId: orgId, page: 2, pageSize: 2 });
    expect(page2.items).toHaveLength(1);
    expect(page2.hasNext).toBe(false);
  });

  it('deletes document and emits audit event', async () => {
    const { audit, service } = await setup();
    const doc = service.createDocument({ organizationId: orgId, actor, title: 'To delete' });

    const res = service.deleteDocument({ id: doc.id, organizationId: orgId, actor });
    expect(res.id).toBe(doc.id);

    const deleted = audit.list().find((e) => e.actionCode === 'document.deleted');
    expect(deleted?.resourceId).toBe(doc.id);
  });

  it('rejects status change attempts (DTO validation)', async () => {
    const dto = new UpdateDocumentDtoForTest();
    dto.status = 'archived';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
