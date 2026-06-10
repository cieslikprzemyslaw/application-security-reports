import { styled, css } from 'styled-components';

const StyledTextarea = styled.div`
  ${({ theme: { colors, radii, spacing, transitions, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.xxxs};

    .textarea-label {
      font-family: ${typography.fontFamilies.body};
      font-size: ${typography.label.medium.size};
      line-height: ${typography.label.medium.lineHeight};
      font-weight: ${typography.label.medium.weight};
      color: ${colors.text.primary};
    }

    .textarea-description,
    .textarea-error {
      margin: 0;
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }

    .textarea-description {
      color: ${colors.text.muted};
    }

    .textarea-error {
      color: ${colors.feedback.error};
    }

    .textarea-control {
      width: 100%;
      min-height: 7.5rem;
      padding: 0.75rem;

      border: 1px solid ${colors.border.default};
      border-radius: ${radii.md};
      outline: 0;

      font-family: ${typography.fontFamilies.body};
      font-size: ${typography.body.medium.size};
      line-height: ${typography.body.medium.lineHeight};
      color: ${colors.text.primary};
      background-color: ${colors.surface.card};

      resize: vertical;
      transition:
        border-color ${transitions.fast},
        box-shadow ${transitions.fast};
    }

    .textarea-control:focus-visible {
      border-color: ${colors.border.focus};
      box-shadow:
        0 0 0 2px ${colors.neutral.white},
        0 0 0 4px ${colors.brand.wash};
    }

    .textarea-control--has-error {
      border-color: ${colors.feedback.error};
    }

    .textarea-control--has-error:focus-visible {
      border-color: ${colors.feedback.error};
      box-shadow:
        0 0 0 2px ${colors.neutral.white},
        0 0 0 4px ${colors.severity.critical.background};
    }

    .textarea-control--resize-none {
      resize: none;
    }

    .textarea-control--resize-both {
      resize: both;
    }

    .textarea-control:disabled {
      cursor: not-allowed;
      color: ${colors.text.muted};
      background-color: ${colors.neutral.grey100};
    }
  `}
`;

export default StyledTextarea;
