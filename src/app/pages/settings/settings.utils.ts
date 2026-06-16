import type { ValidationFieldError } from '~/validation';
import type { SettingsUpdateInput } from '~/services/settingsService';
import type { Settings as DomainSettings } from '~/domain';

import type {
  SettingsFieldName,
  SettingsFieldErrors,
  SettingsValue,
} from './settings.type';

const settingsFieldNames: SettingsFieldName[] = [
  'organisationName',
  'consultantName',
  'consultantEmail',
  'defaultReportTitle',
  'defaultSeverity',
  'theme',
  'dateFormat',
  'reportFooterText',
  'methodology',
  'reportStyle',
  'includeEvidence',
  'confidentialReports',
];

const normalizeText = (value: string): string => value.trim();

const toOptionalText = (value: string): string | undefined => {
  const normalizedValue = normalizeText(value);

  return normalizedValue.length > 0 ? normalizedValue : undefined;
};

export const createEmptySettingsValue = (): SettingsValue => ({
  organisationName: '',
  consultantName: '',
  consultantEmail: '',
  defaultReportTitle: '',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText: '',
  methodology: '',
  reportStyle: '',
  includeEvidence: false,
  confidentialReports: false,
});

export const settingsToValue = (settings: DomainSettings): SettingsValue => ({
  organisationName: settings.organisationName ?? '',
  consultantName: settings.consultantName ?? '',
  consultantEmail: settings.consultantEmail ?? '',
  defaultReportTitle: settings.defaultReportTitle ?? '',
  defaultSeverity: settings.defaultSeverity,
  theme: settings.theme,
  dateFormat: settings.dateFormat,
  reportFooterText: settings.reportFooterText ?? '',
  methodology: settings.methodology ?? '',
  reportStyle: settings.reportStyle ?? '',
  includeEvidence: settings.includeEvidence ?? false,
  confidentialReports: settings.confidentialReports ?? false,
});

export const valueToSettingsPatch = (
  value: SettingsValue,
  baseline: SettingsValue,
): SettingsUpdateInput => {
  const patch: SettingsUpdateInput = {};

  if (
    normalizeText(value.organisationName) !==
    normalizeText(baseline.organisationName)
  ) {
    patch.organisationName = toOptionalText(value.organisationName);
  }

  if (
    normalizeText(value.consultantName) !==
    normalizeText(baseline.consultantName)
  ) {
    patch.consultantName = toOptionalText(value.consultantName);
  }

  if (
    normalizeText(value.consultantEmail) !==
    normalizeText(baseline.consultantEmail)
  ) {
    patch.consultantEmail = toOptionalText(value.consultantEmail);
  }

  if (
    normalizeText(value.defaultReportTitle) !==
    normalizeText(baseline.defaultReportTitle)
  ) {
    patch.defaultReportTitle = toOptionalText(value.defaultReportTitle);
  }

  if (value.defaultSeverity !== baseline.defaultSeverity) {
    patch.defaultSeverity = value.defaultSeverity;
  }

  if (value.theme !== baseline.theme) {
    patch.theme = value.theme;
  }

  if (value.dateFormat !== baseline.dateFormat) {
    patch.dateFormat = value.dateFormat;
  }

  if (
    normalizeText(value.reportFooterText) !==
    normalizeText(baseline.reportFooterText)
  ) {
    patch.reportFooterText = toOptionalText(value.reportFooterText);
  }

  if (
    normalizeText(value.methodology) !== normalizeText(baseline.methodology)
  ) {
    patch.methodology = toOptionalText(value.methodology);
  }

  if (
    normalizeText(value.reportStyle) !== normalizeText(baseline.reportStyle)
  ) {
    patch.reportStyle = toOptionalText(value.reportStyle);
  }

  if (value.includeEvidence !== baseline.includeEvidence) {
    patch.includeEvidence = value.includeEvidence;
  }

  if (value.confidentialReports !== baseline.confidentialReports) {
    patch.confidentialReports = value.confidentialReports;
  }

  return patch;
};

export const hasSettingsPatchValues = (patch: SettingsUpdateInput): boolean =>
  Object.values(patch).some(value => value !== undefined);

export const areSettingsValuesEqual = (
  left: SettingsValue,
  right: SettingsValue,
): boolean => Object.keys(valueToSettingsPatch(left, right)).length === 0;

export const createSettingsValidationErrorMap = (
  details: ValidationFieldError[],
): {
  fieldErrors: SettingsFieldErrors;
  generalErrors: string[];
} => {
  const fieldErrors: SettingsFieldErrors = {};
  const generalErrors: string[] = [];
  const supportedFieldNames = new Set(settingsFieldNames);

  for (const detail of details) {
    const path = detail.path.split('.')[0] as SettingsFieldName | undefined;

    if (path && supportedFieldNames.has(path) && !fieldErrors[path]) {
      fieldErrors[path] = detail.message;
      continue;
    }

    generalErrors.push(detail.message);
  }

  return {
    fieldErrors,
    generalErrors,
  };
};

export const getFirstSettingsFieldError = (
  fieldErrors: SettingsFieldErrors,
): SettingsFieldName | undefined =>
  settingsFieldNames.find(fieldName => fieldErrors[fieldName]);

export const createSettingsLogoInitials = (value: string): string => {
  const initials = value
    .split(/\s+/)
    .map(part => part.trim()[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials.length > 0 ? initials : 'AS';
};
