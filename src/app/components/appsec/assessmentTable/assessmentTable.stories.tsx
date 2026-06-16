import type { Meta, StoryObj } from '@storybook/react';

import AssessmentTable from './assessmentTable.component';

const meta = {
  title: 'AppSec/AssessmentTable',
  component: AssessmentTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onEditAssessment: {
      action: 'assessment edited',
    },
  },
} satisfies Meta<typeof AssessmentTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    assessments: [
      {
        id: 'asm_1',
        name: 'Customer Services Portal',
        type: 'Web App',
        status: 'in-progress',
        findingsCount: 5,
        updatedAt: '2026-06-14T10:15:00.000Z',
      },
    ],
    sortBy: 'updated',
    sortDirection: 'desc',
    onSortChange: () => undefined,
  },
};
