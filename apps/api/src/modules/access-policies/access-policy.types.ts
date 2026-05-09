export type AccessPolicyEffect = 'allow' | 'deny';

export type AccessPolicy = {
  id: string;
  resourceType: string;
  resourceId: string;
  principalType: string;
  principalId: string;
  permissionCode: string;
  effect: AccessPolicyEffect;
  createdAtUtc: string;
};

