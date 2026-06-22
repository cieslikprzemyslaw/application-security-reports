import assert from 'node:assert/strict';

import {
  startTestServer,
  readJson,
  createApp,
  type ApiErrorBody,
} from './support.js';
import { foreignThreat, report, threatA, threatB } from './fixtures.js';
import {
  createReportRepository,
  createAssessmentRepository,
  createCompanyRepository,
  createThreatRepository,
  createEvidenceRepository,
  createSettingsRepository,
} from './repositories.js';

{
  const { repository: reportRepository } = createReportRepository();
  const { findByIdCalls, repository: assessmentRepository } =
    createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { repository: evidenceRepository } = createEvidenceRepository();
  const { repository: settingsRepository } = createSettingsRepository();
  const server = await startTestServer(
    createApp(
      reportRepository,
      assessmentRepository,
      companyRepository,
      threatRepository,
      evidenceRepository,
      settingsRepository,
    ),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/reports/not-an-id`);

    assert.equal(response.status, 400);
    assert.equal(findByIdCalls(), 0);
    const body = await readJson<ApiErrorBody>(response);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(
      body.error.details.some(detail => detail.path === 'id'),
      'Expected the invalid report ID to be reported',
    );
  } finally {
    await server.close();
  }
}

{
  const { repository: reportRepository } = createReportRepository({
    findById: async () => null,
  });
  const { findByIdCalls, repository: assessmentRepository } =
    createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const { repository: threatRepository } = createThreatRepository();
  const { repository: evidenceRepository } = createEvidenceRepository();
  const { repository: settingsRepository } = createSettingsRepository();
  const server = await startTestServer(
    createApp(
      reportRepository,
      assessmentRepository,
      companyRepository,
      threatRepository,
      evidenceRepository,
      settingsRepository,
    ),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/reports/${report.id}`);

    assert.equal(response.status, 404);
    assert.equal(findByIdCalls(), 0);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'REPORT_NOT_FOUND',
        message: 'Report not found',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

{
  const { repository: reportRepository } = createReportRepository({
    findById: async () => ({
      ...report,
      selectedThreatIds: [foreignThreat.id],
    }),
  });
  const { repository: assessmentRepository } = createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const { repository: threatRepository } = createThreatRepository({
    findByAssessmentId: async () => [threatA, threatB],
  });
  const { repository: evidenceRepository } = createEvidenceRepository();
  const { repository: settingsRepository } = createSettingsRepository();
  const server = await startTestServer(
    createApp(
      reportRepository,
      assessmentRepository,
      companyRepository,
      threatRepository,
      evidenceRepository,
      settingsRepository,
    ),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/reports/${report.id}`);

    assert.equal(response.status, 400);
    assert.deepEqual(await readJson(response), {
      error: {
        code: 'REPORT_INVALID_RELATIONSHIP',
        message: 'Report contains invalid related records',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
}

console.log('reports API route checks passed');
