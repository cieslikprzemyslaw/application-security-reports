import { Router } from 'express';

import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import { createAssessmentsRouter } from '../routes/assessments.route.js';
import { registerHealthRoute } from '../routes/health.route.js';
import { createCompaniesRouter } from '../routes/companies.route.js';
import { createThreatsRouter } from '../routes/threats.route.js';

export interface RegisterApiRoutesOptions {
  assessmentRepository?: AssessmentRepository;
  companyRepository?: CompanyRepository;
  threatRepository?: ThreatRepository;
  registerRoutes?: (router: Router) => void;
}

export const createApiRouter = (
  options: RegisterApiRoutesOptions = {},
): Router => {
  const router = Router();

  registerHealthRoute(router);
  if (options.assessmentRepository && options.threatRepository) {
    router.use(
      '/threats',
      createThreatsRouter(
        options.assessmentRepository,
        options.threatRepository,
      ),
    );
  }
  if (options.assessmentRepository && options.companyRepository) {
    router.use(
      '/assessments',
      createAssessmentsRouter(
        options.assessmentRepository,
        options.companyRepository,
      ),
    );
  }
  if (options.companyRepository) {
    router.use('/companies', createCompaniesRouter(options.companyRepository));
  }
  options.registerRoutes?.(router);

  return router;
};
