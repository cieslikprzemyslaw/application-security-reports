import type { Meta, StoryObj } from '@storybook/react';

import AssessmentStatusChart from './assessmentStatusChart.component';

const meta = {
  title: 'AppSec/AssessmentStatusChart',
  component: AssessmentStatusChart,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div style={{ width: '30rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof AssessmentStatusChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        label: 'Completed',
        count: 11,
        tone: 'completed',
      },
      {
        label: 'In Progress',
        count: 7,
        tone: 'inProgress',
      },
      {
        label: 'In Review',
        count: 4,
        tone: 'inReview',
      },
      {
        label: 'Draft',
        count: 2,
        tone: 'draft',
      },
    ],
  },
};
