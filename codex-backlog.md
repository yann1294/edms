# Codex Backlog

This backlog is ordered to minimize rework and maximize architectural stability during implementation.

---

## Task 1 — Bootstrap the repository and project conventions

### Goal
Create the workspace, coding conventions, environment handling, test setup, and documentation structure.

### Deliverables
- API app scaffold
- worker app scaffold
- web app scaffold
- lint, format, test setup
- Docker compose for local infra
- `.env.example`
- `docs/` wired into repo

### Acceptance criteria
- workspace builds successfully
- local dev dependencies can start
- health endpoints can be stubbed

---

## Task 2 — Set up infrastructure adapters

### Goal
Create adapters for PostgreSQL, Redis, S3-compatible storage, and OpenSearch.

### Deliverables
- DB connection module
- Redis connection module
- object storage adapter interface + implementation
- search adapter interface + implementation
- dependency health checks

### Acceptance criteria
- all adapters are configured via environment variables
- health checks verify connectivity
- no business module talks directly to raw SDKs without an adapter layer

---

## Task 3 — Create shared kernel and common abstractions

### Goal
Define reusable types, error handling, pagination, ids, audit event contracts, and transaction helpers.

### Deliverables
- base entity abstractions
- result envelopes
- exception model
- pagination helpers
- audit event publisher interface
- common config loader

### Acceptance criteria
- shared abstractions compile cleanly
- future modules can import common primitives without circular coupling

---

## Task 4 — Implement authentication and current-user context

### Goal
Secure the system with login and current-user resolution.

### Deliverables
- auth module
- login endpoint
- JWT or session support
- current user guard / decorator
- bootstrap admin user path

### Acceptance criteria
- protected endpoints reject unauthenticated requests
- current user context is available in controllers and services

---

## Task 5 — Implement Users and Departments modules

### Goal
Support people management and org structure.

### Deliverables
- users CRUD
- departments CRUD
- department tree query
- DTO validation
- tests

### Acceptance criteria
- users are organization-scoped
- department hierarchy supports parent-child relationships

---

## Task 6 — Implement Roles, Permission Catalog, and UserRole assignment

### Goal
Introduce permission-based authorization primitives.

### Deliverables
- roles CRUD
- permission catalog seed
- role assignment endpoints
- role lookup services

### Acceptance criteria
- user-role assignment works with optional scope
- permission catalog is queryable

---

## Task 7 — Implement AccessPolicies and authorization evaluation engine

### Goal
Enable resource-level access control.

### Deliverables
- access policy CRUD
- policy evaluator service
- authorization guard/decorator integration
- deny precedence logic
- tests

### Acceptance criteria
- explicit deny overrides allow
- missing allow results in deny
- permission and policy checks are centralized

---

## Task 8 — Implement Folders and DocumentTypes

### Goal
Provide organization and classification anchors for documents.

### Deliverables
- folders CRUD
- folder hierarchy queries
- document types CRUD
- organization scoping

### Acceptance criteria
- folders support nesting
- document types can be linked to metadata schemas and workflows later

---

## Task 9 — Implement MetadataSchemas, MetadataFields, and validation engine

### Goal
Support structured document classification and typed metadata validation.

### Deliverables
- metadata schema CRUD
- metadata field CRUD
- validation service for typed values
- searchable-field flag support

### Acceptance criteria
- invalid metadata payloads are rejected
- required fields are enforced
- typed values map correctly to schema definitions

---

## Task 10 — Implement FileAssets upload pipeline

### Goal
Safely ingest binary files and register them in the system.

### Deliverables
- multipart upload endpoint
- object storage write service
- checksum generation
- file asset persistence
- upload status management

### Acceptance criteria
- files are stored privately
- database record is created transactionally around upload state
- invalid files are rejected according to policy

---

## Task 11 — Implement Documents aggregate and initial document creation flow

### Goal
Create the main business entity and associate it with initial file and metadata.

### Deliverables
- document creation endpoint
- link to file asset
- link to document type and folder
- metadata value persistence
- initial draft status
- audit event on creation

### Acceptance criteria
- document creation validates metadata schema
- current version is initialized correctly
- document is organization-scoped

---

## Task 12 — Implement DocumentVersions and current-version switching

### Goal
Support immutable version history and current-version updates.

### Deliverables
- version creation endpoint/service
- sequential version numbering
- current version update logic
- version listing endpoint
- tests for immutability rules

### Acceptance criteria
- version numbers are unique per document
- previous versions remain unchanged
- current version pointer updates atomically

---

## Task 13 — Implement AuditLogs and automatic event publication

### Goal
Make traceability a platform-level concern.

### Deliverables
- audit log persistence
- audit service/interceptor
- audit query endpoint
- events for create/update/view/download/admin actions

### Acceptance criteria
- sensitive actions create audit events automatically
- audit logs are queryable by actor, resource, and action type

---

## Task 14 — Implement Workflows: definitions, instances, tasks, and history

### Goal
Support draft, review, approval, and rejection flow.

### Deliverables
- workflow definition CRUD
- states and transitions
- submit, approve, reject endpoints
- workflow instances and tasks
- transition history
- notification hooks

### Acceptance criteria
- invalid transitions are rejected
- only authorized users can perform workflow actions
- history is append-only

---

## Task 15 — Implement Search indexing and retrieval

### Goal
Make the system usable as a true EDMS/IRS.

### Deliverables
- search index sync jobs
- OpenSearch index mapping
- search endpoint with filters
- reindex command
- basic document search UI in web app

### Acceptance criteria
- search returns only accessible documents
- search supports full-text and metadata filters
- reindex path exists for recovery

---

## Standard prompt template for Codex

```text
Read docs/system-design.md, docs/security-rules.md, docs/api-contracts.md, and docs/permission-matrix.md first.

Implement only [TASK NAME] in the existing project structure.

Requirements:
- respect the modular monolith boundaries
- do not introduce new architecture patterns
- add migrations/entities/repositories/services/controllers as needed
- add tests
- emit audit events for sensitive actions
- keep changes scoped to the relevant modules

At the end:
- run tests
- summarize changed files
- list assumptions
- list anything intentionally deferred
```

---

## Done Criteria

Every Codex task should satisfy:
- build passes
- tests pass
- DTOs validated
- authorization exists where required
- audit logging exists for sensitive actions
- migrations are safe
- docs updated when API or behavior changes
