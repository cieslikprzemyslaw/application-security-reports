import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import Tabs from './tabs.component';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    items: [
      {
        id: 'threats',
        label: 'Threats',
        count: 14,
        content: 'Threats content',
      },
      {
        id: 'overview',
        label: 'Overview',
        content: 'Overview content',
      },
      {
        id: 'activity',
        label: 'Activity',
        count: 6,
        content: 'Activity content',
      },
    ],
    activeTabId: 'threats',
    onChange: () => undefined,
    ariaLabel: 'Assessment sections',
  },
  render: () => {
    const [activeTabId, setActiveTabId] = useState('threats');

    return (
      <Tabs
        ariaLabel="Assessment sections"
        activeTabId={activeTabId}
        onChange={setActiveTabId}
        items={[
          {
            id: 'threats',
            label: 'Threats',
            count: 14,
            content: 'Threats content',
          },
          {
            id: 'overview',
            label: 'Overview',
            content: 'Overview content',
          },
          {
            id: 'activity',
            label: 'Activity',
            count: 6,
            content: 'Activity content',
          },
        ]}
      />
    );
  },
};
