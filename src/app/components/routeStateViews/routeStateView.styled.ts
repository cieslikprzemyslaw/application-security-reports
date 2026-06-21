import { css, styled } from 'styled-components';

const StyledRouteStateView = styled.section`
  ${({ theme: { colors, radii, shadows, spacing, typography } }) => css`
    display: grid;
    gap: ${spacing.m};
    justify-items: start;
    max-width: 42rem;
    padding: ${spacing.xl};
    border: 1px solid ${colors.border.default};
    border-radius: ${radii.lg};
    background: ${colors.surface.card};
    box-shadow: ${shadows.sm};

    .route-state-eyebrow {
      margin: 0;
      color: ${colors.text.muted};
      font-size: 0.8125rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .route-state-title,
    .route-state-message {
      margin: 0;
    }

    .route-state-message {
      color: ${colors.text.muted};
      max-width: 40rem;
    }

    .route-state-actions {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xs};
    }

    .route-state-action-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.75rem;
      padding: 0 ${spacing.l};
      appearance: none;
      border: 1px solid transparent;
      border-radius: ${radii.md};
      color: ${colors.text.inverse};
      background: ${colors.brand.primary};
      cursor: pointer;
      font: inherit;
      font-size: ${typography.body.medium.size};
      font-weight: ${typography.fontWeights.semibold};
      text-decoration: none;
      transition:
        background-color 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease;
    }

    .route-state-action-link:hover {
      background: ${colors.brand.primaryHover};
    }

    .route-state-action-link:focus-visible {
      outline: none;
      border-color: ${colors.border.focus};
      box-shadow: 0 0 0 3px ${colors.border.focus};
    }

    .route-state-action-link--secondary {
      color: ${colors.text.primary};
      background: ${colors.surface.card};
      border-color: ${colors.border.strong};
    }

    .route-state-action-link--secondary:hover {
      background: ${colors.neutral.grey100};
    }

    .route-state-loading-row {
      display: flex;
      align-items: center;
      gap: ${spacing.s};
    }

    .route-state-spinner {
      width: 1rem;
      height: 1rem;
      border: 0.125rem solid ${colors.border.subtle};
      border-top-color: ${colors.brand.primary};
      border-radius: 999px;
      animation: route-state-spin 0.8s linear infinite;
    }

    @keyframes route-state-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `}
`;

export default StyledRouteStateView;
