import type { Meta, StoryObj } from '@storybook/react';

import Button from './button.component';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: {
        type: 'text',
      },
      description: 'Button text.',
    },
    variant: {
      control: {
        type: 'select',
      },
      options: ['primary', 'secondary', 'tertiary', 'destructive'],
    },
    size: {
      control: {
        type: 'select',
      },
      options: ['small', 'medium', 'large'],
    },
    iconPosition: {
      control: {
        type: 'select',
      },
      options: ['left', 'right'],
    },
    isLoading: {
      control: {
        type: 'boolean',
      },
    },
    isSelected: {
      control: {
        type: 'boolean',
      },
    },
    fullWidth: {
      control: {
        type: 'boolean',
      },
    },
    disabled: {
      control: {
        type: 'boolean',
      },
    },
    onClick: {
      action: 'clicked',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    title: 'Create assessment',
    variant: 'primary',
    size: 'medium',
    iconPosition: 'left',
    isLoading: false,
    isSelected: false,
    fullWidth: false,
    disabled: false,
  },
};

export const Primary: Story = {
  args: {
    title: 'Save changes',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    title: 'Cancel',
    variant: 'secondary',
  },
};

export const Tertiary: Story = {
  args: {
    title: 'View details',
    variant: 'tertiary',
  },
};

export const Destructive: Story = {
  args: {
    title: 'Delete threat',
    variant: 'destructive',
  },
};

export const Loading: Story = {
  args: {
    title: 'Saving',
    variant: 'primary',
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    title: 'Unavailable',
    variant: 'primary',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    title: 'Continue',
    variant: 'primary',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};
