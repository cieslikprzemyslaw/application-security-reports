import { z } from 'zod';

import {
  ValidationError,
  formatValidationErrors,
} from './format-validation-errors.js';

export const validateRequestBody = <T extends z.ZodTypeAny>(
  schema: T,
  unknownBody: unknown,
): z.output<T> => {
  const result = schema.safeParse(unknownBody);

  if (!result.success) {
    throw new ValidationError(formatValidationErrors(result.error));
  }

  return result.data;
};
