import { styled, css } from 'styled-components';

const StyledEvidenceForm = styled.form.attrs({ className: 'evidence-form' })`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.m};

    .evidence-form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.s};
    }

    .evidence-form-full-width {
      grid-column: 1 / -1;
    }

    .evidence-form-label {
      font-size: ${typography.label.medium.size};
      line-height: ${typography.label.medium.lineHeight};
      font-weight: ${typography.label.medium.weight};
      color: ${colors.text.primary};
    }

    .evidence-form-help,
    .evidence-form-error {
      margin: 0;
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }

    .evidence-form-help {
      color: ${colors.text.muted};
    }

    .evidence-form-error {
      color: ${colors.feedback.error};
    }

    .evidence-form-threats,
    .evidence-form-http {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xs};
    }

    .evidence-form-threats-fieldset,
    .evidence-form-exchange {
      margin: 0;
      padding: 0;

      border: 0;
    }

    .evidence-form-threat-list {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.xxs};
    }

    .evidence-form-attachment-summary {
      margin-top: ${spacing.xxs};
    }

    .evidence-form-http-header,
    .evidence-form-exchange-actions,
    .evidence-form-actions {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .evidence-form-http-header,
    .evidence-form-exchange-header {
      align-items: flex-start;
      justify-content: space-between;
    }

    .evidence-form-exchange-list {
      display: grid;
      gap: ${spacing.s};
    }

    .evidence-form-exchange {
      padding: ${spacing.s};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.subtle};
    }

    .evidence-form-exchange-legend {
      margin-bottom: ${spacing.xxs};

      font-size: ${typography.body.medium.size};
      line-height: ${typography.body.medium.lineHeight};
      font-weight: ${typography.fontWeights.semibold};
    }

    .evidence-form-exchange-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.s};
      margin-top: ${spacing.s};
    }

    .evidence-form-actions {
      justify-content: flex-end;
      padding-top: ${spacing.s};
      border-top: 1px solid ${colors.border.subtle};
    }

    @container evidence-section (min-width: 48rem) {
      .evidence-form-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .evidence-form-threat-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .evidence-form-exchange-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `}
`;

export default StyledEvidenceForm;
