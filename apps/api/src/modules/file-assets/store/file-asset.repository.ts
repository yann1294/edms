import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FileAsset, UploadStatus } from '../file-asset.types';
import { InMemoryFileAssetsStore } from './in-memory-file-assets.store';

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
export class FileAssetRepository {
  constructor(private readonly store: InMemoryFileAssetsStore) {}

  createPending(
    input: Omit<FileAsset, 'id' | 'createdAtUtc' | 'uploadStatus'> & { id?: string },
  ): FileAsset {
    if (this.store.assetIdByObjectKey.has(input.objectKey)) {
      throw new ConflictException('object_key must be unique.');
    }

    const asset: FileAsset = {
      id: input.id ?? randomUUID(),
      createdAtUtc: new Date().toISOString(),
      uploadStatus: 'pending',
      ...input,
    };

    this.store.assetsById.set(asset.id, asset);
    this.store.assetIdByObjectKey.set(asset.objectKey, asset.id);
    addIndex(this.store.assetIdsByChecksum, asset.checksumSha256, asset.id);
    if (asset.createdBy) addIndex(this.store.assetIdsByCreatedBy, asset.createdBy, asset.id);
    return asset;
  }

  updateStatus(id: string, status: UploadStatus): FileAsset {
    const existing = this.store.assetsById.get(id);
    if (!existing) throw new NotFoundException('FileAsset not found.');
    const updated: FileAsset = { ...existing, uploadStatus: status };
    this.store.assetsById.set(id, updated);
    return updated;
  }

  getById(id: string): FileAsset {
    const asset = this.store.assetsById.get(id);
    if (!asset) throw new NotFoundException('FileAsset not found.');
    return asset;
  }

  listByChecksum(checksumSha256: string): FileAsset[] {
    const ids = this.store.assetIdsByChecksum.get(checksumSha256) ?? new Set<string>();
    return [...ids].map((id) => this.getById(id));
  }

  delete(id: string): void {
    const existing = this.store.assetsById.get(id);
    if (!existing) return;
    this.store.assetsById.delete(id);
    this.store.assetIdByObjectKey.delete(existing.objectKey);
    removeIndex(this.store.assetIdsByChecksum, existing.checksumSha256, id);
    if (existing.createdBy) removeIndex(this.store.assetIdsByCreatedBy, existing.createdBy, id);
  }
}
