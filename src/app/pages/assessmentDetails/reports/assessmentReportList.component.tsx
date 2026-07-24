import React from 'react';

import { CollectionRowAction } from '~/app/components/common';
import Badge from '~/app/components/ui/badge';
import Button from '~/app/components/ui/button';
import { formatDateTime } from '~/app/utils/formatters';
import { routes } from '~/routes';

import {
  formatVersionNumber,
  reportStatusLabels,
  versionStatusLabels,
} from './assessmentReportsSection.utils';

import type { AssessmentReportListItem, ReportVersionSummary } from '~/domain';

interface AssessmentReportListProps {
  companyId: string;
  reports: AssessmentReportListItem[];
  onDeleteRequest: (
    report: AssessmentReportListItem,
    version: ReportVersionSummary,
  ) => void;
}

const AssessmentReportList = ({
  companyId,
  reports,
  onDeleteRequest,
}: AssessmentReportListProps) => (
  <ul className="assessment-reports-list">
    {reports.map(report => (
      <li key={report.id} className="assessment-report-item">
        <div className="assessment-report-header">
          <div>
            <h3 className="assessment-report-title">{report.title}</h3>
            <p className="assessment-report-meta">
              Updated {formatDateTime(report.updatedAt)} -{' '}
              {report.versions.length} saved{' '}
              {report.versions.length === 1 ? 'version' : 'versions'}
            </p>
          </div>

          <Badge
            label={reportStatusLabels[report.status]}
            variant={report.status === 'generated' ? 'success' : 'neutral'}
          />
        </div>

        <ul className="assessment-report-version-list">
          {report.versions.map(version => {
            const versionNumber = formatVersionNumber(version.version);
            const openLabel = `Open ${report.title} version ${versionNumber} preview`;
            const deleteLabel = `Delete ${report.title} version ${versionNumber}`;

            return (
              <li key={version.id} className="assessment-report-version">
                <CollectionRowAction
                  className="assessment-report-version-link"
                  to={routes.reportDetailsVersion(
                    companyId,
                    report.id,
                    version.id,
                  )}
                  label={openLabel}
                >
                  {openLabel}
                </CollectionRowAction>

                <div className="assessment-report-version-content">
                  <div className="assessment-report-version-details">
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
                  </div>

                  <div className="assessment-report-version-actions">
                    <Button
                      title="Delete"
                      ariaLabel={deleteLabel}
                      variant="destructive"
                      size="small"
                      onClick={() => onDeleteRequest(report, version)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </li>
    ))}
  </ul>
);

export default AssessmentReportList;
