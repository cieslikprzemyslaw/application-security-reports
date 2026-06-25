import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { ServerStyleSheet, ThemeProvider } from 'styled-components';
import { describe, expect, it, vi } from 'vitest';

import { defaultTheme } from '~/theme';

import ReportActions from './reportActions.component';

import type {
  ReportActionConfig,
  ReportActionsProps,
} from './reportActions.type';

const createAction = (
  onActivate = vi.fn(),
  overrides: Partial<ReportActionConfig> = {},
): ReportActionConfig => ({
  onActivate,
  ...overrides,
});

const createProps = (
  overrides: Partial<ReportActionsProps> = {},
): ReportActionsProps => ({
  backToEditor: createAction(),
  generatePreview: createAction(),
  saveDraft: createAction(),
  saveAsFinal: createAction(),
  generatePdf: createAction(),
  primaryAction: 'generatePreview',
  ...overrides,
});

const renderActions = (props: ReportActionsProps = createProps()) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <ReportActions {...props} />
    </ThemeProvider>,
  );

describe('ReportActions', () => {
  it('renders the named actions in their fixed order with one primary action', () => {
    renderActions();

    expect(
      screen.getAllByRole('button').map(button => button.textContent),
    ).toEqual([
      'Back to editor',
      'Generate preview',
      'Save draft',
      'Save as final',
      'Generate PDF',
    ]);

    expect(
      screen.getByRole('button', { name: 'Generate preview' }),
    ).toHaveClass('report-actions__action--primary');

    expect(
      screen
        .getAllByRole('button')
        .filter(button =>
          button.classList.contains('report-actions__action--primary'),
        ),
    ).toHaveLength(1);
  });

  it('passes mouse and keyboard activation to the parent callbacks', async () => {
    const user = userEvent.setup();
    const onBackToEditor = vi.fn();
    const onGeneratePreview = vi.fn();
    const onSaveDraft = vi.fn();

    renderActions(
      createProps({
        backToEditor: createAction(onBackToEditor),
        generatePreview: createAction(onGeneratePreview),
        saveDraft: createAction(onSaveDraft),
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Back to editor' }));
    expect(onBackToEditor).toHaveBeenCalledTimes(1);

    const previewButton = screen.getByRole('button', {
      name: 'Generate preview',
    });
    previewButton.focus();
    await user.keyboard('{Enter}');
    expect(onGeneratePreview).toHaveBeenCalledTimes(1);

    const saveDraftButton = screen.getByRole('button', {
      name: 'Save draft',
    });
    saveDraftButton.focus();
    await user.keyboard(' ');
    expect(onSaveDraft).toHaveBeenCalledTimes(1);
  });

  it('supports toolbar navigation and skips unavailable actions', async () => {
    const user = userEvent.setup();

    renderActions(
      createProps({
        saveDraft: createAction(vi.fn(), {
          isDisabled: true,
          disabledReason: 'Draft saving is unavailable.',
        }),
      }),
    );

    const backButton = screen.getByRole('button', {
      name: 'Back to editor',
    });
    const previewButton = screen.getByRole('button', {
      name: 'Generate preview',
    });
    const finalButton = screen.getByRole('button', {
      name: 'Save as final',
    });
    const pdfButton = screen.getByRole('button', {
      name: 'Generate PDF',
    });

    backButton.focus();
    await user.keyboard('{ArrowRight}');
    expect(previewButton).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(finalButton).toHaveFocus();

    await user.keyboard('{End}');
    expect(pdfButton).toHaveFocus();

    await user.keyboard('{Home}');
    expect(backButton).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(pdfButton).toHaveFocus();
  });

  it('prevents duplicate activation while an action is pending', async () => {
    const user = userEvent.setup();
    const onSaveDraft = vi.fn();

    renderActions(
      createProps({
        saveDraft: createAction(onSaveDraft, {
          isPending: true,
        }),
        primaryAction: 'saveDraft',
      }),
    );

    const pendingButton = screen.getByRole('button', {
      name: 'Saving draft',
    });

    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute('aria-busy', 'true');
    expect(pendingButton).toHaveAccessibleDescription('Saving draft.');

    await user.click(pendingButton);
    expect(onSaveDraft).not.toHaveBeenCalled();
  });

  it('exposes the reason for every contextually disabled action', () => {
    const disabledReason = 'Save a report version before generating a PDF.';

    renderActions(
      createProps({
        generatePdf: createAction(vi.fn(), {
          isDisabled: true,
          disabledReason,
        }),
      }),
    );

    const disabledButton = screen.getByRole('button', {
      name: 'Generate PDF',
    });

    expect(disabledButton).toBeDisabled();
    expect(disabledButton).toHaveAccessibleDescription(disabledReason);
  });

  it('supports omitted actions without changing the remaining action order', () => {
    renderActions({
      backToEditor: createAction(),
      saveDraft: createAction(),
      generatePdf: createAction(),
      primaryAction: 'saveDraft',
    });

    expect(
      screen.getAllByRole('button').map(button => button.textContent),
    ).toEqual(['Back to editor', 'Save draft', 'Generate PDF']);
  });

  it('preserves the existing preview-shell print and PDF callbacks during migration', async () => {
    const user = userEvent.setup();
    const onPrint = vi.fn();
    const onGeneratePdf = vi.fn();

    renderActions({
      onPrint,
      onGeneratePdf,
    });

    await user.click(screen.getByRole('button', { name: 'Print' }));
    await user.click(screen.getByRole('button', { name: 'Generate PDF' }));

    expect(onPrint).toHaveBeenCalledTimes(1);
    expect(onGeneratePdf).toHaveBeenCalledTimes(1);
  });

  it('is responsive and excluded from print output', () => {
    const sheet = new ServerStyleSheet();

    try {
      const markup = renderToString(
        sheet.collectStyles(
          <ThemeProvider theme={defaultTheme}>
            <ReportActions {...createProps()} />
          </ThemeProvider>,
        ),
      );
      const styles = sheet.getStyleTags();

      expect(markup).toContain('role="toolbar"');
      expect(markup).toContain('aria-label="Report actions"');
      expect(markup).toContain('data-print-hidden="true"');
      expect(markup).toContain('no-print');

      expect(styles).toContain('@container');
      expect(styles).toMatch(/max-width:\s*36rem/);
      expect(styles).toMatch(/flex:\s*1 1 100%/);
      expect(styles).toMatch(/overflow-wrap:\s*anywhere/);
      expect(styles).toContain('@media print');
      expect(styles).toMatch(/display:\s*none\s*!important/);
    } finally {
      sheet.seal();
    }
  });
});
