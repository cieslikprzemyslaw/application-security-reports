import { afterEach, beforeEach, describe } from 'vitest';

import {
  createAssessmentsRouteIntegrationHarness,
  type AssessmentsRouteIntegrationHarness,
} from './support.js';

export const missingCompanyId = 'cmp_00000000-0000-0000-0000-000000000099';
export const missingAssessmentId = 'asm_00000000-0000-0000-0000-000000000099';

export const readJson = async <T>(response: Response): Promise<T> =>
  response.json() as Promise<T>;

export const buildCreatePayload = (
  companyId: string,
  overrides: Record<string, unknown> = {},
) => ({
  companyId,
  title: 'Payments Portal',
  description: 'Focused application security assessment',
  scope: 'Public web application',
  status: 'in-progress',
  startedAt: '2026-06-20',
  applicationName: 'Payments Portal',
  environment: 'Production',
  assessmentType: 'Web App',
  overallRisk: 'high',
  ...overrides,
});

export const describeAssessmentsRouteIntegration = (
  title: string,
  registerCases: (getHarness: () => AssessmentsRouteIntegrationHarness) => void,
) => {
  describe.sequential(title, () => {
    let harness: AssessmentsRouteIntegrationHarness | undefined;

    beforeEach(async () => {
      harness = await createAssessmentsRouteIntegrationHarness();
    });

    afterEach(async () => {
      await harness?.cleanup();
      harness = undefined;
    });

    const getHarness = (): AssessmentsRouteIntegrationHarness => {
      if (!harness) {
        throw new Error('Assessment integration harness is not available.');
      }

      return harness;
    };

    registerCases(getHarness);
  });
};
