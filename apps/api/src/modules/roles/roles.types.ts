export type Permission = {
  id: string;
  code: string;
  description: string;
  createdAtUtc: string;
};

export type Role = {
  id: string;
  organizationId: string | null;
  name: string;
  code: string;
  description: string;
  createdAtUtc: string;
};

export type RoleWithPermissions = Role & {
  permissions: Permission[];
};

export type ScopeType = 'organization' | 'department' | 'folder';

export type UserRoleAssignment = {
  userId: string;
  roleId: string;
  scopeType: ScopeType | null;
  scopeId: string | null;
  assignedAtUtc: string;
};

