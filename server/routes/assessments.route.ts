import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';

import type {
  Assessment,
  CreateAssessmentInput,
  UpdateAssessmentInput,
} from '../../src/domain/assessment.js';
import {
  assessmentListQuerySchema,
  assessmentRouteParamsSchema,
  createAssessmentRequestSchema,
  updateAssessmentRequestSchema,
} from '../../src/domain/schemas/index.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import {
  RepositoryConflictError,
  RepositoryConstraintError,
  RepositoryError,
  RepositoryNotFoundError,
} from '../database/errors.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';

const assessmentResponse = <T extends Assessment>(assessment: T): T => ({
  ...assessment,
});

const sendAssessmentResponse = (
  res: Response,
  statusCode: number,
  assessment: Assessment,
): Response =>
  res.status(statusCode).json({
    data: assessmentResponse(assessment),
  });

type AssessmentRepositoryOperation =
  | 'list'
  | 'retrieve'
  | 'create'
  | 'update'
  | 'delete';

const handleAssessmentRepositoryError = (
  error: unknown,
  res: Response,
  operation: AssessmentRepositoryOperation,
): boolean => {
  if (error instanceof RepositoryNotFoundError) {
    sendApiError(res, 404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
    return true;
  }

  if (error instanceof RepositoryConflictError) {
    sendApiError(
      res,
      409,
      'ASSESSMENT_CONFLICT',
      'An assessment with the same unique value already exists',
    );
    return true;
  }

  if (error instanceof RepositoryConstraintError && operation === 'delete') {
    sendApiError(
      res,
      409,
      'ASSESSMENT_DELETE_CONFLICT',
      'Assessment cannot be deleted while related reports exist',
    );
    return true;
  }

  if (error instanceof RepositoryError) {
    console.error('Unexpected assessment repository error', error);
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Unexpected server error');
    return true;
  }

  return false;
};

const asyncRoute =
  (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

export const createAssessmentsRouter = (
  assessmentRepository: AssessmentRepository,
  companyRepository: CompanyRepository,
): Router => {
  const router = Router();

  router.get(
    '/',
    createRequestValidationMiddleware({
      query: assessmentListQuerySchema,
    }),
    asyncRoute(async (_req, res) => {
      const { companyId } = res.locals.validatedRequest?.query as {
        companyId?: string;
      };

      try {
        const assessments = companyId
          ? await assessmentRepository.findByCompanyId(companyId)
          : await assessmentRepository.findAll();

        res.status(200).json({
          data: assessments.map(assessmentResponse),
        });
      } catch (error) {
        if (!handleAssessmentRepositoryError(error, res, 'list')) {
          throw error;
        }
      }
    }),
  );

  router.get(
    '/:id',
    createRequestValidationMiddleware({
      params: assessmentRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as {
        id: string;
      };

      try {
        const assessment = await assessmentRepository.findById(id);

        if (!assessment) {
          sendApiError(
            res,
            404,
            'ASSESSMENT_NOT_FOUND',
            'Assessment not found',
          );
          return;
        }

        sendAssessmentResponse(res, 200, assessment);
      } catch (error) {
        if (!handleAssessmentRepositoryError(error, res, 'retrieve')) {
          throw error;
        }
      }
    }),
  );

  router.post(
    '/',
    createRequestValidationMiddleware({
      body: createAssessmentRequestSchema,
    }),
    asyncRoute(async (_req, res) => {
      const body = res.locals.validatedRequest?.body as CreateAssessmentInput;

      try {
        const company = await companyRepository.findById(body.companyId);

        if (!company) {
          sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
          return;
        }

        const assessment = await assessmentRepository.create(body);
        const response = res.location(`/api/assessments/${assessment.id}`);

        sendAssessmentResponse(response, 201, assessment);
      } catch (error) {
        if (!handleAssessmentRepositoryError(error, res, 'create')) {
          if (error instanceof RepositoryError) {
            console.error('Unexpected assessment create error', error);
            sendApiError(
              res,
              500,
              'INTERNAL_SERVER_ERROR',
              'Unexpected server error',
            );
            return;
          }

          throw error;
        }
      }
    }),
  );

  router.patch(
    '/:id',
    createRequestValidationMiddleware({
      params: assessmentRouteParamsSchema,
      body: updateAssessmentRequestSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as {
        id: string;
      };
      const body = res.locals.validatedRequest?.body as UpdateAssessmentInput;

      try {
        const updatedAssessment = await assessmentRepository.update(id, body);

        sendAssessmentResponse(res, 200, updatedAssessment);
      } catch (error) {
        if (!handleAssessmentRepositoryError(error, res, 'update')) {
          throw error;
        }
      }
    }),
  );

  router.delete(
    '/:id',
    createRequestValidationMiddleware({
      params: assessmentRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as {
        id: string;
      };

      try {
        await assessmentRepository.delete(id);
        res.status(204).send();
      } catch (error) {
        if (!handleAssessmentRepositoryError(error, res, 'delete')) {
          throw error;
        }
      }
    }),
  );

  return router;
};
