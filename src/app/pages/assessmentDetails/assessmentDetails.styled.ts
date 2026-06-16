import { styled, css } from 'styled-components';

const StyledAssessmentDetails = styled.div.attrs({
  className: 'assessment-details',
})`
  ${({ theme: { colors, mq, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};

    .assessment-details-header {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};

      @media ${mq.min.tablet} {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
      }
    }

    .assessment-details-header-copy {
      min-width: 0;
    }

    .assessment-details-mobile-back {
      display: flex;

      @media ${mq.min.tablet} {
        display: none;
      }
    }

    .assessment-details-header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .assessment-details-desktop-back {
      display: none;

      @media ${mq.min.tablet} {
        display: inline-flex;
      }
    }

    .assessment-details-feedback {
      display: grid;
      gap: ${spacing.xxs};
    }

    .assessment-details-breadcrumb-list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: ${spacing.xxs};

      margin: 0 0 ${spacing.xxs};
      padding: 0;

      list-style: none;
    }

    .assessment-details-breadcrumb-item {
      display: inline-flex;
      align-items: center;
      gap: ${spacing.xxs};
      min-width: 0;

      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
      color: ${colors.text.muted};
    }

    .assessment-details-breadcrumb-item:not(:last-child)::after {
      content: '/';
      color: ${colors.neutral.grey400};
    }

    .assessment-details-breadcrumb-item a {
      color: ${colors.text.link};
      overflow-wrap: anywhere;
    }

    .assessment-details-breadcrumb-item span {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .assessment-details-breadcrumb-item span[aria-current='page'] {
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.primary};
    }

    .assessment-details-title {
      margin: 0;
      font-size: ${typography.headings.h3.size};
      line-height: ${typography.headings.h3.lineHeight};
      overflow-wrap: anywhere;
    }

    .assessment-details-title-link {
      color: inherit;
      text-decoration: none;
      overflow-wrap: anywhere;
    }

    .assessment-details-title-link:hover,
    .assessment-details-title-link:focus-visible {
      color: ${colors.text.link};
      text-decoration: underline;
    }

    .assessment-details-subtitle {
      margin-top: ${spacing.xxxs};
      color: ${colors.text.muted};
      overflow-wrap: anywhere;
    }

    .assessment-details-read-only-note {
      margin-top: ${spacing.xxs};

      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
      color: ${colors.text.muted};
    }

    .assessment-details-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: ${spacing.s};
    }

    .assessment-details-count-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: ${spacing.s};
    }

    .assessment-details-summary-card,
    .assessment-details-placeholder-copy {
      padding: ${spacing.s};
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.card};
    }

    .assessment-details-summary-card p {
      margin: ${spacing.xxxs} 0 0;
    }

    .assessment-details-section {
      overflow: hidden;
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
    }

    .assessment-details-section + .assessment-details-section {
      margin-top: ${spacing.m};
    }

    .assessment-details-section-header {
      display: flex;
      justify-content: space-between;
      gap: ${spacing.s};
      padding: ${spacing.s} ${spacing.m};
      border-bottom: 1px solid ${colors.border.subtle};
    }

    .assessment-details-section-header h2,
    .assessment-details-section-header p {
      margin: 0;
    }

    .assessment-details-section-body {
      padding: ${spacing.m};
    }

    .assessment-details-placeholder-copy {
      margin: 0;
    }
  `}
`;

export default StyledAssessmentDetails;
