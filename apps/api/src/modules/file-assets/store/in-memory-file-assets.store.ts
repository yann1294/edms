import { Injectable } from '@nestjs/common';
import { FileAsset } from '../file-asset.types';

@Injectable()
export class InMemoryFileAssetsStore {
  readonly assetsById = new Map<string, FileAsset>();
  readonly assetIdByObjectKey = new Map<string, string>();
  readonly assetIdsByChecksum = new Map<string, Set<string>>();
  readonly assetIdsByCreatedBy = new Map<string, Set<string>>();
}

