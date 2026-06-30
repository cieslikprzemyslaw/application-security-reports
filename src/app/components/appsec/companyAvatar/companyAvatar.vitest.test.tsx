import { describe, expect, it } from 'vitest';

import { fireEvent, renderWithProviders, screen } from '~/test/render';

import CompanyAvatar from './companyAvatar.component';

describe('CompanyAvatar', () => {
  it('renders a saved public logo as decorative when adjacent text names the company', () => {
    const { container } = renderWithProviders(
      <CompanyAvatar
        companyName="Northstar Digital"
        logoUrl="/api/companies/cmp_1/logo"
        isDecorative
      />,
    );

    const logo = container.querySelector('img.company-avatar__image');

    expect(logo).toHaveAttribute('src', '/api/companies/cmp_1/logo');
    expect(logo).toHaveAttribute('alt', '');
    expect(screen.queryByText('ND')).not.toBeInTheDocument();
  });

  it('falls back to an accessible initials avatar when no logo exists', () => {
    renderWithProviders(<CompanyAvatar companyName="Northstar Digital" />);

    expect(
      screen.getByRole('img', { name: 'Northstar Digital logo' }),
    ).toHaveTextContent('ND');
  });

  it('falls back to initials after a logo load failure without keeping the broken image', () => {
    const { container } = renderWithProviders(
      <CompanyAvatar
        companyName="Northstar Digital"
        logoUrl="/api/companies/cmp_1/logo"
      />,
    );

    const logo = container.querySelector('img.company-avatar__image');

    expect(logo).toBeInTheDocument();

    fireEvent.error(logo as Element);

    expect(
      container.querySelector('img.company-avatar__image'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Northstar Digital logo' }),
    ).toHaveTextContent('ND');
  });

  it('does not render obvious filesystem paths as image sources', () => {
    const { container } = renderWithProviders(
      <CompanyAvatar
        companyName="Northstar Digital"
        logoUrl="C:\\data\\logo.png"
      />,
    );

    expect(
      container.querySelector('img.company-avatar__image'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Northstar Digital logo' }),
    ).toHaveTextContent('ND');
  });
});
