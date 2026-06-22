import { useState } from 'react';

import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderWithProviders, screen } from '~/test/render';

import CompanyForm from './companyForm.component';
import type { CompanyFormProps, CompanyFormValue } from './companyForm.type';

const baseValue: CompanyFormValue = {
  name: 'Acme Corp',
  description: '',
  website: '',
  contactName: '',
  contactEmail: '',
  footerText: '',
  logoFile: null,
  hasExistingLogo: false,
};

type FormOverrides = Partial<Omit<CompanyFormProps, 'value' | 'onChange'>>;

const getFileInput = (id = 'company-logo') => {
  const input = document.querySelector<HTMLInputElement>(`#${id}`);

  expect(input).not.toBeNull();

  return input!;
};

const renderControlledForm = (
  initialValue: CompanyFormValue = baseValue,
  overrides: FormOverrides = {},
) => {
  const onChange = vi.fn();

  const Harness = () => {
    const [value, setValue] = useState(initialValue);

    return (
      <CompanyForm
        value={value}
        onChange={nextValue => {
          onChange(nextValue);
          setValue(nextValue);
        }}
        onSubmit={event => event.preventDefault()}
        onCancel={vi.fn()}
        {...overrides}
      />
    );
  };

  return {
    onChange,
    ...renderWithProviders(<Harness />),
  };
};

describe('CompanyForm logo selection', () => {
  it('shows the logo dropzone when no logo is selected', () => {
    renderControlledForm();

    expect(getFileInput()).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/webp',
    );

    expect(
      screen.queryByRole('img', {
        name: 'Company logo preview',
      }),
    ).not.toBeInTheDocument();
  });

  it.each([
    {
      fileName: 'logo.svg',
      mimeType: 'image/svg+xml',
    },
    {
      fileName: 'logo.bmp',
      mimeType: '',
    },
  ])('rejects unsupported file $fileName', ({ fileName, mimeType }) => {
    const { onChange } = renderControlledForm();

    const file = new File(['invalid-image'], fileName, {
      type: mimeType,
    });

    fireEvent.change(getFileInput(), {
      target: {
        files: [file],
      },
    });

    expect(
      screen.getByText(
        'The selected file type is not supported. Use JPEG, PNG, or WebP.',
      ),
    ).toBeInTheDocument();

    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([
    {
      fileName: 'logo.jpg',
      mimeType: 'image/jpeg',
    },
    {
      fileName: 'logo.png',
      mimeType: 'image/png',
    },
    {
      fileName: 'logo.webp',
      mimeType: 'image/webp',
    },
  ])(
    'accepts supported file $fileName and shows its preview',
    async ({ fileName, mimeType }) => {
      const { user, onChange } = renderControlledForm();

      const file = new File(['valid-image'], fileName, {
        type: mimeType,
      });

      await user.upload(getFileInput(), file);

      expect(onChange).toHaveBeenLastCalledWith({
        ...baseValue,
        logoFile: file,
      });

      expect(
        screen.getByRole('img', {
          name: 'Company logo preview',
        }),
      ).toHaveAttribute('src', 'blob:test-object-url');
    },
  );

  it('removes a selected logo', async () => {
    const logoFile = new File(['logo'], 'logo.png', {
      type: 'image/png',
    });

    const { user, onChange } = renderControlledForm({
      ...baseValue,
      logoFile,
    });

    await user.click(
      screen.getByRole('button', {
        name: 'Remove logo',
      }),
    );

    expect(onChange).toHaveBeenLastCalledWith({
      ...baseValue,
      logoFile: null,
      hasExistingLogo: false,
    });
  });

  it('replaces a selected logo', async () => {
    const originalFile = new File(['original'], 'original.webp', {
      type: 'image/webp',
    });

    const replacementFile = new File(['replacement'], 'replacement.png', {
      type: 'image/png',
    });

    const { user, onChange } = renderControlledForm({
      ...baseValue,
      logoFile: originalFile,
    });

    expect(
      screen.getByRole('button', {
        name: 'Replace logo',
      }),
    ).toBeInTheDocument();

    await user.upload(getFileInput('company-logo-replace'), replacementFile);

    expect(onChange).toHaveBeenLastCalledWith({
      ...baseValue,
      logoFile: replacementFile,
    });
  });
});
