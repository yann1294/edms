import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InMemoryRolesStore } from './in-memory-roles.store';
import { Role } from '../roles.types';

function orgKey(organizationId: string | null): string {
  return organizationId ?? 'null';
}

@Injectable()
export class RoleRepository {
  constructor(private readonly store: InMemoryRolesStore) {}

  list(): Role[] {
    return [...this.store.rolesById.values()].sort((a, b) => a.code.localeCompare(b.code));
  }

  findById(id: string): Role | null {
    return this.store.rolesById.get(id) ?? null;
  }

  findByOrgAndCode(organizationId: string | null, code: string): Role | null {
    const uniqueKey = `${orgKey(organizationId)}::${code.trim()}`;
    const id = this.store.roleIdByOrgAndCode.get(uniqueKey);
    if (!id) return null;
    return this.findById(id);
  }

  getById(id: string): Role {
    const role = this.findById(id);
    if (!role) throw new NotFoundException('Role not found.');
    return role;
  }

  create(input: {
    organizationId: string | null;
    name: string;
    code: string;
    description: string;
  }): Role {
    const normalizedCode = input.code.trim();
    if (!normalizedCode) throw new BadRequestException('Role code is required.');

    const uniqueKey = `${orgKey(input.organizationId)}::${normalizedCode}`;
    if (this.store.roleIdByOrgAndCode.has(uniqueKey)) {
      throw new ConflictException('Role code already exists for this organization.');
    }

    const role: Role = {
      id: randomUUID(),
      organizationId: input.organizationId,
      name: input.name,
      code: normalizedCode,
      description: input.description,
      createdAtUtc: new Date().toISOString(),
    };

    this.store.rolesById.set(role.id, role);
    this.store.roleIdByOrgAndCode.set(uniqueKey, role.id);
    return role;
  }
}
