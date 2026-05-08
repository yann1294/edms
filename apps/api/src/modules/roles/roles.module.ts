import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PermissionsController } from './permissions.controller';
import { RoleController } from './role.controller';
import { UserRoleController } from './user-role.controller';
import { PermissionCatalogService } from './permission-catalog.service';
import { RolesSeedService } from './roles-seed.service';
import { RoleService } from './role.service';
import { UserRoleService } from './user-role.service';
import { InMemoryRolesStore } from './store/in-memory-roles.store';
import { PermissionRepository } from './store/permission.repository';
import { RolePermissionRepository } from './store/role-permission.repository';
import { RoleRepository } from './store/role.repository';
import { UserRoleRepository } from './store/user-role.repository';

@Module({
  imports: [AuditModule],
  controllers: [PermissionsController, RoleController, UserRoleController],
  providers: [
    InMemoryRolesStore,
    PermissionRepository,
    RoleRepository,
    RolePermissionRepository,
    UserRoleRepository,
    PermissionCatalogService,
    RoleService,
    UserRoleService,
    RolesSeedService,
  ],
  exports: [PermissionCatalogService, RoleService, UserRoleService, RolesSeedService],
})
export class RolesModule {}
