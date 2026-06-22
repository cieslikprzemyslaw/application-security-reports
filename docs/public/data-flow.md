# Data flow

## Company list and workspace

```text
RouterShell
  → companyService.list()
  → GET /api/companies
  → Company route
  → Company repository
  → Prisma Company
```

The selected company determines workspace navigation and company-scoped Assessment listing.

## Company creation

```text
Create Company form
  → companyService.create()
  → POST /api/companies
  → request validation
  → Company repository.create()
  → SQLite
```

The frontend then updates the company collection and may select the new Company.

## Company logo replacement

```text
File selected in browser
  → companyService.uploadLogo()
  → PUT /api/companies/:id/logo
  → raw-body validation
  → filename, size, MIME, and magic-byte checks
  → staged filesystem replacement
  → Company.logoUrl update
```

The filesystem operation and database update are separate. See [Storage and deletion](storage.md).

## Assessment workspace

```text
Assessment route
  → assessmentService.getOverview(companyId, assessmentId)
  → GET /api/companies/:companyId/assessments/:assessmentId/overview
  → Company/Assessment/Threat/Evidence/Report repositories
  → workspace DTO
```

The overview verifies that the Assessment belongs to the Company.

Completing an Assessment uses:

```text
POST /api/companies/:companyId/assessments/:assessmentId/commands/complete
```

The request includes the current `recordVersion` for conflict detection.

## Threats

```text
Threat tab
  → threatService.list({ assessmentId })
  → GET /api/threats?assessmentId=...
  → Assessment existence check
  → Threat repository
```

Create and update requests are validated before repository writes.

Threat deletion is restricted when Evidence or Report relationships still reference the Threat.

## Evidence

```text
Evidence tab
  → evidenceService.list({ assessmentId })
  → GET /api/evidence?assessmentId=...
  → Assessment existence check
  → Evidence repository
```

Evidence create and update validate that every linked Threat belongs to the same Assessment.

Structured HTTP exchanges are stored in `EvidenceExchange` rows and replaced transactionally when supplied by an update.

## Report view

```text
reportService.getById(reportId)
  → GET /api/reports/:id
  → Report repository
  → Assessment and Company repositories
  → Threat and Evidence repositories
  → Settings repository
  → validated ReportView response
```

The route:

1. loads the Report;
2. loads its Assessment and Company;
3. loads Settings;
4. verifies selected Threat relationships;
5. validates Evidence relationships;
6. assembles branding and configuration;
7. builds a report snapshot in the response.

The route does not persist a new ReportVersion.

## ReportVersion

`ReportVersionRepository.create()` validates the snapshot and stores an immutable row. It exposes create and read methods only; no update or delete method exists.

There is currently no public ReportVersion API route.

## Failure behaviour

- invalid request data is rejected before intended writes;
- multi-row repository updates use Prisma transactions;
- API errors are mapped to safe public messages;
- filesystem writes are outside Prisma transaction boundaries.
