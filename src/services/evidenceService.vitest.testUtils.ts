import type { ApiRequestOptions } from './apiClient.js';
import type { ApiRequestFn } from './serviceHelpers.js';

type RequestCall = {
  input: RequestInfo | URL;
  init?: ApiRequestOptions;
};

export const createRequestSpy = <TResponse>(
  response: TResponse | Error,
): {
  calls: RequestCall[];
  request: ApiRequestFn;
} => {
  const calls: RequestCall[] = [];

  const request: ApiRequestFn = async <T>(
    input: RequestInfo | URL,
    init?: ApiRequestOptions,
  ) => {
    calls.push({ input, init });

    if (response instanceof Error) {
      throw response;
    }

    return response as unknown as T;
  };

  return { calls, request };
};

export const expectSingleCall = (
  calls: RequestCall[],
  expected: {
    input: string;
    method: string;
    body?: unknown;
    query?: ApiRequestOptions['query'];
  },
) => {
  assertCallCount(calls, 1);

  const call = calls[0];

  if (!call) {
    throw new Error('Expected one request call.');
  }

  if (String(call.input) !== expected.input) {
    throw new Error(
      `Expected request URL ${expected.input}, received ${String(call.input)}.`,
    );
  }

  if (call.init?.method !== expected.method) {
    throw new Error(
      `Expected request method ${expected.method}, received ${call.init?.method}.`,
    );
  }

  if (expected.body !== undefined) {
    assertDeepEqual(call.init?.body, expected.body);
  } else if (call.init?.body !== undefined) {
    throw new Error('Expected request body to be undefined.');
  }

  if (expected.query !== undefined) {
    assertDeepEqual(call.init?.query, expected.query);
  }
};

const assertCallCount = (calls: RequestCall[], expected: number) => {
  if (calls.length !== expected) {
    throw new Error(
      `Expected ${expected} request call(s), received ${calls.length}.`,
    );
  }
};

const assertDeepEqual = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Values differ.` +
        `\nExpected: ${JSON.stringify(expected)}` +
        `\nReceived: ${JSON.stringify(actual)}`,
    );
  }
};

export const company = {
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

export const assessment = {
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

export const threat = {
  id: 'thr_00000000-0000-0000-0000-000000000001',
  assessmentId: assessment.id,
  title: 'Missing Server-Side Authorization',
  description: 'The endpoint returns another customer order.',
  severity: 'critical',
  strideCategories: ['spoofing', 'tampering'],
  status: 'accepted-risk',
  affectedAsset: '/api/v1/orders/{id}',
  impact: 'Unauthorised access to customer order data',
  recommendation: 'Apply object-level authorization on every request.',
  observation: 'An authenticated user can access another customer order.',
  affectedComponent: 'Orders API',
  affectedEndpoint: '/api/v1/orders/{id}',
  risk: 'Sensitive order data is exposed.',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
} as const;

export const evidence = {
  id: 'evd_00000000-0000-0000-0000-000000000001',
  assessmentId: assessment.id,
  threatIds: [threat.id],
  type: 'screenshot',
  title: 'Evidence screenshot',
  description: 'Portal screenshot',
  content: 'Base64 payload',
  fileName: 'evidence.png',
  filePath: 'uploads/evidence/evidence.png',
  mimeType: 'image/png',
  capturedAt: '2026-06-05',
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-05T00:00:00.000Z',
} as const;
