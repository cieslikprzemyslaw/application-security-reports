import {
  EVIDENCE_TYPES,
  REPORT_STATUSES,
  assertInvalid,
  assertValid,
  activityFileSchema,
  activitySchema,
  assessmentListQuerySchema,
  assessmentRouteParamsSchema,
  assessmentsFileSchema,
  companiesFileSchema,
  companyRouteParamsSchema,
  createAssessmentRequestSchema,
  createCompanyRequestSchema,
  createEvidenceRequestSchema,
  createReportRequestSchema,
  createThreatOwaspCategoryCodeSchema,
  createThreatRequestSchema,
  evidenceListQuerySchema,
  evidenceRouteParamsSchema,
  evidenceSchema,
  evidenceTypeSchema,
  expectField,
  getFieldErrors,
  reportSchema,
  reportSnapshotSchema,
  reportStatusSchema,
  reportsFileSchema,
  reportVersionSchema,
  settingsFileSchema,
  settingsSchema,
  threatListQuerySchema,
  threatRouteParamsSchema,
  threatSchema,
  updateAssessmentRequestSchema,
  updateCompanyRequestSchema,
  updateEvidenceRequestSchema,
  updateReportRequestSchema,
  updateSettingsRequestSchema,
  updateThreatRequestSchema,
  validActivity,
  validAssessment,
  validCompany,
  validEvidence,
  validHttpEvidence,
  validReport,
  validReportSnapshot,
  validReportVersion,
  validSettings,
  validThreat,
  z,
} from './domain.schemas.test.support.js';

for (const status of REPORT_STATUSES) {
  assertValid(
    reportStatusSchema.safeParse(status).success,
    `Report status ${status} should pass`,
  );
}
assertInvalid(
  reportStatusSchema.safeParse('complete').success,
  'Unknown report status should fail',
);

for (const evidenceType of EVIDENCE_TYPES) {
  assertValid(
    evidenceTypeSchema.safeParse(evidenceType).success,
    `Evidence type ${evidenceType} should pass`,
  );
}

assertValid(
  z
    .object({
      owaspCategoryCode: createThreatOwaspCategoryCodeSchema('2025'),
    })
    .safeParse({ owaspCategoryCode: 'A09:2025' }).success,
  '2025 OWASP category code should pass for the 2025 taxonomy',
);
assertValid(
  z
    .object({
      owaspCategoryCode: createThreatOwaspCategoryCodeSchema('2025'),
    })
    .safeParse({ owaspCategoryCode: 'custom' }).success,
  'Custom OWASP category code should pass',
);
expectField(
  getFieldErrors(
    z.object({
      owaspCategoryCode: createThreatOwaspCategoryCodeSchema('2025'),
    }),
    { owaspCategoryCode: 'A09:2021' },
  ),
  'owaspCategoryCode',
  'Unsupported OWASP category code for assessment taxonomy version 2025',
);
expectField(
  getFieldErrors(threatSchema, { ...validThreat, severity: 'extreme' }),
  'severity',
  'Invalid enum value',
);

assertValid(
  evidenceSchema.safeParse({ ...validEvidence, threatIds: [] }).success,
  'Zero threat IDs should pass',
);
assertValid(
  evidenceSchema.safeParse(validHttpEvidence).success,
  'HTTP evidence with exchanges should pass',
);
expectField(
  getFieldErrors(evidenceSchema, { ...validEvidence, type: 'unknown' }),
  'type',
  'Invalid enum value',
);

assertValid(
  reportSchema.safeParse(validReport).success,
  'Valid report should pass',
);
assertValid(
  reportSnapshotSchema.safeParse(validReportSnapshot).success,
  'Valid report snapshot should pass',
);
assertValid(
  reportVersionSchema.safeParse(validReportVersion).success,
  'Valid report version should pass',
);
assertValid(
  activitySchema.safeParse(validActivity).success,
  'Valid activity should pass',
);
assertValid(
  settingsSchema.safeParse(validSettings).success,
  'Valid settings should pass',
);
assertValid(
  companiesFileSchema.safeParse([validCompany]).success,
  'Company file collection should pass',
);
assertValid(
  assessmentsFileSchema.safeParse([validAssessment]).success,
  'Assessment file collection should pass',
);
assertValid(
  reportsFileSchema.safeParse([validReport]).success,
  'Report file collection should pass',
);
assertValid(
  activityFileSchema.safeParse([validActivity]).success,
  'Activity file collection should pass',
);
assertValid(
  settingsFileSchema.safeParse(validSettings).success,
  'Settings file schema should pass',
);

assertValid(
  createAssessmentRequestSchema.safeParse({
    companyId: validCompany.id,
    title: 'Example',
    status: 'draft',
    applicationName: 'Customer Services Portal',
  }).success,
  'Create assessment request should pass',
);
expectField(
  getFieldErrors(createAssessmentRequestSchema, {
    companyId: validCompany.id,
    title: 'Example',
    status: 'draft',
  }),
  'applicationName',
  'Required',
);
expectField(
  getFieldErrors(updateAssessmentRequestSchema, {
    applicationName: '   ',
  }),
  'applicationName',
  'Text is required',
);
assertValid(
  createThreatRequestSchema.safeParse({
    assessmentId: validAssessment.id,
    title: 'Example',
    description: 'Example description',
    severity: 'low',
    strideCategories: ['spoofing'],
    status: 'open',
  }).success,
  'Create threat request should pass',
);
assertValid(
  createEvidenceRequestSchema.safeParse({
    assessmentId: validAssessment.id,
    threatIds: [],
    type: 'http',
    title: 'HTTP evidence',
    httpExchanges: validHttpEvidence.httpExchanges,
  }).success,
  'Create HTTP evidence request should pass',
);
assertValid(
  createReportRequestSchema.safeParse({
    assessmentId: validAssessment.id,
    title: 'Report',
    selectedThreatIds: [],
    executiveSummary: 'Summary',
  }).success,
  'Create report request should pass',
);
assertValid(
  createCompanyRequestSchema.safeParse({ name: 'Example Ltd' }).success,
  'Create company request should pass',
);
assertValid(
  updateCompanyRequestSchema.safeParse({ name: 'Updated name' }).success,
  'Partial company update should pass',
);
expectField(
  getFieldErrors(updateAssessmentRequestSchema, {}),
  '',
  'At least one assessment field is required',
);
expectField(
  getFieldErrors(updateThreatRequestSchema, {}),
  '',
  'At least one threat field is required',
);
expectField(
  getFieldErrors(updateEvidenceRequestSchema, {}),
  '',
  'At least one evidence field is required',
);
expectField(
  getFieldErrors(updateReportRequestSchema, {}),
  '',
  'At least one report field is required',
);
expectField(
  getFieldErrors(updateSettingsRequestSchema, {}),
  '',
  'At least one settings field is required',
);

assertValid(
  companyRouteParamsSchema.safeParse({
    id: 'cmp_00000000-0000-0000-0000-000000000001',
  }).success,
  'Company route params should pass',
);
assertValid(
  assessmentRouteParamsSchema.safeParse({
    id: 'asm_00000000-0000-0000-0000-000000000001',
  }).success,
  'Assessment route params should pass',
);
assertValid(
  threatRouteParamsSchema.safeParse({
    id: 'thr_00000000-0000-0000-0000-000000000001',
  }).success,
  'Threat route params should pass',
);
assertValid(
  evidenceRouteParamsSchema.safeParse({
    id: 'evd_00000000-0000-0000-0000-000000000001',
  }).success,
  'Evidence route params should pass',
);
assertValid(
  assessmentListQuerySchema.safeParse({ companyId: validCompany.id }).success,
  'Assessment list query should pass',
);
assertValid(
  threatListQuerySchema.safeParse({ assessmentId: validAssessment.id }).success,
  'Threat list query should pass',
);
assertValid(
  evidenceListQuerySchema.safeParse({
    assessmentId: validAssessment.id,
  }).success,
  'Evidence list query should pass',
);
