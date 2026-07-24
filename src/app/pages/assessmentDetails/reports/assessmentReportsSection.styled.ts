import { css, styled } from 'styled-components';

const StyledAssessmentReportsSection = styled.section`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    container-type: inline-size;

    .assessment-reports-intro {
      margin-bottom: ${spacing.m};
    }

    .assessment-reports-list,
    .assessment-report-version-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .assessment-reports-list {
      display: flex;
      flex-direction: column;
      gap: ${spacing.m};
    }

    .assessment-report-item {
      padding: ${spacing.m};
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.card};
    }

    .assessment-report-header {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxs};
    }

    .assessment-report-title {
      margin: 0;
      font-size: ${typography.headings.h5.size};
      color: ${colors.text.primary};
    }

    .assessment-report-meta,
    .assessment-report-empty {
      color: ${colors.text.secondary};
      font-size: ${typography.body.small.size};
    }

    .assessment-report-version-list {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xs};
      margin-top: ${spacing.m};
    }

    .assessment-report-version {
      position: relative;
      isolation: isolate;

      padding-top: ${spacing.xs};
      border-top: 1px solid ${colors.border.subtle};
      border-radius: ${radii.sm};
    }

    .assessment-report-version:has(.collection-row-action:hover),
    .assessment-report-version:has(.collection-row-action:focus-visible) {
      background-color: ${colors.surface.subtle};
    }

    .assessment-report-version:has(.collection-row-action:hover)
      .assessment-report-version-action {
      color: ${colors.text.linkHover};
      text-decoration: underline;
    }

    .assessment-report-version-content {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: ${spacing.xs};
      padding: ${spacing.xs};
    }

    .assessment-report-version-details {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      align-items: flex-start;
      gap: ${spacing.xxs};
      min-width: 0;
    }

    .assessment-report-version-name,
    .assessment-report-version-action {
      font-weight: ${typography.fontWeights.semibold};
    }

    .assessment-report-version-action {
      color: ${colors.text.link};
    }

    .assessment-report-version-actions {
      position: relative;
      z-index: 2;
    }

    .assessment-report-delete-dialog {
      display: flex;
      flex-direction: column;
      gap: ${spacing.m};
    }

    .assessment-report-delete-label {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xs};
      color: ${colors.text.primary};
      font-size: ${typography.body.small.size};
      font-weight: ${typography.fontWeights.semibold};
    }

    .assessment-report-delete-input {
      width: 100%;
      padding: ${spacing.s};
      border: 1px solid ${colors.border.default};
      border-radius: ${radii.sm};
      background-color: ${colors.surface.card};
      color: ${colors.text.primary};
      font: inherit;
    }

    .assessment-report-delete-input:focus {
      outline: 2px solid ${colors.border.focus};
      outline-offset: 2px;
    }

    @container (min-width: 40rem) {
      .assessment-report-header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }

      .assessment-report-version-content {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }

      .assessment-report-version-details {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: ${spacing.m};
      }
    }
  `}
`;

export default StyledAssessmentReportsSection;
