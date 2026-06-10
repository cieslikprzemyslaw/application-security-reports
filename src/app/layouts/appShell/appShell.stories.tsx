import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import AppShell from './appShell.component';

const meta = {
  title: 'Layouts/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sidebar: <div>Sidebar</div>,
    topbar: (
      <div>
        <button type="button">Open menu</button>
      </div>
    ),
    children: <div>Page content</div>,
    isSidebarOpen: false,
    onSidebarClose: () => undefined,
  },
  render: () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
      <AppShell
        isSidebarOpen={isSidebarOpen}
        onSidebarClose={() => setIsSidebarOpen(false)}
        sidebar={
          <div
            style={{
              minHeight: '100vh',
              padding: '1rem',
              background: '#101828',
              color: '#fff',
            }}
          >
            Sidebar
          </div>
        }
        topbar={
          <div
            style={{
              minHeight: '4rem',
              padding: '1rem',
              background: '#fff',
              borderBottom: '1px solid #eaecf0',
            }}
          >
            <button type="button" onClick={() => setIsSidebarOpen(true)}>
              Open menu
            </button>
          </div>
        }
      >
        <div
          style={{
            minHeight: '40rem',
            padding: '2rem',
          }}
        >
          Page content
        </div>
      </AppShell>
    );
  },
};
