import { BadRequestException, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { AuditService } from '../audit/audit.service';
import { PermissionCatalogService } from '../roles/permission-catalog.service';
import { AccessPolicy, AccessPolicyEffect } from './access-policy.types';
import { AccessPolicyRepository } from './store/access-policy.repository';

function isEffect(value: string): value is AccessPolicyEffect {
  return value === 'allow' || value === 'deny';
}

function isPrincipalType(value: string): boolean {
  return value === 'user' || value === 'role' || value === 'department';
}

@Injectable()
export class AccessPolicyService {
  constructor(
    private readonly auditService: AuditService,
    private readonly permissionCatalog: PermissionCatalogService,
    private readonly repository: AccessPolicyRepository,
  ) {}

  createPolicy(input: {
    resourceType: string;
    resourceId: string;
    principalType: string;
    principalId: string;
    permissionCode: string;
    effect: string;
  }): AccessPolicy {
    const resourceType = input.resourceType.trim();
    const permissionCode = input.permissionCode.trim();
    const principalType = input.principalType.trim();
    const effect = input.effect.trim();

    if (!resourceType) throw new BadRequestException('resourceType is required.');
    if (!input.resourceId || !isUUID(input.resourceId)) throw new BadRequestException('resourceId must be a uuid.');
    if (!isPrincipalType(principalType)) throw new BadRequestException('principalType is invalid.');
    if (!input.principalId || !isUUID(input.principalId))
      throw new BadRequestException('principalId must be a uuid.');
    if (!permissionCode) throw new BadRequestException('permissionCode is required.');
    if (!this.permissionCatalog.exists(permissionCode))
      throw new BadRequestException('permissionCode does not exist in catalog.');
    if (!isEffect(effect)) throw new BadRequestException('effect must be allow or deny.');

    const policy = this.repository.create({
      resourceType,
      resourceId: input.resourceId,
      principalType,
      principalId: input.principalId,
      permissionCode,
      effect,
    });

    this.auditService.record({
      actionCode: 'access-policy.created',
      resourceType: 'access-policy',
      resourceId: policy.id,
      metadata: {
        resourceType: policy.resourceType,
        resourceId: policy.resourceId,
        principalType: policy.principalType,
        principalId: policy.principalId,
        permissionCode: policy.permissionCode,
        effect: policy.effect,
      },
    });

    return policy;
  }

  deletePolicy(id: string): { id: string } {
    const deleted = this.repository.deleteById(id);
    this.auditService.record({
      actionCode: 'access-policy.deleted',
      resourceType: 'access-policy',
      resourceId: deleted.id,
      metadata: {
        resourceType: deleted.resourceType,
        resourceId: deleted.resourceId,
        principalType: deleted.principalType,
        principalId: deleted.principalId,
        permissionCode: deleted.permissionCode,
        effect: deleted.effect,
      },
    });
    return { id: deleted.id };
  }

  listPoliciesByResource(resourceType: string, resourceId: string): AccessPolicy[] {
    return this.repository.listByResource(resourceType, resourceId);
  }

  listPoliciesForPrincipal(principalType: string, principalId: string): AccessPolicy[] {
    return this.repository.listForPrincipal(principalType, principalId);
  }
}

