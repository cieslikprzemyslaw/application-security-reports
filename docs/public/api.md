# API reference

## Base URLs

Development API:

```text
http://localhost:3001/api
```

Static evidence root:

```text
http://localhost:3001/uploads/evidence/
```

## Envelopes

Successful object:

```json
{
  "data": {}
}
```

Successful list:

```json
{
  "data": []
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  }
}
```

## Routes

### Health

```http
GET /api/health
```

### Companies

```http
GET    /api/companies
GET    /api/companies/:id
GET    /api/companies/:id/overview
POST   /api/companies
PATCH  /api/companies/:id
DELETE /api/companies/:id
POST   /api/companies/:id/archive
POST   /api/companies/:id/restore
PUT    /api/companies/:id/logo
GET    /api/companies/:id/logo
DELETE /api/companies/:id/logo
```

Logo upload uses a raw request body, one of the supported image content types, and an `X-File-Name` header.

### Assessments

```http
GET    /api/assessments
GET    /api/assessments?companyId=cmp_...
GET    /api/assessments/:id
POST   /api/assessments
PATCH  /api/assessments/:id
DELETE /api/assessments/:id
```

Workspace endpoints:

```http
GET  /api/companies/:companyId/assessments/:assessmentId/overview
POST /api/companies/:companyId/assessments/:assessmentId/commands/complete
```

### Threats

```http
GET    /api/threats?assessmentId=asm_...
GET    /api/threats/:id
POST   /api/threats
PATCH  /api/threats/:id
DELETE /api/threats/:id
```

Threat listing requires `assessmentId`.

### Evidence

```http
GET    /api/evidence?assessmentId=asm_...
GET    /api/evidence/:id
POST   /api/evidence
PATCH  /api/evidence/:id
DELETE /api/evidence/:id
```

Evidence listing requires `assessmentId`.

Evidence rules include:

- immutable `assessmentId`;
- same-Assessment Threat relationships;
- backend-owned IDs and timestamps;
- backend-owned `filePath` and `storageKey`;
- structured HTTP exchange validation;
- file metadata validation.

### Reports

```http
POST /api/reports/preview
GET  /api/reports/:id
POST /api/reports/:id/readiness
GET  /api/reports/:id/versions
GET  /api/reports/:id/versions/:versionId
POST /api/reports/:id/versions/draft
POST /api/reports/:id/versions/final
```

`GET /api/reports/:id` returns a validated ReportView assembled from Report, Assessment, Company, Threat, Evidence, and Settings data.

ReportVersion list and single-read responses contain validated immutable snapshots and omit internal filesystem paths. A nested single-version read returns the version only when it belongs to the requested Report.

There is no public Report create/update/delete endpoint. ReportVersion creation is exposed only through the backend-owned draft and final routes.

### Settings

```http
GET   /api/settings
PATCH /api/settings
```

Settings use a singleton repository model.

### Activity

There is no public Activity API route.

## Content types

JSON mutation routes require:

```http
Content-Type: application/json
```

Company logo upload requires one of:

```text
image/jpeg
image/png
image/webp
```

## Security headers and CORS

The API:

- disables `X-Powered-By`;
- sends `X-Content-Type-Options: nosniff`;
- sends `Referrer-Policy: no-referrer`;
- sends `Cross-Origin-Resource-Policy: same-origin`;
- allows only the configured frontend origin;
- does not enable credentialed CORS.

## Authentication

The current API has no authentication or authorisation. It is for trusted local use only.
