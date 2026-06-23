import type { ReportBuilderSelection } from '~/domain';

import {
  createReportBuilderSelectionTreeState,
  type ReportBuilderSelectionTreeState,
} from './reportBuilderSelectionTree';

import type { ReportBuilderHierarchy } from './reportBuilderTree.service';

export const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
export const otherCompanyId = 'cmp_00000000-0000-0000-0000-000000000002';
export const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
export const threatOneId = 'thr_00000000-0000-0000-0000-000000000001';
export const threatTwoId = 'thr_00000000-0000-0000-0000-000000000002';
export const evidenceOneId = 'evd_00000000-0000-0000-0000-000000000001';
export const evidenceTwoId = 'evd_00000000-0000-0000-0000-000000000002';

export const emptySelection: ReportBuilderSelection = {
  selectedThreatIds: [],
  selectedEvidenceIds: [],
};

export const createEmptySelectionState = (): ReportBuilderSelectionTreeState =>
  createReportBuilderSelectionTreeState(emptySelection);

export const populatedHierarchy: ReportBuilderHierarchy = {
  companyId,
  assessments: [
    {
      assessment: {
        id: assessmentId,
        companyId,
        name: 'Customer Services Portal',
        applicationName: 'Customer Services Portal',
        type: 'Web App',
        status: 'in-progress',
        findingsCount: 2,
        updatedAt: '2026-06-10T00:00:00.000Z',
        description: 'Assessment of the customer portal',
        scope: 'Web application',
      },
      threats: [
        {
          threat: {
            id: threatOneId,
            assessmentId,
            title: 'Missing Server-Side Authorization',
            description:
              'Authorization is missing on the order lookup endpoint.',
            severity: 'critical',
            strideCategories: ['elevation-of-privilege'],
            status: 'open',
            createdAt: '2026-06-03T00:00:00.000Z',
            updatedAt: '2026-06-12T00:00:00.000Z',
          },
          evidence: [
            {
              evidence: {
                id: evidenceOneId,
                assessmentId,
                threatIds: [threatOneId],
                type: 'text',
                title: 'Authorization note',
                createdAt: '2026-06-05T00:00:00.000Z',
                updatedAt: '2026-06-05T00:00:00.000Z',
              },
            },
          ],
        },
        {
          threat: {
            id: threatTwoId,
            assessmentId,
            title: 'Verbose Error Messages',
            description: 'Unhandled errors disclose stack traces.',
            severity: 'medium',
            strideCategories: ['information-disclosure'],
            status: 'mitigated',
            createdAt: '2026-06-04T00:00:00.000Z',
            updatedAt: '2026-06-12T00:00:00.000Z',
          },
          evidence: [
            {
              evidence: {
                id: evidenceTwoId,
                assessmentId,
                threatIds: [threatTwoId],
                type: 'http',
                title: 'HTTP exchange evidence',
                createdAt: '2026-06-06T00:00:00.000Z',
                updatedAt: '2026-06-06T00:00:00.000Z',
              },
            },
          ],
        },
      ],
    },
  ],
};

export const otherHierarchy: ReportBuilderHierarchy = {
  companyId: otherCompanyId,
  assessments: [
    {
      assessment: {
        id: 'asm_00000000-0000-0000-0000-000000000002',
        companyId: otherCompanyId,
        name: 'Second Company Portal',
        applicationName: 'Second Company Portal',
        type: 'Web App',
        status: 'draft',
        findingsCount: 0,
        updatedAt: '2026-06-15T00:00:00.000Z',
      },
      threats: [],
    },
  ],
};

export const createDeferred = <T>() => {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};
