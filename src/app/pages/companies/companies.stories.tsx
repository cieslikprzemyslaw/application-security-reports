import React, { useLayoutEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import PageContent from '~/app/layouts/pageContent';

import Companies from './companies.component';

const originalFetch = globalThis.fetch;

const setFetch = (value: typeof fetch) => {
  Object.defineProperty(globalThis, 'fetch', {
    value,
    configurable: true,
    writable: true,
  });
};

const MockCompanies = () => {
  const [activeCompany, setActiveCompany] = useState<
    { id: string; name: string } | undefined
  >();

  useLayoutEffect(() => {
    setFetch(
      async () =>
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'cmp_1',
                name: 'Northwind Labs',
                website: 'https://northwind.example',
                contactEmail: 'security@northwind.example',
                assessmentCount: 2,
                createdAt: '2026-06-01T00:00:00.000Z',
                updatedAt: '2026-06-10T00:00:00.000Z',
              },
            ],
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
    );

    return () => {
      setFetch(originalFetch);
    };
  }, []);

  return (
    <Companies
      activeCompany={activeCompany}
      onActiveCompanyChange={setActiveCompany}
    />
  );
};

const meta = {
  title: 'Pages/Companies',
  component: MockCompanies,
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
} satisfies Meta<typeof MockCompanies>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
