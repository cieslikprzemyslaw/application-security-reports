import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import Drawer from './drawer.component';

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <button type="button" onClick={() => setIsOpen(true)}>
          Open drawer
        </button>

        <Drawer
          isOpen={isOpen}
          title="Edit threat"
          description="Update finding details."
          onClose={() => setIsOpen(false)}
          footer={
            <>
              <button type="button" onClick={() => setIsOpen(false)}>
                Cancel
              </button>
              <button type="button">Save threat</button>
            </>
          }
        >
          Threat form content
        </Drawer>
      </>
    );
  },
};
