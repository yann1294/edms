import { Injectable } from '@nestjs/common';
import { AccessPolicyRepository } from './store/access-policy.repository';
import { AccessPolicy } from './access-policy.types';

@Injectable()
export class AccessEvaluatorService {
  constructor(private readonly repository: AccessPolicyRepository) {}

  evaluateAccess(input: {
    userId: string;
    roles: string[];
    departmentId: string | null;
    resourceType: string;
    resourceId: string;
    permissionCode: string;
  }): boolean {
    const applicablePolicies: AccessPolicy[] = [];

    // Step 1 — collect applicable policies
    applicablePolicies.push(...this.repository.listForPrincipal('user', input.userId));
    for (const roleId of input.roles) {
      applicablePolicies.push(...this.repository.listForPrincipal('role', roleId));
    }
    if (input.departmentId) {
      applicablePolicies.push(...this.repository.listForPrincipal('department', input.departmentId));
    }

    // Step 2 — filter by matching resource + permission
    const matching = applicablePolicies.filter(
      (p) =>
        p.resourceType === input.resourceType &&
        p.resourceId === input.resourceId &&
        p.permissionCode === input.permissionCode,
    );

    // Step 3 — precedence: deny > allow > default deny
    if (matching.some((p) => p.effect === 'deny')) return false;
    if (matching.some((p) => p.effect === 'allow')) return true;
    return false;
  }
}

