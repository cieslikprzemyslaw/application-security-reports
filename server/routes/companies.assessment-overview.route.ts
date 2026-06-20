import { Router } from 'express';

import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import {
  asyncRoute,
  handleCompanyRepositoryError,
} from './companies.route.shared.js';
import {
  companyAssessmentOverviewRouteParamsSchema,
  type AssessmentWorkspaceOverview,
} from './companies.route.types.js';

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

        const [threats, evidence, reports] = await Promise.all([
          threatRepository.findByAssessmentId(assessmentId),
          evidenceRepository.findByAssessmentId(assessmentId),
          reportRepository.findByAssessmentId(assessmentId),
        ]);

        const workspaceOverview: AssessmentWorkspaceOverview = {
          company: {
            id: company.id,
            name: company.name,
          },
          assessment: {
            ...assessment,
            recordVersion: new Date(assessment.updatedAt).getTime(),
            findingsCount: threats.length,
            evidenceCount: evidence.length,
            reportVersionCount: reports.length,
            availableActions:
              assessment.status === 'draft'
                ? ['start', 'archive']
                : assessment.status === 'in-progress'
                  ? ['complete', 'archive']
                  : assessment.status === 'completed'
                    ? ['reopen', 'archive']
                    : ['reopen'],
          },
        };

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

  return router;
};
