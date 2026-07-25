import assert from 'node:assert/strict';

import { afterEach, beforeEach, describe, it } from 'vitest';

import type { RepositoryTransactionClient } from '../repository.types.js';
import {
  appendActivity,
  createActivityRepository,
} from './activity.repository.js';
import {
  createTemporaryDatabase,
  type TemporaryDatabase,
} from '../../test/temporaryDatabase.js';

const activityInput = (
  eventType: 'assessment.completed' | 'assessment.reopened',
  createdAt: string,
) => ({
  eventType,
  result: 'success' as const,
  severity: 'informational' as const,
  actor: { type: 'local-user' as const },
  resource: {
    type: 'assessment' as const,
    id: 'asm_00000000-0000-0000-0000-000000000001',
    companyId: 'cmp_00000000-0000-0000-0000-000000000001',
    assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
  },
  correlationId: `${eventType}-correlation`,
  message:
    eventType === 'assessment.completed'
      ? 'Assessment completed.'
      : 'Assessment reopened.',
  createdAt,
});

describe.sequential('Activity repository integration', () => {
  let database: TemporaryDatabase;

  beforeEach(async () => {
    database = await createTemporaryDatabase();
  });

  afterEach(async () => {
    await database.cleanup();
  });

  it('appends immutable events and returns stable scoped ordering', async () => {
    const repository = createActivityRepository(database.prisma);

    await repository.append(
      activityInput('assessment.completed', '2026-07-25T08:00:00.000Z'),
    );
    await repository.append(
      activityInput('assessment.reopened', '2026-07-25T09:00:00.000Z'),
    );

    const companyEvents = await repository.findByCompanyId({
      companyId: 'cmp_00000000-0000-0000-0000-000000000001',
    });
    const assessmentEvents = await repository.findByAssessmentId({
      assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
    });
    const entityEvents = await repository.findByEntity({
      entityType: 'assessment',
      entityId: 'asm_00000000-0000-0000-0000-000000000001',
    });

    for (const events of [companyEvents, assessmentEvents, entityEvents]) {
      assert.deepEqual(
        events.map(event => event.eventType),
        ['assessment.reopened', 'assessment.completed'],
      );
    }

    assert.equal('update' in repository, false);
    assert.equal('delete' in repository, false);
  });

  it('does not leave an orphan event when the caller transaction fails', async () => {
    await assert.rejects(
      database.prisma.$transaction(async (tx: RepositoryTransactionClient) => {
        await appendActivity(
          tx,
          activityInput('assessment.completed', '2026-07-25T08:00:00.000Z'),
        );
        throw new Error('Rollback requested');
      }),
      /Rollback requested/,
    );

    assert.equal(await database.prisma.activity.count(), 0);
  });
});
