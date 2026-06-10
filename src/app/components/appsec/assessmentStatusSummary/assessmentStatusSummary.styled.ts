import styled, { css } from 'styled-components';

const StyledAssessmentStatusSummary = styled.div.attrs({
  className: 'assessment-status-summary',
})`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const StatusSummaryItem = styled.div.attrs({
  className: 'assessment-status-summary-status-summary-item',
})<{
  $tone: 'brand' | 'success' | 'warning' | 'neutral';
}>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxs};

  padding: ${({ theme }) => theme.spacing.s};

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.md};

  ${({ theme, $tone }) => {
    const tones = {
      brand: {
        color: theme.colors.brand.primary,
        background: theme.colors.brand.wash,
      },
      success: {
        color: theme.colors.severity.low.text,
        background: theme.colors.severity.low.background,
      },
      warning: {
        color: theme.colors.severity.medium.text,
        background: theme.colors.severity.medium.background,
      },
      neutral: {
        color: theme.colors.text.secondary,
        background: theme.colors.neutral.grey100,
      },
    } as const;

    return css`
      color: ${tones[$tone].color};
      background-color: ${tones[$tone].background};
    `;
  }}
`;

export const StatusSummaryValue = styled.strong.attrs({
  className: 'assessment-status-summary-status-summary-value',
})`
  font-size: ${({ theme }) => theme.typography.headings.h4.size};

  line-height: ${({ theme }) => theme.typography.headings.h4.lineHeight};
`;

export const StatusSummaryLabel = styled.span.attrs({
  className: 'assessment-status-summary-status-summary-label',
})`
  font-size: ${({ theme }) => theme.typography.body.small.size};
`;

export default StyledAssessmentStatusSummary;
