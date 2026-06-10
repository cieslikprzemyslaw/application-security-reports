import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';

import StyledAssessmentTable, {
  AssessmentStatusBadge,
  Cell,
  Chevron,
  Findings,
  Head,
  HeaderCell,
  Identity,
  Initials,
  Meta,
  Name,
  Row,
  Table,
  TypeBadge,
} from './assessmentTable.styled';

import type { AssessmentTableProps } from './assessmentTable.type';

const AssessmentTable = ({
  assessments,
  onAssessmentClick,
}: AssessmentTableProps) => (
  <StyledAssessmentTable>
    <Table>
      <Head>
        <tr>
          <HeaderCell>Application</HeaderCell>

          <HeaderCell>Type</HeaderCell>

          <HeaderCell>Environment</HeaderCell>

          <HeaderCell>Risk</HeaderCell>

          <HeaderCell>Findings</HeaderCell>

          <HeaderCell>Tester</HeaderCell>

          <HeaderCell>Status</HeaderCell>

          <HeaderCell aria-label="Open" />
        </tr>
      </Head>

      <tbody>
        {assessments.map(assessment => (
          <Row
            key={assessment.id}
            $clickable={Boolean(onAssessmentClick)}
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
            <Cell>
              <Identity>
                <Initials $tone={assessment.logoTone ?? 'blue'}>
                  {assessment.initials}
                </Initials>

                <div>
                  <Name>{assessment.applicationName}</Name>

                  <Meta>
                    {assessment.companyName}
                    {' · '}
                    {assessment.code}
                  </Meta>
                </div>
              </Identity>
            </Cell>

            <Cell>
              <TypeBadge>{assessment.assessmentType}</TypeBadge>
            </Cell>

            <Cell>{assessment.environment}</Cell>

            <Cell>
              <SeverityBadge severity={assessment.overallRisk} size="small" />
            </Cell>

            <Cell>
              <Findings>
                <strong>{assessment.findingsCount}</strong>

                {(assessment.criticalCount || assessment.highCount) && (
                  <span>
                    {assessment.criticalCount
                      ? `${assessment.criticalCount}C`
                      : ''}{' '}
                    {assessment.highCount ? `${assessment.highCount}H` : ''}
                  </span>
                )}
              </Findings>
            </Cell>

            <Cell>{assessment.testerName}</Cell>

            <Cell>
              <AssessmentStatusBadge $status={assessment.status}>
                {assessment.status}
              </AssessmentStatusBadge>
            </Cell>

            <Cell>
              <Chevron aria-hidden="true">›</Chevron>
            </Cell>
          </Row>
        ))}
      </tbody>
    </Table>
  </StyledAssessmentTable>
);

export default AssessmentTable;
