import { describe, it } from 'vitest';

describe.sequential('backend regression coverage', () => {
  it('server/config.test.ts', async () => {
    await import('../../config.test.js');
  }, 120_000);

  it('server/http/api-app.test.ts', async () => {
    await import('../../http/api-app.test.js');
  }, 120_000);

  it('server/http/assessments.route.integration.test.ts', async () => {
    await import('../../http/assessments.route.integration.test.js');
  }, 120_000);

  it('server/http/assessments.route.test.ts', async () => {
    await import('../../http/assessments.route.test.js');
  }, 120_000);

  it('server/http/companies.route.integration.test.ts', async () => {
    await import('../../http/companies.route.integration.test.js');
  }, 120_000);

  it('server/http/companies.route.test.ts', async () => {
    await import('../../http/companies.route.test.js');
  }, 120_000);

  it('server/http/evidence.route.integration.test.ts', async () => {
    await import('../../http/evidence.route.integration.test.js');
  }, 120_000);

  it('server/http/evidence.route.test.ts', async () => {
    await import('../../http/evidence.route.test.js');
  }, 120_000);

  it('server/http/reports.route.integration.test.ts', async () => {
    await import('../../http/reports.route.integration.test.js');
  }, 120_000);

  it('server/http/reports.route.test.ts', async () => {
    await import('../../http/reports.route.test.js');
  }, 120_000);

  it('server/http/settings.route.integration.test.ts', async () => {
    await import('../../http/settings.route.integration.test.js');
  }, 120_000);

  it('server/http/settings.route.test.ts', async () => {
    await import('../../http/settings.route.test.js');
  }, 120_000);

  it('server/http/shutdown.test.ts', async () => {
    await import('../../http/shutdown.test.js');
  }, 120_000);

  it('server/http/threats.route.integration.test.ts', async () => {
    await import('../../http/threats.route.integration.test.js');
  }, 120_000);

  it('server/http/threats.route.test.ts', async () => {
    await import('../../http/threats.route.test.js');
  }, 120_000);

  it('server/services/companyLogoStorage.test.ts', async () => {
    await import('../../services/companyLogoStorage.test.js');
  }, 120_000);

  it('server/services/jsonFileStore.test.ts', async () => {
    await import('../../services/jsonFileStore.test.js');
  }, 120_000);

  it('server/utils/id.test.ts', async () => {
    await import('../../utils/id.test.js');
  }, 120_000);

  it('src/domain/domain.types.test.ts', async () => {
    await import('../../../src/domain/domain.types.test.js');
  }, 120_000);

  it('src/domain/owaspTop10.test.ts', async () => {
    await import('../../../src/domain/owaspTop10.test.js');
  }, 120_000);

  it('src/domain/schemas/company.schema.test.ts', async () => {
    await import('../../../src/domain/schemas/company.schema.test.js');
  }, 120_000);

  it('src/domain/schemas/domain.schemas.test.ts', async () => {
    await import('../../../src/domain/schemas/domain.schemas.test.js');
  }, 120_000);

  it('src/utils/httpParser.response.test.ts', async () => {
    await import('../../../src/utils/httpParser.response.test.js');
  }, 120_000);

  it('src/utils/httpParser.test.ts', async () => {
    await import('../../../src/utils/httpParser.test.js');
  }, 120_000);

  it('src/validation/path-boundary.test.ts', async () => {
    await import('../../../src/validation/path-boundary.test.js');
  }, 120_000);

  it('src/validation/validation.test.ts', async () => {
    await import('../../../src/validation/validation.test.js');
  }, 120_000);
});
