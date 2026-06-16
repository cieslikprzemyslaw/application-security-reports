import React from 'react';
import { ThemeProvider, useTheme } from 'styled-components';

import AssessmentStatusChart from '~/app/components/appsec/assessmentStatusChart';
import ReportHeader from '~/app/components/appsec/reportHeader';
import { LightThemeProvider, darkTheme, lightTheme } from '~/theme';

import type { SettingsValue } from './settings.type';
import { createSettingsLogoInitials } from './settings.utils';

const reportPreviewItems = [
  { label: 'Completed', count: 11, tone: 'completed' as const },
  { label: 'In Progress', count: 7, tone: 'inProgress' as const },
  { label: 'In Review', count: 4, tone: 'inReview' as const },
  { label: 'Draft', count: 2, tone: 'draft' as const },
];

const SettingsLogoMark = ({ label }: { label: string }) => {
  const { colors, radii, spacing, typography } = useTheme();

  return (
    <span
      aria-label={`${label} logo`}
      role="img"
      style={{
        alignItems: 'center',
        backgroundColor: colors.brand.primary,
        borderRadius: radii.md,
        color: colors.neutral.white,
        display: 'inline-flex',
        flexShrink: 0,
        fontSize: typography.label.medium.size,
        fontWeight: typography.fontWeights.semibold,
        height: '3rem',
        justifyContent: 'center',
        letterSpacing: '0.08em',
        minWidth: '3rem',
        paddingInline: spacing.xs,
      }}
    >
      {createSettingsLogoInitials(label)}
    </span>
  );
};

export interface SettingsPreviewProps {
  value: SettingsValue;
  previewTheme: 'light' | 'dark';
}

const SettingsPreview = ({ value, previewTheme }: SettingsPreviewProps) => {
  const previewThemeObject = previewTheme === 'dark' ? darkTheme : lightTheme;
  const organisationName = value.organisationName || 'Northstar Digital';
  const consultantName = value.consultantName || 'Alex Mercer';
  const consultantEmail =
    value.consultantEmail || 'security@northstardigital.io';
  const reportTitle = value.defaultReportTitle || 'Security Assessment Report';
  const reportFooterText =
    value.reportFooterText || 'Confidential - do not distribute.';
  const reportConfidentialLabel = value.confidentialReports
    ? 'Confidential label enabled'
    : 'Confidential label disabled';

  return (
    <div className="settings-preview-stack">
      <section className="settings-preview-card">
        <header className="settings-preview-card-header">
          <div>
            <h3 className="settings-preview-title">Brand mark and chart</h3>

            <p className="settings-preview-subtitle">
              Rendered in the selected {previewTheme} theme.
            </p>
          </div>
        </header>

        <ThemeProvider theme={previewThemeObject}>
          <div className="settings-brand-preview">
            <div className="settings-brand-row">
              <SettingsLogoMark label={organisationName} />

              <div className="settings-brand-copy">
                <strong>{organisationName}</strong>
                <span>{consultantName}</span>
                <span>{consultantEmail}</span>
              </div>
            </div>

            <AssessmentStatusChart
              items={reportPreviewItems}
              centreLabel="reports"
            />
          </div>
        </ThemeProvider>
      </section>

      <section className="settings-preview-card">
        <header className="settings-preview-card-header">
          <div>
            <h3 className="settings-preview-title">Report header preview</h3>

            <p className="settings-preview-subtitle">
              Always rendered with the light report theme for print and PDF
              output.
            </p>
          </div>
        </header>

        <LightThemeProvider>
          <div className="settings-report-preview">
            <ReportHeader
              companyName={organisationName}
              companyLogo={<SettingsLogoMark label={organisationName} />}
              reportTitle={reportTitle}
              applicationName="Customer Services Portal"
              environment="Production"
              assessmentId="NSD-CSP-2026-014"
              dateRange="12 May - 30 May 2026"
              testerName={consultantName}
            />

            <div className="settings-report-footer-preview">
              <strong>{reportConfidentialLabel}</strong>

              <span>{reportFooterText}</span>
            </div>
          </div>
        </LightThemeProvider>
      </section>
    </div>
  );
};

export default SettingsPreview;
