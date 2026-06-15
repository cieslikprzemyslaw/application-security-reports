import { css, styled } from 'styled-components';

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
      padding: ${spacing.m};
    }

    .dashboard-recent-companies-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      gap: ${spacing.s};
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
      align-items: center;
      gap: ${spacing.xxs};
      margin: 0;

      font-size: ${typography.body.medium.size};
      font-weight: ${typography.fontWeights.medium};
      color: ${colors.text.primary};
    }

    .dashboard-company-detail--latest .dashboard-company-detail-value {
      align-items: flex-start;
    }
  `}
`;

export default StyledDashboard;
