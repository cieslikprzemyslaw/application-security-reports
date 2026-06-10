import { styled, css } from 'styled-components';

const StyledRecentAssessmentTable = styled.div.attrs({
  className: 'recent-assessment-table',
})`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    width: 100%;
    overflow-x: auto;

    .recent-assessment-table-element {
      width: 100%;
      border-collapse: collapse;
    }

    .recent-assessment-table-head {
      background-color: ${colors.neutral.grey50};
    }

    .recent-assessment-table-header-cell {
      padding: ${spacing.xs} ${spacing.s};

      border-bottom: 1px solid ${colors.border.subtle};

      font-size: ${typography.label.small.size};
      line-height: ${typography.label.small.lineHeight};
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.muted};

      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .recent-assessment-table-row {
      border-bottom: 1px solid ${colors.border.subtle};
      cursor: default;
    }

    .recent-assessment-table-row--clickable {
      cursor: pointer;
    }

    .recent-assessment-table-row--clickable:hover {
      background-color: ${colors.neutral.grey50};
    }

    .recent-assessment-table-row:last-child {
      border-bottom: 0;
    }

    .recent-assessment-table-cell {
      padding: 0.5rem ${spacing.s};

      color: ${colors.text.secondary};
      vertical-align: middle;
    }

    .recent-assessment-table-name {
      display: block;
      color: ${colors.text.primary};
    }

    .recent-assessment-table-company {
      display: block;
      margin-top: 0.125rem;

      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .recent-assessment-table-type-badge {
      display: inline-flex;
      align-items: center;

      padding: 0.125rem 0.5rem;

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.sm};

      font-size: ${typography.body.small.size};

      color: ${colors.text.secondary};
      background-color: ${colors.neutral.grey50};
    }

    .recent-assessment-table-findings-count {
      color: ${colors.text.primary};
    }
  `}
`;

export default StyledRecentAssessmentTable;
