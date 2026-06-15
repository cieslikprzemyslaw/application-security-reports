import React from 'react';
import { useNavigate } from 'react-router-dom';

import RecentAssessmentTable from '~/app/components/appsec/recentAssessmentTable';
import ReportTable from '~/app/components/appsec/reportTable';
import { PageHeader, StatCard } from '~/app/components/common';
import Button from '~/app/components/ui/button';
import Card from '~/app/components/ui/card';
import EmptyState from '~/app/components/ui/emptyState';
import IconSVG from '~/app/components/ui/iconSVG';
import { routes } from '~/routes';

import type { CompanyOverviewResponse } from '~/services/companyService';

interface CompanyOverviewDashboardViewProps {
  companyId: string;
  overview: CompanyOverviewResponse;
  onEditCompany: () => void;
}

const getCompanySubtitle = (company: CompanyOverviewResponse['company']) =>
  company.description?.trim() ||
  company.website?.trim() ||
  'Overview, assessments, and reports for the active company.';

const hasReportsSection = (overview: CompanyOverviewResponse) =>
  overview.recentReports !== undefined && overview.recentReports !== null;

const CompanyOverviewDashboardView = ({
  companyId,
  overview,
  onEditCompany,
}: CompanyOverviewDashboardViewProps) => {
  const navigate = useNavigate();
  const recentAssessments = overview.recentAssessments.slice(0, 5);
  const reportsSupported = hasReportsSection(overview);
  const recentReports = reportsSupported ? (overview.recentReports ?? []) : [];
  const isNewCompany = overview.assessmentCounts.total === 0;
  const showReportsSection = reportsSupported && !isNewCompany;

  return (
    <>
      <PageHeader
        eyebrow="Company workspace"
        title={overview.company.name}
        subtitle={getCompanySubtitle(overview.company)}
        actions={
          <Button
            title="Edit company"
            icon={<IconSVG name="edit" />}
            variant="secondary"
            onClick={onEditCompany}
          />
        }
      />

      <div className="dashboard-stats-grid">
        <StatCard
          label="Total assessments"
          value={overview.assessmentCounts.total}
          icon={<IconSVG name="assessment" />}
          iconTone="brand"
          helperText="All time"
        />

        <StatCard
          label="Draft"
          value={overview.assessmentCounts.draft}
          icon={<IconSVG name="file" />}
          iconTone="neutral"
          helperText="Not yet started"
        />

        <StatCard
          label="In progress"
          value={overview.assessmentCounts.inProgress}
          icon={<IconSVG name="restore" />}
          iconTone="medium"
          helperText="Active work"
        />

        <StatCard
          label="Completed"
          value={overview.assessmentCounts.completed}
          icon={<IconSVG name="success" />}
          iconTone="low"
          helperText="Ready to review"
        />
      </div>

      <div className="dashboard-top-grid">
        <Card title="Quick actions">
          <div className="dashboard-quick-actions">
            <Button
              title="View assessments"
              icon={<IconSVG name="assessment" />}
              variant="secondary"
              onClick={() =>
                navigate(routes.companyWorkspaceAssessments(companyId))
              }
            />

            {showReportsSection && (
              <Button
                title="View reports"
                icon={<IconSVG name="report" />}
                variant="secondary"
                onClick={() =>
                  navigate(routes.companyWorkspaceReports(companyId))
                }
              />
            )}
          </div>
        </Card>

        {isNewCompany ? (
          <Card padding="large">
            <EmptyState
              title="No assessments yet"
              description="Create the first assessment to start tracking work for this company."
              primaryAction={
                <Button
                  title="View assessments"
                  onClick={() =>
                    navigate(routes.companyWorkspaceAssessments(companyId))
                  }
                />
              }
              secondaryAction={
                <Button
                  title="Edit company"
                  variant="secondary"
                  onClick={onEditCompany}
                />
              }
            />
          </Card>
        ) : (
          <Card
            title="Recent assessments"
            actions={
              <Button
                title="View all"
                variant="secondary"
                onClick={() =>
                  navigate(routes.companyWorkspaceAssessments(companyId))
                }
              />
            }
            padding="none"
          >
            {recentAssessments.length > 0 ? (
              <RecentAssessmentTable
                assessments={recentAssessments}
                onAssessmentClick={assessment =>
                  navigate(routes.assessmentDetails(assessment.id))
                }
              />
            ) : (
              <div className="dashboard-empty-section">
                <EmptyState
                  title="No recent assessments"
                  description="Assessments will appear here after they are updated."
                  primaryAction={
                    <Button
                      title="View assessments"
                      onClick={() =>
                        navigate(routes.companyWorkspaceAssessments(companyId))
                      }
                    />
                  }
                />
              </div>
            )}
          </Card>
        )}
      </div>

      {showReportsSection && (
        <Card
          title="Recent reports"
          actions={
            <Button
              title="View all"
              variant="secondary"
              onClick={() =>
                navigate(routes.companyWorkspaceReports(companyId))
              }
            />
          }
          padding="none"
        >
          {recentReports.length > 0 ? (
            <ReportTable
              reports={recentReports}
              onReportClick={report =>
                navigate(routes.reportDetails(report.id))
              }
            />
          ) : (
            <div className="dashboard-empty-section">
              <EmptyState
                title="No reports yet"
                description="Generate a report from a completed assessment to show it here."
                primaryAction={
                  <Button
                    title="View assessments"
                    onClick={() =>
                      navigate(routes.companyWorkspaceAssessments(companyId))
                    }
                  />
                }
              />
            </div>
          )}
        </Card>
      )}
    </>
  );
};

export default CompanyOverviewDashboardView;
