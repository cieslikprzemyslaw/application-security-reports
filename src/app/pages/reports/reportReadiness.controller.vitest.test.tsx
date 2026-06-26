import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  createDefaultReportBuilderState,
  updateReportBuilderReportId,
  updateReportBuilderSelection,
} from './reportBuilderState';
import { useReportReadinessController } from './reportReadiness.controller';

import type { ReportBuilderState, ReportReadinessResult } from '~/domain';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const secondThreatId = 'thr_00000000-0000-0000-0000-000000000002';
const reportId = 'rpt_00000000-0000-0000-0000-000000000232';

const createBuilderState = (
  selectedThreatIds = [threatId],
): ReportBuilderState =>
  updateReportBuilderSelection(createDefaultReportBuilderState(companyId), {
    selectedAssessmentId: assessmentId,
    selectedThreatIds,
  });

const readyResult: ReportReadinessResult = {
  errors: [],
  warnings: [],
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

describe('useReportReadinessController', () => {
  it('bootstraps once, deduplicates checks, and exposes backend results', async () => {
    const deferred = createDeferred<ReportReadinessResult>();
    const bootstrapReport = vi.fn().mockResolvedValue(reportId);
    const checkReadiness = vi.fn(() => deferred.promise);
    const { result } = renderHook(() =>
      useReportReadinessController({
        builderState: createBuilderState(),
        assessment: {
          id: assessmentId,
          name: 'Customer Portal',
          applicationName: 'Customer Portal',
        },
        bootstrapReport,
        checkReadiness,
      }),
    );

    let first!: Promise<ReportReadinessResult | undefined>;
    let second!: Promise<ReportReadinessResult | undefined>;

    act(() => {
      first = result.current.check();
      second = result.current.check();
    });

    expect(second).toBe(first);
    expect(result.current.status).toBe('pending');

    await act(async () => {
      deferred.resolve(readyResult);
      await first;
    });

    expect(bootstrapReport).toHaveBeenCalledTimes(1);
    expect(checkReadiness).toHaveBeenCalledTimes(1);
    expect(checkReadiness).toHaveBeenCalledWith(
      reportId,
      expect.objectContaining({
        companyId,
        assessmentId,
        selection: expect.objectContaining({
          threatIds: [threatId],
        }),
      }),
      undefined,
    );
    expect(result.current.status).toBe('success');
    expect(result.current.result).toEqual(readyResult);
    expect(result.current.message).toBe(
      'The Report is ready for finalisation.',
    );
  });

  it('uses an existing Report ID without bootstrapping again', async () => {
    const builderState = updateReportBuilderReportId(
      createBuilderState(),
      reportId,
    );
    const bootstrapReport = vi.fn();
    const checkReadiness = vi.fn().mockResolvedValue(readyResult);
    const { result } = renderHook(() =>
      useReportReadinessController({
        builderState,
        assessment: {
          id: assessmentId,
          name: 'Customer Portal',
        },
        bootstrapReport,
        checkReadiness,
      }),
    );

    await act(async () => {
      await result.current.check();
    });

    expect(bootstrapReport).not.toHaveBeenCalled();
    expect(checkReadiness).toHaveBeenCalledWith(
      reportId,
      expect.any(Object),
      undefined,
    );
  });

  it('does not expose a stale readiness result after the builder changes', async () => {
    const deferred = createDeferred<ReportReadinessResult>();
    const checkReadiness = vi.fn(() => deferred.promise);
    const { result, rerender } = renderHook(
      ({ builderState }: { builderState: ReportBuilderState }) =>
        useReportReadinessController({
          builderState,
          assessment: {
            id: assessmentId,
            name: 'Customer Portal',
          },
          bootstrapReport: vi.fn().mockResolvedValue(reportId),
          checkReadiness,
        }),
      {
        initialProps: {
          builderState: createBuilderState(),
        },
      },
    );

    let request!: Promise<ReportReadinessResult | undefined>;

    act(() => {
      request = result.current.check();
    });

    rerender({
      builderState: createBuilderState([threatId, secondThreatId]),
    });

    await act(async () => {
      deferred.resolve(readyResult);
      await request;
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeUndefined();
  });

  it('returns safe feedback when readiness cannot be loaded', async () => {
    const { result } = renderHook(() =>
      useReportReadinessController({
        builderState: updateReportBuilderReportId(
          createBuilderState(),
          reportId,
        ),
        assessment: {
          id: assessmentId,
          name: 'Customer Portal',
        },
        bootstrapReport: vi.fn(),
        checkReadiness: vi.fn().mockRejectedValue(new Error('database path')),
      }),
    );

    await act(async () => {
      await result.current.check();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.message).toBe('Unable to check Report readiness.');
    expect(result.current.message).not.toContain('database path');
  });
});
