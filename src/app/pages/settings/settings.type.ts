import type { FormEvent } from 'react';

import type { DateFormat, Severity, ThemePreference } from '~/domain';

export interface SettingsValue {
  organisationName: string;
  consultantName: string;
  consultantEmail: string;
  defaultReportTitle: string;
  defaultSeverity: Severity;
  theme: ThemePreference;
  dateFormat: DateFormat;
  reportFooterText: string;
  methodology: string;
  reportStyle: string;
  includeEvidence: boolean;
  confidentialReports: boolean;
}

export type SettingsFieldName = keyof SettingsValue;

export type SettingsFieldErrors = Partial<Record<SettingsFieldName, string>>;

export interface SettingsProps {
  value: SettingsValue;
  fieldErrors?: SettingsFieldErrors;
  statusMessage?: string;
  errorMessage?: string;
  isDirty?: boolean;
  isSaving?: boolean;
  previewTheme: 'light' | 'dark';
  onChange: (value: SettingsValue) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}
