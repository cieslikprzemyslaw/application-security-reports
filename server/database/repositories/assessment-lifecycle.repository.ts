import { randomUUID } from 'node:crypto';

import type {
  Assessment,
  AssessmentLifecycleCommand,
} from '../../../src/domain/assessment.js';
import type {
  ActivityEventType,
  AssessmentStatus,
} from '../../../src/domain/common.js';
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
import {
  assessmentSelect,
  toAssessment,
  type AssessmentRow,
} from './assessment.repository.shared.js';

export interface AssessmentLifecycleContext {
  actorId?: string;
  correlationId?: string;
}

export interface AssessmentLifecycleOperations {
  complete(
    id: string,
    recordVersion: number,
    context?: AssessmentLifecycleContext,
  ): Promise<Assessment>;
  reopen(
    id: string,
    recordVersion: number,
    context?: AssessmentLifecycleContext,
  ): Promise<Assessment>;
  archive(
    id: string,
    recordVersion: number,
    context?: AssessmentLifecycleContext,
  ): Promise<Assessment>;
  restore(
    id: string,
    recordVersion: number,
    context?: AssessmentLifecycleContext,
  ): Promise<Assessment>;
}

export type AssessmentLifecycleDb = Pick<
  RepositoryClient,
  'assessment' | 'activity' | '$transaction'
>;

type TransitionPlan = {
  data: Record<string, unknown>;
  successEventType: ActivityEventType;
  successMessage: string;
};

const restorableStatuses = new Set<AssessmentStatus>([
  'draft',
  'in-progress',
  'completed',
]);

const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);
const toRecordVersion = (updatedAt: Date): number => updatedAt.getTime();

const getTransitionPlan = (
  command: AssessmentLifecycleCommand,
  current: AssessmentRow,
  now: Date,
): TransitionPlan => {
  if (command === 'complete') {
    if (current.status !== 'in-progress' || current.archivedAt !== null) {
      throw new RepositoryStateError(
        'Only an active in-progress Assessment can be completed.',
      );
    }

    return {
      data: { status: 'completed', completedAt: toDateOnly(now) },
      successEventType: 'assessment.completed',
      successMessage: 'Assessment completed.',
    };
  }

  if (command === 'reopen') {
    if (current.status !== 'completed' || current.archivedAt !== null) {
      throw new RepositoryStateError(
        'Only an active completed Assessment can be reopened.',
      );
    }

    return {
      data: { status: 'in-progress', completedAt: null },
      successEventType: 'assessment.reopened',
      successMessage: 'Assessment reopened.',
    };
  }

  if (command === 'archive') {
    if (current.status === 'archived' || current.archivedAt !== null) {
      throw new RepositoryStateError('Assessment is already archived.');
    }

    return {
      data: {
        status: 'archived',
        archivedAt: now,
        archivedFromStatus: current.status,
      },
      successEventType: 'assessment.archived',
      successMessage: 'Assessment archived.',
    };
  }

  if (
    current.status !== 'archived' ||
    current.archivedAt === null ||
    !restorableStatuses.has(current.archivedFromStatus as AssessmentStatus)
  ) {
    throw new RepositoryStateError('Assessment cannot be restored.');
  }

  const restoredStatus = current.archivedFromStatus as AssessmentStatus;

  return {
    data: {
      status: restoredStatus,
      archivedAt: null,
      archivedFromStatus: null,
      ...(restoredStatus === 'completed' ? {} : { completedAt: null }),
    },
    successEventType: 'assessment.restored',
    successMessage: 'Assessment restored.',
  };
};

const failureEventTypes: Record<
  AssessmentLifecycleCommand,
  ActivityEventType
> = {
  complete: 'assessment.complete-failed',
  reopen: 'assessment.reopen-failed',
  archive: 'assessment.archive-failed',
  restore: 'assessment.restore-failed',
};

const appendFailureEvent = async (
  db: AssessmentLifecycleDb,
  command: AssessmentLifecycleCommand,
  assessmentId: string,
  companyId: string | undefined,
  context: AssessmentLifecycleContext,
): Promise<void> => {
  await appendActivity(db, {
    eventType: failureEventTypes[command],
    result: 'failure',
    severity: 'warning',
    actor: {
      type: 'local-user',
      ...(context.actorId ? { id: context.actorId } : {}),
    },
    resource: {
      type: 'assessment',
      id: assessmentId,
      ...(companyId ? { companyId } : {}),
      assessmentId,
    },
    correlationId: context.correlationId ?? randomUUID(),
    message: `Assessment ${command} was rejected.`,
  });
};

const runTransition = async (
  db: AssessmentLifecycleDb,
  command: AssessmentLifecycleCommand,
  id: string,
  recordVersion: number,
  context: AssessmentLifecycleContext = {},
): Promise<Assessment> => {
  const correlationId = context.correlationId ?? randomUUID();
  const current = await db.assessment.findUnique({
    where: { id },
    select: assessmentSelect,
  });

  if (!current) {
    await appendFailureEvent(db, command, id, undefined, {
      ...context,
      correlationId,
    }).catch(() => undefined);
    throw new RepositoryNotFoundError('Assessment not found.');
  }

  if (toRecordVersion(current.updatedAt) !== recordVersion) {
    await appendFailureEvent(db, command, id, current.companyId, {
      ...context,
      correlationId,
    }).catch(() => undefined);
    throw new RepositoryConflictError('Assessment record version is stale.');
  }

  let plan: TransitionPlan;

  try {
    plan = getTransitionPlan(command, current, new Date());
  } catch (error) {
    await appendFailureEvent(db, command, id, current.companyId, {
      ...context,
      correlationId,
    }).catch(() => undefined);
    throw error;
  }

  try {
    return await db.$transaction(async (tx: RepositoryTransactionClient) => {
      const result = await tx.assessment.updateMany({
        where: {
          id,
          updatedAt: current.updatedAt,
          status: current.status,
          archivedAt: current.archivedAt,
        },
        data: plan.data,
      });

      if (result.count !== 1) {
        throw new RepositoryConflictError(
          'Assessment changed during transition.',
        );
      }

      await appendActivity(tx, {
        eventType: plan.successEventType,
        result: 'success',
        severity: 'informational',
        actor: {
          type: 'local-user',
          ...(context.actorId ? { id: context.actorId } : {}),
        },
        resource: {
          type: 'assessment',
          id,
          companyId: current.companyId,
          assessmentId: id,
        },
        correlationId,
        message: plan.successMessage,
      });

      const updated = await tx.assessment.findUnique({
        where: { id },
        select: assessmentSelect,
      });

      if (!updated) {
        throw new RepositoryNotFoundError(
          'Assessment not found after transition.',
        );
      }

      return toAssessment(updated);
    });
  } catch (error) {
    const mapped = mapPrismaError(error);

    await appendFailureEvent(db, command, id, current.companyId, {
      ...context,
      correlationId,
    }).catch(() => undefined);

    throw mapped;
  }
};

export const createAssessmentLifecycleOperations = (
  db: AssessmentLifecycleDb,
): AssessmentLifecycleOperations => ({
  complete: (id, recordVersion, context) =>
    runTransition(db, 'complete', id, recordVersion, context),
  reopen: (id, recordVersion, context) =>
    runTransition(db, 'reopen', id, recordVersion, context),
  archive: (id, recordVersion, context) =>
    runTransition(db, 'archive', id, recordVersion, context),
  restore: (id, recordVersion, context) =>
    runTransition(db, 'restore', id, recordVersion, context),
});
