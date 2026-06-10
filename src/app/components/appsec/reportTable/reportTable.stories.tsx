import type { Meta, StoryObj } from '@storybook/react';

import ReportTable from './reportTable.component';

const meta = {
  title: 'AppSec/ReportTable',
  component: ReportTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onReportClick: {
      action: 'report clicked',
    },
  },
} satisfies Meta<typeof ReportTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    reports: [
      {
        id: 'rpt_1',
        companyName: 'Northstar Digital',
        assessmentName: 'Customer Services Portal',
        reportType: 'Technical',
        status: 'Generated',
        generatedAt: '28 May 2026',
        updatedAt: '28 May 2026',
      },
    ],
  },
};
