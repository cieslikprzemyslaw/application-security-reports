import { useCallback, useEffect, useRef, useState } from 'react';

import type { ReportBuilderState, ReportVersionResponse } from '~/domain';
import { ApiAbortError, ApiError } from '~/services/apiClient';
import {
  reportVersionService,
  type ReportVersionService,
} from '~/services/reportVersionService';

import type { ReportBootstrapAssessment } from './reportBootstrap.controller';
import { createReportPreviewRequest } from './reportPreviewRequest';

export type ReportDraftSaveStatus =
  | 'idle'
  | 'pending'
  | 'success'
  | 'conflict'
  | 'readiness'
  | 'error';

export interface ReportDraftSaveControllerState {
  status: ReportDraftSaveStatus;
  selectedVersion?: ReportVersionResponse;
  message?: string;
}

export type ReportDraftCreator = ReportVersionService['createDraft'];

export type ReportDraftBootstrapper = (
  assessment: ReportBootstrapAssessment,
  signal?: AbortSignal,
) => Promise<string>;

interface UseReportDraftSaveControllerOptions {
  builderState: ReportBuilderState;
  assessment?: ReportBootstrapAssessment;
  bootstrapReport: ReportDraftBootstrapper;
  createDraft?: ReportDraftCreator;
}

const initialState: ReportDraftSaveControllerState = {
  status: 'idle',
};

const formatReportVersionNumber = (version: number): string => {
  const major = Math.floor(version / 10);
  const minor = version % 10;

  return `${major}.${minor}`;
};

const isConflictError = (error: unknown): error is ApiError =>
  error instanceof ApiError &&
  (error.status === 409 ||
    error.code === 'REPORT_VERSION_CONFLICT' ||
    error.code === 'REPORT_VERSION_SEQUENCE_EXHAUSTED');

const isReadinessError = (error: unknown): error is ApiError =>
  error instanceof ApiError &&
  (error.status === 400 ||
    error.status === 404 ||
    error.code === 'VALIDATION_ERROR');

const restoreStableState = (
  current: ReportDraftSaveControllerState,
): ReportDraftSaveControllerState =>
  current.selectedVersion
    ? {
        status: 'success',
        selectedVersion: current.selectedVersion,
      }
    : initialState;

export const useReportDraftSaveController = ({
  builderState,
  assessment,
  bootstrapReport,
  createDraft = reportVersionService.createDraft,
}: UseReportDraftSaveControllerOptions) => {
  const builderStateRef = useRef(builderState);
  const assessmentRef = useRef(assessment);
  const pendingRequestRef = useRef<
    Promise<ReportVersionResponse | undefined> | undefined
  >(undefined);
  const [state, setState] =
    useState<ReportDraftSaveControllerState>(initialState);

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
      let request;

      try {
        request = createReportPreviewRequest(currentBuilderState);
      } catch {
        setState(current => ({
          status: 'readiness',
          selectedVersion: current.selectedVersion,
          message:
            'The current report selection cannot be saved. Review the selected data and try again.',
        }));

        return Promise.resolve(undefined);
      }

      if (!request) {
        setState(current => ({
          status: 'readiness',
          selectedVersion: current.selectedVersion,
          message: 'Select an Assessment before saving a draft.',
        }));

        return Promise.resolve(undefined);
      }

      if (!currentBuilderState.reportId && !currentAssessment) {
        setState(current => ({
          status: 'readiness',
          selectedVersion: current.selectedVersion,
          message: 'Wait for the report preview before saving the first draft.',
        }));

        return Promise.resolve(undefined);
      }

      setState(current => ({
        status: 'pending',
        selectedVersion: current.selectedVersion,
        message: 'Saving draft…',
      }));

      const pendingRequest = Promise.resolve()
        .then(() =>
          currentBuilderState.reportId
            ? currentBuilderState.reportId
            : bootstrapReport(currentAssessment!, signal),
        )
        .then(reportId => createDraft(reportId, request, signal))
        .then(version => {
          setState({
            status: 'success',
            selectedVersion: version,
            message: `Draft saved as v${formatReportVersionNumber(
              version.version,
            )}.`,
          });

          return version;
        })
        .catch(error => {
          if (error instanceof ApiAbortError || signal?.aborted) {
            setState(restoreStableState);
            return undefined;
          }

          if (isConflictError(error)) {
            setState(current => ({
              status: 'conflict',
              selectedVersion: current.selectedVersion,
              message:
                error.code === 'REPORT_VERSION_SEQUENCE_EXHAUSTED'
                  ? 'The draft version sequence is exhausted.'
                  : 'The Report changed while the draft was being saved. Try again.',
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
            message: 'Unable to save the draft.',
          }));

          return undefined;
        })
        .finally(() => {
          pendingRequestRef.current = undefined;
        });

      pendingRequestRef.current = pendingRequest;

      return pendingRequest;
    },
    [bootstrapReport, createDraft],
  );

  const clearSelectedVersion = useCallback(() => {
    if (pendingRequestRef.current) {
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
