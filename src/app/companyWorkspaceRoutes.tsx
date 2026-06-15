import React, { useState } from 'react';
import { Navigate, Outlet, useNavigate, useParams } from 'react-router-dom';

import { ActivityFeed, PageHeader } from '~/app/components/common';
import {
  EntityNotFoundView,
  RouteLoadingView,
} from '~/app/components/routeStateViews';
import IconSVG from '~/app/components/ui/iconSVG';
import type { CompanyListItem } from '~/domain';
import { routes } from '~/routes';

import {
  assessmentStatuses,
  assessments,
  dashboardStats,
  recentActivity,
  recentAssessments,
  reportCover,
  severityDistribution,
} from './appData';
import Dashboard from './pages/dashboard';
import type { DashboardPeriod } from './pages/dashboard';
import Assessments from './pages/assessments';
import Reports from './pages/reports';

import type { SidebarNavigationGroup } from './layouts/sidebar';

const companyWorkspaceNavigationLabel = 'Workspace';

interface CompanyWorkspaceRouteShellProps {
  companies: CompanyListItem[];
  isCompaniesLoading: boolean;
}

const CompanyWorkspaceRouteShell = ({
  companies,
  isCompaniesLoading,
}: CompanyWorkspaceRouteShellProps) => {
  const { companyId } = useParams<{ companyId?: string }>();

  if (!companyId) {
    return <Navigate replace to={routes.companies} />;
  }

  if (isCompaniesLoading) {
    return <RouteLoadingView />;
  }

  const companyExists = companies.some(company => company.id === companyId);

  if (!companyExists) {
    return (
      <EntityNotFoundView
        entityName="Company"
        listHref={routes.companies}
        listLabel="Return to companies"
      />
    );
  }

  return <Outlet />;
};

const useCompanyId = () => useParams<{ companyId?: string }>().companyId;

export const createCompanyWorkspaceNavigationGroups = (
  companyId: string,
): SidebarNavigationGroup[] => [
  {
    id: 'workspace',
    label: companyWorkspaceNavigationLabel,
    items: [
      {
        id: 'overview',
        label: 'Overview',
        icon: <IconSVG name="dashboard" />,
        href: routes.companyWorkspaceOverview(companyId),
      },
      {
        id: 'assessments',
        label: 'Assessments',
        icon: <IconSVG name="assessment" />,
        href: routes.companyWorkspaceAssessments(companyId),
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: <IconSVG name="report" />,
        href: routes.companyWorkspaceReports(companyId),
      },
      {
        id: 'activity',
        label: 'Activity',
        icon: <IconSVG name="activity" />,
        href: routes.companyWorkspaceActivity(companyId),
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [{ id: 'settings', label: 'Settings', href: routes.settings }],
  },
];

export const CompanyWorkspaceIndexRoute = () => {
  const companyId = useCompanyId();

  if (!companyId) {
    return <Navigate replace to={routes.companies} />;
  }

  return <Navigate replace to={routes.companyWorkspaceOverview(companyId)} />;
};

export const CompanyOverviewRoute = () => {
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('90');

  return (
    <Dashboard
      key={companyId}
      stats={dashboardStats}
      severityDistribution={severityDistribution}
      assessmentStatuses={assessmentStatuses}
      recentAssessments={recentAssessments}
      recentActivity={recentActivity}
      selectedPeriod={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
      onViewAllAssessments={() =>
        navigate(
          companyId
            ? routes.companyWorkspaceAssessments(companyId)
            : routes.assessments,
        )
      }
      onAssessmentClick={assessment =>
        navigate(routes.assessmentDetails(assessment.id))
      }
    />
  );
};

export const CompanyAssessmentsRoute = () => {
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  return (
    <Assessments
      key={companyId}
      assessments={assessments}
      searchValue={searchValue}
      statusFilter={statusFilter}
      riskFilter={riskFilter}
      typeFilter={typeFilter}
      onSearchChange={setSearchValue}
      onStatusFilterChange={setStatusFilter}
      onRiskFilterChange={setRiskFilter}
      onTypeFilterChange={setTypeFilter}
      onAssessmentClick={assessment =>
        navigate(routes.assessmentDetails(assessment.id))
      }
    />
  );
};

export const CompanyReportsRoute = () => {
  const companyId = useCompanyId();

  return <Reports key={companyId} cover={reportCover} />;
};

export const CompanyActivityRoute = () => {
  const companyId = useCompanyId();

  return (
    <section>
      <PageHeader
        eyebrow="Workspace"
        title="Activity"
        subtitle="Recent actions across the active company workspace."
      />

      <ActivityFeed key={companyId} items={recentActivity.slice(0, 5)} />
    </section>
  );
};

export const CompanyWorkspaceNotFoundRoute = () => {
  const companyId = useCompanyId();

  if (!companyId) {
    return <Navigate replace to={routes.companies} />;
  }

  return (
    <EntityNotFoundView
      entityName="Company workspace"
      listHref={routes.companyWorkspaceOverview(companyId)}
      listLabel="Return to overview"
    />
  );
};

export default CompanyWorkspaceRouteShell;
