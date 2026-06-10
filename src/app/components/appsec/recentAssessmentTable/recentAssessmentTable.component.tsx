import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';

import StyledRecentAssessmentTable, {
  FindingsCount,
  RecentAssessmentCell,
  RecentAssessmentCompany,
  RecentAssessmentHead,
  RecentAssessmentHeaderCell,
  RecentAssessmentName,
  RecentAssessmentRowStyled,
  RecentAssessmentTableElement,
  TypeBadge,
} from './recentAssessmentTable.styled';

import type { RecentAssessmentTableProps } from './recentAssessmentTable.type';

const RecentAssessmentTable = ({
  assessments,
  onAssessmentClick,
}: RecentAssessmentTableProps) => (
  <StyledRecentAssessmentTable>
    <RecentAssessmentTableElement>
      <RecentAssessmentHead>
        <tr>
          <RecentAssessmentHeaderCell>Application</RecentAssessmentHeaderCell>

          <RecentAssessmentHeaderCell>Type</RecentAssessmentHeaderCell>

          <RecentAssessmentHeaderCell>Risk</RecentAssessmentHeaderCell>

          <RecentAssessmentHeaderCell>Findings</RecentAssessmentHeaderCell>

          <RecentAssessmentHeaderCell>Status</RecentAssessmentHeaderCell>
        </tr>
      </RecentAssessmentHead>

      <tbody>
        {assessments.map(assessment => (
          <RecentAssessmentRowStyled
            key={assessment.id}
            $isClickable={Boolean(onAssessmentClick)}
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
            <RecentAssessmentCell>
              <RecentAssessmentName>
                {assessment.applicationName}
              </RecentAssessmentName>

              <RecentAssessmentCompany>
                {assessment.companyName}
              </RecentAssessmentCompany>
            </RecentAssessmentCell>

            <RecentAssessmentCell>
              <TypeBadge>{assessment.assessmentType}</TypeBadge>
            </RecentAssessmentCell>

            <RecentAssessmentCell>
              <SeverityBadge severity={assessment.severity} size="small" />
            </RecentAssessmentCell>

            <RecentAssessmentCell>
              <FindingsCount>{assessment.findingsCount}</FindingsCount>
            </RecentAssessmentCell>

            <RecentAssessmentCell>
              <StatusBadge status={assessment.status} size="small" />
            </RecentAssessmentCell>
          </RecentAssessmentRowStyled>
        ))}
      </tbody>
    </RecentAssessmentTableElement>
  </StyledRecentAssessmentTable>
);

export default RecentAssessmentTable;
