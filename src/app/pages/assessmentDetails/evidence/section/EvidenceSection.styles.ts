import { styled, css } from 'styled-components';

const StyledAssessmentEvidenceSection = styled.div.attrs({
  className: 'assessment-evidence',
})`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    container-type: inline-size;
    container-name: evidence-section;

    display: flex;
    flex-direction: column;
    gap: ${spacing.m};

    .assessment-evidence-status {
      display: grid;
      gap: ${spacing.xxs};
    }

    .assessment-evidence-list {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.s};
    }

    .assessment-evidence-card {
      overflow: hidden;

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
    }

    .assessment-evidence-card-header {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxs};
      padding: ${spacing.m};
      border-bottom: 1px solid ${colors.border.subtle};
    }

    .assessment-evidence-card-title-row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.xxs};
    }

    .assessment-evidence-card-title-button {
      padding: 0;
      border: 0;
      background: transparent;

      font-size: ${typography.headings.h6.size};
      line-height: ${typography.headings.h6.lineHeight};
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.primary};
      text-align: left;
    }

    .assessment-evidence-card-title-button:hover:not(:disabled) {
      color: ${colors.text.link};
    }

    .assessment-evidence-card-title-button:disabled {
      cursor: default;
    }

    .assessment-evidence-card-meta,
    .assessment-evidence-card-actions,
    .assessment-evidence-detail-tags {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .assessment-evidence-card-body {
      display: grid;
      gap: ${spacing.xs};
      padding: ${spacing.m};
    }

    .assessment-evidence-card-summary {
      color: ${colors.text.secondary};
    }

    .assessment-evidence-card-summary,
    .assessment-evidence-detail-text {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .assessment-evidence-card-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: ${spacing.xxs};

      padding: ${spacing.s} ${spacing.m};
      border-top: 1px solid ${colors.border.subtle};
      background-color: ${colors.surface.subtle};
    }

    .assessment-evidence-section-group {
      display: grid;
      gap: ${spacing.xs};
    }

    .assessment-evidence-section-title {
      margin: 0;
      font-size: ${typography.body.medium.size};
      line-height: ${typography.body.medium.lineHeight};
      font-weight: ${typography.fontWeights.semibold};
    }

    .assessment-evidence-detail-panel {
      display: grid;
      gap: ${spacing.s};
    }

    .assessment-evidence-detail-section {
      display: grid;
      gap: ${spacing.xxxs};
    }

    .assessment-evidence-detail-label {
      margin: 0;
      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
    }

    .assessment-evidence-detail-text {
      color: ${colors.text.primary};
    }

    .assessment-evidence-http-list {
      display: grid;
      gap: ${spacing.s};
    }

    .assessment-evidence-http-exchange {
      display: grid;
      gap: ${spacing.xs};
      padding: ${spacing.s};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.subtle};
    }

    .assessment-evidence-http-exchange-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: ${spacing.xxs};
    }

    .assessment-evidence-http-exchange-title {
      margin: 0;
      font-size: ${typography.body.medium.size};
      line-height: ${typography.body.medium.lineHeight};
      font-weight: ${typography.fontWeights.semibold};
    }

    .assessment-evidence-plain-text {
      padding: ${spacing.s};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.subtle};

      white-space: pre-wrap;
      word-break: break-word;
    }

    .assessment-evidence-attachment {
      display: inline-flex;
      align-items: center;
      gap: ${spacing.xxs};
      flex-wrap: wrap;
    }

    .assessment-evidence-empty,
    .assessment-evidence-loading {
      padding: ${spacing.l};
    }

    @container evidence-section (min-width: 48rem) {
      .assessment-evidence-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `}
`;

export default StyledAssessmentEvidenceSection;
