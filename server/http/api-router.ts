import { Router } from 'express';

import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { SettingsRepository } from '../database/repositories/settings.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import { createAssessmentsRouter } from '../routes/assessments.route.js';
import { createEvidenceRouter } from '../routes/evidence.route.js';
import { registerHealthRoute } from '../routes/health.route.js';
import { createCompaniesRouter } from '../routes/companies.route.js';
import { createReportsRouter } from '../routes/reports.route.js';
import { createSettingsRouter } from '../routes/settings.route.js';
import { createThreatsRouter } from '../routes/threats.route.js';

export interface RegisterApiRoutesOptions {
  assessmentRepository?: AssessmentRepository;
  companyRepository?: CompanyRepository;
  evidenceRepository?: EvidenceRepository;
  reportRepository?: ReportRepository;
  settingsRepository?: SettingsRepository;
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
  if (
    options.reportRepository &&
    options.assessmentRepository &&
    options.companyRepository &&
    options.threatRepository &&
    options.evidenceRepository &&
    options.settingsRepository
  ) {
    router.use(
      '/reports',
      createReportsRouter(
        options.reportRepository,
        options.assessmentRepository,
        options.companyRepository,
        options.threatRepository,
        options.evidenceRepository,
        options.settingsRepository,
      ),
    );
  }
  if (
    options.assessmentRepository &&
    options.threatRepository &&
    options.evidenceRepository
  ) {
    router.use(
      '/evidence',
      createEvidenceRouter(
        options.assessmentRepository,
        options.threatRepository,
        options.evidenceRepository,
      ),
    );
  }
  if (options.settingsRepository) {
    router.use('/settings', createSettingsRouter(options.settingsRepository));
  }
  options.registerRoutes?.(router);

  return router;
};
