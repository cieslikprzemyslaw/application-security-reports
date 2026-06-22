import { describe, expect, it } from 'vitest';

import {
  buildAssessment,
  buildCompany,
  buildCompanyListItem,
  buildEvidence,
  buildHttpExchange,
  buildThreat,
} from './builders';

describe('test data builders', () => {
  it('creates valid default entities', () => {
    expect(buildCompany().id).toBe('cmp_test');
    expect(buildCompanyListItem().assessmentCount).toBe(2);
    expect(buildAssessment().status).toBe('in-progress');
    expect(buildThreat().severity).toBe('high');
    expect(buildEvidence().type).toBe('text');
  });

  it('applies overrides without mutating defaults', () => {
    const firstThreat = buildThreat({
      title: 'SQL injection',
      strideCategories: ['tampering'],
    });

    const secondThreat = buildThreat();

    firstThreat.strideCategories.push('repudiation');

    expect(firstThreat.title).toBe('SQL injection');
    expect(secondThreat.title).toBe('Missing server-side authorization');
    expect(secondThreat.strideCategories).toEqual(['elevation-of-privilege']);
  });

  it('creates independent nested HTTP exchange values', () => {
    const firstExchange = buildHttpExchange();
    const secondExchange = buildHttpExchange();

    firstExchange.request.headers!.Accept = 'text/plain';

    expect(secondExchange.request.headers).toEqual({
      Accept: 'application/json',
    });

    const evidence = buildEvidence({
      type: 'http',
      threatIds: ['thr_test'],
      httpExchanges: [buildHttpExchange()],
    });

    expect(evidence.threatIds).toEqual(['thr_test']);
    expect(evidence.httpExchanges).toHaveLength(1);
  });
});
