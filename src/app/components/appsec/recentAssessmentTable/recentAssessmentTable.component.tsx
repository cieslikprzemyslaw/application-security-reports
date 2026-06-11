import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';
import Badge from '~/app/components/ui/badge';

import StyledRecentAssessmentTable from './recentAssessmentTable.styled';

import type { RecentAssessmentTableProps } from './recentAssessmentTable.type';

const assessmentStatusLabelMap: Record<string, string> = {
  draft: 'Draft',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  completed: 'Completed',
  archived: 'Archived',
};

const RecentAssessmentTable = ({
  assessments,
  onAssessmentClick,
}: RecentAssessmentTableProps) => (
  <StyledRecentAssessmentTable>
    <table className="recent-assessment-table-element">
      <thead className="recent-assessment-table-head">
        <tr>
          <th className="recent-assessment-table-header-cell">Application</th>

          <th className="recent-assessment-table-header-cell">Type</th>

          <th className="recent-assessment-table-header-cell">Risk</th>

          <th className="recent-assessment-table-header-cell">Findings</th>

          <th className="recent-assessment-table-header-cell">Status</th>
        </tr>
      </thead>

      <tbody>
        {assessments.map(assessment => (
          <tr
            key={assessment.id}
            className={[
              'recent-assessment-table-row',
              onAssessmentClick ? 'recent-assessment-table-row--clickable' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            tabIndex={onAssessmentClick ? 0 : undefined}
            onClick={() => onAssessmentClick?.(assessment)}
            onKeyDown={event => {
              if (
                onAssessmentClick &&
                (event.key === 'Enter' || event.key === ' ')
              ) {
                event.preventDefault();

                onAssessmentClick(assessment);
              }
            }}
          >
            <td className="recent-assessment-table-cell">
              <strong className="recent-assessment-table-name">
                {assessment.applicationName}
              </strong>

              <span className="recent-assessment-table-company">
                {assessment.companyName}
              </span>
            </td>

            <td className="recent-assessment-table-cell">
              <span className="recent-assessment-table-type-badge">
                {assessment.assessmentType}
              </span>
            </td>

            <td className="recent-assessment-table-cell">
              <SeverityBadge severity={assessment.severity} size="small" />
            </td>

            <td className="recent-assessment-table-cell">
              <strong className="recent-assessment-table-findings-count">
                {assessment.findingsCount}
              </strong>
            </td>

            <td className="recent-assessment-table-cell">
              <Badge
                label={assessmentStatusLabelMap[assessment.status]}
                variant="neutral"
                size="small"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </StyledRecentAssessmentTable>
);

export default RecentAssessmentTable;
