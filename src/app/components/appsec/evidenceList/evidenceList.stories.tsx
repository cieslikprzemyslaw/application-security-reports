import type { Meta, StoryObj } from '@storybook/react';

import EvidenceList from './evidenceList.component';

const meta = {
  title: 'AppSec/EvidenceList',
  component: EvidenceList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onOpen: {
      action: 'opened',
    },
    onRemove: {
      action: 'removed',
    },
  },
} satisfies Meta<typeof EvidenceList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        id: 'evd_1',
        filename: 'missing-authorization-response.png',
        kind: 'image',
        mimeType: 'image/png',
        sizeLabel: '248 KB',
        description: 'Response showing another user’s order data.',
      },
      {
        id: 'evd_2',
        filename: 'orders-api-request.har',
        kind: 'request',
        mimeType: 'application/json',
        sizeLabel: '12 KB',
        description: 'Captured request and response trace.',
      },
    ],
  },
};
