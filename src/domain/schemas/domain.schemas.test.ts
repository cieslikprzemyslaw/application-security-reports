import assert from 'node:assert/strict';
import { z } from 'zod';

import {
  ASSESSMENT_STATUSES,
  EVIDENCE_TYPES,
  REPORT_STATUSES,
  SEVERITIES,
  STRIDE_CATEGORIES,
  THREAT_STATUSES,
} from '../common.js';
import { DATE_FORMATS, THEME_PREFERENCES } from '../settings.js';

import {
  assessmentSchema,
  assessmentsFileSchema,
  assessmentStatusSchema,
  activitySchema,
  companySchema,
  companiesFileSchema,
  createAssessmentRequestSchema,
  createCompanyRequestSchema,
  createEvidenceRequestSchema,
  createReportRequestSchema,
  createThreatRequestSchema,
  evidenceSchema,
  evidenceTypeSchema,
  reportSchema,
  reportSnapshotSchema,
  reportStatusSchema,
  reportVersionSchema,
  reportsFileSchema,
  settingsSchema,
  severitySchema,
  strideCategorySchema,
  threatSchema,
  threatStatusSchema,
  updateAssessmentRequestSchema,
  updateCompanyRequestSchema,
  updateEvidenceRequestSchema,
  updateReportRequestSchema,
  updateSettingsRequestSchema,
  updateThreatRequestSchema,
  activityFileSchema,
  settingsFileSchema,
  isoDateTimeStringSchema,
} from './index.js';
import {
  dateFormatSchema,
  isoDateStringSchema,
  themePreferenceSchema,
  timestampSchema,
} from './common.schema.js';
import { formatValidationErrors } from '../../validation/index.js';

const assertValid = (success: boolean, message: string) => {
  assert.equal(success, true, message);
};

const assertInvalid = (success: boolean, message: string) => {
  assert.equal(success, false, message);
};

const getFieldErrors = (schema: z.ZodTypeAny, value: unknown) => {
  const result = schema.safeParse(value);

  assertInvalid(result.success, 'Expected validation to fail');

  if (result.success) {
    throw new Error('Expected validation to fail');
  }

  return formatValidationErrors(result.error).fields;
};

const expectField = (
  fields: Array<{ path: string; message: string }>,
  path: string,
  messageIncludes: string,
) => {
  assert.ok(
    fields.some(
      field => field.path === path && field.message.includes(messageIncludes),
    ),
    `Expected validation error at ${path} containing ${messageIncludes}`,
  );
};

const validCompany = {
  id: 'cmp_1',
  name: 'Northstar Digital',
  description: 'Security and engineering partner',
  website: 'https://northstar.example',
  contactName: 'Alex Mercer',
  contactEmail: 'security@northstar.example',
  logoPath: '/logos/northstar.svg',
  footerText: 'Confidential',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};

const validAssessment = {
  id: 'asm_1',
  companyId: validCompany.id,
  title: 'Customer Services Portal',
  description: 'Assessment of the customer portal',
  scope: 'Web application',
  status: 'in-progress',
  startedAt: '2026-06-01',
  completedAt: '2026-06-10',
  applicationName: 'Customer Services Portal',
  environment: 'Production',
  assessmentType: 'Web App',
  overallRisk: 'high',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};

const validThreat = {
  id: 'thr_1',
  assessmentId: validAssessment.id,
  title: 'Missing Server-Side Authorization',
  description: 'The endpoint returns another customer order.',
  severity: 'critical',
  strideCategories: ['spoofing', 'tampering'],
  status: 'accepted-risk',
  affectedAsset: '/api/v1/orders/{id}',
  impact: 'Unauthorised access to customer order data',
  recommendation: 'Apply object-level authorization on every request.',
  observation: 'An authenticated user can access another customer order.',
  affectedComponent: 'Orders API',
  affectedEndpoint: '/api/v1/orders/{id}',
  risk: 'Sensitive order data is exposed.',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};

const validEvidence = {
  id: 'ev_1',
  assessmentId: validAssessment.id,
  threatIds: ['thr_1', 'thr_2'],
  type: 'screenshot',
  title: 'Evidence screenshot',
  description: 'Portal screenshot',
  content: 'Base64 payload',
  fileName: 'evidence.png',
  filePath: '/tmp/evidence.png',
  mimeType: 'image/png',
  capturedAt: '2026-06-05',
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-05T00:00:00.000Z',
};

const validReport = {
  id: 'rep_1',
  assessmentId: validAssessment.id,
  title: 'Application Security Assessment Report',
  status: 'draft',
  selectedThreatIds: ['thr_1'],
  latestVersion: 0,
  executiveSummary: 'Executive summary',
  createdAt: '2026-06-10T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};

const validReportSnapshot = {
  reportTitle: validReport.title,
  companyName: validCompany.name,
  assessmentTitle: validAssessment.title,
  executiveSummary: validReport.executiveSummary,
  threats: [
    {
      threatId: validThreat.id,
      title: validThreat.title,
      description: validThreat.description,
      severity: validThreat.severity,
      status: validThreat.status,
      strideCategories: validThreat.strideCategories,
      affectedAsset: validThreat.affectedAsset,
      impact: validThreat.impact,
      recommendation: validThreat.recommendation,
    },
  ],
};

const validReportVersion = {
  id: 'repv_1',
  reportId: validReport.id,
  version: 1,
  generatedAt: '2026-06-10',
  filePath: '/tmp/report-v1.pdf',
  snapshot: validReportSnapshot,
};

const validActivity = {
  id: 'act_1',
  entityType: 'report',
  entityId: validReport.id,
  action: 'report-generated',
  message: 'Generated the report',
  createdAt: '2026-06-10T12:00:00.000Z',
};

const validSettings = {
  id: 'set_1',
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex.mercer@example.com',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText: 'Confidential',
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  confidentialReports: true,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};

for (const validDate of ['2026-06-11', '2024-02-29']) {
  assertValid(
    isoDateStringSchema.safeParse(validDate).success,
    `Calendar date ${validDate} should pass`,
  );
}

for (const validDatetime of ['2026-06-11T12:30:00.000Z']) {
  assertValid(
    isoDateTimeStringSchema.safeParse(validDatetime).success,
    `Datetime ${validDatetime} should pass`,
  );
  assertValid(
    timestampSchema.safeParse(validDatetime).success,
    `Timestamp ${validDatetime} should pass`,
  );
}

for (const invalidDate of [
  '2026-99-99',
  '2026-13-01',
  '2026-00-10',
  '2026-02-30',
  '2025-02-29',
  'not-a-date',
]) {
  assertInvalid(
    isoDateStringSchema.safeParse(invalidDate).success,
    `Calendar date ${invalidDate} should fail`,
  );
}

assertInvalid(
  isoDateStringSchema.safeParse('2026-06-11T12:30:00.000Z').success,
  'Datetime must not pass the date-only schema',
);
assertInvalid(
  timestampSchema.safeParse('2026-06-11').success,
  'Date-only values must not pass the timestamp schema',
);

for (const severity of SEVERITIES) {
  assertValid(
    severitySchema.safeParse(severity).success,
    `Severity ${severity} should pass`,
  );
}
assertInvalid(
  severitySchema.safeParse('extreme').success,
  'Unknown severity should fail',
);

for (const strideCategory of STRIDE_CATEGORIES) {
  assertValid(
    strideCategorySchema.safeParse(strideCategory).success,
    `STRIDE ${strideCategory} should pass`,
  );
}
assertInvalid(
  strideCategorySchema.safeParse('privilege-escalation').success,
  'Unknown STRIDE category should fail',
);

for (const status of ASSESSMENT_STATUSES) {
  assertValid(
    assessmentStatusSchema.safeParse(status).success,
    `Assessment status ${status} should pass`,
  );
}
assertInvalid(
  assessmentStatusSchema.safeParse('accepted-risk').success,
  'Accepted-risk must fail as assessment status',
);

for (const status of THREAT_STATUSES) {
  assertValid(
    threatStatusSchema.safeParse(status).success,
    `Threat status ${status} should pass`,
  );
}
assertValid(
  threatStatusSchema.safeParse('accepted-risk').success,
  'Accepted-risk should pass as threat status',
);
assertInvalid(
  threatStatusSchema.safeParse('accepted').success,
  'Accepted should fail as threat status',
);

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
assertInvalid(
  evidenceTypeSchema.safeParse('unknown').success,
  'Unknown evidence type should fail',
);

for (const preference of THEME_PREFERENCES) {
  assertValid(
    themePreferenceSchema.safeParse(preference).success,
    `Theme preference ${preference} should pass`,
  );
}

for (const format of DATE_FORMATS) {
  assertValid(
    dateFormatSchema.safeParse(format).success,
    `Date format ${format} should pass`,
  );
}

assertValid(
  companySchema.safeParse(validCompany).success,
  'Valid company should pass',
);
expectField(
  getFieldErrors(companySchema, { ...validCompany, isAdmin: true }),
  'isAdmin',
  'Unknown property',
);
expectField(
  getFieldErrors(companySchema, { ...validCompany, name: '' }),
  'name',
  'Text is required',
);
expectField(
  getFieldErrors(companySchema, { ...validCompany, contactEmail: 'bad-email' }),
  'contactEmail',
  'Invalid email',
);
expectField(
  getFieldErrors(companySchema, { ...validCompany, website: 'not-a-url' }),
  'website',
  'Invalid url',
);

assertValid(
  assessmentSchema.safeParse(validAssessment).success,
  'Valid assessment should pass',
);
expectField(
  getFieldErrors(assessmentSchema, { ...validAssessment, companyId: '' }),
  'companyId',
  'ID is required',
);
expectField(
  getFieldErrors(assessmentSchema, {
    ...validAssessment,
    status: 'accepted-risk',
  }),
  'status',
  'Invalid enum value',
);
expectField(
  getFieldErrors(assessmentSchema, {
    ...validAssessment,
    startedAt: '06/01/2026',
  }),
  'startedAt',
  'Invalid ISO date string',
);
expectField(
  getFieldErrors(assessmentSchema, {
    ...validAssessment,
    completedAt: '2026-02-30',
  }),
  'completedAt',
  'Invalid ISO date string',
);

assertValid(
  threatSchema.safeParse(validThreat).success,
  'Valid threat should pass',
);
assertValid(
  threatSchema.safeParse({ ...validThreat, strideCategories: ['spoofing'] })
    .success,
  'Single STRIDE category should pass',
);
expectField(
  getFieldErrors(threatSchema, { ...validThreat, strideCategories: [] }),
  'strideCategories',
  'Array must contain at least 1 element',
);
expectField(
  getFieldErrors(threatSchema, { ...validThreat, severity: 'extreme' }),
  'severity',
  'Invalid enum value',
);
expectField(
  getFieldErrors(threatSchema, { ...validThreat, status: 'accepted' }),
  'status',
  'Invalid enum value',
);

assertValid(
  evidenceSchema.safeParse({ ...validEvidence, threatIds: [] }).success,
  'Zero threat IDs should pass',
);
assertValid(
  evidenceSchema.safeParse({ ...validEvidence, threatIds: ['thr_1'] }).success,
  'One threat ID should pass',
);
assertValid(
  evidenceSchema.safeParse(validEvidence).success,
  'Multiple threat IDs should pass',
);
expectField(
  getFieldErrors(evidenceSchema, { ...validEvidence, type: 'unknown' }),
  'type',
  'Invalid enum value',
);
expectField(
  getFieldErrors(evidenceSchema, {
    ...validEvidence,
    capturedAt: '2026-02-30',
  }),
  'capturedAt',
  'Invalid ISO date string',
);

assertValid(
  reportSchema.safeParse(validReport).success,
  'Valid report should pass',
);
assertValid(
  reportSchema.safeParse({ ...validReport, status: 'generated' }).success,
  'Persisted generated report should pass',
);
assertValid(
  reportSchema.safeParse({ ...validReport, status: 'archived' }).success,
  'Persisted archived report should pass',
);
expectField(
  getFieldErrors(reportSchema, { ...validReport, latestVersion: -1 }),
  'latestVersion',
  'Number must be greater than or equal to 0',
);
expectField(
  getFieldErrors(reportSchema, { ...validReport, latestVersion: 1.2 }),
  'latestVersion',
  'Expected integer',
);
expectField(
  getFieldErrors(reportSchema, { ...validReport, status: 'complete' }),
  'status',
  'Invalid enum value',
);
expectField(
  getFieldErrors(reportSchema, { ...validReport, companyId: 'cmp_1' }),
  'companyId',
  'Unknown property',
);

assertValid(
  reportSnapshotSchema.safeParse(validReportSnapshot).success,
  'Valid report snapshot should pass',
);
expectField(
  getFieldErrors(reportSnapshotSchema, {
    ...validReportSnapshot,
    threats: [{ ...validReportSnapshot.threats[0], severity: 'extreme' }],
  }),
  'threats.0.severity',
  'Invalid enum value',
);
expectField(
  getFieldErrors(reportSnapshotSchema, {
    ...validReportSnapshot,
    threats: [
      {
        threatId: '',
        title: validThreat.title,
        description: validThreat.description,
        severity: validThreat.severity,
        status: validThreat.status,
        strideCategories: validThreat.strideCategories,
      },
    ],
  }),
  'threats.0.threatId',
  'ID is required',
);

assertValid(
  reportVersionSchema.safeParse(validReportVersion).success,
  'Valid report version should pass',
);
expectField(
  getFieldErrors(reportVersionSchema, {
    ...validReportVersion,
    snapshot: {
      ...validReportSnapshot,
      threats: [
        {
          threatId: '',
          title: validThreat.title,
          description: validThreat.description,
          severity: validThreat.severity,
          status: validThreat.status,
          strideCategories: validThreat.strideCategories,
        },
      ],
    },
  }),
  'snapshot.threats.0.threatId',
  'ID is required',
);
expectField(
  getFieldErrors(reportVersionSchema, {
    ...validReportVersion,
    snapshot: {
      ...validReportSnapshot,
      threats: [{ ...validReportSnapshot.threats[0], severity: 'extreme' }],
    },
  }),
  'snapshot.threats.0.severity',
  'Invalid enum value',
);
expectField(
  getFieldErrors(reportVersionSchema, {
    ...validReportVersion,
    generatedAt: '2026-02-30T12:30:00.000Z',
  }),
  'generatedAt',
  'Invalid ISO date string',
);

assertValid(
  activitySchema.safeParse(validActivity).success,
  'Valid activity should pass',
);
assertValid(
  settingsSchema.safeParse(validSettings).success,
  'Valid settings should pass',
);
expectField(
  getFieldErrors(settingsSchema, { ...validSettings, theme: 'solarized' }),
  'theme',
  'Invalid enum value',
);
expectField(
  getFieldErrors(settingsSchema, {
    ...validSettings,
    dateFormat: '2026-06-10',
  }),
  'dateFormat',
  'Invalid enum value',
);
expectField(
  getFieldErrors(activitySchema, {
    ...validActivity,
    createdAt: '2026-06-11',
  }),
  'createdAt',
  'Invalid datetime',
);
expectField(
  getFieldErrors(settingsSchema, {
    ...validSettings,
    defaultSeverity: 'extreme',
  }),
  'defaultSeverity',
  'Invalid enum value',
);
expectField(
  getFieldErrors(settingsSchema, { ...validSettings, companyId: 'cmp_1' }),
  'companyId',
  'Unknown property',
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
  createCompanyRequestSchema.safeParse({ name: 'Example Ltd' }).success,
  'Create company request should pass',
);
assertValid(
  createAssessmentRequestSchema.safeParse({
    companyId: validCompany.id,
    title: 'Example',
    status: 'draft',
  }).success,
  'Create assessment request should pass',
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
    type: 'note',
    title: 'Evidence',
  }).success,
  'Create evidence request should pass',
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
expectField(
  getFieldErrors(createReportRequestSchema, {
    assessmentId: validAssessment.id,
    title: 'Report',
    selectedThreatIds: [],
    executiveSummary: 'Summary',
    status: 'generated',
  }),
  'status',
  'Unknown property',
);

assertValid(
  updateCompanyRequestSchema.safeParse({ name: 'Updated name' }).success,
  'Partial company update should pass',
);
expectField(
  getFieldErrors(updateCompanyRequestSchema, {}),
  '',
  'At least one company field is required',
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
assertValid(
  updateReportRequestSchema.safeParse({
    title: 'Updated report title',
  }).success,
  'Partial report update should pass',
);
expectField(
  getFieldErrors(updateReportRequestSchema, {
    title: 'Updated report title',
    status: 'generated',
  }),
  'status',
  'Unknown property',
);
expectField(
  getFieldErrors(updateReportRequestSchema, {
    title: 'Updated report title',
    latestVersion: 3,
  }),
  'latestVersion',
  'Unknown property',
);
expectField(
  getFieldErrors(updateReportRequestSchema, {
    title: 'Updated report title',
    id: 'rep_2',
  }),
  'id',
  'Unknown property',
);
expectField(
  getFieldErrors(updateReportRequestSchema, {
    title: 'Updated report title',
    createdAt: '2026-06-10T12:00:00.000Z',
  }),
  'createdAt',
  'Unknown property',
);
expectField(
  getFieldErrors(updateReportRequestSchema, {
    title: 'Updated report title',
    updatedAt: '2026-06-10T12:00:00.000Z',
  }),
  'updatedAt',
  'Unknown property',
);
expectField(
  getFieldErrors(updateReportRequestSchema, {
    title: 'Updated report title',
    snapshot: validReportSnapshot,
  }),
  'snapshot',
  'Unknown property',
);
expectField(
  getFieldErrors(updateReportRequestSchema, {
    title: 'Updated report title',
    generatedAt: '2026-06-10T12:00:00.000Z',
  }),
  'generatedAt',
  'Unknown property',
);
expectField(
  getFieldErrors(createReportRequestSchema, {
    assessmentId: validAssessment.id,
    title: 'Report',
    selectedThreatIds: [],
    id: 'rep_2',
  }),
  'id',
  'Unknown property',
);
expectField(
  getFieldErrors(createReportRequestSchema, {
    assessmentId: validAssessment.id,
    title: 'Report',
    selectedThreatIds: [],
    createdAt: '2026-06-10T12:00:00.000Z',
  }),
  'createdAt',
  'Unknown property',
);
expectField(
  getFieldErrors(createReportRequestSchema, {
    assessmentId: validAssessment.id,
    title: 'Report',
    selectedThreatIds: [],
    updatedAt: '2026-06-10T12:00:00.000Z',
  }),
  'updatedAt',
  'Unknown property',
);
expectField(
  getFieldErrors(updateSettingsRequestSchema, {}),
  '',
  'At least one settings field is required',
);

expectField(
  getFieldErrors(createCompanyRequestSchema, {
    name: 'Example Ltd',
    isAdmin: true,
  }),
  'isAdmin',
  'Unknown property',
);
expectField(
  getFieldErrors(createAssessmentRequestSchema, {
    companyId: validCompany.id,
    title: 'Example',
    status: 'draft',
    createdAt: '2026-06-01',
  }),
  'createdAt',
  'Unknown property',
);
expectField(
  getFieldErrors(createThreatRequestSchema, {
    assessmentId: validAssessment.id,
    title: 'Example',
    description: 'Example',
    severity: 'low',
    strideCategories: ['spoofing'],
    status: 'open',
    updatedAt: '2026-06-10',
  }),
  'updatedAt',
  'Unknown property',
);
expectField(
  getFieldErrors(createEvidenceRequestSchema, {
    assessmentId: validAssessment.id,
    threatIds: [],
    type: 'note',
    title: 'Evidence',
    id: 'ev_1',
  }),
  'id',
  'Unknown property',
);
expectField(
  getFieldErrors(createReportRequestSchema, {
    assessmentId: validAssessment.id,
    title: 'Report',
    selectedThreatIds: [],
    latestVersion: 3,
  }),
  'latestVersion',
  'Unknown property',
);
expectField(
  getFieldErrors(createReportRequestSchema, {
    assessmentId: validAssessment.id,
    title: 'Report',
    selectedThreatIds: [],
    status: 'generated',
  }),
  'status',
  'Unknown property',
);
expectField(
  getFieldErrors(createReportRequestSchema, {
    assessmentId: validAssessment.id,
    title: 'Report',
    selectedThreatIds: [],
    snapshot: validReportSnapshot,
  }),
  'snapshot',
  'Unknown property',
);
expectField(
  getFieldErrors(createReportRequestSchema, {
    assessmentId: validAssessment.id,
    title: 'Report',
    selectedThreatIds: [],
    generatedAt: '2026-06-10T12:00:00.000Z',
  }),
  'generatedAt',
  'Unknown property',
);
expectField(
  getFieldErrors(updateReportRequestSchema, {
    title: 'Updated report title',
    latestVersion: 2,
  }),
  'latestVersion',
  'Unknown property',
);
expectField(
  getFieldErrors(updateReportRequestSchema, {
    title: 'Updated report title',
    snapshot: validReportSnapshot,
  }),
  'snapshot',
  'Unknown property',
);
expectField(
  getFieldErrors(updateReportRequestSchema, {
    title: 'Updated report title',
    status: 'generated',
  }),
  'status',
  'Unknown property',
);

console.log('runtime schema checks passed');
