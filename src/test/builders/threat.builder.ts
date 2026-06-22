import type { Threat } from '~/domain';

export const buildThreat = (overrides: Partial<Threat> = {}): Threat => {
  const { strideCategories = ['elevation-of-privilege'], ...properties } =
    overrides;

  return {
    id: 'thr_test',
    assessmentId: 'asm_test',
    title: 'Missing server-side authorization',
    description:
      'The endpoint does not verify that the authenticated user owns the requested resource.',
    severity: 'high',
    status: 'open',
    owaspCategoryCode: 'A01:2025',
    affectedAsset: 'Customer account',
    impact: 'An attacker may access another customer account.',
    recommendation: 'Enforce object-level authorization on every request.',
    observation: 'The API returns resources belonging to other users.',
    reproductionSteps:
      'Change the resource identifier while authenticated as another user.',
    affectedComponent: 'Accounts API',
    affectedEndpoint: '/api/accounts/{id}',
    risk: 'Unauthorised access to customer data.',
    references: 'CWE-639',
    evidenceCount: 0,
    createdAt: '2026-01-03T09:00:00.000Z',
    updatedAt: '2026-01-03T10:00:00.000Z',
    ...properties,
    strideCategories: [...strideCategories],
  };
};
