import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '~/services/apiClient';

import {
  createDefaultReportBuilderState,
  updateReportBuilderReportId,
  updateReportBuilderSelection,
} from './reportBuilderState';
import { useReportFinalSaveController } from './reportFinalSave.controller';
import { previewSnapshot } from './reportPreview.testFixtures';

import type {
  CreateFinalReportVersionRequest,
  ReportBuilderState,
  ReportVersionResponse,
  ReportView,
} from '~/domain';
import type { ReportBootstrapAssessment } from './reportBootstrap.controller';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const versionId = 'rvs_00000000-0000-0000-0000-000000000010';

const assessment: ReportBootstrapAssessment = {
  id: assessmentId,
  name: 'Customer Services Portal',
  applicationName: 'Customer Services Portal',
};

const savedVersion: ReportVersionResponse = {
  id: versionId,
  reportId,
  version: 10,
  status: 'final',
  generatedAt: '2026-06-26',
  snapshot: {
    ...previewSnapshot,
    reportTitle: 'Customer Services Portal Security Report',
  },
};

const createUnsavedState = (): ReportBuilderState =>
  updateReportBuilderSelection(createDefaultReportBuilderState(companyId), {
    selectedAssessmentId: assessmentId,
    selectedThreatIds: [threatId],
  });

const createPersistedState = (): ReportBuilderState =>
  updateReportBuilderReportId(createUnsavedState(), reportId);

const createReportView = (latestVersion: number) =>
  ({
    report: {
      latestVersion,
    },
  }) as ReportView;

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

describe('useReportFinalSaveController', () => {
  it('loads the concurrency token, prevents duplicates, and selects the returned final version', async () => {
    const deferred = createDeferred<ReportVersionResponse>();
    const createFinal = vi.fn(
      (
        _reportId: string,
        _input: CreateFinalReportVersionRequest,
        _signal?: AbortSignal,
      ) => deferred.promise,
    );
    const loadReport = vi.fn().mockResolvedValue(createReportView(3));
    const bootstrapReport = vi.fn().mockResolvedValue(reportId);
    const builderState = createPersistedState();
    const { result } = renderHook(() =>
      useReportFinalSaveController({
        builderState,
        assessment,
        bootstrapReport,
        loadReport,
        createFinal,
      }),
    );

    let firstRequest!: Promise<ReportVersionResponse | undefined>;
    let secondRequest!: Promise<ReportVersionResponse | undefined>;

    await act(async () => {
      firstRequest = result.current.save();
      secondRequest = result.current.save();
      await Promise.resolve();
    });

    expect(firstRequest).toBe(secondRequest);
    expect(loadReport).toHaveBeenCalledWith(reportId, undefined);
    expect(createFinal).toHaveBeenCalledTimes(1);
    expect(createFinal.mock.calls[0]?.[0]).toBe(reportId);
    expect(createFinal.mock.calls[0]?.[1]).toEqual({
      companyId,
      assessmentId,
      selection: {
        threatIds: [threatId],
        evidenceIds: [],
      },
      configuration: {
        includeEvidence: false,
      },
      brandingMode: 'issuer',
      expectedLatestVersion: 3,
    });
    expect(bootstrapReport).not.toHaveBeenCalled();
    expect(result.current.status).toBe('pending');

    await act(async () => {
      deferred.resolve(savedVersion);
      await firstRequest;
    });

    expect(result.current.status).toBe('success');
    expect(result.current.selectedVersion).toEqual(savedVersion);
    expect(result.current.message).toBe('Final version saved as v1.0.');
    expect(builderState).toEqual(createPersistedState());
  });

  it('bootstraps an unsaved Report before loading its current version', async () => {
    const bootstrapReport = vi.fn().mockResolvedValue(reportId);
    const loadReport = vi.fn().mockResolvedValue(createReportView(0));
    const createFinal = vi.fn().mockResolvedValue(savedVersion);
    const { result } = renderHook(() =>
      useReportFinalSaveController({
        builderState: createUnsavedState(),
        assessment,
        bootstrapReport,
        loadReport,
        createFinal,
      }),
    );

    await act(async () => {
      await result.current.save();
    });

    expect(bootstrapReport).toHaveBeenCalledWith(assessment, undefined);
    expect(loadReport).toHaveBeenCalledWith(reportId, undefined);
    expect(createFinal.mock.calls[0]?.[1]).toMatchObject({
      expectedLatestVersion: 0,
    });
    expect(result.current.selectedVersion).toEqual(savedVersion);
  });

  it('does not select a stale final version after the builder changes while pending', async () => {
    const deferred = createDeferred<ReportVersionResponse>();
    const createFinal = vi.fn(() => deferred.promise);
    const initialBuilderState = createPersistedState();
    const changedBuilderState = updateReportBuilderSelection(
      initialBuilderState,
      {
        selectedThreatIds: [],
      },
    );
    const { result, rerender } = renderHook(
      ({ builderState }: { builderState: ReportBuilderState }) =>
        useReportFinalSaveController({
          builderState,
          assessment,
          bootstrapReport: vi.fn().mockResolvedValue(reportId),
          loadReport: vi.fn().mockResolvedValue(createReportView(1)),
          createFinal,
        }),
      {
        initialProps: {
          builderState: initialBuilderState,
        },
      },
    );

    let request!: Promise<ReportVersionResponse | undefined>;

    act(() => {
      request = result.current.save();
    });

    act(() => {
      result.current.clearSelectedVersion();
    });
    rerender({ builderState: changedBuilderState });

    await act(async () => {
      deferred.resolve(savedVersion);
      await request;
    });

    expect(result.current.status).toBe('success');
    expect(result.current.selectedVersion).toBeUndefined();
    expect(result.current.message).toBe(
      'Final version saved as v1.0. The builder changed while saving, so the saved version is not selected.',
    );
  });

  it('maps readiness blocks and version conflicts without leaking details', async () => {
    const loadReport = vi.fn().mockResolvedValue(createReportView(1));
    const blockedHook = renderHook(() =>
      useReportFinalSaveController({
        builderState: createPersistedState(),
        assessment,
        bootstrapReport: vi.fn().mockResolvedValue(reportId),
        loadReport,
        createFinal: vi
          .fn()
          .mockRejectedValue(
            new ApiError(
              'C:\\private\\readiness.json',
              409,
              [],
              'REPORT_FINALISATION_BLOCKED',
            ),
          ),
      }),
    );

    await act(async () => {
      await blockedHook.result.current.save();
    });

    expect(blockedHook.result.current.status).toBe('readiness');
    expect(blockedHook.result.current.message).toBe(
      'The Report is not ready for finalisation. Resolve the readiness errors and try again.',
    );
    expect(blockedHook.result.current.message).not.toContain('readiness.json');

    const conflictHook = renderHook(() =>
      useReportFinalSaveController({
        builderState: createPersistedState(),
        assessment,
        bootstrapReport: vi.fn().mockResolvedValue(reportId),
        loadReport,
        createFinal: vi
          .fn()
          .mockRejectedValue(
            new ApiError(
              'C:\\private\\database.sqlite',
              409,
              [],
              'REPORT_VERSION_CONFLICT',
            ),
          ),
      }),
    );

    await act(async () => {
      await conflictHook.result.current.save();
    });

    expect(conflictHook.result.current.status).toBe('conflict');
    expect(conflictHook.result.current.message).toBe(
      'The Report changed while the final version was being saved. Try again.',
    );
    expect(conflictHook.result.current.message).not.toContain(
      'database.sqlite',
    );
  });

  it('exposes safe readiness and generic failure states', async () => {
    const readinessHook = renderHook(() =>
      useReportFinalSaveController({
        builderState: createDefaultReportBuilderState(companyId),
        bootstrapReport: vi.fn().mockResolvedValue(reportId),
        loadReport: vi.fn(),
        createFinal: vi.fn(),
      }),
    );

    await act(async () => {
      await readinessHook.result.current.save();
    });

    expect(readinessHook.result.current.status).toBe('readiness');
    expect(readinessHook.result.current.message).toBe(
      'Select an Assessment before saving a final version.',
    );

    const failureHook = renderHook(() =>
      useReportFinalSaveController({
        builderState: createPersistedState(),
        assessment,
        bootstrapReport: vi.fn().mockResolvedValue(reportId),
        loadReport: vi.fn().mockRejectedValue(new Error('/private/report')),
        createFinal: vi.fn(),
      }),
    );

    await act(async () => {
      await failureHook.result.current.save();
    });

    expect(failureHook.result.current.status).toBe('error');
    expect(failureHook.result.current.message).toBe(
      'Unable to save the final version.',
    );
    expect(failureHook.result.current.message).not.toContain('/private/report');
  });
});
