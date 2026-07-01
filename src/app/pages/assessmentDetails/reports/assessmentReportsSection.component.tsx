import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '~/app/components/ui/badge';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import EmptyState from '~/app/components/ui/emptyState';
import Modal from '~/app/components/ui/modal';
import { formatDateTime } from '~/app/utils/formatters';
import { routes } from '~/routes';
import { reportService, type ReportService } from '~/services/reportService';
import {
  reportVersionService,
  type ReportVersionService,
} from '~/services/reportVersionService';
import StyledAssessmentReportsSection from './assessmentReportsSection.styled';
import type { AssessmentReportListItem, ReportVersionSummary } from '~/domain';
interface AssessmentReportsSectionProps {
  companyId: string;
  assessmentId: string;
  service?: Pick<ReportService, 'listByAssessmentId'>;
  versionService?: Pick<ReportVersionService, 'deleteVersion'>;
  onVersionCountChange?: (delta: number) => void;
}
type LoadState =
  | { status: 'pending'; requestKey: string }
  | {
      status: 'success';
      requestKey: string;
      reports: AssessmentReportListItem[];
    }
  | { status: 'error'; requestKey: string; message: string };
interface DeleteTarget {
  report: AssessmentReportListItem;
  version: ReportVersionSummary;
}
const formatVersionNumber = (version: number): string =>
  `${Math.floor(version / 10)}.${version % 10}`;
const reportStatusLabels = {
  draft: 'Draft',
  generated: 'Generated',
  archived: 'Archived',
} as const;
const versionStatusLabels = {
  draft: 'Draft',
  final: 'Final',
} as const;
const getDeleteConfirmationText = (version: ReportVersionSummary): string =>
  `v${formatVersionNumber(version.version)}`;
const getDeleteDescription = (version: ReportVersionSummary): string =>
  version.status === 'final'
    ? 'This final Report version is immutable history. Deleting it removes the saved snapshot from this local workspace.'
    : 'This draft Report version will be removed from this local workspace.';
const removeVersionFromReports = (
  reports: AssessmentReportListItem[],
  reportId: string,
  versionId: string,
): AssessmentReportListItem[] =>
  reports
    .map(report =>
      report.id === reportId
        ? {
            ...report,
            versions: report.versions.filter(
              version => version.id !== versionId,
            ),
          }
        : report,
    )
    .filter(report => report.versions.length > 0);
const AssessmentReportsSection = ({
  companyId,
  assessmentId,
  service = reportService,
  versionService = reportVersionService,
  onVersionCountChange,
}: AssessmentReportsSectionProps) => {
  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = `${assessmentId}:${reloadKey}`;
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
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
  const requestedDeleteConfirmation = useMemo(
    () => (deleteTarget ? getDeleteConfirmationText(deleteTarget.version) : ''),
    [deleteTarget],
  );
  const isDeleteConfirmationValid =
    deleteConfirmation === requestedDeleteConfirmation;
  const requestVersionDelete = (target: DeleteTarget) => {
    setDeleteTarget(target);
    setDeleteConfirmation('');
    setDeleteError(undefined);
  };
  const closeDeleteDialog = () => {
    if (isDeleting) {
      return;
    }
    setDeleteTarget(null);
    setDeleteConfirmation('');
    setDeleteError(undefined);
  };
  const confirmVersionDelete = () => {
    if (!deleteTarget || !isDeleteConfirmationValid || isDeleting) {
      return;
    }
    const controller = new AbortController();
    const { report, version } = deleteTarget;
    setIsDeleting(true);
    setDeleteError(undefined);
    void versionService
      .deleteVersion(report.id, version.id, controller.signal)
      .then(() => {
        setState(current =>
          current.status === 'success'
            ? {
                ...current,
                reports: removeVersionFromReports(
                  current.reports,
                  report.id,
                  version.id,
                ),
              }
            : current,
        );
        setDeleteTarget(null);
        setDeleteConfirmation('');
        onVersionCountChange?.(-1);
        setReloadKey(value => value + 1);
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setDeleteError(
          error instanceof Error
            ? error.message
            : 'Unable to delete this Report version.',
        );
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };
  if (state.requestKey !== requestKey || state.status === 'pending') {
    return (
      <Card title="Reports" padding="large">
        <p role="status">Loading reports...</p>
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
  const visibleReports = state.reports.filter(
    report => report.versions.length > 0,
  );
  if (visibleReports.length === 0) {
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
          {visibleReports.map(report => {
            const latestVersion = report.versions[0];
            return (
              <li key={report.id} className="assessment-report-item">
                <div className="assessment-report-header">
                  <div>
                    <h3 className="assessment-report-title">
                      <Link
                        className="assessment-report-title-link"
                        to={routes.reportDetailsVersion(
                          companyId,
                          report.id,
                          latestVersion.id,
                        )}
                      >
                        {report.title}
                      </Link>
                    </h3>
                    <p className="assessment-report-meta">
                      Updated {formatDateTime(report.updatedAt)} -{' '}
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
                <ul className="assessment-report-version-list">
                  {report.versions.map(version => {
                    const versionNumber = formatVersionNumber(version.version);
                    const deleteLabel = `Delete ${report.title} version ${versionNumber}`;
                    return (
                      <li
                        key={version.id}
                        className="assessment-report-version"
                      >
                        <div className="assessment-report-version-content">
                          <Link
                            className="assessment-report-version-link"
                            to={routes.reportDetailsVersion(
                              companyId,
                              report.id,
                              version.id,
                            )}
                            aria-label={`Open ${report.title} version ${versionNumber} preview`}
                          >
                            <span className="assessment-report-version-name">
                              v{versionNumber}
                            </span>
                            <span className="assessment-report-meta">
                              {versionStatusLabels[version.status]} -{' '}
                              {formatDateTime(
                                version.createdAt ?? version.generatedAt,
                              )}
                            </span>
                            <span className="assessment-report-version-action">
                              Open preview
                            </span>
                          </Link>
                          <Button
                            title="Delete"
                            ariaLabel={deleteLabel}
                            variant="destructive"
                            size="small"
                            onClick={() =>
                              requestVersionDelete({ report, version })
                            }
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </Card>
      <Modal
        isOpen={deleteTarget !== null}
        title="Delete Report version"
        description="This action removes the saved snapshot from this local workspace."
        size="small"
        onClose={closeDeleteDialog}
        footer={
          <>
            <Button
              title="Cancel"
              variant="secondary"
              disabled={isDeleting}
              onClick={closeDeleteDialog}
            />
            <Button
              title="Delete version"
              variant="destructive"
              isLoading={isDeleting}
              disabled={!isDeleteConfirmationValid}
              onClick={confirmVersionDelete}
            />
          </>
        }
      >
        {deleteTarget && (
          <div className="assessment-report-delete-dialog">
            <p>
              You are deleting <strong>{deleteTarget.report.title}</strong>{' '}
              <strong>
                v{formatVersionNumber(deleteTarget.version.version)}
              </strong>
              .
            </p>
            <Callout
              variant={
                deleteTarget.version.status === 'final' ? 'warning' : 'neutral'
              }
              title={
                deleteTarget.version.status === 'final'
                  ? 'Final version deletion'
                  : 'Draft version deletion'
              }
            >
              <p>{getDeleteDescription(deleteTarget.version)}</p>
            </Callout>
            <label className="assessment-report-delete-label">
              Type <strong>{requestedDeleteConfirmation}</strong> to confirm.
              <input
                data-modal-autofocus="true"
                className="assessment-report-delete-input"
                value={deleteConfirmation}
                disabled={isDeleting}
                onChange={event => setDeleteConfirmation(event.target.value)}
              />
            </label>
            {deleteError && (
              <Callout variant="error" title="Unable to delete version">
                <p>{deleteError}</p>
              </Callout>
            )}
          </div>
        )}
      </Modal>
    </StyledAssessmentReportsSection>
  );
};
export default AssessmentReportsSection;
