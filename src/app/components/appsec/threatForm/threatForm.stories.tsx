import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import ThreatForm from './threatForm.component';

import type { ThreatFormValue } from './threatForm.type';

const initialValue: ThreatFormValue = {
  title: 'Missing Server-Side Authorization',
  strideCategory: 'Elevation of Privilege',
  severity: 'Critical',
  status: 'Open',
  affectedComponent: 'Orders API',
  affectedEndpoint: '/api/v1/orders/{id}',
  observation:
    'The endpoint returns objects without verifying resource ownership.',
  risk: 'An authenticated user can read another customer’s order details.',
  recommendation: 'Enforce object-level authorization on every request.',
  references: 'OWASP API1:2023, CWE-639',
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
    onChange: () => undefined,
    onSubmit: event => event.preventDefault(),
  },
  render: args => {
    const [value, setValue] = useState(initialValue);

    return (
      <ThreatForm
        {...args}
        value={value}
        onChange={setValue}
        onSubmit={event => {
          event.preventDefault();
        }}
      />
    );
  },
};
