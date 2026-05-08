import { Body, Controller, Param, Post } from '@nestjs/common';
import { IsIn, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { ScopeType } from './roles.types';
import { UserRoleService } from './user-role.service';

class AssignUserRoleDto {
  @IsUUID()
  roleId!: string;

  @IsOptional()
  @IsIn(['organization', 'department', 'folder'])
  scopeType?: ScopeType;

  @ValidateIf((o) => o.scopeType !== undefined && o.scopeType !== null)
  @IsUUID()
  scopeId?: string;
}

@Controller('users/:userId/roles')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Post()
  assignRole(@Param('userId') userId: string, @Body() body: AssignUserRoleDto) {
    return this.userRoleService.assignRoleToUser({
      userId,
      roleId: body.roleId,
      scopeType: body.scopeType ?? null,
      scopeId: body.scopeId ?? null,
    });
  }
}

