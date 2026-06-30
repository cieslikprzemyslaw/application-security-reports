import { describe, expect, it } from 'vitest';

import { fireEvent, renderWithProviders, screen } from '~/test/render';

import Dashboard from './dashboard.component';

describe('dashboard company avatars', () => {
  it('renders a saved logo in recent company rows and falls back to initials when it fails', () => {
    const { container } = renderWithProviders(
      <Dashboard
        companies={[
          {
            id: 'cmp_1',
            name: 'Northstar Digital',
            logoUrl: '/api/companies/cmp_1/logo',
            assessmentCount: 2,
          },
        ]}
        onOpenCompany={() => undefined}
      />,
    );

    const logo = container.querySelector('.dashboard-company-avatar img');

    expect(logo).toHaveAttribute('src', '/api/companies/cmp_1/logo');
    expect(logo).toHaveAttribute('alt', '');
    expect(screen.queryByText('ND')).not.toBeInTheDocument();

    fireEvent.error(logo as Element);

    expect(
      container.querySelector('.dashboard-company-avatar img'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('ND')).toBeInTheDocument();
  });
});
