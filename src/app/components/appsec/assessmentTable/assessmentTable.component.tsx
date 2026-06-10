import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledAssessmentTable from './assessmentTable.styled';

import type { AssessmentTableProps } from './assessmentTable.type';

const toStatusClassName = (status: string) => status.replace(/\s+/g, '-');

const AssessmentTable = ({
  assessments,
  onAssessmentClick,
}: AssessmentTableProps) => (
  <StyledAssessmentTable>
    <table className="assessment-table__table">
      <thead className="assessment-table__head">
        <tr>
          <th className="assessment-table__header-cell">Application</th>
          <th className="assessment-table__header-cell">Type</th>
          <th className="assessment-table__header-cell">Environment</th>
          <th className="assessment-table__header-cell">Risk</th>
          <th className="assessment-table__header-cell">Findings</th>
          <th className="assessment-table__header-cell">Tester</th>
          <th className="assessment-table__header-cell">Status</th>
          <th className="assessment-table__header-cell" aria-label="Open" />
        </tr>
      </thead>

      <tbody>
        {assessments.length === 0 && (
          <tr>
            <td className="assessment-table__empty-cell" colSpan={8}>
              No assessments found.
            </td>
          </tr>
        )}

        {assessments.map(assessment => (
          <tr
            key={assessment.id}
            className={[
              'assessment-table__row',
              onAssessmentClick ? 'assessment-table__row--clickable' : '',
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
            <td className="assessment-table__cell">
              <div className="assessment-table__identity">
                <span
                  className={[
                    'assessment-table__initials',
                    `assessment-table__initials--${assessment.logoTone ?? 'blue'}`,
                  ].join(' ')}
                >
                  {assessment.initials}
                </span>

                <div>
                  <strong className="assessment-table__name">
                    {assessment.applicationName}
                  </strong>

                  <span className="assessment-table__meta">
                    {assessment.companyName}
                    {' · '}
                    {assessment.code}
                  </span>
                </div>
              </div>
            </td>

            <td className="assessment-table__cell">
              <span className="assessment-table__type-badge">
                {assessment.assessmentType}
              </span>
            </td>

            <td className="assessment-table__cell">{assessment.environment}</td>

            <td className="assessment-table__cell">
              <SeverityBadge severity={assessment.overallRisk} size="small" />
            </td>

            <td className="assessment-table__cell">
              <div className="assessment-table__findings">
                <strong>{assessment.findingsCount}</strong>

                {(assessment.criticalCount || assessment.highCount) && (
                  <span>
                    {assessment.criticalCount
                      ? `${assessment.criticalCount}C`
                      : ''}{' '}
                    {assessment.highCount ? `${assessment.highCount}H` : ''}
                  </span>
                )}
              </div>
            </td>

            <td className="assessment-table__cell">{assessment.testerName}</td>

            <td className="assessment-table__cell">
              <span
                className={[
                  'assessment-table__status-badge',
                  `assessment-table__status-badge--${toStatusClassName(assessment.status)}`,
                ].join(' ')}
              >
                {assessment.status}
              </span>
            </td>

            <td className="assessment-table__cell">
              <span className="assessment-table__chevron" aria-hidden="true">
                ›
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </StyledAssessmentTable>
);

export default AssessmentTable;
