import type { Meta, StoryObj } from '@storybook/react';

import IconSVG from '~/app/components/ui/iconSVG';

import PageActionGroup from './pageActionGroup.component';

const noop = () => undefined;

const meta = {
  title: 'Common/PageActionGroup',
  component: PageActionGroup,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof PageActionGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    primaryAction: {
      id: 'create',
      label: 'Create assessment',
      icon: <IconSVG name="add" />,
      onActivate: noop,
    },
    secondaryActions: [
      {
        id: 'edit',
        label: 'Edit',
        icon: <IconSVG name="edit" />,
        onActivate: noop,
      },
    ],
  },
};

export const Crowded: Story = {
  args: {
    primaryAction: {
      id: 'save',
      label: 'Save changes',
      onActivate: noop,
    },
    secondaryActions: [
      { id: 'preview', label: 'Preview', onActivate: noop },
      { id: 'export', label: 'Export', onActivate: noop },
    ],
    overflowActions: [
      { id: 'duplicate', label: 'Duplicate', onActivate: noop },
      { id: 'archive', label: 'Archive', onActivate: noop },
    ],
    destructiveAction: {
      id: 'delete',
      label: 'Delete',
      onActivate: noop,
    },
  },
};

export const PendingAndDisabled: Story = {
  args: {
    primaryAction: {
      id: 'saving',
      label: 'Save changes',
      isLoading: true,
      onActivate: noop,
    },
    secondaryActions: [
      {
        id: 'publish',
        label: 'Publish',
        disabled: true,
        disabledReason: 'Resolve the readiness checks before publishing.',
        onActivate: noop,
      },
    ],
  },
};

export const Mobile: Story = {
  args: Crowded.args,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
