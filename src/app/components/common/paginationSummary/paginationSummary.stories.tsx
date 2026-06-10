import type { Meta, StoryObj } from '@storybook/react';

import PaginationSummary from './paginationSummary.component';

const meta = {
  title: 'Common/PaginationSummary',
  component: PaginationSummary,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PaginationSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentPage: 2,
    pageSize: 10,
    totalItems: 86,
    itemLabel: 'threats',
  },
};
