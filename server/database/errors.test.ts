import assert from 'node:assert/strict';

import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from '@prisma/client/runtime/client';

import {
  mapPrismaError,
  RepositoryConflictError,
  RepositoryConstraintError,
  RepositoryError,
  RepositoryNotFoundError,
  RepositoryUnavailableError,
} from './errors.js';

const knownRequestError = new PrismaClientKnownRequestError(
  'Known request error',
  {
    code: 'P2002',
    clientVersion: '7.8.0',
  },
);

const foreignKeyError = new PrismaClientKnownRequestError('Foreign key error', {
  code: 'P2003',
  clientVersion: '7.8.0',
});

const notFoundError = new PrismaClientKnownRequestError('Not found error', {
  code: 'P2025',
  clientVersion: '7.8.0',
});

const conflict = mapPrismaError(knownRequestError);
assert.ok(conflict instanceof RepositoryConflictError);
assert.equal(conflict.cause, knownRequestError);
assert.equal(
  conflict.message,
  'A record with the same unique value already exists.',
);

const constraint = mapPrismaError(foreignKeyError);
assert.ok(constraint instanceof RepositoryConstraintError);
assert.equal(constraint.cause, foreignKeyError);

const notFound = mapPrismaError(notFoundError);
assert.ok(notFound instanceof RepositoryNotFoundError);
assert.equal(notFound.cause, notFoundError);

const unavailable = mapPrismaError(
  new PrismaClientUnknownRequestError('Unknown request error', {
    clientVersion: '7.8.0',
  }),
);
assert.ok(unavailable instanceof RepositoryUnavailableError);

const initialization = mapPrismaError(
  new PrismaClientInitializationError('Init error', '7.8.0'),
);
assert.ok(initialization instanceof RepositoryUnavailableError);

const fallback = mapPrismaError(new Error('boom'));
assert.ok(fallback instanceof RepositoryError);
assert.equal(fallback.message, 'The database operation failed.');

console.log('repository error mapping checks passed');
