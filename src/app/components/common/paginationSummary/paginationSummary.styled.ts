import styled from 'styled-components';

const StyledPaginationSummary = styled.p.attrs({
  className: 'pagination-summary',
})`
  margin: 0;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  line-height: ${({ theme }) => theme.typography.body.small.lineHeight};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export default StyledPaginationSummary;
