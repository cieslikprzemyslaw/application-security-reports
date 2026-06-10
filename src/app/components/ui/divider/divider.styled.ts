import styled, { css } from 'styled-components';

import type { DividerStyledProps } from './divider.type';

const StyledDivider = styled.hr.attrs({
  className: 'divider',
})<DividerStyledProps>`
  margin: 0;
  border: 0;

  background-color: ${({ theme }) => theme.colors.border.subtle};

  ${({ $orientation }) =>
    $orientation === 'vertical'
      ? css`
          width: 1px;
          height: 100%;
          min-height: 1.5rem;
        `
      : css`
          width: 100%;
          height: 1px;
        `}
`;

export default StyledDivider;
