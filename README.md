# AppSec Report Builder

AppSec Report Builder is a private application for creating and reviewing application security reports.

The project is still actively being developed, so the feature set and structure will continue to evolve.

## Requirements

- Node.js `24.15.0`
- npm bundled with that Node release

## Local Database Setup

The project uses Prisma with SQLite for local persistence. The JSON files in
`prisma/seed/` are seed inputs only; runtime application data still lives in
SQLite through Prisma.

1. Install dependencies with `npm install`.
2. Create a local `.env` file from `.env.example` and keep `DATABASE_URL="file:./dev.db"` there.
3. Generate Prisma Client with `npm run db:generate`.
4. Apply the development migrations with `npm run db:migrate`.
5. Seed the database with `npm run db:seed`.
6. Reset, reapply migrations, and reseed with `npm run db:reset`.
7. Validate the schema with `npm run db:validate`.
8. Open Prisma Studio with `npm run db:studio`.

If you want to recreate a fresh local database from scratch, run:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

To rebuild the database and restore the seed data in one step, use:

```bash
npm run db:reset
```

## Database Model

The Prisma schema models the current application domain directly. The core
entities are `Company`, `Assessment`, `Threat`, `Evidence`, `Report`,
`Activity`, and `Settings`.

### Relationship Overview

| Parent     | Child          | Cardinality | Delete rule | Reason                                                                                             |
| ---------- | -------------- | ----------: | ----------- | -------------------------------------------------------------------------------------------------- |
| Company    | Assessment     |         1:N | Restrict    | Assessments are security records owned by a company and should not disappear with a parent delete. |
| Assessment | Threat         |         1:N | Cascade     | Threats have no independent meaning without their assessment.                                      |
| Assessment | Evidence       |         1:N | Cascade     | Evidence belongs to an assessment and is removed with that assessment.                             |
| Assessment | Report         |         1:N | Restrict    | Reports are audit-sensitive assessment snapshots and should block assessment deletion.             |
| Report     | ReportThreat   |         1:N | Cascade     | Report selection rows are only meaningful while the report exists.                                 |
| Threat     | ReportThreat   |         1:N | Restrict    | Prevents losing report history when a selected threat is still referenced.                         |
| Evidence   | EvidenceThreat |         1:N | Cascade     | Evidence-link rows are only meaningful while the evidence exists.                                  |
| Threat     | EvidenceThreat |         1:N | Restrict    | Prevents losing evidence history when a threat is still referenced.                                |

### Model Notes

- `Report` keeps `assessmentId` as a required foreign key and uses the
  `ReportThreat` join table to represent `selectedThreatIds`.
- `Evidence` keeps `assessmentId` as a required foreign key and uses the
  `EvidenceThreat` join table to represent `threatIds`.
- `Assessment.status`, `Threat.status`, `Activity.action`, and
  `Settings.dateFormat` remain plain strings in Prisma where the literal values
  would otherwise need renaming to fit Prisma enum identifiers. `Threat`
  stores `strideCategories` as `Json` because it is a multi-valued
  classification list. The TypeScript and Zod schemas remain the source of
  truth for those closed sets.
- `Activity` is intentionally polymorphic (`entityType` + `entityId`) because
  the current app models audit history that may refer to multiple entity types.
  Prisma cannot enforce a safe foreign key for that shape without changing the
  domain model.
- `Settings` is treated as a global singleton in application code. The schema
  keeps the record shape minimal because the current domain does not define a
  separate owner/workspace key.

### Timestamps, Constraints, and Indexes

- `createdAt` and `updatedAt` are present on mutable entities.
- `Activity` is immutable and only stores `createdAt`.
- `Report.status` defaults to `draft` and `latestVersion` defaults to `0`.
- Composite primary keys prevent duplicate rows in the `ReportThreat` and
  `EvidenceThreat` join tables.
- Important indexes:
  - `Assessment(companyId, updatedAt)` for company-scoped assessment lists.
  - `Assessment(status)` and `Threat(status)` for status filtering.
  - `Threat(assessmentId, updatedAt)` for assessment-scoped threat lists.
  - `Evidence(assessmentId, createdAt)` and `Report(assessmentId, createdAt)`
    for timeline-style listing.
  - `Activity(entityType, createdAt)` for the recent activity feed.
  - `ReportThreat(threatId)` and `EvidenceThreat(threatId)` for reverse lookups.

### Portability Notes

- The schema only uses portable scalar types and relations so it can migrate to
  PostgreSQL later.
- `strideCategories` stays as `Json` because it is a multi-valued classification
  list rather than a relational association.
- Date-only domain values such as `startedAt`, `completedAt`, and `capturedAt`
  remain strings so their semantics stay distinct from timestamp fields.
- Prefixed IDs are still generated by the backend with the shared utility in
  `server/utils/id.ts` before records are inserted.

## Repository Layer

The Prisma repository layer lives under `server/database/` and keeps database
queries out of route handlers and client code.

- `server/lib/prisma.ts` owns the single shared Prisma Client instance.
- `server/database/repositories/*.repository.ts` contain typed repository
  factories for `Company`, `Assessment`, `Threat`, `Evidence`, `Report`,
  `Activity`, and `Settings`.
- Repository methods return domain-shaped objects and use `null` for missing
  single records instead of `undefined`.
- Repository inputs stay narrow and application-facing; route handlers do not
  pass through unrestricted Prisma query objects.
- `server/database/errors.ts` maps Prisma errors to safe repository errors
  before they can reach API responses.
- Backend-generated IDs continue to come from `server/utils/id.ts` inside the
  repository layer, so routes do not assign IDs directly.
- Multi-write relationship changes use Prisma transactions where they are
  needed, especially for the `EvidenceThreat` and `ReportThreat` join tables.
- `server/index.ts` handles `SIGINT` and `SIGTERM`, closes the HTTP server, and
  disconnects Prisma cleanly.
- Existing JSON storage in `server/services/jsonFileStore.ts` remains in place
  for the current routes and tests until a later migration issue moves those
  handlers to Prisma.

## API Server

The Node.js API foundation now lives under `server/` and exposes the health
endpoint that future domain routers will build on.

### Environment

- `API_PORT` controls the API listen port. It defaults to `3001`.
- `FRONTEND_ORIGIN` controls the allowed CORS origin. It defaults to
  `http://localhost:5173`.
- `NODE_ENV` is validated and defaults to `development`.
- `DATABASE_URL` still points Prisma at the local SQLite database.

### Local Commands

Verified commands:

- `npm run api:dev` starts the API with watch mode.
- `npm run build` builds the client and the server.
- `npm run api:start` starts the compiled API from `dist-server/server/index.js`.
- `npm run test:api` runs the focused API foundation checks.
- `npm run db:validate` validates the Prisma schema.
- `npm run lint` runs ESLint across the repository.
- `npm run format:check` verifies Prettier formatting.

### Routes

- `GET /api/health` returns `200` with `{ "status": "ok" }`.
- The API router is mounted under `/api`.
- Assessment routes are mounted under `/api/assessments`.
- Evidence routes are mounted under `/api/evidence`.
- Company routes are mounted under `/api/companies`.
- Threat routes are mounted under `/api/threats`.

### Companies API

The Companies router is mounted under `/api/companies`.

- `GET /api/companies`
- `GET /api/companies/:id`
- `POST /api/companies`
- `PATCH /api/companies/:id`
- `DELETE /api/companies/:id`

All successful JSON responses use a `{ "data": ... }` envelope. Company records
use ISO-8601 timestamps and the `cmp_` prefixed UUID format.

#### Create company

`POST /api/companies`

```json
{
  "name": "Northstar Digital",
  "description": "Security consulting and managed assessment services",
  "website": "https://northstar.example",
  "contactName": "Alex Mercer",
  "contactEmail": "security@northstar.example",
  "logoPath": "/logos/northstar.svg",
  "footerText": "Confidential - do not distribute."
}
```

Response:

```json
{
  "data": {
    "id": "cmp_00000000-0000-0000-0000-000000000001",
    "name": "Northstar Digital",
    "description": "Security consulting and managed assessment services",
    "website": "https://northstar.example",
    "contactName": "Alex Mercer",
    "contactEmail": "security@northstar.example",
    "logoPath": "/logos/northstar.svg",
    "footerText": "Confidential - do not distribute.",
    "createdAt": "2026-06-01T09:00:00.000Z",
    "updatedAt": "2026-06-11T09:00:00.000Z"
  }
}
```

#### Update company

`PATCH /api/companies/:id`

```json
{
  "name": "Northstar Security",
  "footerText": "Confidential - updated."
}
```

Validation error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "path": "id",
        "message": "Unknown property: id",
        "code": "unrecognized_keys"
      }
    ]
  }
}
```

Not found error:

```json
{
  "error": {
    "code": "COMPANY_NOT_FOUND",
    "message": "Company not found",
    "details": []
  }
}
```

#### Delete company

`DELETE /api/companies/:id` returns `204 No Content` on success.

If assessments still reference the company, the API returns:

```json
{
  "error": {
    "code": "COMPANY_DELETE_CONFLICT",
    "message": "Company cannot be deleted while related assessments exist",
    "details": []
  }
}
```

### Assessments API

The Assessments router is mounted under `/api/assessments`.

- `GET /api/assessments`
- `GET /api/assessments?companyId=cmp_...`
- `GET /api/assessments/:id`
- `POST /api/assessments`
- `PATCH /api/assessments/:id`
- `DELETE /api/assessments/:id`

All successful JSON responses use a `{ "data": ... }` envelope. Assessment
records use ISO-8601 timestamps, the `asm_` prefixed UUID format, and keep the
`cmp_` company foreign key on the record itself.

#### List assessments

`GET /api/assessments`

```json
{
  "data": []
}
```

`GET /api/assessments?companyId=cmp_00000000-0000-0000-0000-000000000001`

```json
{
  "data": [
    {
      "id": "asm_00000000-0000-0000-0000-000000000001",
      "companyId": "cmp_00000000-0000-0000-0000-000000000001",
      "title": "Customer Services Portal",
      "description": "Assessment of the customer portal",
      "scope": "Web application",
      "status": "in-progress",
      "startedAt": "2026-06-01",
      "completedAt": "2026-06-10",
      "applicationName": "Customer Services Portal",
      "environment": "Production",
      "assessmentType": "Web App",
      "overallRisk": "high",
      "createdAt": "2026-06-01T09:00:00.000Z",
      "updatedAt": "2026-06-11T09:00:00.000Z"
    }
  ]
}
```

#### Create assessment

`POST /api/assessments`

```json
{
  "companyId": "cmp_00000000-0000-0000-0000-000000000001",
  "title": "Customer Services Portal",
  "description": "Assessment of the customer portal",
  "scope": "Web application",
  "status": "in-progress",
  "startedAt": "2026-06-01",
  "completedAt": "2026-06-10",
  "applicationName": "Customer Services Portal",
  "environment": "Production",
  "assessmentType": "Web App",
  "overallRisk": "high"
}
```

Response:

```json
{
  "data": {
    "id": "asm_00000000-0000-0000-0000-000000000001",
    "companyId": "cmp_00000000-0000-0000-0000-000000000001",
    "title": "Customer Services Portal",
    "description": "Assessment of the customer portal",
    "scope": "Web application",
    "status": "in-progress",
    "startedAt": "2026-06-01",
    "completedAt": "2026-06-10",
    "applicationName": "Customer Services Portal",
    "environment": "Production",
    "assessmentType": "Web App",
    "overallRisk": "high",
    "createdAt": "2026-06-01T09:00:00.000Z",
    "updatedAt": "2026-06-11T09:00:00.000Z"
  }
}
```

If the company does not exist, the API returns:

```json
{
  "error": {
    "code": "COMPANY_NOT_FOUND",
    "message": "Company not found",
    "details": []
  }
}
```

#### Retrieve assessment

`GET /api/assessments/:id`

If the assessment does not exist, the API returns:

```json
{
  "error": {
    "code": "ASSESSMENT_NOT_FOUND",
    "message": "Assessment not found",
    "details": []
  }
}
```

#### Update assessment

`PATCH /api/assessments/:id`

```json
{
  "title": "Customer Services Portal - Updated",
  "overallRisk": "medium"
}
```

PATCH validation rejects `id`, `companyId`, `createdAt`, and `updatedAt`,
and requires at least one mutable field.

#### Delete assessment

`DELETE /api/assessments/:id` returns `204 No Content` on success.

If related reports still reference the assessment, the API returns:

```json
{
  "error": {
    "code": "ASSESSMENT_DELETE_CONFLICT",
    "message": "Assessment cannot be deleted while related reports exist",
    "details": []
  }
}
```

### Threats API

The Threats router is mounted under `/api/threats`.

- `GET /api/threats?assessmentId=asm_...`
- `GET /api/threats/:id`
- `POST /api/threats`
- `PATCH /api/threats/:id`
- `DELETE /api/threats/:id`

All successful JSON responses use a `{ "data": ... }` envelope. Threat records
use ISO-8601 timestamps, the `thr_` prefixed UUID format, and must always be
filtered by `assessmentId` when listing.

#### List threats

`GET /api/threats?assessmentId=asm_00000000-0000-0000-0000-000000000001`

```json
{
  "data": []
}
```

The `assessmentId` query parameter is required. Missing, malformed, or unknown
query properties return `400 VALIDATION_ERROR`. If the assessment does not
exist, the API returns `404 ASSESSMENT_NOT_FOUND`.

#### Create threat

`POST /api/threats`

```json
{
  "assessmentId": "asm_00000000-0000-0000-0000-000000000001",
  "title": "Missing Server-Side Authorization",
  "description": "The endpoint returns another customer order.",
  "severity": "critical",
  "strideCategories": ["spoofing", "tampering"],
  "status": "accepted-risk",
  "affectedAsset": "/api/v1/orders/{id}",
  "impact": "Unauthorised access to customer order data",
  "recommendation": "Apply object-level authorization on every request.",
  "observation": "An authenticated user can access another customer order.",
  "affectedComponent": "Orders API",
  "affectedEndpoint": "/api/v1/orders/{id}",
  "risk": "Sensitive order data is exposed."
}
```

Response:

```json
{
  "data": {
    "id": "thr_00000000-0000-0000-0000-000000000001",
    "assessmentId": "asm_00000000-0000-0000-0000-000000000001",
    "title": "Missing Server-Side Authorization",
    "description": "The endpoint returns another customer order.",
    "severity": "critical",
    "strideCategories": ["spoofing", "tampering"],
    "status": "accepted-risk",
    "affectedAsset": "/api/v1/orders/{id}",
    "impact": "Unauthorised access to customer order data",
    "recommendation": "Apply object-level authorization on every request.",
    "observation": "An authenticated user can access another customer order.",
    "affectedComponent": "Orders API",
    "affectedEndpoint": "/api/v1/orders/{id}",
    "risk": "Sensitive order data is exposed.",
    "createdAt": "2026-06-01T09:00:00.000Z",
    "updatedAt": "2026-06-11T09:00:00.000Z"
  }
}
```

Severity, status, and STRIDE categories are validated against the shared
domain enums. Unknown properties are rejected, and client-controlled `id`,
`createdAt`, and `updatedAt` fields are also rejected. If the assessment does
not exist, the API returns `404 ASSESSMENT_NOT_FOUND`.

#### Retrieve threat

`GET /api/threats/:id`

If the threat does not exist, the API returns:

```json
{
  "error": {
    "code": "THREAT_NOT_FOUND",
    "message": "Threat not found",
    "details": []
  }
}
```

#### Update threat

`PATCH /api/threats/:id`

```json
{
  "title": "Missing server-side authorization",
  "status": "mitigated",
  "risk": "Risk reduced after remediation"
}
```

PATCH validation rejects `id`, `assessmentId`, `createdAt`, and `updatedAt`,
and requires at least one mutable field.

#### Delete threat

`DELETE /api/threats/:id` returns `204 No Content` on success.

If related evidence or reports still reference the threat, the API returns:

```json
{
  "error": {
    "code": "THREAT_DELETE_CONFLICT",
    "message": "Threat cannot be deleted while related evidence or reports exist",
    "details": []
  }
}
```

### Evidence API

The Evidence router is mounted under `/api/evidence`.

- `GET /api/evidence?assessmentId=asm_...`
- `GET /api/evidence/:id`
- `POST /api/evidence`
- `PATCH /api/evidence/:id`
- `DELETE /api/evidence/:id`

All successful JSON responses use a `{ "data": ... }` envelope. Evidence
records use ISO-8601 timestamps and the `evd_` prefixed UUID format.

The API only accepts backend-managed evidence file paths under
`uploads/evidence`. Client input cannot set `filePath`; the server derives it
from `fileName` when file metadata is supplied. Evidence file names must be
simple names without path separators, and file metadata only accepts
`application/json`, `application/pdf`, `image/gif`, `image/jpeg`,
`image/png`, `image/webp`, or `text/plain`. File-name extensions must match
the supplied MIME type, and any future real disk reads or writes should also
check canonical paths with `realpath` so symlink escapes cannot bypass the
boundary.

#### List evidence

`GET /api/evidence?assessmentId=asm_00000000-0000-0000-0000-000000000001`

```json
{
  "data": []
}
```

The `assessmentId` query parameter is required. Missing, malformed, or unknown
query properties return `400 VALIDATION_ERROR`. If the assessment does not
exist, the API returns `404 ASSESSMENT_NOT_FOUND`.

#### Create evidence

`POST /api/evidence`

```json
{
  "assessmentId": "asm_00000000-0000-0000-0000-000000000001",
  "threatIds": ["thr_00000000-0000-0000-0000-000000000001"],
  "type": "screenshot",
  "title": "Evidence screenshot",
  "description": "Portal screenshot",
  "content": "Base64 payload",
  "fileName": "evidence.png",
  "mimeType": "image/png",
  "capturedAt": "2026-06-05"
}
```

`id`, `createdAt`, `updatedAt`, and `filePath` are rejected on input. The API
verifies that the assessment exists and that every supplied threat belongs to
that same assessment before creating the record.

#### Update evidence

`PATCH /api/evidence/:id`

```json
{
  "title": "Updated evidence title",
  "fileName": "updated-evidence.png"
}
```

PATCH validation rejects `id`, `assessmentId`, `createdAt`, `updatedAt`, and
`filePath`, and requires at least one mutable field.

#### Delete evidence

`DELETE /api/evidence/:id` returns `204 No Content` on success.

If the evidence does not exist, the API returns:

```json
{
  "error": {
    "code": "EVIDENCE_NOT_FOUND",
    "message": "Evidence not found",
    "details": []
  }
}
```

### Shutdown

Pressing `Ctrl+C` sends `SIGINT` or `SIGTERM`, the server stops accepting new
connections, Prisma disconnects, and the process exits cleanly after cleanup
finishes.

## Identifier Conventions

Backend-created records use prefixed UUIDs in the form `<prefix><UUID>`. The
backend assigns these identifiers before persistence, so route handlers do not
generate IDs directly.

| Entity     | Prefix |
| ---------- | ------ |
| Company    | `cmp_` |
| Assessment | `asm_` |
| Threat     | `thr_` |
| Evidence   | `evd_` |
| Report     | `rpt_` |
| Activity   | `act_` |
| Settings   | `set_` |

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the
rules for submitting patches and the expected `Signed-off-by:` flow.

## License

This project is licensed for private, non-commercial use only. See
[LICENSE](./LICENSE) for the full text.
