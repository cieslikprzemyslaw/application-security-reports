import { describe, expect, it } from 'vitest';

import { filterReportBuilderHierarchy } from './reportBuilderTree.filter';
import type { ReportBuilderHierarchy } from './reportBuilderTree.service';

const hierarchy = {
  companyId: 'cmp_test',
  assessments: [
    {
      assessment: {
        id: 'asm_web',
        name: 'Web application assessment',
        applicationName: 'Customer Portal',
        type: 'web',
      },
      threats: [
        {
          threat: {
            id: 'thr_auth',
            title: 'Broken access control',
            severity: 'high',
            affectedEndpoint: '/api/accounts',
          },
          evidence: [
            {
              evidence: {
                id: 'evd_request',
                title: 'Account request',
                type: 'http',
              },
            },
          ],
        },
        {
          threat: {
            id: 'thr_xss',
            title: 'Stored XSS',
            severity: 'medium',
            affectedEndpoint: '/profile',
          },
          evidence: [],
        },
      ],
    },
    {
      assessment: {
        id: 'asm_api',
        name: 'Payments API',
        applicationName: 'Payment Service',
        type: 'api',
      },
      threats: [],
    },
  ],
} as unknown as ReportBuilderHierarchy;

describe('filterReportBuilderHierarchy', () => {
  it('keeps the complete branch when the assessment matches', () => {
    const result = filterReportBuilderHierarchy(hierarchy, 'payments');

    expect(result.assessments).toHaveLength(1);
    expect(result.assessments[0]?.assessment.id).toBe('asm_api');
  });

  it('keeps only matching descendants when a nested item matches', () => {
    const result = filterReportBuilderHierarchy(hierarchy, 'account request');

    expect(result.assessments).toHaveLength(1);
    expect(result.assessments[0]?.threats).toHaveLength(1);
    expect(result.assessments[0]?.threats[0]?.threat.id).toBe('thr_auth');
    expect(result.assessments[0]?.threats[0]?.evidence[0]?.evidence.id).toBe(
      'evd_request',
    );
  });

  it('returns the original hierarchy for an empty query', () => {
    expect(filterReportBuilderHierarchy(hierarchy, '   ')).toBe(hierarchy);
  });
});
