import styled from 'styled-components';

export const StyledFilterToolbar = styled.div.attrs({
  className: 'filter-toolbar',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s};

  padding: ${({ theme }) => theme.spacing.s};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  @media ${({ theme }) => theme.mq.min.tablet} {
    flex-direction: row;
    align-items: center;
  }
`;

export const FilterToolbarMain = styled.div.attrs({
  className: 'filter-toolbar-main',
})`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const FilterToolbarSearch = styled.div.attrs({
  className: 'filter-toolbar-search',
})`
  width: 100%;

  @media ${({ theme }) => theme.mq.min.tablet} {
    width: min(18rem, 100%);
  }
`;

export const FilterToolbarSummary = styled.div.attrs({
  className: 'filter-toolbar-summary',
})`
  margin-left: auto;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const FilterToolbarActions = styled.div.attrs({
  className: 'filter-toolbar-actions',
})`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
`;
