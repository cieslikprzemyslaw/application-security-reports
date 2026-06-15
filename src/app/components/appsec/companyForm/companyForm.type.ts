import type { FormEvent } from 'react';

export interface CompanyFormValue {
  name: string;
  description: string;
  website: string;
  contactName: string;
  contactEmail: string;
  logoPath: string;
  footerText: string;
}

export interface CompanyFormProps {
  value: CompanyFormValue;
  errors?: Partial<Record<keyof CompanyFormValue, string>>;
  errorMessage?: string;
  isSubmitting?: boolean;
  submitLabel?: string;
  onChange: (value: CompanyFormValue) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
