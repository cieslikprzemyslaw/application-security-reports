import React from 'react';

import { CollectionRowAction } from '~/app/components/common';
import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';
import { STRIDE_LABELS } from '~/domain';

import StyledGlobalThreatTable from './globalThreatTable.styled';

import type { GlobalThreatTableProps } from './globalThreatTable.type';

const GlobalThreatTable = ({
  threats,
  onThreatClick,
  emptyState,
}: GlobalThreatTableProps) => (
  <StyledGlobalThreatTable>
    <table className="global-threat-table">
      <thead className="global-threat-table-head">
        <tr>
          <th className="global-threat-table-header-cell">Threat</th>

          <th className="global-threat-table-header-cell">Application</th>

          <th className="global-threat-table-header-cell">STRIDE</th>

          <th className="global-threat-table-header-cell">Severity</th>

          <th className="global-threat-table-header-cell">Status</th>

          <th className="global-threat-table-header-cell">Updated</th>

          <th className="global-threat-table-header-cell" aria-label="Open" />
        </tr>
      </thead>

      <tbody>
        {threats.length === 0 ? (
          <tr>
            <td className="global-threat-table-empty-cell" colSpan={7}>
              {emptyState ?? 'No threats found.'}
            </td>
          </tr>
        ) : (
          threats.map(threat => (
            <tr
              key={threat.id}
              className={[
                'global-threat-table-row',
                onThreatClick ? 'global-threat-table-row--interactive' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <td className="global-threat-table-cell">
                {onThreatClick && (
                  <CollectionRowAction
                    label={`Open ${threat.title} threat`}
                    onActivate={() => onThreatClick(threat)}
                  >
                    {threat.title}
                  </CollectionRowAction>
                )}

                <strong className="global-threat-table-threat-title">
                  {threat.title}
                </strong>

                <span className="global-threat-table-threat-id">
                  {threat.id}
                </span>
              </td>

              <td className="global-threat-table-cell">
                <strong className="global-threat-table-app-name">
                  {threat.applicationName}
                </strong>

                <span className="global-threat-table-company-name">
                  {threat.companyName}
                </span>
              </td>

              <td className="global-threat-table-cell">
                <span className="global-threat-table-stride">
                  {STRIDE_LABELS[threat.strideCategory]}
                </span>
              </td>

              <td className="global-threat-table-cell">
                <SeverityBadge severity={threat.severity} size="small" />
              </td>

              <td className="global-threat-table-cell">
                <StatusBadge status={threat.status} size="small" />
              </td>

              <td className="global-threat-table-cell">{threat.updatedAt}</td>

              <td className="global-threat-table-cell">
                <span
                  className="global-threat-table-chevron"
                  aria-hidden="true"
                >
                  ›
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </StyledGlobalThreatTable>
);

export default GlobalThreatTable;
