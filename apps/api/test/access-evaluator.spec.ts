import { Test } from '@nestjs/testing';
import { AccessEvaluatorService } from '../src/modules/access-policies/access-evaluator.service';
import { AccessPoliciesModule } from '../src/modules/access-policies/access-policies.module';
import { AccessPolicyService } from '../src/modules/access-policies/access-policy.service';
import { RolesSeedService } from '../src/modules/roles/roles-seed.service';

describe('AccessEvaluatorService (pure access policies)', () => {
  const resourceType = 'document';
  const resourceId = '11111111-1111-4111-8111-111111111111';
  const permissionCode = 'document.view';

  const userId = '22222222-2222-4222-8222-222222222222';
  const departmentId = '33333333-3333-4333-8333-333333333333';
  const roleId = '44444444-4444-4444-8444-444444444444';

  async function setup() {
    const moduleRef = await Test.createTestingModule({
      imports: [AccessPoliciesModule],
    }).compile();

    // Ensure Permission catalog exists for validation.
    moduleRef.get(RolesSeedService).seed();

    return {
      evaluator: moduleRef.get(AccessEvaluatorService),
      policies: moduleRef.get(AccessPolicyService),
    };
  }

  it('allow case: matching allow returns true', async () => {
    const { evaluator, policies } = await setup();

    policies.createPolicy({
      resourceType,
      resourceId,
      principalType: 'user',
      principalId: userId,
      permissionCode,
      effect: 'allow',
    });

    expect(
      evaluator.evaluateAccess({
        userId,
        roles: [],
        departmentId: null,
        resourceType,
        resourceId,
        permissionCode,
      }),
    ).toBe(true);
  });

  it('deny case: matching deny returns false', async () => {
    const { evaluator, policies } = await setup();

    policies.createPolicy({
      resourceType,
      resourceId,
      principalType: 'user',
      principalId: userId,
      permissionCode,
      effect: 'deny',
    });

    expect(
      evaluator.evaluateAccess({
        userId,
        roles: [],
        departmentId: null,
        resourceType,
        resourceId,
        permissionCode,
      }),
    ).toBe(false);
  });

  it('precedence: allow + deny returns false', async () => {
    const { evaluator, policies } = await setup();

    policies.createPolicy({
      resourceType,
      resourceId,
      principalType: 'user',
      principalId: userId,
      permissionCode,
      effect: 'allow',
    });

    policies.createPolicy({
      resourceType,
      resourceId,
      principalType: 'user',
      principalId: userId,
      permissionCode,
      effect: 'deny',
    });

    expect(
      evaluator.evaluateAccess({
        userId,
        roles: [],
        departmentId: null,
        resourceType,
        resourceId,
        permissionCode,
      }),
    ).toBe(false);
  });

  it('default deny: no policies returns false', async () => {
    const { evaluator } = await setup();
    expect(
      evaluator.evaluateAccess({
        userId,
        roles: [],
        departmentId: null,
        resourceType,
        resourceId,
        permissionCode,
      }),
    ).toBe(false);
  });

  it('multi-principal: role allow works; user deny overrides role allow', async () => {
    const { evaluator, policies } = await setup();

    policies.createPolicy({
      resourceType,
      resourceId,
      principalType: 'role',
      principalId: roleId,
      permissionCode,
      effect: 'allow',
    });

    expect(
      evaluator.evaluateAccess({
        userId,
        roles: [roleId],
        departmentId,
        resourceType,
        resourceId,
        permissionCode,
      }),
    ).toBe(true);

    policies.createPolicy({
      resourceType,
      resourceId,
      principalType: 'user',
      principalId: userId,
      permissionCode,
      effect: 'deny',
    });

    expect(
      evaluator.evaluateAccess({
        userId,
        roles: [roleId],
        departmentId,
        resourceType,
        resourceId,
        permissionCode,
      }),
    ).toBe(false);
  });
});
