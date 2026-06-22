import assert from 'node:assert/strict';

import {
  createReportsApp,
  startTestServer,
  type ReportsRouteIntegrationHarness,
} from './support.js';

export const runReportsRouteIntegrationCases = async ({
  companyRepository,
  assessmentRepository,
  threatRepository,
  evidenceRepository,
  reportRepository,
  settingsRepository,
  company,
  assessment,
  threatA,
  threatB,
  foreignThreat,
  report,
  evidenceRequest,
  evidenceResponse,
  prisma,
}: ReportsRouteIntegrationHarness) => {
  const server = await startTestServer(
    createReportsApp(
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
    const body = (await response.json()) as {
      data: {
        report: { id: string; selectedThreatIds: string[] };
        company: { id: string; name: string };
        assessments: Array<{
          assessment: { id: string };
          findings: Array<{
            threat: { id: string };
            evidence: Array<{ id: string; filePath?: string }>;
          }>;
        }>;
        branding: {
          issuerLogoId?: string;
          reportFooterText?: string;
          reportConfidentialityLabel?: string;
          confidentialReports?: boolean;
          defaultBrandingMode?: string;
        };
        configuration: { methodology?: string; includeEvidence?: boolean };
        snapshot: {
          branding: {
            issuerLogoId?: string;
            clientName: string;
            confidentialityLabel?: string;
            brandingMode?: string;
          };
        };
      };
    };

    assert.equal(body.data.report.id, report.id);
    assert.equal(body.data.company.id, company.id);
    assert.deepEqual(body.data.report.selectedThreatIds, [
      threatA.id,
      threatB.id,
    ]);
    assert.equal(body.data.assessments.length, 1);
    assert.equal(body.data.assessments[0]?.assessment.id, assessment.id);
    assert.deepEqual(
      body.data.assessments[0]?.findings.map(finding => finding.threat.id),
      [threatA.id, threatB.id],
    );
    assert.deepEqual(
      body.data.assessments[0]?.findings[0]?.evidence.map(item => item.id),
      ['evd_00000000-0000-0000-0000-000000000003'],
    );
    assert.deepEqual(
      body.data.assessments[0]?.findings[1]?.evidence.map(item => item.id),
      [evidenceRequest.id, evidenceResponse.id],
    );
    assert.equal(
      'filePath' in (body.data.assessments[0]?.findings[0]?.evidence[0] ?? {}),
      false,
    );
    assert.equal(body.data.branding.reportFooterText, 'Confidential');
    assert.equal(
      body.data.branding.reportConfidentialityLabel,
      'Strictly confidential',
    );
    assert.equal(body.data.branding.confidentialReports, true);
    assert.equal(
      body.data.branding.issuerLogoId,
      'logo_00000000-0000-0000-0000-000000000001',
    );
    assert.equal(body.data.branding.defaultBrandingMode, 'issuer');
    assert.equal(
      body.data.snapshot.branding.issuerLogoId,
      'logo_00000000-0000-0000-0000-000000000001',
    );
    assert.equal(body.data.snapshot.branding.clientName, company.name);
    assert.equal(
      body.data.snapshot.branding.confidentialityLabel,
      'Strictly confidential',
    );
    assert.equal(body.data.snapshot.branding.brandingMode, 'issuer');
    assert.equal(body.data.configuration.methodology, 'OWASP ASVS / WSTG');
    assert.equal(body.data.configuration.includeEvidence, true);
  } finally {
    await server.close();
  }

  const invalidReport = await prisma.report.create({
    data: {
      id: 'rpt_00000000-0000-0000-0000-000000000099',
      assessmentId: assessment.id,
      title: 'Broken report',
      status: 'draft',
      selectedThreats: {
        create: [{ threatId: foreignThreat.id }],
      },
    },
  });

  const brokenServer = await startTestServer(
    createReportsApp(
      reportRepository,
      assessmentRepository,
      companyRepository,
      threatRepository,
      evidenceRepository,
      settingsRepository,
    ),
  );

  try {
    const response = await fetch(
      `${brokenServer.baseUrl}/api/reports/${invalidReport.id}`,
    );

    assert.equal(response.status, 400);
    const body = (await response.json()) as {
      error: { code: string; message: string; details: [] };
    };
    assert.deepEqual(body, {
      error: {
        code: 'REPORT_INVALID_RELATIONSHIP',
        message: 'Report contains invalid related records',
        details: [],
      },
    });
  } finally {
    await brokenServer.close();
  }
};
