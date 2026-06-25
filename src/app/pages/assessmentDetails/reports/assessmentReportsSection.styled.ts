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
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxs};
      padding-top: ${spacing.xs};
      border-top: 1px solid ${colors.border.subtle};
    }

    .assessment-report-version-link {
      width: fit-content;
      color: ${colors.text.link};
      font-weight: ${typography.fontWeights.semibold};
      text-decoration: none;
    }

    .assessment-report-version-link:hover {
      color: ${colors.text.linkHover};
      text-decoration: underline;
    }

    .assessment-report-version-link:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: 0.25rem;
    }

    @container (min-width: 40rem) {
      .assessment-report-header,
      .assessment-report-version {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }
  `}
`;

export default StyledAssessmentReportsSection;
