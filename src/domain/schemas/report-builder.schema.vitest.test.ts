import { describe, expect, it } from 'vitest';

import {
  reportBuilderBrandingSchema,
  reportBuilderConfigurationSchema,
  reportBuilderRouteStateSchema,
  reportBuilderSelectionSchema,
  reportBuilderStateSchema,
} from './report-builder.schema.js';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const evidenceId = 'evd_00000000-0000-0000-0000-000000000001';

describe('Report builder runtime schemas', () => {
  it('accepts valid company-owned canonical and route builder states', () => {
    expect(
      reportBuilderStateSchema.safeParse({
        companyId,
        selection: {},
        configuration: {},
        branding: {},
      }).success,
    ).toBe(true);

    expect(
      reportBuilderRouteStateSchema.safeParse({
        companyId,
        reportId,
        selection: { selectedAssessmentId: assessmentId },
        configuration: { includeEvidence: true },
      }).success,
    ).toBe(true);

    expect(
      reportBuilderStateSchema.safeParse({
        companyId,
        reportId,
        selection: {
          selectedAssessmentId: assessmentId,
          selectedThreatIds: [threatId],
          selectedEvidenceIds: [evidenceId],
        },
        configuration: {
          methodology: 'OWASP ASVS / WSTG',
          reportStyle: 'Technical & structured',
          includeEvidence: true,
        },
        branding: {
          brandingMode: 'client',
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
          defaultBrandingMode: 'client',
        },
      }).success,
    ).toBe(true);
  });

  it('rejects invalid company ownership, duplicate selections, and malformed route branding', () => {
    expect(
      reportBuilderStateSchema.safeParse({
        companyId: assessmentId,
        selection: {},
        configuration: {},
        branding: {},
      }).success,
    ).toBe(false);

    expect(
      reportBuilderStateSchema.safeParse({
        companyId,
        reportId: 'asm_00000000-0000-0000-0000-000000000001',
        selection: {},
        configuration: {},
        branding: {},
      }).success,
    ).toBe(false);

    const canonicalWithoutAssessment = reportBuilderStateSchema.safeParse({
      companyId,
      reportId,
      selection: {},
      configuration: {},
      branding: {},
    });

    expect(canonicalWithoutAssessment.success).toBe(false);

    if (!canonicalWithoutAssessment.success) {
      expect(canonicalWithoutAssessment.error.issues).toContainEqual(
        expect.objectContaining({
          path: ['selection', 'selectedAssessmentId'],
          message: 'A persisted Report requires a selected Assessment.',
        }),
      );
    }

    const routeWithoutAssessment = reportBuilderRouteStateSchema.safeParse({
      companyId,
      reportId,
    });

    expect(routeWithoutAssessment.success).toBe(false);

    if (!routeWithoutAssessment.success) {
      expect(routeWithoutAssessment.error.issues).toContainEqual(
        expect.objectContaining({
          path: ['selection', 'selectedAssessmentId'],
          message: 'A persisted Report requires a selected Assessment.',
        }),
      );
    }
    expect(
      reportBuilderSelectionSchema.safeParse({
        selectedAssessmentId: assessmentId,
        selectedThreatIds: [threatId, threatId],
        selectedEvidenceIds: [evidenceId],
      }).success,
    ).toBe(false);

    expect(
      reportBuilderSelectionSchema.safeParse({
        selectedAssessmentId: 'cmp_00000000-0000-0000-0000-000000000001',
        selectedThreatIds: [threatId],
        selectedEvidenceIds: [evidenceId],
      }).success,
    ).toBe(false);

    expect(
      reportBuilderConfigurationSchema.safeParse({
        methodology: '  OWASP ASVS / WSTG  ',
        reportStyle: '  Technical & structured  ',
        includeEvidence: true,
        snapshot: true,
      }).success,
    ).toBe(false);

    expect(
      reportBuilderBrandingSchema.safeParse({
        brandingMode: 'issuer',
        companyName: 'Northstar Digital',
        companyWebsite: 'not-a-url',
      }).success,
    ).toBe(false);

    expect(
      reportBuilderRouteStateSchema.safeParse({
        companyId,
        selection: {
          selectedThreatIds: [threatId],
          snapshot: true,
        },
      }).success,
    ).toBe(false);

    expect(
      reportBuilderStateSchema.safeParse({
        companyId,
        reportId,
        selection: {
          selectedAssessmentId: assessmentId,
          selectedThreatIds: [threatId],
          selectedEvidenceIds: [evidenceId],
          unexpected: true,
        },
        configuration: {
          includeEvidence: false,
        },
        branding: {
          brandingMode: 'issuer',
        },
      }).success,
    ).toBe(false);

    expect(
      reportBuilderRouteStateSchema.safeParse({
        companyId,
        branding: {
          brandingMode: 'client',
          companyName: 'Northstar Digital',
        },
      }).success,
    ).toBe(false);
  });
});
