import styled from 'styled-components';

const StyledReportPreview = styled.article.attrs({
  className: 'report-preview',
})`
  width: min(100%, ${({ theme }) => theme.layoutSizes.reportMaxWidth});

  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xxl};

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  background-color: ${({ theme }) => theme.colors.neutral.white};

  box-shadow: ${({ theme }) => theme.shadows.md};

  @media print {
    width: 100%;
    padding: 0;

    border: 0;
    box-shadow: none;
  }
`;

export const ReportSection = styled.section.attrs({
  className: 'report-preview-report-section',
})`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

export const ReportSectionTitle = styled.h2.attrs({
  className: 'report-preview-report-section-title',
})`
  margin-bottom: ${({ theme }) => theme.spacing.s};

  font-size: ${({ theme }) => theme.typography.headings.h4.size};

  line-height: ${({ theme }) => theme.typography.headings.h4.lineHeight};
`;

export const ReportExecutiveSummary = styled.p.attrs({
  className: 'report-preview-report-executive-summary',
})`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const ReportThreatList = styled.div.attrs({
  className: 'report-preview-report-threat-list',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.l};
`;

export const ReportThreatItem = styled.section.attrs({
  className: 'report-preview-report-threat-item',
})`
  break-inside: avoid;
  page-break-inside: avoid;

  padding-top: ${({ theme }) => theme.spacing.m};

  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export const ReportThreatHeader = styled.div.attrs({
  className: 'report-preview-report-threat-header',
})`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s};

  margin-bottom: ${({ theme }) => theme.spacing.s};
`;

export const ReportThreatTitle = styled.h3.attrs({
  className: 'report-preview-report-threat-title',
})`
  font-size: ${({ theme }) => theme.typography.headings.h5.size};

  line-height: ${({ theme }) => theme.typography.headings.h5.lineHeight};
`;

export const ReportThreatSection = styled.div.attrs({
  className: 'report-preview-report-threat-section',
})`
  margin-top: ${({ theme }) => theme.spacing.s};
`;

export const ReportThreatSectionTitle = styled.h4.attrs({
  className: 'report-preview-report-threat-section-title',
})`
  margin-bottom: 0.25rem;

  font-size: ${({ theme }) => theme.typography.headings.h6.size};

  line-height: ${({ theme }) => theme.typography.headings.h6.lineHeight};
`;

export const ReportThreatSectionBody = styled.div.attrs({
  className: 'report-preview-report-threat-section-body',
})`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const ReportFooter = styled.footer.attrs({
  className: 'report-preview-report-footer',
})`
  margin-top: ${({ theme }) => theme.spacing.xl};

  padding-top: ${({ theme }) => theme.spacing.s};

  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};

  text-align: center;
`;

export default StyledReportPreview;
