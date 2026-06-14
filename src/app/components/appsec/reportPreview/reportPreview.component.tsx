import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';
import { LightThemeProvider } from '~/theme';

import StyledReportPreview from './reportPreview.styled';

import type { ReportPreviewProps } from './reportPreview.type';

const ReportPreview = ({
  header,
  executiveSummary,
  riskSummary,
  threats,
  footer,
  ...rest
}: ReportPreviewProps) => (
  <LightThemeProvider>
    <StyledReportPreview {...rest}>
      {header}

      <section className="report-preview-section">
        <h2 className="report-preview-section-title">Executive summary</h2>

        <p className="report-preview-executive-summary">{executiveSummary}</p>
      </section>

      <section className="report-preview-section">
        <h2 className="report-preview-section-title">Risk summary</h2>

        {riskSummary}
      </section>

      <section className="report-preview-section">
        <h2 className="report-preview-section-title">Findings</h2>

        <div className="report-preview-threat-list">
          {threats.map((threat, index) => (
            <section key={threat.id} className="report-preview-threat-item">
              <div className="report-preview-threat-header">
                <h3 className="report-preview-threat-title">
                  {index + 1}. {threat.title}
                </h3>

                <SeverityBadge severity={threat.severity} size="small" />
              </div>

              <div className="report-preview-threat-section">
                <h4 className="report-preview-threat-section-title">
                  Observation
                </h4>

                <div className="report-preview-threat-section-body">
                  {threat.observation}
                </div>
              </div>

              <div className="report-preview-threat-section">
                <h4 className="report-preview-threat-section-title">Risk</h4>

                <div className="report-preview-threat-section-body">
                  {threat.risk}
                </div>
              </div>

              <div className="report-preview-threat-section">
                <h4 className="report-preview-threat-section-title">
                  Recommendation
                </h4>

                <div className="report-preview-threat-section-body">
                  {threat.recommendation}
                </div>
              </div>

              {threat.evidence && (
                <div className="report-preview-threat-section">
                  <h4 className="report-preview-threat-section-title">
                    Evidence
                  </h4>

                  <div className="report-preview-threat-section-body">
                    {threat.evidence}
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      </section>

      {footer && <footer className="report-preview-footer">{footer}</footer>}
    </StyledReportPreview>
  </LightThemeProvider>
);

export default ReportPreview;
