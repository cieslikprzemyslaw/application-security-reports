import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import Modal from './modal.component';

const meta = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <button type="button" onClick={() => setIsOpen(true)}>
          Open modal
        </button>

        <Modal
          isOpen={isOpen}
          title="Delete threat"
          description="This action cannot be undone."
          onClose={() => setIsOpen(false)}
          footer={
            <>
              <button type="button" onClick={() => setIsOpen(false)}>
                Cancel
              </button>
              <button type="button">Delete</button>
            </>
          }
        >
          Are you sure you want to delete this threat?
        </Modal>
      </>
    );
  },
};
