import { Router } from 'express';

import type { CompanyRepository } from '../database/repositories/company.repository.js';
import { registerHealthRoute } from '../routes/health.route.js';
import { createCompaniesRouter } from '../routes/companies.route.js';

export interface RegisterApiRoutesOptions {
  companyRepository?: CompanyRepository;
  registerRoutes?: (router: Router) => void;
}

export const createApiRouter = (
  options: RegisterApiRoutesOptions = {},
): Router => {
  const router = Router();

  registerHealthRoute(router);
  if (options.companyRepository) {
    router.use('/companies', createCompaniesRouter(options.companyRepository));
  }
  options.registerRoutes?.(router);

  return router;
};
