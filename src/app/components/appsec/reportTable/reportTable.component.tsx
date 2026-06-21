import React from 'react';

import DataTable from '~/app/components/common/dataTable';
import Badge from '~/app/components/ui/badge';
import { formatDateTime } from '~/app/utils/formatters';

import StyledReportTable from './reportTable.styled';

import type { ReportTableProps, ReportTableRow } from './reportTable.type';

const ReportTable = ({
  reports,
  isLoading = false,
  emptyState,
  onReportClick,
}: ReportTableProps) => (
  <StyledReportTable>
    <DataTable<ReportTableRow>
      caption="Reports"
      rows={reports}
      isLoading={isLoading}
      emptyState={emptyState}
      getRowKey={report => report.id}
      onRowClick={onReportClick}
      columns={[
        {
          id: 'report',
          header: 'Report',
          cell: report => (
            <div className="report-table-report-name-cell">
              <strong className="report-table-report-name">
                {report.assessmentName}
              </strong>

              <span className="report-table-report-company">
                {report.companyName}
              </span>
            </div>
          ),
        },
        {
          id: 'type',
          header: 'Type',
          cell: report => report.reportType,
        },
        {
          id: 'status',
          header: 'Status',
          cell: report => (
            <Badge
              label={report.status}
              variant={report.status === 'Generated' ? 'success' : 'brand'}
              size="small"
              showDot
            />
          ),
        },
        {
          id: 'generated',
          header: 'Generated',
          cell: report => (
            <time
              className="report-table-report-date"
              dateTime={report.generatedAt}
            >
              {formatDateTime(report.generatedAt)}
            </time>
          ),
        },
        {
          id: 'updated',
          header: 'Updated',
          cell: report => (
            <time
              className="report-table-report-date"
              dateTime={report.updatedAt}
            >
              {formatDateTime(report.updatedAt)}
            </time>
          ),
        },
      ]}
    />
  </StyledReportTable>
);

export default ReportTable;
