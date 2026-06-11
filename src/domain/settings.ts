import type {
  Severity,
  SettingsId,
  TimestampedEntity,
} from './common';

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const;

export type DateFormat = (typeof DATE_FORMATS)[number];

export interface Settings extends TimestampedEntity {
  id: SettingsId;
  organisationName?: string;
  consultantName?: string;
  consultantEmail?: string;
  defaultReportTitle?: string;
  defaultSeverity: Severity;
  theme: ThemePreference;
  dateFormat: DateFormat;
  reportFooterText?: string;
  methodology?: string;
  reportStyle?: string;
  includeEvidence?: boolean;
  confidentialReports?: boolean;
}

export type CreateSettingsInput = Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateSettingsInput = Partial<CreateSettingsInput>;
