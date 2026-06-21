import { styled, css } from 'styled-components';

const StyledEmptyState = styled.div`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    container-type: inline-size;
    container-name: empty-state;

    width: 100%;

    .empty-state-layout {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${spacing.m};

      width: 100%;
      padding: ${spacing.xl} ${spacing.m};

      text-align: center;
    }

    .empty-state-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      flex: none;
      width: 3rem;
      height: 3rem;

      border-radius: ${radii.circle};

      color: ${colors.brand.primary};
      background-color: ${colors.brand.wash};
    }

    .empty-state-icon svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .empty-state-copy {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};

      min-width: 0;
      max-width: 36rem;
    }

    .empty-state-eyebrow {
      margin: 0;

      font-size: ${typography.label.small.size};
      line-height: ${typography.label.small.lineHeight};
      font-weight: ${typography.label.small.weight};
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${colors.text.secondary};
    }

    .empty-state-title {
      margin: 0;

      font-size: ${typography.headings.h5.size};
      line-height: ${typography.headings.h5.lineHeight};
      overflow-wrap: anywhere;
    }

    .empty-state-description {
      color: ${colors.text.muted};
      overflow-wrap: anywhere;
    }

    .empty-state-description > * + * {
      margin-top: ${spacing.xs};
    }

    .empty-state-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: ${spacing.xxs};

      max-width: 100%;
    }

    .empty-state-actions > * {
      max-width: 100%;
    }

    .empty-state-layout.empty-state--legacy {
      padding-inline: ${spacing.m};
    }

    .empty-state-layout.empty-state--first-use,
    .empty-state-layout.empty-state--no-results,
    .empty-state-layout.empty-state--unavailable {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-areas:
        'icon copy'
        'actions actions';
      align-items: start;
      justify-items: start;

      text-align: left;

      padding: ${spacing.l};

      border: 1px solid ${colors.border.default};
      border-left-width: 0.25rem;
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
    }

    .empty-state-layout.empty-state--first-use {
      border-left-color: ${colors.brand.primary};
      background-color: ${colors.brand.wash};

      .empty-state-icon {
        color: ${colors.brand.primary};
        background-color: ${colors.surface.card};
      }

      .empty-state-eyebrow {
        color: ${colors.brand.primary};
      }
    }

    .empty-state-layout.empty-state--no-results {
      border-left-color: ${colors.text.secondary};
      background-color: ${colors.neutral.grey100};

      .empty-state-icon {
        color: ${colors.text.secondary};
        background-color: ${colors.surface.card};
      }
    }

    .empty-state-layout.empty-state--unavailable {
      border-left-color: ${colors.severity.medium.solid};
      background-color: ${colors.severity.medium.background};

      .empty-state-icon {
        color: ${colors.severity.medium.text};
        background-color: ${colors.surface.card};
      }

      .empty-state-eyebrow {
        color: ${colors.severity.medium.text};
      }
    }

    .empty-state-icon {
      grid-area: icon;
    }

    .empty-state-copy {
      grid-area: copy;
    }

    .empty-state-actions {
      grid-area: actions;
      justify-content: flex-start;
      width: 100%;
    }

    @container empty-state (max-width: 30rem) {
      .empty-state-layout.empty-state--first-use,
      .empty-state-layout.empty-state--no-results,
      .empty-state-layout.empty-state--unavailable {
        grid-template-columns: 1fr;
        grid-template-areas:
          'icon'
          'copy'
          'actions';
      }

      .empty-state-layout.empty-state--first-use .empty-state-actions > *,
      .empty-state-layout.empty-state--no-results .empty-state-actions > *,
      .empty-state-layout.empty-state--unavailable .empty-state-actions > * {
        width: 100%;
        flex: 1 1 100%;
      }
    }
  `}
`;

export default StyledEmptyState;
