import styled, { css, keyframes } from 'styled-components';

import type {
  IconButtonSize,
  IconButtonStyledProps,
  IconButtonVariant,
} from './iconButton.type';

const spinAnimation = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const getSizeStyles = (size: IconButtonSize) => {
  const sizes = {
    small: '2rem',
    medium: '2.5rem',
    large: '3rem',
  } as const;

  const iconSizes = {
    small: '0.875rem',
    medium: '1rem',
    large: '1.25rem',
  } as const;

  return css`
    width: ${sizes[size]};
    height: ${sizes[size]};

    svg {
      width: ${iconSizes[size]};
      height: ${iconSizes[size]};
    }
  `;
};

const getVariantStyles = (
  variant: IconButtonVariant,
  isSelected: boolean,
) => css`
  ${({ theme: { colors } }) => {
    if (variant === 'tertiary') {
      return css`
        color: ${isSelected ? colors.brand.primary : colors.text.secondary};

        background-color: ${isSelected ? colors.brand.wash : 'transparent'};

        border-color: transparent;

        &:hover:not(:disabled) {
          color: ${colors.text.primary};
          background-color: ${colors.surface.subtle};
        }

        &:active:not(:disabled) {
          background-color: ${colors.neutral.grey200};
        }

        &:disabled {
          color: ${colors.neutral.grey400};
        }
      `;
    }

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

const StyledIconButton = styled.button.attrs({
  className: 'icon-button',
})<IconButtonStyledProps>`
  ${({ theme: { colors, radii, transitions } }) => css`
    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 0;
    margin: 0;

    border: 1px solid;
    border-radius: ${radii.md};

    cursor: pointer;

    transition:
      color ${transitions.fast},
      background-color ${transitions.fast},
      border-color ${transitions.fast},
      box-shadow ${transitions.fast};

    ${({ $size }) => getSizeStyles($size)}
    ${({ $variant, $isSelected }) => getVariantStyles($variant, $isSelected)}

  &:focus-visible {
      outline: none;
      box-shadow:
        0 0 0 2px ${colors.neutral.white},
        0 0 0 4px ${colors.border.focus};
    }

    &:disabled {
      cursor: not-allowed;
    }

    ${({ $isLoading }) =>
      $isLoading &&
      css`
        cursor: wait;
      `}

    .icon-button-spinner {
      width: 1rem;
      height: 1rem;

      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: ${radii.circle};

      animation: ${spinAnimation} 0.7s linear infinite;
    }
  `}
`;

export default StyledIconButton;
