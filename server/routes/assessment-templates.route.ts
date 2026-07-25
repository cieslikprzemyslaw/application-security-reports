import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import type {
  CreateAssessmentTemplateInput,
  UpdateAssessmentTemplateInput,
} from '../../src/domain/assessmentTemplate.js';
import {
  assessmentTemplateListQuerySchema,
  assessmentTemplateRouteParamsSchema,
  createAssessmentTemplateRequestSchema,
  updateAssessmentTemplateRequestSchema,
} from '../../src/domain/schemas/assessmentTemplate.schema.js';
import {
  RepositoryError,
  RepositoryNotFoundError,
  RepositoryStateError,
} from '../database/errors.js';
import type { AssessmentTemplateRepository } from '../database/repositories/assessmentTemplate.repository.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';

const asyncRoute =
  (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

const handleRepositoryError = (error: unknown, res: Response): boolean => {
  if (error instanceof RepositoryNotFoundError) {
    sendApiError(
      res,
      404,
      'ASSESSMENT_TEMPLATE_NOT_FOUND',
      'Assessment Template not found',
    );
    return true;
  }

  if (error instanceof RepositoryStateError) {
    sendApiError(
      res,
      409,
      'ASSESSMENT_TEMPLATE_STATE_CONFLICT',
      error.message,
    );
    return true;
  }

  if (error instanceof RepositoryError) {
    console.error('Unexpected Assessment Template repository error', error);
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Unexpected server error');
    return true;
  }

  return false;
};

const sendTemplate = (
  res: Response,
  status: number,
  data: Awaited<ReturnType<AssessmentTemplateRepository['findById']>>,
): void => {
  res.status(status).json({ data });
};

export const createAssessmentTemplatesRouter = (
  repository: AssessmentTemplateRepository,
): Router => {
  const router = Router();

  router.get(
    '/',
    createRequestValidationMiddleware({
      query: assessmentTemplateListQuerySchema,
    }),
    asyncRoute(async (_req, res) => {
      const query = res.locals.validatedRequest?.query as {
        includeArchived?: boolean;
      };
      const templates = await repository.findAll(query);
      res.status(200).json({ data: templates });
    }),
  );

  router.get(
    '/:id',
    createRequestValidationMiddleware({
      params: assessmentTemplateRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as { id: string };
      const template = await repository.findById(id);

      if (!template) {
        sendApiError(
          res,
          404,
          'ASSESSMENT_TEMPLATE_NOT_FOUND',
          'Assessment Template not found',
        );
        return;
      }

      sendTemplate(res, 200, template);
    }),
  );

  router.post(
    '/',
    createRequestValidationMiddleware({
      body: createAssessmentTemplateRequestSchema,
    }),
    asyncRoute(async (_req, res) => {
      const body = res.locals.validatedRequest
        ?.body as CreateAssessmentTemplateInput;

      try {
        const template = await repository.create(body);
        sendTemplate(res, 201, template);
      } catch (error) {
        if (!handleRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  router.patch(
    '/:id',
    createRequestValidationMiddleware({
      params: assessmentTemplateRouteParamsSchema,
      body: updateAssessmentTemplateRequestSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as { id: string };
      const body = res.locals.validatedRequest
        ?.body as UpdateAssessmentTemplateInput;

      try {
        const template = await repository.update(id, body);
        sendTemplate(res, 200, template);
      } catch (error) {
        if (!handleRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  for (const [path, transition] of [
    ['/:id/archive', 'archive'],
    ['/:id/restore', 'restore'],
  ] as const) {
    router.post(
      path,
      createRequestValidationMiddleware({
        params: assessmentTemplateRouteParamsSchema,
      }),
      asyncRoute(async (_req, res) => {
        const { id } = res.locals.validatedRequest?.params as { id: string };

        try {
          const template = await repository[transition](id);
          sendTemplate(res, 200, template);
        } catch (error) {
          if (!handleRepositoryError(error, res)) {
            throw error;
          }
        }
      }),
    );
  }

  return router;
};
