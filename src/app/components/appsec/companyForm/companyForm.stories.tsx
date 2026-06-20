import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import CompanyForm from './companyForm.component';
import type { CompanyFormValue } from './companyForm.type';

const emptyValue: CompanyFormValue = {
  name: '',
  description: '',
  website: '',
  contactName: '',
  contactEmail: '',
  footerText: '',
};

const meta = {
  title: 'AppSec/CompanyForm',
  component: CompanyForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CompanyForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: emptyValue,
    onChange: () => undefined,
    onSubmit: event => event.preventDefault(),
    onCancel: () => undefined,
  },
  render: args => {
    const [value, setValue] = useState(args.value);

    return (
      <CompanyForm
        {...args}
        value={value}
        onChange={setValue}
        onSubmit={event => event.preventDefault()}
        onCancel={() => undefined}
      />
    );
  },
};

export const WithErrors: Story = {
  args: {
    value: emptyValue,
    onChange: () => undefined,
    onSubmit: event => event.preventDefault(),
    onCancel: () => undefined,
  },
  render: args => (
    <CompanyForm
      {...args}
      value={emptyValue}
      errors={{
        name: 'Text is required',
        website: 'Invalid url',
      }}
      errorMessage="Please fix the highlighted fields and try again."
      onChange={() => undefined}
      onSubmit={event => event.preventDefault()}
      onCancel={() => undefined}
    />
  ),
};
