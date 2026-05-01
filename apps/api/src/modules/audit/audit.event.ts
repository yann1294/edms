export type AuditEvent = {
  occurredAtUtc: string;
  actionCode: string;
  actorUserId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

