import assert from 'node:assert/strict';

import { ValidationError } from '../../../src/validation/index.js';
import { createTemporaryDatabase } from '../../test/temporaryDatabase.js';
import { RepositoryConstraintError } from '../errors.js';
import { createActivityRepository } from './activity.repository.js';
import { createAssessmentRepository } from './assessment.repository.js';
import { createCompanyRepository } from './company.repository.js';
import { createEvidenceRepository } from './evidence.repository.js';
import { createReportRepository } from './report.repository.js';
import { createSettingsRepository } from './settings.repository.js';
import { createThreatRepository } from './threat.repository.js';

const database = await createTemporaryDatabase();
const { prisma } = database;

try {
  const companyRepo = createCompanyRepository(prisma);
  const assessmentRepo = createAssessmentRepository(prisma);
  const threatRepo = createThreatRepository(prisma);
  const evidenceRepo = createEvidenceRepository(prisma);
  const reportRepo = createReportRepository(prisma);
  const activityRepo = createActivityRepository(prisma);
  const settingsRepo = createSettingsRepository(prisma);

  const company = await companyRepo.create({
    name: 'Northstar Digital',
    description: 'Security consulting',
    website: 'https://northstar.example',
    contactName: 'Ada Lovelace',
    contactEmail: 'ada@example.com',
    footerText: undefined,
  });

  assert.ok(company.id.startsWith('cmp_'));
  assert.equal((await companyRepo.findById(company.id))?.id, company.id);

  const assessment = await assessmentRepo.create({
    companyId: company.id,
    title: 'API review',
    description: 'Main review',
    scope: 'Backend API',
    status: 'draft',
    startedAt: '2026-06-01',
    completedAt: undefined,
    applicationName: 'AppSec Report Builder',
    environment: 'local',
    assessmentType: 'web',
    overallRisk: 'medium',
  });
  assert.equal(assessment.owaspTaxonomyVersion, '2025');

  const updatedAssessment = await assessmentRepo.update(assessment.id, {
    title: 'API review - updated',
  });
  assert.equal(updatedAssessment.owaspTaxonomyVersion, '2025');
  const storedAssessment = await prisma.assessment.findUnique({
    where: { id: assessment.id },
    select: { owaspTaxonomyVersion: true },
  });
  assert.equal(storedAssessment?.owaspTaxonomyVersion, '2025');

  const legacyAssessment = await assessmentRepo.create({
    companyId: company.id,
    title: 'Legacy review',
    description: 'Historical taxonomy data',
    scope: 'Backend API',
    status: 'draft',
    startedAt: '2026-06-03',
    completedAt: undefined,
    applicationName: 'AppSec Report Builder',
    environment: 'local',
    assessmentType: 'web',
    overallRisk: 'medium',
  });
  await prisma.assessment.update({
    where: { id: legacyAssessment.id },
    data: { owaspTaxonomyVersion: '2021' },
  });

  await assert.rejects(
    threatRepo.create({
      assessmentId: legacyAssessment.id,
      title: 'Injection risk',
      description: 'Test threat',
      severity: 'high',
      strideCategories: ['tampering', 'spoofing'],
      status: 'open',
      owaspCategoryCode: 'A09:2025',
      affectedAsset: 'API',
      impact: undefined,
      recommendation: 'Use parameterized queries',
      remediation: undefined,
      observation: undefined,
      reproductionSteps: undefined,
      affectedComponent: undefined,
      affectedEndpoint: undefined,
      risk: undefined,
      references: undefined,
    }),
    error => error instanceof ValidationError,
  );

  const legacyThreats = await threatRepo.findByAssessmentId(
    legacyAssessment.id,
  );
  assert.equal(legacyThreats.length, 0);

  const threat = await threatRepo.create({
    assessmentId: assessment.id,
    title: 'Injection risk',
    description: 'Test threat',
    severity: 'high',
    strideCategories: ['tampering', 'spoofing'],
    status: 'open',
    owaspCategoryCode: 'A09:2025',
    affectedAsset: 'API',
    impact: undefined,
    recommendation: 'Use parameterized queries',
    observation: undefined,
    affectedComponent: undefined,
    affectedEndpoint: undefined,
    risk: undefined,
  });

  const originalThreat = await threatRepo.findById(threat.id);

  await assert.rejects(
    threatRepo.update(threat.id, {
      title: 'Injection risk - updated',
      owaspCategoryCode: 'A09:2021',
    }),
    error => error instanceof ValidationError,
  );

  const preservedThreat = await threatRepo.findById(threat.id);
  assert.equal(preservedThreat?.title, originalThreat?.title);
  assert.equal(
    preservedThreat?.owaspCategoryCode,
    originalThreat?.owaspCategoryCode,
  );

  const evidence = await evidenceRepo.create({
    assessmentId: assessment.id,
    threatIds: [threat.id],
    type: 'note',
    title: 'Request log',
    description: 'Captured evidence',
    content: 'payload',
    fileName: undefined,
    filePath: undefined,
    mimeType: undefined,
    capturedAt: '2026-06-02',
  });

  const report = await reportRepo.create({
    assessmentId: assessment.id,
    title: 'Final report',
    status: 'draft',
    latestVersion: 1,
    executiveSummary: 'Summary',
    selectedThreatIds: [],
  });

  const activity = await activityRepo.create({
    entityType: 'assessment',
    entityId: assessment.id,
    action: 'created',
    message: 'Assessment created',
  });

  const settings = await settingsRepo.upsert({
    organisationName: 'Northstar Digital',
    consultantName: 'Ada Lovelace',
    consultantEmail: 'ada@example.com',
    issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
    defaultReportTitle: 'Security report',
    defaultSeverity: 'medium',
    theme: 'system',
    dateFormat: 'YYYY-MM-DD',
    reportFooterText: 'Confidential',
    reportConfidentialityLabel: 'Confidential',
    methodology: 'OWASP',
    reportStyle: 'Narrative',
    includeEvidence: true,
    confidentialReports: false,
    allowedBrandingModes: ['issuer', 'client'],
    defaultBrandingMode: 'issuer',
  });

  assert.ok(evidence.threatIds.includes(threat.id));
  assert.ok(activity.id.startsWith('act_'));
  const loadedSettings = await settingsRepo.get();
  assert.equal(loadedSettings?.id, settings.id);
  assert.equal(
    loadedSettings?.issuerLogoId,
    'logo_00000000-0000-0000-0000-000000000001',
  );
  assert.deepEqual(loadedSettings?.allowedBrandingModes, ['issuer', 'client']);
  assert.equal(loadedSettings?.defaultBrandingMode, 'issuer');

  const settingsWithoutLogo = await settingsRepo.updateIssuerLogoId(null);
  assert.equal(settingsWithoutLogo.issuerLogoId, undefined);
  const settingsWithReplacementLogo = await settingsRepo.updateIssuerLogoId(
    'logo_00000000-0000-0000-0000-000000000002',
  );
  assert.equal(
    settingsWithReplacementLogo.issuerLogoId,
    'logo_00000000-0000-0000-0000-000000000002',
  );

  const loadedThreats = await threatRepo.findByAssessmentId(assessment.id);
  assert.equal(loadedThreats.length, 1);

  const loadedEvidence = await evidenceRepo.findById(evidence.id);
  assert.ok(loadedEvidence);
  assert.deepEqual(loadedEvidence?.threatIds, [threat.id]);

  await reportRepo.attachThreat(report.id, threat.id);
  const loadedReportAfterAttach = await reportRepo.findById(report.id);
  assert.ok(loadedReportAfterAttach);
  assert.deepEqual(loadedReportAfterAttach?.selectedThreatIds, [threat.id]);

  await reportRepo.detachThreat(report.id, threat.id);
  const loadedReportAfterDetach = await reportRepo.findById(report.id);
  assert.ok(loadedReportAfterDetach);
  assert.deepEqual(loadedReportAfterDetach?.selectedThreatIds, []);

  await assert.rejects(
    companyRepo.delete(company.id),
    error => error instanceof RepositoryConstraintError,
  );
} finally {
  await database.cleanup();
}

console.log('repository integration checks passed');
