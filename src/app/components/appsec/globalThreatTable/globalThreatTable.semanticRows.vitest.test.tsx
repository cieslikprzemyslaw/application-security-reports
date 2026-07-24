import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppThemeProvider } from '~/theme';

import GlobalThreatTable from './globalThreatTable.component';

import type { GlobalThreatRow } from './globalThreatTable.type';

const threat: GlobalThreatRow = {
  id: 'thr_00000000-0000-0000-0000-000000000001',
  title: 'Missing ownership check',
  applicationName: 'Customer portal',
  companyName: 'Example Ltd',
  strideCategory: 'elevation-of-privilege',
  severity: 'high',
  status: 'open',
  updatedAt: '2026-07-24',
};

describe('GlobalThreatTable semantic rows', () => {
  it('uses a real button for the row action', () => {
    const onThreatClick = vi.fn();

    render(
      <AppThemeProvider>
        <GlobalThreatTable
          threats={[threat]}
          onThreatClick={onThreatClick}
        />
      </AppThemeProvider>,
    );

    const action = screen.getByRole('button', {
      name: `Open ${threat.title} threat`,
    });
    const row = action.closest('tr');

    expect(row).not.toHaveAttribute('tabindex');
    expect(action.closest('tr')).toBe(row);

    fireEvent.click(action);
    expect(onThreatClick).toHaveBeenCalledWith(threat);
  });

  it('does not create a focusable row when no primary action exists', () => {
    render(
      <AppThemeProvider>
        <GlobalThreatTable threats={[threat]} />
      </AppThemeProvider>,
    );

    const row = document
      .querySelector('.global-threat-table-threat-title')
      ?.closest('tr');

    expect(row).not.toHaveAttribute('tabindex');
    expect(
      screen.queryByRole('button', {
        name: `Open ${threat.title} threat`,
      }),
    ).toBeNull();
  });
});
