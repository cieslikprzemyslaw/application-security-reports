import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  ReportBuilderState,
  ReportPreviewRequest,
  ReportVersionResponse,
} from '~/domain';
import { ApiAbortError, ApiError } from '~/services/apiClient';
import { reportService, type ReportService } from '~/services/reportService';
import {
  reportVersionService,
  type ReportVersionService,
} from '~/services/reportVersionService';

import type { ReportBootstrapAssessment } from './reportBootstrap.controller';
import { createReportPreviewRequest } from './reportPreviewRequest';

export type ReportFinalSaveStatus =
  | 'idle'
  | 'pending'
  | 'success'
  | 'conflict'
  | 'readiness'
  | 'error';

export interface ReportFinalSaveControllerState {
  status: ReportFinalSaveStatus;
  selectedVersion?: ReportVersionResponse;
  message?: string;
}

export type ReportFinalCreator = ReportVersionService['createFinal'];
export type ReportFinalReportLoader = ReportService['getById'];

export type ReportFinalBootstrapper = (
  assessment: ReportBootstrapAssessment,
  signal?: AbortSignal,
) => Promise<string>;

interface UseReportFinalSaveControllerOptions {
  builderState: ReportBuilderState;
  assessment?: ReportBootstrapAssessment;
  bootstrapReport: ReportFinalBootstrapper;
  loadReport?: ReportFinalReportLoader;
  createFinal?: ReportFinalCreator;
}

const initialState: ReportFinalSaveControllerState = {
  status: 'idle',
};

const formatReportVersionNumber = (version: number): string => {
  const major = Math.floor(version / 10);
  const minor = version % 10;

  return `${major}.${minor}`;
};

const createRequestKey = (request: ReportPreviewRequest): string =>
  JSON.stringify(request);

const isFinalisationBlockedError = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.code === 'REPORT_FINALISATION_BLOCKED';

const isConflictError = (error: unknown): error is ApiError =>
  error instanceof ApiError &&
  (error.code === 'REPORT_VERSION_CONFLICT' ||
    error.code === 'REPORT_VERSION_SEQUENCE_EXHAUSTED' ||
    (error.status === 409 && !isFinalisationBlockedError(error)));

const isReadinessError = (error: unknown): error is ApiError =>
  error instanceof ApiError &&
  (error.status === 400 ||
    error.status === 404 ||
    error.code === 'VALIDATION_ERROR' ||
    error.code === 'REPORT_NOT_FOUND');

const restoreStableState = (
  current: ReportFinalSaveControllerState,
): ReportFinalSaveControllerState =>
  current.selectedVersion
    ? {
        status: 'success',
        selectedVersion: current.selectedVersion,
      }
    : initialState;

export const useReportFinalSaveController = ({
  builderState,
  assessment,
  bootstrapReport,
  loadReport = reportService.getById,
  createFinal = reportVersionService.createFinal,
}: UseReportFinalSaveControllerOptions) => {
  const builderStateRef = useRef(builderState);
  const assessmentRef = useRef(assessment);
  const pendingRequestRef = useRef<
    Promise<ReportVersionResponse | undefined> | undefined
  >(undefined);
  const [state, setState] =
    useState<ReportFinalSaveControllerState>(initialState);

  useEffect(() => {
    builderStateRef.current = builderState;
  }, [builderState]);

  useEffect(() => {
    assessmentRef.current = assessment;
  }, [assessment]);

  const save = useCallback(
    (signal?: AbortSignal): Promise<ReportVersionResponse | undefined> => {
      if (pendingRequestRef.current) {
        return pendingRequestRef.current;
      }

      const currentBuilderState = builderStateRef.current;
      const currentAssessment = assessmentRef.current;
      let request: ReportPreviewRequest | null;

      try {
        request = createReportPreviewRequest(currentBuilderState);
      } catch {
        setState(current => ({
          status: 'readiness',
          selectedVersion: current.selectedVersion,
          message:
            'The current report selection cannot be finalised. Review the selected data and try again.',
        }));

        return Promise.resolve(undefined);
      }

      if (!request) {
        setState(current => ({
          status: 'readiness',
          selectedVersion: current.selectedVersion,
          message: 'Select an Assessment before saving a final version.',
        }));

        return Promise.resolve(undefined);
      }

      if (!currentBuilderState.reportId && !currentAssessment) {
        setState(current => ({
          status: 'readiness',
          selectedVersion: current.selectedVersion,
          message:
            'Wait for the report preview before saving the first final version.',
        }));

        return Promise.resolve(undefined);
      }

      const requestKey = createRequestKey(request);

      setState(current => ({
        status: 'pending',
        selectedVersion: current.selectedVersion,
        message: 'Saving final version…',
      }));

      const pendingRequest = Promise.resolve()
        .then(() =>
          currentBuilderState.reportId
            ? currentBuilderState.reportId
            : bootstrapReport(currentAssessment!, signal),
        )
        .then(async reportId => {
          const reportView = await loadReport(reportId, signal);

          return createFinal(
            reportId,
            {
              ...request,
              expectedLatestVersion: reportView.report.latestVersion,
            },
            signal,
          );
        })
        .then(version => {
          let latestRequest: ReportPreviewRequest | null;

          try {
            latestRequest = createReportPreviewRequest(builderStateRef.current);
          } catch {
            latestRequest = null;
          }

          const versionLabel = `v${formatReportVersionNumber(version.version)}`;

          if (
            !latestRequest ||
            createRequestKey(latestRequest) !== requestKey
          ) {
            setState({
              status: 'success',
              message: `Final version saved as ${versionLabel}. The builder changed while saving, so the saved version is not selected.`,
            });

            return version;
          }

          setState({
            status: 'success',
            selectedVersion: version,
            message: `Final version saved as ${versionLabel}.`,
          });

          return version;
        })
        .catch(error => {
          if (error instanceof ApiAbortError || signal?.aborted) {
            setState(restoreStableState);
            return undefined;
          }

          if (isFinalisationBlockedError(error)) {
            setState(current => ({
              status: 'readiness',
              selectedVersion: current.selectedVersion,
              message:
                'The Report is not ready for finalisation. Resolve the readiness errors and try again.',
            }));

            return undefined;
          }

          if (isConflictError(error)) {
            setState(current => ({
              status: 'conflict',
              selectedVersion: current.selectedVersion,
              message:
                error.code === 'REPORT_VERSION_SEQUENCE_EXHAUSTED'
                  ? 'The final version sequence is exhausted.'
                  : 'The Report changed while the final version was being saved. Try again.',
            }));

            return undefined;
          }

          if (isReadinessError(error)) {
            setState(current => ({
              status: 'readiness',
              selectedVersion: current.selectedVersion,
              message:
                'The current report data is no longer available or valid. Review the selection and try again.',
            }));

            return undefined;
          }

          setState(current => ({
            status: 'error',
            selectedVersion: current.selectedVersion,
            message: 'Unable to save the final version.',
          }));

          return undefined;
        })
        .finally(() => {
          pendingRequestRef.current = undefined;
        });

      pendingRequestRef.current = pendingRequest;

      return pendingRequest;
    },
    [bootstrapReport, createFinal, loadReport],
  );

  const clearSelectedVersion = useCallback(() => {
    if (pendingRequestRef.current) {
      setState(current => ({
        status: 'pending',
        message: current.message ?? 'Saving final version…',
      }));
      return;
    }

    setState(initialState);
  }, []);

  return {
    ...state,
    save,
    clearSelectedVersion,
  };
};
