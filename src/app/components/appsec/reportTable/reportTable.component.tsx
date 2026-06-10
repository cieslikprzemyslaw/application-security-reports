import React from 'react';

import DataTable from '~/app/components/common/dataTable';
import Badge from '~/app/components/ui/badge';

import {
  ReportCompany,
  ReportDate,
  ReportName,
  ReportNameCell,
} from './reportTable.styled';

import type { ReportTableProps, ReportTableRow } from './reportTable.type';

const ReportTable = ({
  reports,
  isLoading = false,
  emptyState,
  onReportClick,
}: ReportTableProps) => (
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
          <ReportNameCell>
            <ReportName>{report.assessmentName}</ReportName>

            <ReportCompany>{report.companyName}</ReportCompany>
          </ReportNameCell>
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
        cell: report => <ReportDate>{report.generatedAt ?? '—'}</ReportDate>,
      },
      {
        id: 'updated',
        header: 'Updated',
        cell: report => <ReportDate>{report.updatedAt}</ReportDate>,
      },
    ]}
  />
);

export default ReportTable;
