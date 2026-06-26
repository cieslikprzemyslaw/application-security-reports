import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  createDefaultReportBuilderState,
  updateReportBuilderSelection,
} from './reportBuilderState';
import {
  useReportActionsController,
  type ReportReadinessActionController,
  type ReportSaveController,
} from './reportActions.controller';
import { previewSnapshot } from './reportPreview.testFixtures';

import type {
  ReportBuilderState,
  ReportReadinessResult,
  ReportVersionResponse,
} from '~/domain';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const reportId = 'rpt_00000000-0000-0000-0000-000000000233';
const versionId = 'rvs_00000000-0000-0000-0000-000000000233';

const builderState: ReportBuilderState = updateReportBuilderSelection(
  createDefaultReportBuilderState(companyId),
  {
    selectedAssessmentId: assessmentId,
  },
);

const selectedVersion: ReportVersionResponse = {
  id: versionId,
  reportId,
  version: 2,
  status: 'draft',
  generatedAt: '2026-06-26',
  snapshot: {
    ...previewSnapshot,
    reportTitle: 'Customer Portal Security Report',
  },
};

const readyResult: ReportReadinessResult = {
  errors: [],
  warnings: [],
};

const blockedResult: ReportReadinessResult = {
  errors: [
    {
      code: 'THREAT_SELECTION_REQUIRED',
      message: 'Select at least one Threat.',
      target: {
        resourceType: 'report',
        resourceId: reportId,
        field: 'selection.threatIds',
      },
    },
  ],
  warnings: [],
};

const createSaveController = (
  overrides: Partial<ReportSaveController> = {},
): ReportSaveController => ({
  status: 'idle',
  save: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const createReadinessController = (
  overrides: Partial<ReportReadinessActionController> = {},
): ReportReadinessActionController => ({
  status: 'idle',
  check: vi.fn().mockResolvedValue(readyResult),
  ...overrides,
});

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

describe('useReportActionsController', () => {
  it('connects preview navigation, editor return, PDF, and contextual primary actions', () => {
    const retryPreview = vi.fn();
    const clearSelectedVersions = vi.fn();
    const onViewChange = vi.fn();
    const openPdf = vi.fn();
    const draftSaveController = createSaveController();
    const finalSaveController = createSaveController();
    const { result, rerender } = renderHook(
      ({
        activeView,
        version,
      }: {
        activeView: 'data' | 'preview';
        version?: ReportVersionResponse;
      }) =>
        useReportActionsController({
          activeView,
          builderState,
          previewStatus: 'success',
          hasCurrentAssessmentPreview: true,
          selectedVersion: version,
          readinessController: createReadinessController(),
          draftSaveController,
          finalSaveController,
          clearDraftSelectedVersion: vi.fn(),
          clearFinalSelectedVersion: vi.fn(),
          clearSelectedVersions,
          retryPreview,
          onViewChange,
          openPdf,
        }),
      {
        initialProps: {
          activeView: 'data' as 'data' | 'preview',
          version: undefined as ReportVersionResponse | undefined,
        },
      },
    );

    expect(result.current.reportActions.primaryAction).toBe('generatePreview');
    expect(result.current.reportActions.backToEditor).toBeUndefined();
    expect(result.current.reportActions.generatePdf?.isDisabled).toBe(true);

    act(() => {
      result.current.reportActions.generatePreview?.onActivate();
    });

    expect(clearSelectedVersions).toHaveBeenCalledTimes(1);
    expect(retryPreview).toHaveBeenCalledTimes(1);
    expect(onViewChange).toHaveBeenCalledWith('preview', builderState);

    rerender({
      activeView: 'preview',
      version: selectedVersion,
    });

    expect(result.current.reportActions.primaryAction).toBe('generatePdf');

    act(() => {
      result.current.reportActions.generatePdf?.onActivate();
      result.current.reportActions.backToEditor?.onActivate();
    });

    expect(openPdf).toHaveBeenCalledWith(
      'Northstar Digital - Customer Portal Security Report - v0.2',
    );
    expect(onViewChange).toHaveBeenLastCalledWith('data', builderState);
    expect(draftSaveController.save).not.toHaveBeenCalled();
    expect(finalSaveController.save).not.toHaveBeenCalled();
  });

  it('derives accessible disabled reasons without local readiness rules', () => {
    const emptyBuilderState = createDefaultReportBuilderState(companyId);
    const { result } = renderHook(() =>
      useReportActionsController({
        activeView: 'data',
        builderState: emptyBuilderState,
        previewStatus: 'idle',
        hasCurrentAssessmentPreview: false,
        readinessController: createReadinessController(),
        draftSaveController: createSaveController(),
        finalSaveController: createSaveController(),
        clearDraftSelectedVersion: vi.fn(),
        clearFinalSelectedVersion: vi.fn(),
        clearSelectedVersions: vi.fn(),
        retryPreview: vi.fn(),
      }),
    );

    expect(result.current.reportActions.generatePreview?.disabledReason).toBe(
      'Select an Assessment before generating the preview.',
    );
    expect(result.current.reportActions.saveDraft?.disabledReason).toBe(
      'Select an Assessment before saving a draft.',
    );
    expect(result.current.reportActions.saveAsFinal?.disabledReason).toBe(
      'Select an Assessment before saving a final version.',
    );
    expect(result.current.reportActions.generatePdf?.disabledReason).toBe(
      'Save and select a report version before generating a PDF.',
    );
  });

  it('checks readiness before final save and accepts backend warnings', async () => {
    const warningResult: ReportReadinessResult = {
      errors: [],
      warnings: [
        {
          code: 'EVIDENCE_SELECTION_EMPTY',
          message: 'No Evidence is selected.',
          target: {
            resourceType: 'report',
            resourceId: reportId,
            field: 'selection.evidenceIds',
          },
        },
      ],
    };
    const check = vi.fn().mockResolvedValue(warningResult);
    const finalSave = vi.fn().mockResolvedValue(undefined);
    const clearDraftSelectedVersion = vi.fn();
    const { result } = renderHook(() =>
      useReportActionsController({
        activeView: 'preview',
        builderState,
        previewStatus: 'success',
        hasCurrentAssessmentPreview: true,
        readinessController: createReadinessController({ check }),
        draftSaveController: createSaveController(),
        finalSaveController: createSaveController({ save: finalSave }),
        clearDraftSelectedVersion,
        clearFinalSelectedVersion: vi.fn(),
        clearSelectedVersions: vi.fn(),
        retryPreview: vi.fn(),
        onViewChange: vi.fn(),
      }),
    );

    await act(async () => {
      result.current.reportActions.saveAsFinal?.onActivate();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(check).toHaveBeenCalledTimes(1);
    expect(finalSave).toHaveBeenCalledTimes(1);
    expect(clearDraftSelectedVersion).toHaveBeenCalledTimes(1);
  });

  it('blocks final save from backend errors while keeping Draft available', async () => {
    const check = vi.fn().mockResolvedValue(blockedResult);
    const finalSave = vi.fn().mockResolvedValue(undefined);
    const clearDraftSelectedVersion = vi.fn();
    const { result, rerender } = renderHook(
      ({ readiness }: { readiness: ReportReadinessActionController }) =>
        useReportActionsController({
          activeView: 'preview',
          builderState,
          previewStatus: 'success',
          hasCurrentAssessmentPreview: true,
          readinessController: readiness,
          draftSaveController: createSaveController(),
          finalSaveController: createSaveController({ save: finalSave }),
          clearDraftSelectedVersion,
          clearFinalSelectedVersion: vi.fn(),
          clearSelectedVersions: vi.fn(),
          retryPreview: vi.fn(),
          onViewChange: vi.fn(),
        }),
      {
        initialProps: {
          readiness: createReadinessController({ check }),
        },
      },
    );

    await act(async () => {
      result.current.reportActions.saveAsFinal?.onActivate();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(finalSave).not.toHaveBeenCalled();
    expect(clearDraftSelectedVersion).not.toHaveBeenCalled();

    rerender({
      readiness: createReadinessController({
        status: 'success',
        result: blockedResult,
        message: 'Report readiness found 1 blocking issue.',
        check,
      }),
    });

    expect(result.current.reportActions.saveAsFinal?.isDisabled).toBe(true);
    expect(result.current.reportActions.saveAsFinal?.disabledReason).toBe(
      'Resolve the blocking Report readiness issues before saving a final version.',
    );
    expect(result.current.reportActions.saveDraft?.isDisabled).toBe(false);
    expect(result.current.reportActionStatus).toEqual({
      message: 'Report readiness found 1 blocking issue.',
      role: 'alert',
    });
  });

  it('prevents Draft and Final from starting together in the same tick', async () => {
    const draftDeferred = createDeferred<ReportVersionResponse | undefined>();
    const draftSave = vi.fn(() => draftDeferred.promise);
    const finalSave = vi.fn().mockResolvedValue(undefined);
    const check = vi.fn().mockResolvedValue(readyResult);
    const { result } = renderHook(() =>
      useReportActionsController({
        activeView: 'preview',
        builderState,
        previewStatus: 'success',
        hasCurrentAssessmentPreview: true,
        readinessController: createReadinessController({ check }),
        draftSaveController: createSaveController({ save: draftSave }),
        finalSaveController: createSaveController({ save: finalSave }),
        clearDraftSelectedVersion: vi.fn(),
        clearFinalSelectedVersion: vi.fn(),
        clearSelectedVersions: vi.fn(),
        retryPreview: vi.fn(),
        onViewChange: vi.fn(),
      }),
    );

    act(() => {
      result.current.reportActions.saveDraft?.onActivate();
      result.current.reportActions.saveAsFinal?.onActivate();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(draftSave).toHaveBeenCalledTimes(1);
    expect(check).not.toHaveBeenCalled();
    expect(finalSave).not.toHaveBeenCalled();

    await act(async () => {
      draftDeferred.resolve(undefined);
      await draftDeferred.promise;
    });

    await act(async () => {
      result.current.reportActions.saveAsFinal?.onActivate();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(check).toHaveBeenCalledTimes(1);
    expect(finalSave).toHaveBeenCalledTimes(1);
  });
});
