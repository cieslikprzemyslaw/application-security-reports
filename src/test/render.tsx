import type { ReactElement, ReactNode } from 'react';

import {
  render,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AppRouter from '~/app/appRouter';
import { AppThemeProvider } from '~/theme';

interface TestProvidersProps {
  children: ReactNode;
}

const TestProviders = ({ children }: TestProvidersProps) => (
  <AppThemeProvider>{children}</AppThemeProvider>
);

type TestRenderOptions = Omit<RenderOptions, 'wrapper'>;

export interface TestRenderResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: TestRenderOptions = {},
): TestRenderResult => {
  const user = userEvent.setup();

  return {
    user,
    ...render(ui, {
      wrapper: TestProviders,
      ...options,
    }),
  };
};

export const renderRoute = (
  pathname: string,
  options: TestRenderOptions = {},
): TestRenderResult => {
  window.history.pushState({}, '', pathname);

  return renderWithProviders(<AppRouter />, options);
};

export * from '@testing-library/react';
