import React from 'react';

import DataTable from '~/app/components/common/dataTable';
import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';

import {
  StrideBadge,
  ThreatDate,
  ThreatEndpoint,
  ThreatTitle,
  ThreatTitleCell,
} from './threatTable.styled';

import type { ThreatTableProps, ThreatTableRow } from './threatTable.type';

const ThreatTable = ({
  threats,
  isLoading = false,
  emptyState,
  onThreatClick,
}: ThreatTableProps) => (
  <DataTable<ThreatTableRow>
    caption="Threats"
    rows={threats}
    isLoading={isLoading}
    emptyState={emptyState}
    getRowKey={threat => threat.id}
    onRowClick={onThreatClick}
    columns={[
      {
        id: 'title',
        header: 'Threat',
        cell: threat => (
          <ThreatTitleCell>
            <ThreatTitle>{threat.title}</ThreatTitle>

            {threat.endpoint && (
              <ThreatEndpoint>
                {threat.id} · {threat.endpoint}
              </ThreatEndpoint>
            )}
          </ThreatTitleCell>
        ),
      },
      {
        id: 'stride',
        header: 'STRIDE',
        cell: threat => <StrideBadge>{threat.strideCategory}</StrideBadge>,
      },
      {
        id: 'severity',
        header: 'Severity',
        cell: threat => (
          <SeverityBadge severity={threat.severity} size="small" />
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: threat => <StatusBadge status={threat.status} size="small" />,
      },
      {
        id: 'component',
        header: 'Component',
        cell: threat => threat.component,
      },
      {
        id: 'updated',
        header: 'Updated',
        cell: threat => <ThreatDate>{threat.updatedAt}</ThreatDate>,
      },
    ]}
  />
);

export default ThreatTable;
