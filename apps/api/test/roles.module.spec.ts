import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuditService } from '../src/modules/audit/audit.service';
import { PermissionCatalogService } from '../src/modules/roles/permission-catalog.service';
import { RoleService } from '../src/modules/roles/role.service';
import { RolesModule } from '../src/modules/roles/roles.module';
import { RolesSeedService } from '../src/modules/roles/roles-seed.service';
import { UserRoleService } from '../src/modules/roles/user-role.service';

describe('RolesModule (foundation)', () => {
  it('seeds permission catalog from docs (idempotent)', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RolesModule],
    }).compile();

    const seed = moduleRef.get(RolesSeedService);
    const catalog = moduleRef.get(PermissionCatalogService);

    const first = seed.seed();
    const second = seed.seed();

    expect(first.permissionsSeeded.length).toBeGreaterThan(0);
    expect(second.permissionsSeeded).toEqual(first.permissionsSeeded);

    const permissions = catalog.list();
    expect(permissions.map((p) => p.code)).toEqual(first.permissionsSeeded);
  });

  it('creates a role, assigns permissions, and loads role with permissions', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RolesModule],
    }).compile();

    const seed = moduleRef.get(RolesSeedService);
    seed.seed();

    const audit = moduleRef.get(AuditService);
    const roleService = moduleRef.get(RoleService);

    const role = roleService.createRole({
      organizationId: null,
      name: 'Manager',
      code: 'MANAGER',
      description: 'Manager role',
    });

    expect(audit.list().some((e) => e.actionCode === 'role.created' && e.resourceId === role.id)).toBe(
      true,
    );

    const assignment = roleService.assignPermissionsToRole(role.id, ['document.view', 'document.download']);
    expect(assignment.permissions.map((p) => p.code).sort()).toEqual(['document.download', 'document.view']);

    expect(
      audit.list().some((e) => e.actionCode === 'role.permissions.assigned' && e.resourceId === role.id),
    ).toBe(true);

    const loaded = roleService.getRoleWithPermissions(role.id);
    expect(loaded.code).toBe('MANAGER');
    expect(loaded.permissions.map((p) => p.code).sort()).toEqual(['document.download', 'document.view']);
  });

  it('assigns role to user and prevents duplicate assignments', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RolesModule],
    }).compile();

    const seed = moduleRef.get(RolesSeedService);
    seed.seed();

    const audit = moduleRef.get(AuditService);
    const roleService = moduleRef.get(RoleService);
    const userRoleService = moduleRef.get(UserRoleService);

    const role = roleService.createRole({
      organizationId: null,
      name: 'Viewer',
      code: 'VIEWER',
      description: 'Viewer role',
    });

    const first = userRoleService.assignRoleToUser({
      userId: 'user-1',
      roleId: role.id,
      scopeType: null,
      scopeId: null,
    });
    expect(first.userId).toBe('user-1');
    expect(first.roleId).toBe(role.id);

    expect(
      audit.list().some((e) => e.actionCode === 'user.role.assigned' && e.resourceId === 'user-1'),
    ).toBe(true);

    expect(() =>
      userRoleService.assignRoleToUser({
        userId: 'user-1',
        roleId: role.id,
        scopeType: null,
        scopeId: null,
      }),
    ).toThrow(ConflictException);
  });
});

