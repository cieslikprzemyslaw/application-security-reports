import { createServer } from 'node:http';

import { loadServerConfig } from '../../config.js';
import { createAssessmentRepository } from '../../database/repositories/assessment.repository.js';
import { createCompanyRepository } from '../../database/repositories/company.repository.js';
import { createEvidenceRepository } from '../../database/repositories/evidence.repository.js';
import { createReportRepository } from '../../database/repositories/report.repository.js';
import { createReportVersionRepository } from '../../database/repositories/reportVersion.repository.js';
import { createSettingsRepository } from '../../database/repositories/settings.repository.js';
import { createThreatRepository } from '../../database/repositories/threat.repository.js';
import { createTemporaryDatabase } from '../../test/temporaryDatabase.js';
import { createApiApp } from '../api-app.js';
import type { PrismaClient as PrismaClientType } from '../../../generated/prisma/client.js';
import { seedReportsData, type ReportsSeedData } from './fixtures.js';

const allowedOrigin = 'http://localhost:5173';
const config = loadServerConfig({
  FRONTEND_ORIGIN: allowedOrigin,
});

export const startTestServer = async (app: ReturnType<typeof createApiApp>) => {
  const server = createServer(app);

  await new Promise<void>(resolve => {
    server.listen(0, resolve);
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected the test server to listen on an ephemeral port.');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
};

export type ReportsRouteIntegrationHarness = ReportsSeedData & {
  prisma: PrismaClientType;
  companyRepository: ReturnType<typeof createCompanyRepository>;
  assessmentRepository: ReturnType<typeof createAssessmentRepository>;
  threatRepository: ReturnType<typeof createThreatRepository>;
  evidenceRepository: ReturnType<typeof createEvidenceRepository>;
  reportRepository: ReturnType<typeof createReportRepository>;
  reportVersionRepository: ReturnType<typeof createReportVersionRepository>;
  settingsRepository: ReturnType<typeof createSettingsRepository>;
  cleanup: () => Promise<void>;
};

export const createReportsApp = (
  reportRepository: ReturnType<typeof createReportRepository>,
  assessmentRepository: ReturnType<typeof createAssessmentRepository>,
  companyRepository: ReturnType<typeof createCompanyRepository>,
  threatRepository: ReturnType<typeof createThreatRepository>,
  evidenceRepository: ReturnType<typeof createEvidenceRepository>,
  settingsRepository: ReturnType<typeof createSettingsRepository>,
  reportVersionRepository?: ReturnType<typeof createReportVersionRepository>,
) =>
  createApiApp(config, {
    reportRepository,
    assessmentRepository,
    companyRepository,
    threatRepository,
    evidenceRepository,
    settingsRepository,
    reportVersionRepository,
  });

export const createReportsRouteIntegrationHarness =
  async (): Promise<ReportsRouteIntegrationHarness> => {
    const database = await createTemporaryDatabase();
    const { prisma } = database;

    try {
      const companyRepository = createCompanyRepository(prisma);
      const assessmentRepository = createAssessmentRepository(prisma);
      const threatRepository = createThreatRepository(prisma);
      const evidenceRepository = createEvidenceRepository(prisma);
      const reportRepository = createReportRepository(prisma);
      const reportVersionRepository = createReportVersionRepository(prisma);
      const settingsRepository = createSettingsRepository(prisma);

      const seeded = await seedReportsData(prisma, settingsRepository);

      return {
        prisma,
        companyRepository,
        assessmentRepository,
        threatRepository,
        evidenceRepository,
        reportRepository,
        reportVersionRepository,
        settingsRepository,
        ...seeded,
        cleanup: database.cleanup,
      };
    } catch (error) {
      await database.cleanup();
      throw error;
    }
  };
