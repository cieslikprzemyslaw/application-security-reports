import cors from 'cors';
import express, { type Express } from 'express';
import path from 'node:path';
import type { Router } from 'express';

import type { ServerConfig } from '../config.js';
import { createApiRouter } from './api-router.js';
import { apiErrorHandler, apiNotFoundHandler } from './error-handler.js';

export interface ApiAppOptions {
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
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
  app.use('/api', createApiRouter(options));
  app.use(apiNotFoundHandler);
  app.use(apiErrorHandler);

  return app;
};
