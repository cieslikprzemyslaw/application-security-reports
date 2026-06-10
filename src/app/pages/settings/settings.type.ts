import type { FormEvent } from 'react';

export interface SettingsValue {
  fullName: string;
  role: string;
  email: string;
  companyName: string;
  website: string;
  contactEmail: string;
  reportFooterText: string;
  methodology: string;
  reportStyle: string;
  includeEvidence: boolean;
  confidentialReports: boolean;
}

export interface SettingsProps {
  value: SettingsValue;
  onChange: (value: SettingsValue) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}
