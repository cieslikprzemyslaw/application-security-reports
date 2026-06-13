import cors from 'cors';
import express, { type Express } from 'express';
import type { Router } from 'express';

import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { ServerConfig } from '../config.js';
import { createApiRouter } from './api-router.js';
import { apiErrorHandler, apiNotFoundHandler } from './error-handler.js';

export interface ApiAppOptions {
  companyRepository?: CompanyRepository;
  registerRoutes?: (router: Router) => void;
}

const jsonBodyLimit = '1mb';

export const createApiApp = (
  config: ServerConfig,
  options: ApiAppOptions = {},
): Express => {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    cors({
      origin(requestOrigin, callback) {
        if (!requestOrigin || requestOrigin === config.frontendOrigin) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
    }),
  );
  app.use(express.json({ limit: jsonBodyLimit }));
  app.use('/api', createApiRouter(options));
  app.use(apiNotFoundHandler);
  app.use(apiErrorHandler);

  return app;
};
