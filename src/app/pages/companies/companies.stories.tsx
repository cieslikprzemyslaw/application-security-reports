import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import PageContent from '~/app/layouts/pageContent';

import Companies from './companies.component';

const meta = {
  title: 'Pages/Companies',
  component: Companies,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <PageContent maxWidth="wide">
        <Story />
      </PageContent>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof Companies>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: args => {
    const [searchValue, setSearchValue] = useState('');

    return (
      <Companies
        {...args}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
    );
  },
  args: {
    searchValue: '',
    onSearchChange: () => undefined,
    companies: [
      {
        id: 'cmp_1',
        name: 'Northstar Digital',
        logo: <strong>ND</strong>,
        contactEmail: 'security@northstar.example',
        website: 'https://northstar.example',
        assessmentCount: 6,
        updatedAt: '28 May 2026',
      },
      {
        id: 'cmp_2',
        name: 'Meridian Finance',
        logo: <strong>MF</strong>,
        contactEmail: 'appsec@meridian.example',
        website: 'https://meridian.example',
        assessmentCount: 4,
        updatedAt: '24 May 2026',
      },
    ],
  },
};
