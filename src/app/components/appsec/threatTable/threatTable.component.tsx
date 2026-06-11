import React from 'react';

import DataTable from '~/app/components/common/dataTable';
import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';
import { STRIDE_LABELS } from '~/domain';

import StyledThreatTable from './threatTable.styled';

import type { ThreatTableProps, ThreatTableRow } from './threatTable.type';

const ThreatTable = ({
  threats,
  isLoading = false,
  emptyState,
  onThreatClick,
}: ThreatTableProps) => (
  <StyledThreatTable>
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
            <div className="threat-table-threat-title-cell">
              <strong className="threat-table-threat-title">
                {threat.title}
              </strong>

              {threat.endpoint && (
                <span className="threat-table-threat-endpoint">
                  {threat.id} · {threat.endpoint}
                </span>
              )}
            </div>
          ),
        },
        {
          id: 'stride',
          header: 'STRIDE',
          cell: threat => (
            <span className="threat-table-stride-badge">
              {STRIDE_LABELS[threat.strideCategory]}
            </span>
          ),
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
          cell: threat => (
            <time className="threat-table-threat-date">{threat.updatedAt}</time>
          ),
        },
      ]}
    />
  </StyledThreatTable>
);

export default ThreatTable;
