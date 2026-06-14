import type { Meta, StoryObj } from '@storybook/react';

import Button from '~/app/components/ui/button';

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
    actions: <Button title="New assessment" variant="secondary" />,
    userMenu: (
      <TopbarUserIdentity fullName="Alex Mercer" role="Lead Pentester" />
    ),
  },
};
