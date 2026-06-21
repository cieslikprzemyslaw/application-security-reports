import { prisma } from '../../lib/prisma.js';
import type { RepositoryClient } from '../repository.types.js';
import { createActivityRepository } from './activity.repository.js';
import { createAssessmentRepository } from './assessment.repository.js';
import { createCompanyRepository } from './company.repository.js';
import { createEvidenceRepository } from './evidence.repository.js';
import { createReportRepository } from './report.repository.js';
import { createReportVersionRepository } from './reportVersion.repository.js';
import { createSettingsRepository } from './settings.repository.js';
import { createThreatRepository } from './threat.repository.js';

export const createRepositories = (db: RepositoryClient) => ({
  activity: createActivityRepository(db),
  assessment: createAssessmentRepository(db),
  company: createCompanyRepository(db),
  evidence: createEvidenceRepository(db),
  report: createReportRepository(db),
  reportVersion: createReportVersionRepository(db),
  settings: createSettingsRepository(db),
  threat: createThreatRepository(db),
});

export const repositories = createRepositories(prisma);

export {
  createActivityRepository,
  createAssessmentRepository,
  createCompanyRepository,
  createEvidenceRepository,
  createReportRepository,
  createReportVersionRepository,
  createSettingsRepository,
  createThreatRepository,
};
