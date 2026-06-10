import styled, { css } from 'styled-components';

const StyledDropzone = styled.div.attrs({ className: 'dropzone-field' })`
  ${({ theme: { colors, radii, spacing, transitions, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.xxxs};

    .dropzone-label {
      font-size: ${typography.label.medium.size};
      line-height: ${typography.label.medium.lineHeight};
      font-weight: ${typography.label.medium.weight};
      color: ${colors.text.primary};
    }

    .dropzone-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: ${spacing.xxs};

      min-height: 10rem;
      padding: ${spacing.m};

      border: 1px dashed ${colors.border.default};

      border-radius: ${radii.lg};
      color: ${colors.text.secondary};
      background-color: ${colors.surface.card};
      cursor: pointer;
      text-align: center;

      transition:
        border-color ${transitions.fast},
        background-color ${transitions.fast};
    }

    .dropzone-area[data-has-error='true'] {
      border-color: ${colors.feedback.error};
    }

    .dropzone-area[data-is-dragging='true'] {
      border-color: ${colors.brand.primary};
      background-color: ${colors.brand.wash};
    }

    .dropzone-area[data-is-disabled='true'] {
      cursor: not-allowed;
      background-color: ${colors.neutral.grey100};
    }

    .dropzone-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 2.5rem;
      height: 2.5rem;

      border-radius: ${radii.circle};
      color: ${colors.brand.primary};
      background-color: ${colors.brand.wash};
    }

    .dropzone-icon svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .dropzone-text {
      font-size: ${typography.body.medium.size};
      line-height: ${typography.body.medium.lineHeight};
      color: ${colors.text.secondary};
    }

    .dropzone-description {
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
      color: ${colors.text.muted};
    }

    .dropzone-input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
    }

    .dropzone-error {
      margin: 0;
      font-size: ${typography.body.small.size};
      color: ${colors.feedback.error};
    }
  `}
`;

export default StyledDropzone;
