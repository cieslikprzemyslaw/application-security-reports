import type { Meta, StoryObj } from '@storybook/react';

import PageContent from '~/app/layouts/pageContent';

import Dashboard from './dashboard.component';

const meta = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <PageContent maxWidth="wide" spacing="default">
        <Story />
      </PageContent>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    onCreateCompany: {
      action: 'create company',
    },
    onOpenCompany: {
      action: 'open company',
    },
  },
} satisfies Meta<typeof Dashboard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    companies: [
      {
        id: 'cmp_1',
        name: 'Northstar Digital',
        assessmentCount: 6,
        lastOpenedAt: '2026-06-15T08:15:00.000Z',
        latestAssessment: {
          id: 'asm_1',
          name: 'Customer Services Portal',
          status: 'in-progress',
          updatedAt: '2026-06-15T09:10:00.000Z',
        },
      },
      {
        id: 'cmp_2',
        name: 'Meridian Finance',
        assessmentCount: 4,
        lastOpenedAt: '2026-06-14T16:45:00.000Z',
        latestAssessment: {
          id: 'asm_2',
          name: 'Online Banking Portal',
          status: 'completed',
          updatedAt: '2026-06-14T18:30:00.000Z',
        },
      },
      {
        id: 'cmp_3',
        name: 'Summit Health',
        assessmentCount: 2,
      },
    ],
  },
};

export const EmptyWorkspace: Story = {
  args: {
    companies: [],
  },
};
