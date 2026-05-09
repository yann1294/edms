import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Document } from '../document.types';
import { InMemoryDocumentsStore } from './in-memory-documents.store';

function addIndex(map: Map<string, Set<string>>, key: string, id: string) {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

function removeIndex(map: Map<string, Set<string>>, key: string, id: string) {
  const set = map.get(key);
  if (!set) return;
  set.delete(id);
  if (set.size === 0) map.delete(key);
}

@Injectable()
export class DocumentRepository {
  constructor(private readonly store: InMemoryDocumentsStore) {}

  create(input: Omit<Document, 'id' | 'createdAtUtc' | 'updatedAtUtc'>): Document {
    const now = new Date().toISOString();
    const doc: Document = {
      id: randomUUID(),
      createdAtUtc: now,
      updatedAtUtc: now,
      ...input,
    };

    this.store.documentsById.set(doc.id, doc);
    addIndex(this.store.documentIdsByOrg, doc.organizationId, doc.id);
    return doc;
  }

  getById(id: string): Document {
    const doc = this.store.documentsById.get(id);
    if (!doc) throw new NotFoundException('Document not found.');
    return doc;
  }

  listByOrg(organizationId: string): Document[] {
    const ids = this.store.documentIdsByOrg.get(organizationId) ?? new Set<string>();
    const docs = [...ids].map((id) => this.getById(id));
    return docs.sort((a, b) => (a.createdAtUtc < b.createdAtUtc ? 1 : -1));
  }

  update(
    id: string,
    patch: Partial<Pick<Document, 'title' | 'description' | 'folderId'>>,
  ): Document {
    const existing = this.getById(id);
    const updated: Document = {
      ...existing,
      ...patch,
      updatedAtUtc: new Date().toISOString(),
    };
    this.store.documentsById.set(id, updated);
    return updated;
  }

  setCurrentVersionId(id: string, currentVersionId: string): Document {
    const existing = this.getById(id);
    const updated: Document = {
      ...existing,
      currentVersionId,
      updatedAtUtc: new Date().toISOString(),
    };
    this.store.documentsById.set(id, updated);
    return updated;
  }

  delete(id: string): void {
    const existing = this.store.documentsById.get(id);
    if (!existing) return;
    this.store.documentsById.delete(id);
    removeIndex(this.store.documentIdsByOrg, existing.organizationId, id);
  }
}
