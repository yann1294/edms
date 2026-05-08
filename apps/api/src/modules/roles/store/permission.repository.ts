import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InMemoryRolesStore } from './in-memory-roles.store';
import { Permission } from '../roles.types';

@Injectable()
export class PermissionRepository {
  constructor(private readonly store: InMemoryRolesStore) {}

  list(): Permission[] {
    return [...this.store.permissionsById.values()].sort((a, b) => a.code.localeCompare(b.code));
  }

  findById(id: string): Permission | null {
    return this.store.permissionsById.get(id) ?? null;
  }

  findByCode(code: string): Permission | null {
    const id = this.store.permissionIdByCode.get(code);
    if (!id) return null;
    return this.store.permissionsById.get(id) ?? null;
  }

  findByCodes(codes: string[]): Permission[] {
    return codes
      .map((code) => this.findByCode(code))
      .filter((permission): permission is Permission => Boolean(permission));
  }

  /**
   * Idempotent upsert by permission code.
   */
  upsertByCode(input: { code: string; description: string }): Permission {
    const existing = this.findByCode(input.code);
    if (existing) {
      const updated: Permission = { ...existing, description: input.description };
      this.store.permissionsById.set(existing.id, updated);
      return updated;
    }

    const id = randomUUID();
    if (this.store.permissionIdByCode.has(input.code)) {
      // Should never happen because we check existing above, but keep unique enforcement explicit.
      throw new ConflictException(`Permission code already exists: ${input.code}`);
    }

    const permission: Permission = {
      id,
      code: input.code,
      description: input.description,
      createdAtUtc: new Date().toISOString(),
    };

    this.store.permissionsById.set(id, permission);
    this.store.permissionIdByCode.set(permission.code, id);
    return permission;
  }
}
