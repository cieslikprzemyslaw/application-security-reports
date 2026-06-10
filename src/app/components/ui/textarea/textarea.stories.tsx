import type { Meta, StoryObj } from '@storybook/react';

import Textarea from './textarea.component';

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div style={{ width: '28rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    resize: {
      control: {
        type: 'select',
      },
      options: ['none', 'vertical', 'both'],
    },
    disabled: {
      control: {
        type: 'boolean',
      },
    },
    required: {
      control: {
        type: 'boolean',
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Observation',
    placeholder: 'Describe what was observed during testing.',
    description: 'Include only confirmed behaviour.',
    resize: 'vertical',
    required: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Recommendation',
    error: 'A recommendation is required.',
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Risk',
    value: 'This field is currently locked.',
    disabled: true,
  },
};
