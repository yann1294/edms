import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DocumentVersion } from '../document-version.types';
import { InMemoryDocumentVersionsStore } from './in-memory-document-versions.store';

function docNumberKey(documentId: string, versionNumber: number): string {
  return `${documentId}::${versionNumber}`;
}

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
export class DocumentVersionRepository {
  constructor(private readonly store: InMemoryDocumentVersionsStore) {}

  getLatestVersionNumber(documentId: string): number | null {
    const numbers = this.store.versionIdsByDocumentId.get(documentId);
    if (!numbers || numbers.length === 0) return null;
    return numbers[numbers.length - 1] ?? null;
  }

  create(input: Omit<DocumentVersion, 'id' | 'createdAtUtc'>): DocumentVersion {
    const uniqueKey = docNumberKey(input.documentId, input.versionNumber);
    if (this.store.versionIdByDocAndNumber.has(uniqueKey)) {
      throw new ConflictException('version_number must be unique per document.');
    }

    const version: DocumentVersion = {
      id: randomUUID(),
      createdAtUtc: new Date().toISOString(),
      ...input,
    };

    this.store.versionsById.set(version.id, version);
    this.store.versionIdByDocAndNumber.set(uniqueKey, version.id);

    const numbers = this.store.versionIdsByDocumentId.get(version.documentId) ?? [];
    numbers.push(version.versionNumber);
    numbers.sort((a, b) => a - b);
    this.store.versionIdsByDocumentId.set(version.documentId, numbers);

    addIndex(this.store.versionIdsByFileAssetId, version.fileAssetId, version.id);
    return version;
  }

  deleteById(id: string): void {
    const existing = this.store.versionsById.get(id);
    if (!existing) return;
    this.store.versionsById.delete(id);
    this.store.versionIdByDocAndNumber.delete(docNumberKey(existing.documentId, existing.versionNumber));
    const numbers = this.store.versionIdsByDocumentId.get(existing.documentId) ?? [];
    this.store.versionIdsByDocumentId.set(
      existing.documentId,
      numbers.filter((n) => n !== existing.versionNumber),
    );
    removeIndex(this.store.versionIdsByFileAssetId, existing.fileAssetId, id);
  }

  getById(id: string): DocumentVersion {
    const v = this.store.versionsById.get(id);
    if (!v) throw new NotFoundException('DocumentVersion not found.');
    return v;
  }

  listByDocumentId(documentId: string): DocumentVersion[] {
    const numbers = this.store.versionIdsByDocumentId.get(documentId) ?? [];
    return numbers
      .map((n) => this.store.versionIdByDocAndNumber.get(docNumberKey(documentId, n)))
      .filter((id): id is string => Boolean(id))
      .map((id) => this.getById(id))
      .sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc));
  }
}

