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
    const [severityFilter, setSeverityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [applicationFilter, setApplicationFilter] = useState('all');

    return (
      <Threats
        {...args}
        searchValue={searchValue}
        severityFilter={severityFilter}
        statusFilter={statusFilter}
        applicationFilter={applicationFilter}
        onSearchChange={setSearchValue}
        onSeverityFilterChange={setSeverityFilter}
        onStatusFilterChange={setStatusFilter}
        onApplicationFilterChange={setApplicationFilter}
      />
    );
  },
  args: {
    searchValue: '',
    onSearchChange: () => undefined,
    severityFilter: 'all',
    statusFilter: 'all',
    applicationFilter: 'all',
    isDrawerOpen: false,
    onSeverityFilterChange: () => undefined,
    onStatusFilterChange: () => undefined,
    onApplicationFilterChange: () => undefined,
    onThreatClick: () => undefined,
    onDrawerClose: () => undefined,
    threats: [
      {
        id: 'thr_1',
        title: 'Missing Server-Side Authorization',
        applicationName: 'Orders API',
        companyName: 'Northstar Digital',
        strideCategory: 'elevation-of-privilege',
        severity: 'critical',
        status: 'open',
        updatedAt: '28 May 2026',
      },
      {
        id: 'thr_2',
        title: 'Verbose Error Messages',
        applicationName: 'Orders API',
        companyName: 'Northstar Digital',
        strideCategory: 'information-disclosure',
        severity: 'medium',
        status: 'mitigated',
        updatedAt: '28 May 2026',
      },
    ],
  },
};
