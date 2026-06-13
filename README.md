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
