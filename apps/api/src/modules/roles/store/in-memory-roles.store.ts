import { Injectable } from '@nestjs/common';
import { Permission, Role, UserRoleAssignment } from '../roles.types';

@Injectable()
export class InMemoryRolesStore {
  readonly permissionsById = new Map<string, Permission>();
  readonly permissionIdByCode = new Map<string, string>();

  readonly rolesById = new Map<string, Role>();
  readonly roleIdByOrgAndCode = new Map<string, string>();

  readonly rolePermissionKeys = new Set<string>();
  readonly permissionIdsByRoleId = new Map<string, Set<string>>();

  readonly userRoleKeys = new Set<string>();
  readonly userRolesByUserId = new Map<string, UserRoleAssignment[]>();
}

