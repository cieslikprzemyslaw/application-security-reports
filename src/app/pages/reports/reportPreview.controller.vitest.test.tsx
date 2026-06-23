import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { act, renderWithProviders, screen, waitFor } from '~/test/render';

import { useReportPreviewController } from './reportPreview.controller';
import {
  previewBuilderState,
  previewSnapshot,
} from './reportPreview.testFixtures';

import type { ReportBuilderState, ReportPreviewSnapshot } from '~/domain';
import type { ReportPreviewLoader } from './reportPreview.controller';

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
      <span data-testid="title">{controller.snapshot?.assessment.title}</span>
      <span data-testid="error">{controller.errorMessage}</span>
    </div>
  );
};

describe('useReportPreviewController', () => {
  it('moves through pending success and error while preserving the last preview', async () => {
    const first = createDeferred<ReportPreviewSnapshot>();
    let nextResult: Promise<ReportPreviewSnapshot> = first.promise;
    const loadPreview = vi.fn(() => nextResult);
    const rendered = renderWithProviders(
      <Harness builderState={previewBuilderState} loadPreview={loadPreview} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('pending');
    });

    await act(async () => {
      first.resolve(previewSnapshot);
      await first.promise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('success');
      expect(screen.getByTestId('title')).toHaveTextContent(
        'Customer Services Portal',
      );
    });

    nextResult = Promise.reject(new Error('Preview service unavailable'));
    rendered.rerender(
      <Harness
        builderState={{
          ...previewBuilderState,
          configuration: {
            ...previewBuilderState.configuration,
            includeEvidence: false,
          },
        }}
        loadPreview={loadPreview}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error');
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Preview service unavailable',
      );
      expect(screen.getByTestId('title')).toHaveTextContent(
        'Customer Services Portal',
      );
    });
  });
});
