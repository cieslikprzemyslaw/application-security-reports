import { styled, css } from 'styled-components';

const StyledEvidenceList = styled.ul.attrs({
  className: 'evidence-list',
})`
  ${({ theme: { colors, radii, shadows, spacing, typography } }) => css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: ${spacing.s};

    margin: 0;
    padding: 0;

    list-style: none;

    .evidence-list-item {
      overflow: hidden;

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
      box-shadow: ${shadows.xs};
    }

    .evidence-list-preview {
      display: flex;
      align-items: center;
      justify-content: center;

      width: 100%;
      min-height: 8rem;
      padding: 0;

      border: 0;
      border-bottom: 1px solid ${colors.border.subtle};

      color: ${colors.brand.primary};
      background-color: ${colors.neutral.grey50};
      overflow: hidden;
    }

    .evidence-list-preview img {
      width: 100%;
      height: 8rem;
      object-fit: cover;
    }

    .evidence-list-preview svg {
      width: 2rem;
      height: 2rem;
    }

    .evidence-list-preview:disabled {
      cursor: default;
    }

    .evidence-list-content {
      padding: ${spacing.s};
    }

    .evidence-list-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: ${spacing.xxs};
    }

    .evidence-list-details {
      min-width: 0;
    }

    .evidence-list-name {
      display: block;
      max-width: 100%;
      padding: 0;

      border: 0;

      font-size: ${typography.body.medium.size};
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.primary};

      background: transparent;
      overflow: hidden;
      text-align: left;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .evidence-list-name:hover:not(:disabled) {
      color: ${colors.text.link};
    }

    .evidence-list-name:disabled {
      cursor: default;
    }

    .evidence-list-metadata {
      margin-top: 0.125rem;
      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .evidence-list-description {
      margin-top: ${spacing.xxs};
      color: ${colors.text.secondary};
    }

    .evidence-list-remove-button {
      align-self: start;

      padding: 0.375rem;

      border: 0;
      border-radius: ${radii.md};

      color: ${colors.feedback.error};
      background: transparent;
    }

    .evidence-list-remove-button:hover {
      background-color: ${colors.severity.critical.background};
    }

    .evidence-list-empty {
      grid-column: 1 / -1;

      padding: ${spacing.l};

      border: 1px dashed ${colors.border.default};
      border-radius: ${radii.lg};

      color: ${colors.text.muted};
      text-align: center;
    }
  `}
`;

export default StyledEvidenceList;
