import assert from 'node:assert/strict';
import type { Assessment } from '../../../src/domain/assessment.js';
import type { Threat } from '../../../src/domain/threat.js';

import { startTestServer, readJson, createApp } from './support.js';
import {
  evidenceEarly,
  evidenceForThreatA,
  evidenceLate,
  report,
  threatA,
  threatB,
} from './fixtures.js';
import {
  createReportRepository,
  createAssessmentRepository,
  createCompanyRepository,
  createThreatRepository,
  createEvidenceRepository,
  createSettingsRepository,
} from './repositories.js';

{
  const { repository: reportRepository } = createReportRepository({
    findById: async () => report,
  });
  const { repository: assessmentRepository } = createAssessmentRepository();
  const { repository: companyRepository } = createCompanyRepository();
  const { repository: threatRepository } = createThreatRepository({
    findByAssessmentId: async () => [threatB, threatA],
  });
  const { repository: evidenceRepository } = createEvidenceRepository({
    findByAssessmentId: async () => [
      evidenceLate,
      evidenceEarly,
      evidenceForThreatA,
    ],
  });
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

    assert.equal(response.status, 200);
    const body = await readJson<{
      data: {
        report: typeof report;
        assessments: Array<{
          assessment: Assessment;
          findings: Array<{
            threat: Threat;
            evidence: Array<{ id: string; filePath?: never }>;
          }>;
        }>;
        branding: {
          issuerLogoId?: string;
          reportConfidentialityLabel?: string;
          defaultBrandingMode?: string;
        };
        snapshot: {
          branding: {
            issuerLogoId?: string;
            confidentialityLabel?: string;
            brandingMode?: string;
          };
        };
      };
    }>(response);
    assert.equal(body.data.report.id, report.id);
    assert.equal(body.data.assessments.length, 1);
    assert.equal(body.data.assessments[0]?.findings[0]?.threat.id, threatB.id);
    assert.equal(body.data.assessments[0]?.findings[1]?.threat.id, threatA.id);
    assert.deepEqual(
      body.data.assessments[0]?.findings[0]?.evidence.map(item => item.id),
      [evidenceEarly.id, evidenceLate.id],
    );
    assert.deepEqual(
      body.data.assessments[0]?.findings[1]?.evidence.map(item => item.id),
      [evidenceForThreatA.id],
    );
    assert.equal(
      'filePath' in (body.data.assessments[0]?.findings[0]?.evidence[0] ?? {}),
      false,
    );
    assert.equal(
      body.data.branding.issuerLogoId,
      'logo_00000000-0000-0000-0000-000000000001',
    );
    assert.equal(
      body.data.branding.reportConfidentialityLabel,
      'Strictly confidential',
    );
    assert.equal(body.data.branding.defaultBrandingMode, 'issuer');
    assert.equal(
      body.data.snapshot.branding.issuerLogoId,
      'logo_00000000-0000-0000-0000-000000000001',
    );
    assert.equal(
      body.data.snapshot.branding.confidentialityLabel,
      'Strictly confidential',
    );
    assert.equal(body.data.snapshot.branding.brandingMode, 'issuer');
  } finally {
    await server.close();
  }
}
