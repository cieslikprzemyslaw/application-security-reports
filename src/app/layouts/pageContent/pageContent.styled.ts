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

const getSpacing = (
  spacingSize: NonNullable<PageContentProps['spacing']>,
  {
    spacing,
    mq,
  }: {
    spacing: { s: string; m: string; l: string; xl: string };
    mq: { min: { tablet: string } };
  },
) => {
  if (spacingSize === 'compact') {
    return css`
      padding: ${spacing.s};
    `;
  }

  if (spacingSize === 'comfortable') {
    return css`
      padding: ${spacing.l};

      @media ${mq.min.tablet} {
        padding: ${spacing.xl};
      }
    `;
  }

  return css`
    padding: ${spacing.m};

    @media ${mq.min.tablet} {
      padding: ${spacing.l};
    }
  `;
};

const StyledPageContent = styled.div.attrs({ className: 'page-content' })<{
  $maxWidth: NonNullable<PageContentProps['maxWidth']>;
  $spacing: NonNullable<PageContentProps['spacing']>;
}>`
  ${({ theme: { mq, spacing } }) => css`
    width: 100%;
    max-width: ${({ $maxWidth }) => getMaxWidth($maxWidth)};

    margin: 0 auto;

    ${({ $spacing }) => getSpacing($spacing, { spacing, mq })}
  `}
`;

export default StyledPageContent;
