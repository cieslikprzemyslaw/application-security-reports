import { useEffect, useState } from 'react';

import type { ReportVersionResponse } from '~/domain';
import {
  reportRouteParamsSchema,
  reportVersionRouteParamsSchema,
} from '~/domain/schemas';
import { ApiAbortError, ApiError } from '~/services/apiClient';
import {
  reportVersionService,
  type ReportVersionService,
} from '~/services/reportVersionService';

export type ReportDetailsStatus =
  | 'pending'
  | 'success'
  | 'empty'
  | 'not-found'
  | 'error';

export type ReportDetailsNotFoundEntity = 'Report' | 'Report version';

export interface ReportDetailsControllerState {
  status: ReportDetailsStatus;
  version?: ReportVersionResponse;
  notFoundEntity?: ReportDetailsNotFoundEntity;
}

interface StoredReportDetailsControllerState extends ReportDetailsControllerState {
  requestKey: string;
}

export type ReportDetailsVersionLoader = Pick<
  ReportVersionService,
  'list' | 'getById'
>;

const initialState: ReportDetailsControllerState = {
  status: 'pending',
};

const createRequestKey = (reportId: string, versionId?: string): string =>
  `${reportId}:${versionId ?? 'latest'}`;

export const loadReportDetailsVersion = async (
  reportId: string,
  versionId: string | undefined,
  service: ReportDetailsVersionLoader = reportVersionService,
  signal?: AbortSignal,
): Promise<ReportVersionResponse | null> => {
  if (versionId) {
    const params = reportVersionRouteParamsSchema.parse({
      id: reportId,
      versionId,
    });

    return service.getById(params.id, params.versionId, signal);
  }

  const params = reportRouteParamsSchema.parse({ id: reportId });
  const versions = await service.list(params.id, signal);

  return versions.length > 0 ? versions[versions.length - 1] : null;
};

const getNotFoundEntity = (
  error: unknown,
): ReportDetailsNotFoundEntity | undefined => {
  if (!(error instanceof ApiError) || error.status !== 404) {
    return undefined;
  }

  return error.code === 'REPORT_NOT_FOUND' ? 'Report' : 'Report version';
};

export const useReportDetailsController = (
  reportId: string,
  versionId?: string,
  service: ReportDetailsVersionLoader = reportVersionService,
): ReportDetailsControllerState => {
  const requestKey = createRequestKey(reportId, versionId);
  const [state, setState] = useState<StoredReportDetailsControllerState>(
    () => ({
      status: 'pending',
      requestKey,
    }),
  );

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    void loadReportDetailsVersion(
      reportId,
      versionId,
      service,
      controller.signal,
    )
      .then(version => {
        if (!isActive) {
          return;
        }

        if (!version) {
          setState({
            status: 'empty',
            notFoundEntity: 'Report version',
            requestKey,
          });
          return;
        }

        setState({
          status: 'success',
          version,
          requestKey,
        });
      })
      .catch(error => {
        if (!isActive || error instanceof ApiAbortError) {
          return;
        }

        const notFoundEntity = getNotFoundEntity(error);

        setState(
          notFoundEntity
            ? {
                status: 'not-found',
                notFoundEntity,
                requestKey,
              }
            : {
                status: 'error',
                requestKey,
              },
        );
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [reportId, requestKey, service, versionId]);

  return state.requestKey === requestKey ? state : initialState;
};
