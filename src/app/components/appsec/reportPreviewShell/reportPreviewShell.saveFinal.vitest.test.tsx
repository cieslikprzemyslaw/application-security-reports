import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '~/test/render';

import ReportPreviewShell from './reportPreviewShell.component';

describe('ReportPreviewShell Save final integration', () => {
  it('forwards the Save as final action, pending state, and accessible feedback', async () => {
    const onSaveFinal = vi.fn();
    const { rerender, user } = renderWithProviders(
      <ReportPreviewShell
        applicationName="Customer Portal"
        assessmentCode="ASM-001"
        autoSaved={false}
        preview={<p>Preview</p>}
        reportActions={{
          saveAsFinal: {
            onActivate: onSaveFinal,
          },
          primaryAction: 'saveDraft',
        }}
        reportActionStatus={{
          message: 'Final version saved as v1.0.',
        }}
      />,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Save as final',
      }),
    );

    expect(onSaveFinal).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Final version saved as v1.0.',
    );

    rerender(
      <ReportPreviewShell
        applicationName="Customer Portal"
        assessmentCode="ASM-001"
        autoSaved={false}
        preview={<p>Preview</p>}
        reportActions={{
          saveAsFinal: {
            onActivate: onSaveFinal,
            isPending: true,
          },
          primaryAction: 'saveDraft',
        }}
        reportActionStatus={{
          message: 'Saving final version…',
        }}
      />,
    );

    const pendingButton = screen.getByRole('button', {
      name: 'Saving as final',
    });

    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute('aria-busy', 'true');
  });
});
