import type { Meta, StoryObj } from '@storybook/react';

import Input from './input.component';

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div style={{ width: '22rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    inputSize: {
      control: {
        type: 'select',
      },
      options: ['small', 'medium', 'large'],
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
    hideLabel: {
      control: {
        type: 'boolean',
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Threat title',
    placeholder: 'Enter a threat title',
    description: 'Use a concise and specific title.',
    inputSize: 'medium',
    disabled: false,
    required: true,
  },
};

export const WithError: Story = {
  args: {
    label: 'Threat title',
    value: '',
    error: 'A threat title is required.',
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Assessment ID',
    value: 'asm_7b164497-3d58-47e1-bc81-649265c76910',
    disabled: true,
  },
};
