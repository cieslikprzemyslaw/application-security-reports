import { styled, css } from 'styled-components';

const StyledDataTable = styled.div.attrs({
  className: 'data-table-wrapper',
})`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    width: 100%;
    overflow-x: auto;

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table-head {
      background-color: ${colors.neutral.grey50};
    }

    .data-table-header-cell {
      padding: ${spacing.xs} ${spacing.s};

      border-bottom: 1px solid ${colors.border.subtle};

      font-size: ${typography.label.small.size};
      line-height: ${typography.label.small.lineHeight};
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.muted};

      text-align: left;
      white-space: nowrap;
    }

    .data-table-header-cell--center {
      text-align: center;
    }

    .data-table-header-cell--right {
      text-align: right;
    }

    .data-table-body {
    }

    .data-table-row {
      border-bottom: 1px solid ${colors.border.subtle};
      cursor: default;
    }

    .data-table-row--clickable {
      cursor: pointer;
    }

    .data-table-row--clickable:hover {
      background-color: ${colors.neutral.grey50};
    }

    .data-table-row:last-child {
      border-bottom: 0;
    }

    .data-table-cell {
      padding: ${spacing.s};

      color: ${colors.text.secondary};
      vertical-align: middle;
    }

    .data-table-cell--center {
      text-align: center;
    }

    .data-table-cell--right {
      text-align: right;
    }

    .data-table-empty-cell {
      padding: ${spacing.xxl} ${spacing.m};
    }

    .data-table-skeleton {
      width: 100%;
      height: 1rem;

      border-radius: ${radii.sm};

      background: linear-gradient(
        90deg,
        ${colors.neutral.grey100},
        ${colors.neutral.grey200},
        ${colors.neutral.grey100}
      );

      background-size: 200% 100%;
      animation: data-table-loading 1.4s ease infinite;
    }

    @keyframes data-table-loading {
      from {
        background-position: 200% 0;
      }

      to {
        background-position: -200% 0;
      }
    }
  `}
`;

export default StyledDataTable;
