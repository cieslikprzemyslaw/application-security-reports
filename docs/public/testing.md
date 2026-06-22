# Testing

## Test runner

The repository uses Vitest projects for frontend and backend coverage.

- frontend tests use jsdom;
- backend tests run in Node;
- repository and route integration tests may use temporary SQLite databases;
- temporary database helpers apply the tracked migrations and remove the database after the test.

Tests must not use the developer's normal `dev.db`.

## Main commands

```powershell
npm test
npm run test:watch
npm run test:frontend
npm run test:backend
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Full registered validation:

```powershell
npm run validate
```

`validate` runs:

1. Prisma schema validation;
2. Prettier check;
3. ESLint;
4. TypeScript checks;
5. the complete Vitest suite;
6. client and server builds.

## Focused domain suites

```powershell
npm run test:assessment

npm run test:threat
npm run test:threat-api
npm run test:threat-workflow

npm run test:evidence
npm run test:evidence-api
npm run test:evidence-workflow

npm run test:report
npm run test:report-api
npm run test:report-workflow

npm run test:settings-api
npm run test:settings-workflow
```

Focused commands are useful during implementation. CI remains responsible for repository-wide validation.

## Coverage expectations

Tests should cover the relevant layer without duplicating another layer unnecessarily.

### Schema tests

- valid create and update inputs;
- invalid values;
- unknown properties;
- immutable or server-owned fields;
- cross-field rules.

### Repository tests

- domain mapping;
- ordering and filtering;
- ID generation;
- relationships;
- transactions;
- safe error mapping;
- temporary SQLite integration where persistence behaviour matters.

### API integration tests

- production API composition;
- success responses;
- validation;
- missing records;
- conflicts;
- relationship rules;
- safe public errors;
- rejected writes preserving persisted state.

### Frontend workflow tests

- production router and provider composition;
- loading, empty, populated, and error states;
- user actions;
- failed requests preserving confirmed UI state;
- observable routing and service behaviour.

## Documentation changes

For documentation-only changes, at minimum run:

```powershell
npm run format:check
git diff --check
```

Do not state that a command was executed unless it was actually run.
