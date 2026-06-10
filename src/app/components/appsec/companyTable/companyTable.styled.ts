import styled, { css } from 'styled-components';

import type { CompanyLogoTone } from './companyTable.type';

const getLogoToneStyles = (tone: CompanyLogoTone) => css`
  ${({ theme }) => {
    const tones = {
      blue: theme.colors.brand.primary,
      cyan: theme.colors.severity.informational.solid,
      orange: theme.colors.severity.high.solid,
      green: theme.colors.severity.low.solid,
      purple: theme.colors.status.retestRequired.text,
      slate: theme.colors.neutral.grey600,
    } as const;

    return css`
      color: ${theme.colors.neutral.white};
      background-color: ${tones[tone]};
    `;
  }}
`;

const StyledCompanyTable = styled.div.attrs({ className: 'company-table' })`
  width: 100%;
  overflow-x: auto;
`;

export const CompanyTableElement = styled.table.attrs({
  className: 'company-table-element',
})`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

export const CompanyTableHead = styled.thead.attrs({
  className: 'company-table-head',
})`
  background-color: ${({ theme }) => theme.colors.neutral.grey50};
`;

export const CompanyTableHeaderCell = styled.th.attrs({
  className: 'company-table-header-cell',
})`
  padding: 0.75rem ${({ theme }) => theme.spacing.s};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  font-size: ${({ theme }) => theme.typography.label.small.size};

  line-height: ${({ theme }) => theme.typography.label.small.lineHeight};

  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};

  color: ${({ theme }) => theme.colors.text.muted};

  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
`;

export const CompanyTableRowStyled = styled.tr.attrs({
  className: 'company-table-row-styled',
})<{
  $isClickable: boolean;
}>`
  cursor: ${({ $isClickable }) => ($isClickable ? 'pointer' : 'default')};

  transition:
    background-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  & > td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

    background-color: ${({ theme }) => theme.colors.surface.card};

    transition: background-color ${({ theme }) => theme.transitions.fast};
  }

  &:last-child > td {
    border-bottom: 0;
  }

  &:hover > td,
  &:focus-within > td {
    background-color: ${({ theme, $isClickable }) =>
      $isClickable ? theme.colors.brand.wash : theme.colors.surface.card};
  }

  &:hover ${'' /* force nested styles below */} {
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.border.focus};

    outline-offset: -2px;
  }
`;

export const CompanyTableCell = styled.td.attrs({
  className: 'company-table-cell',
})`
  padding: 0.375rem ${({ theme }) => theme.spacing.s};

  color: ${({ theme }) => theme.colors.text.secondary};

  vertical-align: middle;
`;

export const CompanyIdentity = styled.div.attrs({
  className: 'company-table-company-identity',
})`
  display: grid;
  grid-template-columns:
    2.25rem
    minmax(0, 1fr);
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};

  min-width: 13rem;
`;

export const CompanyInitials = styled.span.attrs({
  className: 'company-table-company-initials',
})<{
  $tone: CompanyLogoTone;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 2.25rem;
  height: 2.25rem;

  border-radius: ${({ theme }) => theme.radii.md};

  font-size: ${({ theme }) => theme.typography.body.small.size};

  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};

  ${({ $tone }) => getLogoToneStyles($tone)}
`;

export const CompanyName = styled.strong.attrs({
  className: 'company-table-company-name',
})`
  display: block;

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const CompanyApplications = styled.span.attrs({
  className: 'company-table-company-applications',
})`
  display: block;
  margin-top: 0.125rem;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const CompanyLink = styled.a.attrs({
  className: 'company-table-company-link',
})`
  color: ${({ theme }) => theme.colors.text.secondary};

  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.text.link};

    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.border.focus};

    outline-offset: 2px;
  }
`;

export const OpenThreatsBadge = styled.span.attrs({
  className: 'company-table-open-threats-badge',
})<{
  $count: number;
}>`
  display: inline-flex;
  align-items: center;

  padding: 0.125rem 0.5rem;

  border: 1px solid
    ${({ theme, $count }) =>
      $count >= 15
        ? theme.colors.severity.high.solid
        : $count >= 10
          ? theme.colors.severity.medium.solid
          : theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.sm};

  font-size: ${({ theme }) => theme.typography.body.small.size};

  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};

  color: ${({ theme, $count }) =>
    $count >= 15
      ? theme.colors.severity.high.text
      : $count >= 10
        ? theme.colors.severity.medium.text
        : theme.colors.text.secondary};

  background-color: ${({ theme, $count }) =>
    $count >= 15
      ? theme.colors.severity.high.background
      : $count >= 10
        ? theme.colors.severity.medium.background
        : theme.colors.neutral.grey100};
`;

export const CompanyChevron = styled.span.attrs({
  className: 'company-table-company-chevron',
})`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  color: ${({ theme }) => theme.colors.neutral.grey400};

  font-size: 1.25rem;

  transition:
    transform ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  ${CompanyTableRowStyled}:hover &,
  ${CompanyTableRowStyled}:focus-visible & {
    color: ${({ theme }) => theme.colors.brand.primary};

    transform: translateX(0.1875rem);
  }
`;

export default StyledCompanyTable;
