import { createServer } from 'node:http';

import { loadServerConfig } from '../../config.js';
import type { AssessmentRepository } from '../../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../../database/repositories/report.repository.js';
import type { SettingsRepository } from '../../database/repositories/settings.repository.js';
import type { ThreatRepository } from '../../database/repositories/threat.repository.js';
import { createApiApp } from '../api-app.js';

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

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path: string; message: string; code?: string }>;
  };
};

export const readJson = async <T>(response: Response): Promise<T> =>
  response.json() as Promise<T>;

export const createApp = (
  reportRepository: ReportRepository,
  assessmentRepository: AssessmentRepository,
  companyRepository: CompanyRepository,
  threatRepository: ThreatRepository,
  evidenceRepository: EvidenceRepository,
  settingsRepository: SettingsRepository,
) =>
  createApiApp(config, {
    reportRepository,
    assessmentRepository,
    companyRepository,
    threatRepository,
    evidenceRepository,
    settingsRepository,
  });
