import type { Meta, StoryObj } from '@storybook/react';

import TableFooter from './tableFooter.component';

const meta = {
  title: 'Common/TableFooter',
  component: TableFooter,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TableFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    summary: 'Showing 1–10 of 86 threats',
    pagination: <div>Pagination</div>,
  },
};
