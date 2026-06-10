import type { Meta, StoryObj } from '@storybook/react';

import DataTable from './dataTable.component';

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

const columns = [
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

const meta = {
  title: 'Common/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    columns,
    rows,
    getRowKey: (row: ExampleRow) => row.id,
    caption: 'Example assessments',
  },
};
