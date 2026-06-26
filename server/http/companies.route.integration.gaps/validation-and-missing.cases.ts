import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  malformedCompanyId,
  missingCompanyId,
  readError,
  withHarness,
} from './support.js';

describe('Companies API validation and missing resources', () => {
  it('returns safe validation and missing-resource errors without persistence', async () => {
    await withHarness(async ({ database, server }) => {
      const countBefore = await database.prisma.company.count();

      const unknownFieldResponse = await fetch(
        `${server.baseUrl}/api/companies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 'cmp_00000000-0000-0000-0000-000000000088',
            name: 'Must not persist',
          }),
        },
      );
      const unknownFieldBody = await readError(unknownFieldResponse);

      assert.equal(unknownFieldResponse.status, 400);
      assert.equal(unknownFieldBody.error.code, 'VALIDATION_ERROR');
      assert.equal(
        unknownFieldBody.error.details.some(detail => detail.path === 'id'),
        true,
      );
      assert.equal(await database.prisma.company.count(), countBefore);

      const invalidFieldsResponse = await fetch(
        `${server.baseUrl}/api/companies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Invalid contact data',
            website: 'not-a-url',
            contactEmail: 'not-an-email',
          }),
        },
      );
      const invalidFieldsBody = await readError(invalidFieldsResponse);

      assert.equal(invalidFieldsResponse.status, 400);
      assert.equal(invalidFieldsBody.error.code, 'VALIDATION_ERROR');
      assert.equal(
        invalidFieldsBody.error.details.some(
          detail => detail.path === 'website' || detail.path === 'contactEmail',
        ),
        true,
      );
      assert.equal(await database.prisma.company.count(), countBefore);

      const unsupportedMediaResponse = await fetch(
        `${server.baseUrl}/api/companies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ name: 'Must not persist' }),
        },
      );
      const unsupportedMediaBody = await readError(unsupportedMediaResponse);

      assert.equal(unsupportedMediaResponse.status, 415);
      assert.equal(unsupportedMediaBody.error.code, 'UNSUPPORTED_MEDIA_TYPE');
      assert.equal(await database.prisma.company.count(), countBefore);

      const malformedRequests: Array<{
        path: string;
        init?: RequestInit;
      }> = [
        {
          path: `/api/companies/${malformedCompanyId}`,
        },
        {
          path: `/api/companies/${malformedCompanyId}/overview`,
        },
        {
          path: `/api/companies/${malformedCompanyId}`,
          init: {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Must not persist' }),
          },
        },
        {
          path: `/api/companies/${malformedCompanyId}`,
          init: { method: 'DELETE' },
        },
        {
          path: `/api/companies/${malformedCompanyId}/archive`,
          init: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          },
        },
        {
          path: `/api/companies/${malformedCompanyId}/restore`,
          init: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          },
        },
      ];

      for (const request of malformedRequests) {
        const response = await fetch(
          `${server.baseUrl}${request.path}`,
          request.init,
        );
        const body = await readError(response);

        assert.equal(response.status, 400);
        assert.equal(body.error.code, 'VALIDATION_ERROR');
        assert.equal(
          body.error.details.some(detail => detail.path === 'id'),
          true,
        );
      }

      const missingRequests: Array<{
        init?: RequestInit;
      }> = [
        {},
        {
          init: {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Must not persist' }),
          },
        },
        {
          init: { method: 'DELETE' },
        },
      ];

      for (const request of missingRequests) {
        const response = await fetch(
          `${server.baseUrl}/api/companies/${missingCompanyId}`,
          request.init,
        );
        const body = await readError(response);

        assert.equal(response.status, 404);
        assert.equal(body.error.code, 'COMPANY_NOT_FOUND');
        assert.equal(body.error.message, 'Company not found');
        assert.deepEqual(body.error.details, []);
      }

      assert.equal(await database.prisma.company.count(), countBefore);
    });
  });
});
