import { Router, type Response } from 'express';

import { assessmentCommandRequestSchema } from '../../src/domain/schemas/index.js';
import {
  RepositoryConflictError,
  RepositoryError,
  RepositoryNotFoundError,
  RepositoryStateError,
} from '../database/errors.js';
import type { AssessmentLifecycleRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import { asyncRoute } from './companies.route.shared.js';
import { buildAssessmentWorkspaceOverview } from './companies.assessment-workspace.shared.js';
import {
  companyAssessmentOverviewRouteParamsSchema,
  type AssessmentWorkspaceCommand,
} from './companies.route.types.js';

const commands: AssessmentWorkspaceCommand[] = [
  'complete',
  'reopen',
  'archive',
  'restore',
];

const handleCommandError = (error: unknown, res: Response): boolean => {
  if (error instanceof RepositoryNotFoundError) {
    sendApiError(res, 404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
    return true;
  }

  if (error instanceof RepositoryConflictError) {
    sendApiError(
      res,
      409,
      'RESOURCE_MODIFIED',
      'The Assessment was modified by another session.',
    );
    return true;
  }

  if (error instanceof RepositoryStateError) {
    sendApiError(
      res,
      409,
      'ASSESSMENT_TRANSITION_NOT_ALLOWED',
      error.message,
    );
    return true;
  }

  if (error instanceof RepositoryError) {
    console.error('Unexpected Assessment lifecycle repository error', error);
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Unexpected server error');
    return true;
  }

  return false;
};

export const createAssessmentCommandsRouter = (
  companyRepository: CompanyRepository,
  assessmentRepository: AssessmentLifecycleRepository,
  threatRepository: ThreatRepository,
  evidenceRepository: EvidenceRepository,
  reportRepository: ReportRepository,
): Router => {
  const router = Router();

  for (const command of commands) {
    router.post(
      `/:id/assessments/:assessmentId/commands/${command}`,
      createRequestValidationMiddleware({
        params: companyAssessmentOverviewRouteParamsSchema,
        body: assessmentCommandRequestSchema,
      }),
      asyncRoute(async (_req, res) => {
        const { id: companyId, assessmentId } = res.locals.validatedRequest
          ?.params as {
          id: string;
          assessmentId: string;
        };
        const { recordVersion } = res.locals.validatedRequest?.body as {
          recordVersion: number;
        };

        try {
          const company = await companyRepository.findById(companyId);

          if (!company) {
            sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
            return;
          }

          if (company.archivedAt) {
            sendApiError(
              res,
              409,
              'COMPANY_ARCHIVED',
              'Archived Companies are read-only.',
            );
            return;
          }

          const assessment = await assessmentRepository.findById(assessmentId);

          if (!assessment || assessment.companyId !== companyId) {
            sendApiError(
              res,
              404,
              'ASSESSMENT_NOT_FOUND',
              'Assessment not found',
            );
            return;
          }

          const transitioned = await assessmentRepository[command](
            assessmentId,
            recordVersion,
          );
          const overview = await buildAssessmentWorkspaceOverview(
            company,
            transitioned,
            threatRepository,
            evidenceRepository,
            reportRepository,
          );

          res.status(200).json({ data: overview });
        } catch (error) {
          if (!handleCommandError(error, res)) {
            throw error;
          }
        }
      }),
    );
  }

  return router;
};
