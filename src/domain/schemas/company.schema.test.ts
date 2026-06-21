import assert from 'node:assert/strict';

import {
  companyRouteParamsSchema,
  createCompanyRequestSchema,
  updateCompanyRequestSchema,
} from './request.schema.js';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';

const validCreateRequest = {
  name: 'Northstar Digital',
  description: 'Security consulting',
  website: 'https://northstar.example',
  contactName: 'Ada Lovelace',
  contactEmail: 'ada@example.com',
  footerText: 'Confidential',
};

function assertRejected(
  success: boolean,
  message: string,
): asserts success is false {
  assert.equal(success, false, message);
}

{
  const result = companyRouteParamsSchema.safeParse({ id: companyId });

  assert.equal(result.success, true, 'Valid cmp_ route ID should pass');
}

for (const invalidId of [
  'asm_00000000-0000-0000-0000-000000000001',
  'cmp_not-a-uuid',
  '00000000-0000-0000-0000-000000000001',
  '',
]) {
  assertRejected(
    companyRouteParamsSchema.safeParse({ id: invalidId }).success,
    `Invalid Company route ID should fail: ${invalidId}`,
  );
}

assertRejected(
  companyRouteParamsSchema.safeParse({
    id: companyId,
    unexpected: true,
  }).success,
  'Company route params should reject unknown properties',
);

{
  const result = createCompanyRequestSchema.safeParse(validCreateRequest);

  assert.equal(result.success, true, 'Valid create request should pass');

  if (result.success) {
    assert.deepEqual(
      Object.keys(result.data).sort(),
      Object.keys(validCreateRequest).sort(),
      'Create output should contain only supported Company fields',
    );
  }
}

assertRejected(
  createCompanyRequestSchema.safeParse({}).success,
  'Create request should require a name',
);

assertRejected(
  createCompanyRequestSchema.safeParse({ name: '   ' }).success,
  'Create request should reject a blank name',
);

assertRejected(
  createCompanyRequestSchema.safeParse({
    ...validCreateRequest,
    website: 'not-a-url',
  }).success,
  'Create request should reject an invalid website',
);

assertRejected(
  createCompanyRequestSchema.safeParse({
    ...validCreateRequest,
    contactEmail: 'not-an-email',
  }).success,
  'Create request should reject an invalid contact email',
);

for (const [field, value] of Object.entries({
  id: companyId,
  logoUrl: 'https://northstar.example/logo.png',
  archivedAt: '2026-06-21T12:00:00.000Z',
  createdAt: '2026-06-21T12:00:00.000Z',
  updatedAt: '2026-06-21T12:00:00.000Z',
  isAdmin: true,
})) {
  assertRejected(
    createCompanyRequestSchema.safeParse({
      ...validCreateRequest,
      [field]: value,
    }).success,
    `Create request should reject unsupported field: ${field}`,
  );
}

{
  const patch = {
    name: 'Northstar Security',
    footerText: 'Internal use only',
  };

  const result = updateCompanyRequestSchema.safeParse(patch);

  assert.equal(result.success, true, 'Valid partial PATCH should pass');

  if (result.success) {
    assert.deepEqual(
      Object.keys(result.data).sort(),
      Object.keys(patch).sort(),
      'PATCH output should contain only supplied mutable fields',
    );
  }
}

assertRejected(
  updateCompanyRequestSchema.safeParse({}).success,
  'PATCH should require at least one mutable field',
);

for (const [field, value] of Object.entries({
  id: companyId,
  logoUrl: 'https://northstar.example/logo.png',
  archivedAt: '2026-06-21T12:00:00.000Z',
  createdAt: '2026-06-21T12:00:00.000Z',
  updatedAt: '2026-06-21T12:00:00.000Z',
  companyId: 'cmp_00000000-0000-0000-0000-000000000002',
})) {
  assertRejected(
    updateCompanyRequestSchema.safeParse({
      name: 'Allowed field',
      [field]: value,
    }).success,
    `PATCH should reject unsupported field: ${field}`,
  );
}

console.log('Company runtime schema checks passed');
