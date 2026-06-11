import type {
  Assessment,
  AssessmentStatus,
  Evidence,
  Report,
  ReportVersion,
  Severity,
  Settings,
  StrideCategory,
  Threat,
  ThreatStatus,
} from './index.js';

const assessment: Assessment = {
  id: 'asm_1',
  companyId: 'cmp_1',
  title: 'Customer Services Portal',
  description: 'Assessment of the customer portal',
  scope: 'Web application',
  status: 'in-progress',
  startedAt: '2026-06-01',
  completedAt: '2026-06-10',
  createdAt: '2026-06-01',
  updatedAt: '2026-06-10',
};

const acceptedRiskThreatStatus: ThreatStatus = 'accepted-risk';
const criticalSeverity: Severity = 'critical';
const strideCategories: StrideCategory[] = ['spoofing', 'tampering'];

const threat: Threat = {
  id: 'thr_1',
  assessmentId: assessment.id,
  title: 'Missing Server-Side Authorization',
  description: 'The endpoint returns another customer’s order data.',
  severity: criticalSeverity,
  strideCategories,
  status: acceptedRiskThreatStatus,
  affectedAsset: '/api/v1/orders/{id}',
  impact: 'Unauthorised access to customer order data',
  recommendation: 'Apply object-level authorization on every request.',
  createdAt: '2026-06-01',
  updatedAt: '2026-06-10',
};

const evidenceGeneral: Evidence = {
  id: 'ev_1',
  assessmentId: assessment.id,
  threatIds: [],
  type: 'note',
  title: 'Assessment notes',
  createdAt: '2026-06-02',
  updatedAt: '2026-06-02',
};

const evidenceLinked: Evidence = {
  ...evidenceGeneral,
  id: 'ev_2',
  threatIds: [threat.id, 'thr_2'],
};

const report: Report = {
  id: 'rep_1',
  assessmentId: assessment.id,
  title: 'Application Security Assessment Report',
  status: 'draft',
  selectedThreatIds: [threat.id],
  latestVersion: 0,
  executiveSummary: 'Summary',
  createdAt: '2026-06-10',
  updatedAt: '2026-06-10',
};

const reportVersion: ReportVersion = {
  id: 'repv_1',
  reportId: report.id,
  version: 1,
  generatedAt: '2026-06-10',
  filePath: '/tmp/report-v1.pdf',
  snapshot: {
    reportTitle: report.title,
    companyName: 'Northstar Digital',
    assessmentTitle: assessment.title,
    executiveSummary: report.executiveSummary,
    threats: [
      {
        threatId: threat.id,
        title: threat.title,
        description: threat.description,
        severity: threat.severity,
        status: threat.status,
        strideCategories: threat.strideCategories,
        affectedAsset: threat.affectedAsset,
        impact: threat.impact,
        recommendation: threat.recommendation,
      },
    ],
  },
};

const settings: Settings = {
  id: 'set_1',
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex.mercer@example.com',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  reportFooterText: 'Confidential',
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  confidentialReports: true,
  createdAt: '2026-06-01',
  updatedAt: '2026-06-10',
};

void assessment;
void threat;
void evidenceGeneral;
void evidenceLinked;
void report;
void reportVersion;
void settings;
void acceptedRiskThreatStatus;
void criticalSeverity;
void strideCategories;

// @ts-expect-error AssessmentStatus must not accept ThreatStatus values.
const invalidAssessmentStatus: AssessmentStatus = 'accepted-risk';

const invalidAssessment: Assessment = {
  ...assessment,
  // @ts-expect-error Assessment.status must not accept ThreatStatus values.
  status: 'accepted-risk',
};

const invalidReport: Report = {
  id: 'rep_2',
  assessmentId: assessment.id,
  title: 'Invalid report',
  status: 'draft',
  selectedThreatIds: [],
  latestVersion: 0,
  createdAt: '2026-06-10',
  updatedAt: '2026-06-10',
  // @ts-expect-error Report must not include companyId.
  companyId: 'cmp_1',
};

const invalidEvidence: Evidence = {
  id: 'ev_3',
  assessmentId: assessment.id,
  threatIds: [],
  type: 'note',
  title: 'Invalid evidence',
  createdAt: '2026-06-10',
  updatedAt: '2026-06-10',
  // @ts-expect-error Evidence must not include companyId.
  companyId: 'cmp_1',
};

const invalidSettings: Settings = {
  id: 'set_2',
  organisationName: 'Northstar Digital',
  consultantName: 'Alex Mercer',
  consultantEmail: 'alex.mercer@example.com',
  defaultReportTitle: 'Application Security Assessment',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  createdAt: '2026-06-01',
  updatedAt: '2026-06-10',
  // @ts-expect-error Settings must not include companyId.
  companyId: 'cmp_1',
};

export {};
