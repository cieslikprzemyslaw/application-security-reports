import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import type { Evidence, Threat } from '~/domain';
import type { AssessmentListItem } from '~/services';

import {
  createReportBuilderHierarchyLoader,
  type ReportBuilderHierarchy,
} from './reportBuilderTree.service';

describe('reportBuilderHierarchyLoader', () => {
  it('loads only the current company assessments and groups evidence by threat', async () => {
    const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
    const assessmentOne: AssessmentListItem = {
      id: 'asm_00000000-0000-0000-0000-000000000001',
      companyId,
      name: 'Customer Services Portal',
      applicationName: 'Customer Services Portal',
      type: 'Web App',
      status: 'in-progress',
      findingsCount: 1,
      updatedAt: '2026-06-10T00:00:00.000Z',
      description: 'Assessment of the customer portal',
      scope: 'Web application',
    };
    const assessmentTwo: AssessmentListItem = {
      id: 'asm_00000000-0000-0000-0000-000000000002',
      companyId,
      name: 'Payments Gateway API',
      applicationName: 'Payments Gateway API',
      type: 'API',
      status: 'draft',
      findingsCount: 0,
      updatedAt: '2026-06-11T00:00:00.000Z',
      description: 'Assessment of the payments API',
      scope: 'API endpoints',
    };
    const threatOne: Threat = {
      id: 'thr_00000000-0000-0000-0000-000000000001',
      assessmentId: assessmentOne.id,
      title: 'Missing Server-Side Authorization',
      description: 'Authorization is missing on the order lookup endpoint.',
      severity: 'critical',
      strideCategories: ['elevation-of-privilege'],
      status: 'open',
      createdAt: '2026-06-03T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    };
    const threatTwo: Threat = {
      id: 'thr_00000000-0000-0000-0000-000000000002',
      assessmentId: assessmentOne.id,
      title: 'Verbose Error Messages',
      description: 'Unhandled errors disclose stack traces.',
      severity: 'medium',
      strideCategories: ['information-disclosure'],
      status: 'mitigated',
      createdAt: '2026-06-04T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
    };
    const evidenceOne: Evidence = {
      id: 'evd_00000000-0000-0000-0000-000000000001',
      assessmentId: assessmentOne.id,
      threatIds: [threatOne.id],
      type: 'text',
      title: 'Authorization note',
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z',
    };
    const evidenceTwo: Evidence = {
      id: 'evd_00000000-0000-0000-0000-000000000002',
      assessmentId: assessmentOne.id,
      threatIds: [threatOne.id, threatTwo.id],
      type: 'http',
      title: 'HTTP exchange evidence',
      createdAt: '2026-06-06T00:00:00.000Z',
      updatedAt: '2026-06-06T00:00:00.000Z',
    };
    const evidenceThree: Evidence = {
      id: 'evd_00000000-0000-0000-0000-000000000003',
      assessmentId: assessmentOne.id,
      threatIds: [],
      type: 'note',
      title: 'Unlinked evidence',
      createdAt: '2026-06-07T00:00:00.000Z',
      updatedAt: '2026-06-07T00:00:00.000Z',
    };

    const assessmentCalls: Array<{
      filters: { companyId: string };
      signal?: AbortSignal;
    }> = [];
    const threatCalls: Array<{
      assessmentId: string;
      signal?: AbortSignal;
    }> = [];
    const evidenceCalls: Array<{
      assessmentId: string;
      signal?: AbortSignal;
    }> = [];
    const controller = new AbortController();

    const loader = createReportBuilderHierarchyLoader({
      assessmentService: {
        async list(filters?: { companyId?: string }, signal?: AbortSignal) {
          assessmentCalls.push({ filters, signal });
          return [assessmentOne, assessmentTwo];
        },
      },
      threatService: {
        async listByAssessment(assessmentId, signal) {
          threatCalls.push({ assessmentId, signal });

          return assessmentId === assessmentOne.id
            ? [threatOne, threatTwo]
            : [];
        },
      },
      evidenceService: {
        async list(filters, signal) {
          evidenceCalls.push({
            assessmentId: filters.assessmentId,
            signal,
          });

          return filters.assessmentId === assessmentOne.id
            ? [evidenceOne, evidenceTwo, evidenceThree]
            : [];
        },
      },
    });

    const hierarchy = (await loader(
      companyId,
      controller.signal,
    )) as ReportBuilderHierarchy;

    assert.deepEqual(assessmentCalls, [
      { filters: { companyId }, signal: controller.signal },
    ]);
    assert.deepEqual(threatCalls, [
      { assessmentId: assessmentOne.id, signal: controller.signal },
      { assessmentId: assessmentTwo.id, signal: controller.signal },
    ]);
    assert.deepEqual(evidenceCalls, [
      { assessmentId: assessmentOne.id, signal: controller.signal },
      { assessmentId: assessmentTwo.id, signal: controller.signal },
    ]);

    assert.equal(hierarchy.companyId, companyId);
    assert.equal(hierarchy.assessments.length, 2);
    assert.equal(hierarchy.assessments[0]?.assessment.id, assessmentOne.id);
    assert.equal(hierarchy.assessments[0]?.threats.length, 2);
    assert.deepEqual(
      hierarchy.assessments[0]?.threats[0]?.evidence.map(
        item => item.evidence.id,
      ),
      [evidenceOne.id, evidenceTwo.id],
    );
    assert.deepEqual(
      hierarchy.assessments[0]?.threats[1]?.evidence.map(
        item => item.evidence.id,
      ),
      [evidenceTwo.id],
    );
    assert.deepEqual(
      hierarchy.assessments[1]?.threats.map(item => item.threat.id),
      [],
    );
  });
});
