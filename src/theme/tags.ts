import { css } from 'styled-components';
export const tags = {
  h1: css`
    font-family: ${({ theme }) => theme.typography.fontFamilies.heading};
    font-size: ${({ theme }) => theme.typography.headings.h1.size};
    line-height: ${({ theme }) => theme.typography.headings.h1.lineHeight};
    font-weight: ${({ theme }) => theme.typography.headings.h1.weight};
    color: ${({ theme }) => theme.colors.text.primary};
  `,
  h2: css`
    font-family: ${({ theme }) => theme.typography.fontFamilies.heading};
    font-size: ${({ theme }) => theme.typography.headings.h2.size};
    line-height: ${({ theme }) => theme.typography.headings.h2.lineHeight};
    font-weight: ${({ theme }) => theme.typography.headings.h2.weight};
    color: ${({ theme }) => theme.colors.text.primary};
  `,
  h3: css`
    font-family: ${({ theme }) => theme.typography.fontFamilies.heading};
    font-size: ${({ theme }) => theme.typography.headings.h3.size};
    line-height: ${({ theme }) => theme.typography.headings.h3.lineHeight};
    font-weight: ${({ theme }) => theme.typography.headings.h3.weight};
    color: ${({ theme }) => theme.colors.text.primary};
  `,
  h4: css`
    font-family: ${({ theme }) => theme.typography.fontFamilies.heading};
    font-size: ${({ theme }) => theme.typography.headings.h4.size};
    line-height: ${({ theme }) => theme.typography.headings.h4.lineHeight};
    font-weight: ${({ theme }) => theme.typography.headings.h4.weight};
    color: ${({ theme }) => theme.colors.text.primary};
  `,
  h5: css`
    font-family: ${({ theme }) => theme.typography.fontFamilies.heading};
    font-size: ${({ theme }) => theme.typography.headings.h5.size};
    line-height: ${({ theme }) => theme.typography.headings.h5.lineHeight};
    font-weight: ${({ theme }) => theme.typography.headings.h5.weight};
    color: ${({ theme }) => theme.colors.text.primary};
  `,
  h6: css`
    font-family: ${({ theme }) => theme.typography.fontFamilies.heading};
    font-size: ${({ theme }) => theme.typography.headings.h6.size};
    line-height: ${({ theme }) => theme.typography.headings.h6.lineHeight};
    font-weight: ${({ theme }) => theme.typography.headings.h6.weight};
    color: ${({ theme }) => theme.colors.text.primary};
  `,
  textLarge: css`
    font-family: ${({ theme }) => theme.typography.fontFamilies.body};
    font-size: ${({ theme }) => theme.typography.body.large.size};
    line-height: ${({ theme }) => theme.typography.body.large.lineHeight};
    font-weight: ${({ theme }) => theme.typography.body.large.weight};
    color: ${({ theme }) => theme.colors.text.secondary};
  `,
  textMedium: css`
    font-family: ${({ theme }) => theme.typography.fontFamilies.body};
    font-size: ${({ theme }) => theme.typography.body.medium.size};
    line-height: ${({ theme }) => theme.typography.body.medium.lineHeight};
    font-weight: ${({ theme }) => theme.typography.body.medium.weight};
    color: ${({ theme }) => theme.colors.text.secondary};
  `,
  textSmall: css`
    font-family: ${({ theme }) => theme.typography.fontFamilies.body};
    font-size: ${({ theme }) => theme.typography.body.small.size};
    line-height: ${({ theme }) => theme.typography.body.small.lineHeight};
    font-weight: ${({ theme }) => theme.typography.body.small.weight};
    color: ${({ theme }) => theme.colors.text.muted};
  `,
  mono: css`
    font-family: ${({ theme }) => theme.typography.fontFamilies.mono};
    font-size: ${({ theme }) => theme.typography.mono.medium.size};
    line-height: ${({ theme }) => theme.typography.mono.medium.lineHeight};
  `,
} as const;
export default tags;
