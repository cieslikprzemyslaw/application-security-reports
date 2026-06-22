# Backend

## Runtime

The backend uses:

- Node.js;
- Express;
- Zod;
- Prisma;
- Better SQLite3 adapter;
- SQLite.

The API is mounted under `/api`.

## API middleware

`server/http/api-app.ts` applies:

- `X-Powered-By` removal;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: no-referrer`;
- `Cross-Origin-Resource-Policy: same-origin`;
- CORS restricted to `FRONTEND_ORIGIN`;
- no credentialed cross-origin requests;
- JSON body limit of `1mb`;
- JSON content-type enforcement for JSON mutations;
- dedicated raw-body handling for company logos.

## Route-to-repository rule

Production routes receive repository interfaces through dependency injection.

Correct flow:

```text
request
  → validation middleware
  → route business checks
  → repository method
  → Prisma
```

Incorrect flow:

```text
route
  → Prisma Client directly
```

## Repositories

Repository factories are exported from `server/database/repositories/index.ts`.

Current repositories:

- Company
- Assessment
- Threat
- Evidence
- Report
- ReportVersion
- Activity
- Settings

Activity and ReportVersion repositories exist even though their complete public API workflows are not yet exposed.

## IDs

Backend-generated prefixed IDs come from `server/utils/id.ts`.

Current prefixes:

- Company: `cmp_`
- Assessment: `asm_`
- Threat: `thr_`
- Evidence: `evd_`
- EvidenceExchange: `evx_`
- Report: `rpt_`
- ReportVersion: `rvs_`
- Activity: `act_`
- Settings: `set_`

Clients must not choose server-owned IDs.

## Shutdown

The API registers `SIGINT` and `SIGTERM` handlers. Shutdown closes the HTTP server and disconnects Prisma.

## Current limitations

- no authentication or authorisation;
- no multi-user or tenant isolation;
- no public Activity API;
- Report API is read-only;
- no multipart Evidence upload route;
- filesystem actions are not part of Prisma transactions.
