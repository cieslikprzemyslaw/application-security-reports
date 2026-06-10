import { styled, css } from 'styled-components';

const StyledPageHeader = styled.header`
  ${({ theme: { colors, mq, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.s};

    @media ${mq.min.tablet} {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }

    .page-header-content {
      min-width: 0;
    }

    .page-header-eyebrow {
      margin: 0 0 ${spacing.xxxs};

      font-size: ${typography.label.small.size};
      line-height: ${typography.label.small.lineHeight};
      font-weight: ${typography.label.small.weight};
      color: ${colors.brand.primary};

      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .page-header-title {
      margin: 0;
    }

    .page-header-subtitle {
      max-width: 48rem;
      margin-top: ${spacing.xxxs};

      color: ${colors.text.muted};
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
  `}
`;

export default StyledPageHeader;
