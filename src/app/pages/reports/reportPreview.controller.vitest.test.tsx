import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { act, renderWithProviders, screen, waitFor } from '~/test/render';

import { ApiError } from '~/services/apiClient';

import { useReportPreviewController } from './reportPreview.controller';
import {
  previewAssessmentId,
  previewBuilderState,
  previewSnapshot,
} from './reportPreview.testFixtures';

import type {
  ReportBuilderState,
  ReportPreviewRequest,
  ReportPreviewSnapshot,
} from '~/domain';
import type { ReportPreviewLoader } from './reportPreview.controller';

const secondAssessmentId = 'asm_00000000-0000-0000-0000-000000000002';

const secondBuilderState: ReportBuilderState = {
  ...previewBuilderState,
  selection: {
    ...previewBuilderState.selection,
    selectedAssessmentId: secondAssessmentId,
  },
};

const secondSnapshot: ReportPreviewSnapshot = {
  ...previewSnapshot,
  assessment: {
    ...previewSnapshot.assessment,
    id: secondAssessmentId,
    title: 'Administration Portal',
    applicationName: 'Administration Portal',
  },
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
};

interface HarnessProps {
  builderState: ReportBuilderState;
  loadPreview: ReportPreviewLoader;
}

const Harness = ({ builderState, loadPreview }: HarnessProps) => {
  const controller = useReportPreviewController(builderState, loadPreview);

  return (
    <div>
      <span data-testid="status">{controller.status}</span>
      <span data-testid="assessment-id">
        {controller.snapshot?.assessment.id}
      </span>
      <span data-testid="title">{controller.snapshot?.assessment.title}</span>
      <span data-testid="error">{controller.errorMessage}</span>
      <button type="button" onClick={controller.retry}>
        Retry
      </button>
    </div>
  );
};

describe('useReportPreviewController', () => {
  it('hides the previous Assessment snapshot immediately while the next Assessment loads', async () => {
    const nextPreview = createDeferred<ReportPreviewSnapshot>();
    const loadPreview = vi
      .fn<ReportPreviewLoader>()
      .mockResolvedValueOnce(previewSnapshot)
      .mockImplementationOnce(() => nextPreview.promise);
    const rendered = renderWithProviders(
      <Harness builderState={previewBuilderState} loadPreview={loadPreview} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('success');
      expect(screen.getByTestId('assessment-id')).toHaveTextContent(
        previewAssessmentId,
      );
    });

    act(() => {
      rendered.rerender(
        <Harness builderState={secondBuilderState} loadPreview={loadPreview} />,
      );
    });

    expect(screen.getByTestId('status')).toHaveTextContent('pending');
    expect(screen.getByTestId('assessment-id')).toBeEmptyDOMElement();
    expect(screen.getByTestId('title')).toBeEmptyDOMElement();

    await act(async () => {
      nextPreview.resolve(secondSnapshot);
      await nextPreview.promise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('success');
      expect(screen.getByTestId('assessment-id')).toHaveTextContent(
        secondAssessmentId,
      );
    });
  });

  it('aborts a superseded request and ignores its late response', async () => {
    const firstPreview = createDeferred<ReportPreviewSnapshot>();
    const secondPreview = createDeferred<ReportPreviewSnapshot>();
    const signals: AbortSignal[] = [];

    const loadPreview = vi.fn(
      (request: ReportPreviewRequest, signal?: AbortSignal) => {
        if (signal) {
          signals.push(signal);
        }

        return request.assessmentId === previewAssessmentId
          ? firstPreview.promise
          : secondPreview.promise;
      },
    );
    const rendered = renderWithProviders(
      <Harness builderState={previewBuilderState} loadPreview={loadPreview} />,
    );

    await waitFor(() => {
      expect(loadPreview).toHaveBeenCalledTimes(1);
    });

    act(() => {
      rendered.rerender(
        <Harness builderState={secondBuilderState} loadPreview={loadPreview} />,
      );
    });

    await waitFor(() => {
      expect(loadPreview).toHaveBeenCalledTimes(2);
    });

    expect(signals[0]?.aborted).toBe(true);

    await act(async () => {
      secondPreview.resolve(secondSnapshot);
      await secondPreview.promise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('assessment-id')).toHaveTextContent(
        secondAssessmentId,
      );
    });

    await act(async () => {
      firstPreview.resolve(previewSnapshot);
      await firstPreview.promise;
      await Promise.resolve();
    });

    expect(screen.getByTestId('assessment-id')).toHaveTextContent(
      secondAssessmentId,
    );
    expect(screen.getByTestId('title')).toHaveTextContent(
      'Administration Portal',
    );
  });

  it('shows safe validation paths returned by the Preview API', async () => {
    const loadPreview = vi.fn<ReportPreviewLoader>().mockRejectedValue(
      new ApiError(
        'Report preview data contains invalid values.',
        422,
        [
          {
            path: 'branding.issuerContactEmail',
            message: 'Invalid email address',
          },
          {
            path: 'selectedThreats.0.impact',
            message: 'Text is required',
          },
          {
            path: 'selectedThreats.0.impact',
            message: 'Text is required',
          },
        ],
        'VALIDATION_ERROR',
      ),
    );

    renderWithProviders(
      <Harness builderState={previewBuilderState} loadPreview={loadPreview} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error');
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Report preview data contains invalid values.',
      );
      expect(screen.getByTestId('error')).toHaveTextContent(
        'branding.issuerContactEmail: Invalid email address',
      );
      expect(screen.getByTestId('error')).toHaveTextContent(
        'selectedThreats.0.impact: Text is required',
      );
      expect(
        screen
          .getByTestId('error')
          .textContent?.match(/selectedThreats\.0\.impact: Text is required/g),
      ).toHaveLength(1);
    });
  });

  it('supports Retry for initial and same-Assessment refresh failures', async () => {
    const initialRetry = createDeferred<ReportPreviewSnapshot>();
    const refreshRetry = createDeferred<ReportPreviewSnapshot>();
    let callCount = 0;

    const loadPreview = vi.fn(() => {
      callCount += 1;

      if (callCount === 1) {
        return Promise.reject(new Error('Initial preview failed'));
      }

      if (callCount === 2) {
        return initialRetry.promise;
      }

      if (callCount === 3) {
        return Promise.reject(new Error('Preview refresh failed'));
      }

      return refreshRetry.promise;
    });
    const rendered = renderWithProviders(
      <Harness builderState={previewBuilderState} loadPreview={loadPreview} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error');
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Initial preview failed',
      );
      expect(screen.getByTestId('title')).toBeEmptyDOMElement();
    });

    await rendered.user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByTestId('status')).toHaveTextContent('pending');
    expect(screen.getByTestId('title')).toBeEmptyDOMElement();

    await act(async () => {
      initialRetry.resolve(previewSnapshot);
      await initialRetry.promise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('success');
      expect(screen.getByTestId('title')).toHaveTextContent(
        'Customer Services Portal',
      );
    });

    const refreshedBuilderState: ReportBuilderState = {
      ...previewBuilderState,
      configuration: {
        ...previewBuilderState.configuration,
        includeEvidence: false,
      },
    };

    act(() => {
      rendered.rerender(
        <Harness
          builderState={refreshedBuilderState}
          loadPreview={loadPreview}
        />,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error');
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Preview refresh failed',
      );
      expect(screen.getByTestId('title')).toHaveTextContent(
        'Customer Services Portal',
      );
    });

    await rendered.user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByTestId('status')).toHaveTextContent('pending');
    expect(screen.getByTestId('title')).toHaveTextContent(
      'Customer Services Portal',
    );

    const refreshedSnapshot: ReportPreviewSnapshot = {
      ...previewSnapshot,
      configuration: {
        ...previewSnapshot.configuration,
        includeEvidence: false,
      },
    };

    await act(async () => {
      refreshRetry.resolve(refreshedSnapshot);
      await refreshRetry.promise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('success');
    });

    expect(loadPreview).toHaveBeenCalledTimes(4);
  });
});
