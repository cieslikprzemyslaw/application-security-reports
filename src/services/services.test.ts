import assert from 'node:assert/strict';

import { ApiError } from './apiClient.js';
import {
  createCompanyService,
  type CompanyCreateInput,
  type CompanyOverviewResponse,
  type CompanyUpdateInput,
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
  description: 'Security consulting and managed assessment services',
  website: 'https://northstar.example',
  contactName: 'Alex Mercer',
  contactEmail: 'security@northstar.example',
  logoUrl: null,
  footerText: 'Confidential - do not distribute.',
  assessmentCount: 6,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
} as const;

const companyOverview: CompanyOverviewResponse = {
  company,
  assessmentCounts: {
    total: 6,
    draft: 1,
    inProgress: 3,
    completed: 2,
  },
  recentAssessments: [
    {
      id: 'asm_00000000-0000-0000-0000-000000000001',
      applicationName: 'Customer Services Portal',
      companyName: company.name,
      assessmentType: 'Web App',
      severity: 'high',
      findingsCount: 7,
      status: 'in-progress',
    },
  ],
  recentReports: [
    {
      id: 'rpt_00000000-0000-0000-0000-000000000001',
      companyName: company.name,
      assessmentName: 'Customer Services Portal',
      reportType: 'Draft report',
      status: 'Generated',
      generatedAt: '2026-06-12T09:00:00.000Z',
      updatedAt: '2026-06-12T09:00:00.000Z',
    },
  ],
};

{
  const { calls, request } = createRequestSpy({ data: [company] });
  const service = createCompanyService(request);
  const controller = new AbortController();

  assert.deepEqual(await service.list(controller.signal), [company]);
  expectSingleCall(calls, {
    input: '/api/companies',
    method: 'GET',
  });
  assert.equal(calls[0]?.init?.signal, controller.signal);
}

{
  const { calls, request } = createRequestSpy({ data: company });
  const service = createCompanyService(request);

  assert.deepEqual(await service.getById(company.id), company);
  expectSingleCall(calls, {
    input: `/api/companies/${company.id}`,
    method: 'GET',
  });
}

{
  const controller = new AbortController();
  const { calls, request } = createRequestSpy({ data: companyOverview });
  const service = createCompanyService(request);

  assert.deepEqual(
    await service.getOverview(company.id, controller.signal),
    companyOverview,
  );
  expectSingleCall(calls, {
    input: `/api/companies/${company.id}/overview`,
    method: 'GET',
  });
  assert.equal(calls[0]?.init?.signal, controller.signal);
}

{
  const input: CompanyCreateInput = {
    name: company.name,
    description: company.description,
    website: company.website,
    contactName: company.contactName,
    contactEmail: company.contactEmail,
    footerText: company.footerText,
  };
  const { calls, request } = createRequestSpy({ data: company });
  const service = createCompanyService(request);

  assert.deepEqual(await service.create(input), company);
  expectSingleCall(calls, {
    input: '/api/companies',
    method: 'POST',
    body: input,
  });
}

{
  const input: CompanyUpdateInput = {
    name: 'Updated company',
  };
  const { calls, request } = createRequestSpy({ data: company });
  const service = createCompanyService(request);

  assert.deepEqual(await service.update(company.id, input), company);
  expectSingleCall(calls, {
    input: `/api/companies/${company.id}`,
    method: 'PATCH',
    body: input,
  });
}

{
  const error = new ApiError('Company not found', 404);
  const { request } = createRequestSpy(error);
  const service = createCompanyService(request);

  await assert.rejects(service.getById(company.id), same => same === error);
}

{
  const file = new File(['fake-png'], 'logo.png', { type: 'image/png' });
  const companyWithLogo = {
    ...company,
    logoUrl: `http://localhost/api/companies/${company.id}/logo`,
  };
  const { calls, request } = createRequestSpy({ data: companyWithLogo });
  const service = createCompanyService(request);

  assert.deepEqual(await service.uploadLogo(company.id, file), companyWithLogo);
  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.ok(call);
  assert.equal(String(call.input), `/api/companies/${company.id}/logo`);
  assert.equal(call.init?.method, 'PUT');
  assert.equal(call.init?.rawBody, file);
  assert.equal(call.init?.body, undefined);
  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get('Content-Type'), 'image/png');
  assert.equal(headers.get('X-File-Name'), 'logo.png');
}

{
  const { calls, request } = createRequestSpy(undefined);
  const service = createCompanyService(request);

  await service.removeLogo(company.id);
  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.ok(call);
  assert.equal(String(call.input), `/api/companies/${company.id}/logo`);
  assert.equal(call.init?.method, 'DELETE');
}

console.log('company service checks passed');
