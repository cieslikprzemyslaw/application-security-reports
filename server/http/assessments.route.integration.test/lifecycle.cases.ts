import assert from 'node:assert/strict';

import { afterEach, beforeEach, describe, it } from 'vitest';

import {
  createAssessmentsRouteIntegrationHarness,
  type AssessmentsRouteIntegrationHarness,
} from './support.js';

const postCommand = async (
  harness: AssessmentsRouteIntegrationHarness,
  command: 'complete' | 'reopen' | 'archive' | 'restore',
  recordVersion: number,
) =>
  fetch(
    `${harness.server.baseUrl}/api/companies/${harness.company.id}` +
      `/assessments/${harness.assessment.id}/commands/${command}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordVersion }),
    },
  );

const readOverview = async (harness: AssessmentsRouteIntegrationHarness) =>
  fetch(
    `${harness.server.baseUrl}/api/companies/${harness.company.id}` +
      `/assessments/${harness.assessment.id}/overview`,
  );

const readBody = async (response: Response) =>
  (await response.json()) as {
    data?: {
      assessment: {
        status: string;
        completedAt?: string;
        archivedAt: string | null;
        recordVersion: number;
        availableActions: string[];
      };
    };
    error?: { code: string; message: string };
  };

const requireRecordVersion = (
  body: Awaited<ReturnType<typeof readBody>>,
): number => {
  const recordVersion = body.data?.assessment.recordVersion;
  assert.equal(typeof recordVersion, 'number');
  return recordVersion;
};

describe.sequential('Assessment lifecycle API integration', () => {
  let harness: AssessmentsRouteIntegrationHarness;

  beforeEach(async () => {
    harness = await createAssessmentsRouteIntegrationHarness();
  });

  afterEach(async () => {
    await harness.cleanup();
  });

  it('persists Complete, Reopen, Archive and Restore with Activity events', async () => {
    const initialVersion = harness.assessment.recordVersion;
    const complete = await postCommand(harness, 'complete', initialVersion);

    assert.equal(complete.status, 200);
    const completed = await readBody(complete);
    const completedVersion = requireRecordVersion(completed);

    assert.equal(completed.data?.assessment.status, 'completed');
    assert.match(
      completed.data?.assessment.completedAt ?? '',
      /^\d{4}-\d{2}-\d{2}$/,
    );
    assert.notEqual(completedVersion, initialVersion);
    assert.deepEqual(completed.data?.assessment.availableActions, [
      'reopen',
      'archive',
    ]);

    const invalidRepeat = await postCommand(
      harness,
      'complete',
      completedVersion,
    );
    assert.equal(invalidRepeat.status, 409);
    const invalidRepeatBody = await readBody(invalidRepeat);
    assert.equal(
      invalidRepeatBody.error?.code,
      'ASSESSMENT_TRANSITION_NOT_ALLOWED',
    );

    const afterInvalid = await harness.assessmentRepository.findById(
      harness.assessment.id,
    );
    assert.equal(afterInvalid?.status, 'completed');

    const staleReopen = await postCommand(harness, 'reopen', initialVersion);
    assert.equal(staleReopen.status, 409);
    const staleBody = await readBody(staleReopen);
    assert.equal(staleBody.error?.code, 'RESOURCE_MODIFIED');

    const reopen = await postCommand(harness, 'reopen', completedVersion);
    assert.equal(reopen.status, 200);
    const reopened = await readBody(reopen);
    const reopenedVersion = requireRecordVersion(reopened);

    assert.equal(reopened.data?.assessment.status, 'in-progress');
    assert.equal(reopened.data?.assessment.completedAt, undefined);
    assert.notEqual(reopenedVersion, completedVersion);

    const archive = await postCommand(harness, 'archive', reopenedVersion);
    assert.equal(archive.status, 200);
    const archived = await readBody(archive);
    const archivedVersion = requireRecordVersion(archived);

    assert.equal(archived.data?.assessment.status, 'archived');
    assert.equal(typeof archived.data?.assessment.archivedAt, 'string');
    assert.notEqual(archivedVersion, reopenedVersion);
    assert.deepEqual(archived.data?.assessment.availableActions, ['restore']);

    const listWhileArchived = await fetch(
      `${harness.server.baseUrl}/api/assessments?companyId=${harness.company.id}`,
    );
    assert.equal(listWhileArchived.status, 200);
    const listWhileArchivedBody = (await listWhileArchived.json()) as {
      data: Array<{ id: string }>;
    };
    assert.equal(
      listWhileArchivedBody.data.some(
        item => item.id === harness.assessment.id,
      ),
      false,
    );

    const directArchivedOverview = await readOverview(harness);
    assert.equal(directArchivedOverview.status, 200);
    const directArchivedBody = await readBody(directArchivedOverview);
    assert.equal(directArchivedBody.data?.assessment.status, 'archived');
    assert.deepEqual(directArchivedBody.data?.assessment.availableActions, [
      'restore',
    ]);

    const archivedPatch = await fetch(
      `${harness.server.baseUrl}/api/assessments/${harness.assessment.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Must not persist' }),
      },
    );
    assert.equal(archivedPatch.status, 409);
    const archivedPatchBody = await readBody(archivedPatch);
    assert.equal(archivedPatchBody.error?.code, 'ASSESSMENT_READ_ONLY');

    const restore = await postCommand(harness, 'restore', archivedVersion);
    assert.equal(restore.status, 200);
    const restored = await readBody(restore);
    const restoredVersion = requireRecordVersion(restored);

    assert.equal(restored.data?.assessment.status, 'in-progress');
    assert.equal(restored.data?.assessment.archivedAt, null);
    assert.notEqual(restoredVersion, archivedVersion);

    const events: Array<{ eventType: string; result: string }> =
      await harness.prisma.activity.findMany({
        where: { assessmentId: harness.assessment.id },
        orderBy: { createdAt: 'asc' },
        select: { eventType: true, result: true },
      });

    assert.deepEqual(
      events.map(event => [event.eventType, event.result]),
      [
        ['assessment.completed', 'success'],
        ['assessment.complete-failed', 'failure'],
        ['assessment.reopen-failed', 'failure'],
        ['assessment.reopened', 'success'],
        ['assessment.archived', 'success'],
        ['assessment.restored', 'success'],
      ],
    );
  });
});
