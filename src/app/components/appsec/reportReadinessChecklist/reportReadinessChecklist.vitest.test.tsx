import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { ServerStyleSheet, ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';

import type { ReportReadinessResult } from '~/domain/schemas';
import { defaultTheme } from '~/theme';

import ReportReadinessChecklist from './reportReadinessChecklist.component';

const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';

const errors: ReportReadinessResult['errors'] = [
  {
    code: 'REPORT_TITLE_REQUIRED',
    message: 'Add a report title before finalising.',
    target: {
      resourceType: 'report',
      resourceId: reportId,
      field: 'title',
    },
  },
];

const warnings: ReportReadinessResult['warnings'] = [
  {
    code: 'THREAT_EVIDENCE_MISSING',
    message: 'SQL injection has no selected evidence.',
    target: {
      resourceType: 'threat',
      resourceId: threatId,
    },
  },
];

const renderChecklist = (
  result: ReportReadinessResult,
  onTargetActivate?: Parameters<
    typeof ReportReadinessChecklist
  >[0]['onTargetActivate'],
) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <ReportReadinessChecklist
        result={result}
        onTargetActivate={onTargetActivate}
      />
    </ThemeProvider>,
  );

describe('ReportReadinessChecklist', () => {
  it('renders mixed errors and warnings with distinct accessible semantics', () => {
    renderChecklist({ errors, warnings });

    expect(
      screen.getByRole('heading', { name: 'Report readiness' }),
    ).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('1 blocking issue');
    expect(screen.getByRole('status')).toHaveTextContent('1 warning');
    expect(screen.getByText(errors[0].message)).toBeVisible();
    expect(screen.getByText(warnings[0].message)).toBeVisible();
  });

  it('renders error-only and warning-only results independently', () => {
    const { rerender } = renderChecklist({ errors, warnings: [] });

    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.queryByText('1 warning')).not.toBeInTheDocument();

    rerender(
      <ThemeProvider theme={defaultTheme}>
        <ReportReadinessChecklist result={{ errors: [], warnings }} />
      </ThemeProvider>,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 warning');
  });

  it('renders a clear empty state without inventing readiness rules', () => {
    renderChecklist({ errors: [], warnings: [] });

    expect(screen.getByRole('status')).toHaveTextContent('No readiness issues');
    expect(screen.getByRole('status')).toHaveTextContent(
      'The backend returned no blocking issues or warnings.',
    );
  });

  it('passes the exact structured target to the parent with mouse and keyboard', async () => {
    const user = userEvent.setup();
    const onTargetActivate = vi.fn();

    renderChecklist({ errors, warnings: [] }, onTargetActivate);

    const targetButton = screen.getByRole('button', {
      name: 'Add a report title before finalising. Review Report · Title',
    });

    await user.click(targetButton);
    expect(onTargetActivate).toHaveBeenLastCalledWith(errors[0].target);

    targetButton.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onTargetActivate).toHaveBeenCalledTimes(3);
    expect(onTargetActivate).toHaveBeenLastCalledWith(errors[0].target);
  });

  it('uses visible text in addition to colour and does not create controls without a callback', () => {
    renderChecklist({ errors, warnings });

    expect(screen.getByText('1 blocking issue')).toBeVisible();
    expect(screen.getByText('1 warning')).toBeVisible();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('is excluded from print output through both the shared hook and component styles', () => {
    const sheet = new ServerStyleSheet();

    try {
      const markup = renderToString(
        sheet.collectStyles(
          <ThemeProvider theme={defaultTheme}>
            <ReportReadinessChecklist result={{ errors, warnings }} />
          </ThemeProvider>,
        ),
      );
      const styles = sheet.getStyleTags();

      expect(markup).toContain('data-print-hidden="true"');
      expect(markup).toContain('no-print');
      expect(styles).toContain('@media print');
      expect(styles).toMatch(/display:\s*none\s*!important/);
    } finally {
      sheet.seal();
    }
  });
});
