import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import Pagination from './pagination.component';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    currentPage: 4,
    totalPages: 12,
    onPageChange: () => undefined,
  },
  render: () => {
    const [currentPage, setCurrentPage] = useState(4);

    return (
      <Pagination
        currentPage={currentPage}
        totalPages={12}
        onPageChange={setCurrentPage}
      />
    );
  },
};
