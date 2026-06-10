import type { Meta, StoryObj } from '@storybook/react';

import ReportActions from './reportActions.component';

const meta = {
  title: 'AppSec/ReportActions',
  component: ReportActions,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onPreview: {
      action: 'preview',
    },
    onPrint: {
      action: 'print',
    },
    onDownloadPdf: {
      action: 'download pdf',
    },
    onDownloadMarkdown: {
      action: 'download markdown',
    },
  },
} satisfies Meta<typeof ReportActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
