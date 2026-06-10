import styled, { css } from 'styled-components';

const StyledThreatTable = styled.div`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    width: 100%;
    overflow-x: auto;

    .threat-table {
      width: 100%;
      border-collapse: collapse;
    }

    .threat-table-head {
      background-color: ${colors.neutral.grey50};
    }

    .threat-table-header-cell {
      padding: ${spacing.xs} ${spacing.s};

      border-bottom: 1px solid ${colors.border.subtle};

      font-size: ${typography.label.small.size};
      line-height: ${typography.label.small.lineHeight};
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.muted};

      text-align: left;
      white-space: nowrap;
    }

    .threat-table-row {
      border-bottom: 1px solid ${colors.border.subtle};
      cursor: default;
    }

    .threat-table-row--clickable {
      cursor: pointer;
    }

    .threat-table-row--clickable:hover {
      background-color: ${colors.neutral.grey50};
    }

    .threat-table-row:last-child {
      border-bottom: 0;
    }

    .threat-table-cell {
      padding: ${spacing.s};
      color: ${colors.text.secondary};
      vertical-align: middle;
    }

    .threat-table-threat-title-cell {
      min-width: 14rem;
    }

    .threat-table-threat-title {
      display: block;
      color: ${colors.text.primary};
    }

    .threat-table-threat-endpoint {
      display: block;
      margin-top: 0.125rem;

      font-family: ${typography.fontFamilies.mono};
      font-size: ${typography.mono.small.size};
      color: ${colors.text.muted};
    }

    .threat-table-stride-badge {
      display: inline-flex;
      align-items: center;

      padding: 0.125rem 0.5rem;
      border-radius: ${radii.pill};

      font-size: ${typography.body.small.size};
      color: ${colors.text.secondary};
      background-color: ${colors.neutral.grey100};
    }

    .threat-table-threat-date {
      white-space: nowrap;
      color: ${colors.text.muted};
    }
  `}
`;

export default StyledThreatTable;
