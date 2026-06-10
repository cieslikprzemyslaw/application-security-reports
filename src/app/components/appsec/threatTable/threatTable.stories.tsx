import type { Meta, StoryObj } from '@storybook/react';

import ThreatTable from './threatTable.component';

const meta = {
  title: 'AppSec/ThreatTable',
  component: ThreatTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onThreatClick: {
      action: 'threat clicked',
    },
  },
} satisfies Meta<typeof ThreatTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    threats: [
      {
        id: 'thr_1',
        title: 'Missing Server-Side Authorization',
        endpoint: '/api/v1/orders/{id}',
        strideCategory: 'Elevation of Privilege',
        severity: 'Critical',
        status: 'Open',
        component: 'Orders API',
        updatedAt: '28 May 2026',
      },
      {
        id: 'thr_2',
        title: 'Sensitive Data Returned by API',
        endpoint: '/api/v1/customers/{id}',
        strideCategory: 'Information Disclosure',
        severity: 'High',
        status: 'In Progress',
        component: 'Customer API',
        updatedAt: '27 May 2026',
      },
    ],
  },
};
