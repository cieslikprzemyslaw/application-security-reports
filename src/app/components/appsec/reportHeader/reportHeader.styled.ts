import styled, { css } from 'styled-components';

const StyledReportHeader = styled.header.attrs({ className: 'report-header' })`
  ${({ theme: { colors, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};

    padding-bottom: ${spacing.l};

    border-bottom: 2px solid ${colors.border.strong};

    .report-header-brand-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.m};
    }

    .report-header-company {
      display: flex;
      align-items: center;
      gap: ${spacing.s};
    }

    .report-header-logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      max-width: 10rem;
      max-height: 3rem;
    }

    .report-header-company-name {
      color: ${colors.text.primary};
    }

    .report-header-meta {
      margin: 0;

      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
      text-align: right;
    }

    .report-header-meta-row {
      display: grid;
      grid-template-columns: auto auto;
      gap: ${spacing.xxs};
    }

    .report-header-meta-label {
      font-weight: ${typography.fontWeights.medium};
    }

    .report-header-meta-value {
      margin: 0;
    }

    .report-header-title-group {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};
    }

    .report-header-title {
      font-size: ${typography.headings.h2.size};
      line-height: ${typography.headings.h2.lineHeight};
    }

    .report-header-subtitle {
      color: ${colors.text.secondary};
    }
  `}
`;

export default StyledReportHeader;
