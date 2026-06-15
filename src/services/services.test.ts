import assert from 'node:assert/strict';

import { ApiError } from './apiClient.js';
import {
  createAssessmentService,
  createCompanyService,
  createEvidenceService,
  createReportService,
  createSettingsService,
  createThreatService,
  type AssessmentCreateInput,
  type AssessmentUpdateInput,
  type CompanyCreateInput,
  type CompanyUpdateInput,
  type EvidenceCreateInput,
  type EvidenceUpdateInput,
  type ReportView,
  type SettingsUpdateInput,
  type ThreatCreateInput,
  type ThreatUpdateInput,
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

const threat = {
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

const evidence = {
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

const settings = {
  id: 'set_00000000-0000-0000-0000-000000000001',
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex.mercer@appsec.io',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText: '(c) 2026 Northstar Digital. Confidential.',
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  confidentialReports: true,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
} as const;

const reportView = {
  report: {
    id: 'rpt_00000000-0000-0000-0000-000000000001',
    assessmentId: assessment.id,
    title: 'Application Security Assessment',
    status: 'draft',
    selectedThreatIds: [threat.id],
    latestVersion: 0,
    executiveSummary: 'Executive summary',
    createdAt: '2026-06-11T09:00:00.000Z',
    updatedAt: '2026-06-11T09:00:00.000Z',
  },
  company: {
    ...company,
  },
  assessments: [],
  branding: {
    companyName: 'Northstar Digital',
    companyWebsite: 'https://northstar.example',
    companyContactEmail: 'security@northstar.example',
    companyLogoPath: '/logos/northstar.svg',
    companyFooterText: 'Confidential - do not distribute.',
    reportFooterText: '(c) 2026 Northstar Digital. Confidential.',
    confidentialReports: true,
  },
  configuration: {
    methodology: 'OWASP ASVS / WSTG',
    reportStyle: 'Technical & structured',
    includeEvidence: true,
  },
} satisfies ReportView;

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
  const input: CompanyCreateInput = {
    name: company.name,
    description: company.description,
    website: company.website,
    contactName: company.contactName,
    contactEmail: company.contactEmail,
    logoPath: company.logoPath,
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
  const { calls, request } = createRequestSpy({ data: [assessment] });
  const service = createAssessmentService(request);

  assert.deepEqual(await service.list({ companyId: company.id }), [assessment]);
  expectSingleCall(calls, {
    input: '/api/assessments',
    method: 'GET',
    query: {
      companyId: company.id,
    },
  });
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
  const { calls, request } = createRequestSpy({ data: [threat] });
  const service = createThreatService(request);

  assert.deepEqual(await service.listByAssessment(assessment.id), [threat]);
  expectSingleCall(calls, {
    input: '/api/threats',
    method: 'GET',
    query: {
      assessmentId: assessment.id,
    },
  });
}

{
  const { calls, request } = createRequestSpy({ data: threat });
  const service = createThreatService(request);

  assert.deepEqual(await service.getById(threat.id), threat);
  expectSingleCall(calls, {
    input: `/api/threats/${threat.id}`,
    method: 'GET',
  });
}

{
  const input: ThreatCreateInput = {
    assessmentId: assessment.id,
    title: threat.title,
    description: threat.description,
    severity: threat.severity,
    strideCategories: [...threat.strideCategories],
    status: threat.status,
    affectedAsset: threat.affectedAsset,
    impact: threat.impact,
    recommendation: threat.recommendation,
    observation: threat.observation,
    affectedComponent: threat.affectedComponent,
    affectedEndpoint: threat.affectedEndpoint,
    risk: threat.risk,
  };
  const { calls, request } = createRequestSpy({ data: threat });
  const service = createThreatService(request);

  assert.deepEqual(await service.create(input), threat);
  expectSingleCall(calls, {
    input: '/api/threats',
    method: 'POST',
    body: input,
  });
}

{
  const input: ThreatUpdateInput = {
    title: 'Updated threat',
  };
  const { calls, request } = createRequestSpy({ data: threat });
  const service = createThreatService(request);

  assert.deepEqual(await service.update(threat.id, input), threat);
  expectSingleCall(calls, {
    input: `/api/threats/${threat.id}`,
    method: 'PATCH',
    body: input,
  });
}

{
  const { calls, request } = createRequestSpy({ data: settings });
  const service = createSettingsService(request);

  assert.deepEqual(await service.get(), settings);
  expectSingleCall(calls, {
    input: '/api/settings',
    method: 'GET',
  });
}

{
  const input: SettingsUpdateInput = {
    defaultReportTitle: 'Updated report title',
  };
  const { calls, request } = createRequestSpy({ data: settings });
  const service = createSettingsService(request);

  assert.deepEqual(await service.update(input), settings);
  expectSingleCall(calls, {
    input: '/api/settings',
    method: 'PATCH',
    body: input,
  });
}

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
    await service.list({ assessmentId: assessment.id, threatId: threat.id }),
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
  const { calls, request } = createRequestSpy({ data: evidence });
  const service = createEvidenceService(request);
  const controller = new AbortController();

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
  const input: EvidenceCreateInput = {
    assessmentId: assessment.id,
    threatIds: [...evidence.threatIds],
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
}

{
  const input: EvidenceUpdateInput = {
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
}

{
  const { calls, request } = createRequestSpy({ data: reportView });
  const service = createReportService(request);

  assert.deepEqual(await service.getById(reportView.report.id), reportView);
  expectSingleCall(calls, {
    input: `/api/reports/${reportView.report.id}`,
    method: 'GET',
  });
}

console.log('services checks passed');
