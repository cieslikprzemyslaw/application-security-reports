import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import SearchInput from './searchInput.component';

const meta = {
  title: 'Components/SearchInput',
  component: SearchInput,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div style={{ width: '22rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof SearchInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('');

    return (
      <SearchInput
        value={value}
        placeholder="Search threats..."
        onChange={event => setValue(event.target.value)}
        onClear={() => setValue('')}
      />
    );
  },
};
