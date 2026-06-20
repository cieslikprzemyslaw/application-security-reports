import type { FormEvent, ReactNode } from 'react';

import type { CalloutVariant } from '~/app/components/ui/callout';

export interface CompanyFormNotice {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  variant?: CalloutVariant;
}

export interface CompanyFormValue {
  name: string;
  description: string;
  website: string;
  contactName: string;
  contactEmail: string;
  footerText: string;
  logoFile: File | null;
  hasExistingLogo: boolean;
}

export interface CompanyFormProps {
  value: CompanyFormValue;
  errors?: Partial<Record<keyof CompanyFormValue, string>>;
  notice?: CompanyFormNotice;
  errorMessage?: string;
  isSubmitting?: boolean;
  isLogoOnlyMode?: boolean;
  submitLabel?: string;
  existingLogoUrl?: string | null;
  onChange: (value: CompanyFormValue) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
