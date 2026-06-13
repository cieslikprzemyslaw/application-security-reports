import type { Express } from 'express';
import type { Server } from 'node:http';

import { prisma } from './lib/prisma.js';
import { loadServerConfig, type ServerConfig } from './config.js';
import { createApiApp, type ApiAppOptions } from './http/api-app.js';
import {
  createGracefulShutdown,
  type PrismaLifecycle,
  type ShutdownLogger,
} from './http/shutdown.js';

export interface StartApiServerOptions extends ApiAppOptions {
  app?: Express;
  config?: ServerConfig;
  logger?: ShutdownLogger;
  prismaClient?: PrismaLifecycle & { $connect: () => Promise<void> };
}

export interface StartApiServerResult {
  app: Express;
  config: ServerConfig;
  server: Server;
  shutdown: (signal?: NodeJS.Signals) => Promise<void>;
}

const globalForShutdown = globalThis as typeof globalThis & {
  appsecShutdownHandlersRegistered?: boolean;
};

export const registerProcessShutdownHandlers = (
  shutdown: (signal?: NodeJS.Signals) => Promise<void>,
  logger: ShutdownLogger = console,
): void => {
  if (globalForShutdown.appsecShutdownHandlersRegistered) {
    return;
  }

  const handleShutdownError = (error: unknown): void => {
    logger.error('Failed to shut down AppSec API safely.', error);
    process.exitCode = 1;
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT').catch(handleShutdownError);
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM').catch(handleShutdownError);
  });

  globalForShutdown.appsecShutdownHandlersRegistered = true;
};

export const startApiServer = async (
  options: StartApiServerOptions = {},
): Promise<StartApiServerResult> => {
  const config = options.config ?? loadServerConfig();
  const prismaClient = options.prismaClient ?? prisma;
  const app =
    options.app ??
    createApiApp(config, {
      assessmentRepository: options.assessmentRepository,
      companyRepository: options.companyRepository,
      settingsRepository: options.settingsRepository,
      threatRepository: options.threatRepository,
      registerRoutes: options.registerRoutes,
    });

  await prismaClient.$connect();

  try {
    const server = app.listen(config.apiPort);

    await new Promise<void>((resolve, reject) => {
      const handleListening = (): void => {
        server.off('error', handleError);
        resolve();
      };

      const handleError = (error: Error): void => {
        server.off('listening', handleListening);
        reject(error);
      };

      server.once('listening', handleListening);
      server.once('error', handleError);
    });

    const shutdown = createGracefulShutdown({
      server,
      prisma: prismaClient,
      logger: options.logger,
    });

    return {
      app,
      config,
      server,
      shutdown,
    };
  } catch (error) {
    await prismaClient.$disconnect().catch(() => undefined);
    throw error;
  }
};
