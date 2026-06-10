import styled, { css } from 'styled-components';

const StyledGlobalThreatTable = styled.div`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    width: 100%;
    overflow-x: auto;

    .global-threat-table {
      width: 100%;
      border-collapse: collapse;
    }

    .global-threat-table-head {
      background-color: ${colors.neutral.grey50};
    }

    .global-threat-table-header-cell {
      padding: 0.75rem ${spacing.s};

      border-bottom: 1px solid ${colors.border.subtle};

      font-size: ${typography.label.small.size};
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.muted};

      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    .global-threat-table-row {
      border-bottom: 1px solid ${colors.border.subtle};
      cursor: default;
    }

    .global-threat-table-row--clickable {
      cursor: pointer;
    }

    .global-threat-table-row--clickable:hover {
      background-color: ${colors.neutral.grey50};
    }

    .global-threat-table-row:last-child {
      border-bottom: 0;
    }

    .global-threat-table-cell {
      padding: 0.625rem ${spacing.s};
      color: ${colors.text.secondary};
      vertical-align: middle;
    }

    .global-threat-table-threat-title {
      display: block;
      color: ${colors.text.primary};
    }

    .global-threat-table-threat-id {
      display: block;
      margin-top: 0.125rem;

      font-family: ${typography.fontFamilies.mono};
      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .global-threat-table-app-name {
      display: block;
      color: ${colors.text.primary};
    }

    .global-threat-table-company-name {
      display: block;
      margin-top: 0.125rem;

      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .global-threat-table-stride {
      display: inline-flex;
      align-items: center;

      padding: 0.125rem 0.5rem;
      border-radius: ${radii.pill};

      font-size: ${typography.body.small.size};
      background-color: ${colors.neutral.grey100};
    }

    .global-threat-table-chevron {
      color: ${colors.neutral.grey400};
      font-size: 1.25rem;
    }
  `}
`;

export default StyledGlobalThreatTable;
