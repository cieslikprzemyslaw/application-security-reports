import { Router, type Response } from 'express';

import type { ReportReadinessResult } from '../../src/domain/report-readiness.js';
import type { ReportPreviewRequest } from '../../src/domain/report-preview.js';
import type { CreateFinalReportVersionRequest } from '../../src/domain/report.js';
import {
  createFinalReportVersionRequestSchema,
  reportReadinessResultSchema,
  reportRouteParamsSchema,
  reportVersionResponseSchema,
} from '../../src/domain/schemas/index.js';
import { RepositoryConflictError } from '../database/errors.js';
import type { ReportVersionRepository } from '../database/repositories/reportVersion.repository.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import { ReportReadinessReportNotFoundError } from '../services/report-readiness.service.js';
import { finaliseReportVersion } from '../services/report-version-finalisation.service.js';
import { buildBaseUrl } from './companies.route.shared.js';
import { handleReportPreviewGenerationError } from './reports.preview.route.js';
import { asyncRoute } from './settings.route.shared.js';

export interface ReportVersionFinalRouteRepositories {
  reportVersionRepository: Pick<
    ReportVersionRepository,
    'withFinalisationTransaction'
  >;
}

const splitFinalRequest = (
  body: CreateFinalReportVersionRequest,
): {
  expectedLatestVersion: number;
  request: ReportPreviewRequest;
} => {
  const { expectedLatestVersion, ...request } = body;

  return { expectedLatestVersion, request };
};

const sendBlockedFinalisationResponse = (
  res: Response,
  readiness: ReportReadinessResult,
): Response =>
  res.status(409).json({
    error: {
      code: 'REPORT_FINALISATION_BLOCKED',
      message: 'Report is not ready for finalisation',
      details: [],
    },
    readiness: reportReadinessResultSchema.parse(readiness),
  });

export const createReportVersionsFinalRouter = (
  repositories: ReportVersionFinalRouteRepositories,
): Router => {
  const router = Router();

  router.post(
    '/:id/versions/final',
    createRequestValidationMiddleware({
      params: reportRouteParamsSchema,
      body: createFinalReportVersionRequestSchema,
    }),
    asyncRoute(async (req, res) => {
      const { id } = res.locals.validatedRequest?.params as { id: string };
      const body = res.locals.validatedRequest
        ?.body as CreateFinalReportVersionRequest;
      const { expectedLatestVersion, request } = splitFinalRequest(body);

      try {
        const result = await finaliseReportVersion(
          {
            reportId: id,
            expectedLatestVersion,
            request,
            baseUrl: buildBaseUrl(req),
          },
          repositories,
        );

        if (result.status === 'blocked') {
          sendBlockedFinalisationResponse(res, result.readiness);
          return;
        }

        res.status(201).json({
          data: reportVersionResponseSchema.parse(result.reportVersion),
        });
      } catch (error) {
        if (error instanceof ReportReadinessReportNotFoundError) {
          sendApiError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
          return;
        }

        if (error instanceof RepositoryConflictError) {
          sendApiError(
            res,
            409,
            'REPORT_VERSION_CONFLICT',
            'Report version could not be created because the version changed',
          );
          return;
        }

        if (handleReportPreviewGenerationError(error, res)) {
          return;
        }

        throw error;
      }
    }),
  );

  return router;
};
