import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ReportBuilderState, ReportPreviewSnapshot } from '~/domain';
import { ApiAbortError } from '~/services/apiClient';
import { reportService } from '~/services/reportService';

import { createReportPreviewRequest } from './reportPreviewRequest';

export type ReportPreviewControllerStatus =
  | 'idle'
  | 'pending'
  | 'success'
  | 'error';

export interface ReportPreviewControllerState {
  status: ReportPreviewControllerStatus;
  snapshot?: ReportPreviewSnapshot;
  errorMessage?: string;
}

export type ReportPreviewLoader = typeof reportService.preview;

const initialState: ReportPreviewControllerState = {
  status: 'idle',
};

export const useReportPreviewController = (
  builderState: ReportBuilderState,
  loadPreview: ReportPreviewLoader = reportService.preview,
) => {
  const request = useMemo(
    () => createReportPreviewRequest(builderState),
    [builderState],
  );
  const [state, setState] =
    useState<ReportPreviewControllerState>(initialState);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!request) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const load = async () => {
      await Promise.resolve();

      if (!isActive) {
        return;
      }

      setState(current => ({
        status: 'pending',
        snapshot:
          current.snapshot?.assessment.id === request.assessmentId
            ? current.snapshot
            : undefined,
      }));

      try {
        const snapshot = await loadPreview(request, controller.signal);

        if (!isActive) {
          return;
        }

        setState({
          status: 'success',
          snapshot,
        });
      } catch (error) {
        if (!isActive || error instanceof ApiAbortError) {
          return;
        }

        setState(current => ({
          status: 'error',
          snapshot: current.snapshot,
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Unable to generate the report preview.',
        }));
      }
    };

    void load();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [loadPreview, request, retryKey]);

  const retry = useCallback(() => {
    setRetryKey(current => current + 1);
  }, []);

  return {
    ...(request ? state : initialState),
    retry,
  };
};
