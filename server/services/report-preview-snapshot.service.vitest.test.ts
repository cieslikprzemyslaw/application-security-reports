import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import type { ReportPreviewBranding } from '../../src/domain/report-preview.js';
import {
  assessment,
  branding,
  buildSnapshot,
  company,
  evidenceId,
  request,
  selectedEvidence,
  selectedThreat,
  threatId,
} from './report-preview-snapshot.service.vitest.fixtures.js';
import { buildReportPreviewSnapshot } from './report-preview-snapshot.service.js';

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
    expect(snapshot.assessment.cweCatalogVersion).toBe('4.20');
    expect(snapshot.selectedThreats[0]?.cweCatalogVersion).toBe('4.20');
    expect(snapshot.selectedThreats[0]?.owaspCategoryLabel).toBe(
      'Broken Access Control',
    );
    expect(snapshot.selectedThreats[0]?.cweMappings).toEqual(
      selectedThreat.cweMappings,
    );
    expect(snapshot.selectedEvidence.map(evidence => evidence.id)).toEqual([
      evidenceId,
    ]);
    expect(snapshot.branding.brandingMode).toBe(request.brandingMode);
    expect(snapshot.warnings).toEqual(['Evidence selection is incomplete']);
  });

  it('freezes custom OWASP category labels in the snapshot', () => {
    const snapshot = buildSnapshot({
      records: {
        assessment,
        threats: [
          {
            ...selectedThreat,
            owaspCategoryCode: 'custom',
            customCategory: 'Business rule bypass',
          },
        ],
        evidence: [selectedEvidence],
      },
    });

    expect(snapshot.selectedThreats[0]?.owaspCategoryLabel).toBe(
      'Business rule bypass',
    );
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

  it('normalizes legacy blank optional values at the public Preview boundary', () => {
    const snapshot = buildSnapshot({
      company: {
        ...company,
        description: '',
        website: '',
        contactName: '',
        contactEmail: '',
        footerText: '',
      },
      records: {
        assessment: {
          ...assessment,
          description: '',
          scope: '',
          startedAt: '',
          completedAt: '',
          applicationName: '',
          environment: '',
          assessmentType: '',
        },
        threats: [
          {
            ...selectedThreat,
            owaspCategoryCode: '',
            customCategory: '',
            affectedAsset: '',
            impact: '',
            recommendation: '',
            remediation: '',
            observation: '',
            reproductionSteps: '',
            affectedComponent: '',
            affectedEndpoint: '',
            risk: '',
            references: '',
            resolutionNote: '',
            acceptedRiskJustification: '',
          },
        ],
        evidence: [
          {
            ...selectedEvidence,
            description: '',
            content: '',
            fileName: '',
            mimeType: '',
            capturedAt: '',
            httpExchanges: [
              {
                ...selectedEvidence.httpExchanges![0]!,
                response: {
                  ...selectedEvidence.httpExchanges![0]!.response,
                  statusText: '',
                },
              },
            ],
          },
        ],
      },
      branding: {
        ...branding,
        companyWebsite: '',
        companyContactEmail: '',
        companyFooterText: '',
        issuerName: '',
        issuerContactName: '',
        issuerContactEmail: '',
        reportFooterText: '',
        reportConfidentialityLabel: '',
      },
    });

    expect(snapshot.company.description).toBeUndefined();
    expect(snapshot.company.website).toBeUndefined();
    expect(snapshot.company.contactEmail).toBeUndefined();
    expect(snapshot.assessment.applicationName).toBeNull();
    expect(snapshot.assessment.startedAt).toBeUndefined();
    expect(snapshot.selectedThreats[0]?.impact).toBeUndefined();
    expect(snapshot.selectedThreats[0]?.recommendation).toBeUndefined();
    expect(snapshot.selectedEvidence[0]?.fileName).toBeUndefined();
    expect(
      snapshot.selectedEvidence[0]?.httpExchanges?.[0]?.response.statusText,
    ).toBeUndefined();
    expect(snapshot.branding.issuerName).toBeUndefined();
    expect(snapshot.branding.issuerContactEmail).toBeUndefined();
  });

  it('normalizes legacy Assessment datetimes to ISO date strings', () => {
    const snapshot = buildSnapshot({
      records: {
        assessment: {
          ...assessment,
          startedAt: '2026-06-01T00:00:00.000Z',
          completedAt: '2026-06-20T15:30:00.000+00:00',
        },
        threats: [selectedThreat],
        evidence: [selectedEvidence],
      },
    });

    expect(snapshot.assessment.startedAt).toBe('2026-06-01');
    expect(snapshot.assessment.completedAt).toBe('2026-06-20');
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
