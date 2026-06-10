import { styled, css } from 'styled-components';

const StyledPaginationSummary = styled.p.attrs({
  className: 'pagination-summary',
})`
  ${({ theme: { colors, typography } }) => css`
    margin: 0;

    font-size: ${typography.body.small.size};

    line-height: ${typography.body.small.lineHeight};

    color: ${colors.text.muted};
  `}
`;

export default StyledPaginationSummary;
