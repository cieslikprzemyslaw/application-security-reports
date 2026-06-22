# Frontend

## Stack

The frontend uses:

- React;
- TypeScript;
- React Router;
- styled-components;
- Vite;
- Storybook;
- Vitest and Testing Library.

## Route model

Tracked route patterns are defined in `src/routes/index.ts`.

### Global routes

```text
/dashboard
/companies
/companies/new
/assessments
/threats
/reports
/reports/:reportId
/settings
```

### Company workspace routes

```text
/companies/:companyId
/companies/:companyId/overview
/companies/:companyId/assessments
/companies/:companyId/reports
/companies/:companyId/activity
```

### Assessment workspace routes

```text
/companies/:companyId/assessments/:assessmentId
/companies/:companyId/assessments/:assessmentId/overview
/companies/:companyId/assessments/:assessmentId/findings
/companies/:companyId/assessments/:assessmentId/evidence
/companies/:companyId/assessments/:assessmentId/reports
/companies/:companyId/assessments/:assessmentId/history
```

The path segment remains `findings` for route compatibility, while user-facing terminology is Threats.

## Company scope

The router shell loads Companies through `companyService`.

The active company is resolved from:

- the company workspace URL;
- the selected company state;
- locally stored recent-company timestamps.

Company workspace routes verify that the company exists before rendering child content.

The global `/assessments` route redirects to the active company's assessment list or to the dashboard when no company is active.

## Service layer

Frontend services live in `src/services/`.

Persisted workflows use typed services for:

- Companies;
- Assessments;
- Threats;
- Evidence;
- Reports;
- Settings.

Pages and components should not construct database paths or call Prisma.

## Current presentation-only areas

Not every screen is fully backed by persisted APIs.

Current local fixture data is still used by parts of:

- the global Threats page;
- the global Reports page and report-detail navigation;
- the company Activity view.

The company and assessment workspaces are the primary persisted workflow.

## Responsive implementation

Frontend work should remain mobile-first. Component-level responsive behaviour may use container queries; viewport-wide layout changes may use media queries.
