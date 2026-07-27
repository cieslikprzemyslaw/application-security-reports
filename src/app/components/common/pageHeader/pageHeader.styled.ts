import { css, styled } from 'styled-components';

const StyledPageHeader = styled.header`
  ${({ theme: { colors, mq, radii, spacing, typography } }) => css`
    position: relative;
    display: flex;
    flex-direction: column;
    gap: ${spacing.s};

    padding-bottom: ${spacing.m};
    border-bottom: 1px solid ${colors.border.subtle};

    @media ${mq.min.tablet} {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }

    .page-header-content {
      min-width: 0;
    }

    .page-header-eyebrow {
      display: inline-flex;
      align-items: center;

      margin: 0 0 ${spacing.xxs};
      padding: 0.25rem 0.5rem;

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.pill};

      font-size: ${typography.label.small.size};
      line-height: ${typography.label.small.lineHeight};
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.brand.primary};
      background-color: ${colors.brand.wash};

      text-transform: uppercase;
      letter-spacing: 0.09em;
    }

    .page-header-title {
      margin: 0;
      overflow-wrap: anywhere;
      letter-spacing: -0.035em;
    }

    .page-header-subtitle {
      max-width: 48rem;
      margin-top: ${spacing.xxs};

      color: ${colors.text.secondary};
      overflow-wrap: anywhere;
    }

    .page-header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};

      @media ${mq.min.tablet} {
        justify-content: flex-end;
      }
    }

    .page-header-breadcrumb-list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: ${spacing.xxxs};

      margin: 0 0 ${spacing.xxs};
      padding: 0;

      list-style: none;
    }

    .page-header-breadcrumb-item {
      display: inline-flex;
      align-items: center;
      gap: ${spacing.xxxs};
      min-width: 0;

      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
      color: ${colors.text.muted};
    }

    .page-header-breadcrumb-item:not(:last-child)::after {
      content: '/';
      color: ${colors.neutral.grey400};
    }

    .page-header-breadcrumb-item button {
      padding: 0;
      border: 0;

      color: ${colors.text.link};
      background: transparent;
    }

    .page-header-breadcrumb-item button,
    .page-header-breadcrumb-item span {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .page-header-breadcrumb-item span[aria-current='page'] {
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.primary};
    }
  `}
`;

export default StyledPageHeader;
