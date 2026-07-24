import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppThemeProvider } from '~/theme';

import CollectionRowAction from './collectionRowAction.component';

const renderWithProviders = (content: ReactNode) =>
  render(
    <MemoryRouter>
      <AppThemeProvider>{content}</AppThemeProvider>
    </MemoryRouter>,
  );

describe('CollectionRowAction', () => {
  it('renders navigation as a real link with an accessible name', () => {
    renderWithProviders(
      <div>
        <CollectionRowAction
          to="/assessments/asm_1"
          label="Open Customer portal assessment"
        />
        <span>Customer portal</span>
      </div>,
    );

    const action = screen.getByRole('link', {
      name: 'Open Customer portal assessment',
    });

    expect(action).toHaveAttribute('href', '/assessments/asm_1');
    expect(action.querySelector('a, button')).toBeNull();
  });

  it('renders in-place activation as a real button', () => {
    const onActivate = vi.fn();

    renderWithProviders(
      <div>
        <CollectionRowAction
          label="Open Customer portal details"
          onActivate={onActivate}
        />
        <span>Customer portal</span>
      </div>,
    );

    const action = screen.getByRole('button', {
      name: 'Open Customer portal details',
    });

    expect(action).toHaveAttribute('type', 'button');
    fireEvent.click(action);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('keeps row actions separate from the primary action', () => {
    const onActivate = vi.fn();
    const onEdit = vi.fn();

    renderWithProviders(
      <article>
        <CollectionRowAction
          label="Open Customer portal details"
          onActivate={onActivate}
        />
        <span>Customer portal</span>
        <div className="collection-row-actions">
          <button type="button" onClick={onEdit}>
            Edit
          </button>
        </div>
      </article>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('exposes selected and disabled states without relying on colour', () => {
    renderWithProviders(
      <>
        <CollectionRowAction
          label="Open selected threat"
          isSelected
          onActivate={() => undefined}
        />
        <CollectionRowAction
          to="/reports/rpt_1"
          label="Open disabled report"
          disabled
        />
      </>,
    );

    expect(
      screen.getByRole('button', { name: 'Open selected threat' }),
    ).toHaveAttribute('aria-pressed', 'true');

    const disabledLink = screen.getByRole('link', {
      name: 'Open disabled report',
    });

    expect(disabledLink).toHaveAttribute('aria-disabled', 'true');
    expect(disabledLink).toHaveAttribute('tabindex', '-1');
  });

  it('preserves data attributes used by production workflow tests', () => {
    renderWithProviders(
      <CollectionRowAction
        label="Open captured request"
        data-evidence-open-action="evd_1"
        onActivate={() => undefined}
      >
        Captured request
      </CollectionRowAction>,
    );

    expect(
      screen.getByRole('button', { name: 'Open captured request' }),
    ).toHaveAttribute('data-evidence-open-action', 'evd_1');
  });
});
