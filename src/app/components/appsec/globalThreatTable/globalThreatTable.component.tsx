import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';

import StyledGlobalThreatTable, {
  AppName,
  Cell,
  Chevron,
  CompanyName,
  Head,
  HeaderCell,
  Row,
  Stride,
  Table,
  ThreatId,
  ThreatTitle,
} from './globalThreatTable.styled';

import type { GlobalThreatTableProps } from './globalThreatTable.type';

const GlobalThreatTable = ({
  threats,
  onThreatClick,
}: GlobalThreatTableProps) => (
  <StyledGlobalThreatTable>
    <Table>
      <Head>
        <tr>
          <HeaderCell>Threat</HeaderCell>

          <HeaderCell>Application</HeaderCell>

          <HeaderCell>STRIDE</HeaderCell>

          <HeaderCell>Severity</HeaderCell>

          <HeaderCell>Status</HeaderCell>

          <HeaderCell>Updated</HeaderCell>

          <HeaderCell aria-label="Open" />
        </tr>
      </Head>

      <tbody>
        {threats.map(threat => (
          <Row
            key={threat.id}
            $clickable={Boolean(onThreatClick)}
            tabIndex={onThreatClick ? 0 : undefined}
            onClick={() => onThreatClick?.(threat)}
            onKeyDown={event => {
              if (
                onThreatClick &&
                (event.key === 'Enter' || event.key === ' ')
              ) {
                event.preventDefault();

                onThreatClick(threat);
              }
            }}
          >
            <Cell>
              <ThreatTitle>{threat.title}</ThreatTitle>

              <ThreatId>{threat.id}</ThreatId>
            </Cell>

            <Cell>
              <AppName>{threat.applicationName}</AppName>

              <CompanyName>{threat.companyName}</CompanyName>
            </Cell>

            <Cell>
              <Stride>{threat.strideCategory}</Stride>
            </Cell>

            <Cell>
              <SeverityBadge severity={threat.severity} size="small" />
            </Cell>

            <Cell>
              <StatusBadge status={threat.status} size="small" />
            </Cell>

            <Cell>{threat.updatedAt}</Cell>

            <Cell>
              <Chevron aria-hidden="true">›</Chevron>
            </Cell>
          </Row>
        ))}
      </tbody>
    </Table>
  </StyledGlobalThreatTable>
);

export default GlobalThreatTable;
