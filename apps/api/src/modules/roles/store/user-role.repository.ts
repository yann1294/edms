import { ConflictException, Injectable } from '@nestjs/common';
import { InMemoryRolesStore } from './in-memory-roles.store';
import { ScopeType, UserRoleAssignment } from '../roles.types';

function normalizeNullable(value: string | null): string {
  return value ?? 'null';
}

function assignmentKey(input: {
  userId: string;
  roleId: string;
  scopeType: ScopeType | null;
  scopeId: string | null;
}): string {
  return `${input.userId}::${input.roleId}::${normalizeNullable(input.scopeType)}::${normalizeNullable(
    input.scopeId,
  )}`;
}

@Injectable()
export class UserRoleRepository {
  constructor(private readonly store: InMemoryRolesStore) {}

  add(input: {
    userId: string;
    roleId: string;
    scopeType: ScopeType | null;
    scopeId: string | null;
  }): UserRoleAssignment {
    const compositeKey = assignmentKey(input);
    if (this.store.userRoleKeys.has(compositeKey)) {
      throw new ConflictException('Role assignment already exists.');
    }

    const assignment: UserRoleAssignment = {
      ...input,
      assignedAtUtc: new Date().toISOString(),
    };

    this.store.userRoleKeys.add(compositeKey);
    const list = this.store.userRolesByUserId.get(input.userId) ?? [];
    list.push(assignment);
    this.store.userRolesByUserId.set(input.userId, list);
    return assignment;
  }

  listForUser(userId: string): UserRoleAssignment[] {
    return [...(this.store.userRolesByUserId.get(userId) ?? [])];
  }
}

