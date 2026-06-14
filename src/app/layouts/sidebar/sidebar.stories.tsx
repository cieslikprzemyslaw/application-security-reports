import type { Meta, StoryObj } from '@storybook/react';

import IconSVG from '~/app/components/ui/iconSVG';
import Sidebar from './sidebar.component';
import { routes } from '~/routes';

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
            icon: <IconSVG name="dashboard" />,
            href: routes.dashboard,
            isActive: true,
          },
          {
            id: 'companies',
            label: 'Companies',
            icon: <IconSVG name="company" />,
            href: routes.companies,
          },
          {
            id: 'assessments',
            label: 'Assessments',
            icon: <IconSVG name="assessment" />,
            href: routes.assessments,
          },
          {
            id: 'threats',
            label: 'Threats',
            icon: <IconSVG name="finding" />,
            href: routes.threats,
          },
          {
            id: 'reports',
            label: 'Reports',
            icon: <IconSVG name="report" />,
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
            icon: <IconSVG name="settings" />,
            href: routes.settings,
          },
        ],
      },
    ],
    footer: <small>Local workspace</small>,
  },
};
