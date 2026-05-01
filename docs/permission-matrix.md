# Permission Matrix

## 1. Roles

Recommended initial roles:
- Super Admin
- Organization Admin
- Department Manager
- Document Creator
- Reviewer
- Approver
- Signer
- Viewer
- Auditor

---

## 2. Permission Catalog

### User and org management
- `user.view`
- `user.create`
- `user.update`
- `department.view`
- `department.create`
- `department.update`
- `role.view`
- `role.create`
- `role.update`
- `role.assign`

### Document management
- `document.create`
- `document.view`
- `document.update`
- `document.delete`
- `document.archive`
- `document.download`
- `document.preview`
- `document.share`

### Versioning and file operations
- `document.version.create`
- `file.upload`
- `file.view`

### Metadata and classification
- `metadata-schema.view`
- `metadata-schema.create`
- `metadata-schema.update`
- `document-type.view`
- `document-type.create`
- `document-type.update`
- `tag.manage`

### Workflow
- `workflow.view`
- `workflow.submit`
- `workflow.review`
- `workflow.approve`
- `workflow.reject`
- `workflow.manage-definitions`

### Signatures
- `signature.request`
- `signature.view`
- `signature.sign`
- `signature.decline`

### Audit and administration
- `audit.view`
- `system.settings.manage`

---

## 3. Matrix

| Permission | Super Admin | Org Admin | Dept Manager | Doc Creator | Reviewer | Approver | Signer | Viewer | Auditor |
|---|---|---|---|---|---|---|---|---|---|
| user.view | Y | Y | Y | N | N | N | N | N | Y |
| user.create | Y | Y | N | N | N | N | N | N | N |
| user.update | Y | Y | N | N | N | N | N | N | N |
| department.view | Y | Y | Y | N | N | N | N | N | Y |
| department.create | Y | Y | N | N | N | N | N | N | N |
| department.update | Y | Y | N | N | N | N | N | N | N |
| role.view | Y | Y | N | N | N | N | N | N | Y |
| role.create | Y | Y | N | N | N | N | N | N | N |
| role.update | Y | Y | N | N | N | N | N | N | N |
| role.assign | Y | Y | N | N | N | N | N | N | N |
| document.create | Y | Y | Y | Y | N | N | N | N | N |
| document.view | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| document.update | Y | Y | Y | Y | N | N | N | N | N |
| document.delete | Y | Y | N | N | N | N | N | N | N |
| document.archive | Y | Y | Y | N | N | N | N | N | N |
| document.download | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| document.preview | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| document.share | Y | Y | Y | Y | N | N | N | N | N |
| document.version.create | Y | Y | Y | Y | N | N | N | N | N |
| file.upload | Y | Y | Y | Y | N | N | N | N | N |
| file.view | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| metadata-schema.view | Y | Y | Y | Y | Y | Y | N | N | Y |
| metadata-schema.create | Y | Y | N | N | N | N | N | N | N |
| metadata-schema.update | Y | Y | N | N | N | N | N | N | N |
| document-type.view | Y | Y | Y | Y | Y | Y | N | N | Y |
| document-type.create | Y | Y | N | N | N | N | N | N | N |
| document-type.update | Y | Y | N | N | N | N | N | N | N |
| tag.manage | Y | Y | Y | Y | N | N | N | N | N |
| workflow.view | Y | Y | Y | Y | Y | Y | N | N | Y |
| workflow.submit | Y | Y | Y | Y | N | N | N | N | N |
| workflow.review | Y | Y | Y | N | Y | N | N | N | N |
| workflow.approve | Y | Y | Y | N | N | Y | N | N | N |
| workflow.reject | Y | Y | Y | N | Y | Y | N | N | N |
| workflow.manage-definitions | Y | Y | N | N | N | N | N | N | N |
| signature.request | Y | Y | Y | Y | N | N | N | N | N |
| signature.view | Y | Y | Y | Y | Y | Y | Y | N | Y |
| signature.sign | Y | N | N | N | N | N | Y | N | N |
| signature.decline | Y | N | N | N | N | N | Y | N | N |
| audit.view | Y | Y | N | N | N | N | N | N | Y |
| system.settings.manage | Y | Y | N | N | N | N | N | N | N |

---

## 4. Interpretation Rules

- Role permissions are necessary but not sufficient.
- Resource-level access policies still apply.
- A user with `document.view` can only view a document if an access policy or inherited scope grants access.
- Explicit deny policies override role-based permission grants.
- Workflow actions additionally require the current transition to allow that action.

---

## 5. Scope Guidance

### Organization scope
Used for:
- Organization Admin
- Auditor
- Super Admin

### Department scope
Used for:
- Department Manager
- some Reviewer / Approver assignments

### Resource scope
Used for:
- document-specific viewers
- signers on specific documents
- exceptions and temporary access

---

## 6. Recommended Defaults

### On document creation
- creator gets document owner privileges
- department manager may inherit view/review depending on policy
- no broad public access by default

### On workflow submission
- assigned reviewer gets workflow action access
- creator retains read access
- approver receives access when routed to approval stage

### On signature request
- designated signer gets view + signature action access for the target document version

---

## 7. Codex Implementation Guidance

When Codex implements authorization:
- check both permission and access policy
- centralize evaluation logic
- add tests for explicit deny precedence
- do not scatter raw role-name checks across controllers
- prefer permission-code based checks with a policy evaluator
