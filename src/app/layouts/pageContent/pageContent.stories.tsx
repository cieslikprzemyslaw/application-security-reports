import type { Meta, StoryObj } from '@storybook/react';

import PageContent from './pageContent.component';

const meta = {
  title: 'Layouts/PageContent',
  component: PageContent,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    maxWidth: {
      control: {
        type: 'select',
      },
      options: ['default', 'wide', 'report', 'full'],
    },
    spacing: {
      control: {
        type: 'select',
      },
      options: ['compact', 'default', 'comfortable'],
    },
  },
} satisfies Meta<typeof PageContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    maxWidth: 'wide',
    spacing: 'default',
    children: (
      <div
        style={{
          minHeight: '20rem',
          padding: '1rem',
          background: '#fff',
          border: '1px solid #eaecf0',
        }}
      >
        Page content
      </div>
    ),
  },
};
