import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsArray, IsOptional, IsString, IsUUID, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { RoleService } from './role.service';

class CreateRoleDto {
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsString()
  description!: string;
}

class AssignPermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  permissionCodes!: string[];
}

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  list() {
    return this.roleService.listRoles();
  }

  @Post()
  create(@Body() body: CreateRoleDto) {
    return this.roleService.createRole({
      organizationId: body.organizationId ?? null,
      name: body.name,
      code: body.code,
      description: body.description,
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.roleService.getRoleWithPermissions(id);
  }

  @Post(':id/permissions')
  assignPermissions(@Param('id') id: string, @Body() body: AssignPermissionsDto) {
    return this.roleService.assignPermissionsToRole(id, body.permissionCodes);
  }
}

