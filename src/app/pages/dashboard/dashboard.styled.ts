import styled from 'styled-components';

const StyledDashboard = styled.div.attrs({ className: 'dashboard' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.l};
`;

export const DashboardHeader = styled.header.attrs({
  className: 'dashboard-header',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.tablet} {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
`;

export const DashboardTitleGroup = styled.div.attrs({
  className: 'dashboard-title-group',
})`
  min-width: 0;
`;

export const DashboardTitle = styled.h1.attrs({ className: 'dashboard-title' })`
  font-size: ${({ theme }) => theme.typography.headings.h3.size};

  line-height: ${({ theme }) => theme.typography.headings.h3.lineHeight};
`;

export const DashboardSubtitle = styled.p.attrs({
  className: 'dashboard-subtitle',
})`
  margin-top: ${({ theme }) => theme.spacing.xxxs};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const DashboardHeaderActions = styled.div.attrs({
  className: 'dashboard-header-actions',
})`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const DashboardStatsGrid = styled.div.attrs({
  className: 'dashboard-stats-grid',
})`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: ${({ theme }) => theme.spacing.s};
`;

export const DashboardChartsGrid = styled.div.attrs({
  className: 'dashboard-charts-grid',
})`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.laptop} {
    grid-template-columns:
      minmax(0, 1.15fr)
      minmax(0, 1fr);
  }
`;

export const DashboardBottomGrid = styled.div.attrs({
  className: 'dashboard-bottom-grid',
})`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.s};

  @media ${({ theme }) => theme.mq.min.laptop} {
    grid-template-columns:
      minmax(0, 1.5fr)
      minmax(20rem, 1fr);
  }
`;

export const DashboardCard = styled.section.attrs({
  className: 'dashboard-card',
})`
  overflow: hidden;

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.lg};

  background-color: ${({ theme }) => theme.colors.surface.card};

  box-shadow: ${({ theme }) => theme.shadows.xs};
`;

export const DashboardCardHeader = styled.header.attrs({
  className: 'dashboard-card-header',
})`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s};

  min-height: 3.75rem;
  padding: ${({ theme }) => theme.spacing.s} ${({ theme }) => theme.spacing.m};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export const DashboardCardTitleGroup = styled.div.attrs({
  className: 'dashboard-card-title-group',
})`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const DashboardCardTitle = styled.h2.attrs({
  className: 'dashboard-card-title',
})`
  font-size: ${({ theme }) => theme.typography.headings.h6.size};

  line-height: ${({ theme }) => theme.typography.headings.h6.lineHeight};
`;

export const DashboardCardSubtitle = styled.span.attrs({
  className: 'dashboard-card-subtitle',
})`
  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const DashboardCardBody = styled.div.attrs({
  className: 'dashboard-card-body',
})`
  padding: ${({ theme }) => theme.spacing.m};
`;

export const DashboardPeriodSelect = styled.select.attrs({
  className: 'dashboard-period-select',
})`
  min-height: 2rem;
  padding: 0.375rem 2rem 0.375rem 0.75rem;

  border: 1px solid ${({ theme }) => theme.colors.border.default};

  border-radius: ${({ theme }) => theme.radii.md};

  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.secondary};

  background-color: ${({ theme }) => theme.colors.surface.card};
`;

export const DashboardViewAllButton = styled.button.attrs({
  className: 'dashboard-view-all-button',
})`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxxs};

  padding: 0;

  border: 0;

  font-size: ${({ theme }) => theme.typography.body.small.size};

  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};

  color: ${({ theme }) => theme.colors.text.link};

  background: transparent;
`;

export const DashboardEmptyState = styled.div.attrs({
  className: 'dashboard-empty-state',
})`
  padding: ${({ theme }) => theme.spacing.xl};

  color: ${({ theme }) => theme.colors.text.muted};

  text-align: center;
`;

export default StyledDashboard;
