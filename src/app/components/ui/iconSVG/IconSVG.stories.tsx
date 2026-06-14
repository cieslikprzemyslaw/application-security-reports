import type { Meta, StoryObj } from '@storybook/react';

import IconSVG from './IconSVG';

const meta = {
  title: 'Components/IconSVG',
  component: IconSVG,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: {
        type: 'select',
      },
      options: [
        'dashboard',
        'company',
        'assessment',
        'finding',
        'report',
        'settings',
      ],
    },
    size: {
      control: {
        type: 'select',
      },
      options: ['small', 'medium', 'large'],
    },
  },
} satisfies Meta<typeof IconSVG>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Decorative: Story = {
  args: {
    name: 'dashboard',
    size: 'large',
  },
  render: args => (
    <button
      type="button"
      style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}
    >
      <IconSVG {...args} />
      Dashboard
    </button>
  ),
};

export const Labelled: Story = {
  args: {
    name: 'settings',
    label: 'Workspace settings',
    size: 'large',
  },
};
