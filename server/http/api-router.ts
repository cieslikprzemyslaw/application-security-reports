import { Router } from 'express';

import { registerHealthRoute } from '../routes/health.route.js';

export interface RegisterApiRoutesOptions {
  registerRoutes?: (router: Router) => void;
}

export const createApiRouter = (
  options: RegisterApiRoutesOptions = {},
): Router => {
  const router = Router();

  registerHealthRoute(router);
  options.registerRoutes?.(router);

  return router;
};
