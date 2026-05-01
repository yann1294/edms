# Security Rules

## 1. Security Principles

- Deny by default.
- Authenticate first, authorize second.
- Every sensitive action must be auditable.
- Object storage is never trusted as a direct public surface.
- Business authorization must not rely only on UI behavior.
- Search results must respect authorization rules.
- Secrets must never be stored in code or committed files.

---

## 2. Authentication Rules

### Allowed mechanisms
- JWT-based authentication
- secure session-based authentication
- SSO integration later through a dedicated adapter

### Mandatory requirements
- all protected endpoints require authenticated identity
- privileged actions must require active, non-disabled users
- session/token validation must occur server-side
- logout or token revocation behavior must be supported in architecture

### Future-ready requirements
- MFA for high-privilege roles
- device/session management for admins

---

## 3. Authorization Rules

Authorization is enforced in four layers:

1. authenticated identity
2. role permission checks
3. resource-level access policy checks
4. workflow transition validation

### Core rule
A request is allowed only if all applicable layers allow it.

### Resource policy precedence
- explicit deny overrides explicit allow
- absence of an allow means deny
- inherited access from role or department may be overridden by a resource-level deny

### Examples
- having `document.view` does not automatically allow viewing every document
- a reviewer can approve only if both the workflow transition allows it and the document is accessible

---

## 4. Sensitive Actions That Must Be Authorized

The following actions always require explicit authorization and audit logging:

- create document
- update document metadata
- upload new document version
- download document
- view document preview if access is restricted
- archive document
- delete document
- create or remove permissions
- submit, approve, reject workflow actions
- create or complete signature request
- create or update roles
- assign roles to users
- read audit logs
- change metadata schemas
- change document types and workflow definitions

---

## 5. Audit Logging Rules

### Must be logged
- login success and failure when feasible
- file upload attempt and result
- document creation
- document update
- document view for restricted documents
- document download
- version creation
- permission change
- workflow submit / approve / reject
- signature requested / viewed / signed / declined
- admin operations

### Audit log requirements
- append-only semantics
- timestamped in UTC
- actor identity when available
- resource type and resource id
- action code
- useful metadata without storing secrets

### Do not store in audit metadata
- raw passwords
- tokens
- full secret values
- sensitive cryptographic material

---

## 6. File Upload Security

### Validation
- validate MIME type using both client hint and server-side inspection when possible
- validate file extension against allowlist
- enforce size limits per file type
- reject empty files unless explicitly supported

### Processing
- compute checksum for every upload
- mark upload as pending until object storage write completes
- prepare integration point for antivirus scanning
- quarantine support should be pluggable later

### Storage
- original files remain private in object storage
- generated previews must also remain private
- signed URLs must be short-lived

---

## 7. Download and Preview Rules

- download endpoints must authorize before generating access
- preview endpoints must authorize before access
- signed URLs should be scoped, short-lived, and never logged verbatim in audit data
- direct object keys must never be exposed in user-facing APIs unless absolutely internal

---

## 8. Search Security

- search indexing must not leak documents the requester cannot access
- search results must be filtered according to effective authorization
- extracted text must not be accessible if the underlying document is not accessible
- audit search access if the result set includes restricted documents or if policy requires it

---

## 9. Data Protection Rules

### In transit
- TLS required for all external traffic
- internal service traffic should also use secure channels where infrastructure allows

### At rest
- database encryption at rest enabled where supported
- object storage encryption at rest enabled
- backups encrypted

### Secrets
- use environment variables or secret manager
- do not hardcode credentials
- rotate credentials on schedule and after incidents

---

## 10. Validation and Input Security

- validate all request DTOs
- enforce maximum lengths on free-text fields
- sanitize filenames and display names where needed
- protect against path traversal when generating storage keys
- protect query parameters used in search adapters
- enforce strict enum validation on statuses and action codes

---

## 11. Administrative Security

- admin endpoints require dedicated admin permissions
- role and permission changes require audit logging
- disabled users must lose access immediately or at next token verification boundary
- audit log readers should be explicitly restricted

---

## 12. Background Worker Security

- workers run with the least privilege required
- queue payloads must not contain secrets if avoidable
- worker jobs must validate referenced entities before action
- failed jobs should not dump confidential content into logs

---

## 13. Logging and Monitoring

### Application logs may include
- request ids
- actor ids
- resource ids
- error codes
- processing times

### Application logs must not include
- raw authorization tokens
- passwords
- signed URLs
- full sensitive document content

---

## 14. Incident-Ready Requirements

The architecture should support:
- user deactivation
- role revocation
- forced session/token invalidation
- audit investigation queries
- object access containment
- backup restoration

---

## 15. Security Rules for Codex

Codex should not:
- bypass auth guards for convenience
- create debug endpoints exposing file paths or secrets
- skip audit logging on sensitive endpoints
- return raw object storage coordinates to the UI
- use permissive wildcard authorization shortcuts

Codex should:
- centralize permission checks
- keep authorization explicit
- validate DTOs strictly
- add tests for allow, deny, and missing permission cases
