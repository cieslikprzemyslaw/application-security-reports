import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import type { Assessment } from '../../src/domain/assessment.js';
import type { Evidence } from '../../src/domain/evidence.js';
import type {
  ReportPreviewBranding,
  ReportPreviewCompany,
  ReportPreviewRequest,
} from '../../src/domain/report-preview.js';
import type { Threat } from '../../src/domain/threat.js';
import { buildReportPreviewSnapshot } from './report-preview-snapshot.service.js';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const evidenceId = 'evd_00000000-0000-0000-0000-000000000001';

const company: ReportPreviewCompany & {
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
  logoUrl: 'https://northstar.example/client-logo.png',
  footerText: 'Client confidential',
  archivedAt: null,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
};

const assessment: Assessment = {
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

const selectedThreat: Threat = {
  id: threatId,
  assessmentId,
  title: 'Missing Server-Side Authorization',
  description: 'The endpoint returns another customer order.',
  severity: 'critical',
  strideCategories: ['spoofing', 'tampering'],
  status: 'open',
  owaspCategoryCode: 'A01',
  affectedEndpoint: '/api/v1/orders/{id}',
  impact: 'Unauthorised access to customer order data',
  recommendation: 'Apply object-level authorization on every request.',
  evidenceCount: 1,
  createdAt: '2026-06-02T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
};

const selectedEvidence: Evidence = {
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

const request: ReportPreviewRequest = {
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

const branding: ReportPreviewBranding & { issuerLogoId: string } = {
  brandingMode: 'issuer',
  companyName: company.name,
  companyWebsite: company.website,
  companyContactEmail: company.contactEmail,
  companyLogoUrl: company.logoUrl,
  companyFooterText: company.footerText,
  issuerName: 'AppSec Consulting Ltd',
  issuerContactName: 'Alex Mercer',
  issuerContactEmail: 'alex.mercer@example.com',
  issuerLogoUrl: 'https://appsec.example/issuer-logo.png',
  reportFooterText: 'Confidential',
  reportConfidentialityLabel: 'Strictly confidential',
  confidentialReports: true,
  allowedBrandingModes: ['issuer', 'client'],
  defaultBrandingMode: 'issuer',
  issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
};

const buildSnapshot = (
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

describe('buildReportPreviewSnapshot', () => {
  it('builds the validated public snapshot and computes risk from selected records', () => {
    const snapshot = buildSnapshot();

    expect(snapshot.riskSummary).toEqual({
      overallRisk: 'critical',
      threatCount: 1,
      evidenceCount: 1,
    });
    expect(snapshot.selection).toEqual(request.selection);
    expect(snapshot.configuration).toEqual(request.configuration);
    expect(snapshot.selectedThreats.map(threat => threat.id)).toEqual([
      threatId,
    ]);
    expect(snapshot.selectedEvidence.map(evidence => evidence.id)).toEqual([
      evidenceId,
    ]);
    expect(snapshot.branding.brandingMode).toBe(request.brandingMode);
    expect(snapshot.warnings).toEqual(['Evidence selection is incomplete']);
  });

  it('allowlists public content and safe attachment metadata', () => {
    const snapshot = buildSnapshot();
    const snapshotCompany = snapshot.company as Record<string, unknown>;
    const snapshotAssessment = snapshot.assessment as Record<string, unknown>;
    const snapshotThreat = snapshot.selectedThreats[0] as Record<
      string,
      unknown
    >;
    const snapshotEvidence = snapshot.selectedEvidence[0] as Record<
      string,
      unknown
    >;

    expect(snapshotCompany).not.toHaveProperty('createdAt');
    expect(snapshotCompany).not.toHaveProperty('updatedAt');
    expect(snapshotCompany).not.toHaveProperty('archivedAt');
    expect(snapshotAssessment).not.toHaveProperty('createdAt');
    expect(snapshotAssessment).not.toHaveProperty('updatedAt');
    expect(snapshotThreat).not.toHaveProperty('createdAt');
    expect(snapshotThreat).not.toHaveProperty('updatedAt');
    expect(snapshotEvidence).not.toHaveProperty('createdAt');
    expect(snapshotEvidence).not.toHaveProperty('updatedAt');
    expect(snapshotEvidence).not.toHaveProperty('filePath');
    expect(snapshotEvidence).not.toHaveProperty('storageKey');
    expect(snapshot.branding).not.toHaveProperty('issuerLogoId');
    expect(snapshotEvidence).toMatchObject({
      fileName: 'order-response.txt',
      mimeType: 'text/plain',
      attachmentSizeBytes: 512,
    });
  });

  it('derives a public attachment URL only from an Evidence-root storage path', () => {
    const snapshot = buildSnapshot({
      records: {
        assessment,
        threats: [selectedThreat],
        evidence: [
          {
            ...selectedEvidence,
            filePath:
              'uploads/evidence/evd_00000000-0000-0000-0000-000000000001/capture image.png',
            storageKey: undefined,
            mimeType: 'image/png',
          },
        ],
      },
    });

    expect(snapshot.selectedEvidence[0].attachmentUrl).toBe(
      '/uploads/evidence/evd_00000000-0000-0000-0000-000000000001/capture%20image.png',
    );
    expect(JSON.stringify(snapshot)).not.toContain('filePath');
    expect(JSON.stringify(snapshot)).not.toContain('storageKey');
  });

  it('copies mutable snapshot input instead of retaining source references', () => {
    const warnings = ['Evidence selection is incomplete'];
    const snapshot = buildSnapshot({ warnings });

    expect(snapshot.branding).not.toBe(branding);
    expect(snapshot.branding.allowedBrandingModes).not.toBe(
      branding.allowedBrandingModes,
    );
    expect(snapshot.selection.threatIds).not.toBe(request.selection.threatIds);
    expect(snapshot.selection.evidenceSelections).not.toBe(
      request.selection.evidenceSelections,
    );
    expect(snapshot.selectedThreats[0].strideCategories).not.toBe(
      selectedThreat.strideCategories,
    );
    expect(snapshot.selectedEvidence[0].threatIds).not.toBe(
      selectedEvidence.threatIds,
    );
    expect(snapshot.selectedEvidence[0].httpExchanges).not.toBe(
      selectedEvidence.httpExchanges,
    );
    expect(
      snapshot.selectedEvidence[0].httpExchanges?.[0].request.headers,
    ).not.toBe(selectedEvidence.httpExchanges?.[0].request.headers);
    expect(snapshot.warnings).not.toBe(warnings);
  });

  it('returns an empty warnings list when no warnings are supplied', () => {
    const snapshot = buildReportPreviewSnapshot({
      request,
      company,
      records: {
        assessment,
        threats: [selectedThreat],
        evidence: [selectedEvidence],
      },
      branding,
    });

    expect(snapshot.warnings).toEqual([]);
  });

  it('runtime validates the final public DTO', () => {
    expect(() =>
      buildSnapshot({
        branding: {
          ...branding,
          companyName: '',
        } as ReportPreviewBranding,
      }),
    ).toThrow(ZodError);
  });
});
