import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { css, styled } from 'styled-components';

import CollectionRowAction from './collectionRowAction.component';

interface CollectionRowActionDemoProps {
  presentation: 'table' | 'list';
  actionType: 'link' | 'button';
  disabled?: boolean;
  isSelected?: boolean;
  withOverflow?: boolean;
}

const StyledDemo = styled.div`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    max-width: 52rem;

    .collection-row-demo__table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }

    .collection-row-demo__row,
    .collection-row-demo__card {
      position: relative;
      isolation: isolate;
      background-color: ${colors.surface.card};
    }

    .collection-row-demo__row:has(.collection-row-action:hover),
    .collection-row-demo__card:has(.collection-row-action:hover) {
      background-color: ${colors.surface.subtle};
    }

    .collection-row-demo__row > td {
      padding: ${spacing.s};
      border-bottom: 1px solid ${colors.border.subtle};
    }

    .collection-row-demo__card {
      display: grid;
      gap: ${spacing.xxs};
      padding: ${spacing.m};
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
    }

    .collection-row-demo__primary {
      font-weight: ${typography.fontWeights.semibold};
      color: ${colors.text.primary};
    }

    .collection-row-demo__secondary {
      color: ${colors.text.muted};
    }

    .collection-row-demo__selected {
      font-size: ${typography.body.small.size};
      color: ${colors.text.secondary};
    }

    .collection-row-demo__actions {
      position: relative;
      z-index: 2;
      justify-self: end;
    }
  `}
`;

const DemoAction = ({
  actionType,
  disabled,
  isSelected,
}: Pick<
  CollectionRowActionDemoProps,
  'actionType' | 'disabled' | 'isSelected'
>) =>
  actionType === 'link' ? (
    <CollectionRowAction
      to="/assessments/asm_demo"
      label="Open Customer portal assessment"
      disabled={disabled}
      isSelected={isSelected}
    />
  ) : (
    <CollectionRowAction
      label="Open Customer portal details"
      disabled={disabled}
      isSelected={isSelected}
      onActivate={() => undefined}
    />
  );

const CollectionRowActionDemo = ({
  presentation,
  actionType,
  disabled = false,
  isSelected = false,
  withOverflow = false,
}: CollectionRowActionDemoProps) => (
  <StyledDemo>
    {presentation === 'table' ? (
      <table className="collection-row-demo__table">
        <tbody>
          <tr className="collection-row-demo__row">
            <td>
              <DemoAction
                actionType={actionType}
                disabled={disabled}
                isSelected={isSelected}
              />
              <span className="collection-row-demo__primary">
                Customer portal
              </span>
            </td>
            <td className="collection-row-demo__secondary">In progress</td>
            <td>
              {isSelected && (
                <span className="collection-row-demo__selected">Selected</span>
              )}
            </td>
            <td>
              {withOverflow && (
                <button
                  className="collection-row-demo__actions"
                  type="button"
                  aria-label="Actions for Customer portal"
                >
                  More
                </button>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    ) : (
      <article className="collection-row-demo__card">
        <DemoAction
          actionType={actionType}
          disabled={disabled}
          isSelected={isSelected}
        />
        <span className="collection-row-demo__primary">Customer portal</span>
        <span className="collection-row-demo__secondary">
          Three linked threats
        </span>
        {isSelected && (
          <span className="collection-row-demo__selected">Selected</span>
        )}
        {withOverflow && (
          <button
            className="collection-row-demo__actions"
            type="button"
            aria-label="Actions for Customer portal"
          >
            More
          </button>
        )}
      </article>
    )}
  </StyledDemo>
);

const meta = {
  title: 'Common/CollectionRowAction',
  component: CollectionRowActionDemo,
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CollectionRowActionDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TableLink: Story = {
  args: {
    presentation: 'table',
    actionType: 'link',
  },
};

export const ListButton: Story = {
  args: {
    presentation: 'list',
    actionType: 'button',
  },
};

export const WithOverflow: Story = {
  args: {
    presentation: 'table',
    actionType: 'link',
    withOverflow: true,
  },
};

export const Selected: Story = {
  args: {
    presentation: 'list',
    actionType: 'button',
    isSelected: true,
  },
};

export const Disabled: Story = {
  args: {
    presentation: 'table',
    actionType: 'link',
    disabled: true,
  },
};

export const Mobile: Story = {
  args: {
    presentation: 'list',
    actionType: 'button',
    withOverflow: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
