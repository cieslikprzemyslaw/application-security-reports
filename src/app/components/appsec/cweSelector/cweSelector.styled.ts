import { css, styled } from 'styled-components';

const StyledCweSelector = styled.div`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    position: relative;
    display: flex;
    flex-direction: column;
    gap: ${spacing.xxs};

    .cwe-selector__label {
      font-size: ${typography.label.medium.size};
      line-height: ${typography.label.medium.lineHeight};
      font-weight: ${typography.label.medium.weight};
      color: ${colors.text.primary};
    }

    .cwe-selector__description,
    .cwe-selector__error,
    .cwe-selector__empty {
      margin: 0;
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }

    .cwe-selector__description,
    .cwe-selector__empty {
      color: ${colors.text.muted};
    }

    .cwe-selector__error {
      color: ${colors.feedback.error};
    }

    .cwe-selector__input {
      min-height: 2.5rem;
      padding: 0.5625rem 0.75rem;
      border: 1px solid var(--cwe-selector-border, ${colors.border.default});
      border-radius: ${radii.md};
      outline: 0;
      color: ${colors.text.primary};
      background: ${colors.surface.card};
    }

    .cwe-selector__input:focus {
      border-color: ${colors.border.focus};
      box-shadow:
        0 0 0 2px ${colors.neutral.white},
        0 0 0 4px ${colors.brand.wash};
    }

    .cwe-selector__input[aria-invalid='true'] {
      --cwe-selector-border: ${colors.feedback.error};
    }

    .cwe-selector__results,
    .cwe-selector__selected {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .cwe-selector__results {
      position: absolute;
      z-index: 10;
      top: 4.75rem;
      right: 0;
      left: 0;
      max-height: 15rem;
      overflow-y: auto;
      padding: ${spacing.xxxs};
      border: 1px solid ${colors.border.default};
      border-radius: ${radii.md};
      background: ${colors.surface.card};
    }

    .cwe-selector__option,
    .cwe-selector__selected-item {
      display: flex;
      align-items: flex-start;
      gap: ${spacing.xxs};
      padding: ${spacing.xxs};
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background: ${colors.surface.card};
    }

    .cwe-selector__option {
      width: 100%;
      text-align: left;
      cursor: pointer;
    }

    .cwe-selector__option:hover,
    .cwe-selector__option:focus-visible {
      border-color: ${colors.border.focus};
      outline: 0;
      background: ${colors.brand.wash};
    }

    .cwe-selector__identity {
      flex: 1;
      min-width: 0;
    }

    .cwe-selector__identity strong,
    .cwe-selector__identity span {
      display: block;
    }

    .cwe-selector__identity span,
    .cwe-selector__role {
      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }

    .cwe-selector__actions {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxxs};
    }

    .cwe-selector__action {
      padding: ${spacing.xxxs} ${spacing.xxs};
      border: 1px solid ${colors.border.default};
      border-radius: ${radii.sm};
      color: ${colors.text.primary};
      background: transparent;
      cursor: pointer;
    }

    .cwe-selector__action:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `}
`;

export default StyledCweSelector;
