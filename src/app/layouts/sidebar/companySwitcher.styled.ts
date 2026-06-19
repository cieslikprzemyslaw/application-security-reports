import { css, styled } from 'styled-components';

const StyledCompanySwitcher = styled.div.attrs({
  className: 'company-switcher',
})`
  ${({ theme: { colors, radii, spacing, transitions, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.m};

    .company-switcher-status {
      padding: ${spacing.xs} 0;

      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }

    .company-switcher-list {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xs};

      margin: 0;
      padding: 0;

      list-style: none;
    }

    .company-switcher-item {
      width: 100%;
    }

    .company-switcher-item-button {
      display: flex;
      align-items: center;
      gap: ${spacing.xs};

      width: 100%;
      padding: 0.75rem 0.875rem;

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};

      color: ${colors.text.primary};
      background-color: ${colors.surface.subtle};
      text-align: left;
      transition:
        color ${transitions.fast},
        background-color ${transitions.fast},
        border-color ${transitions.fast};
    }

    .company-switcher-item-button:hover {
      border-color: ${colors.border.default};
      color: ${colors.text.primary};
      background-color: ${colors.brand.wash};
    }

    .company-switcher-item-button:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: 2px;
    }

    .company-switcher-item-button--active {
      border-color: ${colors.brand.primary};
      color: ${colors.text.primary};
      background-color: ${colors.brand.wash};
    }

    .company-switcher-item-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      width: 2rem;
      height: 2rem;

      border-radius: ${radii.md};
      color: ${colors.brand.primary};
      background-color: ${colors.neutral.grey100};
    }

    .company-switcher-item-icon svg {
      width: 1rem;
      height: 1rem;
    }

    .company-switcher-item-content {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
    }

    .company-switcher-item-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: ${typography.body.medium.size};
      line-height: ${typography.body.medium.lineHeight};
      font-weight: ${typography.body.medium.weight};
    }

    .company-switcher-item-meta {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }

    .company-switcher-item-badge {
      flex-shrink: 0;
      padding: 0.25rem 0.5rem;

      border-radius: ${radii.pill};

      color: ${colors.brand.primary};
      background-color: ${colors.brand.wash};
      font-size: ${typography.label.small.size};
      line-height: ${typography.label.small.lineHeight};
      font-weight: ${typography.label.small.weight};
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .company-switcher-actions {
      display: flex;
      gap: ${spacing.xs};
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    .button.company-switcher-actions-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 1 1 0;
      min-width: 8rem;
      min-height: 2.5rem;
      padding: 0;

      border: 0;
      border-radius: 0;

      color: ${colors.text.link};
      background-color: transparent;
      font-size: ${typography.body.medium.size};
      line-height: ${typography.body.medium.lineHeight};
      font-weight: ${typography.fontWeights.semibold};
      text-decoration: underline;
      text-underline-offset: 0.15em;
      text-decoration-thickness: 0.08em;
      transition:
        color ${transitions.fast},
        text-decoration-thickness ${transitions.fast};
    }

    .button.company-switcher-actions-link:hover {
      color: ${colors.text.linkHover};
      background-color: transparent;
      border-color: transparent;
      text-decoration-thickness: 0.11em;
    }

    .button.company-switcher-actions-link:active {
      color: ${colors.text.linkHover};
      background-color: transparent;
      border-color: transparent;
      text-decoration-thickness: 0.11em;
    }

    .button.company-switcher-actions-link:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: 2px;
      box-shadow: none;
    }

    .company-switcher-actions > * {
      flex: 1 1 0;
      min-width: 8rem;
    }
  `}
`;

export default StyledCompanySwitcher;
