import type {
  ReportPreviewRequest,
  ReportPreviewSnapshot,
} from '../../src/domain/report-preview.js';

export const reportPreviewFixtureIds = {
  companyId: 'cmp_00000000-0000-0000-0000-000000000001',
  assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
  threatId: 'thr_00000000-0000-0000-0000-000000000001',
  evidenceId: 'evd_00000000-0000-0000-0000-000000000001',
  reportId: 'rpt_00000000-0000-0000-0000-000000000001',
} as const;

export const buildReportPreviewRequestFixture = (
  overrides: Partial<ReportPreviewRequest> = {},
): ReportPreviewRequest => ({
  companyId: reportPreviewFixtureIds.companyId,
  assessmentId: reportPreviewFixtureIds.assessmentId,
  selection: {
    threatIds: [],
    evidenceIds: [],
  },
  configuration: {
    includeEvidence: false,
  },
  brandingMode: 'issuer',
  ...overrides,
});

export const buildReportPreviewSnapshotFixture = (
  overrides: Partial<ReportPreviewSnapshot> = {},
): ReportPreviewSnapshot => ({
  company: {
    id: reportPreviewFixtureIds.companyId,
    name: 'Northstar Digital',
    logoUrl: null,
  },
  assessment: {
    id: reportPreviewFixtureIds.assessmentId,
    companyId: reportPreviewFixtureIds.companyId,
    title: 'Customer Services Portal',
    status: 'in-progress',
    applicationName: 'Customer Services Portal',
    owaspTaxonomyVersion: '2025',
  },
  selection: {
    threatIds: [],
    evidenceIds: [],
  },
  configuration: {
    includeEvidence: false,
  },
  branding: {
    brandingMode: 'issuer',
    companyName: 'Northstar Digital',
    companyLogoUrl: null,
    issuerLogoUrl: null,
  },
  selectedThreats: [],
  selectedEvidence: [],
  riskSummary: {
    threatCount: 0,
    evidenceCount: 0,
  },
  warnings: [],
  ...overrides,
});
