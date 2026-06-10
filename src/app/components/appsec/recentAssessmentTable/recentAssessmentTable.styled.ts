import styled from 'styled-components';

const StyledRecentAssessmentTable = styled.div.attrs({
  className: 'recent-assessment-table',
})`
  width: 100%;
  overflow-x: auto;
`;

export const RecentAssessmentTableElement = styled.table.attrs({
  className: 'recent-assessment-table-element',
})`
  width: 100%;
  border-collapse: collapse;
`;

export const RecentAssessmentHead = styled.thead.attrs({
  className: 'recent-assessment-table-recent-assessment-head',
})`
  background-color: ${({ theme }) => theme.colors.neutral.grey50};
`;

export const RecentAssessmentHeaderCell = styled.th.attrs({
  className: 'recent-assessment-table-recent-assessment-header-cell',
})`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.s};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  font-size: ${({ theme }) => theme.typography.label.small.size};

  line-height: ${({ theme }) => theme.typography.label.small.lineHeight};

  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};

  color: ${({ theme }) => theme.colors.text.muted};

  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const RecentAssessmentRowStyled = styled.tr.attrs({
  className: 'recent-assessment-table-recent-assessment-row-styled',
})<{
  $isClickable: boolean;
}>`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  cursor: ${({ $isClickable }) => ($isClickable ? 'pointer' : 'default')};

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background-color: ${({ theme, $isClickable }) =>
      $isClickable ? theme.colors.neutral.grey50 : 'transparent'};
  }
`;

export const RecentAssessmentCell = styled.td.attrs({
  className: 'recent-assessment-table-recent-assessment-cell',
})`
  padding: 0.5rem ${({ theme }) => theme.spacing.s};

  color: ${({ theme }) => theme.colors.text.secondary};

  vertical-align: middle;
`;

export const RecentAssessmentName = styled.strong.attrs({
  className: 'recent-assessment-table-recent-assessment-name',
})`
  display: block;

  color: ${({ theme }) => theme.colors.text.primary};
`;

export const RecentAssessmentCompany = styled.span.attrs({
  className: 'recent-assessment-table-recent-assessment-company',
})`
  display: block;
  margin-top: 0.125rem;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const TypeBadge = styled.span.attrs({
  className: 'recent-assessment-table-type-badge',
})`
  display: inline-flex;
  align-items: center;

  padding: 0.125rem 0.5rem;

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.sm};

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.secondary};

  background-color: ${({ theme }) => theme.colors.neutral.grey50};
`;

export const FindingsCount = styled.span.attrs({
  className: 'recent-assessment-table-findings-count',
})`
  color: ${({ theme }) => theme.colors.text.primary};
`;

export default StyledRecentAssessmentTable;
