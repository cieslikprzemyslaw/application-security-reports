import type { Assessment } from '../../../src/domain/assessment.js';
import type { Company } from '../../../src/domain/company.js';
import type { Evidence } from '../../../src/domain/evidence.js';
import type { Report } from '../../../src/domain/report.js';
import type { Settings } from '../../../src/domain/settings.js';
import type { Threat } from '../../../src/domain/threat.js';
import type { AssessmentRepository } from '../../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../../database/repositories/report.repository.js';
import type { SettingsRepository } from '../../database/repositories/settings.repository.js';
import type { ThreatRepository } from '../../database/repositories/threat.repository.js';

import {
  defaultAssessment,
  defaultCompany,
  evidenceEarly,
  evidenceForThreatA,
  evidenceLate,
  report,
  settings,
  threatA,
  threatB,
} from './fixtures.js';

type ReportRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Report | null>;
}>;

type AssessmentRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Assessment | null>;
}>;

type CompanyRepositoryOverrides = Partial<{
  findById: (id: string) => Promise<Company | null>;
}>;

type ThreatRepositoryOverrides = Partial<{
  findByAssessmentId: (assessmentId: string) => Promise<Threat[]>;
}>;

type EvidenceRepositoryOverrides = Partial<{
  findByAssessmentId: (assessmentId: string) => Promise<Evidence[]>;
}>;

type SettingsRepositoryOverrides = Partial<{
  get: () => Promise<Settings | null>;
}>;

const createReportRepository = (overrides: ReportRepositoryOverrides = {}) => {
  let findByIdCalls = 0;

  const repository: ReportRepository = {
    async findById(id) {
      findByIdCalls += 1;
      return overrides.findById?.(id) ?? report;
    },
    async findByAssessmentId() {
      return [report];
    },
    async create() {
      return report;
    },
    async update() {
      return report;
    },
    async delete() {
      return undefined;
    },
    async attachThreat() {
      return undefined;
    },
    async detachThreat() {
      return undefined;
    },
  };

  return { findByIdCalls: () => findByIdCalls, repository };
};

const createAssessmentRepository = (
  overrides: AssessmentRepositoryOverrides = {},
) => {
  let findByIdCalls = 0;

  const repository: AssessmentRepository = {
    async findAll() {
      return [defaultAssessment];
    },
    async findById(id) {
      findByIdCalls += 1;
      return overrides.findById?.(id) ?? defaultAssessment;
    },
    async findByCompanyId() {
      return [defaultAssessment];
    },
    async create() {
      return defaultAssessment;
    },
    async update() {
      return defaultAssessment;
    },
    async delete() {
      return undefined;
    },
  };

  return { findByIdCalls: () => findByIdCalls, repository };
};

const createCompanyRepository = (
  overrides: CompanyRepositoryOverrides = {},
) => {
  let findByIdCalls = 0;

  const repository: CompanyRepository = {
    async findAll() {
      return [defaultCompany];
    },
    async findById(id) {
      findByIdCalls += 1;
      return overrides.findById?.(id) ?? defaultCompany;
    },
    async findOverview() {
      return null;
    },
    async create(input, id) {
      return {
        ...defaultCompany,
        id: id ?? defaultCompany.id,
        ...input,
      };
    },
    async update(id, input) {
      return {
        ...defaultCompany,
        id,
        ...input,
      };
    },
    async updateLogoUrl(id, logoUrl) {
      return {
        ...defaultCompany,
        id,
        logoUrl,
      };
    },
    async delete() {
      return undefined;
    },
    async archive(id) {
      return { ...defaultCompany, id, archivedAt: '2026-06-21T13:00:00.000Z' };
    },
    async restore(id) {
      return { ...defaultCompany, id, archivedAt: null };
    },
  };

  return { findByIdCalls: () => findByIdCalls, repository };
};

const createThreatRepository = (overrides: ThreatRepositoryOverrides = {}) => {
  let findByAssessmentIdCalls = 0;

  const repository: ThreatRepository = {
    async findById() {
      return threatA;
    },
    async findByAssessmentId(assessmentId) {
      findByAssessmentIdCalls += 1;
      return overrides.findByAssessmentId?.(assessmentId) ?? [threatA, threatB];
    },
    async create() {
      return threatA;
    },
    async update() {
      return threatA;
    },
    async delete() {
      return undefined;
    },
  };

  return {
    findByAssessmentIdCalls: () => findByAssessmentIdCalls,
    repository,
  };
};

const createEvidenceRepository = (
  overrides: EvidenceRepositoryOverrides = {},
) => {
  let findByAssessmentIdCalls = 0;

  const repository: EvidenceRepository = {
    async findById() {
      return evidenceEarly;
    },
    async findByAssessmentId(assessmentId) {
      findByAssessmentIdCalls += 1;
      return (
        overrides.findByAssessmentId?.(assessmentId) ?? [
          evidenceLate,
          evidenceEarly,
          evidenceForThreatA,
        ]
      );
    },
    async create() {
      return evidenceEarly;
    },
    async update() {
      return evidenceEarly;
    },
    async delete() {
      return undefined;
    },
    async attachToThreat() {
      return undefined;
    },
    async detachFromThreat() {
      return undefined;
    },
  };

  return {
    findByAssessmentIdCalls: () => findByAssessmentIdCalls,
    repository,
  };
};

const createSettingsRepository = (
  overrides: SettingsRepositoryOverrides = {},
) => {
  let getCalls = 0;

  const repository: SettingsRepository = {
    async get() {
      getCalls += 1;
      return overrides.get?.() ?? settings;
    },
    async upsert() {
      return settings;
    },
    async updateIssuerLogoId(issuerLogoId) {
      return {
        ...settings,
        issuerLogoId: issuerLogoId ?? undefined,
      };
    },
  };

  return { getCalls: () => getCalls, repository };
};

export {
  createReportRepository,
  createAssessmentRepository,
  createCompanyRepository,
  createThreatRepository,
  createEvidenceRepository,
  createSettingsRepository,
};
