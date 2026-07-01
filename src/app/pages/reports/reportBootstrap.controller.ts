import { useCallback, useEffect, useRef, useState } from 'react';

import type { AssessmentReportListItem, ReportBuilderState } from '~/domain';
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
export type ReportListByAssessmentId = ReportService['listByAssessmentId'];

interface UseReportBootstrapControllerOptions {
  builderState: ReportBuilderState;
  onBuilderStateChange: (state: ReportBuilderState) => void;
  createReport?: ReportCreator;
  listReportsByAssessmentId?: ReportListByAssessmentId;
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

const hasSameThreatSelection = (
  report: AssessmentReportListItem,
  selectedThreatIds: readonly string[],
): boolean => {
  if (report.selectedThreatIds.length !== selectedThreatIds.length) {
    return false;
  }

  return report.selectedThreatIds.every(
    (threatId, index) => threatId === selectedThreatIds[index],
  );
};

const isReusableReport = (
  report: AssessmentReportListItem,
  assessmentId: string,
  title: string,
  selectedThreatIds: readonly string[],
): boolean =>
  report.assessmentId === assessmentId &&
  report.status !== 'archived' &&
  report.title === title &&
  hasSameThreatSelection(report, selectedThreatIds);

const findReusableReport = (
  reports: readonly AssessmentReportListItem[],
  assessmentId: string,
  title: string,
  selectedThreatIds: readonly string[],
): AssessmentReportListItem | undefined => {
  const reusableReports = reports.filter(report =>
    isReusableReport(report, assessmentId, title, selectedThreatIds),
  );

  return (
    reusableReports.find(report => report.versions.length > 0) ??
    reusableReports[0]
  );
};

export const useReportBootstrapController = ({
  builderState,
  onBuilderStateChange,
  createReport = reportService.create,
  listReportsByAssessmentId = reportService.listByAssessmentId,
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

      // Do not trust route-state reportId blindly. The saved Report may have
      // been deleted or changed in another flow, so resolve it through the
      // Assessment report list below before creating or saving a version.

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

      const reportTitle = createInitialReportTitle(assessment);
      const persistReportId = (reportId: string): string => {
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
          reportId,
        );

        builderStateRef.current = nextBuilderState;
        onBuilderStateChangeRef.current(nextBuilderState);

        setState({
          status: 'success',
          reportId: nextBuilderState.reportId,
        });

        return nextBuilderState.reportId!;
      };

      const pendingRequest = Promise.resolve()
        .then(() =>
          listReportsByAssessmentId(selectedAssessmentId, signal).then(
            reports =>
              findReusableReport(
                reports,
                selectedAssessmentId,
                reportTitle,
                requestSelection.selectedThreatIds,
              ),
          ),
        )
        .then(reusableReport => {
          if (reusableReport) {
            return reusableReport;
          }

          return createReport(
            {
              assessmentId: selectedAssessmentId,
              title: reportTitle,
              selectedThreatIds: requestSelection.selectedThreatIds,
            },
            signal,
          );
        })
        .then(report => persistReportId(report.id))
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
    [createReport, listReportsByAssessmentId],
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
