import React from 'react';

import Badge from '~/app/components/ui/badge';
import Button from '~/app/components/ui/button';
import EmptyState from '~/app/components/ui/emptyState';
import IconSVG from '~/app/components/ui/iconSVG';

import StyledDashboard from './dashboard.styled';
import { enrichRecentCompanies, formatRelativeTime } from './dashboard.utils';
import type { DashboardProps, RecentCompanyItem } from './dashboard.type';

const assessmentStatusLabelMap: Record<string, string> = {
  draft: 'Draft',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  completed: 'Completed',
  archived: 'Archived',
};

const CompanyIcon = () => <IconSVG name="company" />;

const formatAssessmentStatus = (status?: string) => {
  if (!status) {
    return undefined;
  }

  return assessmentStatusLabelMap[status] ?? status;
};

const getAssessmentSummary = (company: RecentCompanyItem) => {
  if (!company.latestAssessment) {
    return '—';
  }

  return company.latestAssessment.name;
};

const Dashboard = ({
  companies,
  isWorkspaceEmpty = false,
  onCreateCompany,
  onOpenCompany,
}: DashboardProps) => {
  const recentCompanies = enrichRecentCompanies(companies);
  const showEmptyState = isWorkspaceEmpty || recentCompanies.length === 0;

  if (showEmptyState) {
    return (
      <StyledDashboard>
        <header className="dashboard-header">
          <div className="dashboard-title-group">
            <h1 className="dashboard-title">Recent companies</h1>

            <p className="dashboard-subtitle">
              Open a company to continue where you left off.
            </p>
          </div>
        </header>

        <section className="dashboard-empty-card">
          <EmptyState
            title="No companies yet"
            description="Create your first company to start opening workspaces from the dashboard."
            icon={<CompanyIcon />}
            primaryAction={
              onCreateCompany ? (
                <Button title="Create company" onClick={onCreateCompany} />
              ) : undefined
            }
          />
        </section>
      </StyledDashboard>
    );
  }

  return (
    <StyledDashboard>
      <header className="dashboard-header">
        <div className="dashboard-title-group">
          <h1 className="dashboard-title">Recent companies</h1>

          <p className="dashboard-subtitle">
            Companies open in your preferred order. Recent workspaces stay at
            the top.
          </p>
        </div>

        {onCreateCompany && (
          <div className="dashboard-header-actions">
            <Button title="Create company" onClick={onCreateCompany} />
          </div>
        )}
      </header>

      <section className="dashboard-recent-companies-card">
        <ul className="dashboard-recent-companies-list">
          {recentCompanies.map(company => {
            const latestAssessmentLabel = getAssessmentSummary(company);
            const companyRow = (
              <>
                <div className="dashboard-company-summary">
                  <span className="dashboard-company-name">{company.name}</span>

                  <span className="dashboard-company-last-opened">
                    Last opened {formatRelativeTime(company.lastOpenedAt)}
                  </span>
                </div>

                <dl className="dashboard-company-details">
                  <div className="dashboard-company-detail">
                    <dt className="dashboard-company-detail-label">
                      Active assessments
                    </dt>
                    <dd className="dashboard-company-detail-value">
                      {company.assessmentCount}
                    </dd>
                  </div>

                  <div className="dashboard-company-detail dashboard-company-detail--latest">
                    <dt className="dashboard-company-detail-label">
                      Latest assessment
                    </dt>
                    <dd className="dashboard-company-detail-value">
                      <span className="dashboard-company-assessment-name">
                        {latestAssessmentLabel}
                      </span>

                      {company.latestAssessment?.status && (
                        <Badge
                          label={
                            formatAssessmentStatus(
                              company.latestAssessment.status,
                            ) ?? company.latestAssessment.status
                          }
                          size="small"
                          variant="neutral"
                        />
                      )}
                    </dd>
                  </div>
                </dl>
              </>
            );

            return (
              <li key={company.id} className="dashboard-recent-company-item">
                {onOpenCompany ? (
                  <button
                    type="button"
                    className="dashboard-recent-company-row dashboard-recent-company-row--interactive"
                    onClick={() => onOpenCompany(company)}
                  >
                    {companyRow}
                  </button>
                ) : (
                  <div className="dashboard-recent-company-row dashboard-recent-company-row--static">
                    {companyRow}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </StyledDashboard>
  );
};

export default Dashboard;
