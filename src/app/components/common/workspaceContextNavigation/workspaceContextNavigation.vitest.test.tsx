import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { AppThemeProvider } from '~/theme';

import WorkspaceContextNavigation from './workspaceContextNavigation.component';

const originalTitle = document.title;

afterEach(() => {
  document.title = originalTitle;
});

describe('WorkspaceContextNavigation', () => {
  it('renders ancestor links and a non-linked current item', () => {
    render(
      <MemoryRouter>
        <AppThemeProvider>
          <WorkspaceContextNavigation
            items={[
              { label: 'Companies', href: '/companies' },
              { label: 'Acme', href: '/companies/cmp_1/overview' },
              { label: 'Assessments' },
            ]}
            documentTitle="Assessments for Acme"
          />
        </AppThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Workspace context' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Companies' })).toHaveAttribute('href', '/companies');
    expect(screen.getByText('Assessments')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Assessments' })).not.toBeInTheDocument();
    expect(document.title).toBe('Assessments for Acme | AppSec Report Builder');
  });
});
