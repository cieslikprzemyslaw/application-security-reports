import React, { lazy, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { EntityNotFoundView } from '~/app/components/routeStateViews';
import { AppLayout } from '~/app/layouts';
import NotFound from '~/app/pages/notFound';
import { routes, routePatterns } from '~/routes';
import type { CompanyListItem } from '~/domain';
import { companyService } from '~/services';

import {
  assessmentDetailsById,
  assessmentStatuses,
  assessments,
  dashboardStats,
  recentActivity,
  recentAssessments,
  reportCover,
  reportDetailsById,
  settingsValue,
  severityDistribution,
  threats,
} from './appData';

import type { DashboardPeriod } from './pages/dashboard';
import type { CompanyIdentity } from './pages/companies';
import type { SettingsValue } from './pages/settings';

const Dashboard = lazy(() => import('./pages/dashboard'));
const Companies = lazy(() => import('./pages/companies'));
const Assessments = lazy(() => import('./pages/assessments'));
const AssessmentDetails = lazy(() => import('./pages/assessmentDetails'));
const ReportDetails = lazy(() => import('./pages/reportDetails'));
const Reports = lazy(() => import('./pages/reports'));
const Settings = lazy(() => import('./pages/settings'));
const Threats = lazy(() => import('./pages/threats'));

const DashboardRoute = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('90');

  return (
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
  );
};

interface CompaniesRouteProps {
  activeCompany?: CompanyIdentity;
  onActiveCompanyChange: (company?: CompanyIdentity) => void;
}

const CompaniesRoute = ({
  activeCompany,
  onActiveCompanyChange,
}: CompaniesRouteProps) => (
  <Companies
    activeCompany={activeCompany}
    onActiveCompanyChange={onActiveCompanyChange}
  />
);

const AssessmentsRoute = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  return (
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
  );
};

const AssessmentDetailsRoute = () => {
  const navigate = useNavigate();
  const { assessmentId } = useParams<{
    assessmentId?: string;
  }>();

  if (!assessmentId || !assessmentDetailsById[assessmentId]) {
    return (
      <EntityNotFoundView
        entityName="Assessment"
        listHref={routes.assessments}
        listLabel="Return to assessments"
      />
    );
  }

  const {
    assessment,
    executiveSummary: summary,
    threats: assessmentThreats,
  } = assessmentDetailsById[assessmentId];

  return (
    <AssessmentDetails
      assessment={assessment}
      threats={assessmentThreats}
      executiveSummary={summary}
      onBack={() => navigate(routes.assessments)}
    />
  );
};

const ReportDetailsRoute = () => {
  const { reportId } = useParams<{
    reportId?: string;
  }>();

  if (!reportId || !reportDetailsById[reportId]) {
    return (
      <EntityNotFoundView
        entityName="Report"
        listHref={routes.reports}
        listLabel="Return to reports"
      />
    );
  }

  const { cover } = reportDetailsById[reportId];

  return <ReportDetails cover={cover} autoSaved={false} />;
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
  );
};

const ReportsRoute = () => <Reports cover={reportCover} />;

const SettingsRoute = () => {
  const [value, setValue] = useState<SettingsValue>(settingsValue);

  return (
    <Settings
      value={value}
      onChange={setValue}
      onSubmit={event => {
        event.preventDefault();
      }}
    />
  );
};

const RedirectToDashboard = () => <Navigate replace to={routes.dashboard} />;

const RouterShell = () => {
  const navigate = useNavigate();
  const [activeCompany, setActiveCompany] = useState<
    CompanyIdentity | undefined
  >();
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isCompaniesLoading, setIsCompaniesLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadCompanies = async () => {
      setIsCompaniesLoading(true);

      try {
        const nextCompanies = await companyService.list(controller.signal);

        if (isActive) {
          setCompanies(nextCompanies);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        setCompanies([]);
      } finally {
        if (isActive) {
          setIsCompaniesLoading(false);
        }
      }
    };

    void loadCompanies();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const handleActiveCompanyChange = (company?: CompanyIdentity) => {
    setActiveCompany(company);

    if (company) {
      navigate(routes.dashboard);
    }
  };

  return (
    <Routes>
      <Route path={routePatterns.root} element={<RedirectToDashboard />} />

      <Route
        element={
          <AppLayout
            key={activeCompany?.id ?? 'no-active-company'}
            activeCompany={activeCompany}
            companies={companies}
            isCompaniesLoading={isCompaniesLoading}
            onActiveCompanyChange={handleActiveCompanyChange}
          />
        }
      >
        <Route path={routePatterns.dashboard} element={<DashboardRoute />} />
        <Route
          path={routePatterns.companies}
          element={
            <CompaniesRoute
              activeCompany={activeCompany}
              onActiveCompanyChange={handleActiveCompanyChange}
            />
          }
        />
        <Route
          path={routePatterns.assessments}
          element={<AssessmentsRoute />}
        />
        <Route
          path={routePatterns.assessmentDetails}
          element={<AssessmentDetailsRoute />}
        />
        <Route
          path={routePatterns.reportDetails}
          element={<ReportDetailsRoute />}
        />
        <Route path={routePatterns.threats} element={<ThreatsRoute />} />
        <Route path={routePatterns.reports} element={<ReportsRoute />} />
        <Route path={routePatterns.settings} element={<SettingsRoute />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const AppRouter = () => (
  <BrowserRouter>
    <RouterShell />
  </BrowserRouter>
);

export default AppRouter;
