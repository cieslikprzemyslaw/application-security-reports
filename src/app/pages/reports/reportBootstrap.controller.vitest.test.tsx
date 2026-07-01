import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApiAbortError } from '~/services/apiClient';

import {
  createDefaultReportBuilderState,
  updateReportBuilderReportId,
  updateReportBuilderSelection,
} from './reportBuilderState';
import {
  createInitialReportTitle,
  useReportBootstrapController,
} from './reportBootstrap.controller';

import type {
  AssessmentReportListItem,
  Report,
  ReportBuilderState,
} from '~/domain';
import type { ReportBootstrapAssessment } from './reportBootstrap.controller';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const reportId = 'rpt_00000000-0000-0000-0000-000000000001';

const assessment: ReportBootstrapAssessment = {
  id: assessmentId,
  name: 'Fallback / Assessment',
  applicationName: 'Customer\\Services\u0007 Portal',
};

const createdReport: Report = {
  id: reportId,
  assessmentId,
  title: 'Customer Services Portal Security Report',
  status: 'draft',
  selectedThreatIds: [threatId],
  latestVersion: 0,
  createdAt: '2026-06-25T10:00:00.000Z',
  updatedAt: '2026-06-25T10:00:00.000Z',
};

const existingReport: AssessmentReportListItem = {
  ...createdReport,
  latestVersion: 2,
  versions: [
    {
      id: 'rvs_00000000-0000-0000-0000-000000000002',
      version: 2,
      status: 'draft',
      generatedAt: '2026-06-25',
    },
  ],
};

const createUnsavedBuilderState = () =>
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

describe('useReportBootstrapController', () => {
  it('creates one Report, blocks duplicate pending activation and retains reportId', async () => {
    const deferred = createDeferred<Report>();
    const createReport = vi.fn(() => deferred.promise);
    const listReportsByAssessmentId = vi.fn(() => Promise.resolve([]));
    const onBuilderStateChange = vi.fn();
    const builderState = createUnsavedBuilderState();

    const { result } = renderHook(() =>
      useReportBootstrapController({
        builderState,
        onBuilderStateChange,
        createReport,
        listReportsByAssessmentId,
      }),
    );

    let firstRequest!: Promise<string>;
    let secondRequest!: Promise<string>;

    act(() => {
      firstRequest = result.current.bootstrap(assessment);
      secondRequest = result.current.bootstrap(assessment);
    });

    expect(firstRequest).toBe(secondRequest);
    expect(listReportsByAssessmentId).toHaveBeenCalledTimes(1);
    expect(createReport).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('pending');

    await act(async () => {
      deferred.resolve(createdReport);
      await firstRequest;
    });

    expect(await firstRequest).toBe(reportId);
    expect(result.current.status).toBe('success');
    expect(result.current.reportId).toBe(reportId);
    expect(onBuilderStateChange).toHaveBeenCalledTimes(1);

    const nextState = onBuilderStateChange.mock.calls[0]?.[0] as
      | ReportBuilderState
      | undefined;

    expect(nextState?.reportId).toBe(reportId);
    expect(nextState?.selection).toEqual(builderState.selection);
    expect(nextState?.configuration).toEqual(builderState.configuration);
    expect(nextState?.branding).toEqual(builderState.branding);
    expect(createReport).toHaveBeenCalledWith(
      {
        assessmentId,
        title: 'Customer Services Portal Security Report',
        selectedThreatIds: [threatId],
      },
      undefined,
    );
  });

  it('reuses an existing Report ID without making another request', async () => {
    const builderState = updateReportBuilderReportId(
      createUnsavedBuilderState(),
      reportId,
    );
    const createReport = vi.fn();
    const listReportsByAssessmentId = vi.fn();
    const onBuilderStateChange = vi.fn();
    const { result } = renderHook(() =>
      useReportBootstrapController({
        builderState,
        onBuilderStateChange,
        createReport,
        listReportsByAssessmentId,
      }),
    );

    await expect(
      result.current.bootstrap({
        id: 'asm_00000000-0000-0000-0000-000000000099',
        name: 'Another Assessment',
      }),
    ).resolves.toBe(reportId);

    expect(createReport).not.toHaveBeenCalled();
    expect(listReportsByAssessmentId).not.toHaveBeenCalled();
    expect(onBuilderStateChange).not.toHaveBeenCalled();
    expect(result.current.status).toBe('success');
    expect(result.current.reportId).toBe(reportId);
  });

  it('retains the created Report and preserves same-Assessment edits made while pending', async () => {
    const deferred = createDeferred<Report>();
    const createReport = vi.fn(() => deferred.promise);
    const listReportsByAssessmentId = vi.fn(() => Promise.resolve([]));
    const onBuilderStateChange = vi.fn();
    const initialBuilderState = createUnsavedBuilderState();
    const changedBuilderState = updateReportBuilderSelection(
      initialBuilderState,
      {
        selectedThreatIds: [],
      },
    );
    const { result, rerender } = renderHook(
      ({ builderState }: { builderState: ReportBuilderState }) =>
        useReportBootstrapController({
          builderState,
          onBuilderStateChange,
          createReport,
          listReportsByAssessmentId,
        }),
      {
        initialProps: {
          builderState: initialBuilderState,
        },
      },
    );

    let request!: Promise<string>;

    act(() => {
      request = result.current.bootstrap(assessment);
    });

    rerender({ builderState: changedBuilderState });

    await act(async () => {
      deferred.resolve(createdReport);
      await expect(request).resolves.toBe(reportId);
    });

    expect(onBuilderStateChange).toHaveBeenCalledTimes(1);

    const persistedState = onBuilderStateChange.mock.calls[0]?.[0] as
      | ReportBuilderState
      | undefined;

    expect(persistedState?.reportId).toBe(reportId);
    expect(persistedState?.selection).toEqual(changedBuilderState.selection);
    expect(persistedState?.configuration).toEqual(
      changedBuilderState.configuration,
    );
    expect(persistedState?.branding).toEqual(changedBuilderState.branding);
    expect(result.current.status).toBe('success');
    expect(result.current.reportId).toBe(reportId);

    rerender({ builderState: persistedState! });

    await expect(result.current.bootstrap(assessment)).resolves.toBe(reportId);
    expect(createReport).toHaveBeenCalledTimes(1);
  });

  it('reuses a persisted matching Report before creating a duplicate', async () => {
    const builderState = createUnsavedBuilderState();
    const createReport = vi.fn();
    const listReportsByAssessmentId = vi.fn(() =>
      Promise.resolve([existingReport]),
    );
    const onBuilderStateChange = vi.fn();
    const { result } = renderHook(() =>
      useReportBootstrapController({
        builderState,
        onBuilderStateChange,
        createReport,
        listReportsByAssessmentId,
      }),
    );

    await act(async () => {
      await expect(result.current.bootstrap(assessment)).resolves.toBe(
        reportId,
      );
    });

    expect(listReportsByAssessmentId).toHaveBeenCalledWith(
      assessmentId,
      undefined,
    );
    expect(createReport).not.toHaveBeenCalled();
    expect(onBuilderStateChange).toHaveBeenCalledTimes(1);

    const nextState = onBuilderStateChange.mock.calls[0]?.[0] as
      | ReportBuilderState
      | undefined;

    expect(nextState?.reportId).toBe(reportId);
    expect(nextState?.selection).toEqual(builderState.selection);
    expect(result.current.status).toBe('success');
    expect(result.current.reportId).toBe(reportId);
  });

  it('preserves builder state and exposes a safe error when creation fails', async () => {
    const builderState = createUnsavedBuilderState();
    const createReport = vi.fn(() =>
      Promise.reject(new Error('C:\\private\\database.sqlite')),
    );
    const onBuilderStateChange = vi.fn();
    const { result } = renderHook(() =>
      useReportBootstrapController({
        builderState,
        onBuilderStateChange,
        createReport,
        listReportsByAssessmentId,
      }),
    );

    await act(async () => {
      await expect(result.current.bootstrap(assessment)).rejects.toThrow();
    });

    expect(onBuilderStateChange).not.toHaveBeenCalled();
    expect(builderState.reportId).toBeUndefined();
    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('Unable to create the Report.');
    expect(result.current.errorMessage).not.toContain('database.sqlite');
  });

  it('returns to idle after an aborted request without changing builder state', async () => {
    const builderState = createUnsavedBuilderState();
    const createReport = vi.fn();
    const listReportsByAssessmentId = vi.fn(() =>
      Promise.reject(new ApiAbortError()),
    );
    const onBuilderStateChange = vi.fn();
    const { result } = renderHook(() =>
      useReportBootstrapController({
        builderState,
        onBuilderStateChange,
        createReport,
        listReportsByAssessmentId,
      }),
    );

    await act(async () => {
      await expect(result.current.bootstrap(assessment)).rejects.toBeInstanceOf(
        ApiAbortError,
      );
    });

    expect(result.current.status).toBe('idle');
    expect(onBuilderStateChange).not.toHaveBeenCalled();
  });
});

describe('createInitialReportTitle', () => {
  it('prefers applicationName and removes separators and control characters', () => {
    expect(createInitialReportTitle(assessment)).toBe(
      'Customer Services Portal Security Report',
    );
  });

  it('falls back to the Assessment title', () => {
    expect(
      createInitialReportTitle({
        id: assessmentId,
        name: 'Payments / API',
      }),
    ).toBe('Payments API Security Report');
  });
});
