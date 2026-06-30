import type {
  ReportBuilderState,
  ReportPreviewRequest,
  ReportPreviewSnapshot,
} from '~/domain';

export const previewCompanyId = 'cmp_00000000-0000-0000-0000-000000000001';
export const previewAssessmentId = 'asm_00000000-0000-0000-0000-000000000001';
export const previewThreatId = 'thr_00000000-0000-0000-0000-000000000001';
export const previewEvidenceId = 'evd_00000000-0000-0000-0000-000000000001';

export const previewBuilderState: ReportBuilderState = {
  companyId: previewCompanyId,
  selection: {
    selectedAssessmentId: previewAssessmentId,
    selectedThreatIds: [previewThreatId],
    selectedEvidenceIds: [previewEvidenceId],
  },
  configuration: {
    methodology: 'OWASP ASVS / WSTG',
    reportStyle: 'Technical',
    includeEvidence: true,
  },
  branding: {
    brandingMode: 'issuer',
    confidentialReports: false,
  },
};

export const previewApiRequest: ReportPreviewRequest = {
  companyId: previewCompanyId,
  assessmentId: previewAssessmentId,
  selection: {
    threatIds: [previewThreatId],
    evidenceIds: [previewEvidenceId],
  },
  configuration: {
    methodology: 'OWASP ASVS / WSTG',
    reportStyle: 'Technical',
    includeEvidence: true,
  },
  brandingMode: 'issuer',
};

export const previewSnapshot: ReportPreviewSnapshot = {
  company: {
    id: previewCompanyId,
    name: 'Northstar Digital',
    website: 'https://northstar.example',
    contactEmail: 'security@northstar.example',
    logoUrl: '/api/companies/cmp_00000000-0000-0000-0000-000000000001/logo',
  },
  assessment: {
    id: previewAssessmentId,
    companyId: previewCompanyId,
    title: 'Customer Services Portal',
    description: 'Assessment of the customer services portal.',
    scope: 'Customer portal and supporting API',
    status: 'in-progress',
    startedAt: '2026-06-01',
    applicationName: 'Customer Services Portal',
    environment: 'Production',
    assessmentType: 'Web App',
    overallRisk: 'critical',
    owaspTaxonomyVersion: '2025',
  },
  selection: {
    threatIds: [previewThreatId],
    evidenceIds: [previewEvidenceId],
  },
  configuration: {
    methodology: 'OWASP ASVS / WSTG',
    reportStyle: 'Technical',
    includeEvidence: true,
  },
  branding: {
    brandingMode: 'issuer',
    companyName: 'Northstar Digital',
    companyWebsite: 'https://northstar.example',
    companyContactEmail: 'security@northstar.example',
    companyLogoUrl:
      '/api/companies/cmp_00000000-0000-0000-0000-000000000001/logo',
    issuerName: 'AppSec Consulting Ltd',
    issuerContactName: 'Alex Mercer',
    issuerContactEmail: 'alex@example.com',
    issuerLogoUrl: '/api/settings/issuer-logo',
    reportFooterText: 'Confidential',
    confidentialReports: true,
    allowedBrandingModes: ['issuer', 'client'],
    defaultBrandingMode: 'issuer',
  },
  selectedThreats: [
    {
      id: previewThreatId,
      assessmentId: previewAssessmentId,
      title: 'Missing Server-Side Authorization',
      description: 'Object ownership is not enforced.',
      severity: 'critical',
      strideCategories: ['elevation-of-privilege'],
      status: 'open',
      affectedEndpoint: '/api/orders/:id',
      observation: 'Another user can read the order.',
      risk: 'Sensitive order data can be disclosed.',
      recommendation: 'Enforce object ownership on the server.',
      evidenceCount: 1,
    },
  ],
  selectedEvidence: [
    {
      id: previewEvidenceId,
      assessmentId: previewAssessmentId,
      threatIds: [previewThreatId],
      type: 'note',
      title: 'Authorization evidence',
      content: 'The request returned another user’s order.',
    },
  ],
  riskSummary: {
    overallRisk: 'critical',
    threatCount: 1,
    evidenceCount: 1,
  },
  warnings: [],
};
