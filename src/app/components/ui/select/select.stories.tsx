import type { Meta, StoryObj } from '@storybook/react';

import Select from './select.component';

const options = [
  {
    label: 'Critical',
    value: 'critical',
  },
  {
    label: 'High',
    value: 'high',
  },
  {
    label: 'Medium',
    value: 'medium',
  },
  {
    label: 'Low',
    value: 'low',
  },
];

const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div style={{ width: '22rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Severity',
    options,
    placeholder: 'Choose severity',
    required: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Severity',
    options,
    error: 'Severity is required.',
  },
};
