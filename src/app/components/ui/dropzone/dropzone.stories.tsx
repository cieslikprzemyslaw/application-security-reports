import type { Meta, StoryObj } from '@storybook/react';

import Dropzone from './dropzone.component';

const meta = {
  title: 'Components/Dropzone',
  component: Dropzone,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div style={{ width: '30rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    onFilesSelected: {
      action: 'files selected',
    },
  },
} satisfies Meta<typeof Dropzone>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Evidence',
    description: 'PNG, JPG, PDF or HAR up to 10 MB.',
    acceptedTypes: '.png,.jpg,.jpeg,.pdf,.har',
    multiple: true,
    onFilesSelected: () => undefined,
  },
};
