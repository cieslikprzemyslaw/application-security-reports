import type { Meta, StoryObj } from '@storybook/react';

import ReportActions from './reportActions.component';

import type { ReportActionConfig } from './reportActions.type';

const availableAction = (): ReportActionConfig => ({
  onActivate: () => undefined,
});

const meta = {
  title: 'AppSec/ReportActions',
  component: ReportActions,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    primaryAction: {
      control: 'select',
      options: [
        'backToEditor',
        'generatePreview',
        'saveDraft',
        'saveAsFinal',
        'generatePdf',
      ],
    },
  },
} satisfies Meta<typeof ReportActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unsaved: Story = {
  args: {
    backToEditor: availableAction(),
    generatePreview: availableAction(),
    saveDraft: {
      ...availableAction(),
      isDisabled: true,
      disabledReason: 'Create the report before saving a draft.',
    },
    saveAsFinal: {
      ...availableAction(),
      isDisabled: true,
      disabledReason: 'Create and review the report before finalising it.',
    },
    generatePdf: {
      ...availableAction(),
      isDisabled: true,
      disabledReason: 'Save a report version before generating a PDF.',
    },
    primaryAction: 'generatePreview',
  },
};

export const Draft: Story = {
  args: {
    backToEditor: availableAction(),
    generatePreview: availableAction(),
    saveDraft: availableAction(),
    saveAsFinal: availableAction(),
    generatePdf: availableAction(),
    primaryAction: 'saveDraft',
  },
};

export const FinalReady: Story = {
  args: {
    backToEditor: availableAction(),
    generatePreview: availableAction(),
    saveDraft: availableAction(),
    saveAsFinal: availableAction(),
    generatePdf: availableAction(),
    primaryAction: 'saveAsFinal',
  },
};

export const Blocked: Story = {
  args: {
    backToEditor: availableAction(),
    generatePreview: availableAction(),
    saveDraft: availableAction(),
    saveAsFinal: {
      ...availableAction(),
      isDisabled: true,
      disabledReason:
        'Resolve the blocking readiness issues before finalising.',
    },
    generatePdf: availableAction(),
    primaryAction: 'saveDraft',
  },
};

export const Pending: Story = {
  args: {
    backToEditor: availableAction(),
    generatePreview: availableAction(),
    saveDraft: {
      ...availableAction(),
      isPending: true,
    },
    saveAsFinal: availableAction(),
    generatePdf: availableAction(),
    primaryAction: 'saveDraft',
  },
};

export const Mobile: Story = {
  args: {
    backToEditor: availableAction(),
    generatePreview: availableAction(),
    saveDraft: availableAction(),
    saveAsFinal: availableAction(),
    generatePdf: availableAction(),
    primaryAction: 'generatePreview',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
