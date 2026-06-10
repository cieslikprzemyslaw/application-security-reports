import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import Drawer from './drawer.component';
import type { DrawerProps } from './drawer.type';

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
  args: {
    isOpen: false,
    title: 'Edit threat',
    description: 'Update finding details.',
    children: 'Threat form content',
    onClose: () => undefined,
  } satisfies Partial<DrawerProps>,
  render: args => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <button type="button" onClick={() => setIsOpen(true)}>
          Open drawer
        </button>

        <Drawer
          {...args}
          isOpen={isOpen}
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
