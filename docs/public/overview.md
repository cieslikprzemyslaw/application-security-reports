# Project overview

## Purpose

AppSec Report Builder organises structured application-security assessment data and prepares report views from that data.

The domain flow is:

```text
Company
  → Assessment
    → Threat
    → Evidence
    → Report
      → ReportVersion
```

Evidence may reference zero or more Threat records from the same Assessment. Reports select Threat records from their Assessment.

## Current operating model

The current version is:

- local-first;
- single-workstation;
- backed by Prisma and SQLite;
- served by a local Express API;
- rendered by a React and TypeScript frontend;
- not authenticated;
- not suitable for untrusted public-network exposure.

## Current capabilities

### Persisted backend capabilities

- Companies
- company archive and restore
- company logo upload, read, replacement, and removal
- Assessments
- Assessment overview and complete command
- Threats
- structured Evidence and HTTP exchanges
- Settings
- Report repository support, ReportVersion repository support, and report-view assembly

### Partially implemented workflows

- Report view data is available through `GET /api/reports/:id`.
- `ReportVersion` snapshots can be stored through the repository layer.
- Public Report create/update/version endpoints are not available.
- Evidence records can contain file metadata, but the Evidence API does not upload multipart files.
- Activity has a domain model and repository, but no public Activity API.
- Some frontend Activity, Threat, and Report presentation routes still use local fixture data.

## Sources of truth

- Prisma model: `prisma/schema.prisma`
- domain contracts: `src/domain/`
- runtime validation: `src/domain/schemas/` and `src/validation/`
- frontend routes: `src/routes/index.ts`
- frontend services: `src/services/`
- API composition: `server/http/api-app.ts` and `server/http/api-router.ts`
- route handlers: `server/routes/`
- persistence: `server/database/repositories/`
- exact delivery status: GitHub issues and milestones

Do not document planned cloud behaviour as current functionality.
