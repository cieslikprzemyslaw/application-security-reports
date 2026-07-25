import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { activitySchema } from './activity.schema.js';

const validActivity = {
  id: 'act_00000000-0000-0000-0000-000000000001',
  eventType: 'assessment.completed' as const,
  result: 'success' as const,
  severity: 'informational' as const,
  actor: {
    type: 'local-user' as const,
    id: 'local-user',
  },
  resource: {
    type: 'assessment' as const,
    id: 'asm_00000000-0000-0000-0000-000000000001',
    companyId: 'cmp_00000000-0000-0000-0000-000000000001',
    assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
  },
  correlationId: 'correlation-1',
  message: 'Assessment completed.',
  createdAt: '2026-07-25T08:00:00.000Z',
};

describe('Activity schema', () => {
  it('parses a complete security-safe event', () => {
    assert.deepEqual(activitySchema.parse(validActivity), validActivity);
  });

  it('rejects unknown vocabulary and malformed nested resources', () => {
    for (const value of [
      { ...validActivity, eventType: 'assessment.destroyed' },
      { ...validActivity, result: 'partial' },
      {
        ...validActivity,
        resource: { ...validActivity.resource, type: 'filesystem' },
      },
      {
        ...validActivity,
        actor: { ...validActivity.actor, token: 'must-not-be-stored' },
      },
      {
        ...validActivity,
        resource: {
          ...validActivity.resource,
          filePath: '/private/evidence.txt',
        },
      },
    ]) {
      assert.equal(activitySchema.safeParse(value).success, false);
    }
  });

  it('rejects empty identifiers and messages', () => {
    assert.equal(
      activitySchema.safeParse({ ...validActivity, correlationId: '' }).success,
      false,
    );
    assert.equal(
      activitySchema.safeParse({ ...validActivity, message: '   ' }).success,
      false,
    );
  });
});
