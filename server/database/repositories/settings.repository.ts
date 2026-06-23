import type {
  ReportBrandingMode,
  Settings,
} from '../../../src/domain/settings.js';
import { REPORT_BRANDING_MODES } from '../../../src/domain/settings.js';
import type { CreateSettingsInput } from '../../../src/domain/settings.js';
import { generateId } from '../../utils/id.js';
import { mapPrismaError, RepositoryNotFoundError } from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
import { toIsoString, toOptionalText } from './repository.helpers.js';

export interface SettingsRepository {
  get(): Promise<Settings | null>;
  upsert(input: CreateSettingsInput): Promise<Settings>;
  updateIssuerLogoId(issuerLogoId: string | null): Promise<Settings>;
}

type SettingsRepositoryDb = Pick<RepositoryClient, 'settings'>;

type SettingsRow = {
  id: string;
  organisationName: string | null;
  consultantName: string | null;
  consultantEmail: string | null;
  issuerLogoId: string | null;
  defaultReportTitle: string | null;
  defaultSeverity: Settings['defaultSeverity'];
  theme: Settings['theme'];
  dateFormat: Settings['dateFormat'];
  reportFooterText: string | null;
  reportConfidentialityLabel: string | null;
  methodology: string | null;
  reportStyle: string | null;
  includeEvidence: boolean | null;
  confidentialReports: boolean | null;
  allowedBrandingModes: unknown;
  defaultBrandingMode: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const settingsSelect = {
  id: true,
  organisationName: true,
  consultantName: true,
  consultantEmail: true,
  issuerLogoId: true,
  defaultReportTitle: true,
  defaultSeverity: true,
  theme: true,
  dateFormat: true,
  reportFooterText: true,
  reportConfidentialityLabel: true,
  methodology: true,
  reportStyle: true,
  includeEvidence: true,
  confidentialReports: true,
  allowedBrandingModes: true,
  defaultBrandingMode: true,
  createdAt: true,
  updatedAt: true,
} as const;

const isReportBrandingMode = (value: unknown): value is ReportBrandingMode =>
  typeof value === 'string' &&
  REPORT_BRANDING_MODES.includes(value as ReportBrandingMode);

const toBrandingModes = (value: unknown): ReportBrandingMode[] | undefined => {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  const modes = value.filter(isReportBrandingMode);

  return modes.length === value.length ? modes : undefined;
};

const toSettings = (row: SettingsRow): Settings => ({
  id: row.id,
  organisationName: toOptionalText(row.organisationName),
  consultantName: toOptionalText(row.consultantName),
  consultantEmail: toOptionalText(row.consultantEmail),
  issuerLogoId: toOptionalText(row.issuerLogoId),
  defaultReportTitle: toOptionalText(row.defaultReportTitle),
  defaultSeverity: row.defaultSeverity,
  theme: row.theme,
  dateFormat: row.dateFormat,
  reportFooterText: toOptionalText(row.reportFooterText),
  reportConfidentialityLabel: toOptionalText(row.reportConfidentialityLabel),
  methodology: toOptionalText(row.methodology),
  reportStyle: toOptionalText(row.reportStyle),
  includeEvidence: row.includeEvidence ?? undefined,
  confidentialReports: row.confidentialReports ?? undefined,
  allowedBrandingModes: toBrandingModes(row.allowedBrandingModes),
  defaultBrandingMode: isReportBrandingMode(row.defaultBrandingMode)
    ? row.defaultBrandingMode
    : undefined,
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

const mergeSettingsInput = (
  input: CreateSettingsInput,
  existing?: SettingsRow | null,
): Omit<SettingsRow, 'id' | 'createdAt' | 'updatedAt'> => ({
  organisationName:
    input.organisationName ?? existing?.organisationName ?? null,
  consultantName: input.consultantName ?? existing?.consultantName ?? null,
  consultantEmail: input.consultantEmail ?? existing?.consultantEmail ?? null,
  issuerLogoId: input.issuerLogoId ?? existing?.issuerLogoId ?? null,
  defaultReportTitle:
    input.defaultReportTitle ?? existing?.defaultReportTitle ?? null,
  defaultSeverity: input.defaultSeverity,
  theme: input.theme,
  dateFormat: input.dateFormat,
  reportFooterText:
    input.reportFooterText ?? existing?.reportFooterText ?? null,
  reportConfidentialityLabel:
    input.reportConfidentialityLabel ??
    existing?.reportConfidentialityLabel ??
    null,
  methodology: input.methodology ?? existing?.methodology ?? null,
  reportStyle: input.reportStyle ?? existing?.reportStyle ?? null,
  includeEvidence: input.includeEvidence ?? existing?.includeEvidence ?? null,
  confidentialReports:
    input.confidentialReports ?? existing?.confidentialReports ?? null,
  allowedBrandingModes:
    input.allowedBrandingModes ?? existing?.allowedBrandingModes ?? null,
  defaultBrandingMode:
    input.defaultBrandingMode ?? existing?.defaultBrandingMode ?? null,
});

export function createSettingsRepository(
  db: SettingsRepositoryDb,
): SettingsRepository {
  return {
    async get() {
      const settings = await db.settings.findFirst({
        orderBy: { createdAt: 'asc' },
        select: settingsSelect,
      });

      return settings ? toSettings(settings) : null;
    },

    async upsert(input) {
      try {
        const existing = await db.settings.findFirst({
          orderBy: { createdAt: 'asc' },
          select: settingsSelect,
        });

        if (!existing) {
          const settings = await db.settings.create({
            data: {
              id: generateId('settings'),
              ...mergeSettingsInput(input),
            },
            select: settingsSelect,
          });

          return toSettings(settings);
        }

        const settings = await db.settings.update({
          where: { id: existing.id },
          data: mergeSettingsInput(input, existing),
          select: settingsSelect,
        });

        return toSettings(settings);
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async updateIssuerLogoId(issuerLogoId) {
      try {
        const existing = await db.settings.findFirst({
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });

        if (!existing) {
          throw new RepositoryNotFoundError('Settings not found');
        }

        const settings = await db.settings.update({
          where: { id: existing.id },
          data: { issuerLogoId },
          select: settingsSelect,
        });

        return toSettings(settings);
      } catch (error) {
        throw mapPrismaError(error);
      }
    },
  };
}
