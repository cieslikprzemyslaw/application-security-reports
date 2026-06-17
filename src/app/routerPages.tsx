import React, { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { reportCover, threats } from './appData';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import { PageHeader } from '~/app/components/common';
import Dashboard from './pages/dashboard';
import Reports from './pages/reports';
import Settings from './pages/settings';
import Threats from './pages/threats';
import type { CompanyListItem } from '~/domain';
import { RouteLoadingView } from '~/app/components/routeStateViews';
import { useListQueryState } from '~/app/hooks/useListQueryState';
import { routes } from '~/routes';
import type { RecentCompanyIdentity } from './pages/dashboard';
import {
  createThreatsQueryFields,
  getThreatApplications,
} from './pages/threats/threats.utils';

interface DashboardRouteProps {
  companies: CompanyListItem[];
  companiesLoadError?: string;
  isCompaniesLoading?: boolean;
  onOpenCompany: (company: RecentCompanyIdentity) => void;
  onRetryCompanies: () => void;
}

export const DashboardRoute = ({
  companies,
  companiesLoadError,
  isCompaniesLoading = false,
  onOpenCompany,
  onRetryCompanies,
}: DashboardRouteProps) => {
  const navigate = useNavigate();

  if (isCompaniesLoading) {
    return <RouteLoadingView />;
  }

  if (companiesLoadError) {
    return (
      <section>
        <PageHeader
          eyebrow="Workspace"
          title="Recent companies"
          subtitle="Open a company to continue where you left off."
        />

        <Callout
          variant="error"
          title="Unable to load recent companies"
          actions={
            <Button
              title="Retry"
              variant="secondary"
              onClick={onRetryCompanies}
            />
          }
        >
          <p>{companiesLoadError}</p>
        </Callout>
      </section>
    );
  }

  return (
    <Dashboard
      companies={companies}
      isWorkspaceEmpty={companies.length === 0}
      onCreateCompany={() =>
        navigate(routes.companies, {
          state: { openCreateDrawer: true },
        })
      }
      onOpenCompany={onOpenCompany}
    />
  );
};

interface AssessmentsRouteProps {
  activeCompanyId?: string;
}

export const AssessmentsRoute = ({
  activeCompanyId,
}: AssessmentsRouteProps) => {
  if (activeCompanyId) {
    return (
      <Navigate
        replace
        to={routes.companyWorkspaceAssessments(activeCompanyId)}
      />
    );
  }

  return <Navigate replace to={routes.dashboard} />;
};

export const ThreatsRoute = () => {
  const applications = useMemo(() => getThreatApplications(threats), []);
  const queryFields = useMemo(
    () => createThreatsQueryFields(applications),
    [applications],
  );
  const query = useListQueryState({
    fields: queryFields,
    searchKey: 'search',
  });
  const {
    severity: severityFilter,
    status: statusFilter,
    application: applicationFilter,
  } = query.state;
  const [selectedThreat, setSelectedThreat] = useState<
    (typeof threats)[number] | undefined
  >();

  return (
    <Threats
      threats={threats}
      searchValue={query.searchValue}
      severityFilter={severityFilter}
      statusFilter={statusFilter}
      applicationFilter={applicationFilter}
      selectedThreat={selectedThreat}
      isDrawerOpen={Boolean(selectedThreat)}
      onSearchChange={query.setSearchValue}
      onSeverityFilterChange={severity => query.setControl({ severity })}
      onStatusFilterChange={status => query.setControl({ status })}
      onApplicationFilterChange={application =>
        query.setControl({ application })
      }
      onClearControls={query.clearControls}
      onThreatClick={setSelectedThreat}
      onDrawerClose={() => setSelectedThreat(undefined)}
    />
  );
};

export const ReportsRoute = () => <Reports cover={reportCover} />;

export const SettingsRoute = () => <Settings />;
