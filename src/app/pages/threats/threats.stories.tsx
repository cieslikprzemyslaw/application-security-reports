import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import PageContent from '~/app/layouts/pageContent';

import Threats from './threats.component';
import type { ThreatSeverityFilter, ThreatStatusFilter } from './threats.utils';

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
    const [severityFilter, setSeverityFilter] =
      useState<ThreatSeverityFilter>('all');
    const [statusFilter, setStatusFilter] = useState<ThreatStatusFilter>('all');
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
        owaspCategoryCode: 'A01:2021',
        strideCategory: 'elevation-of-privilege',
        severity: 'critical',
        status: 'open',
        evidenceCount: 3,
        updatedAt: '28 May 2026',
      },
      {
        id: 'thr_2',
        title: 'Verbose Error Messages',
        applicationName: 'Orders API',
        companyName: 'Northstar Digital',
        customCategory: 'Information exposure',
        strideCategory: 'information-disclosure',
        severity: 'medium',
        status: 'mitigated',
        evidenceCount: 1,
        updatedAt: '28 May 2026',
      },
    ],
  },
};
