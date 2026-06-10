import { styled, css } from 'styled-components';

const StyledReportPreview = styled.article.attrs({
  className: 'report-preview',
})`
  ${({ theme: { colors, layoutSizes, shadows, spacing, typography } }) => css`
    width: min(100%, ${layoutSizes.reportMaxWidth});

    margin: 0 auto;
    padding: ${spacing.xxl};

    border: 1px solid ${colors.border.subtle};
    background-color: ${colors.neutral.white};
    box-shadow: ${shadows.md};

    @media print {
      width: 100%;
      padding: 0;

      border: 0;
      box-shadow: none;
    }

    .report-preview-section {
      margin-top: ${spacing.xl};
    }

    .report-preview-section-title {
      margin-bottom: ${spacing.s};

      font-size: ${typography.headings.h4.size};
      line-height: ${typography.headings.h4.lineHeight};
    }

    .report-preview-executive-summary {
      color: ${colors.text.secondary};
    }

    .report-preview-threat-list {
      display: flex;
      flex-direction: column;
      gap: ${spacing.l};
    }

    .report-preview-threat-item {
      break-inside: avoid;
      page-break-inside: avoid;

      padding-top: ${spacing.m};

      border-top: 1px solid ${colors.border.subtle};
    }

    .report-preview-threat-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.s};

      margin-bottom: ${spacing.s};
    }

    .report-preview-threat-title {
      font-size: ${typography.headings.h5.size};
      line-height: ${typography.headings.h5.lineHeight};
    }

    .report-preview-threat-section {
      margin-top: ${spacing.s};
    }

    .report-preview-threat-section-title {
      margin-bottom: 0.25rem;

      font-size: ${typography.headings.h6.size};
      line-height: ${typography.headings.h6.lineHeight};
    }

    .report-preview-threat-section-body {
      color: ${colors.text.secondary};
    }

    .report-preview-footer {
      margin-top: ${spacing.xl};
      padding-top: ${spacing.s};

      border-top: 1px solid ${colors.border.subtle};

      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
      text-align: center;
    }
  `}
`;

export default StyledReportPreview;
