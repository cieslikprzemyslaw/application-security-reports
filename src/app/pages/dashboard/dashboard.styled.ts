import { css, styled } from 'styled-components';

const StyledDashboard = styled.div.attrs({ className: 'dashboard' })`
  ${({
    theme: { colors, mq, radii, shadows, spacing, transitions, typography },
  }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};
    container-type: inline-size;
    container-name: dashboard;

    .dashboard-header {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};

      @media ${mq.min.tablet} {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
      }
    }

    .dashboard-title-group {
      min-width: 0;
    }

    .dashboard-title {
      font-size: ${typography.headings.h3.size};
      line-height: ${typography.headings.h3.lineHeight};
    }

    .dashboard-subtitle {
      margin-top: ${spacing.xxs};
      color: ${colors.text.muted};
    }

    .dashboard-header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .dashboard-empty-card,
    .dashboard-recent-companies-card {
      overflow: hidden;
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
      box-shadow: ${shadows.xs};
    }

    .dashboard-empty-card {
      padding: ${spacing.xl};
    }

    .dashboard-recent-companies-card {
      padding: 0;
    }

    .dashboard-recent-companies-list {
      display: grid;
      gap: 0;

      margin: 0;
      padding: 0;

      list-style: none;
    }

    .dashboard-recent-company-item {
      width: 100%;
    }

    .dashboard-recent-company-row {
      display: grid;
      gap: ${spacing.s};
      width: 100%;
      padding: ${spacing.m};

      border: 0;
      border-top: 1px solid ${colors.border.subtle};
      border-radius: 0;
      appearance: none;
      background-color: ${colors.surface.card};
      color: ${colors.text.primary};
      font: inherit;
      text-align: left;
    }

    .dashboard-recent-company-item:first-child .dashboard-recent-company-row {
      border-top: 0;
    }

    .dashboard-recent-company-row--interactive {
      cursor: pointer;
      transition:
        background-color ${transitions.fast},
        border-color ${transitions.fast},
        color ${transitions.fast};
    }

    .dashboard-recent-company-row--interactive:hover {
      background-color: ${colors.brand.wash};
    }

    .dashboard-recent-company-row--interactive:focus-visible {
      position: relative;
      z-index: 1;

      outline: 2px solid ${colors.border.focus};
      outline-offset: -2px;
    }

    .dashboard-company-summary {
      display: grid;
      gap: ${spacing.xxs};
    }

    .dashboard-company-name {
      font-size: ${typography.body.large.size};
      line-height: ${typography.body.large.lineHeight};
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.primary};
      word-break: break-word;
    }

    .dashboard-company-last-opened {
      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
      line-height: ${typography.body.small.lineHeight};
      word-break: break-word;
    }

    .dashboard-company-details {
      display: grid;
      gap: ${spacing.s};
      margin: 0;
    }

    .dashboard-company-detail {
      display: grid;
      gap: ${spacing.xxs};
    }

    .dashboard-company-detail-label {
      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .dashboard-company-detail-value {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: ${spacing.xxs};
      margin: 0;

      font-size: ${typography.body.medium.size};
      font-weight: ${typography.fontWeights.medium};
      color: ${colors.text.primary};
      word-break: break-word;
    }

    .dashboard-company-assessment-name {
      min-width: 0;
      word-break: break-word;
    }

    @container dashboard (max-width: 34rem) {
      .dashboard-recent-company-row {
        padding: ${spacing.s};
      }

      .dashboard-company-details {
        gap: ${spacing.xs};
      }
    }
  `}
`;

export default StyledDashboard;
