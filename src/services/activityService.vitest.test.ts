import { describe, expect, it, vi } from 'vitest';

import type { Activity } from '~/domain';

import { ApiResponseParseError } from './apiClient.js';
import { createActivityService } from './activityService.js';
import type { ApiRequestFn } from './serviceHelpers.js';

const activity: Activity = {
  id: 'act_00000000-0000-0000-0000-000000000001',
  eventType: 'assessment.completed',
  result: 'success',
  severity: 'informational',
  actor: { type: 'local-user' },
  resource: {
    type: 'assessment',
    id: 'asm_00000000-0000-0000-0000-000000000001',
    companyId: 'cmp_00000000-0000-0000-0000-000000000001',
    assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
  },
  message: 'Assessment completed.',
  createdAt: '2026-07-25T08:00:00.000Z',
};

const createRequest = (data: unknown) =>
  vi.fn(async () => ({ data })) as unknown as ApiRequestFn;

describe('Activity service', () => {
  it('loads Company activity with the requested limit', async () => {
    const request = createRequest([activity]);
    const service = createActivityService(request);

    await expect(
      service.listByCompany(
        'cmp_00000000-0000-0000-0000-000000000001',
        25,
      ),
    ).resolves.toEqual([activity]);
    expect(request).toHaveBeenCalledWith(
      '/api/companies/cmp_00000000-0000-0000-0000-000000000001/activity?limit=25',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('loads Assessment activity from the scoped endpoint', async () => {
    const request = createRequest([activity]);
    const service = createActivityService(request);

    await service.listByAssessment(
      'cmp_00000000-0000-0000-0000-000000000001',
      'asm_00000000-0000-0000-0000-000000000001',
    );

    expect(request).toHaveBeenCalledWith(
      '/api/companies/cmp_00000000-0000-0000-0000-000000000001/assessments/asm_00000000-0000-0000-0000-000000000001/activity',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('rejects responses outside the public Activity contract', async () => {
    const service = createActivityService(
      createRequest([{ ...activity, apiToken: 'secret' }]),
    );

    await expect(
      service.listByCompany('cmp_00000000-0000-0000-0000-000000000001'),
    ).rejects.toBeInstanceOf(ApiResponseParseError);
  });
});
