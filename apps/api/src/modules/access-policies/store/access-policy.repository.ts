import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AccessPolicy } from '../access-policy.types';
import { InMemoryAccessPoliciesStore } from './in-memory-access-policies.store';

function resourceKey(resourceType: string, resourceId: string): string {
  return `${resourceType}::${resourceId}`;
}

function principalKey(principalType: string, principalId: string): string {
  return `${principalType}::${principalId}`;
}

function addIndex(map: Map<string, Set<string>>, key: string, id: string) {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

function removeIndex(map: Map<string, Set<string>>, key: string, id: string) {
  const set = map.get(key);
  if (!set) return;
  set.delete(id);
  if (set.size === 0) map.delete(key);
}

@Injectable()
export class AccessPolicyRepository {
  constructor(private readonly store: InMemoryAccessPoliciesStore) {}

  create(input: Omit<AccessPolicy, 'id' | 'createdAtUtc'>): AccessPolicy {
    const policy: AccessPolicy = {
      id: randomUUID(),
      createdAtUtc: new Date().toISOString(),
      ...input,
    };

    this.store.policiesById.set(policy.id, policy);
    addIndex(this.store.policyIdsByResource, resourceKey(policy.resourceType, policy.resourceId), policy.id);
    addIndex(this.store.policyIdsByPrincipal, principalKey(policy.principalType, policy.principalId), policy.id);
    addIndex(this.store.policyIdsByPermissionCode, policy.permissionCode, policy.id);
    return policy;
  }

  deleteById(id: string): AccessPolicy {
    const existing = this.store.policiesById.get(id);
    if (!existing) throw new NotFoundException('Access policy not found.');

    this.store.policiesById.delete(id);
    removeIndex(this.store.policyIdsByResource, resourceKey(existing.resourceType, existing.resourceId), id);
    removeIndex(this.store.policyIdsByPrincipal, principalKey(existing.principalType, existing.principalId), id);
    removeIndex(this.store.policyIdsByPermissionCode, existing.permissionCode, id);
    return existing;
  }

  listByResource(resourceType: string, resourceId: string): AccessPolicy[] {
    const ids = this.store.policyIdsByResource.get(resourceKey(resourceType, resourceId)) ?? new Set<string>();
    return [...ids]
      .map((id) => this.store.policiesById.get(id))
      .filter((p): p is AccessPolicy => Boolean(p));
  }

  listForPrincipal(principalType: string, principalId: string): AccessPolicy[] {
    const ids = this.store.policyIdsByPrincipal.get(principalKey(principalType, principalId)) ?? new Set<string>();
    return [...ids]
      .map((id) => this.store.policiesById.get(id))
      .filter((p): p is AccessPolicy => Boolean(p));
  }

  listByPermissionCode(permissionCode: string): AccessPolicy[] {
    const ids = this.store.policyIdsByPermissionCode.get(permissionCode) ?? new Set<string>();
    return [...ids]
      .map((id) => this.store.policiesById.get(id))
      .filter((p): p is AccessPolicy => Boolean(p));
  }
}

