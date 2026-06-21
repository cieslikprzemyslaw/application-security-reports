import type { Meta, StoryObj } from '@storybook/react';

import Button from '../button';
import EmptyState from './emptyState.component';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    Story => (
      <div style={{ maxWidth: '44rem', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstUse: Story = {
  args: {
    variant: 'first-use',
    title: 'No threats yet',
    description:
      'Add the first threat to start building the assessment and report.',
    primaryAction: <Button title="Add threat" />,
  },
};

export const NoResults: Story = {
  args: {
    variant: 'no-results',
    title: 'No threats match "oauth"',
    description:
      'Clear the search and filters to show all threats in this assessment again.',
    primaryAction: <Button title="Clear filters" variant="secondary" />,
  },
};

export const Unavailable: Story = {
  args: {
    variant: 'unavailable',
    title: 'Threats unavailable',
    description:
      'This section is temporarily unavailable while the workspace is reloading.',
    primaryAction: <Button title="Retry" variant="secondary" />,
    secondaryAction: <Button title="Back to dashboard" variant="tertiary" />,
  },
};

export const LongContentAndActions: Story = {
  args: {
    variant: 'no-results',
    title: 'No threats match the current filters',
    description: (
      <>
        <p>
          Try clearing the application and severity filters, or search for a
          different term. Long guidance should wrap cleanly without pushing the
          actions off screen.
        </p>

        <p>
          The layout also needs to stay readable on narrow containers so the
          call to action stays visible.
        </p>
      </>
    ),
    primaryAction: <Button title="Clear filters" />,
    secondaryAction: <Button title="Create threat" variant="secondary" />,
  },
  decorators: [
    Story => (
      <div style={{ maxWidth: '22rem', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};
