import { createServer } from 'node:http';

import { loadServerConfig } from '../../config.js';
import { createAssessmentRepository } from '../../database/repositories/assessment.repository.js';
import { createCompanyRepository } from '../../database/repositories/company.repository.js';
import { createEvidenceRepository } from '../../database/repositories/evidence.repository.js';
import { createReportRepository } from '../../database/repositories/report.repository.js';
import { createThreatRepository } from '../../database/repositories/threat.repository.js';
import { createTemporaryDatabase } from '../../test/temporaryDatabase.js';
import { createApiApp } from '../api-app.js';
import type { PrismaClient as PrismaClientType } from '../../../generated/prisma/client.js';

const config = loadServerConfig({
  FRONTEND_ORIGIN: 'http://localhost:5173',
});

const startTestServer = async (app: ReturnType<typeof createApiApp>) => {
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

export type AssessmentsRouteIntegrationHarness = {
  server: Awaited<ReturnType<typeof startTestServer>>;
  prisma: PrismaClientType;
  company: {
    id: string;
    name: string;
  };
  assessment: {
    id: string;
    updatedAt: string;
    recordVersion: number;
  };
  assessmentRepository: ReturnType<typeof createAssessmentRepository>;
  cleanup: () => Promise<void>;
};

export const createAssessmentsRouteIntegrationHarness =
  async (): Promise<AssessmentsRouteIntegrationHarness> => {
    const database = await createTemporaryDatabase();
    const { prisma } = database;

    try {
      const companyRepository = createCompanyRepository(prisma);
      const assessmentRepository = createAssessmentRepository(prisma);
      const threatRepository = createThreatRepository(prisma);
      const evidenceRepository = createEvidenceRepository(prisma);
      const reportRepository = createReportRepository(prisma);
      const server = await startTestServer(
        createApiApp(config, {
          assessmentRepository,
          companyRepository,
          threatRepository,
          evidenceRepository,
          reportRepository,
        }),
      );

      const company = await companyRepository.create({
        name: 'Northstar Digital',
        description: 'Security consulting and managed assessment services',
        website: 'https://northstar.example',
        contactName: 'Alex Mercer',
        contactEmail: 'security@northstar.example',
        footerText: 'Confidential - do not distribute.',
      });

      const assessment = await assessmentRepository.create({
        companyId: company.id,
        title: 'Customer Services Portal',
        description: 'Assessment of the customer portal',
        scope: 'Web application',
        status: 'in-progress',
        startedAt: '2026-06-01',
        applicationName: 'Customer Services Portal',
        environment: 'Production',
        assessmentType: 'Web App',
        overallRisk: 'high',
      });

      return {
        server,
        prisma,
        company: {
          id: company.id,
          name: company.name,
        },
        assessment: {
          id: assessment.id,
          updatedAt: assessment.updatedAt,
          recordVersion: new Date(assessment.updatedAt).getTime(),
        },
        assessmentRepository,
        cleanup: async () => {
          await server.close();
          await database.cleanup();
        },
      };
    } catch (error) {
      await database.cleanup();
      throw error;
    }
  };
