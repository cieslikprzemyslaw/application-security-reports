import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import WorkspaceContextNavigation from './workspaceContextNavigation.component';

const meta = {
  title: 'Common/WorkspaceContextNavigation',
  component: WorkspaceContextNavigation,
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof WorkspaceContextNavigation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Company: Story = {
  args: {
    items: [
      { label: 'Companies', href: '/companies' },
      { label: 'Northwind Security', href: '/companies/cmp_1/overview' },
      { label: 'Assessments' },
    ],
    documentTitle: 'Assessments for Northwind Security',
  },
};

export const Assessment: Story = {
  args: {
    items: [
      { label: 'Companies', href: '/companies' },
      { label: 'Northwind Security', href: '/companies/cmp_1/overview' },
      { label: 'Assessments', href: '/companies/cmp_1/assessments' },
      { label: 'Customer Portal', href: '/assessments/asm_1/overview' },
      { label: 'Evidence' },
    ],
    documentTitle: 'Evidence - Customer Portal',
  },
};
