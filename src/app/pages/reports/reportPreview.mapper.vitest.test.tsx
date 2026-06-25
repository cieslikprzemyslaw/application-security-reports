import React from 'react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '~/test/render';
import ReportBuilderPreview from './reportBuilderPreview.component';
import { toReportPreviewPresentation } from './reportPreview.mapper';
import { previewSnapshot } from './reportPreview.testFixtures';

import type { ReportBrandingMode, ReportPreviewSnapshot } from '~/domain';

const withBrandingMode = (
  brandingMode: ReportBrandingMode,
): ReportPreviewSnapshot => ({
  ...previewSnapshot,
  branding: {
    ...previewSnapshot.branding,
    brandingMode,
  },
});

describe('report preview presentation', () => {
  it.each([
    [
      'issuer',
      previewSnapshot.branding.issuerLogoUrl,
      'AppSec Consulting Ltd logo',
    ],
    [
      'client',
      previewSnapshot.branding.companyLogoUrl,
      'Northstar Digital logo',
    ],
    ['none', undefined, ''],
  ] as const)(
    'maps %s branding to the approved logo',
    (brandingMode, expectedLogoUrl, expectedLogoAlt) => {
      const presentation = toReportPreviewPresentation(
        withBrandingMode(brandingMode),
      );

      expect(presentation.logoUrl).toBe(expectedLogoUrl);
      expect(presentation.logoAlt).toBe(expectedLogoAlt);
    },
  );

  it('falls back to the report footer for client branding when the company footer is missing', () => {
    const snapshot: ReportPreviewSnapshot = {
      ...withBrandingMode('client'),
      branding: {
        ...previewSnapshot.branding,
        brandingMode: 'client',
        companyFooterText: undefined,
        reportFooterText: 'Confidential - do not distribute.',
      },
    };

    const presentation = toReportPreviewPresentation(snapshot);

    expect(presentation.cover.footerText).toBe(
      'Confidential - do not distribute.',
    );
  });

  it('uses saved ReportVersion metadata without rebuilding snapshot content', () => {
    const presentation = toReportPreviewPresentation(previewSnapshot, {
      reportId: 'rpt_00000000-0000-0000-0000-000000000029',
      issuedDate: '2026-06-25',
    });

    expect(presentation.cover.reportId).toBe(
      'rpt_00000000-0000-0000-0000-000000000029',
    );
    expect(presentation.cover.issuedDate).toBe('25 Jun 2026');
    expect(presentation.cover.applicationName).toBe(
      previewSnapshot.assessment.applicationName,
    );
  });

  it('derives reusable risk and severity presentation from the immutable snapshot', () => {
    const snapshot: ReportPreviewSnapshot = {
      ...previewSnapshot,
      selection: {
        ...previewSnapshot.selection,
        threatIds: [
          previewSnapshot.selectedThreats[0].id,
          'thr_00000000-0000-0000-0000-000000000002',
          'thr_00000000-0000-0000-0000-000000000003',
        ],
      },
      selectedThreats: [
        previewSnapshot.selectedThreats[0],
        {
          ...previewSnapshot.selectedThreats[0],
          id: 'thr_00000000-0000-0000-0000-000000000002',
          severity: 'high',
          status: 'mitigated',
        },
        {
          ...previewSnapshot.selectedThreats[0],
          id: 'thr_00000000-0000-0000-0000-000000000003',
          severity: 'low',
          status: 'resolved',
        },
      ],
      riskSummary: {
        ...previewSnapshot.riskSummary,
        threatCount: 3,
      },
    };

    const presentation = toReportPreviewPresentation(snapshot);

    expect(presentation.riskSummary).toMatchObject({
      overallRisk: 'critical',
      totalFindings: 3,
      openThreats: 1,
      retestRequired: 2,
    });
    expect(presentation.severityDistribution).toEqual([
      { severity: 'critical', count: 1 },
      { severity: 'high', count: 1 },
      { severity: 'medium', count: 0 },
      { severity: 'low', count: 1 },
      { severity: 'informational', count: 0 },
    ]);

    const { container } = renderWithProviders(
      <ReportBuilderPreview
        status="success"
        snapshot={snapshot}
        onRetry={() => undefined}
      />,
    );

    expect(container.querySelector('.risk-summary')).toBeInTheDocument();
    expect(
      container.querySelector('.severity-distribution'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Severity distribution. 3 total findings.'),
    ).toBeInTheDocument();
  });

  it('includes Evidence unless it is explicitly disabled and keeps content as text', () => {
    const maliciousText = '<img src=x onerror=alert(1)>';
    const snapshot: ReportPreviewSnapshot = {
      ...withBrandingMode('none'),
      selectedEvidence: [
        {
          ...previewSnapshot.selectedEvidence[0],
          content: maliciousText,
        },
      ],
    };

    const included = toReportPreviewPresentation(snapshot);
    expect(included.cover.findings?.[0]?.evidence?.[0]?.content).toBe(
      maliciousText,
    );

    const legacySnapshot: ReportPreviewSnapshot = {
      ...snapshot,
      configuration: {
        methodology: snapshot.configuration.methodology,
        reportStyle: snapshot.configuration.reportStyle,
      },
    };
    expect(
      toReportPreviewPresentation(legacySnapshot).cover.findings?.[0]
        ?.evidence?.[0]?.content,
    ).toBe(maliciousText);

    const hidden = toReportPreviewPresentation({
      ...snapshot,
      configuration: {
        ...snapshot.configuration,
        includeEvidence: false,
      },
    });
    expect(hidden.cover.findings?.[0]?.evidence).toBeUndefined();

    const { container } = renderWithProviders(
      <ReportBuilderPreview
        status="success"
        snapshot={snapshot}
        onRetry={() => undefined}
      />,
    );

    expect(screen.getByText(maliciousText)).toBeInTheDocument();
    expect(screen.getByText('Supporting material')).toBeInTheDocument();
    expect(
      container.querySelector('.report-evidence-card'),
    ).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders shared Evidence only under the selected Threat branch', () => {
    const firstThreat = previewSnapshot.selectedThreats[0];
    const secondThreatId = 'thr_00000000-0000-0000-0000-000000000002';
    const sharedEvidence = {
      ...previewSnapshot.selectedEvidence[0],
      threatIds: [firstThreat.id, secondThreatId],
    };
    const snapshot: ReportPreviewSnapshot = {
      ...previewSnapshot,
      selection: {
        threatIds: [firstThreat.id, secondThreatId],
        evidenceIds: [sharedEvidence.id],
        evidenceSelections: [
          { threatId: firstThreat.id, evidenceId: sharedEvidence.id },
        ],
      },
      selectedThreats: [
        firstThreat,
        {
          ...firstThreat,
          id: secondThreatId,
          title: 'Second selected Threat',
        },
      ],
      selectedEvidence: [sharedEvidence],
      riskSummary: {
        ...previewSnapshot.riskSummary,
        threatCount: 2,
      },
    };

    const presentation = toReportPreviewPresentation(snapshot);

    expect(presentation.cover.findings?.[0]?.evidence?.[0]?.id).toBe(
      sharedEvidence.id,
    );
    expect(presentation.cover.findings?.[1]?.evidence).toBeUndefined();
  });
});
