import { act, useState } from 'react';
import { describe, expect, it } from 'vitest';

import {
  createJsonResponse,
  restoreFetch,
  setFetch,
} from '~/app/appRouter.tests/support';
import { renderWithProviders, screen, waitFor } from '~/test/render';

import {
  createDefaultReportBuilderState,
  updateReportBuilderSelection,
} from './reportBuilderState';
import { useReportBootstrapController } from './reportBootstrap.controller';

import type { ReportBuilderState } from '~/domain';
import type { ReportBootstrapAssessment } from './reportBootstrap.controller';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const reportId = 'rpt_00000000-0000-0000-0000-000000000001';

const assessment: ReportBootstrapAssessment = {
  id: assessmentId,
  name: 'Customer Services Portal',
  applicationName: 'Customer Services Portal',
};

const createInitialState = () =>
  updateReportBuilderSelection(createDefaultReportBuilderState(companyId), {
    selectedAssessmentId: assessmentId,
    selectedThreatIds: [threatId],
  });

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

const BootstrapHarness = () => {
  const [builderState, setBuilderState] =
    useState<ReportBuilderState>(createInitialState);
  const controller = useReportBootstrapController({
    builderState,
    onBuilderStateChange: setBuilderState,
  });

  return (
    <>
      <button
        type="button"
        disabled={controller.status === 'pending'}
        onClick={() => {
          void controller.bootstrap(assessment).catch(() => undefined);
        }}
      >
        Create Report
      </button>

      <p
        data-testid="bootstrap-status"
        role={controller.status === 'error' ? 'alert' : 'status'}
        aria-live="polite"
      >
        {controller.errorMessage ?? controller.status}
      </p>

      <output data-testid="report-id">{builderState.reportId ?? ''}</output>
      <output data-testid="builder-selection">
        {JSON.stringify(builderState.selection)}
      </output>
    </>
  );
};

describe('Report bootstrap workflow', () => {
  it('creates once through the production service and retains the stable Report ID', async () => {
    const response = createDeferred<Response>();
    const requestBodies: unknown[] = [];
    let createdReportListItem: Record<string, unknown> | undefined;

    setFetch(async (input, init) => {
      const path = String(input);

      if (path === `/api/reports?assessmentId=${assessmentId}`) {
        return createJsonResponse({
          data: createdReportListItem ? [createdReportListItem] : [],
        });
      }

      expect(path).toBe('/api/reports');
      expect(init?.method).toBe('POST');
      requestBodies.push(JSON.parse(String(init?.body)));

      return response.promise;
    });

    try {
      const { user } = renderWithProviders(<BootstrapHarness />);
      const createButton = screen.getByRole('button', {
        name: 'Create Report',
      });

      act(() => {
        createButton.click();
        createButton.click();
      });

      await waitFor(() => {
        expect(requestBodies).toHaveLength(1);
        expect(screen.getByTestId('bootstrap-status')).toHaveTextContent(
          'pending',
        );
      });

      expect(requestBodies[0]).toEqual({
        assessmentId,
        title: 'Customer Services Portal Security Report',
        selectedThreatIds: [threatId],
      });

      const createdReport = {
        id: reportId,
        assessmentId,
        title: 'Customer Services Portal Security Report',
        status: 'draft',
        selectedThreatIds: [threatId],
        latestVersion: 0,
        createdAt: '2026-06-25T10:00:00.000Z',
        updatedAt: '2026-06-25T10:00:00.000Z',
      };
      createdReportListItem = {
        ...createdReport,
        versions: [],
      };

      response.resolve(
        createJsonResponse({
          data: createdReport,
        }),
      );

      await waitFor(() => {
        expect(screen.getByTestId('bootstrap-status')).toHaveTextContent(
          'success',
        );
        expect(screen.getByTestId('report-id')).toHaveTextContent(reportId);
      });

      expect(
        JSON.parse(screen.getByTestId('builder-selection').textContent ?? '{}'),
      ).toEqual(createInitialState().selection);

      await user.click(createButton);

      expect(requestBodies).toHaveLength(1);
      expect(screen.getByTestId('report-id')).toHaveTextContent(reportId);
    } finally {
      restoreFetch();
    }
  });
});
