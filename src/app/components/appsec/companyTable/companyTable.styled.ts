import styled, { css } from 'styled-components';

import type { CompanyLogoTone } from './companyTable.type';

const StyledCompanyTable = styled.div`
  ${({ theme: { colors, radii, spacing, transitions, typography } }) => css`
    width: 100%;
    overflow-x: auto;

    .company-table__table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }

    .company-table__head {
      background-color: ${colors.neutral.grey50};
    }

    .company-table__header-cell {
      padding: 0.75rem ${spacing.s};

      border-bottom: 1px solid ${colors.border.subtle};

      font-size: ${typography.label.small.size};
      line-height: ${typography.label.small.lineHeight};
      font-weight: ${typography.fontWeights.semibold};

      color: ${colors.text.muted};
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    .company-table__row {
      cursor: default;
      transition:
        background-color ${transitions.fast},
        box-shadow ${transitions.fast};
    }

    .company-table__row > td {
      border-bottom: 1px solid ${colors.border.subtle};
      background-color: ${colors.surface.card};
      transition: background-color ${transitions.fast};
    }

    .company-table__row:last-child > td {
      border-bottom: 0;
    }

    .company-table__row--clickable {
      cursor: pointer;
    }

    .company-table__row--clickable:hover > td,
    .company-table__row--clickable:focus-within > td {
      background-color: ${colors.brand.wash};
    }

    .company-table__row:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: -2px;
    }

    .company-table__cell {
      padding: 0.375rem ${spacing.s};
      color: ${colors.text.secondary};
      vertical-align: middle;
    }

    .company-table__identity {
      display: grid;
      grid-template-columns: 2.25rem minmax(0, 1fr);
      align-items: center;
      gap: ${spacing.xxs};
      min-width: 13rem;
    }

    .company-table__initials {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 2.25rem;
      height: 2.25rem;

      border-radius: ${radii.md};
      font-size: ${typography.body.small.size};
      font-weight: ${typography.fontWeights.medium};
      color: ${colors.neutral.white};
    }

    .company-table__initials--blue {
      background-color: ${colors.brand.primary};
    }

    .company-table__initials--cyan {
      background-color: ${colors.severity.informational.solid};
    }

    .company-table__initials--orange {
      background-color: ${colors.severity.high.solid};
    }

    .company-table__initials--green {
      background-color: ${colors.severity.low.solid};
    }

    .company-table__initials--purple {
      background-color: ${colors.status.retestRequired.text};
    }

    .company-table__initials--slate {
      background-color: ${colors.neutral.grey600};
    }

    .company-table__name {
      display: block;
      color: ${colors.text.primary};
    }

    .company-table__applications {
      display: block;
      margin-top: 0.125rem;
      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .company-table__link {
      color: ${colors.text.secondary};
      text-decoration: none;
    }

    .company-table__link:hover {
      color: ${colors.text.link};
      text-decoration: underline;
    }

    .company-table__link:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: 2px;
    }

    .company-table__open-threats-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.5rem;
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.sm};
      font-size: ${typography.body.small.size};
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.secondary};
      background-color: ${colors.neutral.grey100};
    }

    .company-table__open-threats-badge--medium {
      border-color: ${colors.severity.medium.solid};
      color: ${colors.severity.medium.text};
      background-color: ${colors.severity.medium.background};
    }

    .company-table__open-threats-badge--high {
      border-color: ${colors.severity.high.solid};
      color: ${colors.severity.high.text};
      background-color: ${colors.severity.high.background};
    }

    .company-table__chevron {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: ${colors.neutral.grey400};
      font-size: 1.25rem;
      transition:
        transform ${transitions.fast},
        color ${transitions.fast};
    }

    .company-table__row--clickable:hover .company-table__chevron,
    .company-table__row--clickable:focus-visible .company-table__chevron {
      color: ${colors.brand.primary};
      transform: translateX(0.1875rem);
    }

    .company-table__empty-cell {
      padding: 1rem ${spacing.s};
      color: ${colors.text.muted};
      text-align: center;
    }
  `}
`;

export default StyledCompanyTable;

export type { CompanyLogoTone };
