import React from 'react';
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useNavigationType,
  useParams,
} from 'react-router-dom';

import { ActivityFeed, PageHeader } from '~/app/components/common';
import {
  EntityNotFoundView,
  RouteLoadingView,
} from '~/app/components/routeStateViews';
import IconSVG from '~/app/components/ui/iconSVG';
import type {
  CompanyListItem,
  ReportBuilderState,
  ReportReadinessTarget,
} from '~/domain';
import type { ReportPreviewShellTab } from '~/app/components/appsec/reportPreviewShell';
import { routes } from '~/routes';

import { recentActivity, reportCover } from './appData';
import CompanyOverviewDashboard from './pages/dashboard/companyOverviewDashboard.component';
import Assessments from './pages/assessments';
import Reports from './pages/reports';
import {
  parseReportBuilderRouteState,
  serializeReportBuilderRouteState,
} from './pages/reports/reportBuilderState';

import type { SidebarNavigationGroup } from './layouts/sidebar';

const companyWorkspaceNavigationLabel = 'Workspace';

interface CompanyWorkspaceRouteShellProps {
  companies: CompanyListItem[];
  isCompaniesLoading: boolean;
}

interface CompanyWorkspaceRouteProps {
  companyName?: string;
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
  const companyId = useCompanyId();

  return companyId ? (
    <CompanyOverviewDashboard key={companyId} companyId={companyId} />
  ) : null;
};

export const CompanyAssessmentsRoute = ({
  companyName,
}: CompanyWorkspaceRouteProps) => {
  const companyId = useCompanyId();

  return companyId ? (
    <Assessments
      key={companyId}
      companyId={companyId}
      companyName={companyName}
    />
  ) : null;
};

export const CompanyReportsRoute = ({
  companyName,
}: CompanyWorkspaceRouteProps) => {
  const companyId = useCompanyId();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  if (!companyId) {
    return null;
  }

  const editorPath = routes.companyWorkspaceReports(companyId);
  const previewPath = routes.companyWorkspaceReportsPreview(companyId);

  if (location.pathname !== editorPath && location.pathname !== previewPath) {
    return (
      <EntityNotFoundView
        entityName="Company workspace"
        listHref={routes.companyWorkspaceOverview(companyId)}
        listLabel="Return to overview"
      />
    );
  }

  const view: ReportPreviewShellTab =
    location.pathname === previewPath ? 'preview' : 'data';
  const routeState = parseReportBuilderRouteState(companyId, location.state);

  if (view === 'preview' && !routeState) {
    return <Navigate replace to={routes.companyWorkspaceReports(companyId)} />;
  }

  const handleViewChange = (
    nextView: ReportPreviewShellTab,
    builderState: ReportBuilderState,
  ) => {
    if (nextView === view) {
      return;
    }

    if (nextView === 'data') {
      navigate(-1);
      return;
    }

    const serializedState = serializeReportBuilderRouteState(builderState);

    void (async () => {
      await navigate(routes.companyWorkspaceReports(companyId), {
        replace: true,
        state: serializedState,
      });
      await navigate(routes.companyWorkspaceReportsPreview(companyId), {
        state: serializedState,
      });
    })();
  };

  const handleBuilderStateChange = (builderState: ReportBuilderState) => {
    void navigate(location.pathname, {
      replace: true,
      state: serializeReportBuilderRouteState(builderState),
    });
  };

  const handleReadinessTargetNavigate = (
    target: ReportReadinessTarget,
    builderState: ReportBuilderState,
  ) => {
    if (target.resourceType !== 'report' || target.field !== 'brandingMode') {
      return;
    }

    const serializedState = serializeReportBuilderRouteState(builderState);

    void (async () => {
      await navigate(location.pathname, {
        replace: true,
        state: serializedState,
      });
      await navigate({
        pathname: routes.settings,
        hash: '#organisationName',
      });
    })();
  };

  const focusTarget =
    view === 'preview'
      ? 'preview-heading'
      : navigationType === 'POP' && routeState
        ? 'preview-tab'
        : undefined;

  return (
    <Reports
      key={companyId}
      companyId={companyId}
      companyName={companyName}
      cover={reportCover}
      builderRouteState={routeState}
      builderView={view}
      builderFocusTarget={focusTarget}
      builderFocusKey={location.key}
      onBuilderViewChange={handleViewChange}
      onBuilderStateChange={handleBuilderStateChange}
      onReadinessTargetNavigate={handleReadinessTargetNavigate}
    />
  );
};

export const CompanyActivityRoute = ({
  companyName,
}: CompanyWorkspaceRouteProps) => {
  const companyId = useCompanyId();

  return (
    <section>
      <PageHeader
        eyebrow="Workspace"
        title="Activity"
        breadcrumbs={[
          {
            label: companyName ?? 'Company',
          },
          {
            label: 'Activity',
          },
        ]}
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
