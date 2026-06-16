import { styled, css } from 'styled-components';

const StyledAssessmentTable = styled.div`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    width: 100%;
    overflow-x: auto;

    .assessment-table__table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      min-width: 52rem;
    }

    .assessment-table__head {
      background-color: ${colors.neutral.grey50};
    }

    .assessment-table__header-cell {
      padding: 0;
      border-bottom: 1px solid ${colors.border.subtle};
      font-size: ${typography.label.small.size};
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.muted};
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    .assessment-table__row > td {
      border-bottom: 1px solid ${colors.border.subtle};
      background-color: ${colors.surface.card};
    }

    .assessment-table__row--clickable {
      cursor: pointer;
    }

    .assessment-table__row--clickable:hover > td {
      background-color: ${colors.neutral.grey50};
    }

    .assessment-table__row--clickable:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: -2px;
    }

    .assessment-table__row:last-child > td {
      border-bottom: 0;
    }

    .assessment-table__cell {
      padding: 0.5rem ${spacing.s};
      color: ${colors.text.secondary};
      vertical-align: middle;
    }

    .assessment-table__name {
      display: block;
      color: ${colors.text.primary};
    }

    .assessment-table__type-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.5rem;
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.sm};
      font-size: ${typography.body.small.size};
      background-color: ${colors.neutral.grey50};
    }

    .assessment-table__sort-button {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: ${spacing.xxs};
      width: 100%;
      padding: 0.75rem ${spacing.s};
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      font-weight: ${typography.fontWeights.semibold};
      text-transform: inherit;
      letter-spacing: inherit;
      white-space: nowrap;
      cursor: pointer;
    }

    .assessment-table__sort-button:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: -2px;
    }

    .assessment-table__sort-indicator {
      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .assessment-table__findings-count {
      color: ${colors.text.primary};
    }

    .assessment-table__actions {
      display: flex;
      justify-content: flex-end;
    }

    .assessment-table__empty-cell {
      padding: 1rem ${spacing.s};
      color: ${colors.text.muted};
      text-align: center;
    }
  `}
`;

export default StyledAssessmentTable;
