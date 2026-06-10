import { styled, css } from 'styled-components';

import type { AssessmentLogoTone } from './assessmentTable.type';

const StyledAssessmentTable = styled.div`
  ${({ theme: { colors, radii, spacing, transitions, typography } }) => css`
    width: 100%;
    overflow-x: auto;

    .assessment-table__table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }

    .assessment-table__head {
      background-color: ${colors.neutral.grey50};
    }

    .assessment-table__header-cell {
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

    .assessment-table__row {
      cursor: default;
    }

    .assessment-table__row > td {
      border-bottom: 1px solid ${colors.border.subtle};
      background-color: ${colors.surface.card};
      transition: background-color ${transitions.fast};
    }

    .assessment-table__row:last-child > td {
      border-bottom: 0;
    }

    .assessment-table__row--clickable {
      cursor: pointer;
    }

    .assessment-table__row--clickable:hover > td,
    .assessment-table__row--clickable:focus-within > td {
      background-color: ${colors.brand.wash};
    }

    .assessment-table__row:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: -2px;
    }

    .assessment-table__cell {
      padding: 0.5rem ${spacing.s};
      color: ${colors.text.secondary};
      vertical-align: middle;
    }

    .assessment-table__identity {
      display: grid;
      grid-template-columns: 2.25rem minmax(0, 1fr);
      align-items: center;
      gap: ${spacing.xxs};
      min-width: 18rem;
    }

    .assessment-table__initials {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 2.25rem;
      height: 2.25rem;

      border-radius: ${radii.md};
      font-size: ${typography.body.small.size};
      color: ${colors.neutral.white};
    }

    .assessment-table__initials--blue {
      background-color: ${colors.brand.primary};
    }

    .assessment-table__initials--indigo {
      background-color: ${colors.brand.accent};
    }

    .assessment-table__initials--cyan {
      background-color: ${colors.severity.informational.solid};
    }

    .assessment-table__initials--green {
      background-color: ${colors.severity.low.solid};
    }

    .assessment-table__initials--purple {
      background-color: ${colors.status.retestRequired.text};
    }

    .assessment-table__initials--slate {
      background-color: ${colors.neutral.grey600};
    }

    .assessment-table__name {
      display: block;
      color: ${colors.text.primary};
    }

    .assessment-table__meta {
      display: block;
      margin-top: 0.125rem;
      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
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

    .assessment-table__status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.5rem;
      border: 1px solid;
      border-radius: ${radii.sm};
      font-size: ${typography.body.small.size};
      font-weight: ${typography.fontWeights.medium};
    }

    .assessment-table__status-badge--Draft {
      color: ${colors.text.secondary};
      background-color: ${colors.neutral.grey100};
      border-color: ${colors.border.subtle};
    }

    .assessment-table__status-badge--In-Progress {
      color: ${colors.status.inProgress.text};
      background-color: ${colors.status.inProgress.background};
      border-color: ${colors.border.focus};
    }

    .assessment-table__status-badge--In-Review {
      color: ${colors.severity.medium.text};
      background-color: ${colors.severity.medium.background};
      border-color: ${colors.severity.medium.solid};
    }

    .assessment-table__status-badge--Completed {
      color: ${colors.status.resolved.text};
      background-color: ${colors.status.resolved.background};
      border-color: ${colors.severity.low.solid};
    }

    .assessment-table__status-badge--Retest-Required {
      color: ${colors.status.retestRequired.text};
      background-color: ${colors.status.retestRequired.background};
      border-color: ${colors.status.retestRequired.text};
    }

    .assessment-table__findings {
      display: inline-flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .assessment-table__findings strong {
      color: ${colors.text.primary};
    }

    .assessment-table__findings span {
      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .assessment-table__chevron {
      color: ${colors.neutral.grey400};
      font-size: 1.25rem;
      transition:
        transform ${transitions.fast},
        color ${transitions.fast};
    }

    .assessment-table__row--clickable:hover .assessment-table__chevron,
    .assessment-table__row--clickable:focus-visible .assessment-table__chevron {
      color: ${colors.brand.primary};
      transform: translateX(0.1875rem);
    }

    .assessment-table__empty-cell {
      padding: 1rem ${spacing.s};
      color: ${colors.text.muted};
      text-align: center;
    }
  `}
`;

export default StyledAssessmentTable;

export type { AssessmentLogoTone };
