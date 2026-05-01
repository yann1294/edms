# API Contracts

## 1. API Principles

- All endpoints are organization-aware.
- All protected endpoints require authentication.
- All mutating endpoints require authorization.
- All sensitive operations must emit audit events.
- API responses use consistent envelopes for predictable frontend integration.
- Public object storage paths are never exposed directly.

## 2. Base conventions

### Base path
```text
/api/v1
```

### Content types
- `application/json`
- `multipart/form-data` for file uploads

### Standard response envelope
```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

### Standard error envelope
```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document not found",
    "details": {}
  }
}
```

### Pagination contract
```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 120,
    "hasNext": true
  }
}
```

---

## 3. Authentication

### POST /auth/login
Authenticate user and return token/session info.

**Request**
```json
{
  "email": "admin@example.com",
  "password": "secret"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User"
    }
  }
}
```

### GET /auth/me
Returns the current authenticated user with role summary.

---

## 4. Users and Departments

### GET /users
List users.

Query params:
- `page`
- `pageSize`
- `departmentId`
- `status`
- `search`

### POST /users
Create user.

### GET /users/:id
Get user details.

### PATCH /users/:id
Update user.

### GET /departments
List departments.

### POST /departments
Create department.

### PATCH /departments/:id
Update department.

---

## 5. Roles and Access Policies

### GET /roles
List roles.

### POST /roles
Create role.

### POST /users/:id/roles
Assign role to user.

**Request**
```json
{
  "roleId": "uuid",
  "scopeType": "department",
  "scopeId": "uuid"
}
```

### GET /permissions
List permission catalog.

### POST /access-policies
Create access policy.

**Request**
```json
{
  "resourceType": "document",
  "resourceId": "uuid",
  "principalType": "role",
  "principalId": "uuid",
  "permissionCode": "document.view",
  "effect": "allow"
}
```

---

## 6. Folders and Document Types

### GET /folders
List folders.

### POST /folders
Create folder.

### PATCH /folders/:id
Update folder.

### GET /document-types
List document types.

### POST /document-types
Create document type.

---

## 7. Metadata Schemas

### GET /metadata-schemas
List schemas.

### POST /metadata-schemas
Create schema.

### POST /metadata-schemas/:id/fields
Add metadata field.

**Request**
```json
{
  "fieldName": "invoiceNumber",
  "fieldLabel": "Invoice Number",
  "dataType": "text",
  "isRequired": true,
  "isSearchable": true,
  "validationRules": {
    "maxLength": 100
  },
  "displayOrder": 1
}
```

---

## 8. File Uploads

### POST /file-assets/uploads
Upload binary file and create file asset record.

**Content-Type**
`multipart/form-data`

**Fields**
- `file`

**Response**
```json
{
  "success": true,
  "data": {
    "fileAssetId": "uuid",
    "originalFilename": "contract.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 234123,
    "uploadStatus": "completed"
  }
}
```

---

## 9. Documents

### POST /documents
Create document with initial file and metadata.

**Request**
```json
{
  "title": "Employment Contract",
  "description": "April 2026 contract",
  "documentTypeId": "uuid",
  "folderId": "uuid",
  "fileAssetId": "uuid",
  "metadata": [
    {
      "metadataFieldId": "uuid",
      "valueText": "HR-2026-001"
    }
  ]
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "documentId": "uuid",
    "currentVersionId": "uuid",
    "status": "draft"
  }
}
```

### GET /documents
List documents.

Query params:
- `page`
- `pageSize`
- `status`
- `folderId`
- `documentTypeId`
- `ownerUserId`
- `tag`
- `q`

### GET /documents/:id
Get document details.

### PATCH /documents/:id
Update title, description, metadata, folder.

### POST /documents/:id/versions
Create new version.

**Request**
```json
{
  "fileAssetId": "uuid",
  "changeSummary": "Corrected signature block",
  "isMajorVersion": true
}
```

### GET /documents/:id/versions
List document versions.

### GET /documents/:id/download
Return signed URL or streamed file after authorization.

### GET /documents/:id/preview
Return preview reference or stream preview asset.

---

## 10. Document Permissions

### GET /documents/:id/permissions
List effective policies on the document.

### POST /documents/:id/permissions
Create policy.

### DELETE /documents/:id/permissions/:policyId
Remove policy.

---

## 11. Workflows

### POST /documents/:id/workflow/submit
Submit draft into workflow.

**Request**
```json
{
  "comment": "Ready for review"
}
```

### POST /documents/:id/workflow/approve
Approve current step.

### POST /documents/:id/workflow/reject
Reject current step.

**Request**
```json
{
  "comment": "Missing attachment"
}
```

### GET /documents/:id/workflow
Get workflow instance, current state, task state, and history.

### GET /workflow/tasks
List tasks assigned to current user.

---

## 12. Signatures

### POST /documents/:id/signatures/requests
Create signature request.

**Request**
```json
{
  "versionId": "uuid",
  "signerUserId": "uuid"
}
```

### GET /documents/:id/signatures/requests
List signature requests.

### POST /signatures/requests/:id/sign
Record signature completion.

### POST /signatures/requests/:id/decline
Record decline event.

---

## 13. Search

### GET /search/documents
Full-text and faceted search.

Query params:
- `q`
- `status`
- `documentTypeId`
- `ownerUserId`
- `departmentId`
- `tag`
- `createdFrom`
- `createdTo`
- `page`
- `pageSize`
- `sort`

**Response**
```json
{
  "success": true,
  "data": [
    {
      "documentId": "uuid",
      "title": "Employment Contract",
      "status": "approved",
      "documentType": "Contract",
      "versionNumber": 2,
      "highlights": ["...contract term..."]
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "hasNext": false
  }
}
```

---

## 14. Audit

### GET /audit/logs
List audit records.

Query params:
- `actorUserId`
- `resourceType`
- `resourceId`
- `actionType`
- `from`
- `to`
- `page`
- `pageSize`

---

## 15. Status and Health

### GET /health
Basic process health.

### GET /health/dependencies
Dependency health for DB, Redis, object storage, and search.

---

## 16. Error Codes

Recommended canonical codes:
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `RESOURCE_NOT_FOUND`
- `DOCUMENT_NOT_FOUND`
- `VERSION_NOT_FOUND`
- `FILE_UPLOAD_FAILED`
- `INVALID_WORKFLOW_TRANSITION`
- `SIGNATURE_REQUEST_INVALID`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

---

## 17. API Rules for Codex

- Do not create endpoints that bypass authorization.
- Do not create file-serving endpoints that expose raw bucket paths.
- Emit audit events on every sensitive operation.
- Keep request and response DTOs explicit.
- Use idempotency where retry behavior is possible for asynchronous workflows.
