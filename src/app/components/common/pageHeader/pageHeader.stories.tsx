import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import IconSVG from '~/app/components/ui/iconSVG';

import PageHeader from './pageHeader.component';

const noop = () => undefined;

const meta = {
  title: 'Common/PageHeader',
  component: PageHeader,
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    eyebrow: 'Company workspace',
    title: 'Assessments',
    subtitle: 'Manage assessments for Northwind Security.',
    context: [
      { label: 'Companies', href: '/companies' },
      { label: 'Northwind Security', href: '/companies/cmp_1/overview' },
      { label: 'Assessments' },
    ],
    primaryAction: {
      id: 'new-assessment',
      label: 'New assessment',
      icon: <IconSVG name="add" />,
      onActivate: noop,
    },
    secondaryActions: [
      {
        id: 'export',
        label: 'Export',
        icon: <IconSVG name="download" />,
        onActivate: noop,
      },
    ],
  },
};

export const CrowdedAndDestructive: Story = {
  args: {
    eyebrow: 'Assessment workspace',
    title: 'Customer Portal',
    subtitle: 'Northwind Security',
    context: [
      { label: 'Companies', href: '/companies' },
      { label: 'Northwind Security', href: '/companies/cmp_1/overview' },
      { label: 'Assessments', href: '/companies/cmp_1/assessments' },
      { label: 'Customer Portal' },
    ],
    primaryAction: { id: 'complete', label: 'Complete', onActivate: noop },
    secondaryActions: [
      { id: 'back', label: 'Back to assessments', onActivate: noop },
      { id: 'archive', label: 'Archive', onActivate: noop },
    ],
    overflowActions: [
      { id: 'duplicate', label: 'Duplicate', onActivate: noop },
    ],
    destructiveAction: {
      id: 'delete',
      label: 'Permanent delete',
      onActivate: noop,
    },
  },
};
