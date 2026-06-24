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

  it('includes Evidence only when configured and keeps its content as text', () => {
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
    expect(included.cover.findings?.[0]?.evidence).toBe(maliciousText);

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
    expect(container.querySelector('img')).toBeNull();
  });
});
