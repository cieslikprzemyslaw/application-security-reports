import styled, { css } from 'styled-components';

const StyledAssessmentStatusSummary = styled.div.attrs({
  className: 'assessment-status-summary',
})`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    gap: ${spacing.xxs};

    .assessment-status-summary-item {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};

      padding: ${spacing.s};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
    }

    .assessment-status-summary-item--brand {
      color: ${colors.brand.primary};
      background-color: ${colors.brand.wash};
    }

    .assessment-status-summary-item--success {
      color: ${colors.severity.low.text};
      background-color: ${colors.severity.low.background};
    }

    .assessment-status-summary-item--warning {
      color: ${colors.severity.medium.text};
      background-color: ${colors.severity.medium.background};
    }

    .assessment-status-summary-item--neutral {
      color: ${colors.text.secondary};
      background-color: ${colors.neutral.grey100};
    }

    .assessment-status-summary-value {
      font-size: ${typography.headings.h4.size};
      line-height: ${typography.headings.h4.lineHeight};
    }

    .assessment-status-summary-label {
      font-size: ${typography.body.small.size};
    }
  `}
`;

export default StyledAssessmentStatusSummary;
