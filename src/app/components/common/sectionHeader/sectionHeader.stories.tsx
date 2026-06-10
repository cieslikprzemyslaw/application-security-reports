import type { Meta, StoryObj } from '@storybook/react';

import SectionHeader from './sectionHeader.component';

const meta = {
  title: 'Common/SectionHeader',
  component: SectionHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Recent assessments',
    subtitle: 'The latest security work across your workspace.',
    actions: <button type="button">View all</button>,
  },
};
