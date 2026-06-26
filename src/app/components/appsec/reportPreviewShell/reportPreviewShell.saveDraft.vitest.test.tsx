import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '~/test/render';

import ReportPreviewShell from './reportPreviewShell.component';

describe('ReportPreviewShell Save draft integration', () => {
  it('forwards the Save draft action, pending state, and accessible feedback', async () => {
    const onSaveDraft = vi.fn();
    const { rerender, user } = renderWithProviders(
      <ReportPreviewShell
        applicationName="Customer Portal"
        assessmentCode="ASM-001"
        autoSaved={false}
        preview={<p>Preview</p>}
        reportActions={{
          saveDraft: {
            onActivate: onSaveDraft,
          },
          primaryAction: 'saveDraft',
        }}
        reportActionStatus={{
          message: 'Draft saved as v0.1.',
        }}
      />,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Save draft',
      }),
    );

    expect(onSaveDraft).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Draft saved as v0.1.',
    );

    rerender(
      <ReportPreviewShell
        applicationName="Customer Portal"
        assessmentCode="ASM-001"
        autoSaved={false}
        preview={<p>Preview</p>}
        reportActions={{
          saveDraft: {
            onActivate: onSaveDraft,
            isPending: true,
          },
          primaryAction: 'saveDraft',
        }}
        reportActionStatus={{
          message: 'Saving draft…',
        }}
      />,
    );

    const pendingButton = screen.getByRole('button', {
      name: 'Saving draft',
    });

    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute('aria-busy', 'true');
  });
});
