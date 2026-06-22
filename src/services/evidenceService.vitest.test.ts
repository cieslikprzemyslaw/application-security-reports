import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { ApiError } from './apiClient.js';
import {
  createEvidenceService,
  type EvidenceCreateInput,
  type EvidenceUpdateInput,
} from './index.js';
import {
  assessment,
  createRequestSpy,
  evidence,
  expectSingleCall,
  threat,
} from './evidenceService.vitest.testUtils.js';

describe('evidenceService', () => {
  it('passes the migrated checks', async () => {
    {
      const { calls, request } = createRequestSpy({ data: [evidence] });
      const service = createEvidenceService(request);

      assert.deepEqual(await service.list({ assessmentId: assessment.id }), [
        evidence,
      ]);
      expectSingleCall(calls, {
        input: '/api/evidence',
        method: 'GET',
        query: {
          assessmentId: assessment.id,
        },
      });
    }

    {
      const { calls, request } = createRequestSpy({
        data: [
          evidence,
          {
            ...evidence,
            id: 'evd_00000000-0000-0000-0000-000000000002',
            threatIds: [],
          },
        ],
      });
      const service = createEvidenceService(request);

      assert.deepEqual(
        await service.list({
          assessmentId: assessment.id,
          threatId: threat.id,
        }),
        [evidence],
      );
      expectSingleCall(calls, {
        input: '/api/evidence',
        method: 'GET',
        query: {
          assessmentId: assessment.id,
        },
      });
    }

    {
      const { calls, request } = createRequestSpy({
        data: [
          {
            ...evidence,
            id: 'evd_00000000-0000-0000-0000-000000000002',
            threatIds: [],
          },
          {
            ...evidence,
            id: 'evd_00000000-0000-0000-0000-000000000003',
            threatIds: [threat.id, 'thr_00000000-0000-0000-0000-000000000002'],
          },
        ],
      });
      const service = createEvidenceService(request);

      assert.deepEqual(
        await service.list({
          assessmentId: assessment.id,
          threatId: threat.id,
        }),
        [
          {
            ...evidence,
            id: 'evd_00000000-0000-0000-0000-000000000003',
            threatIds: [threat.id, 'thr_00000000-0000-0000-0000-000000000002'],
          },
        ],
      );
      expectSingleCall(calls, {
        input: '/api/evidence',
        method: 'GET',
        query: {
          assessmentId: assessment.id,
        },
      });
    }

    {
      const controller = new AbortController();
      const { calls, request } = createRequestSpy({ data: evidence });
      const service = createEvidenceService(request);

      assert.deepEqual(
        await service.getById(evidence.id, controller.signal),
        evidence,
      );
      expectSingleCall(calls, {
        input: `/api/evidence/${evidence.id}`,
        method: 'GET',
      });
      assert.equal(calls[0]?.init?.signal, controller.signal);
    }

    {
      const { request } = createRequestSpy({
        data: {
          ...evidence,
          recordVersion: 7,
        },
      });
      const service = createEvidenceService(request);

      await assert.rejects(service.getById(evidence.id));
    }

    {
      const input: EvidenceCreateInput = {
        assessmentId: assessment.id,
        threatIds: [],
        type: evidence.type,
        title: evidence.title,
        description: evidence.description,
        content: evidence.content,
        fileName: evidence.fileName,
        mimeType: evidence.mimeType,
        capturedAt: evidence.capturedAt,
      };
      const { calls, request } = createRequestSpy({ data: evidence });
      const service = createEvidenceService(request);

      assert.deepEqual(await service.create(input), evidence);
      expectSingleCall(calls, {
        input: '/api/evidence',
        method: 'POST',
        body: input,
      });
      const createBody = calls[0]?.init?.body as
        | Record<string, unknown>
        | undefined;

      assert.equal(createBody ? 'recordVersion' in createBody : false, false);
      assert.equal(createBody ? 'filePath' in createBody : false, false);
      assert.equal(createBody ? 'storageKey' in createBody : false, false);
    }

    {
      const input: EvidenceCreateInput = {
        assessmentId: assessment.id,
        threatIds: [threat.id, 'thr_00000000-0000-0000-0000-000000000002'],
        type: 'http',
        title: 'HTTP evidence',
        description: 'HTTP evidence',
        content: 'HTTP evidence',
        capturedAt: evidence.capturedAt,
        httpExchanges: [
          {
            request: {
              method: 'POST',
              url: '/api/orders/1',
              body: 'first request',
            },
            response: {
              statusCode: 200,
              statusText: 'OK',
              body: 'first response',
            },
          },
          {
            request: {
              method: 'GET',
              url: '/api/orders/2',
              body: 'second request',
            },
            response: {
              statusCode: 201,
              statusText: 'Created',
              body: 'second response',
            },
          },
        ],
      };
      const { calls, request } = createRequestSpy({ data: evidence });
      const service = createEvidenceService(request);

      await service.create(input);

      assert.deepEqual(calls[0]?.init?.body, input);
    }

    {
      const input: EvidenceUpdateInput = {
        type: 'text',
        threatIds: [threat.id],
        httpExchanges: [],
        title: 'Updated evidence',
      };
      const { calls, request } = createRequestSpy({ data: evidence });
      const service = createEvidenceService(request);

      assert.deepEqual(await service.update(evidence.id, input), evidence);
      expectSingleCall(calls, {
        input: `/api/evidence/${evidence.id}`,
        method: 'PATCH',
        body: input,
      });
      const updateBody = calls[0]?.init?.body as
        | Record<string, unknown>
        | undefined;

      assert.equal(updateBody ? 'recordVersion' in updateBody : false, false);
      assert.equal(updateBody ? 'filePath' in updateBody : false, false);
      assert.equal(updateBody ? 'storageKey' in updateBody : false, false);
    }

    {
      const input: EvidenceUpdateInput = {
        type: 'note',
        title: 'Updated evidence',
        content: 'Updated content',
        threatIds: [],
      };
      const { calls, request } = createRequestSpy({ data: evidence });
      const service = createEvidenceService(request);

      await service.update(evidence.id, input);

      const updateBody = calls[0]?.init?.body as
        | { threatIds?: readonly string[] }
        | undefined;

      assert.equal(updateBody?.threatIds?.length, 0);
      assert.equal(
        'threatId' in ((updateBody ?? {}) as Record<string, unknown>),
        false,
      );
    }

    {
      const input: EvidenceUpdateInput = {
        type: 'http',
        title: 'Updated HTTP evidence',
        httpExchanges: [
          {
            request: {
              method: 'POST',
              url: '/api/orders/10',
              body: 'first',
            },
            response: {
              statusCode: 200,
              statusText: 'OK',
              body: 'first response',
            },
          },
          {
            request: {
              method: 'DELETE',
              url: '/api/orders/10',
              body: 'second',
            },
            response: {
              statusCode: 204,
              statusText: 'No Content',
              body: '',
            },
          },
        ],
      };
      const { calls, request } = createRequestSpy({ data: evidence });
      const service = createEvidenceService(request);

      await service.update(evidence.id, input);

      const updateBody = calls[0]?.init?.body as
        | { httpExchanges?: typeof input.httpExchanges }
        | undefined;

      assert.deepEqual(updateBody?.httpExchanges, input.httpExchanges);
    }

    {
      const input: EvidenceUpdateInput = {
        type: 'text',
        title: 'Updated evidence',
        httpExchanges: [],
      };
      const { calls, request } = createRequestSpy({ data: evidence });
      const service = createEvidenceService(request);

      await service.update(evidence.id, input);

      const updateBody = calls[0]?.init?.body as
        | { httpExchanges?: EvidenceUpdateInput['httpExchanges'] }
        | undefined;

      assert.deepEqual(updateBody?.httpExchanges, []);
    }

    {
      const { calls, request } = createRequestSpy({ data: undefined });
      const service = createEvidenceService(request);

      await service.remove(evidence.id);
      expectSingleCall(calls, {
        input: `/api/evidence/${evidence.id}`,
        method: 'DELETE',
      });
    }

    {
      const error = new ApiError('Evidence not found', 404);
      const { request } = createRequestSpy(error);
      const service = createEvidenceService(request);

      await assert.rejects(
        service.getById(evidence.id),
        same => same === error,
      );
    }

    console.log('evidence service checks passed');
  });
});
