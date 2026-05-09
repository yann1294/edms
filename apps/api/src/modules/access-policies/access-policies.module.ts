import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';
import { AccessEvaluatorService } from './access-evaluator.service';
import { AccessPolicyController } from './access-policy.controller';
import { AccessPolicyGuard } from './access-policy.guard';
import { AccessPolicyService } from './access-policy.service';
import { AccessPolicyRepository } from './store/access-policy.repository';
import { InMemoryAccessPoliciesStore } from './store/in-memory-access-policies.store';

@Module({
  imports: [AuditModule, RolesModule],
  controllers: [AccessPolicyController],
  providers: [
    InMemoryAccessPoliciesStore,
    AccessPolicyRepository,
    AccessPolicyService,
    AccessEvaluatorService,
    AccessPolicyGuard,
  ],
  exports: [AccessPolicyService, AccessEvaluatorService, AccessPolicyGuard],
})
export class AccessPoliciesModule {}

