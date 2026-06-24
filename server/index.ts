import { isServerConfigError } from './config.js';
import { repositories } from './database/repositories/index.js';
import { prisma } from './lib/prisma.js';
import { registerProcessShutdownHandlers, startApiServer } from './start.js';

const logStartupError = (error: unknown): void => {
  if (isServerConfigError(error)) {
    console.error('Invalid AppSec API configuration:', error.details);
    process.exitCode = 1;
    return;
  }

  console.error('Failed to start AppSec API', error);
  process.exitCode = 1;
};

const main = async (): Promise<void> => {
  const { config, shutdown } = await startApiServer({
    prismaClient: prisma,
    assessmentRepository: repositories.assessment,
    companyRepository: repositories.company,
    evidenceRepository: repositories.evidence,
    reportRepository: repositories.report,
    reportVersionRepository: repositories.reportVersion,
    settingsRepository: repositories.settings,
    threatRepository: repositories.threat,
  });

  console.log(`AppSec API running at http://localhost:${config.apiPort}`);
  registerProcessShutdownHandlers(shutdown);
};

if (process.env.NODE_ENV !== 'test') {
  void main().catch(logStartupError);
}
