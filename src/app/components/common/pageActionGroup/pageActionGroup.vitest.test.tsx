import type { ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppThemeProvider } from '~/theme';

import PageActionGroup from './pageActionGroup.component';

const renderGroup = (element: ReactElement) =>
  render(<AppThemeProvider>{element}</AppThemeProvider>);

describe('PageActionGroup', () => {
  it('keeps primary, secondary and destructive actions distinct', () => {
    renderGroup(
      <PageActionGroup
        primaryAction={{ id: 'save', label: 'Save', onActivate: vi.fn() }}
        secondaryActions={[
          { id: 'preview', label: 'Preview', onActivate: vi.fn() },
        ]}
        destructiveAction={{
          id: 'delete',
          label: 'Delete',
          onActivate: vi.fn(),
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  it('opens overflow actions and closes on Escape', () => {
    const onArchive = vi.fn();

    renderGroup(
      <PageActionGroup
        overflowActions={[
          { id: 'archive', label: 'Archive', onActivate: onArchive },
        ]}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'More actions' });

    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toBeVisible();

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('exposes a disabled reason and does not activate the action', () => {
    const onActivate = vi.fn();

    renderGroup(
      <PageActionGroup
        secondaryActions={[
          {
            id: 'publish',
            label: 'Publish',
            disabled: true,
            disabledReason: 'Resolve readiness checks first.',
            onActivate,
          },
        ]}
      />,
    );

    const action = screen.getByRole('button', { name: 'Publish' });

    expect(action).toBeDisabled();
    expect(action).toHaveAttribute('aria-describedby');
    fireEvent.click(action);
    expect(onActivate).not.toHaveBeenCalled();
  });
});
