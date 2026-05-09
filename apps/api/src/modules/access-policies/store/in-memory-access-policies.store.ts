import { Injectable } from '@nestjs/common';
import { AccessPolicy } from '../access-policy.types';

@Injectable()
export class InMemoryAccessPoliciesStore {
  readonly policiesById = new Map<string, AccessPolicy>();

  readonly policyIdsByResource = new Map<string, Set<string>>();
  readonly policyIdsByPrincipal = new Map<string, Set<string>>();
  readonly policyIdsByPermissionCode = new Map<string, Set<string>>();
}

