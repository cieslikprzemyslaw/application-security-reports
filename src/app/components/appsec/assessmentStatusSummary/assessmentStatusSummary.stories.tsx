import type { Meta, StoryObj } from '@storybook/react';

import AssessmentStatusSummary from './assessmentStatusSummary.component';

const meta = {
  title: 'AppSec/AssessmentStatusSummary',
  component: AssessmentStatusSummary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AssessmentStatusSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        label: 'Draft',
        count: 4,
        tone: 'neutral',
      },
      {
        label: 'In progress',
        count: 8,
        tone: 'brand',
      },
      {
        label: 'In review',
        count: 3,
        tone: 'warning',
      },
      {
        label: 'Completed',
        count: 12,
        tone: 'success',
      },
    ],
  },
};
