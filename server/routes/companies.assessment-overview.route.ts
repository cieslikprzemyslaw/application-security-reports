import { Router } from 'express';

import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import { createAssessmentCommandsRouter } from './companies.assessment-commands.route.js';
import { buildAssessmentWorkspaceOverview } from './companies.assessment-workspace.shared.js';
import {
  asyncRoute,
  handleCompanyRepositoryError,
} from './companies.route.shared.js';
import { companyAssessmentOverviewRouteParamsSchema } from './companies.route.types.js';

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

        res.status(200).json({ data: workspaceOverview });
      } catch (error) {
        if (!handleCompanyRepositoryError(error, res, 'retrieve')) {
          throw error;
        }
      }
    }),
  );

  router.use(
    createAssessmentCommandsRouter(
      companyRepository,
      assessmentRepository,
      threatRepository,
      evidenceRepository,
      reportRepository,
    ),
  );

  return router;
};
