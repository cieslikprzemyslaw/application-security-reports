import type { Meta, StoryObj } from '@storybook/react';

import ReportHeader from './reportHeader.component';

const meta = {
  title: 'AppSec/ReportHeader',
  component: ReportHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ReportHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    companyName: 'Northstar Digital',
    companyLogo: <strong>ND</strong>,
    reportTitle: 'Application Security Assessment',
    applicationName: 'Customer Services Portal',
    environment: 'Production',
    assessmentId: 'asm_123',
    dateRange: '12 May 2026 – 28 May 2026',
    testerName: 'Alex Mercer',
  },
};
