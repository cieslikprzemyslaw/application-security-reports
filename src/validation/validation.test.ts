import assert from 'node:assert/strict';

import {
  createCompanyRequestSchema,
  isoDateStringSchema,
  isoDateTimeStringSchema,
  reportVersionSchema,
  timestampSchema,
  updateCompanyRequestSchema,
  companySchema,
} from '../domain/schemas/index.js';

import {
  JsonParseError,
  ValidationError,
  parseJsonData,
  validateRequestBody,
} from './index.js';

const validCompany = {
  id: 'cmp_1',
  name: 'Northstar Digital',
  website: 'https://northstar.example',
  contactEmail: 'security@northstar.example',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};

const validReportVersion = {
  id: 'repv_1',
  reportId: 'rep_1',
  version: 1,
  generatedAt: '2026-06-10',
  snapshot: {
    reportTitle: 'Security Report',
    companyName: 'Northstar Digital',
    assessmentTitle: 'Customer Services Portal',
    branding: {
      brandingMode: 'issuer',
      issuerName: 'Northstar Digital',
      issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
      clientName: 'Northstar Digital',
      reportFooterText: 'Confidential',
      confidentialityLabel: 'Strictly confidential',
      confidentialReports: true,
    },
    threats: [
      {
        threatId: 'thr_1',
        title: 'Missing Server-Side Authorization',
        description: 'The endpoint returns another customer order.',
        severity: 'critical',
        status: 'accepted-risk',
        strideCategories: ['spoofing'],
      },
    ],
  },
};

const expectValidationError = (
  error: unknown,
  path: string,
  messageIncludes: string,
) => {
  assert.ok(error instanceof ValidationError, 'Expected a ValidationError');
  assert.equal(error.response.error, 'VALIDATION_ERROR');
  assert.ok(
    error.response.fields.some(
      field => field.path === path && field.message.includes(messageIncludes),
    ),
    `Expected ${path} to contain ${messageIncludes}`,
  );
};

const expectJsonParseError = (error: unknown) => {
  assert.ok(error instanceof JsonParseError, 'Expected a JsonParseError');
  assert.equal(error.response.error, 'INVALID_JSON');
};

const parsedCompany = parseJsonData(
  JSON.stringify(validCompany),
  companySchema,
);
assert.deepEqual(parsedCompany, validCompany);

let caughtError: unknown = undefined;

try {
  parseJsonData('{', companySchema);
} catch (error) {
  caughtError = error;
}

expectJsonParseError(caughtError);

try {
  parseJsonData(
    JSON.stringify({ ...validCompany, contactEmail: 'invalid-email' }),
    companySchema,
  );
  assert.fail('Expected invalid company data to fail');
} catch (error) {
  expectValidationError(error, 'contactEmail', 'Invalid email');
}

for (const validDate of ['2026-06-11', '2024-02-29']) {
  assert.ok(isoDateStringSchema.safeParse(validDate).success);
}

assert.ok(
  isoDateTimeStringSchema.safeParse('2026-06-11T12:30:00.000Z').success,
);
assert.ok(timestampSchema.safeParse('2026-06-11T12:30:00.000Z').success);

for (const invalidDate of [
  '2026-99-99',
  '2026-13-01',
  '2026-00-10',
  '2026-02-30',
  '2025-02-29',
  'not-a-date',
]) {
  assert.ok(!isoDateStringSchema.safeParse(invalidDate).success);
}

assert.ok(!isoDateStringSchema.safeParse('2026-06-11T12:30:00.000Z').success);
assert.ok(!timestampSchema.safeParse('2026-06-11').success);

try {
  validateRequestBody(updateCompanyRequestSchema, {});
  assert.fail('Expected empty update body to fail');
} catch (error) {
  expectValidationError(error, '', 'At least one company field is required');
}

const updateCompany = validateRequestBody(updateCompanyRequestSchema, {
  name: 'Updated name',
});
assert.deepEqual(updateCompany, { name: 'Updated name' });

try {
  validateRequestBody(createCompanyRequestSchema, {
    name: 'Example Ltd',
    isAdmin: true,
  });
  assert.fail('Expected unknown create field to fail');
} catch (error) {
  expectValidationError(error, 'isAdmin', 'Unknown property');
}

try {
  validateRequestBody(reportVersionSchema, {
    ...validReportVersion,
    snapshot: {
      ...validReportVersion.snapshot,
      threats: [
        { ...validReportVersion.snapshot.threats[0], severity: 'extreme' },
      ],
    },
  });
  assert.fail('Expected nested invalid threat severity to fail');
} catch (error) {
  expectValidationError(
    error,
    'snapshot.threats.0.severity',
    'Invalid enum value',
  );
}

console.log('validation utility checks passed');
