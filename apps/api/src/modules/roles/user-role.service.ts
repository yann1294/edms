import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ScopeType, UserRoleAssignment } from './roles.types';
import { RoleRepository } from './store/role.repository';
import { UserRoleRepository } from './store/user-role.repository';

@Injectable()
export class UserRoleService {
  constructor(
    private readonly auditService: AuditService,
    private readonly roleRepository: RoleRepository,
    private readonly userRoleRepository: UserRoleRepository,
  ) {}

  assignRoleToUser(input: {
    userId: string;
    roleId: string;
    scopeType: ScopeType | null;
    scopeId: string | null;
  }): UserRoleAssignment {
    this.roleRepository.getById(input.roleId);
    const assignment = this.userRoleRepository.add(input);

    this.auditService.record({
      actionCode: 'user.role.assigned',
      resourceType: 'user',
      resourceId: assignment.userId,
      metadata: {
        roleId: assignment.roleId,
        scopeType: assignment.scopeType,
        scopeId: assignment.scopeId,
      },
    });

    return assignment;
  }

  listUserRoles(userId: string): UserRoleAssignment[] {
    return this.userRoleRepository.listForUser(userId);
  }
}

