import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  ReportBuilderState,
  ReportPreviewRequest,
  ReportPreviewSnapshot,
} from '~/domain';
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

interface StoredReportPreviewControllerState extends ReportPreviewControllerState {
  requestKey?: string;
}

export type ReportPreviewLoader = typeof reportService.preview;

const initialState: ReportPreviewControllerState = {
  status: 'idle',
};

const createRequestKey = (request: ReportPreviewRequest | null) =>
  request ? JSON.stringify(request) : undefined;

const toPendingState = (
  current: StoredReportPreviewControllerState,
  request: ReportPreviewRequest,
  requestKey: string,
): StoredReportPreviewControllerState => ({
  status: 'pending',
  requestKey,
  snapshot:
    current.snapshot?.assessment.id === request.assessmentId
      ? current.snapshot
      : undefined,
});

export const useReportPreviewController = (
  builderState: ReportBuilderState,
  loadPreview: ReportPreviewLoader = reportService.preview,
) => {
  const request = useMemo(
    () => createReportPreviewRequest(builderState),
    [builderState],
  );
  const requestKey = useMemo(() => createRequestKey(request), [request]);
  const [state, setState] =
    useState<StoredReportPreviewControllerState>(initialState);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!request || !requestKey) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    void loadPreview(request, controller.signal)
      .then(snapshot => {
        if (!isActive) {
          return;
        }

        setState({
          status: 'success',
          requestKey,
          snapshot,
        });
      })
      .catch(error => {
        if (!isActive || error instanceof ApiAbortError) {
          return;
        }

        setState(current => ({
          status: 'error',
          requestKey,
          snapshot:
            current.snapshot?.assessment.id === request.assessmentId
              ? current.snapshot
              : undefined,
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Unable to generate the report preview.',
        }));
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [loadPreview, request, requestKey, retryKey]);

  const retry = useCallback(() => {
    if (!request || !requestKey) {
      return;
    }

    setState(current => toPendingState(current, request, requestKey));
    setRetryKey(current => current + 1);
  }, [request, requestKey]);

  const exposedState = useMemo<ReportPreviewControllerState>(() => {
    if (!request || !requestKey) {
      return initialState;
    }

    if (state.requestKey === requestKey) {
      return state;
    }

    return {
      status: 'pending',
      snapshot:
        state.snapshot?.assessment.id === request.assessmentId
          ? state.snapshot
          : undefined,
    };
  }, [request, requestKey, state]);

  return {
    ...exposedState,
    retry,
  };
};
