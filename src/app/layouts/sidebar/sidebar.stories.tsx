import type { Meta, StoryObj } from '@storybook/react';

import Sidebar from './sidebar.component';
import { routes } from '~/routes';

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />

    <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />

    <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />

    <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
  </svg>
);

const meta = {
  title: 'Layouts/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <div
        style={{
          width: '16rem',
          minHeight: '100vh',
        }}
      >
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    brand: <strong>AppSec Reports</strong>,
    navigationGroups: [
      {
        id: 'workspace',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <DashboardIcon />,
            href: routes.dashboard,
            isActive: true,
          },
          {
            id: 'companies',
            label: 'Companies',
            href: routes.companies,
          },
          {
            id: 'assessments',
            label: 'Assessments',
            href: routes.assessments,
          },
          {
            id: 'threats',
            label: 'Threats',
            href: routes.threats,
          },
          {
            id: 'reports',
            label: 'Reports',
            href: routes.reports,
          },
        ],
      },
      {
        id: 'system',
        label: 'System',
        items: [
          {
            id: 'settings',
            label: 'Settings',
            href: routes.settings,
          },
        ],
      },
    ],
    footer: <small>Local workspace</small>,
  },
};
