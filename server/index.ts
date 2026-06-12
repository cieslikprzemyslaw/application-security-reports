import cors from 'cors';
import express from 'express';
import type { Server } from 'node:http';
import path from 'node:path';

import { prisma } from './lib/prisma.js';
import healthRouter from './routes/health.route.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);
let server: Server | null = null;
let shutdownPromise: Promise<void> | null = null;

const globalForShutdown = globalThis as typeof globalThis & {
  appsecShutdownHandlersRegistered?: boolean;
};

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
app.use('/api/health', healthRouter);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  },
);

const closeServer = async () => {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close(error => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  server = null;
};

const handleShutdownError = (error: unknown): void => {
  console.error('Failed to shut down AppSec API', error);
  process.exitCode = 1;
};

export async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (!shutdownPromise) {
    shutdownPromise = (async () => {
      console.log(`Received ${signal}. Shutting down AppSec API...`);
      await closeServer();
      await prisma.$disconnect();
    })();
  }

  return shutdownPromise;
}

export function startServer(): Server {
  if (server) {
    return server;
  }

  server = app.listen(port, () => {
    console.log(`AppSec API running at http://localhost:${port}`);
  });

  if (!globalForShutdown.appsecShutdownHandlersRegistered) {
    process.once('SIGINT', () => {
      void shutdown('SIGINT').catch(handleShutdownError);
    });

    process.once('SIGTERM', () => {
      void shutdown('SIGTERM').catch(handleShutdownError);
    });
    globalForShutdown.appsecShutdownHandlersRegistered = true;
  }

  return server;
}

export { app };

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
