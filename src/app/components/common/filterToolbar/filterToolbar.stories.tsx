import type { Meta, StoryObj } from '@storybook/react';

import FilterToolbar from './filterToolbar.component';

const meta = {
  title: 'Common/FilterToolbar',
  component: FilterToolbar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FilterToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    search: <input aria-label="Search threats" placeholder="Search threats" />,
    filters: (
      <>
        <select aria-label="Severity">
          <option>All severities</option>
        </select>

        <select aria-label="Status">
          <option>All statuses</option>
        </select>
      </>
    ),
    summary: '14 threats',
    actions: <button type="button">Clear filters</button>,
  },
};
