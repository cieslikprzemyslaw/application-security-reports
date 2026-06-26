import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  createDefaultReportBuilderState,
  updateReportBuilderSelection,
} from './reportBuilderState';
import {
  useReportActionsController,
  type ReportSaveController,
} from './reportActions.controller';
import { previewSnapshot } from './reportPreview.testFixtures';

import type { ReportBuilderState, ReportVersionResponse } from '~/domain';

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

const createSaveController = (
  overrides: Partial<ReportSaveController> = {},
): ReportSaveController => ({
  status: 'idle',
  save: vi.fn().mockResolvedValue(undefined),
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
    expect(result.current.reportActions.generatePdf?.disabledReason).toBe(
      'Save and select a report version before generating a PDF.',
    );

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
    expect(result.current.reportActions.backToEditor).toBeDefined();
    expect(result.current.reportActions.generatePdf?.isDisabled).toBe(false);

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

  it('derives accessible disabled reasons without duplicating readiness rules', () => {
    const emptyBuilderState = createDefaultReportBuilderState(companyId);
    const { result } = renderHook(() =>
      useReportActionsController({
        activeView: 'data',
        builderState: emptyBuilderState,
        previewStatus: 'idle',
        hasCurrentAssessmentPreview: false,
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

  it('prevents draft and final saves from starting together in the same tick', async () => {
    const draftDeferred = createDeferred<ReportVersionResponse | undefined>();
    const draftSave = vi.fn(() => draftDeferred.promise);
    const finalSave = vi.fn().mockResolvedValue(undefined);
    const clearDraftSelectedVersion = vi.fn();
    const clearFinalSelectedVersion = vi.fn();
    const { result } = renderHook(() =>
      useReportActionsController({
        activeView: 'preview',
        builderState,
        previewStatus: 'success',
        hasCurrentAssessmentPreview: true,
        draftSaveController: createSaveController({
          save: draftSave,
        }),
        finalSaveController: createSaveController({
          save: finalSave,
        }),
        clearDraftSelectedVersion,
        clearFinalSelectedVersion,
        clearSelectedVersions: vi.fn(),
        retryPreview: vi.fn(),
        onViewChange: vi.fn(),
      }),
    );

    act(() => {
      result.current.reportActions.saveDraft?.onActivate();
      result.current.reportActions.saveAsFinal?.onActivate();
    });

    expect(draftSave).toHaveBeenCalledTimes(1);
    expect(finalSave).not.toHaveBeenCalled();
    expect(clearFinalSelectedVersion).toHaveBeenCalledTimes(1);
    expect(clearDraftSelectedVersion).not.toHaveBeenCalled();

    await act(async () => {
      draftDeferred.resolve(undefined);
      await draftDeferred.promise;
    });

    act(() => {
      result.current.reportActions.saveAsFinal?.onActivate();
    });

    expect(finalSave).toHaveBeenCalledTimes(1);
    expect(clearDraftSelectedVersion).toHaveBeenCalledTimes(1);
  });

  it('maps save feedback to polite status or alert semantics', () => {
    const successHook = renderHook(() =>
      useReportActionsController({
        activeView: 'preview',
        builderState,
        previewStatus: 'success',
        hasCurrentAssessmentPreview: true,
        draftSaveController: createSaveController({
          status: 'success',
          message: 'Draft saved as v0.1.',
        }),
        finalSaveController: createSaveController(),
        clearDraftSelectedVersion: vi.fn(),
        clearFinalSelectedVersion: vi.fn(),
        clearSelectedVersions: vi.fn(),
        retryPreview: vi.fn(),
        onViewChange: vi.fn(),
      }),
    );

    expect(successHook.result.current.reportActionStatus).toEqual({
      message: 'Draft saved as v0.1.',
      role: 'status',
    });

    const readinessHook = renderHook(() =>
      useReportActionsController({
        activeView: 'preview',
        builderState,
        previewStatus: 'success',
        hasCurrentAssessmentPreview: true,
        draftSaveController: createSaveController(),
        finalSaveController: createSaveController({
          status: 'readiness',
          message: 'The Report is not ready for finalisation.',
        }),
        clearDraftSelectedVersion: vi.fn(),
        clearFinalSelectedVersion: vi.fn(),
        clearSelectedVersions: vi.fn(),
        retryPreview: vi.fn(),
        onViewChange: vi.fn(),
      }),
    );

    expect(readinessHook.result.current.reportActionStatus).toEqual({
      message: 'The Report is not ready for finalisation.',
      role: 'alert',
    });
  });
});
