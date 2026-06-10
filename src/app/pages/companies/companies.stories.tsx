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
        initials: 'ND',
        applicationCount: 4,
        website: 'https://northstar.example',
        primaryContact: 'security@northstar.example',
        assessmentCount: 6,
        openThreats: 2,
        riskPosture: 'High',
      },
      {
        id: 'cmp_2',
        name: 'Meridian Finance',
        initials: 'MF',
        applicationCount: 2,
        website: 'https://meridian.example',
        primaryContact: 'appsec@meridian.example',
        assessmentCount: 4,
        openThreats: 1,
        riskPosture: 'Medium',
      },
    ],
  },
};
