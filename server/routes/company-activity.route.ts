import { Router, type Response } from 'express';
import { z } from 'zod';

import {
  activityFileSchema,
  prefixedUuidSchema,
} from '../../src/domain/schemas/index.js';
import type { ActivityRepository } from '../database/repositories/activity.repository.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import { asyncRoute } from './companies.route.shared.js';

const activityListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

const companyActivityParamsSchema = z
  .object({
    companyId: prefixedUuidSchema('cmp_', 'Company'),
  })
  .strict();

const assessmentActivityParamsSchema = z
  .object({
    companyId: prefixedUuidSchema('cmp_', 'Company'),
    assessmentId: prefixedUuidSchema('asm_', 'Assessment'),
  })
  .strict();

type ActivityListQuery = z.output<typeof activityListQuerySchema>;

const sendActivityResponse = (
  res: Response,
  activities: Awaited<ReturnType<ActivityRepository['findByCompanyId']>>,
) => {
  res.status(200).json({ data: activityFileSchema.parse(activities) });
};

export const createCompanyActivityRouter = (
  companyRepository: CompanyRepository,
  assessmentRepository: AssessmentRepository,
  activityRepository: ActivityRepository,
): Router => {
  const router = Router();

  router.get(
    '/:companyId/activity',
    createRequestValidationMiddleware({
      params: companyActivityParamsSchema,
      query: activityListQuerySchema,
    }),
    asyncRoute(async (_req, res) => {
      const { companyId } = res.locals.validatedRequest?.params as {
        companyId: string;
      };
      const { limit } = res.locals.validatedRequest?.query as ActivityListQuery;
      const company = await companyRepository.findById(companyId);

      if (!company) {
        sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
        return;
      }

      const activities = await activityRepository.findByCompanyId({
        companyId,
        limit,
      });

      sendActivityResponse(res, activities);
    }),
  );

  router.get(
    '/:companyId/assessments/:assessmentId/activity',
    createRequestValidationMiddleware({
      params: assessmentActivityParamsSchema,
      query: activityListQuerySchema,
    }),
    asyncRoute(async (_req, res) => {
      const { companyId, assessmentId } = res.locals.validatedRequest
        ?.params as {
        companyId: string;
        assessmentId: string;
      };
      const { limit } = res.locals.validatedRequest?.query as ActivityListQuery;
      const [company, assessment] = await Promise.all([
        companyRepository.findById(companyId),
        assessmentRepository.findById(assessmentId),
      ]);

      if (!company) {
        sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
        return;
      }

      if (!assessment || assessment.companyId !== companyId) {
        sendApiError(res, 404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
        return;
      }

      const activities = await activityRepository.findByAssessmentId({
        assessmentId,
        limit,
      });

      sendActivityResponse(res, activities);
    }),
  );

  return router;
};
