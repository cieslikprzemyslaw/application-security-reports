import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import PageContent from '~/app/layouts/pageContent';

import Assessments from './assessments.component';

const meta = {
  title: 'Pages/Assessments',
  component: Assessments,
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
} satisfies Meta<typeof Assessments>;

export default meta;

type Story = StoryObj<typeof meta>;

const rows = [
  {
    id: 'asm_1',
    code: 'NSD-CSP-2026-014',
    initials: 'CSP',
    logoTone: 'blue' as const,
    applicationName: 'Customer Services Portal',
    companyName: 'Northstar Digital',
    assessmentType: 'Web App',
    environment: 'Production',
    overallRisk: 'high' as const,
    findingsCount: 14,
    criticalCount: 1,
    highCount: 3,
    testerName: 'Alex Mercer',
    status: 'in-progress' as const,
  },
  {
    id: 'asm_2',
    code: 'CB-OBP-2026-013',
    initials: 'OBP',
    logoTone: 'indigo' as const,
    applicationName: 'Online Banking Portal',
    companyName: 'Continental Bank',
    assessmentType: 'Web App',
    environment: 'Production',
    overallRisk: 'critical' as const,
    findingsCount: 17,
    criticalCount: 3,
    highCount: 4,
    testerName: 'Priya Shah',
    status: 'in-progress' as const,
  },
];

export const Default: Story = {
  render: args => {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [risk, setRisk] = useState('all');
    const [type, setType] = useState('all');

    return (
      <Assessments
        {...args}
        searchValue={search}
        statusFilter={status}
        riskFilter={risk}
        typeFilter={type}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatus}
        onRiskFilterChange={setRisk}
        onTypeFilterChange={setType}
      />
    );
  },
  args: {
    assessments: rows,
    searchValue: '',
    statusFilter: 'all',
    riskFilter: 'all',
    typeFilter: 'all',
    onSearchChange: () => undefined,
    onStatusFilterChange: () => undefined,
    onRiskFilterChange: () => undefined,
    onTypeFilterChange: () => undefined,
  },
};
