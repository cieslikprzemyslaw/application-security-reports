import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import PageContent from '~/app/layouts/pageContent';

import Threats from './threats.component';

const meta = {
  title: 'Pages/Threats',
  component: Threats,
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
} satisfies Meta<typeof Threats>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: args => {
    const [searchValue, setSearchValue] = useState('');
    const [selectedSeverity, setSelectedSeverity] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    return (
      <Threats
        {...args}
        searchValue={searchValue}
        selectedSeverity={selectedSeverity}
        selectedStatus={selectedStatus}
        onSearchChange={setSearchValue}
        onSeverityChange={setSelectedSeverity}
        onStatusChange={setSelectedStatus}
      />
    );
  },
  args: {
    searchValue: '',
    selectedSeverity: 'all',
    selectedStatus: 'all',
    onSearchChange: () => undefined,
    onSeverityChange: () => undefined,
    onStatusChange: () => undefined,
    threats: [
      {
        id: 'thr_1',
        title: 'Missing Server-Side Authorization',
        endpoint: '/api/v1/orders/{id}',
        strideCategory: 'Elevation of Privilege',
        severity: 'Critical',
        status: 'Open',
        component: 'Orders API',
        updatedAt: '28 May 2026',
      },
      {
        id: 'thr_2',
        title: 'Verbose Error Messages',
        endpoint: '/api/v1/orders',
        strideCategory: 'Information Disclosure',
        severity: 'Medium',
        status: 'Resolved',
        component: 'Orders API',
        updatedAt: '24 May 2026',
      },
    ],
  },
};
