import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Badge from '~/app/components/ui/badge';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import EmptyState from '~/app/components/ui/emptyState';
import { formatDate } from '~/app/utils/formatters';
import { routes } from '~/routes';
import { reportService, type ReportService } from '~/services/reportService';

import StyledAssessmentReportsSection from './assessmentReportsSection.styled';

import type { AssessmentReportListItem } from '~/domain';

interface AssessmentReportsSectionProps {
  companyId: string;
  assessmentId: string;
  service?: Pick<ReportService, 'listByAssessmentId'>;
}

type LoadState =
  | { status: 'pending'; requestKey: string }
  | {
      status: 'success';
      requestKey: string;
      reports: AssessmentReportListItem[];
    }
  | { status: 'error'; requestKey: string; message: string };

const formatVersionNumber = (version: number): string =>
  `${Math.floor(version / 10)}.${version % 10}`;

const reportStatusLabels = {
  draft: 'Draft',
  generated: 'Generated',
  archived: 'Archived',
} as const;

const AssessmentReportsSection = ({
  companyId,
  assessmentId,
  service = reportService,
}: AssessmentReportsSectionProps) => {
  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = `${assessmentId}:${reloadKey}`;

  const [state, setState] = useState<LoadState>(() => ({
    status: 'pending',
    requestKey,
  }));

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    void service
      .listByAssessmentId(assessmentId, controller.signal)
      .then(reports => {
        if (isActive) {
          setState({
            status: 'success',
            requestKey,
            reports,
          });
        }
      })
      .catch(error => {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        setState({
          status: 'error',
          requestKey,
          message:
            error instanceof Error
              ? error.message
              : 'Unable to load assessment reports.',
        });
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [assessmentId, requestKey, service]);

  if (state.requestKey !== requestKey || state.status === 'pending') {
    return (
      <Card title="Reports" padding="large">
        <p role="status">Loading reports…</p>
      </Card>
    );
  }

  if (state.status === 'error') {
    return (
      <Card title="Reports" padding="large">
        <Callout
          variant="error"
          title="Unable to load reports"
          actions={
            <Button
              title="Retry"
              variant="secondary"
              onClick={() => setReloadKey(value => value + 1)}
            />
          }
        >
          <p>{state.message}</p>
        </Callout>
      </Card>
    );
  }

  if (state.reports.length === 0) {
    return (
      <Card title="Reports" padding="large">
        <EmptyState
          title="No reports yet"
          description="Create and save a report version to make it available here."
        />
      </Card>
    );
  }

  return (
    <StyledAssessmentReportsSection>
      <Card
        title="Reports"
        subtitle="Saved reports and their immutable versions."
        padding="large"
      >
        <Callout
          className="assessment-reports-intro"
          variant="info"
          title="How PDF versions work"
        >
          <p>
            The application stores immutable report snapshots. PDF files are
            created by your browser from a selected saved version and are not
            stored by the application.
          </p>
        </Callout>

        <ul className="assessment-reports-list">
          {state.reports.map(report => (
            <li key={report.id} className="assessment-report-item">
              <div className="assessment-report-header">
                <div>
                  <h3 className="assessment-report-title">{report.title}</h3>

                  <p className="assessment-report-meta">
                    Updated {formatDate(report.updatedAt)} ·{' '}
                    {report.versions.length} saved{' '}
                    {report.versions.length === 1 ? 'version' : 'versions'}
                  </p>
                </div>

                <Badge
                  label={reportStatusLabels[report.status]}
                  variant={
                    report.status === 'generated' ? 'success' : 'neutral'
                  }
                />
              </div>

              {report.versions.length > 0 ? (
                <ul className="assessment-report-version-list">
                  {report.versions.map(version => (
                    <li key={version.id} className="assessment-report-version">
                      <Link
                        className="assessment-report-version-link"
                        to={routes.reportDetailsVersion(
                          companyId,
                          report.id,
                          version.id,
                        )}
                      >
                        Open v{formatVersionNumber(version.version)}
                      </Link>

                      <span className="assessment-report-meta">
                        {version.status === 'final' ? 'Final' : 'Draft'} ·{' '}
                        {formatDate(version.generatedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="assessment-report-empty">
                  No saved versions yet. Browser PDF export becomes available
                  after a version is saved.
                </p>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </StyledAssessmentReportsSection>
  );
};

export default AssessmentReportsSection;
