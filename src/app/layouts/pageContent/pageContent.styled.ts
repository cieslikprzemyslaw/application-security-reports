import styled, { css } from 'styled-components';

import type { PageContentProps } from './pageContent.type';

const getMaxWidth = (maxWidth: NonNullable<PageContentProps['maxWidth']>) => {
  const values = {
    default: '76rem',
    wide: '90rem',
    report: '52.5rem',
    full: 'none',
  } as const;

  return values[maxWidth];
};

const getSpacing = (spacing: NonNullable<PageContentProps['spacing']>) => {
  if (spacing === 'compact') {
    return css`
      padding: ${({ theme }) => theme.spacing.s};
    `;
  }

  if (spacing === 'comfortable') {
    return css`
      padding: ${({ theme }) => theme.spacing.l};

      @media ${({ theme }) => theme.mq.min.tablet} {
        padding: ${({ theme }) => theme.spacing.xl};
      }
    `;
  }

  return css`
    padding: ${({ theme }) => theme.spacing.m};

    @media ${({ theme }) => theme.mq.min.tablet} {
      padding: ${({ theme }) => theme.spacing.l};
    }
  `;
};

const StyledPageContent = styled.div.attrs({ className: 'page-content' })<{
  $maxWidth: NonNullable<PageContentProps['maxWidth']>;
  $spacing: NonNullable<PageContentProps['spacing']>;
}>`
  width: 100%;
  max-width: ${({ $maxWidth }) => getMaxWidth($maxWidth)};

  margin: 0 auto;

  ${({ $spacing }) => getSpacing($spacing)}
`;

export default StyledPageContent;
