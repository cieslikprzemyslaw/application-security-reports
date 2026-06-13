import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { z } from 'zod';

import {
  ValidationError,
  formatValidationErrors,
} from '../../src/validation/index.js';

export interface RequestValidationSchemas {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
}

export interface ValidatedRequestState {
  body?: unknown;
  params?: unknown;
  query?: unknown;
}

const validateRequestPart = (schema: z.ZodTypeAny, value: unknown): unknown => {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new ValidationError(formatValidationErrors(result.error));
  }

  return result.data;
};

export const createRequestValidationMiddleware = (
  schemas: RequestValidationSchemas,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationState: ValidatedRequestState = {};

      if (schemas.body) {
        validationState.body = validateRequestPart(schemas.body, req.body);
      }

      if (schemas.params) {
        validationState.params = validateRequestPart(
          schemas.params,
          req.params,
        );
      }

      if (schemas.query) {
        validationState.query = validateRequestPart(schemas.query, req.query);
      }

      if (Object.keys(validationState).length > 0) {
        res.locals.validatedRequest = validationState;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
