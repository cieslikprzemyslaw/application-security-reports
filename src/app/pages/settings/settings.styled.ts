import { styled, css } from 'styled-components';

const StyledSettings = styled.div.attrs({ className: 'settings' })`
  ${({ theme: { colors, radii, shadows, spacing, mq, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};

    .settings-header {
      margin: 0;
    }

    .settings-title {
      font-size: ${typography.headings.h3.size};
    }

    .settings-subtitle {
      margin-top: ${spacing.xxxs};
      color: ${colors.text.muted};
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: ${spacing.m};
    }

    .settings-form-status-group {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxs};
    }

    .settings-status {
      margin: 0;
      padding: ${spacing.xs} ${spacing.s};

      border-radius: ${radii.md};
      font-size: ${typography.body.small.size};
    }

    .settings-status--success {
      color: ${colors.feedback.success};
      background-color: ${colors.neutral.grey50};
      border: 1px solid ${colors.feedback.success};
    }

    .settings-status--error {
      color: ${colors.feedback.error};
      background-color: ${colors.neutral.grey50};
      border: 1px solid ${colors.feedback.error};
    }

    .settings-status--dirty {
      color: ${colors.text.secondary};
      background-color: ${colors.neutral.grey50};
      border: 1px solid ${colors.border.subtle};
    }

    .settings-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.s};

      @media ${mq.min.laptop} {
        grid-template-columns: minmax(0, 1.1fr) minmax(20rem, 0.9fr);
      }
    }

    .settings-stack {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};
    }

    .settings-two-column {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.s};

      @media ${mq.min.tablet} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .settings-checklist {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};
    }

    .settings-checkbox-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.s};
      padding: ${spacing.xs} 0;
    }

    .settings-checkbox-copy {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};
      max-width: 30rem;
    }

    .settings-checkbox-label {
      font-weight: ${typography.fontWeights.medium};
      color: ${colors.text.primary};
    }

    .settings-checkbox-description {
      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
    }

    .settings-checkbox {
      width: 1.125rem;
      height: 1.125rem;
      margin-top: 0.125rem;
      accent-color: ${colors.brand.primary};
      flex-shrink: 0;
    }

    .settings-severity-reference {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxs};
      padding-top: ${spacing.xs};
      border-top: 1px solid ${colors.border.subtle};
    }

    .settings-severity-reference-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${spacing.s};
    }

    .settings-preview-stack {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};
    }

    .settings-preview-card {
      display: flex;
      flex-direction: column;
      gap: ${spacing.m};
      padding: ${spacing.m};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
      box-shadow: ${shadows.xs};
    }

    .settings-preview-card-header {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};
    }

    .settings-preview-title {
      font-size: ${typography.headings.h6.size};
    }

    .settings-preview-subtitle {
      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
    }

    .settings-brand-preview {
      display: flex;
      flex-direction: column;
      gap: ${spacing.m};
    }

    .settings-brand-row {
      display: flex;
      align-items: center;
      gap: ${spacing.s};
    }

    .settings-brand-copy {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};
      min-width: 0;
    }

    .settings-brand-copy span {
      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
      overflow-wrap: anywhere;
    }

    .settings-report-preview {
      display: flex;
      flex-direction: column;
      gap: ${spacing.m};
    }

    .settings-report-footer-preview {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};
      padding-top: ${spacing.s};

      border-top: 1px solid ${colors.border.subtle};
      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
    }

    .settings-report-footer-preview strong {
      color: ${colors.text.primary};
      font-size: ${typography.body.medium.size};
    }

    .settings-actions {
      display: flex;
      justify-content: flex-end;
      gap: ${spacing.xxs};
    }
  `}
`;

export default StyledSettings;
