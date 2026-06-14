import { css, styled } from 'styled-components';

const topbarUserIdentityBaseStyles = css`
  ${({ theme: { colors, radii, spacing, typography, mq } }) => css`
    display: inline-flex;
    align-items: center;
    gap: ${spacing.xxs};

    min-height: 2rem;
    padding: 0.1875rem;
    margin: 0;

    border: 1px solid transparent;
    border-radius: ${radii.pill};

    color: ${colors.text.primary};
    background-color: transparent;

    .topbar-user-identity-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 2rem;
      height: 2rem;
      flex-shrink: 0;

      border-radius: ${radii.circle};

      color: ${colors.neutral.white};
      background-color: ${colors.brand.primary};

      font-size: 0.75rem;
      font-weight: ${typography.fontWeights.semibold};
      letter-spacing: 0.04em;
    }

    .topbar-user-identity-copy {
      display: none;
      flex-direction: column;
      align-items: flex-start;
      padding-right: ${spacing.xxs};

      line-height: 1.1;
      text-align: left;
    }

    .topbar-user-identity-name {
      font-size: 0.875rem;
      font-weight: ${typography.fontWeights.semibold};
    }

    .topbar-user-identity-role {
      font-size: 0.75rem;
      color: ${colors.text.muted};
    }

    @media ${mq.min.tablet} {
      min-height: 2.5rem;
      padding: 0.1875rem 0.625rem 0.1875rem 0.1875rem;

      .topbar-user-identity-copy {
        display: flex;
      }
    }
  `}
`;

const topbarUserIdentityInteractiveStyles = css`
  ${({ theme: { colors, transitions } }) => css`
    cursor: pointer;

    transition:
      color ${transitions.fast},
      background-color ${transitions.fast},
      border-color ${transitions.fast},
      box-shadow ${transitions.fast};

    &:hover {
      background-color: ${colors.surface.subtle};
    }

    &:active:not(:disabled) {
      background-color: ${colors.neutral.grey200};
    }

    &:focus-visible {
      outline: none;
      box-shadow:
        0 0 0 2px ${colors.neutral.white},
        0 0 0 4px ${colors.border.focus};
    }

    &:disabled {
      cursor: not-allowed;
    }
  `}
`;

const StyledTopbarUserIdentity = styled.div.attrs({
  className: 'topbar-user-identity',
})`
  ${topbarUserIdentityBaseStyles}
`;

const StyledTopbarUserIdentityButton = styled.button.attrs({
  className: 'topbar-user-identity',
  type: 'button',
})`
  ${topbarUserIdentityBaseStyles}
  ${topbarUserIdentityInteractiveStyles}
`;

export default StyledTopbarUserIdentity;
export { StyledTopbarUserIdentityButton };
