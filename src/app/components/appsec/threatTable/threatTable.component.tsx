import React from 'react';

import Badge from '~/app/components/ui/badge';
import Button from '~/app/components/ui/button';
import DataTable from '~/app/components/common/dataTable';
import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';
import { OWASP_TOP_10_CURRENT_VERSION } from '~/domain';

import { getThreatOwaspCategoryLabel } from '../threatOwaspCategory.utils';

import StyledThreatTable from './threatTable.styled';

import type { ThreatTableProps, ThreatTableRow } from './threatTable.type';

const getThreatContext = (threat: ThreatTableRow) =>
  threat.affectedComponent?.trim().length
    ? threat.affectedComponent.trim()
    : threat.applicationName?.trim().length
      ? threat.applicationName.trim()
      : threat.companyName?.trim().length
        ? threat.companyName.trim()
        : threat.affectedEndpoint?.trim().length
          ? threat.affectedEndpoint.trim()
          : '';

const getEndpointValue = (threat: ThreatTableRow) =>
  threat.affectedEndpoint?.trim().length ? threat.affectedEndpoint.trim() : '—';

const ThreatTable = ({
  threats,
  owaspTaxonomyVersion = OWASP_TOP_10_CURRENT_VERSION,
  isLoading = false,
  emptyState,
  onThreatClick,
  onEditThreatClick,
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
          header: 'Title',
          cell: threat => {
            const context = getThreatContext(threat);

            return (
              <div className="threat-table-threat-title-cell">
                <strong className="threat-table-threat-title">
                  {threat.title}
                </strong>

                {context && (
                  <span className="threat-table-threat-context">{context}</span>
                )}
              </div>
            );
          },
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
          id: 'category',
          header: 'OWASP category',
          cell: threat => (
            <Badge
              label={getThreatOwaspCategoryLabel(threat, owaspTaxonomyVersion)}
              variant="neutral"
              size="small"
            />
          ),
        },
        {
          id: 'evidence',
          header: 'Evidence count',
          align: 'center',
          cell: threat => (
            <span className="threat-table-evidence-count">
              {threat.evidenceCount ?? 0}
            </span>
          ),
        },
        {
          id: 'endpoint',
          header: 'Endpoint',
          cell: threat => (
            <span className="threat-table-endpoint">
              {getEndpointValue(threat)}
            </span>
          ),
        },
        {
          id: 'updated',
          header: 'Updated',
          cell: threat => (
            <time className="threat-table-threat-date">{threat.updatedAt}</time>
          ),
        },
        {
          id: 'actions',
          header: 'Actions',
          align: 'right',
          cell: threat => (
            <div className="threat-table-actions">
              {onEditThreatClick && (
                <Button
                  title="Edit threat"
                  size="small"
                  variant="secondary"
                  onClick={event => {
                    event.stopPropagation();
                    onEditThreatClick(threat);
                  }}
                />
              )}
            </div>
          ),
        },
      ]}
    />
  </StyledThreatTable>
);

export default ThreatTable;
