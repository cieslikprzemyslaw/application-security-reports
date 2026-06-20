import assert from 'node:assert/strict';

import { createAssessmentRepository } from '../../database/repositories/assessment.repository.js';
import { createCompanyRepository } from '../../database/repositories/company.repository.js';
import { createEvidenceRepository } from '../../database/repositories/evidence.repository.js';
import { createReportRepository } from '../../database/repositories/report.repository.js';
import { createThreatRepository } from '../../database/repositories/threat.repository.js';
import { createIntegrationDatabase, startCompanyApiServer } from './helpers.js';

const database = await createIntegrationDatabase('appsec-companies-overview-');

try {
  const companyRepo = createCompanyRepository(database.prisma);
  const assessmentRepo = createAssessmentRepository(database.prisma);
  const threatRepo = createThreatRepository(database.prisma);
  const evidenceRepo = createEvidenceRepository(database.prisma);
  const reportRepo = createReportRepository(database.prisma);
  const server = await startCompanyApiServer({
    companyRepository: companyRepo,
    assessmentRepository: assessmentRepo,
    threatRepository: threatRepo,
    evidenceRepository: evidenceRepo,
    reportRepository: reportRepo,
  });

  try {
    const overviewCompany = await companyRepo.create({
      name: 'Overview Corp',
      description: undefined,
      website: undefined,
      contactName: undefined,
      contactEmail: undefined,
      footerText: undefined,
    });

    await assessmentRepo.create({
      companyId: overviewCompany.id,
      title: 'Draft Assessment',
      status: 'draft',
      description: undefined,
      scope: undefined,
      startedAt: undefined,
      completedAt: undefined,
      applicationName: 'Admin Panel',
      environment: undefined,
      assessmentType: 'Web App',
      overallRisk: 'high',
    });

    await assessmentRepo.create({
      companyId: overviewCompany.id,
      title: 'In Progress Assessment',
      status: 'in-progress',
      description: undefined,
      scope: undefined,
      startedAt: undefined,
      completedAt: undefined,
      applicationName: 'Customer Portal',
      environment: undefined,
      assessmentType: 'Web App',
      overallRisk: 'medium',
    });

    const overviewAssessment = (
      await assessmentRepo.findByCompanyId(overviewCompany.id)
    ).find(assessment => assessment.title === 'In Progress Assessment')!;

    const overviewThreat = await threatRepo.create({
      assessmentId: overviewAssessment.id,
      title: 'Broken access control',
      description: 'Unauthorized access to another account record.',
      severity: 'high',
      strideCategories: ['spoofing'],
      status: 'open',
      affectedAsset: 'API',
      impact: undefined,
      recommendation: undefined,
      observation: undefined,
      affectedComponent: undefined,
      affectedEndpoint: undefined,
      risk: undefined,
    });

    await evidenceRepo.create({
      assessmentId: overviewAssessment.id,
      threatIds: [overviewThreat.id],
      type: 'note',
      title: 'Access log',
      description: 'Captured request showing cross-account access.',
      content: undefined,
      fileName: undefined,
      filePath: undefined,
      mimeType: undefined,
      capturedAt: '2026-06-15',
    });

    await reportRepo.create({
      assessmentId: overviewAssessment.id,
      title: 'Draft report',
      status: 'draft',
      latestVersion: 1,
      executiveSummary: undefined,
      selectedThreatIds: [overviewThreat.id],
    });

    await reportRepo.create({
      assessmentId: overviewAssessment.id,
      title: 'Final report',
      status: 'draft',
      latestVersion: 2,
      executiveSummary: undefined,
      selectedThreatIds: [overviewThreat.id],
    });

    const overviewResponse = await fetch(
      server.baseUrl +
        '/api/companies/' +
        overviewCompany.id +
        '/assessments/' +
        overviewAssessment.id +
        '/overview',
    );

    assert.equal(overviewResponse.status, 200);
    const overviewJson = (await overviewResponse.json()) as {
      data: {
        company: { id: string; name: string };
        assessment: {
          id: string;
          status: string;
          recordVersion: number;
          findingsCount: number;
          evidenceCount: number;
          reportVersionCount: number;
          availableActions: string[];
        };
      };
    };

    assert.equal(overviewJson.data.company.id, overviewCompany.id);
    assert.equal(overviewJson.data.company.name, 'Overview Corp');
    assert.equal(overviewJson.data.assessment.id, overviewAssessment.id);
    assert.equal(overviewJson.data.assessment.status, 'in-progress');
    assert.equal(typeof overviewJson.data.assessment.recordVersion, 'number');
    assert.equal(overviewJson.data.assessment.findingsCount, 1);
    assert.equal(overviewJson.data.assessment.evidenceCount, 1);
    assert.equal(overviewJson.data.assessment.reportVersionCount, 2);
    assert.deepEqual(overviewJson.data.assessment.availableActions, [
      'complete',
      'archive',
    ]);

    const notFoundResponse = await fetch(
      server.baseUrl +
        '/api/companies/cmp_00000000-0000-0000-0000-000000000099' +
        '/assessments/' +
        overviewAssessment.id +
        '/overview',
    );

    assert.equal(notFoundResponse.status, 404);
    assert.deepEqual(await notFoundResponse.json(), {
      error: {
        code: 'COMPANY_NOT_FOUND',
        message: 'Company not found',
        details: [],
      },
    });

    const missingAssessmentResponse = await fetch(
      server.baseUrl +
        '/api/companies/' +
        overviewCompany.id +
        '/assessments/asm_00000000-0000-0000-0000-000000000099/overview',
    );

    assert.equal(missingAssessmentResponse.status, 404);
    assert.deepEqual(await missingAssessmentResponse.json(), {
      error: {
        code: 'ASSESSMENT_NOT_FOUND',
        message: 'Assessment not found',
        details: [],
      },
    });

    const otherCompany = await companyRepo.create({
      name: 'Other Corp',
      description: undefined,
      website: undefined,
      contactName: undefined,
      contactEmail: undefined,
      footerText: undefined,
    });

    const otherAssessment = await assessmentRepo.create({
      companyId: otherCompany.id,
      title: 'Other assessment',
      status: 'draft',
      description: undefined,
      scope: undefined,
      startedAt: undefined,
      completedAt: undefined,
      applicationName: 'Other App',
      environment: undefined,
      assessmentType: 'Web App',
      overallRisk: 'low',
    });

    const mismatchedResponse = await fetch(
      server.baseUrl +
        '/api/companies/' +
        overviewCompany.id +
        '/assessments/' +
        otherAssessment.id +
        '/overview',
    );

    assert.equal(mismatchedResponse.status, 404);
    assert.deepEqual(await mismatchedResponse.json(), {
      error: {
        code: 'ASSESSMENT_NOT_FOUND',
        message: 'Assessment not found',
        details: [],
      },
    });
  } finally {
    await server.close();
  }
} finally {
  await database.cleanup();
}
