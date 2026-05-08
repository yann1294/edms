import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { Permission, Role, RoleWithPermissions } from './roles.types';
import { PermissionRepository } from './store/permission.repository';
import { RolePermissionRepository } from './store/role-permission.repository';
import { RoleRepository } from './store/role.repository';

@Injectable()
export class RoleService {
  constructor(
    private readonly auditService: AuditService,
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly rolePermissionRepository: RolePermissionRepository,
  ) {}

  createRole(input: { organizationId: string | null; name: string; code: string; description: string }): Role {
    const role = this.roleRepository.create(input);

    this.auditService.record({
      actionCode: 'role.created',
      resourceType: 'role',
      resourceId: role.id,
      metadata: {
        organizationId: role.organizationId,
        code: role.code,
        name: role.name,
      },
    });

    return role;
  }

  listRoles(): Role[] {
    return this.roleRepository.list();
  }

  assignPermissionsToRole(
    roleId: string,
    permissionCodes: string[],
  ): { roleId: string; permissions: Permission[] } {
    const role = this.roleRepository.getById(roleId);
    const uniqueCodes = [...new Set(permissionCodes.map((c) => c.trim()).filter(Boolean))];

    const permissions = this.permissionRepository.findByCodes(uniqueCodes);
    const foundCodes = new Set(permissions.map((p) => p.code));
    const missing = uniqueCodes.filter((code) => !foundCodes.has(code));
    if (missing.length > 0) {
      throw new BadRequestException(`Unknown permission codes: ${missing.join(', ')}`);
    }

    for (const permission of permissions) {
      this.rolePermissionRepository.add(role.id, permission.id);
    }

    this.auditService.record({
      actionCode: 'role.permissions.assigned',
      resourceType: 'role',
      resourceId: role.id,
      metadata: { permissionCodes: permissions.map((p) => p.code) },
    });

    return { roleId: role.id, permissions };
  }

  /**
   * Idempotent variant intended for seed/bootstrap flows.
   * Ensures the mapping exists; does not fail if already assigned.
   */
  ensurePermissionsOnRole(roleId: string, permissionCodes: string[]): { roleId: string; permissions: Permission[] } {
    const role = this.roleRepository.getById(roleId);
    const uniqueCodes = [...new Set(permissionCodes.map((c) => c.trim()).filter(Boolean))];

    const permissions = this.permissionRepository.findByCodes(uniqueCodes);
    const foundCodes = new Set(permissions.map((p) => p.code));
    const missing = uniqueCodes.filter((code) => !foundCodes.has(code));
    if (missing.length > 0) {
      throw new BadRequestException(`Unknown permission codes: ${missing.join(', ')}`);
    }

    for (const permission of permissions) {
      try {
        this.rolePermissionRepository.add(role.id, permission.id);
      } catch (err) {
        if (err instanceof ConflictException) continue;
        throw err;
      }
    }

    this.auditService.record({
      actionCode: 'role.permissions.assigned',
      resourceType: 'role',
      resourceId: role.id,
      metadata: { permissionCodes: permissions.map((p) => p.code) },
    });

    return { roleId: role.id, permissions };
  }

  getRoleWithPermissions(roleId: string): RoleWithPermissions {
    const role = this.roleRepository.getById(roleId);
    const permissionIds = this.rolePermissionRepository.listPermissionIdsForRole(roleId);
    const permissions = permissionIds
      .map((permissionId) => this.permissionRepository.findById(permissionId))
      .filter((permission): permission is Permission => Boolean(permission))
      .sort((a, b) => a.code.localeCompare(b.code));

    return { ...role, permissions };
  }
}
