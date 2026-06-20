import assert from 'node:assert/strict';

import {
  createAssessmentService,
  type AssessmentCreateInput,
  type AssessmentUpdateInput,
} from './index.js';
import type { ApiRequestFn } from './serviceHelpers.js';
import type { ApiRequestOptions } from './apiClient.js';

type RequestCall = {
  input: RequestInfo | URL;
  init?: ApiRequestOptions;
};

const createRequestSpy = <TResponse>(
  response: TResponse | Error,
): {
  calls: RequestCall[];
  request: ApiRequestFn;
} => {
  const calls: RequestCall[] = [];

  const request: ApiRequestFn = async <T>(
    input: RequestInfo | URL,
    init?: import('./apiClient.js').ApiRequestOptions,
  ) => {
    calls.push({ input, init });

    if (response instanceof Error) {
      throw response;
    }

    return response as unknown as T;
  };

  return { calls, request };
};

const expectSingleCall = (
  calls: RequestCall[],
  expected: {
    input: string;
    method: string;
    body?: unknown;
    query?: ApiRequestOptions['query'];
  },
) => {
  assert.equal(calls.length, 1);
  const call = calls[0];

  assert.ok(call);
  assert.equal(String(call.input), expected.input);
  assert.equal(call.init?.method, expected.method);

  if (expected.body !== undefined) {
    assert.deepEqual(call.init?.body, expected.body);
  } else {
    assert.equal(call.init?.body, undefined);
  }

  if (expected.query !== undefined) {
    assert.deepEqual(call.init?.query, expected.query);
  }
};

const company = {
  id: 'cmp_00000000-0000-0000-0000-000000000001',
  name: 'Northstar Digital',
} as const;

const assessment = {
  id: 'asm_00000000-0000-0000-0000-000000000001',
  companyId: company.id,
  title: 'Customer Services Portal',
  description: 'Assessment of the customer portal',
  scope: 'Web application',
  status: 'in-progress',
  startedAt: '2026-06-01',
  completedAt: '2026-06-10',
  applicationName: 'Customer Services Portal',
  environment: 'Production',
  assessmentType: 'Web App',
  overallRisk: 'high',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
} as const;

const assessmentOverview = {
  company: {
    id: company.id,
    name: company.name,
  },
  assessment: {
    ...assessment,
    recordVersion: 3,
    findingsCount: 7,
    evidenceCount: 2,
    reportVersionCount: 1,
    testerName: 'Alex Mercer',
    availableActions: ['complete', 'archive'],
  },
} as const;

const assessmentSummary = {
  id: assessment.id,
  companyId: assessment.companyId,
  name: assessment.title,
  type: assessment.assessmentType,
  status: assessment.status,
  findingsCount: 7,
  updatedAt: assessment.updatedAt,
  description: assessment.description,
  scope: assessment.scope,
} as const;

{
  const { calls, request } = createRequestSpy({ data: [assessmentSummary] });
  const service = createAssessmentService(request);

  assert.deepEqual(await service.list({ companyId: company.id }), [
    assessmentSummary,
  ]);
  expectSingleCall(calls, {
    input: '/api/assessments',
    method: 'GET',
    query: {
      companyId: company.id,
    },
  });
}

{
  const controller = new AbortController();
  const { calls, request } = createRequestSpy({ data: assessmentOverview });
  const service = createAssessmentService(request);

  assert.deepEqual(
    await service.getOverview(company.id, assessment.id, controller.signal),
    assessmentOverview,
  );
  expectSingleCall(calls, {
    input: `/api/companies/${company.id}/assessments/${assessment.id}/overview`,
    method: 'GET',
  });
  assert.equal(calls[0]?.init?.signal, controller.signal);
}

{
  const { calls, request } = createRequestSpy({ data: assessment });
  const service = createAssessmentService(request);

  assert.deepEqual(await service.getById(assessment.id), assessment);
  expectSingleCall(calls, {
    input: `/api/assessments/${assessment.id}`,
    method: 'GET',
  });
}

{
  const input: AssessmentCreateInput = {
    companyId: company.id,
    title: assessment.title,
    description: assessment.description,
    scope: assessment.scope,
    status: assessment.status,
    startedAt: assessment.startedAt,
    completedAt: assessment.completedAt,
    applicationName: assessment.applicationName,
    environment: assessment.environment,
    assessmentType: assessment.assessmentType,
    overallRisk: assessment.overallRisk,
  };
  const { calls, request } = createRequestSpy({ data: assessment });
  const service = createAssessmentService(request);

  assert.deepEqual(await service.create(input), assessment);
  expectSingleCall(calls, {
    input: '/api/assessments',
    method: 'POST',
    body: input,
  });
}

{
  const input: AssessmentUpdateInput = {
    title: 'Updated assessment',
  };
  const { calls, request } = createRequestSpy({ data: assessment });
  const service = createAssessmentService(request);

  assert.deepEqual(await service.update(assessment.id, input), assessment);
  expectSingleCall(calls, {
    input: `/api/assessments/${assessment.id}`,
    method: 'PATCH',
    body: input,
  });
}

{
  const { calls, request } = createRequestSpy({ data: assessmentOverview });
  const service = createAssessmentService(request);

  assert.deepEqual(
    await service.start(company.id, assessment.id, 3),
    assessmentOverview,
  );
  expectSingleCall(calls, {
    input: `/api/companies/${company.id}/assessments/${assessment.id}/commands/start`,
    method: 'POST',
    body: { recordVersion: 3 },
  });
}

{
  const { calls, request } = createRequestSpy({ data: assessmentOverview });
  const service = createAssessmentService(request);

  assert.deepEqual(
    await service.complete(company.id, assessment.id, 3),
    assessmentOverview,
  );
  expectSingleCall(calls, {
    input: `/api/companies/${company.id}/assessments/${assessment.id}/commands/complete`,
    method: 'POST',
    body: { recordVersion: 3 },
  });
}

{
  const { calls, request } = createRequestSpy({ data: assessmentOverview });
  const service = createAssessmentService(request);

  assert.deepEqual(
    await service.reopen(company.id, assessment.id, 3),
    assessmentOverview,
  );
  expectSingleCall(calls, {
    input: `/api/companies/${company.id}/assessments/${assessment.id}/commands/reopen`,
    method: 'POST',
    body: { recordVersion: 3 },
  });
}

{
  const { calls, request } = createRequestSpy({ data: assessmentOverview });
  const service = createAssessmentService(request);

  assert.deepEqual(
    await service.archive(company.id, assessment.id, 3),
    assessmentOverview,
  );
  expectSingleCall(calls, {
    input: `/api/companies/${company.id}/assessments/${assessment.id}/commands/archive`,
    method: 'POST',
    body: { recordVersion: 3 },
  });
}

console.log('assessment service checks passed');
