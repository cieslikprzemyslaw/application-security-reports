import { randomUUID } from 'node:crypto';

import type { Company } from '../../../src/domain/company.js';
import type { ActivityEventType } from '../../../src/domain/common.js';
import {
  mapPrismaError,
  RepositoryConflictError,
  RepositoryNotFoundError,
  RepositoryStateError,
} from '../errors.js';
import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../repository.types.js';
import { appendActivity } from './activity.repository.js';
import { toIsoString, toOptionalText } from './repository.helpers.js';

export interface CompanyLifecycleOperations {
  archive(id: string): Promise<Company>;
  restore(id: string): Promise<Company>;
}

export type CompanyLifecycleDb = Pick<
  RepositoryClient,
  'company' | 'activity' | '$transaction'
>;

type CompanyRow = {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  contactName: string | null;
  contactEmail: string | null;
  logoUrl: string | null;
  footerText: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const companySelect = {
  id: true,
  name: true,
  description: true,
  website: true,
  contactName: true,
  contactEmail: true,
  logoUrl: true,
  footerText: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const toCompany = (row: CompanyRow): Company => ({
  id: row.id,
  name: row.name,
  description: toOptionalText(row.description),
  website: toOptionalText(row.website),
  contactName: toOptionalText(row.contactName),
  contactEmail: toOptionalText(row.contactEmail),
  logoUrl: row.logoUrl,
  footerText: toOptionalText(row.footerText),
  archivedAt: row.archivedAt ? toIsoString(row.archivedAt) : null,
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

const failureEventType = (command: 'archive' | 'restore'): ActivityEventType =>
  command === 'archive' ? 'company.archive-failed' : 'company.restore-failed';

const appendFailure = async (
  db: CompanyLifecycleDb,
  command: 'archive' | 'restore',
  id: string,
  correlationId: string,
): Promise<void> => {
  await appendActivity(db, {
    eventType: failureEventType(command),
    result: 'failure',
    severity: 'warning',
    actor: { type: 'local-user' },
    resource: { type: 'company', id, companyId: id },
    correlationId,
    message: `Company ${command} was rejected.`,
  });
};

const runCompanyTransition = async (
  db: CompanyLifecycleDb,
  command: 'archive' | 'restore',
  id: string,
): Promise<Company> => {
  const correlationId = randomUUID();
  const current = await db.company.findUnique({
    where: { id },
    select: companySelect,
  });

  if (!current) {
    await appendFailure(db, command, id, correlationId).catch(() => undefined);
    throw new RepositoryNotFoundError('Company not found.');
  }

  const isArchived = current.archivedAt !== null;

  if (command === 'archive' ? isArchived : !isArchived) {
    await appendFailure(db, command, id, correlationId).catch(() => undefined);
    throw new RepositoryStateError(
      command === 'archive'
        ? 'Company is already archived.'
        : 'Company is not archived.',
    );
  }

  try {
    return await db.$transaction(async (tx: RepositoryTransactionClient) => {
      const result = await tx.company.updateMany({
        where: { id, archivedAt: current.archivedAt },
        data: { archivedAt: command === 'archive' ? new Date() : null },
      });

      if (result.count !== 1) {
        throw new RepositoryConflictError('Company changed during transition.');
      }

      await appendActivity(tx, {
        eventType:
          command === 'archive' ? 'company.archived' : 'company.restored',
        result: 'success',
        severity: 'informational',
        actor: { type: 'local-user' },
        resource: { type: 'company', id, companyId: id },
        correlationId,
        message:
          command === 'archive' ? 'Company archived.' : 'Company restored.',
      });

      const updated = await tx.company.findUnique({
        where: { id },
        select: companySelect,
      });

      if (!updated) {
        throw new RepositoryNotFoundError('Company not found after transition.');
      }

      return toCompany(updated);
    });
  } catch (error) {
    const mapped = mapPrismaError(error);
    await appendFailure(db, command, id, correlationId).catch(() => undefined);
    throw mapped;
  }
};

export const createCompanyLifecycleOperations = (
  db: CompanyLifecycleDb,
): CompanyLifecycleOperations => ({
  archive: id => runCompanyTransition(db, 'archive', id),
  restore: id => runCompanyTransition(db, 'restore', id),
});
