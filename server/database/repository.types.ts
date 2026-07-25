import type { PrismaClient } from '../../generated/prisma/client.js';

export type RepositoryClient = Pick<
  PrismaClient,
  | 'company'
  | 'assessment'
  | 'assessmentTemplate'
  | 'threat'
  | 'threatCwe'
  | 'evidence'
  | 'evidenceExchange'
  | 'report'
  | 'reportVersion'
  | 'evidenceThreat'
  | 'reportThreat'
  | 'activity'
  | 'settings'
  | '$transaction'
>;

export type RepositoryTransactionClient = Omit<
  RepositoryClient,
  '$transaction' | 'threatCwe' | 'assessmentTemplate'
> &
  Partial<Pick<RepositoryClient, 'threatCwe' | 'assessmentTemplate'>>;
