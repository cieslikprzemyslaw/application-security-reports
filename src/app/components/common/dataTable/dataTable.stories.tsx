import type { Meta, StoryObj } from '@storybook/react';

import DataTable from './dataTable.component';
import type { DataTableColumn, DataTableProps } from './dataTable.type';

interface ExampleRow {
  id: string;
  name: string;
  status: string;
}

const rows: ExampleRow[] = [
  {
    id: '1',
    name: 'Customer Services Portal',
    status: 'In Progress',
  },
  {
    id: '2',
    name: 'Payments API',
    status: 'Completed',
  },
];

const columns: DataTableColumn<ExampleRow>[] = [
  {
    id: 'name',
    header: 'Application',
    cell: (row: ExampleRow) => row.name,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row: ExampleRow) => row.status,
  },
];

const ExampleDataTable = (
  props: Omit<
    DataTableProps<ExampleRow>,
    'columns' | 'rows' | 'getRowKey' | 'caption'
  >,
) => (
  <DataTable<ExampleRow>
    columns={columns}
    rows={rows}
    getRowKey={row => row.id}
    caption="Example assessments"
    {...props}
  />
);

const meta = {
  title: 'Common/DataTable',
  component: ExampleDataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ExampleDataTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
