import { Router, type Response } from 'express';
import { z } from 'zod';

import type {
  ReportVersion,
  ReportVersionResponse,
} from '../../src/domain/report.js';
import {
  reportRouteParamsSchema,
  reportVersionResponseSchema,
  reportVersionRouteParamsSchema,
} from '../../src/domain/schemas/index.js';
import { RepositoryError } from '../database/errors.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { ReportVersionRepository } from '../database/repositories/reportVersion.repository.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import { asyncRoute } from './settings.route.shared.js';

export interface ReportVersionReadRouteRepositories {
  reportRepository: Pick<ReportRepository, 'findById'>;
  reportVersionRepository: Pick<
    ReportVersionRepository,
    'findById' | 'findByReportId'
  >;
}

const reportVersionListResponseSchema = z.array(reportVersionResponseSchema);

const toReportVersionResponse = (
  version: ReportVersion,
): ReportVersionResponse => {
  const { filePath: _filePath, ...response } = version;
  return response;
};

const sendReportVersionResponse = (
  res: Response,
  version: ReportVersion,
): Response =>
  res.status(200).json({
    data: reportVersionResponseSchema.parse(toReportVersionResponse(version)),
  });

const handleRepositoryError = (error: unknown, res: Response): boolean => {
  if (error instanceof RepositoryError) {
    console.error('Unexpected ReportVersion repository error', error);
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Unexpected server error');
    return true;
  }

  return false;
};

export const createReportVersionsReadRouter = (
  repositories: ReportVersionReadRouteRepositories,
): Router => {
  const router = Router();

  router.get(
    '/:id/versions',
    createRequestValidationMiddleware({
      params: reportRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as { id: string };

      try {
        const report = await repositories.reportRepository.findById(id);

        if (!report) {
          sendApiError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
          return;
        }

        const versions =
          await repositories.reportVersionRepository.findByReportId(id);

        res.status(200).json({
          data: reportVersionListResponseSchema.parse(
            versions.map(toReportVersionResponse),
          ),
        });
      } catch (error) {
        if (!handleRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  router.get(
    '/:id/versions/:versionId',
    createRequestValidationMiddleware({
      params: reportVersionRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id, versionId } = res.locals.validatedRequest?.params as {
        id: string;
        versionId: string;
      };

      try {
        const report = await repositories.reportRepository.findById(id);

        if (!report) {
          sendApiError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
          return;
        }

        const version =
          await repositories.reportVersionRepository.findById(versionId);

        if (!version || version.reportId !== id) {
          sendApiError(
            res,
            404,
            'REPORT_VERSION_NOT_FOUND',
            'Report version not found',
          );
          return;
        }

        sendReportVersionResponse(res, version);
      } catch (error) {
        if (!handleRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  return router;
};
