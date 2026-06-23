import { describe, expect, it } from 'vitest';

import {
  reportPreviewConfigurationSchema,
  reportPreviewRequestSchema,
  reportPreviewSelectionSchema,
  reportPreviewSnapshotSchema,
} from './index.js';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const evidenceId = 'evd_00000000-0000-0000-0000-000000000001';

const validSelection = {
  threatIds: [threatId],
  evidenceIds: [evidenceId],
};

const validConfiguration = {
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
};

const validRequest = {
  companyId,
  assessmentId,
  selection: validSelection,
  configuration: validConfiguration,
  brandingMode: 'issuer' as const,
};

const validSnapshot = {
  company: {
    id: companyId,
    name: 'Northstar Digital',
    description: 'Security consulting and managed assessment services',
    website: 'https://northstar.example',
    contactName: 'Alex Mercer',
    contactEmail: 'security@northstar.example',
    logoUrl: null,
    footerText: 'Confidential - do not distribute.',
  },
  assessment: {
    id: assessmentId,
    companyId,
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
    owaspTaxonomyVersion: '2025',
  },
  selection: validSelection,
  configuration: validConfiguration,
  branding: {
    brandingMode: 'issuer' as const,
    companyName: 'Northstar Digital',
    companyWebsite: 'https://northstar.example',
    companyContactEmail: 'security@northstar.example',
    companyLogoUrl: null,
    companyFooterText: 'Confidential - do not distribute.',
    issuerName: 'Northstar Digital',
    issuerContactName: 'Alex Mercer',
    issuerContactEmail: 'alex.mercer@example.com',
    issuerLogoUrl: null,
    reportFooterText: 'Confidential',
    reportConfidentialityLabel: 'Strictly confidential',
    confidentialReports: true,
    allowedBrandingModes: ['issuer', 'client'],
    defaultBrandingMode: 'issuer' as const,
  },
  selectedThreats: [
    {
      id: threatId,
      assessmentId,
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
      references: 'https://example.invalid/reference',
      evidenceCount: 1,
      resolutionNote: 'Accepted for the current release.',
      acceptedRiskJustification: 'Mitigation planned in the next quarter.',
    },
  ],
  selectedEvidence: [
    {
      id: evidenceId,
      assessmentId,
      threatIds: [threatId],
      type: 'note',
      title: 'Evidence screenshot',
      description: 'Portal screenshot',
      content: 'Base64 payload',
      fileName: 'evidence.png',
      mimeType: 'image/png',
      attachmentSizeBytes: 1234,
      capturedAt: '2026-06-05',
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
      ],
    },
  ],
  riskSummary: {
    overallRisk: 'high' as const,
    threatCount: 1,
    evidenceCount: 1,
  },
  warnings: ['Evidence selection is incomplete'],
};

describe('Report preview runtime schemas', () => {
  it('accepts empty and populated preview request payloads', () => {
    expect(
      reportPreviewSelectionSchema.safeParse({
        threatIds: [],
        evidenceIds: [],
      }).success,
    ).toBe(true);

    expect(reportPreviewConfigurationSchema.safeParse({}).success).toBe(true);

    expect(reportPreviewRequestSchema.safeParse(validRequest).success).toBe(
      true,
    );

    expect(
      reportPreviewSnapshotSchema.safeParse({
        ...validSnapshot,
        selectedThreats: [],
        selectedEvidence: [],
        riskSummary: {
          threatCount: 0,
          evidenceCount: 0,
        },
        warnings: [],
      }).success,
    ).toBe(true);
  });

  it('rejects malformed, duplicate, unknown-field, and invalid-branding payloads', () => {
    expect(
      reportPreviewRequestSchema.safeParse({
        ...validRequest,
        snapshot: validSnapshot,
      }).success,
    ).toBe(false);

    expect(
      reportPreviewRequestSchema.safeParse({
        ...validRequest,
        brandingMode: 'dashboard',
      }).success,
    ).toBe(false);

    expect(
      reportPreviewSelectionSchema.safeParse({
        threatIds: [threatId, threatId],
        evidenceIds: [evidenceId],
      }).success,
    ).toBe(false);

    expect(
      reportPreviewSelectionSchema.safeParse({
        threatIds: threatId,
        evidenceIds: [evidenceId],
      } as unknown).success,
    ).toBe(false);
  });

  it('accepts a public preview snapshot and rejects internal fields', () => {
    expect(reportPreviewSnapshotSchema.safeParse(validSnapshot).success).toBe(
      true,
    );

    expect(
      reportPreviewSnapshotSchema.safeParse({
        ...validSnapshot,
        company: {
          ...validSnapshot.company,
          createdAt: '2026-06-23T00:00:00.000Z',
        },
      }).success,
    ).toBe(false);

    expect(
      reportPreviewSnapshotSchema.safeParse({
        ...validSnapshot,
        branding: {
          ...validSnapshot.branding,
          issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
        },
      }).success,
    ).toBe(false);

    expect(
      reportPreviewSnapshotSchema.safeParse({
        ...validSnapshot,
        selectedEvidence: [
          {
            ...validSnapshot.selectedEvidence[0],
            filePath: 'uploads/evidence/evidence.png',
            storageKey: 'storage/evidence/evidence.png',
          },
        ],
      }).success,
    ).toBe(false);
  });
});
