import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '~/test/render';

import CompanyForm from './companyForm.component';
import type { CompanyFormValue } from './companyForm.type';

const baseValue: CompanyFormValue = {
  name: 'Acme Corp',
  description: '',
  website: '',
  contactName: '',
  contactEmail: '',
  footerText: '',
  logoFile: null,
  hasExistingLogo: true,
};

const storedLogoUrl = 'http://localhost/api/companies/cmp_test/logo';

interface RenderFormOptions {
  value?: CompanyFormValue;
  existingLogoUrl?: string | null;
}

const renderForm = ({
  value = baseValue,
  existingLogoUrl = storedLogoUrl,
}: RenderFormOptions = {}) => {
  const onChange = vi.fn();

  return {
    onChange,
    ...renderWithProviders(
      <CompanyForm
        value={value}
        existingLogoUrl={existingLogoUrl}
        onChange={onChange}
        onSubmit={event => event.preventDefault()}
        onCancel={vi.fn()}
      />,
    ),
  };
};

describe('CompanyForm existing logo', () => {
  it('shows the stored logo and hides the upload dropzone', () => {
    renderForm();

    expect(
      screen.getByRole('img', {
        name: 'Company logo preview',
      }),
    ).toHaveAttribute('src', storedLogoUrl);

    expect(document.querySelector('#company-logo')).not.toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Replace logo',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Remove logo',
      }),
    ).toBeInTheDocument();
  });

  it('removes the stored logo', async () => {
    const { user, onChange } = renderForm();

    await user.click(
      screen.getByRole('button', {
        name: 'Remove logo',
      }),
    );

    expect(onChange).toHaveBeenCalledOnce();

    expect(onChange).toHaveBeenCalledWith({
      ...baseValue,
      logoFile: null,
      hasExistingLogo: false,
    });
  });

  it('shows the dropzone when the stored logo URL is unavailable', () => {
    renderForm({
      existingLogoUrl: null,
    });

    expect(document.querySelector('#company-logo')).toBeInTheDocument();

    expect(
      screen.queryByRole('img', {
        name: 'Company logo preview',
      }),
    ).not.toBeInTheDocument();
  });
});
