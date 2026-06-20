import assert from 'node:assert/strict';

import {
  OWASP_TOP_10_CURRENT_VERSION,
  assessmentRow,
  companyRow,
  createAssessmentDb,
  createAssessmentRepository,
  createCompanyDb,
  createCompanyRepository,
  createThreatDb,
  createThreatRepository,
  threatRow,
} from './repositories.test.support.js';

{
  const { calls, db } = createCompanyDb();
  const repository = createCompanyRepository(db);
  const companies = await repository.findAll();
  const missingCompany = await repository.findById('cmp_missing');

  assert.equal(companies[0].id, companyRow.id);
  assert.equal(companies[0].logoUrl, null);
  assert.equal(calls[0]?.method, 'findMany');
  assert.equal(missingCompany, null);
}

{
  const { calls, db } = createCompanyDb();
  const repository = createCompanyRepository(db);

  await repository.create({
    name: 'Example Security',
    description: undefined,
    website: undefined,
    contactName: undefined,
    contactEmail: undefined,
    footerText: undefined,
  });

  const createArgs = calls.find(call => call.method === 'create')?.args as {
    data?: { logoUrl?: string | null };
  };

  assert.equal(createArgs?.data?.logoUrl, undefined);
}

{
  const { calls, db } = createAssessmentDb();
  const repository = createAssessmentRepository(db);
  const assessments = await repository.findByCompanyId('cmp_123');

  assert.equal(assessments[0].id, assessmentRow.id);
  assert.equal(assessments[0].applicationName, null);
  assert.equal(calls[0]?.method, 'findMany');
}

{
  const { calls, db } = createAssessmentDb();
  const repository = createAssessmentRepository(db);
  const createdAssessment = await repository.create({
    companyId: 'cmp_123',
    title: 'Assessment',
    description: undefined,
    scope: undefined,
    status: 'draft',
    startedAt: undefined,
    completedAt: undefined,
    applicationName: 'Customer Services Portal',
    environment: undefined,
    assessmentType: undefined,
    overallRisk: undefined,
  });

  assert.equal(createdAssessment.owaspTaxonomyVersion, '2025');
  const createArgs = calls.find(call => call.method === 'create')?.args as {
    data?: { applicationName?: string; owaspTaxonomyVersion?: string };
  };
  assert.equal(createArgs?.data?.applicationName, 'Customer Services Portal');
  assert.equal(createArgs?.data?.owaspTaxonomyVersion, '2025');
}

{
  const { calls, db } = createThreatDb();
  const repository = createThreatRepository(db);
  const threats = await repository.findByAssessmentId('asm_123');

  assert.equal(threats[0].id, threatRow.id);
  assert.equal(calls[0]?.method, 'findMany');
}

{
  const { calls, db } = createThreatDb();
  const repository = createThreatRepository(db);
  const createdThreat = await repository.create({
    assessmentId: assessmentRow.id,
    title: 'Threat',
    description: 'A test threat',
    severity: 'high',
    strideCategories: ['spoofing'],
    status: 'open',
    owaspCategoryCode: 'A09:2025',
    affectedAsset: undefined,
    impact: undefined,
    recommendation: undefined,
    remediation: undefined,
    observation: undefined,
    reproductionSteps: undefined,
    affectedComponent: undefined,
    affectedEndpoint: undefined,
    risk: undefined,
    references: undefined,
  });

  assert.equal(createdThreat.id, threatRow.id);
  assert.equal(calls[0]?.method, 'assessment.findUnique');
  assert.equal(calls[1]?.method, 'create');
}

{
  const { calls, db } = createThreatDb({
    ...assessmentRow,
    owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
  });
  const repository = createThreatRepository(db);

  await assert.rejects(
    repository.create({
      assessmentId: assessmentRow.id,
      title: 'Threat',
      description: 'A test threat',
      severity: 'high',
      strideCategories: ['spoofing'],
      status: 'open',
      owaspCategoryCode: 'A09:2021',
      affectedAsset: undefined,
      impact: undefined,
      recommendation: undefined,
      remediation: undefined,
      observation: undefined,
      reproductionSteps: undefined,
      affectedComponent: undefined,
      affectedEndpoint: undefined,
      risk: undefined,
      references: undefined,
    }),
    error => error instanceof Error && error.name === 'ValidationError',
  );

  assert.equal(calls[0]?.method, 'assessment.findUnique');
  assert.equal(
    calls.some(call => call.method === 'create'),
    false,
  );
}
