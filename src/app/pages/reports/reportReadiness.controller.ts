import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  ReportBuilderState,
  ReportPreviewRequest,
  ReportReadinessResult,
} from '~/domain';
import { ApiAbortError } from '~/services/apiClient';
import { reportService, type ReportService } from '~/services/reportService';

import type { ReportBootstrapAssessment } from './reportBootstrap.controller';
import { createReportPreviewRequest } from './reportPreviewRequest';

export type ReportReadinessControllerStatus =
  | 'idle'
  | 'pending'
  | 'success'
  | 'error';

export interface ReportReadinessControllerState {
  status: ReportReadinessControllerStatus;
  result?: ReportReadinessResult;
  message?: string;
}

interface StoredReportReadinessControllerState extends ReportReadinessControllerState {
  requestKey?: string;
}

export type ReportReadinessChecker = ReportService['readiness'];

export type ReportReadinessBootstrapper = (
  assessment: ReportBootstrapAssessment,
  signal?: AbortSignal,
) => Promise<string>;

interface UseReportReadinessControllerOptions {
  builderState: ReportBuilderState;
  assessment?: ReportBootstrapAssessment;
  bootstrapReport: ReportReadinessBootstrapper;
  checkReadiness?: ReportReadinessChecker;
}

const idleState: StoredReportReadinessControllerState = {
  status: 'idle',
};

const createRequestKey = (request: ReportPreviewRequest): string =>
  JSON.stringify(request);

const createSuccessMessage = (result: ReportReadinessResult): string => {
  if (result.errors.length > 0) {
    return `Report readiness found ${result.errors.length} blocking ${
      result.errors.length === 1 ? 'issue' : 'issues'
    }.`;
  }

  if (result.warnings.length > 0) {
    return `Report readiness passed with ${result.warnings.length} ${
      result.warnings.length === 1 ? 'warning' : 'warnings'
    }.`;
  }

  return 'The Report is ready for finalisation.';
};

const restoreStableState = (
  current: StoredReportReadinessControllerState,
): StoredReportReadinessControllerState =>
  current.result
    ? {
        status: 'success',
        requestKey: current.requestKey,
        result: current.result,
        message: createSuccessMessage(current.result),
      }
    : idleState;

export const useReportReadinessController = ({
  builderState,
  assessment,
  bootstrapReport,
  checkReadiness = reportService.readiness,
}: UseReportReadinessControllerOptions) => {
  const builderStateRef = useRef(builderState);
  const assessmentRef = useRef(assessment);
  const pendingRequestRef = useRef<
    Promise<ReportReadinessResult | undefined> | undefined
  >(undefined);
  const [state, setState] =
    useState<StoredReportReadinessControllerState>(idleState);

  useEffect(() => {
    builderStateRef.current = builderState;
  }, [builderState]);

  useEffect(() => {
    assessmentRef.current = assessment;
  }, [assessment]);

  const currentRequest = useMemo(() => {
    try {
      return createReportPreviewRequest(builderState);
    } catch {
      return null;
    }
  }, [builderState]);
  const currentRequestKey = currentRequest
    ? createRequestKey(currentRequest)
    : undefined;

  const check = useCallback(
    (signal?: AbortSignal): Promise<ReportReadinessResult | undefined> => {
      if (pendingRequestRef.current) {
        return pendingRequestRef.current;
      }

      const currentBuilderState = builderStateRef.current;
      const currentAssessment = assessmentRef.current;
      let request: ReportPreviewRequest | null;

      try {
        request = createReportPreviewRequest(currentBuilderState);
      } catch {
        setState({
          status: 'error',
          message:
            'The current report selection cannot be checked. Review the selected data and try again.',
        });
        return Promise.resolve(undefined);
      }

      if (!request) {
        setState({
          status: 'error',
          message: 'Select an Assessment before checking Report readiness.',
        });
        return Promise.resolve(undefined);
      }

      if (!currentBuilderState.reportId && !currentAssessment) {
        setState({
          status: 'error',
          message:
            'Wait for the report preview before checking the first Report version.',
        });
        return Promise.resolve(undefined);
      }

      const requestKey = createRequestKey(request);

      setState(current => ({
        status: 'pending',
        requestKey,
        result: current.requestKey === requestKey ? current.result : undefined,
        message: 'Checking Report readiness…',
      }));

      const pendingRequest = Promise.resolve()
        .then(() =>
          currentBuilderState.reportId
            ? currentBuilderState.reportId
            : bootstrapReport(currentAssessment!, signal),
        )
        .then(reportId => checkReadiness(reportId, request, signal))
        .then(result => {
          let latestRequest: ReportPreviewRequest | null;

          try {
            latestRequest = createReportPreviewRequest(builderStateRef.current);
          } catch {
            latestRequest = null;
          }

          if (
            !latestRequest ||
            createRequestKey(latestRequest) !== requestKey
          ) {
            setState(idleState);
            return undefined;
          }

          setState({
            status: 'success',
            requestKey,
            result,
            message: createSuccessMessage(result),
          });

          return result;
        })
        .catch(error => {
          if (error instanceof ApiAbortError || signal?.aborted) {
            setState(restoreStableState);
            return undefined;
          }

          setState(current => ({
            status: 'error',
            requestKey,
            result:
              current.requestKey === requestKey ? current.result : undefined,
            message: 'Unable to check Report readiness.',
          }));

          return undefined;
        })
        .finally(() => {
          pendingRequestRef.current = undefined;
        });

      pendingRequestRef.current = pendingRequest;

      return pendingRequest;
    },
    [bootstrapReport, checkReadiness],
  );

  const exposedState = useMemo<ReportReadinessControllerState>(() => {
    if (state.status === 'pending') {
      return state;
    }

    if (!currentRequestKey) {
      return state.status === 'error' ? state : idleState;
    }

    if (state.requestKey === currentRequestKey) {
      return state;
    }

    return idleState;
  }, [currentRequestKey, state]);

  return {
    ...exposedState,
    check,
  };
};
