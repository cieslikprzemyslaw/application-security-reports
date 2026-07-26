import { styled, css } from 'styled-components';

const StyledThreatForm = styled.form.attrs({ className: 'threat-form' })`
  ${({ theme: { colors, mq, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.m};

    .threat-form-core,
    .threat-form-section {
      margin: 0;
      padding: ${spacing.m};
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.card};
    }

    .threat-form-core > legend {
      padding: 0 ${spacing.xxs};
      color: ${colors.text.primary};
      font-size: ${typography.headings.h5.size};
      font-weight: ${typography.headings.h5.weight};
    }

    .threat-form-section-description {
      margin: 0 0 ${spacing.m};
      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }

    .threat-form-section {
      padding: 0;
      overflow: hidden;
    }

    .threat-form-section--has-error {
      border-color: ${colors.feedback.error};
    }

    .threat-form-section-heading {
      margin: 0;
    }

    .threat-form-section-toggle {
      display: flex;
      align-items: center;
      gap: ${spacing.s};
      width: 100%;
      padding: ${spacing.m};
      border: 0;
      color: ${colors.text.primary};
      background: transparent;
      text-align: left;
      cursor: pointer;
    }

    .threat-form-section-toggle:hover {
      background-color: ${colors.surface.subtle};
    }

    .threat-form-section-toggle:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: -2px;
    }

    .threat-form-section-heading-copy {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: ${spacing.xxxs};
      min-width: 0;
      font-size: ${typography.headings.h5.size};
      font-weight: ${typography.headings.h5.weight};
    }

    .threat-form-section-heading-copy small {
      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
      font-weight: ${typography.body.small.weight};
      line-height: ${typography.body.small.lineHeight};
    }

    .threat-form-section-error {
      flex: 0 0 auto;
      color: ${colors.feedback.error};
      font-size: ${typography.label.small.size};
      font-weight: ${typography.label.small.weight};
    }

    .threat-form-section-panel {
      padding: 0 ${spacing.m} ${spacing.m};
      border-top: 1px solid ${colors.border.subtle};
    }

    .threat-form-section-panel[hidden] {
      display: none;
    }

    .threat-form-section-panel > .threat-form-grid,
    .threat-form-section-panel > div:first-child {
      margin-top: ${spacing.m};
    }

    .threat-form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.s};

      @media ${mq.min.tablet} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .threat-form-full-width {
      grid-column: 1 / -1;
    }

    .threat-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: ${spacing.xxs};
      padding-top: ${spacing.s};
      border-top: 1px solid ${colors.border.subtle};
    }

    .threat-form-readiness-note {
      margin: 0;
      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }
  `}
`;

export default StyledThreatForm;
