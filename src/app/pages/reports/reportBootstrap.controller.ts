import { useCallback, useEffect, useRef, useState } from 'react';

import type { ReportBuilderState } from '~/domain';
import type { AssessmentListItem } from '~/services';
import type { ReportService } from '~/services/reportService';
import { ApiAbortError } from '~/services/apiClient';
import { reportService } from '~/services/reportService';

import { updateReportBuilderReportId } from './reportBuilderState';

export type ReportBootstrapControllerStatus =
  | 'idle'
  | 'pending'
  | 'success'
  | 'error';

export interface ReportBootstrapControllerState {
  status: ReportBootstrapControllerStatus;
  reportId?: string;
  errorMessage?: string;
}

export type ReportBootstrapAssessment = Pick<
  AssessmentListItem,
  'id' | 'name' | 'applicationName'
>;

export type ReportCreator = ReportService['create'];

interface UseReportBootstrapControllerOptions {
  builderState: ReportBuilderState;
  onBuilderStateChange: (state: ReportBuilderState) => void;
  createReport?: ReportCreator;
}

const idleState: ReportBootstrapControllerState = {
  status: 'idle',
};

type ReportBootstrapSelectionTarget = Pick<
  ReportBuilderState['selection'],
  'selectedAssessmentId' | 'selectedThreatIds'
>;

const replaceUnsafeControlCharacters = (value: string) =>
  Array.from(value, character => {
    const codePoint = character.codePointAt(0) ?? 0;

    return codePoint <= 0x1f || codePoint === 0x7f ? ' ' : character;
  }).join('');

const normalizeReportTitlePart = (value?: string) =>
  value
    ? replaceUnsafeControlCharacters(value)
        .replace(/[\\/]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : undefined;

export const createInitialReportTitle = (
  assessment: ReportBootstrapAssessment,
) => {
  const titlePart =
    normalizeReportTitlePart(assessment.applicationName) ||
    normalizeReportTitlePart(assessment.name) ||
    'Assessment';

  return `${titlePart} Security Report`;
};

export const useReportBootstrapController = ({
  builderState,
  onBuilderStateChange,
  createReport = reportService.create,
}: UseReportBootstrapControllerOptions) => {
  const builderStateRef = useRef(builderState);
  const onBuilderStateChangeRef = useRef(onBuilderStateChange);
  const pendingRequestRef = useRef<Promise<string> | undefined>(undefined);
  const [state, setState] = useState<ReportBootstrapControllerState>(() =>
    builderState.reportId
      ? {
          status: 'success',
          reportId: builderState.reportId,
        }
      : idleState,
  );

  useEffect(() => {
    builderStateRef.current = builderState;
  }, [builderState]);

  useEffect(() => {
    onBuilderStateChangeRef.current = onBuilderStateChange;
  }, [onBuilderStateChange]);

  const bootstrap = useCallback(
    (
      assessment: ReportBootstrapAssessment,
      signal?: AbortSignal,
    ): Promise<string> => {
      const currentState = builderStateRef.current;

      if (currentState.reportId) {
        const reportId = currentState.reportId;

        setState({
          status: 'success',
          reportId,
        });

        return Promise.resolve(reportId);
      }

      if (pendingRequestRef.current) {
        return pendingRequestRef.current;
      }

      const requestSelection: ReportBootstrapSelectionTarget = {
        selectedAssessmentId: currentState.selection.selectedAssessmentId,
        selectedThreatIds: [...currentState.selection.selectedThreatIds],
      };
      const selectedAssessmentId = requestSelection.selectedAssessmentId;

      if (!selectedAssessmentId) {
        const error = new Error(
          'Select an Assessment before creating the Report.',
        );

        setState({
          status: 'error',
          errorMessage: error.message,
        });

        return Promise.reject(error);
      }

      if (assessment.id !== selectedAssessmentId) {
        const error = new Error('Selected Assessment details are unavailable.');

        setState({
          status: 'error',
          errorMessage: error.message,
        });

        return Promise.reject(error);
      }

      setState({
        status: 'pending',
      });

      let createRequest: ReturnType<ReportCreator>;

      try {
        createRequest = createReport(
          {
            assessmentId: selectedAssessmentId,
            title: createInitialReportTitle(assessment),
            selectedThreatIds: requestSelection.selectedThreatIds,
          },
          signal,
        );
      } catch (error) {
        createRequest = Promise.reject(error);
      }

      const pendingRequest = createRequest
        .then(report => {
          const latestBuilderState = builderStateRef.current;
          const latestSelection =
            latestBuilderState.selection.selectedAssessmentId ===
            currentState.selection.selectedAssessmentId
              ? latestBuilderState.selection
              : currentState.selection;

          const nextBuilderState = updateReportBuilderReportId(
            {
              ...latestBuilderState,
              selection: latestSelection,
            },
            report.id,
          );

          builderStateRef.current = nextBuilderState;
          onBuilderStateChangeRef.current(nextBuilderState);

          setState({
            status: 'success',
            reportId: nextBuilderState.reportId,
          });

          return nextBuilderState.reportId!;
        })
        .catch(error => {
          if (error instanceof ApiAbortError || signal?.aborted) {
            setState(idleState);
            throw error;
          }

          setState({
            status: 'error',
            errorMessage: 'Unable to create the Report.',
          });

          throw error;
        })
        .finally(() => {
          pendingRequestRef.current = undefined;
        });

      pendingRequestRef.current = pendingRequest;

      return pendingRequest;
    },
    [createReport],
  );

  const resolvedState: ReportBootstrapControllerState = builderState.reportId
    ? {
        status: 'success',
        reportId: builderState.reportId,
      }
    : state;

  return {
    ...resolvedState,
    bootstrap,
  };
};
