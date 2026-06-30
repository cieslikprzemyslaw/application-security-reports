import {
  createEvidenceRouteIntegrationHarness,
  type EvidenceRouteIntegrationHarness,
} from '../evidence.route.integration.test/support.js';

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path?: string; message?: string; code?: string }>;
  };
};

export const missingAssessmentId = 'asm_00000000-0000-0000-0000-000000000099';
export const missingEvidenceId = 'evd_00000000-0000-0000-0000-000000000099';

export const readError = async (response: Response): Promise<ApiErrorBody> =>
  response.json() as Promise<ApiErrorBody>;

export const withHarness = async (
  run: (harness: EvidenceRouteIntegrationHarness) => Promise<void>,
) => {
  const harness = await createEvidenceRouteIntegrationHarness();

  try {
    await run(harness);
  } finally {
    await harness.cleanup();
  }
};
