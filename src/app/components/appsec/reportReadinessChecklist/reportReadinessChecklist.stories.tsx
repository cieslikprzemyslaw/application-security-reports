import type { Meta, StoryObj } from '@storybook/react';

import ReportReadinessChecklist from './reportReadinessChecklist.component';

const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';

const errors = [
  {
    code: 'REPORT_TITLE_REQUIRED' as const,
    message: 'Add a report title before finalising.',
    target: {
      resourceType: 'report' as const,
      resourceId: reportId,
      field: 'title',
    },
  },
  {
    code: 'THREAT_RECOMMENDATION_REQUIRED' as const,
    message: 'Add a recommendation for SQL injection.',
    target: {
      resourceType: 'threat' as const,
      resourceId: threatId,
      field: 'recommendation',
    },
  },
];

const warnings = [
  {
    code: 'THREAT_EVIDENCE_MISSING' as const,
    message: 'SQL injection has no selected evidence.',
    target: {
      resourceType: 'threat' as const,
      resourceId: threatId,
    },
  },
];

const meta = {
  title: 'AppSec/ReportReadinessChecklist',
  component: ReportReadinessChecklist,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onTargetActivate: {
      action: 'target activated',
    },
  },
} satisfies Meta<typeof ReportReadinessChecklist>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Mixed: Story = {
  args: {
    result: { errors, warnings },
  },
};

export const ErrorsOnly: Story = {
  args: {
    result: { errors, warnings: [] },
  },
};

export const WarningsOnly: Story = {
  args: {
    result: { errors: [], warnings },
  },
};

export const Empty: Story = {
  args: {
    result: { errors: [], warnings: [] },
  },
};
