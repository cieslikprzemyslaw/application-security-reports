import { describe, it } from 'vitest';

describe.sequential('frontend regression coverage', () => {
  it('src/app/pages/assessmentDetails/assessmentDetails.validation.test.ts', async () => {
    await import('../../app/pages/assessmentDetails/assessmentDetails.validation.test');
  }, 120_000);
});
