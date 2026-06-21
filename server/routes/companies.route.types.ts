import type { Assessment } from '../../src/domain/assessment.js';
import { prefixedUuidSchema } from '../../src/domain/schemas/common.schema.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import type { CompanyLogoStorage } from '../services/companyLogoStorage.js';
import { z } from 'zod';

export const companyAssessmentOverviewRouteParamsSchema = z
  .object({
    id: prefixedUuidSchema('cmp_', 'Company'),
    assessmentId: prefixedUuidSchema('asm_', 'Assessment'),
  })
  .strict();

export type AssessmentWorkspaceCommand =
  | 'start'
  | 'complete'
  | 'reopen'
  | 'archive';

export type AssessmentWorkspaceOverview = {
  company: {
    id: string;
    name: string;
  };
  assessment: Assessment & {
    recordVersion: number;
    findingsCount: number;
    evidenceCount: number;
    reportVersionCount: number;
    availableActions?: AssessmentWorkspaceCommand[];
  };
};

export type CompanyResponse = {
  id: string;
  name: string;
  description?: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  logoUrl: string | null;
  footerText?: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyRepositoryOperation =
  | 'list'
  | 'retrieve'
  | 'overview'
  | 'create'
  | 'update'
  | 'delete'
  | 'archive'
  | 'restore';

export type CompaniesRouteDependencies = {
  assessmentRepository?: AssessmentRepository;
  threatRepository?: ThreatRepository;
  evidenceRepository?: EvidenceRepository;
  reportRepository?: ReportRepository;
  logoStorage?: CompanyLogoStorage;
};

export type CreateCompanyBody = {
  name: string;
  description?: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  footerText?: string;
};

export type UpdateCompanyBody = Partial<CreateCompanyBody>;
