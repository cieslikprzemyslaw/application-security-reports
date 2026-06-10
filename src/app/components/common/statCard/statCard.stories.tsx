import type { Meta, StoryObj } from '@storybook/react';

import StatCard from './statCard.component';

const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path
      d="M9 4h6v2H9zM7 5H5v16h14V5h-2"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const meta = {
  title: 'Common/StatCard',
  component: StatCard,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div style={{ width: '18rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    iconTone: {
      control: {
        type: 'select',
      },
      options: [
        'brand',
        'critical',
        'high',
        'medium',
        'low',
        'informational',
        'purple',
        'neutral',
      ],
    },
    trendDirection: {
      control: {
        type: 'select',
      },
      options: ['up', 'down', 'equal'],
    },
    trendTone: {
      control: {
        type: 'select',
      },
      options: ['positive', 'negative', 'neutral'],
    },
  },
} satisfies Meta<typeof StatCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Open threats',
    value: 86,
    icon: <ClipboardIcon />,
    iconTone: 'medium',
    trendDirection: 'down',
    trendTone: 'positive',
    trendValue: '9',
    helperText: 'vs last month',
  },
};

export const UpPositive: Story = {
  args: {
    label: 'Completed assessments',
    value: 24,
    icon: <ClipboardIcon />,
    iconTone: 'brand',
    trendDirection: 'up',
    trendTone: 'positive',
    trendValue: '4',
    helperText: 'new this quarter',
  },
};

export const UpNegative: Story = {
  args: {
    label: 'Critical findings',
    value: 12,
    icon: <ClipboardIcon />,
    iconTone: 'critical',
    trendDirection: 'up',
    trendTone: 'negative',
    trendValue: '3',
    helperText: 'this week',
  },
};

export const DownPositive: Story = {
  args: {
    label: 'Open threats',
    value: 86,
    icon: <ClipboardIcon />,
    iconTone: 'high',
    trendDirection: 'down',
    trendTone: 'positive',
    trendValue: '9',
    helperText: 'vs last month',
  },
};

export const Equal: Story = {
  args: {
    label: 'Retest required',
    value: 4,
    icon: <ClipboardIcon />,
    iconTone: 'purple',
    trendDirection: 'equal',
    trendTone: 'neutral',
    trendValue: '0',
    helperText: 'no change',
  },
};
