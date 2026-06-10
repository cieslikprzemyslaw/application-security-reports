import styled, { css } from 'styled-components';

import type { AssessmentLogoTone } from './assessmentTable.type';

const getLogoTone = (tone: AssessmentLogoTone) => css`
  ${({ theme }) => {
    const tones = {
      blue: theme.colors.brand.primary,
      indigo: theme.colors.brand.accent,
      cyan: theme.colors.severity.informational.solid,
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

const StyledAssessmentTable = styled.div.attrs({
  className: 'assessment-table',
})`
  width: 100%;
  overflow-x: auto;
`;

export const Table = styled.table.attrs({
  className: 'assessment-table-table',
})`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

export const Head = styled.thead.attrs({ className: 'assessment-table-head' })`
  background-color: ${({ theme }) => theme.colors.neutral.grey50};
`;

export const HeaderCell = styled.th.attrs({
  className: 'assessment-table-header-cell',
})`
  padding: 0.75rem ${({ theme }) => theme.spacing.s};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  font-size: ${({ theme }) => theme.typography.label.small.size};

  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};

  color: ${({ theme }) => theme.colors.text.muted};

  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
`;

export const Row = styled.tr.attrs({ className: 'assessment-table-row' })<{
  $clickable: boolean;
}>`
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};

  & > td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

    background-color: ${({ theme }) => theme.colors.surface.card};

    transition: background-color ${({ theme }) => theme.transitions.fast};
  }

  &:last-child > td {
    border-bottom: 0;
  }

  &:hover > td,
  &:focus-visible > td {
    background-color: ${({ theme, $clickable }) =>
      $clickable ? theme.colors.brand.wash : theme.colors.surface.card};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.border.focus};

    outline-offset: -2px;
  }
`;

export const Cell = styled.td.attrs({ className: 'assessment-table-cell' })`
  padding: 0.5rem ${({ theme }) => theme.spacing.s};

  color: ${({ theme }) => theme.colors.text.secondary};

  vertical-align: middle;
`;

export const Identity = styled.div.attrs({
  className: 'assessment-table-identity',
})`
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr);
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};

  min-width: 18rem;
`;

export const Initials = styled.span.attrs({
  className: 'assessment-table-initials',
})<{
  $tone: AssessmentLogoTone;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 2.25rem;
  height: 2.25rem;

  border-radius: ${({ theme }) => theme.radii.md};

  font-size: ${({ theme }) => theme.typography.body.small.size};

  ${({ $tone }) => getLogoTone($tone)}
`;

export const Name = styled.strong.attrs({ className: 'assessment-table-name' })`
  display: block;

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const Meta = styled.span.attrs({ className: 'assessment-table-meta' })`
  display: block;
  margin-top: 0.125rem;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const TypeBadge = styled.span.attrs({
  className: 'assessment-table-type-badge',
})`
  display: inline-flex;
  align-items: center;

  padding: 0.125rem 0.5rem;

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.sm};

  font-size: ${({ theme }) => theme.typography.body.small.size};

  background-color: ${({ theme }) => theme.colors.neutral.grey50};
`;

export const AssessmentStatusBadge = styled.span.attrs({
  className: 'assessment-table-assessment-status-badge',
})<{
  $status:
    | 'Draft'
    | 'In Progress'
    | 'In Review'
    | 'Completed'
    | 'Retest Required';
}>`
  display: inline-flex;
  align-items: center;

  padding: 0.125rem 0.5rem;

  border: 1px solid;
  border-radius: ${({ theme }) => theme.radii.sm};

  font-size: ${({ theme }) => theme.typography.body.small.size};

  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};

  ${({ theme, $status }) => {
    const styles = {
      Draft: {
        text: theme.colors.text.secondary,
        background: theme.colors.neutral.grey100,
        border: theme.colors.border.subtle,
      },
      'In Progress': {
        text: theme.colors.status.inProgress.text,
        background: theme.colors.status.inProgress.background,
        border: theme.colors.border.focus,
      },
      'In Review': {
        text: theme.colors.severity.medium.text,
        background: theme.colors.severity.medium.background,
        border: theme.colors.severity.medium.solid,
      },
      Completed: {
        text: theme.colors.status.resolved.text,
        background: theme.colors.status.resolved.background,
        border: theme.colors.severity.low.solid,
      },
      'Retest Required': {
        text: theme.colors.status.retestRequired.text,
        background: theme.colors.status.retestRequired.background,
        border: theme.colors.status.retestRequired.text,
      },
    } as const;

    const selected = styles[$status];

    return css`
      color: ${selected.text};
      background-color: ${selected.background};
      border-color: ${selected.border};
    `;
  }}
`;

export const Findings = styled.div.attrs({
  className: 'assessment-table-findings',
})`
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;

  strong {
    color: ${({ theme }) => theme.colors.text.primary};
  }

  span {
    font-size: ${({ theme }) => theme.typography.body.small.size};

    color: ${({ theme }) => theme.colors.text.muted};
  }
`;

export const Chevron = styled.span.attrs({
  className: 'assessment-table-chevron',
})`
  color: ${({ theme }) => theme.colors.neutral.grey400};

  font-size: 1.25rem;

  transition:
    transform ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  ${Row}:hover &,
  ${Row}:focus-visible & {
    color: ${({ theme }) => theme.colors.brand.primary};

    transform: translateX(0.1875rem);
  }
`;

export default StyledAssessmentTable;
