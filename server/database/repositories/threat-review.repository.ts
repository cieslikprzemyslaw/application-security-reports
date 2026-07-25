import {
  isThreatReadyForReview,
  type ThreatReviewCommand,
} from '../../../src/domain/threatReview.js';
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

export interface ThreatReviewOperations {
  transitionReview(
    id: string,
    command: ThreatReviewCommand,
    recordVersion: number,
  ): Promise<void>;
}

export type ThreatReviewDb = Pick<RepositoryClient, 'threat' | '$transaction'>;

type ReviewRow = {
  id: string;
  status: string;
  updatedAt: Date;
  title: string;
  owaspCategoryCode: string | null;
  customCategory: string | null;
  affectedComponent: string | null;
  reproductionSteps: string | null;
  observation: string | null;
  impact: string | null;
  risk: string | null;
  remediation: string | null;
  recommendation: string | null;
  references: string | null;
};

const reviewSelect = {
  id: true,
  status: true,
  updatedAt: true,
  title: true,
  owaspCategoryCode: true,
  customCategory: true,
  affectedComponent: true,
  reproductionSteps: true,
  observation: true,
  impact: true,
  risk: true,
  remediation: true,
  recommendation: true,
  references: true,
} as const;

const getNextStatus = (
  current: ReviewRow,
  command: ThreatReviewCommand,
): string => {
  if (command === 'submit-review') {
    if (current.status !== 'open') {
      throw new RepositoryStateError(
        'Only an open Threat can be submitted for review.',
      );
    }

    if (!isThreatReadyForReview(current)) {
      throw new RepositoryStateError(
        'Complete the required Threat details before submitting for review.',
      );
    }

    return 'in-review';
  }

  if (command === 'approve') {
    if (current.status !== 'in-review') {
      throw new RepositoryStateError(
        'Only a Threat in review can be approved.',
      );
    }

    return 'resolved';
  }

  if (command === 'request-changes') {
    if (current.status !== 'in-review') {
      throw new RepositoryStateError(
        'Changes can only be requested for a Threat in review.',
      );
    }

    return 'open';
  }

  if (current.status !== 'resolved') {
    throw new RepositoryStateError('Only a resolved Threat can be reopened.');
  }

  return 'open';
};

export const createThreatReviewOperations = (
  db: ThreatReviewDb,
): ThreatReviewOperations => ({
  async transitionReview(id, command, recordVersion) {
    const current = (await db.threat.findUnique({
      where: { id },
      select: reviewSelect,
    })) as ReviewRow | null;

    if (!current) {
      throw new RepositoryNotFoundError('Threat not found.');
    }

    if (current.updatedAt.getTime() !== recordVersion) {
      throw new RepositoryConflictError('Threat record version is stale.');
    }

    const nextStatus = getNextStatus(current, command);
    const transitionTime = new Date(
      Math.max(Date.now(), current.updatedAt.getTime() + 1),
    );

    try {
      await db.$transaction(async (tx: RepositoryTransactionClient) => {
        const updated = await tx.threat.updateMany({
          where: {
            id,
            status: current.status,
            updatedAt: current.updatedAt,
          },
          data: {
            status: nextStatus,
            updatedAt: transitionTime,
          },
        });

        if (updated.count !== 1) {
          throw new RepositoryConflictError(
            'Threat changed during review transition.',
          );
        }
      });
    } catch (error) {
      throw mapPrismaError(error);
    }
  },
});
