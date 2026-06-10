import React from 'react';

import AssessmentStatusChart from '~/app/components/appsec/assessmentStatusChart';
import RecentAssessmentTable from '~/app/components/appsec/recentAssessmentTable';
import SeverityDistribution from '~/app/components/appsec/severityDistribution';
import ActivityFeed from '~/app/components/common/activityFeed';
import StatCard from '~/app/components/common/statCard';
import Button from '~/app/components/ui/button';
import SearchInput from '~/app/components/ui/searchInput';

import StyledDashboard from './dashboard.styled';
import type { DashboardPeriod, DashboardProps } from './dashboard.type';

const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path
      d="M9 4h6v2H9zM7 5H5v16h14V5h-2"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const ThreatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path
      d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path
      d="M12 9v4M12 17h.01M10.3 4 2 18h20L13.7 4a2 2 0 0 0-3.4 0Z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RetestIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path
      d="M20 7v5h-5M4 17v-5h5M6.5 8a7 7 0 0 1 11.5-1M17.5 16a7 7 0 0 1-11.5 1"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const getDirection = (value: number) => {
  if (value > 0) {
    return 'up' as const;
  }

  if (value < 0) {
    return 'down' as const;
  }

  return 'equal' as const;
};

const Dashboard = ({
  stats,
  severityDistribution,
  assessmentStatuses,
  recentAssessments,
  recentActivity,
  selectedPeriod,
  onPeriodChange,
  onCreateAssessment,
  onViewAllAssessments,
  onAssessmentClick,
}: DashboardProps) => (
  <StyledDashboard>
    <header className="dashboard-header">
      <div className="dashboard-title-group">
        <h1 className="dashboard-title">Security Dashboard</h1>

        <p className="dashboard-subtitle">
          Posture across all active application security assessments.
        </p>
      </div>

      <div className="dashboard-header-actions">
        <SearchInput
          label="Filter dashboard"
          placeholder="Filter dashboard..."
        />

        {onCreateAssessment && (
          <Button title="New Assessment" onClick={onCreateAssessment} />
        )}
      </div>
    </header>

    <div className="dashboard-stats-grid">
      <StatCard
        label="Total Assessments"
        value={stats.totalAssessments}
        icon={<ClipboardIcon />}
        iconTone="brand"
        trendDirection={getDirection(stats.totalAssessmentsChange)}
        trendTone={stats.totalAssessmentsChange >= 0 ? 'positive' : 'negative'}
        trendValue={Math.abs(stats.totalAssessmentsChange).toString()}
        helperText="new this quarter"
      />

      <StatCard
        label="Open Threats"
        value={stats.openThreats}
        icon={<ThreatIcon />}
        iconTone="medium"
        trendDirection={getDirection(stats.openThreatsChange)}
        trendTone={stats.openThreatsChange <= 0 ? 'positive' : 'negative'}
        trendValue={Math.abs(stats.openThreatsChange).toString()}
        helperText="vs. last month"
      />

      <StatCard
        label="Critical / High Findings"
        value={stats.criticalHighFindings}
        icon={<AlertIcon />}
        iconTone="critical"
        trendDirection={getDirection(stats.criticalHighChange)}
        trendTone={stats.criticalHighChange <= 0 ? 'positive' : 'negative'}
        trendValue={Math.abs(stats.criticalHighChange).toString()}
        helperText="remediated this week"
      />

      <StatCard
        label="Retest Required"
        value={stats.retestRequired}
        icon={<RetestIcon />}
        iconTone="purple"
        trendDirection={getDirection(stats.retestRequiredChange)}
        trendTone={stats.retestRequiredChange <= 0 ? 'positive' : 'negative'}
        trendValue={Math.abs(stats.retestRequiredChange).toString()}
        helperText="awaiting verification"
      />
    </div>

    <div className="dashboard-charts-grid">
      <section className="dashboard-card">
        <header className="dashboard-card-header">
          <div className="dashboard-card-title-group">
            <h2 className="dashboard-card-title">Findings by Severity</h2>
            <span className="dashboard-card-subtitle">
              Across open assessments
            </span>
          </div>

          <select
            className="dashboard-period-select"
            aria-label="Findings period"
            value={selectedPeriod}
            onChange={event =>
              onPeriodChange(event.target.value as DashboardPeriod)
            }
          >
            <option value="90">Last 90 days</option>
            <option value="30">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </header>

        <div className="dashboard-card-body">
          <SeverityDistribution
            items={severityDistribution}
            showTotal={false}
          />
        </div>
      </section>

      <section className="dashboard-card">
        <header className="dashboard-card-header">
          <div className="dashboard-card-title-group">
            <h2 className="dashboard-card-title">Assessments by Status</h2>

            <span className="dashboard-card-subtitle">
              {assessmentStatuses.reduce(
                (total, item) => total + item.count,
                0,
              )}{' '}
              total
            </span>
          </div>
        </header>

        <div className="dashboard-card-body">
          <AssessmentStatusChart items={assessmentStatuses} />
        </div>
      </section>
    </div>

    <div className="dashboard-bottom-grid">
      <section className="dashboard-card">
        <header className="dashboard-card-header">
          <div className="dashboard-card-title-group">
            <h2 className="dashboard-card-title">Recent Assessments</h2>
          </div>

          {onViewAllAssessments && (
            <button
              className="dashboard-view-all-button"
              type="button"
              onClick={onViewAllAssessments}
            >
              View all
              <span aria-hidden="true">→</span>
            </button>
          )}
        </header>

        {recentAssessments.length > 0 ? (
          <RecentAssessmentTable
            assessments={recentAssessments.slice(0, 5)}
            onAssessmentClick={onAssessmentClick}
          />
        ) : (
          <div className="dashboard-empty-state">No assessments yet.</div>
        )}
      </section>

      <section className="dashboard-card">
        <header className="dashboard-card-header">
          <div className="dashboard-card-title-group">
            <h2 className="dashboard-card-title">Recent Activity</h2>
          </div>
        </header>

        <div className="dashboard-card-body">
          <ActivityFeed items={recentActivity.slice(0, 5)} />
        </div>
      </section>
    </div>
  </StyledDashboard>
);

export default Dashboard;
