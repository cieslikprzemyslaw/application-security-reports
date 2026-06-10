import React, { useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';

import AssessmentDetails from '~/app/pages/assessmentDetails';
import Assessments from '~/app/pages/assessments';
import Companies from '~/app/pages/companies';
import Dashboard from '~/app/pages/dashboard';
import NotFound from '~/app/pages/notFound';
import Reports from '~/app/pages/reports';
import Settings from '~/app/pages/settings';
import Threats from '~/app/pages/threats';
import { AppShell, Sidebar, Topbar } from '~/app/layouts';
import PageContent from '~/app/layouts/pageContent';
import { routes, routePatterns } from '~/routes';

import {
  assessmentDetailsById,
  assessmentStatuses,
  assessments,
  companies,
  dashboardStats,
  recentActivity,
  recentAssessments,
  reportCover,
  settingsValue,
  severityDistribution,
  threats,
} from './appData';

import type { DashboardPeriod } from './pages/dashboard';
import type { SettingsValue } from './pages/settings';
import type { SidebarNavigationGroup } from './layouts/sidebar';

const navigationGroups: SidebarNavigationGroup[] = [
  {
    id: 'workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: routes.dashboard },
      { id: 'companies', label: 'Companies', href: routes.companies },
      { id: 'assessments', label: 'Assessments', href: routes.assessments },
      { id: 'threats', label: 'Threats', href: routes.threats },
      { id: 'reports', label: 'Reports', href: routes.reports },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [{ id: 'settings', label: 'Settings', href: routes.settings }],
  },
] as const;

const WorkspaceLayout = () => (
  <AppShell
    sidebar={
      <Sidebar
        brand={<strong>AppSec Reports</strong>}
        navigationGroups={navigationGroups}
        footer={<small>Local workspace</small>}
      />
    }
    topbar={<Topbar title="AppSec Report Builder" />}
  >
    <Outlet />
  </AppShell>
);

const DashboardRoute = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('90');

  return (
    <PageContent maxWidth="wide" spacing="default">
      <Dashboard
        stats={dashboardStats}
        severityDistribution={severityDistribution}
        assessmentStatuses={assessmentStatuses}
        recentAssessments={recentAssessments}
        recentActivity={recentActivity}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        onViewAllAssessments={() => navigate(routes.assessments)}
        onAssessmentClick={assessment =>
          navigate(routes.assessmentDetails(assessment.id))
        }
      />
    </PageContent>
  );
};

const CompaniesRoute = () => {
  const [searchValue, setSearchValue] = useState('');

  return (
    <PageContent maxWidth="wide">
      <Companies
        companies={companies}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
    </PageContent>
  );
};

const AssessmentsRoute = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  return (
    <PageContent maxWidth="wide">
      <Assessments
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
    </PageContent>
  );
};

const AssessmentDetailsRoute = () => {
  const navigate = useNavigate();
  const { assessmentId } = useParams<{
    assessmentId?: string;
  }>();

  if (!assessmentId || !assessmentDetailsById[assessmentId]) {
    return <NotFound />;
  }

  const {
    assessment,
    executiveSummary: summary,
    threats: assessmentThreats,
  } = assessmentDetailsById[assessmentId];

  return (
    <PageContent maxWidth="wide" spacing="default">
      <AssessmentDetails
        assessment={assessment}
        threats={assessmentThreats}
        executiveSummary={summary}
        onBack={() => navigate(routes.assessments)}
      />
    </PageContent>
  );
};

const ThreatsRoute = () => {
  const [searchValue, setSearchValue] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [applicationFilter, setApplicationFilter] = useState('all');
  const [selectedThreat, setSelectedThreat] = useState<
    (typeof threats)[number] | undefined
  >();

  return (
    <PageContent maxWidth="wide">
      <Threats
        threats={threats}
        searchValue={searchValue}
        severityFilter={severityFilter}
        statusFilter={statusFilter}
        applicationFilter={applicationFilter}
        selectedThreat={selectedThreat}
        isDrawerOpen={Boolean(selectedThreat)}
        onSearchChange={setSearchValue}
        onSeverityFilterChange={setSeverityFilter}
        onStatusFilterChange={setStatusFilter}
        onApplicationFilterChange={setApplicationFilter}
        onThreatClick={setSelectedThreat}
        onDrawerClose={() => setSelectedThreat(undefined)}
      />
    </PageContent>
  );
};

const ReportsRoute = () => (
  <PageContent maxWidth="full" spacing="default">
    <Reports cover={reportCover} />
  </PageContent>
);

const SettingsRoute = () => {
  const [value, setValue] = useState<SettingsValue>(settingsValue);

  return (
    <PageContent maxWidth="wide">
      <Settings
        value={value}
        onChange={setValue}
        onSubmit={event => {
          event.preventDefault();
        }}
      />
    </PageContent>
  );
};

const RedirectToDashboard = () => <Navigate replace to={routes.dashboard} />;

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path={routePatterns.root} element={<RedirectToDashboard />} />

      <Route element={<WorkspaceLayout />}>
        <Route path={routePatterns.dashboard} element={<DashboardRoute />} />
        <Route path={routePatterns.companies} element={<CompaniesRoute />} />
        <Route
          path={routePatterns.assessments}
          element={<AssessmentsRoute />}
        />
        <Route
          path={routePatterns.assessmentDetails}
          element={<AssessmentDetailsRoute />}
        />
        <Route path={routePatterns.threats} element={<ThreatsRoute />} />
        <Route path={routePatterns.reports} element={<ReportsRoute />} />
        <Route path={routePatterns.settings} element={<SettingsRoute />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
