import assert from 'node:assert/strict';

import { ApiError } from './apiClient.js';
import {
  assessmentService,
  createAssessmentService,
  createCompanyService,
  createEvidenceService,
  createThreatService,
  companyService,
  evidenceService,
  reportService,
  settingsService,
  threatService,
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

const company = {
  id: 'cmp_00000000-0000-0000-0000-000000000001',
  name: 'Northstar Digital',
  description: 'Security consulting and managed assessment services',
  website: 'https://northstar.example',
  contactName: 'Alex Mercer',
  contactEmail: 'security@northstar.example',
  logoPath: '/logos/northstar.svg',
  footerText: 'Confidential - do not distribute.',
  assessmentCount: 6,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
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

const evidence = {
  id: 'evd_00000000-0000-0000-0000-000000000001',
  assessmentId: assessment.id,
  threatIds: [],
  type: 'note',
  title: 'Evidence note',
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-05T00:00:00.000Z',
} as const;

const threat = {
  id: 'thr_00000000-0000-0000-0000-000000000001',
  assessmentId: assessment.id,
  title: 'Missing Server-Side Authorization',
  description: 'The endpoint returns another customer order.',
  severity: 'critical',
  strideCategories: ['spoofing', 'tampering'],
  status: 'accepted-risk',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
} as const;

{
  const controller = new AbortController();
  const { calls, request } = createRequestSpy({ data: [company] });
  const service = createCompanyService(request);

  assert.deepEqual(await service.list(controller.signal), [company]);
  assert.equal(calls[0]?.init?.signal, controller.signal);
}

{
  const controller = new AbortController();
  const { calls, request } = createRequestSpy({
    data: {
      company,
      assessmentCounts: {
        total: 6,
        draft: 1,
        inProgress: 3,
        completed: 2,
      },
      recentAssessments: [],
      recentReports: null,
    },
  });
  const service = createCompanyService(request);

  assert.deepEqual(await service.getOverview(company.id, controller.signal), {
    company,
    assessmentCounts: {
      total: 6,
      draft: 1,
      inProgress: 3,
      completed: 2,
    },
    recentAssessments: [],
    recentReports: null,
  });
  assert.equal(calls[0]?.input, `/api/companies/${company.id}/overview`);
  assert.equal(calls[0]?.init?.signal, controller.signal);
}

{
  const error = new ApiError('Company not found', 404);
  const { request } = createRequestSpy(error);
  const service = createCompanyService(request);

  await assert.rejects(service.getById(company.id), same => same === error);
}

{
  const { calls, request } = createRequestSpy(undefined);
  const service = createCompanyService(request);

  await service.remove(company.id);
  assert.equal(calls[0]?.input, `/api/companies/${company.id}`);
  assert.equal(calls[0]?.init?.method, 'DELETE');
}

{
  const error = new ApiError('Request validation failed', 400);
  const { request } = createRequestSpy(error);
  const service = createAssessmentService(request);

  await assert.rejects(
    service.list({ companyId: company.id }),
    same => same === error,
  );
}

{
  const controller = new AbortController();
  const { calls, request } = createRequestSpy({ data: [assessment] });
  const service = createAssessmentService(request);

  assert.deepEqual(
    await service.list({ companyId: company.id }, controller.signal),
    [assessment],
  );
  assert.deepEqual(calls[0]?.init?.query, { companyId: company.id });
  assert.equal(calls[0]?.init?.signal, controller.signal);
}

{
  const { calls, request } = createRequestSpy(undefined);
  const service = createThreatService(request);

  await service.remove(threat.id);
  assert.equal(calls[0]?.input, `/api/threats/${threat.id}`);
  assert.equal(calls[0]?.init?.method, 'DELETE');
}

{
  const { calls, request } = createRequestSpy(undefined);
  const service = createAssessmentService(request);

  await service.remove(assessment.id);
  assert.equal(calls[0]?.input, `/api/assessments/${assessment.id}`);
  assert.equal(calls[0]?.init?.method, 'DELETE');
}

{
  const controller = new AbortController();
  const { calls, request } = createRequestSpy({ data: evidence });
  const service = createEvidenceService(request);

  assert.deepEqual(
    await service.getById(evidence.id, controller.signal),
    evidence,
  );
  assert.equal(calls[0]?.init?.signal, controller.signal);
}

{
  const { calls, request } = createRequestSpy(undefined);
  const service = createEvidenceService(request);

  await service.remove(evidence.id);
  assert.equal(calls[0]?.input, `/api/evidence/${evidence.id}`);
  assert.equal(calls[0]?.init?.method, 'DELETE');
}

assert.equal(typeof companyService.list, 'function');
assert.equal(typeof companyService.getOverview, 'function');
assert.equal(typeof assessmentService.list, 'function');
assert.equal(typeof assessmentService.getOverview, 'function');
assert.equal(typeof assessmentService.start, 'function');
assert.equal(typeof assessmentService.complete, 'function');
assert.equal(typeof assessmentService.reopen, 'function');
assert.equal(typeof assessmentService.archive, 'function');
assert.equal(typeof evidenceService.list, 'function');
assert.equal(typeof reportService.getById, 'function');
assert.equal(typeof settingsService.get, 'function');
assert.equal(typeof threatService.remove, 'function');

console.log('services boundary checks passed');
