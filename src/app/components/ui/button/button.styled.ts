import styled, { css, keyframes } from 'styled-components';

import type {
  ButtonSize,
  ButtonStyledProps,
  ButtonVariant,
} from './button.type';

const spinAnimation = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const getSmallButtonStyles = (isIconOnly: boolean) => css`
  min-height: 2rem;
  padding: ${isIconOnly ? '0.4375rem' : '0.375rem 0.75rem'};

  font-size: 0.75rem;
  line-height: 1rem;
`;

const getMediumButtonStyles = (isIconOnly: boolean) => css`
  min-height: 2.5rem;
  padding: ${isIconOnly ? '0.5625rem' : '0.5625rem 1rem'};

  font-size: 0.875rem;
  line-height: 1.25rem;
`;

const getLargeButtonStyles = (isIconOnly: boolean) => css`
  min-height: 3rem;
  padding: ${isIconOnly ? '0.6875rem' : '0.6875rem 1.125rem'};

  font-size: 1rem;
  line-height: 1.5rem;
`;

const getSizeStyles = (size: ButtonSize, isIconOnly: boolean) => {
  switch (size) {
    case 'small':
      return getSmallButtonStyles(isIconOnly);

    case 'large':
      return getLargeButtonStyles(isIconOnly);

    case 'medium':
    default:
      return getMediumButtonStyles(isIconOnly);
  }
};

const getTertiaryStyles = (isSelected: boolean) => css`
  ${({ theme: { colors } }) => css`
    color: ${isSelected ? colors.brand.primary : colors.text.secondary};

    background-color: ${isSelected ? colors.brand.wash : 'transparent'};

    border-color: transparent;

    &:hover:not(:disabled) {
      color: ${colors.text.primary};
      background-color: ${colors.surface.subtle};
    }

    &:active:not(:disabled) {
      color: ${colors.text.primary};
      background-color: ${colors.neutral.grey200};
    }

    &:disabled {
      color: ${colors.neutral.grey400};
      background-color: transparent;
      border-color: transparent;
    }
  `}
`;

const getStandardVariantStyles = (
  variant: Exclude<ButtonVariant, 'tertiary'>,
  isSelected: boolean,
) => css`
  ${({ theme: { colors } }) => {
    const buttonColors = colors.button[variant];

    return css`
      color: ${isSelected
        ? buttonColors.active.text
        : buttonColors.default.text};

      background-color: ${isSelected
        ? buttonColors.active.background
        : buttonColors.default.background};

      border-color: ${isSelected
        ? buttonColors.active.border
        : buttonColors.default.border};

      &:hover:not(:disabled) {
        color: ${buttonColors.hover.text};
        background-color: ${buttonColors.hover.background};
        border-color: ${buttonColors.hover.border};
      }

      &:active:not(:disabled) {
        color: ${buttonColors.active.text};
        background-color: ${buttonColors.active.background};
        border-color: ${buttonColors.active.border};
      }

      &:disabled {
        color: ${buttonColors.disabled.text};
        background-color: ${buttonColors.disabled.background};
        border-color: ${buttonColors.disabled.border};
      }
    `;
  }}
`;

const getVariantStyles = (variant: ButtonVariant, isSelected: boolean) => {
  if (variant === 'tertiary') {
    return getTertiaryStyles(isSelected);
  }

  return getStandardVariantStyles(variant, isSelected);
};

const StyledButton = styled.button.attrs({
  className: 'button',
})<ButtonStyledProps>`
  ${({ theme: { colors, radii, spacing, transitions, typography } }) => css`
    display: inline-flex;
    flex-direction: ${({ $iconPosition }) =>
      $iconPosition === 'right' ? 'row-reverse' : 'row'};

    align-items: center;
    justify-content: center;
    gap: ${spacing.xxs};

    width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'fit-content')};

    margin: 0;
    border: 1px solid;
    border-radius: ${radii.md};

    font-family: ${typography.fontFamilies.body};
    font-weight: ${typography.fontWeights.semibold};
    text-align: center;
    text-decoration: none;
    white-space: nowrap;

    cursor: pointer;
    user-select: none;

    transition:
      color ${transitions.fast},
      background-color ${transitions.fast},
      border-color ${transitions.fast},
      box-shadow ${transitions.fast};

    ${({ $size, $isIconOnly }) => getSizeStyles($size, $isIconOnly)}
    ${({ $variant, $isSelected }) => getVariantStyles($variant, $isSelected)}

  &:disabled {
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: none;

      box-shadow:
        0 0 0 2px ${colors.neutral.white},
        0 0 0 4px ${colors.border.focus};
    }

    ${({ $isLoading }) =>
      $isLoading &&
      css`
        cursor: wait;
      `}

    svg {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    .button-label {
      display: inline-flex;
      align-items: center;
    }

    .button-loading-spinner {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;

      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: ${radii.circle};

      animation: ${spinAnimation} 0.7s linear infinite;
    }
  `}
`;

export default StyledButton;
