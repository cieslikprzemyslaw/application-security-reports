import type { Meta, StoryObj } from '@storybook/react';

import Topbar from './topbar.component';
import TopbarUserIdentity from './topbarUserIdentity.component';

const meta = {
  title: 'Layouts/Topbar',
  component: Topbar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Topbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'AppSec Report Builder',
    onMenuClick: () => undefined,
    menuButtonControls: 'app-layout-sidebar',
    menuButtonExpanded: false,
    search: <input aria-label="Search" placeholder="Search..." />,
    actions: <button type="button">New assessment</button>,
    userMenu: (
      <TopbarUserIdentity fullName="Alex Mercer" role="Lead Pentester" />
    ),
  },
};
