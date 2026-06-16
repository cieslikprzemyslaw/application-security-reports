import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import PageContent from '~/app/layouts/pageContent';

import Settings from './settings.component';

import type { SettingsValue } from './settings.type';

const initialValue: SettingsValue = {
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex.mercer@appsec.io',
  defaultReportTitle: 'Northstar Digital Security Assessment',
  defaultSeverity: 'high',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText:
    '© 2026 Northstar Digital. Confidential — do not distribute.',
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  confidentialReports: true,
};

const meta = {
  title: 'Pages/Settings',
  component: Settings,
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
} satisfies Meta<typeof Settings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: initialValue,
    previewTheme: 'light',
    onChange: () => undefined,
    onSubmit: event => event.preventDefault(),
  },
  render: () => {
    const [value, setValue] = useState(initialValue);

    return (
      <Settings
        value={value}
        previewTheme={value.theme === 'dark' ? 'dark' : 'light'}
        onChange={setValue}
        onSubmit={event => event.preventDefault()}
      />
    );
  },
};
