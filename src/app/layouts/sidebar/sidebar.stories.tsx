import type { Meta, StoryObj } from '@storybook/react';

import IconSVG from '~/app/components/ui/iconSVG';
import packageJson from '../../../../package.json';
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
    brand: (
      <div className="sidebar-brand-stack">
        <a
          className="sidebar-company-switcher"
          href={routes.companies}
          aria-label="Open company switcher"
        >
          <span className="sidebar-company-switcher-icon" aria-hidden="true">
            <IconSVG name="company" />
          </span>

          <span className="sidebar-company-switcher-text">
            <span className="sidebar-company-switcher-label">Company</span>
            <span className="sidebar-company-switcher-name">
              Select company
            </span>
          </span>

          <IconSVG name="chevronDown" aria-hidden="true" />
        </a>

        <strong className="sidebar-brand-title">AppSec Reports</strong>
      </div>
    ),
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
    footer: <small>Version {packageJson.version}</small>,
  },
};
