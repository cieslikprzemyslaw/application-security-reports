import { z } from 'zod';

import {
  JsonParseError,
  ValidationError,
  formatValidationErrors,
} from './format-validation-errors.js';

export const validateFileData = <T extends z.ZodTypeAny>(
  parsedData: unknown,
  schema: T,
): z.output<T> => {
  const result = schema.safeParse(parsedData);

  if (!result.success) {
    throw new ValidationError(formatValidationErrors(result.error));
  }

  return result.data;
};

export const parseJsonData = <T extends z.ZodTypeAny>(
  rawText: string,
  schema: T,
): z.output<T> => {
  let parsedData: unknown;

  try {
    parsedData = JSON.parse(rawText);
  } catch {
    throw new JsonParseError();
  }

  return validateFileData(parsedData, schema);
};
