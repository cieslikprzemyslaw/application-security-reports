import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import {
  OWASP_TOP_10_CURRENT_VERSION,
  getOwaspTop10CategoryOption,
} from '~/domain';

import ThreatForm from './threatForm.component';

import type { ThreatFormValue } from './threatForm.type';

const owaspCategoryValue = (code: string) =>
  getOwaspTop10CategoryOption(code)?.value ?? `${code}:2025`;

const initialValue: ThreatFormValue = {
  title: 'Missing Server-Side Authorization',
  owaspCategoryCode: owaspCategoryValue('A01'),
  customCategory: '',
  strideCategory: 'elevation-of-privilege',
  severity: 'critical',
  status: 'open',
  affectedComponent: 'Orders API',
  affectedEndpoint: '/api/v1/orders/{id}',
  observation:
    'The endpoint returns objects without verifying resource ownership.',
  reproductionSteps:
    'Request another user account while authenticated as a low-privilege user.',
  risk: 'An authenticated user can read another customer’s order details.',
  recommendation: 'Enforce object-level authorization on every request.',
  references: 'OWASP API1:2023, CWE-639',
  resolutionNote: '',
  acceptedRiskJustification: '',
};

const meta = {
  title: 'AppSec/ThreatForm',
  component: ThreatForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThreatForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    value: initialValue,
    owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
    onChange: () => undefined,
    onSubmit: event => event.preventDefault(),
  },
  render: args => {
    const [value, setValue] = useState(initialValue);

    return (
      <ThreatForm
        {...args}
        value={value}
        owaspTaxonomyVersion={OWASP_TOP_10_CURRENT_VERSION}
        onChange={setValue}
        onSubmit={event => {
          event.preventDefault();
        }}
      />
    );
  },
};
