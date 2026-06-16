import type { PrismaClient } from '../../generated/prisma/client.js';

export type RepositoryClient = Pick<
  PrismaClient,
  | 'company'
  | 'assessment'
  | 'threat'
  | 'evidence'
  | 'evidenceExchange'
  | 'report'
  | 'evidenceThreat'
  | 'reportThreat'
  | 'activity'
  | 'settings'
  | '$transaction'
>;

export type RepositoryTransactionClient = Omit<
  RepositoryClient,
  '$transaction'
>;
