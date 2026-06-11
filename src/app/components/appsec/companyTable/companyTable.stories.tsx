import type { Meta, StoryObj } from '@storybook/react';

import CompanyTable from './companyTable.component';

const meta = {
  title: 'AppSec/CompanyTable',
  component: CompanyTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onCompanyClick: {
      action: 'company clicked',
    },
  },
} satisfies Meta<typeof CompanyTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
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
        riskPosture: 'high',
      },
    ],
  },
};
