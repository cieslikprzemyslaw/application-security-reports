import type { Meta, StoryObj } from '@storybook/react';

import PageHeader from './pageHeader.component';

const meta = {
  title: 'Common/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    eyebrow: 'Workspace',
    title: 'Assessments',
    subtitle: 'Manage application security assessments across all companies.',
    breadcrumbs: [
      {
        label: 'Dashboard',
      },
      {
        label: 'Assessments',
      },
    ],
    actions: <button type="button">New assessment</button>,
  },
};
