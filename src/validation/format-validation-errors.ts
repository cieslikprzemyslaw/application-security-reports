import { ZodError } from 'zod';

export interface ValidationFieldError {
  path: string;
  message: string;
  code?: string;
}

export interface ValidationErrorResponse {
  error: 'VALIDATION_ERROR';
  fields: ValidationFieldError[];
}

export interface JsonParseErrorResponse {
  error: 'INVALID_JSON';
  message: string;
}

const formatPath = (path: Array<string | number>) =>
  path
    .map(segment => (typeof segment === 'number' ? String(segment) : segment))
    .join('.');

export class JsonParseError extends Error {
  public readonly response: JsonParseErrorResponse;

  constructor(message = 'Invalid JSON syntax') {
    super(message);
    this.name = 'JsonParseError';
    this.response = {
      error: 'INVALID_JSON',
      message,
    };
  }
}

export class ValidationError extends Error {
  public readonly response: ValidationErrorResponse;

  constructor(response: ValidationErrorResponse) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.response = response;
  }
}

export const formatValidationErrors = (
  error: ZodError,
): ValidationErrorResponse => {
  const fields: ValidationFieldError[] = [];

  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') {
      const basePath = formatPath(issue.path);

      for (const key of issue.keys) {
        fields.push({
          path: basePath.length > 0 ? `${basePath}.${key}` : key,
          message: `Unknown property: ${key}`,
          code: issue.code,
        });
      }

      continue;
    }

    fields.push({
      path: formatPath(issue.path),
      message: issue.message,
      code: issue.code,
    });
  }

  return {
    error: 'VALIDATION_ERROR',
    fields,
  };
};
