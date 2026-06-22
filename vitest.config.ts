import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'frontend',
            environment: 'jsdom',
            testTimeout: 15_000,
            setupFiles: ['./src/test/setup.ts'],
            include: ['src/**/*.vitest.test.{ts,tsx}'],
            exclude: [
              'src/domain/**/*.vitest.test.ts',
              'src/validation/**/*.vitest.test.ts',
            ],
            clearMocks: true,
            restoreMocks: true,
            unstubEnvs: true,
            unstubGlobals: true,
          },
        },
        {
          extends: true,
          test: {
            name: 'backend',
            environment: 'node',
            testTimeout: 30_000,
            include: [
              'server/**/*.vitest.test.ts',
              'src/domain/**/*.vitest.test.ts',
              'src/validation/**/*.vitest.test.ts',
            ],
            clearMocks: true,
            restoreMocks: true,
            unstubEnvs: true,
            unstubGlobals: true,
            fileParallelism: false,
          },
        },
      ],
    },
  }),
);
