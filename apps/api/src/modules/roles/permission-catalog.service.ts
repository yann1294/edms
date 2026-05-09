import { Injectable } from '@nestjs/common';
import { PermissionRepository } from './store/permission.repository';
import { Permission } from './roles.types';

function defaultDescriptionForCode(code: string): string {
  return `Permission: ${code}`;
}

@Injectable()
export class PermissionCatalogService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  list(): Permission[] {
    return this.permissionRepository.list();
  }

  exists(code: string): boolean {
    return Boolean(this.permissionRepository.findByCode(code.trim()));
  }

  /**
   * Seeds or updates the permission catalog, using the "DB" (repository) as source of truth.
   * This method is idempotent.
   */
  seedByCodes(codes: string[]): Permission[] {
    const uniqueCodes = [...new Set(codes.map((c) => c.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );
    return uniqueCodes.map((code) =>
      this.permissionRepository.upsertByCode({
        code,
        description: defaultDescriptionForCode(code),
      }),
    );
  }
}
