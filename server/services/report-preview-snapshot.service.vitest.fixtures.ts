import type { Assessment } from '../../src/domain/assessment.js';
import type { Evidence } from '../../src/domain/evidence.js';
import type {
  ReportPreviewBranding,
  ReportPreviewCompany,
  ReportPreviewRequest,
} from '../../src/domain/report-preview.js';
import type { Threat, ThreatCweMapping } from '../../src/domain/threat.js';

import { buildReportPreviewSnapshot } from './report-preview-snapshot.service.js';

export const selectedThreatCweMappings: ThreatCweMapping[] = [
  {
    id: 'CWE-79',
    name: 'Improper Neutralization of Input During Web Page Generation',
    status: 'Stable',
    deprecated: false,
    primary: true,
    replacementIds: [],
  },
  {
    id: 'CWE-89',
    name: 'Improper Neutralization of Special Elements used in an SQL Command',
    status: 'Stable',
    deprecated: false,
    primary: false,
    replacementIds: [],
  },
];

export const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
export const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
export const threatId = 'thr_00000000-0000-0000-0000-000000000001';
export const evidenceId = 'evd_00000000-0000-0000-0000-000000000001';

export const company: ReportPreviewCompany & {
  archivedAt: null;
  createdAt: string;
  updatedAt: string;
} = {
  id: companyId,
  name: 'Northstar Digital',
  description: 'Security consulting and managed assessment services',
  website: 'https://northstar.example',
  contactName: 'Alex Mercer',
  contactEmail: 'security@northstar.example',
  logoUrl: '/api/companies/cmp_00000000-0000-0000-0000-000000000001/logo',
  footerText: 'Client confidential',
  archivedAt: null,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
};

export const assessment: Assessment = {
  cweCatalogVersion: '4.20',
  id: assessmentId,
  companyId,
  title: 'Customer Services Portal',
  description: 'Assessment of the customer portal',
  scope: 'Web application',
  status: 'in-progress',
  startedAt: '2026-06-01',
  applicationName: 'Customer Services Portal',
  environment: 'Production',
  assessmentType: 'Web App',
  overallRisk: 'high',
  owaspTaxonomyVersion: '2025',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
};

export const selectedThreat: Threat = {
  cweCatalogVersion: '4.20',
  cweMappings: selectedThreatCweMappings,
  id: threatId,
  assessmentId,
  title: 'Missing Server-Side Authorization',
  description: 'The endpoint returns another customer order.',
  severity: 'critical',
  strideCategories: ['spoofing', 'tampering'],
  status: 'open',
  owaspCategoryCode: 'A01:2025',
  affectedEndpoint: '/api/v1/orders/{id}',
  impact: 'Unauthorised access to customer order data',
  recommendation: 'Apply object-level authorization on every request.',
  evidenceCount: 1,
  createdAt: '2026-06-02T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
};

export const selectedEvidence: Evidence = {
  id: evidenceId,
  assessmentId,
  threatIds: [threatId],
  type: 'http',
  title: 'Order request and response',
  description: 'Cross-account order response',
  content: 'Safe evidence text',
  fileName: 'order-response.txt',
  filePath: 'C:\\private\\evidence\\order-response.txt',
  storageKey: 'assessment/private/order-response.txt',
  mimeType: 'text/plain',
  attachmentSizeBytes: 512,
  capturedAt: '2026-06-05',
  httpExchanges: [
    {
      request: {
        method: 'GET',
        url: '/api/v1/orders/123',
        headers: { authorization: '[REDACTED]' },
      },
      response: {
        statusCode: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        body: '{"orderId":123}',
      },
    },
  ],
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
};

export const request: ReportPreviewRequest = {
  companyId,
  assessmentId,
  selection: {
    threatIds: [threatId],
    evidenceIds: [evidenceId],
    evidenceSelections: [{ threatId, evidenceId }],
  },
  configuration: {
    methodology: 'OWASP ASVS / WSTG',
    reportStyle: 'Technical & structured',
    includeEvidence: true,
  },
  brandingMode: 'issuer',
};

export const branding: ReportPreviewBranding & { issuerLogoId: string } = {
  brandingMode: 'issuer',
  companyName: company.name,
  companyWebsite: company.website,
  companyContactEmail: company.contactEmail,
  companyLogoUrl: company.logoUrl,
  companyFooterText: company.footerText,
  issuerName: 'AppSec Consulting Ltd',
  issuerContactName: 'Alex Mercer',
  issuerContactEmail: 'alex.mercer@example.com',
  issuerLogoUrl: '/api/settings/issuer-logo',
  reportFooterText: 'Confidential',
  reportConfidentialityLabel: 'Strictly confidential',
  confidentialReports: true,
  allowedBrandingModes: ['issuer', 'client'],
  defaultBrandingMode: 'issuer',
  issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
};

export const buildSnapshot = (
  overrides: Partial<Parameters<typeof buildReportPreviewSnapshot>[0]> = {},
) =>
  buildReportPreviewSnapshot({
    request,
    company,
    records: {
      assessment,
      threats: [selectedThreat],
      evidence: [selectedEvidence],
    },
    branding,
    warnings: ['Evidence selection is incomplete'],
    ...overrides,
  });
