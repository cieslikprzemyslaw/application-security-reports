import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import PageContent from '~/app/layouts/pageContent';

import Settings from './settings.component';

import type { SettingsValue } from './settings.type';

const initialValue: SettingsValue = {
  fullName: 'Alex Mercer',
  role: 'Lead Pentester',
  email: 'alex.mercer@appsec.io',
  companyName: 'Northstar Digital',
  website: 'www.northstardigital.io',
  contactEmail: 'security@northstardigital.io',
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
  render: () => {
    const [value, setValue] = useState(initialValue);

    return (
      <Settings
        value={value}
        onChange={setValue}
        onSubmit={event => event.preventDefault()}
      />
    );
  },
};
