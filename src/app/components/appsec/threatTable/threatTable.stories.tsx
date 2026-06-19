import type { Meta, StoryObj } from '@storybook/react';

import { OWASP_TOP_10_CURRENT_VERSION, OWASP_TOP_10_REGISTRY } from '~/domain';

import ThreatTable from './threatTable.component';

const owaspTop10Categories =
  OWASP_TOP_10_REGISTRY[OWASP_TOP_10_CURRENT_VERSION].categories;

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
    onEditThreatClick: {
      action: 'threat edited',
    },
  },
} satisfies Meta<typeof ThreatTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onEditThreatClick: () => undefined,
    threats: [
      {
        id: 'thr_1',
        title: 'Missing Server-Side Authorization',
        owaspCategoryCode: owaspTop10Categories.A01.value,
        severity: 'critical',
        status: 'open',
        evidenceCount: 3,
        updatedAt: '28 May 2026',
        affectedComponent: 'Orders API',
      },
      {
        id: 'thr_2',
        title: 'Sensitive Data Returned by API',
        customCategory: 'Data exposure',
        severity: 'high',
        status: 'draft',
        evidenceCount: 1,
        updatedAt: '27 May 2026',
        affectedComponent: 'Customer API',
      },
    ],
  },
};
