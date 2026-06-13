import assert from 'node:assert/strict';
import type { Server } from 'node:http';

import { createGracefulShutdown } from './shutdown.js';

let closeCalls = 0;
let disconnectCalls = 0;

const fakeServer = {
  close: (callback: (error?: Error) => void) => {
    closeCalls += 1;
    callback();
    return fakeServer as unknown as Server;
  },
} as unknown as Server;

const shutdown = createGracefulShutdown({
  server: fakeServer,
  prisma: {
    $disconnect: async () => {
      disconnectCalls += 1;
    },
  },
  logger: {
    log: () => undefined,
    error: () => undefined,
  },
});

await Promise.all([shutdown('SIGINT'), shutdown('SIGTERM')]);

assert.equal(closeCalls, 1);
assert.equal(disconnectCalls, 1);

console.log('shutdown lifecycle checks passed');
