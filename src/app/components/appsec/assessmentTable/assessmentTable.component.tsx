import React from 'react';

import Badge from '~/app/components/ui/badge';
import Button from '~/app/components/ui/button';
import IconSVG from '~/app/components/ui/iconSVG';
import { formatCount, formatDateTime } from '~/app/utils/formatters';

import StyledAssessmentTable from './assessmentTable.styled';
import type {
  AssessmentListSortKey,
  AssessmentTableProps,
} from './assessmentTable.type';

const assessmentStatusLabelMap: Record<string, string> = {
  draft: 'Draft',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  completed: 'Completed',
  archived: 'Archived',
};

const assessmentSortLabels: Record<AssessmentListSortKey, string> = {
  name: 'Name',
  type: 'Type',
  status: 'Status',
  findings: 'Findings',
  updated: 'Updated',
};

const assessmentSortAriaLabels: Record<AssessmentListSortKey, string> = {
  name: 'Sort by name',
  type: 'Sort by type',
  status: 'Sort by status',
  findings: 'Sort by findings',
  updated: 'Sort by updated date',
};

const SortIndicator = ({
  active,
  direction,
}: {
  active: boolean;
  direction: 'asc' | 'desc';
}) => (
  <span
    className={[
      'assessment-table__sort-icon',
      !active && 'assessment-table__sort-icon--inactive',
    ]
      .filter(Boolean)
      .join(' ')}
    aria-hidden="true"
  >
    <IconSVG
      name={active && direction === 'asc' ? 'chevronUp' : 'chevronDown'}
      size="small"
    />
  </span>
);

const getAriaSortDirection = (direction: 'asc' | 'desc') =>
  direction === 'asc' ? 'ascending' : 'descending';

const AssessmentTable = ({
  assessments,
  sortBy,
  sortDirection,
  onSortChange,
  onAssessmentClick,
  onEditAssessment,
  emptyState,
}: AssessmentTableProps) => (
  <StyledAssessmentTable>
    <table className="assessment-table__table">
      <caption className="visually-hidden">
        Assessments for the active company
      </caption>
      <thead className="assessment-table__head">
        <tr>
          {(['name', 'type', 'status', 'findings', 'updated'] as const).map(
            key => (
              <th
                key={key}
                className="assessment-table__header-cell"
                scope="col"
                aria-sort={
                  sortBy === key ? getAriaSortDirection(sortDirection) : 'none'
                }
              >
                <button
                  type="button"
                  className="assessment-table__sort-button"
                  aria-label={assessmentSortAriaLabels[key]}
                  onClick={() => onSortChange(key)}
                >
                  <span>{assessmentSortLabels[key]}</span>
                  <SortIndicator
                    active={sortBy === key}
                    direction={sortDirection}
                  />
                </button>
              </th>
            ),
          )}

          <th className="assessment-table__header-cell" scope="col">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        {assessments.length === 0 && (
          <tr>
            <td className="assessment-table__empty-cell" colSpan={6}>
              {emptyState ?? 'No assessments found.'}
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
              <strong className="assessment-table__name">
                {assessment.name}
              </strong>
            </td>

            <td className="assessment-table__cell">
              <span className="assessment-table__type-badge">
                {assessment.type}
              </span>
            </td>

            <td className="assessment-table__cell">
              <Badge
                label={
                  assessmentStatusLabelMap[assessment.status] ??
                  assessment.status
                }
                variant="neutral"
                size="small"
              />
            </td>

            <td className="assessment-table__cell">
              <strong className="assessment-table__findings-count">
                {formatCount(assessment.findingsCount)}
              </strong>
            </td>

            <td className="assessment-table__cell">
              <time dateTime={assessment.updatedAt}>
                {formatDateTime(assessment.updatedAt)}
              </time>
            </td>

            <td className="assessment-table__cell">
              <div className="assessment-table__actions">
                <Button
                  title="Edit"
                  variant="secondary"
                  onClick={event => {
                    event.stopPropagation();
                    onEditAssessment?.(assessment);
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </StyledAssessmentTable>
);

export default AssessmentTable;
