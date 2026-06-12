import type { Settings } from '../../../src/domain/settings.js';
import type { CreateSettingsInput } from '../../../src/domain/settings.js';
import { generateId } from '../../utils/id.js';
import { mapPrismaError } from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
import { toIsoString, toOptionalText } from './repository.helpers.js';

export interface SettingsRepository {
  get(): Promise<Settings | null>;
  upsert(input: CreateSettingsInput): Promise<Settings>;
}

type SettingsRepositoryDb = Pick<RepositoryClient, 'settings'>;

type SettingsRow = {
  id: string;
  organisationName: string | null;
  consultantName: string | null;
  consultantEmail: string | null;
  defaultReportTitle: string | null;
  defaultSeverity: Settings['defaultSeverity'];
  theme: Settings['theme'];
  dateFormat: Settings['dateFormat'];
  reportFooterText: string | null;
  methodology: string | null;
  reportStyle: string | null;
  includeEvidence: boolean | null;
  confidentialReports: boolean | null;
  createdAt: Date;
  updatedAt: Date;
};

const settingsSelect = {
  id: true,
  organisationName: true,
  consultantName: true,
  consultantEmail: true,
  defaultReportTitle: true,
  defaultSeverity: true,
  theme: true,
  dateFormat: true,
  reportFooterText: true,
  methodology: true,
  reportStyle: true,
  includeEvidence: true,
  confidentialReports: true,
  createdAt: true,
  updatedAt: true,
} as const;

const toSettings = (row: SettingsRow): Settings => ({
  id: row.id,
  organisationName: toOptionalText(row.organisationName),
  consultantName: toOptionalText(row.consultantName),
  consultantEmail: toOptionalText(row.consultantEmail),
  defaultReportTitle: toOptionalText(row.defaultReportTitle),
  defaultSeverity: row.defaultSeverity,
  theme: row.theme,
  dateFormat: row.dateFormat,
  reportFooterText: toOptionalText(row.reportFooterText),
  methodology: toOptionalText(row.methodology),
  reportStyle: toOptionalText(row.reportStyle),
  includeEvidence: row.includeEvidence ?? undefined,
  confidentialReports: row.confidentialReports ?? undefined,
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
  defaultReportTitle:
    input.defaultReportTitle ?? existing?.defaultReportTitle ?? null,
  defaultSeverity: input.defaultSeverity,
  theme: input.theme,
  dateFormat: input.dateFormat,
  reportFooterText:
    input.reportFooterText ?? existing?.reportFooterText ?? null,
  methodology: input.methodology ?? existing?.methodology ?? null,
  reportStyle: input.reportStyle ?? existing?.reportStyle ?? null,
  includeEvidence: input.includeEvidence ?? existing?.includeEvidence ?? null,
  confidentialReports:
    input.confidentialReports ?? existing?.confidentialReports ?? null,
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
  };
}
