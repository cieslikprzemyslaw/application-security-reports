import type { Meta, StoryObj } from '@storybook/react';

import Topbar from './topbar.component';

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
    menuButton: (
      <button type="button" aria-label="Open navigation">
        Menu
      </button>
    ),
    search: <input aria-label="Search" placeholder="Search..." />,
    actions: <button type="button">New assessment</button>,
    userMenu: <button type="button">PC</button>,
  },
};
