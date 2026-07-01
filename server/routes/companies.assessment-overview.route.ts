import { Router } from 'express';

import type { Assessment } from '../../src/domain/assessment.js';
import { assessmentCommandRequestSchema } from '../../src/domain/schemas/index.js';
import {
  RepositoryConflictError,
  RepositoryError,
  RepositoryNotFoundError,
} from '../database/errors.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import {
  asyncRoute,
  handleCompanyRepositoryError,
} from './companies.route.shared.js';
import {
  companyAssessmentOverviewRouteParamsSchema,
  type AssessmentWorkspaceCommand,
  type AssessmentWorkspaceOverview,
} from './companies.route.types.js';

const getAvailableAssessmentActions = (
  status: Assessment['status'],
): AssessmentWorkspaceCommand[] =>
  status === 'draft'
    ? ['start', 'archive']
    : status === 'in-progress'
      ? ['complete', 'archive']
      : status === 'completed'
        ? ['reopen', 'archive']
        : ['reopen'];

const buildAssessmentWorkspaceOverview = async (
  company: { id: string; name: string },
  assessment: Assessment,
  threatRepository: ThreatRepository,
  evidenceRepository: EvidenceRepository,
  reportRepository: ReportRepository,
): Promise<AssessmentWorkspaceOverview> => {
  const [threats, evidence, reports] = await Promise.all([
    threatRepository.findByAssessmentId(assessment.id),
    evidenceRepository.findByAssessmentId(assessment.id),
    reportRepository.findByAssessmentId(assessment.id),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const reportVersionCount = reports.reduce(
    (total, report) => total + report.versions.length,

    0,
  );

  return {
    company: {
      id: company.id,
      name: company.name,
    },
    assessment: {
      ...assessment,
      recordVersion: new Date(assessment.updatedAt).getTime(),
      findingsCount: threats.length,
      evidenceCount: evidence.length,
      reportVersionCount: reports.reduce(
        (count, report) => count + report.versions.length,
        0,
      ),
      availableActions: getAvailableAssessmentActions(assessment.status),
    },
  };
};

const handleAssessmentCommandRepositoryError = (
  error: unknown,
  res: import('express').Response,
): boolean => {
  if (error instanceof RepositoryNotFoundError) {
    sendApiError(res, 404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
    return true;
  }

  if (error instanceof RepositoryConflictError) {
    sendApiError(
      res,
      409,
      'RESOURCE_MODIFIED',
      'The assessment was modified by another session.',
    );
    return true;
  }

  if (error instanceof RepositoryError) {
    console.error('Unexpected assessment command repository error', error);
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Unexpected server error');
    return true;
  }

  return false;
};

export const createCompanyAssessmentOverviewRouter = (
  companyRepository: CompanyRepository,
  assessmentRepository: AssessmentRepository,
  threatRepository: ThreatRepository,
  evidenceRepository: EvidenceRepository,
  reportRepository: ReportRepository,
): Router => {
  const router = Router();

  router.get(
    '/:id/assessments/:assessmentId/overview',
    createRequestValidationMiddleware({
      params: companyAssessmentOverviewRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id: companyId, assessmentId } = res.locals.validatedRequest
        ?.params as {
        id: string;
        assessmentId: string;
      };

      try {
        const company = await companyRepository.findById(companyId);

        if (!company) {
          sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
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

        const workspaceOverview = await buildAssessmentWorkspaceOverview(
          company,
          assessment,
          threatRepository,
          evidenceRepository,
          reportRepository,
        );

        res.status(200).json({
          data: workspaceOverview,
        });
      } catch (error) {
        if (!handleCompanyRepositoryError(error, res, 'retrieve')) {
          throw error;
        }
      }
    }),
  );

  router.post(
    '/:id/assessments/:assessmentId/commands/complete',
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

        if (assessment.status !== 'in-progress') {
          sendApiError(
            res,
            409,
            'RESOURCE_MODIFIED',
            'The assessment was modified by another session.',
          );
          return;
        }

        const currentRecordVersion = new Date(assessment.updatedAt).getTime();

        if (currentRecordVersion !== recordVersion) {
          sendApiError(
            res,
            409,
            'RESOURCE_MODIFIED',
            'The assessment was modified by another session.',
          );
          return;
        }

        const completedAssessment = await assessmentRepository.update(
          assessmentId,
          {
            status: 'completed',
            completedAt: new Date().toISOString(),
          },
        );

        const workspaceOverview = await buildAssessmentWorkspaceOverview(
          company,
          completedAssessment,
          threatRepository,
          evidenceRepository,
          reportRepository,
        );

        res.status(200).json({
          data: workspaceOverview,
        });
      } catch (error) {
        if (!handleAssessmentCommandRepositoryError(error, res)) {
          if (!handleCompanyRepositoryError(error, res, 'retrieve')) {
            throw error;
          }
        }
      }
    }),
  );

  return router;
};
