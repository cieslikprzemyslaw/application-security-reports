import type { Meta, StoryObj } from '@storybook/react';

import ThreatDetails from './threatDetails.component';

const meta = {
  title: 'AppSec/ThreatDetails',
  component: ThreatDetails,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThreatDetails>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Missing Server-Side Authorization',
    threatId: 'thr_123',
    severity: 'Critical',
    status: 'Open',
    strideCategory: 'Elevation of Privilege',
    affectedComponent: 'Orders API',
    affectedEndpoint: '/api/v1/orders/{id}',
    observation:
      'The endpoint returns objects without verifying resource ownership.',
    risk: 'An authenticated attacker can access another customer’s order details.',
    recommendation: 'Enforce object-level authorization on every request.',
    references: 'OWASP API1:2023, CWE-639',
  },
};
