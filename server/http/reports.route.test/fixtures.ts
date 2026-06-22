import type { Assessment } from '../../../src/domain/assessment.js';
import type { Company } from '../../../src/domain/company.js';
import type { Evidence } from '../../../src/domain/evidence.js';
import type { Report } from '../../../src/domain/report.js';
import type { Settings } from '../../../src/domain/settings.js';
import type { Threat } from '../../../src/domain/threat.js';
import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/owaspTop10.js';

const defaultCompany: Company = {
  id: 'cmp_00000000-0000-0000-0000-000000000001',
  name: 'Northstar Digital',
  description: 'Security consulting and managed assessment services',
  website: 'https://northstar.example',
  contactName: 'Alex Mercer',
  contactEmail: 'security@northstar.example',
  logoUrl: null,
  footerText: 'Confidential - do not distribute.',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

const defaultAssessment: Assessment = {
  id: 'asm_00000000-0000-0000-0000-000000000001',
  companyId: defaultCompany.id,
  title: 'Customer Services Portal',
  description: 'Assessment of the customer portal',
  scope: 'Web application',
  status: 'in-progress',
  startedAt: '2026-06-01',
  completedAt: '2026-06-10',
  applicationName: 'Customer Services Portal',
  environment: 'Production',
  assessmentType: 'Web App',
  overallRisk: 'high',
  owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

const threatA: Threat = {
  id: 'thr_00000000-0000-0000-0000-000000000001',
  assessmentId: defaultAssessment.id,
  title: 'Missing Server-Side Authorization',
  description: 'The endpoint returns another customer order.',
  severity: 'critical',
  strideCategories: ['spoofing', 'tampering'],
  status: 'accepted-risk',
  affectedAsset: '/api/v1/orders/{id}',
  impact: 'Unauthorised access to customer order data',
  recommendation: 'Apply object-level authorization on every request.',
  observation: 'An authenticated user can access another customer order.',
  affectedComponent: 'Orders API',
  affectedEndpoint: '/api/v1/orders/{id}',
  risk: 'Sensitive order data is exposed.',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

const threatB: Threat = {
  ...threatA,
  id: 'thr_00000000-0000-0000-0000-000000000002',
  title: 'Verbose Error Messages',
  severity: 'medium',
  status: 'mitigated',
  strideCategories: ['information-disclosure'],
};

const foreignThreat: Threat = {
  ...threatA,
  id: 'thr_00000000-0000-0000-0000-000000000099',
  assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
  title: 'Foreign threat',
};

const evidenceLate: Evidence = {
  id: 'evd_00000000-0000-0000-0000-000000000001',
  assessmentId: defaultAssessment.id,
  threatIds: [threatB.id],
  type: 'note',
  title: 'Late note',
  description: 'Second evidence entry',
  content: 'Late content',
  fileName: 'late.txt',
  filePath: 'uploads/evidence/late.txt',
  mimeType: 'text/plain',
  capturedAt: '2026-06-03',
  createdAt: '2026-06-03T12:00:00.000Z',
  updatedAt: '2026-06-03T12:00:00.000Z',
};

const evidenceEarly: Evidence = {
  ...evidenceLate,
  id: 'evd_00000000-0000-0000-0000-000000000002',
  title: 'Early note',
  content: 'Early content',
  fileName: 'early.txt',
  filePath: 'uploads/evidence/early.txt',
  capturedAt: '2026-06-02',
  createdAt: '2026-06-02T12:00:00.000Z',
  updatedAt: '2026-06-02T12:00:00.000Z',
};

const evidenceForThreatA: Evidence = {
  ...evidenceLate,
  id: 'evd_00000000-0000-0000-0000-000000000003',
  threatIds: [threatA.id],
  title: 'Threat A note',
  fileName: 'a.txt',
  filePath: 'uploads/evidence/a.txt',
  capturedAt: '2026-06-01',
  createdAt: '2026-06-01T12:00:00.000Z',
  updatedAt: '2026-06-01T12:00:00.000Z',
};

const report: Report = {
  id: 'rpt_00000000-0000-0000-0000-000000000001',
  assessmentId: defaultAssessment.id,
  title: 'Application Security Assessment',
  status: 'draft',
  selectedThreatIds: [threatB.id, threatA.id],
  latestVersion: 0,
  executiveSummary: 'Executive summary',
  createdAt: '2026-06-11T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

const settings: Settings = {
  id: 'set_00000000-0000-0000-0000-000000000001',
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex.mercer@example.com',
  issuerLogoId: 'logo_00000000-0000-0000-0000-000000000001',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText: 'Confidential',
  reportConfidentialityLabel: 'Strictly confidential',
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  confidentialReports: true,
  allowedBrandingModes: ['issuer', 'client'],
  defaultBrandingMode: 'issuer',
  createdAt: '2026-06-11T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

export {
  defaultCompany,
  defaultAssessment,
  threatA,
  threatB,
  foreignThreat,
  evidenceLate,
  evidenceEarly,
  evidenceForThreatA,
  report,
  settings,
};
