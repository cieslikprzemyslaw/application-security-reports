import type { Server } from 'node:http';

const shutdownTimeoutMs = 10_000;

export interface PrismaLifecycle {
  $disconnect: () => Promise<void>;
}

export interface ShutdownLogger {
  log: (...args: Array<unknown>) => void;
  error: (...args: Array<unknown>) => void;
}

export interface ShutdownDependencies {
  server: Server;
  prisma: PrismaLifecycle;
  logger?: ShutdownLogger;
}

const withTimeout = async <T>(
  operation: Promise<T>,
  message: string,
): Promise<T> => {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(message));
        }, shutdownTimeoutMs);
        timeout.unref?.();
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

const closeServer = async (server: Server): Promise<void> => {
  await withTimeout(
    new Promise<void>((resolve, reject) => {
      server.close(error => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    }),
    'Timed out while closing the HTTP server.',
  );
};

const disconnectPrisma = async (prisma: PrismaLifecycle): Promise<void> => {
  await withTimeout(
    prisma.$disconnect(),
    'Timed out while disconnecting Prisma.',
  );
};

export const createGracefulShutdown = ({
  server,
  prisma,
  logger = console,
}: ShutdownDependencies) => {
  let shutdownPromise: Promise<void> | null = null;

  return async (signal?: NodeJS.Signals): Promise<void> => {
    if (shutdownPromise) {
      return shutdownPromise;
    }

    shutdownPromise = (async () => {
      if (signal) {
        logger.log(`Received ${signal}. Shutting down AppSec API...`);
      }

      await closeServer(server);
      await disconnectPrisma(prisma);
    })();

    try {
      await shutdownPromise;
    } catch (error) {
      logger.error('Failed to shut down AppSec API safely.', error);
      throw error;
    }
  };
};
