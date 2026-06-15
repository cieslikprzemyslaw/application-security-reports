import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  assessmentStatuses,
  assessments,
  dashboardStats,
  recentActivity,
  recentAssessments,
  reportCover,
  settingsValue,
  severityDistribution,
  threats,
} from './appData';
import Assessments from './pages/assessments';
import Dashboard from './pages/dashboard';
import Reports from './pages/reports';
import Settings from './pages/settings';
import Threats from './pages/threats';
import type { DashboardPeriod } from './pages/dashboard';
import { routes } from '~/routes';

interface DashboardRouteProps {
  isWorkspaceEmpty?: boolean;
}

export const DashboardRoute = ({
  isWorkspaceEmpty = false,
}: DashboardRouteProps) => {
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
      isWorkspaceEmpty={isWorkspaceEmpty}
      onCreateCompany={() => navigate(routes.companies)}
      onViewAllAssessments={() => navigate(routes.assessments)}
      onAssessmentClick={assessment =>
        navigate(routes.assessmentDetails(assessment.id))
      }
    />
  );
};

export const AssessmentsRoute = () => {
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

export const ThreatsRoute = () => {
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

export const ReportsRoute = () => <Reports cover={reportCover} />;

export const SettingsRoute = () => {
  const [value, setValue] = useState(settingsValue);

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
