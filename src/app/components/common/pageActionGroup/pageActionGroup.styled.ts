import { css, styled } from 'styled-components';

interface StyledPageActionGroupProps {
  $compact: boolean;
}

const StyledPageActionGroup = styled.div<StyledPageActionGroupProps>`
  ${({ $compact, theme: { colors, mq, radii, shadows, spacing, typography, zIndices } }) => css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    gap: ${spacing.xxs};
    min-width: 0;

    @media ${mq.min.tablet} {
      justify-content: flex-end;
    }

    .page-action-group__secondary,
    .page-action-group__primary {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .page-action-group__overflow {
      position: relative;
      display: inline-flex;
    }

    .page-action-group__menu {
      position: absolute;
      top: calc(100% + ${spacing.xxxs});
      right: 0;
      z-index: ${zIndices.dropdown};
      min-width: ${$compact ? '10rem' : '12rem'};
      padding: ${spacing.xxs} 0;
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.card};
      box-shadow: ${shadows.md};
    }

    .page-action-group__menu-item {
      display: flex;
      align-items: center;
      gap: ${spacing.xxs};
      width: 100%;
      padding: ${spacing.xs} ${spacing.s};
      border: 0;
      color: ${colors.text.secondary};
      background: transparent;
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
      text-align: left;
    }

    .page-action-group__menu-item:hover:not([aria-disabled='true']) {
      color: ${colors.text.primary};
      background-color: ${colors.neutral.grey50};
    }

    .page-action-group__menu-item:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: -2px;
    }

    .page-action-group__menu-item[aria-disabled='true'] {
      color: ${colors.neutral.grey400};
      cursor: not-allowed;
    }

    .page-action-group__destructive {
      display: flex;
      margin-inline-start: ${$compact ? '0' : spacing.xxs};
      padding-inline-start: ${$compact ? '0' : spacing.xs};
      border-inline-start: ${$compact ? '0' : `1px solid ${colors.border.subtle}`};
    }

    @media ${mq.max.mobile} {
      width: 100%;

      .page-action-group__secondary,
      .page-action-group__primary,
      .page-action-group__destructive {
        flex: 1 1 auto;
      }

      .page-action-group__destructive {
        margin-inline-start: 0;
        padding-inline-start: 0;
        border-inline-start: 0;
      }
    }
  `}
`;

export default StyledPageActionGroup;
