import type { Severity, SettingsId, TimestampedEntity } from './common.js';

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const;

export type DateFormat = (typeof DATE_FORMATS)[number];

export const REPORT_BRANDING_MODES = ['issuer', 'client', 'none'] as const;

export type ReportBrandingMode = (typeof REPORT_BRANDING_MODES)[number];

export interface Settings extends TimestampedEntity {
  id: SettingsId;
  organisationName?: string;
  consultantName?: string;
  consultantEmail?: string;
  issuerLogoId?: string;
  defaultReportTitle?: string;
  defaultSeverity: Severity;
  theme: ThemePreference;
  dateFormat: DateFormat;
  reportFooterText?: string;
  reportConfidentialityLabel?: string;
  methodology?: string;
  reportStyle?: string;
  includeEvidence?: boolean;
  confidentialReports?: boolean;
  allowedBrandingModes?: ReportBrandingMode[];
  defaultBrandingMode?: ReportBrandingMode;
}

export type CreateSettingsInput = Omit<
  Settings,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateSettingsInput = Partial<CreateSettingsInput>;
