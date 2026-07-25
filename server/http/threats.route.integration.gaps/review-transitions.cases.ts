import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { readError, withHarness } from './support.js';

type ThreatReviewResponse = {
  data: {
    id: string;
    status: string;
    recordVersion: number;
    reviewActions: Array<{
      command: string;
      allowed: boolean;
      reason?: string;
    }>;
  };
};

const readThreat = async (response: Response): Promise<ThreatReviewResponse> =>
  response.json() as Promise<ThreatReviewResponse>;

describe('Threat API integration gaps: review transitions', () => {
  it('uses server-owned actions and rejects invalid or stale transitions without mutation', async () => {
    await withHarness(async ({ server, primaryAssessment, prisma }) => {
      const createResponse = await fetch(`${server.baseUrl}/api/threats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: primaryAssessment.id,
          title: 'Missing object authorization',
          description: 'Another customer record can be loaded.',
          severity: 'high',
          strideCategories: ['spoofing'],
          status: 'open',
          owaspCategoryCode: 'A01:2025',
          affectedComponent: 'Orders API',
          reproductionSteps: 'Request another customer order identifier.',
          impact: 'Customer data can be exposed.',
          remediation: 'Apply object-level authorization.',
          references: 'OWASP A01:2025',
        }),
      });

      assert.equal(createResponse.status, 201);
      const created = await readThreat(createResponse);
      assert.equal(created.data.status, 'open');
      assert.deepEqual(
        created.data.reviewActions.map(action => action.command),
        ['submit-review'],
      );
      assert.equal(created.data.reviewActions[0]?.allowed, true);

      const submitResponse = await fetch(
        `${server.baseUrl}/api/threats/${created.data.id}/commands/submit-review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordVersion: created.data.recordVersion }),
        },
      );

      assert.equal(submitResponse.status, 200);
      const submitted = await readThreat(submitResponse);
      assert.equal(submitted.data.status, 'in-review');
      assert.deepEqual(
        submitted.data.reviewActions.map(action => action.command),
        ['approve', 'request-changes'],
      );

      const staleApproveResponse = await fetch(
        `${server.baseUrl}/api/threats/${created.data.id}/commands/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordVersion: created.data.recordVersion }),
        },
      );

      assert.equal(staleApproveResponse.status, 409);
      assert.equal(
        (await readError(staleApproveResponse)).error.code,
        'RESOURCE_MODIFIED',
      );
      assert.equal(
        (
          await prisma.threat.findUnique({
            where: { id: created.data.id },
            select: { status: true },
          })
        )?.status,
        'in-review',
      );

      const approveResponse = await fetch(
        `${server.baseUrl}/api/threats/${created.data.id}/commands/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordVersion: submitted.data.recordVersion }),
        },
      );

      assert.equal(approveResponse.status, 200);
      const approved = await readThreat(approveResponse);
      assert.equal(approved.data.status, 'resolved');
      assert.deepEqual(
        approved.data.reviewActions.map(action => action.command),
        ['reopen'],
      );

      const invalidApproveResponse = await fetch(
        `${server.baseUrl}/api/threats/${created.data.id}/commands/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordVersion: approved.data.recordVersion }),
        },
      );

      assert.equal(invalidApproveResponse.status, 409);
      assert.equal(
        (await readError(invalidApproveResponse)).error.code,
        'THREAT_TRANSITION_NOT_ALLOWED',
      );
      assert.equal(
        (
          await prisma.threat.findUnique({
            where: { id: created.data.id },
            select: { status: true },
          })
        )?.status,
        'resolved',
      );
    });
  });

  it('explains why an incomplete open Threat cannot enter review', async () => {
    await withHarness(async ({ server, primaryAssessment }) => {
      const createResponse = await fetch(`${server.baseUrl}/api/threats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: primaryAssessment.id,
          title: 'Incomplete review candidate',
          description: 'The finding still needs remediation details.',
          severity: 'medium',
          strideCategories: ['tampering'],
          status: 'open',
          owaspCategoryCode: 'A01:2025',
        }),
      });

      assert.equal(createResponse.status, 201);
      const created = await readThreat(createResponse);
      assert.equal(created.data.reviewActions[0]?.allowed, false);
      assert.match(
        created.data.reviewActions[0]?.reason ?? '',
        /complete the required threat details/i,
      );

      const response = await fetch(
        `${server.baseUrl}/api/threats/${created.data.id}/commands/submit-review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordVersion: created.data.recordVersion }),
        },
      );

      assert.equal(response.status, 409);
      assert.equal(
        (await readError(response)).error.code,
        'THREAT_TRANSITION_NOT_ALLOWED',
      );
    });
  });
});
