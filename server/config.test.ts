import assert from 'node:assert/strict';

import { loadServerConfig, ServerConfigError } from './config.js';

const defaultConfig = loadServerConfig({});
assert.equal(defaultConfig.apiPort, 3001);
assert.equal(defaultConfig.frontendOrigin, 'http://localhost:5173');
assert.equal(defaultConfig.nodeEnv, 'development');

const apiPortConfig = loadServerConfig({
  API_PORT: '4100',
  FRONTEND_ORIGIN: 'http://localhost:4173',
  NODE_ENV: 'production',
});

assert.equal(apiPortConfig.apiPort, 4100);
assert.equal(apiPortConfig.frontendOrigin, 'http://localhost:4173');
assert.equal(apiPortConfig.nodeEnv, 'production');

assert.throws(
  () =>
    loadServerConfig({
      API_PORT: 'abc',
      FRONTEND_ORIGIN: 'http://localhost:5173',
    }),
  error => {
    assert.ok(error instanceof ServerConfigError);
    assert.ok(
      error.details.some(detail => detail.path === 'apiPort'),
      'Expected invalid API port to be identified',
    );

    return true;
  },
);

assert.throws(
  () =>
    loadServerConfig({
      API_PORT: '3001',
      FRONTEND_ORIGIN: 'http://localhost:5173/app',
    }),
  error => {
    assert.ok(error instanceof ServerConfigError);
    assert.ok(
      error.details.some(detail => detail.path === 'frontendOrigin'),
      'Expected invalid frontend origin to be identified',
    );

    return true;
  },
);

assert.throws(
  () =>
    loadServerConfig({
      API_PORT: '3001',
      FRONTEND_ORIGIN: 'http://localhost:5173',
      NODE_ENV: 'staging',
    }),
  error => {
    assert.ok(error instanceof ServerConfigError);
    assert.ok(
      error.details.some(detail => detail.path === 'nodeEnv'),
      'Expected invalid runtime environment to be identified',
    );

    return true;
  },
);

console.log('server configuration checks passed');
