import React, { useLayoutEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import PageContent from '~/app/layouts/pageContent';

import Assessments from './assessments.component';

const originalFetch = globalThis.fetch;

const setFetch = (value: typeof fetch) => {
  Object.defineProperty(globalThis, 'fetch', {
    value,
    configurable: true,
    writable: true,
  });
};

const MockAssessments = () => {
  useLayoutEffect(() => {
    setFetch(
      async () =>
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'asm_1',
                name: 'Customer Services Portal',
                type: 'Web App',
                status: 'in-progress',
                findingsCount: 14,
                updatedAt: '2026-06-14T10:15:00.000Z',
                description: 'Public customer portal assessment.',
                scope: 'Frontend application and supporting APIs.',
              },
              {
                id: 'asm_2',
                name: 'Platform API Review',
                type: 'API',
                status: 'draft',
                findingsCount: 0,
                updatedAt: '2026-06-12T10:15:00.000Z',
                description: 'Initial triage for the partner API.',
                scope: 'REST endpoints and auth flows.',
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

  return <Assessments companyId="cmp_1" companyName="Northstar Digital" />;
};

const meta = {
  title: 'Pages/Assessments',
  component: MockAssessments,
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
} satisfies Meta<typeof MockAssessments>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
