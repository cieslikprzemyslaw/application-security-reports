import { describe, expect, it } from 'vitest';

import {
  reportPreviewBrandingSchema,
  reportPreviewConfigurationSchema,
  reportPreviewRequestSchema,
  reportPreviewSelectionSchema,
  reportPreviewSnapshotSchema,
} from './report-preview.schema.js';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const evidenceId = 'evd_00000000-0000-0000-0000-000000000001';

const buildSelection = (overrides = {}) => ({
  threatIds: [threatId],
  evidenceIds: [evidenceId],
  ...overrides,
});

const buildConfiguration = (overrides = {}) => ({
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  ...overrides,
});

const buildBranding = (overrides = {}) => ({
  brandingMode: 'issuer',
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
  defaultBrandingMode: 'issuer',
  ...overrides,
});

const buildThreat = (overrides = {}) => ({
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
  ...overrides,
});

const buildEvidence = (overrides = {}) => ({
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
  ...overrides,
});

const buildRequest = (overrides = {}) => ({
  companyId,
  assessmentId,
  selection: buildSelection(),
  configuration: buildConfiguration(),
  brandingMode: 'issuer',
  ...overrides,
});

const buildSnapshot = (overrides = {}) => ({
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
  selection: buildSelection(),
  configuration: buildConfiguration(),
  branding: buildBranding(),
  selectedThreats: [buildThreat()],
  selectedEvidence: [buildEvidence()],
  riskSummary: {
    overallRisk: 'high',
    threatCount: 1,
    evidenceCount: 1,
  },
  warnings: ['Evidence selection is incomplete'],
  ...overrides,
});

describe('Report preview runtime schemas', () => {
  it('accepts empty selection and configuration payloads', () => {
    expect(
      reportPreviewSelectionSchema.safeParse({
        threatIds: [],
        evidenceIds: [],
      }).success,
    ).toBe(true);

    expect(reportPreviewConfigurationSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a valid request and trims transformed values', () => {
    const parsed = reportPreviewRequestSchema.parse({
      companyId: ` ${companyId} `,
      assessmentId: ` ${assessmentId} `,
      selection: {
        threatIds: [` ${threatId} `],
        evidenceIds: [` ${evidenceId} `],
      },
      configuration: {
        methodology: '  OWASP ASVS / WSTG  ',
        reportStyle: '  Technical & structured  ',
        includeEvidence: true,
      },
      brandingMode: 'issuer',
    });

    expect(parsed).toEqual(buildRequest());
  });

  it('rejects duplicate threat and evidence selections', () => {
    expect(
      reportPreviewSelectionSchema.safeParse({
        threatIds: [threatId, threatId],
        evidenceIds: [evidenceId],
      }).success,
    ).toBe(false);

    expect(
      reportPreviewSelectionSchema.safeParse({
        threatIds: [threatId],
        evidenceIds: [evidenceId, evidenceId],
      }).success,
    ).toBe(false);
  });

  it('rejects invalid request id prefixes', () => {
    expect(
      reportPreviewRequestSchema.safeParse({
        ...buildRequest(),
        companyId: 'usr_00000000-0000-0000-0000-000000000001',
      }).success,
    ).toBe(false);

    expect(
      reportPreviewRequestSchema.safeParse({
        ...buildRequest(),
        assessmentId: 'cmp_00000000-0000-0000-0000-000000000001',
      }).success,
    ).toBe(false);
  });

  it('rejects invalid selection id prefixes', () => {
    expect(
      reportPreviewSelectionSchema.safeParse({
        threatIds: ['asm_00000000-0000-0000-0000-000000000001'],
        evidenceIds: [evidenceId],
      }).success,
    ).toBe(false);

    expect(
      reportPreviewSelectionSchema.safeParse({
        threatIds: [threatId],
        evidenceIds: ['thr_00000000-0000-0000-0000-000000000001'],
      }).success,
    ).toBe(false);
  });

  it('rejects malformed selection shapes', () => {
    expect(
      reportPreviewSelectionSchema.safeParse({
        threatIds: threatId,
        evidenceIds: [evidenceId],
      } as unknown).success,
    ).toBe(false);

    expect(
      reportPreviewSelectionSchema.safeParse({
        threatIds: [threatId],
        evidenceIds: evidenceId,
      } as unknown).success,
    ).toBe(false);
  });

  it('rejects unknown nested selection, configuration, and branding fields', () => {
    expect(
      reportPreviewSelectionSchema.safeParse({
        ...buildSelection(),
        snapshot: true,
      }).success,
    ).toBe(false);

    expect(
      reportPreviewConfigurationSchema.safeParse({
        ...buildConfiguration(),
        snapshot: true,
      }).success,
    ).toBe(false);

    expect(
      reportPreviewBrandingSchema.safeParse({
        ...buildBranding(),
        issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
      }).success,
    ).toBe(false);
  });

  it('rejects invalid branding urls, email addresses, and branding mode lists', () => {
    expect(
      reportPreviewBrandingSchema.safeParse({
        ...buildBranding(),
        companyWebsite: 'not-a-url',
      }).success,
    ).toBe(false);

    expect(
      reportPreviewBrandingSchema.safeParse({
        ...buildBranding(),
        companyContactEmail: 'not-an-email',
      }).success,
    ).toBe(false);

    expect(
      reportPreviewBrandingSchema.safeParse({
        ...buildBranding(),
        allowedBrandingModes: [],
      }).success,
    ).toBe(false);

    expect(
      reportPreviewBrandingSchema.safeParse({
        ...buildBranding(),
        allowedBrandingModes: ['issuer', 'issuer'],
      }).success,
    ).toBe(false);
  });

  it('trims branding output values', () => {
    const parsed = reportPreviewBrandingSchema.parse({
      ...buildBranding(),
      companyName: '  Northstar Digital  ',
      companyWebsite: '  https://northstar.example  ',
      companyContactEmail: '  security@northstar.example  ',
      reportFooterText: '  Confidential  ',
    });

    expect(parsed.companyName).toBe('Northstar Digital');
    expect(parsed.companyWebsite).toBe('https://northstar.example');
    expect(parsed.companyContactEmail).toBe('security@northstar.example');
    expect(parsed.reportFooterText).toBe('Confidential');
  });

  it('accepts a public preview snapshot', () => {
    expect(reportPreviewSnapshotSchema.safeParse(buildSnapshot()).success).toBe(
      true,
    );
  });

  it('rejects internal fields, invalid risk summary counts, and empty warnings', () => {
    expect(
      reportPreviewSnapshotSchema.safeParse({
        ...buildSnapshot(),
        company: {
          ...buildSnapshot().company,
          createdAt: '2026-06-23T00:00:00.000Z',
        },
      }).success,
    ).toBe(false);

    expect(
      reportPreviewSnapshotSchema.safeParse({
        ...buildSnapshot(),
        assessment: {
          ...buildSnapshot().assessment,
          updatedAt: '2026-06-23T00:00:00.000Z',
        },
      }).success,
    ).toBe(false);

    expect(
      reportPreviewSnapshotSchema.safeParse({
        ...buildSnapshot(),
        selectedThreats: [
          {
            ...buildThreat(),
            unexpectedField: true,
            createdAt: '2026-06-23T00:00:00.000Z',
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      reportPreviewSnapshotSchema.safeParse({
        ...buildSnapshot(),
        selectedEvidence: [
          {
            ...buildEvidence(),
            unexpectedField: true,
            filePath: 'uploads/evidence/evidence.png',
            storageKey: 'storage/evidence/evidence.png',
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      reportPreviewSnapshotSchema.safeParse({
        ...buildSnapshot(),
        riskSummary: {
          overallRisk: 'high',
          threatCount: -1,
          evidenceCount: 1,
        },
      }).success,
    ).toBe(false);

    expect(
      reportPreviewSnapshotSchema.safeParse({
        ...buildSnapshot(),
        riskSummary: {
          overallRisk: 'high',
          threatCount: 1.5,
          evidenceCount: 1,
        },
      }).success,
    ).toBe(false);

    expect(
      reportPreviewSnapshotSchema.safeParse({
        ...buildSnapshot(),
        warnings: [''],
      }).success,
    ).toBe(false);
  });
});
