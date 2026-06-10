import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledReportPreview, {
  ReportExecutiveSummary,
  ReportFooter,
  ReportSection,
  ReportSectionTitle,
  ReportThreatHeader,
  ReportThreatItem,
  ReportThreatList,
  ReportThreatSection,
  ReportThreatSectionBody,
  ReportThreatSectionTitle,
  ReportThreatTitle,
} from './reportPreview.styled';

import type { ReportPreviewProps } from './reportPreview.type';

const ReportPreview = ({
  header,
  executiveSummary,
  riskSummary,
  threats,
  footer,
  ...rest
}: ReportPreviewProps) => (
  <StyledReportPreview {...rest}>
    {header}

    <ReportSection>
      <ReportSectionTitle>Executive summary</ReportSectionTitle>

      <ReportExecutiveSummary>{executiveSummary}</ReportExecutiveSummary>
    </ReportSection>

    <ReportSection>
      <ReportSectionTitle>Risk summary</ReportSectionTitle>

      {riskSummary}
    </ReportSection>

    <ReportSection>
      <ReportSectionTitle>Findings</ReportSectionTitle>

      <ReportThreatList>
        {threats.map((threat, index) => (
          <ReportThreatItem key={threat.id}>
            <ReportThreatHeader>
              <ReportThreatTitle>
                {index + 1}. {threat.title}
              </ReportThreatTitle>

              <SeverityBadge severity={threat.severity} size="small" />
            </ReportThreatHeader>

            <ReportThreatSection>
              <ReportThreatSectionTitle>Observation</ReportThreatSectionTitle>

              <ReportThreatSectionBody>
                {threat.observation}
              </ReportThreatSectionBody>
            </ReportThreatSection>

            <ReportThreatSection>
              <ReportThreatSectionTitle>Risk</ReportThreatSectionTitle>

              <ReportThreatSectionBody>{threat.risk}</ReportThreatSectionBody>
            </ReportThreatSection>

            <ReportThreatSection>
              <ReportThreatSectionTitle>
                Recommendation
              </ReportThreatSectionTitle>

              <ReportThreatSectionBody>
                {threat.recommendation}
              </ReportThreatSectionBody>
            </ReportThreatSection>

            {threat.evidence && (
              <ReportThreatSection>
                <ReportThreatSectionTitle>Evidence</ReportThreatSectionTitle>

                <ReportThreatSectionBody>
                  {threat.evidence}
                </ReportThreatSectionBody>
              </ReportThreatSection>
            )}
          </ReportThreatItem>
        ))}
      </ReportThreatList>
    </ReportSection>

    {footer && <ReportFooter>{footer}</ReportFooter>}
  </StyledReportPreview>
);

export default ReportPreview;
