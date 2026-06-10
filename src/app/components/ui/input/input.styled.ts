import styled, { css } from 'styled-components';

import type { StyledInputProps } from './input.type';

const getInputSizeStyles = (size: StyledInputProps['$inputSize']) => {
  if (size === 'small') {
    return css`
      min-height: 2rem;
      padding-top: 0.375rem;
      padding-bottom: 0.375rem;

      font-size: 0.75rem;
      line-height: 1rem;
    `;
  }

  if (size === 'large') {
    return css`
      min-height: 3rem;
      padding-top: 0.6875rem;
      padding-bottom: 0.6875rem;

      font-size: 1rem;
      line-height: 1.5rem;
    `;
  }

  return css`
    min-height: 2.5rem;
    padding-top: 0.5625rem;
    padding-bottom: 0.5625rem;

    font-size: 0.875rem;
    line-height: 1.25rem;
  `;
};

const StyledInput = styled.div`
  ${({ theme: { colors, radii, spacing, typography, transitions } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.xxxs};

    .input-label {
      font-family: ${typography.fontFamilies.body};
      font-size: ${typography.label.medium.size};
      line-height: ${typography.label.medium.lineHeight};
      font-weight: ${typography.label.medium.weight};
      color: ${colors.text.primary};
    }

    .input-description,
    .input-error {
      margin: 0;
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }

    .input-description {
      color: ${colors.text.muted};
    }

    .input-error {
      color: ${colors.feedback.error};
    }

    .input-wrapper {
      position: relative;

      display: flex;
      align-items: center;

      border: 1px solid var(--input-border, ${colors.border.default});
      border-radius: ${radii.md};
      background-color: var(--input-background, ${colors.surface.card});

      transition:
        border-color ${transitions.fast},
        box-shadow ${transitions.fast};
    }

    .input-wrapper:focus-within {
      border-color: var(--input-focus-border, ${colors.border.focus});
      box-shadow:
        0 0 0 2px ${colors.neutral.white},
        0 0 0 4px var(--input-focus-ring, ${colors.brand.wash});
    }

    .input-wrapper--has-error {
      --input-border: ${colors.feedback.error};
      --input-focus-border: ${colors.feedback.error};
      --input-focus-ring: ${colors.severity.critical.background};
    }

    .input-wrapper--disabled {
      --input-background: ${colors.neutral.grey100};
    }

    .input {
      width: 100%;
      min-width: 0;

      padding-right: var(--input-padding-right, 0.75rem);
      padding-left: var(--input-padding-left, 0.75rem);

      border: 0;
      outline: 0;

      color: ${colors.text.primary};
      background: transparent;

      ${'' /* size styles injected from component via class name */}
    }

    .input--small {
      ${getInputSizeStyles('small')}
    }

    .input--medium {
      ${getInputSizeStyles('medium')}
    }

    .input--large {
      ${getInputSizeStyles('large')}
    }

    .input--with-leading-icon {
      --input-padding-left: 2.5rem;
    }

    .input--with-trailing-icon {
      --input-padding-right: 2.5rem;
    }

    .input::placeholder {
      color: ${colors.text.muted};
    }

    .input:disabled {
      cursor: not-allowed;
      color: ${colors.text.muted};
    }

    .input-icon {
      position: absolute;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      color: ${colors.text.muted};

      pointer-events: none;
    }

    .input-icon--leading {
      left: 0.75rem;
    }

    .input-icon--trailing {
      right: 0.75rem;
    }

    .input-icon svg {
      width: 1rem;
      height: 1rem;
    }
  `}
`;

export default StyledInput;
