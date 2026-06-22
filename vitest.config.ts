import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],

      // Legacy *.test.ts(x) files still run through scripts/run-legacy-tests.mjs.
      // Migrated tests use *.vitest.test.ts(x) during the transition.
      include: ['src/**/*.vitest.test.{ts,tsx}'],

      clearMocks: true,
      restoreMocks: true,
      unstubEnvs: true,
      unstubGlobals: true,

      // The first migration steps may not contain Vitest tests yet.
      passWithNoTests: true,
    },
  }),
);
