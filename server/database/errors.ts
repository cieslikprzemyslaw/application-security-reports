import { Prisma } from '../../generated/prisma/client.js';

export class RepositoryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryError';
  }
}

export class RepositoryNotFoundError extends RepositoryError {
  constructor(
    message = 'The requested record could not be found.',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'RepositoryNotFoundError';
  }
}

export class RepositoryConflictError extends RepositoryError {
  constructor(
    message = 'A record with the same unique value already exists.',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'RepositoryConflictError';
  }
}

export class RepositoryConstraintError extends RepositoryError {
  constructor(
    message = 'The requested change violates a database constraint.',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'RepositoryConstraintError';
  }
}

export class RepositoryStateError extends RepositoryError {
  constructor(
    message = 'The requested operation is not valid for the current record state.',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'RepositoryStateError';
  }
}

export class RepositoryUnavailableError extends RepositoryError {
  constructor(
    message = 'The database is temporarily unavailable.',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'RepositoryUnavailableError';
  }
}

export const mapPrismaError = (error: unknown): RepositoryError => {
  if (error instanceof RepositoryError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const knownError = error as Prisma.PrismaClientKnownRequestError;

    switch (knownError.code) {
      case 'P2002':
        return new RepositoryConflictError(undefined, { cause: error });
      case 'P2003':
        return new RepositoryConstraintError(undefined, { cause: error });
      case 'P2025':
        return new RepositoryNotFoundError(undefined, { cause: error });
      default:
        return new RepositoryError('The database operation failed.', {
          cause: error,
        });
    }
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return new RepositoryUnavailableError(undefined, { cause: error });
  }

  return new RepositoryError('The database operation failed.', {
    cause: error instanceof Error ? error : new Error(String(error)),
  });
};
