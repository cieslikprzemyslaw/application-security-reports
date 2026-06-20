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
import { OWASP_TOP_10_CURRENT_VERSION } from '../owaspTop10.js';

import {
  activityFileSchema,
  activitySchema,
  assessmentListQuerySchema,
  assessmentRouteParamsSchema,
  assessmentsFileSchema,
  assessmentSchema,
  assessmentStatusSchema,
  companiesFileSchema,
  companyPublicSchema,
  companyRouteParamsSchema,
  companySchema,
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
  isoDateTimeStringSchema,
  reportSchema,
  reportSnapshotSchema,
  reportStatusSchema,
  reportsFileSchema,
  reportVersionSchema,
  settingsFileSchema,
  settingsSchema,
  severitySchema,
  strideCategorySchema,
  threatListQuerySchema,
  threatRouteParamsSchema,
  threatSchema,
  threatStatusSchema,
  updateAssessmentRequestSchema,
  updateCompanyRequestSchema,
  updateEvidenceRequestSchema,
  updateReportRequestSchema,
  updateSettingsRequestSchema,
  updateThreatRequestSchema,
} from './index.js';
import {
  dateFormatSchema,
  isoDateStringSchema,
  themePreferenceSchema,
  timestampSchema,
} from './common.schema.js';
import { formatValidationErrors } from '../../validation/index.js';

export const assertValid = (success: boolean, message: string) => {
  assert.equal(success, true, message);
};

export const assertInvalid = (success: boolean, message: string) => {
  assert.equal(success, false, message);
};

export const getFieldErrors = (schema: z.ZodTypeAny, value: unknown) => {
  const result = schema.safeParse(value);

  assertInvalid(result.success, 'Expected validation to fail');

  if (result.success) {
    throw new Error('Expected validation to fail');
  }

  return formatValidationErrors(result.error).fields;
};

export const expectField = (
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

export {
  ASSESSMENT_STATUSES,
  DATE_FORMATS,
  EVIDENCE_TYPES,
  OWASP_TOP_10_CURRENT_VERSION,
  REPORT_STATUSES,
  SEVERITIES,
  STRIDE_CATEGORIES,
  THEME_PREFERENCES,
  THREAT_STATUSES,
  activityFileSchema,
  activitySchema,
  assessmentListQuerySchema,
  assessmentRouteParamsSchema,
  assessmentsFileSchema,
  assessmentSchema,
  assessmentStatusSchema,
  companiesFileSchema,
  companyPublicSchema,
  companyRouteParamsSchema,
  companySchema,
  createAssessmentRequestSchema,
  createCompanyRequestSchema,
  createEvidenceRequestSchema,
  createReportRequestSchema,
  createThreatOwaspCategoryCodeSchema,
  createThreatRequestSchema,
  dateFormatSchema,
  evidenceListQuerySchema,
  evidenceRouteParamsSchema,
  evidenceSchema,
  evidenceTypeSchema,
  isoDateStringSchema,
  isoDateTimeStringSchema,
  reportSchema,
  reportSnapshotSchema,
  reportsFileSchema,
  reportStatusSchema,
  reportVersionSchema,
  settingsFileSchema,
  settingsSchema,
  severitySchema,
  strideCategorySchema,
  themePreferenceSchema,
  threatListQuerySchema,
  threatRouteParamsSchema,
  threatSchema,
  threatStatusSchema,
  timestampSchema,
  updateAssessmentRequestSchema,
  updateCompanyRequestSchema,
  updateEvidenceRequestSchema,
  updateReportRequestSchema,
  updateSettingsRequestSchema,
  updateThreatRequestSchema,
  z,
};

export const validCompany = {
  id: 'cmp_00000000-0000-0000-0000-000000000001',
  name: 'Northstar Digital',
  description: 'Security and engineering partner',
  website: 'https://northstar.example',
  contactName: 'Alex Mercer',
  contactEmail: 'security@northstar.example',
  logoUrl: null,
  footerText: 'Confidential',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};

export const validCompanyPublic = (({ logoUrl: _logoUrl, ...rest }) => rest)(
  validCompany,
);

export const validAssessment = {
  id: 'asm_00000000-0000-0000-0000-000000000001',
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
  owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};

export const validThreat = {
  id: 'thr_00000000-0000-0000-0000-000000000001',
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

export const validEvidence = {
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

export const validHttpEvidence = {
  ...validEvidence,
  type: 'http',
  httpExchanges: [
    {
      request: {
        method: 'GET',
        url: '/api/orders/1',
      },
      response: {
        statusCode: 200,
        body: '{"ok":true}',
      },
    },
    {
      request: {
        method: 'POST',
        url: '/api/orders/1',
        body: '{"confirm":true}',
      },
      response: {
        statusCode: 201,
        body: '{"created":true}',
      },
    },
  ],
};

export const validReport = {
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

export const validReportSnapshot = {
  reportTitle: validReport.title,
  companyName: validCompany.name,
  assessmentTitle: validAssessment.title,
  executiveSummary: validReport.executiveSummary,
  branding: {
    brandingMode: 'issuer',
    issuerName: 'Northstar Digital',
    issuerContactName: 'Alex Mercer',
    issuerContactEmail: 'alex.mercer@example.com',
    issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
    clientName: validCompany.name,
    clientWebsite: validCompany.website,
    clientContactEmail: validCompany.contactEmail,
    clientFooterText: validCompany.footerText,
    reportFooterText: 'Confidential',
    confidentialityLabel: 'Strictly confidential',
    confidentialReports: true,
  },
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

export const validReportVersion = {
  id: 'repv_1',
  reportId: validReport.id,
  version: 1,
  generatedAt: '2026-06-10',
  filePath: '/tmp/report-v1.pdf',
  snapshot: validReportSnapshot,
};

export const validActivity = {
  id: 'act_1',
  entityType: 'report',
  entityId: validReport.id,
  action: 'report-generated',
  message: 'Generated the report',
  createdAt: '2026-06-10T12:00:00.000Z',
};

export const validSettings = {
  id: 'set_1',
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex.mercer@example.com',
  issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText: 'Confidential',
  reportConfidentialityLabel: 'Strictly confidential',
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  confidentialReports: true,
  allowedBrandingModes: ['issuer', 'client'],
  defaultBrandingMode: 'issuer',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};
