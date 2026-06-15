import { styled, css } from 'styled-components';

const StyledDashboard = styled.div.attrs({ className: 'dashboard' })`
  ${({ theme: { colors, mq, radii, shadows, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};

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
      margin-top: ${spacing.xxxs};
      color: ${colors.text.muted};
    }

    .dashboard-header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .dashboard-welcome-card {
      overflow: hidden;
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
      box-shadow: ${shadows.xs};
    }

    .dashboard-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: ${spacing.s};
    }

    .dashboard-charts-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.s};

      @media ${mq.min.laptop} {
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
      }
    }

    .dashboard-bottom-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.s};

      @media ${mq.min.laptop} {
        grid-template-columns: minmax(0, 1.5fr) minmax(20rem, 1fr);
      }
    }

    .dashboard-card {
      overflow: hidden;
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
      box-shadow: ${shadows.xs};
    }

    .dashboard-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${spacing.s};

      min-height: 3.75rem;
      padding: ${spacing.s} ${spacing.m};

      border-bottom: 1px solid ${colors.border.subtle};
    }

    .dashboard-card-title-group {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: ${spacing.xxs};
    }

    .dashboard-card-title {
      font-size: ${typography.headings.h6.size};
      line-height: ${typography.headings.h6.lineHeight};
    }

    .dashboard-card-subtitle {
      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .dashboard-card-body {
      padding: ${spacing.m};
    }

    .dashboard-period-select {
      min-height: 2rem;
      padding: 0.375rem 2rem 0.375rem 0.75rem;

      border: 1px solid ${colors.border.default};
      border-radius: ${radii.md};

      font-size: ${typography.body.small.size};
      color: ${colors.text.secondary};
      background-color: ${colors.surface.card};
    }

    .dashboard-view-all-button {
      display: inline-flex;
      align-items: center;
      gap: ${spacing.xxxs};

      padding: 0;

      border: 0;

      font-size: ${typography.body.small.size};
      font-weight: ${typography.fontWeights.medium};
      color: ${colors.text.link};

      background: transparent;
    }

    .dashboard-empty-state {
      padding: ${spacing.xl};
      color: ${colors.text.muted};
      text-align: center;
    }
  `}
`;

export default StyledDashboard;
