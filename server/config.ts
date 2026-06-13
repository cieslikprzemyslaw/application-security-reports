import { z } from 'zod';

import {
  formatValidationErrors,
  type ValidationFieldError,
} from '../src/validation/index.js';

const allowedNodeEnvs = ['development', 'test', 'production'] as const;

const originSchema = z
  .string()
  .trim()
  .refine(value => {
    try {
      return new URL(value).origin === value;
    } catch {
      return false;
    }
  }, 'FRONTEND_ORIGIN must be a valid origin.');

const serverConfigSchema = z.object({
  apiPort: z.coerce.number().int().min(1).max(65535).default(3001),
  frontendOrigin: originSchema.default('http://localhost:5173'),
  nodeEnv: z.enum(allowedNodeEnvs).default('development'),
});

export type ServerConfig = z.output<typeof serverConfigSchema>;

export class ServerConfigError extends Error {
  public readonly details: ValidationFieldError[];

  constructor(details: ValidationFieldError[]) {
    super('Invalid server configuration');
    this.name = 'ServerConfigError';
    this.details = details;
  }
}

const normalizeServerEnv = (env: NodeJS.ProcessEnv) => ({
  apiPort: env.API_PORT ?? env.PORT,
  frontendOrigin: env.FRONTEND_ORIGIN,
  nodeEnv: env.NODE_ENV,
});

export const loadServerConfig = (
  env: NodeJS.ProcessEnv = process.env,
): ServerConfig => {
  const result = serverConfigSchema.safeParse(normalizeServerEnv(env));

  if (!result.success) {
    throw new ServerConfigError(formatValidationErrors(result.error).fields);
  }

  return result.data;
};

export const isServerConfigError = (
  error: unknown,
): error is ServerConfigError => error instanceof ServerConfigError;
