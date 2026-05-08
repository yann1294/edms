import { ConflictException, Injectable } from '@nestjs/common';
import { InMemoryRolesStore } from './in-memory-roles.store';

function key(roleId: string, permissionId: string): string {
  return `${roleId}::${permissionId}`;
}

@Injectable()
export class RolePermissionRepository {
  constructor(private readonly store: InMemoryRolesStore) {}

  listPermissionIdsForRole(roleId: string): string[] {
    return [...(this.store.permissionIdsByRoleId.get(roleId) ?? new Set<string>())];
  }

  add(roleId: string, permissionId: string): void {
    const compositeKey = key(roleId, permissionId);
    if (this.store.rolePermissionKeys.has(compositeKey)) {
      throw new ConflictException('Permission already assigned to role.');
    }

    this.store.rolePermissionKeys.add(compositeKey);
    const set = this.store.permissionIdsByRoleId.get(roleId) ?? new Set<string>();
    set.add(permissionId);
    this.store.permissionIdsByRoleId.set(roleId, set);
  }
}

