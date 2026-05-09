import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { FileAssetRepository } from '../file-assets/store/file-asset.repository';
import { FileAsset } from '../file-assets/file-asset.types';

@Injectable()
export class FileAssetsLookupService {
  constructor(private readonly moduleRef: ModuleRef) {}

  getRepository(): FileAssetRepository {
    // FileAssetsModule does not export its repository; resolve from the container.
    const repo = this.moduleRef.get(FileAssetRepository, { strict: false });
    if (!repo) throw new ServiceUnavailableException('File assets repository not available.');
    return repo;
  }

  getById(id: string): FileAsset {
    return this.getRepository().getById(id);
  }
}

