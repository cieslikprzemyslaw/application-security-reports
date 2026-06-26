import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '~/services/apiClient';

import {
  createDefaultReportBuilderState,
  updateReportBuilderReportId,
  updateReportBuilderSelection,
} from './reportBuilderState';
import { useReportDraftSaveController } from './reportDraftSave.controller';
import { previewSnapshot } from './reportPreview.testFixtures';

import type { ReportBuilderState, ReportVersionResponse } from '~/domain';
import type { ReportBootstrapAssessment } from './reportBootstrap.controller';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const versionId = 'rvs_00000000-0000-0000-0000-000000000001';

const assessment: ReportBootstrapAssessment = {
  id: assessmentId,
  name: 'Customer Services Portal',
  applicationName: 'Customer Services Portal',
};

const savedVersion: ReportVersionResponse = {
  id: versionId,
  reportId,
  version: 1,
  status: 'draft',
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

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

describe('useReportDraftSaveController', () => {
  it('prevents duplicate saves and selects the returned immutable version', async () => {
    const deferred = createDeferred<ReportVersionResponse>();
    const createDraft = vi.fn(() => deferred.promise);
    const bootstrapReport = vi.fn();
    const builderState = createPersistedState();
    const { result } = renderHook(() =>
      useReportDraftSaveController({
        builderState,
        assessment,
        bootstrapReport,
        createDraft,
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
    expect(createDraft).toHaveBeenCalledTimes(1);
    expect(bootstrapReport).not.toHaveBeenCalled();
    expect(result.current.status).toBe('pending');

    await act(async () => {
      deferred.resolve(savedVersion);
      await firstRequest;
    });

    expect(result.current.status).toBe('success');
    expect(result.current.selectedVersion).toEqual(savedVersion);
    expect(result.current.message).toBe('Draft saved as v0.1.');
    expect(builderState).toEqual(createPersistedState());
  });

  it('does not select a stale saved version after the builder changes while pending', async () => {
    const deferred = createDeferred<ReportVersionResponse>();
    const createDraft = vi.fn(() => deferred.promise);
    const initialBuilderState = createPersistedState();
    const changedBuilderState = updateReportBuilderSelection(
      initialBuilderState,
      {
        selectedThreatIds: [],
      },
    );
    const { result, rerender } = renderHook(
      ({ builderState }: { builderState: ReportBuilderState }) =>
        useReportDraftSaveController({
          builderState,
          assessment,
          bootstrapReport: vi.fn(),
          createDraft,
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
      'Draft saved as v0.1. The builder changed while saving, so the saved version is not selected.',
    );
    expect(changedBuilderState.selection.selectedThreatIds).toEqual([]);
  });
  it('bootstraps an unsaved Report once before creating its first draft', async () => {
    const bootstrapReport = vi.fn().mockResolvedValue(reportId);
    const createDraft = vi.fn().mockResolvedValue(savedVersion);
    const builderState = createUnsavedState();
    const { result } = renderHook(() =>
      useReportDraftSaveController({
        builderState,
        assessment,
        bootstrapReport,
        createDraft,
      }),
    );

    await act(async () => {
      await result.current.save();
    });

    expect(bootstrapReport).toHaveBeenCalledTimes(1);
    expect(bootstrapReport).toHaveBeenCalledWith(assessment, undefined);
    expect(createDraft).toHaveBeenCalledTimes(1);
    expect(createDraft.mock.calls[0]?.[0]).toBe(reportId);
    expect(createDraft.mock.calls[0]?.[1]).toEqual({
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
    });
    expect(result.current.selectedVersion).toEqual(savedVersion);
  });

  it('maps conflicts safely and preserves the current builder state', async () => {
    const builderState = createPersistedState();
    const createDraft = vi
      .fn()
      .mockRejectedValue(
        new ApiError(
          'C:\\private\\database.sqlite',
          409,
          [],
          'REPORT_VERSION_CONFLICT',
        ),
      );
    const { result } = renderHook(() =>
      useReportDraftSaveController({
        builderState,
        assessment,
        bootstrapReport: vi.fn(),
        createDraft,
      }),
    );

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.status).toBe('conflict');
    expect(result.current.message).toBe(
      'The Report changed while the draft was being saved. Try again.',
    );
    expect(result.current.message).not.toContain('database.sqlite');
    expect(builderState).toEqual(createPersistedState());
  });

  it('exposes readiness and generic failure states without leaking details', async () => {
    const missingAssessmentState = createDefaultReportBuilderState(companyId);
    const createDraft = vi.fn();
    const bootstrapReport = vi.fn();
    const readinessHook = renderHook(() =>
      useReportDraftSaveController({
        builderState: missingAssessmentState,
        bootstrapReport,
        createDraft,
      }),
    );

    await act(async () => {
      await readinessHook.result.current.save();
    });

    expect(readinessHook.result.current.status).toBe('readiness');
    expect(readinessHook.result.current.message).toBe(
      'Select an Assessment before saving a draft.',
    );
    expect(createDraft).not.toHaveBeenCalled();
    expect(bootstrapReport).not.toHaveBeenCalled();

    const failureHook = renderHook(() =>
      useReportDraftSaveController({
        builderState: createPersistedState(),
        assessment,
        bootstrapReport,
        createDraft: vi.fn().mockRejectedValue(new Error('/private/secret')),
      }),
    );

    await act(async () => {
      await failureHook.result.current.save();
    });

    expect(failureHook.result.current.status).toBe('error');
    expect(failureHook.result.current.message).toBe(
      'Unable to save the draft.',
    );
    expect(failureHook.result.current.message).not.toContain('/private/secret');
  });
});
