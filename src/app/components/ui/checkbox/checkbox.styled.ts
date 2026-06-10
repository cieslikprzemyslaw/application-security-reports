import { styled, css } from 'styled-components';

const StyledCheckbox = styled.div`
  ${({ theme: { colors, radii, spacing, transitions, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.xxxs};

    .checkbox-label {
      position: relative;

      display: inline-flex;
      align-items: flex-start;
      gap: ${spacing.xxs};

      width: fit-content;

      cursor: pointer;
    }

    .checkbox-input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
    }

    .checkbox-control {
      position: relative;

      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 1rem;
      height: 1rem;
      margin-top: 0.125rem;

      border: 1px solid ${colors.border.default};
      border-radius: ${radii.xs};
      background-color: ${colors.surface.card};

      transition:
        background-color ${transitions.fast},
        border-color ${transitions.fast},
        box-shadow ${transitions.fast};
    }

    .checkbox-control svg {
      width: 0.75rem;
      height: 0.75rem;

      color: ${colors.neutral.white};

      opacity: 0;
    }

    .checkbox-input:checked + .checkbox-control,
    .checkbox-input[data-indeterminate='true'] + .checkbox-control {
      border-color: ${colors.brand.primary};
      background-color: ${colors.brand.primary};
    }

    .checkbox-input:checked + .checkbox-control svg,
    .checkbox-input[data-indeterminate='true'] + .checkbox-control svg {
      opacity: 1;
    }

    .checkbox-input:focus-visible + .checkbox-control {
      box-shadow:
        0 0 0 2px ${colors.neutral.white},
        0 0 0 4px ${colors.border.focus};
    }

    .checkbox-input:disabled + .checkbox-control {
      border-color: ${colors.border.subtle};
      background-color: ${colors.neutral.grey100};
    }

    .checkbox-input:disabled ~ * {
      cursor: not-allowed;
    }

    .checkbox-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .checkbox-text {
      font-size: ${typography.body.medium.size};
      line-height: ${typography.body.medium.lineHeight};
      font-weight: ${typography.fontWeights.medium};
      color: ${colors.text.primary};
    }

    .checkbox-description,
    .checkbox-error {
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }

    .checkbox-description {
      color: ${colors.text.muted};
    }

    .checkbox-error {
      margin: 0 0 0 1.5rem;
      color: ${colors.feedback.error};
    }
  `}
`;

export default StyledCheckbox;
