import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { IsIn, IsString, IsUUID } from 'class-validator';
import { AccessPolicyService } from './access-policy.service';

class CreateAccessPolicyDto {
  @IsString()
  resourceType!: string;

  @IsUUID()
  resourceId!: string;

  @IsIn(['user', 'role', 'department'])
  principalType!: string;

  @IsUUID()
  principalId!: string;

  @IsString()
  permissionCode!: string;

  @IsIn(['allow', 'deny'])
  effect!: string;
}

class ListByResourceQueryDto {
  @IsString()
  resourceType!: string;

  @IsUUID()
  resourceId!: string;
}

@Controller('access-policies')
export class AccessPolicyController {
  constructor(private readonly service: AccessPolicyService) {}

  @Post()
  create(@Body() body: CreateAccessPolicyDto) {
    return this.service.createPolicy(body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deletePolicy(id);
  }

  @Get()
  listByResource(@Query() query: ListByResourceQueryDto) {
    return this.service.listPoliciesByResource(query.resourceType, query.resourceId);
  }
}

