import { styled, css } from 'styled-components';

const StyledSelect = styled.div`
  ${({ theme: { colors, radii, spacing, transitions, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.xxxs};

    .select-label {
      font-family: ${typography.fontFamilies.body};
      font-size: ${typography.label.medium.size};
      line-height: ${typography.label.medium.lineHeight};
      font-weight: ${typography.label.medium.weight};
      color: ${colors.text.primary};
    }

    .select-description,
    .select-error {
      margin: 0;
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }

    .select-description {
      color: ${colors.text.muted};
    }

    .select-error {
      color: ${colors.feedback.error};
    }

    .select-wrapper {
      position: relative;
    }

    .select-control {
      width: 100%;
      min-width: 0;
      min-height: 2.5rem;
      padding: 0.5625rem 2rem 0.5625rem 0.75rem;

      border: 1px solid ${colors.border.default};
      border-radius: ${radii.md};
      outline: 0;

      font-family: ${typography.fontFamilies.body};
      font-size: ${typography.body.medium.size};
      line-height: ${typography.body.medium.lineHeight};
      color: ${colors.text.primary};
      background-color: ${colors.surface.card};

      appearance: none;
      transition:
        border-color ${transitions.fast},
        box-shadow ${transitions.fast};
    }

    .select-control:focus-visible {
      border-color: ${colors.border.focus};
      box-shadow:
        0 0 0 2px ${colors.neutral.white},
        0 0 0 4px ${colors.brand.wash};
    }

    .select-wrapper--has-error .select-control {
      border-color: ${colors.feedback.error};
    }

    .select-wrapper--has-error .select-control:focus-visible {
      border-color: ${colors.feedback.error};
      box-shadow:
        0 0 0 2px ${colors.neutral.white},
        0 0 0 4px ${colors.severity.critical.background};
    }

    .select-wrapper--disabled .select-control {
      cursor: not-allowed;
      color: ${colors.text.muted};
      background-color: ${colors.neutral.grey100};
    }

    .select-chevron {
      position: absolute;
      top: 50%;
      right: 0.75rem;
      transform: translateY(-50%);

      display: inline-flex;
      align-items: center;
      justify-content: center;

      color: ${colors.text.muted};
      pointer-events: none;
    }

    .select-chevron svg {
      width: 1rem;
      height: 1rem;
    }
  `}
`;

export default StyledSelect;
