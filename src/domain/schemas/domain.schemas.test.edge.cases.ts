import {
  createAssessmentRequestSchema,
  createCompanyRequestSchema,
  createEvidenceRequestSchema,
  createReportRequestSchema,
  expectField,
  getFieldErrors,
  updateAssessmentRequestSchema,
  updateCompanyRequestSchema,
  updateEvidenceRequestSchema,
  updateReportRequestSchema,
  updateSettingsRequestSchema,
  validAssessment,
  validCompany,
  validHttpEvidence,
  validReportSnapshot,
  validSettings,
} from './domain.schemas.test.support.js';

expectField(
  getFieldErrors(createCompanyRequestSchema, {
    name: 'Example Ltd',
    logoUrl: '/logos/example.svg',
  }),
  'logoUrl',
  'Unknown property',
);
expectField(
  getFieldErrors(createAssessmentRequestSchema, {
    companyId: validCompany.id,
    title: 'Example',
    status: 'draft',
    applicationName: '   ',
  }),
  'applicationName',
  'Text is required',
);
expectField(
  getFieldErrors(createEvidenceRequestSchema, {
    assessmentId: validAssessment.id,
    threatIds: [],
    type: 'note',
    title: 'Evidence',
    fileName: '../evidence.png',
  }),
  'fileName',
  'Evidence file name must not contain path separators',
);
expectField(
  getFieldErrors(createEvidenceRequestSchema, {
    assessmentId: validAssessment.id,
    threatIds: [],
    type: 'note',
    title: 'Evidence',
    fileName: 'evidence.txt',
    mimeType: 'image/png',
  }),
  'fileName',
  'Evidence file name extension must match the supplied mime type',
);
expectField(
  getFieldErrors(createEvidenceRequestSchema, {
    assessmentId: validAssessment.id,
    threatIds: [],
    type: 'text',
    title: 'Evidence',
    httpExchanges: validHttpEvidence.httpExchanges,
  }),
  'httpExchanges',
  'Only HTTP evidence can include exchanges',
);
expectField(
  getFieldErrors(createEvidenceRequestSchema, {
    assessmentId: validAssessment.id,
    threatIds: [],
    type: 'http',
    title: 'Evidence',
    httpExchanges: [],
  }),
  'httpExchanges',
  'HTTP evidence must include at least one exchange',
);
expectField(
  getFieldErrors(updateCompanyRequestSchema, {}),
  '',
  'At least one company field is required',
);
expectField(
  getFieldErrors(updateAssessmentRequestSchema, {
    companyId: validCompany.id,
  }),
  'companyId',
  'Unknown property',
);
expectField(
  getFieldErrors(updateEvidenceRequestSchema, {
    assessmentId: validAssessment.id,
  }),
  'assessmentId',
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
  getFieldErrors(updateSettingsRequestSchema, {
    allowedBrandingModes: ['client'],
    defaultBrandingMode: 'issuer',
  }),
  'defaultBrandingMode',
  'Default branding mode must be allowed',
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
  getFieldErrors(updateReportRequestSchema, {
    title: 'Updated report title',
    generatedAt: '2026-06-10T12:00:00.000Z',
  }),
  'generatedAt',
  'Unknown property',
);
expectField(
  getFieldErrors(updateSettingsRequestSchema, {
    issuerLogoId: 'C:\\uploads\\issuer-logo.svg',
  }),
  'issuerLogoId',
  'prefixed UUID',
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
  getFieldErrors(updateEvidenceRequestSchema, {
    fileName: 'evidence.txt',
    mimeType: 'image/png',
  }),
  'fileName',
  'Evidence file name extension must match the supplied mime type',
);
expectField(
  getFieldErrors(updateSettingsRequestSchema, {
    ...validSettings,
    companyId: 'cmp_1',
  }),
  'companyId',
  'Unknown property',
);
