import {
  createThreatsRouteIntegrationHarness,
  type ThreatsRouteIntegrationHarness,
} from '../threats.route.integration.test/support.js';

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: Array<{ path?: string; message?: string; code?: string }>;
  };
};

export const missingAssessmentId = 'asm_00000000-0000-0000-0000-000000000099';
export const missingThreatId = 'thr_00000000-0000-0000-0000-000000000099';

export const readError = async (response: Response): Promise<ApiErrorBody> =>
  response.json() as Promise<ApiErrorBody>;

export const withHarness = async (
  run: (harness: ThreatsRouteIntegrationHarness) => Promise<void>,
) => {
  const harness = await createThreatsRouteIntegrationHarness();

  try {
    await run(harness);
  } finally {
    await harness.cleanup();
  }
};
