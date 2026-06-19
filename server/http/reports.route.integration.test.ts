import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { loadServerConfig } from '../config.js';
import { createAssessmentRepository } from '../database/repositories/assessment.repository.js';
import { createCompanyRepository } from '../database/repositories/company.repository.js';
import { createEvidenceRepository } from '../database/repositories/evidence.repository.js';
import { createReportRepository } from '../database/repositories/report.repository.js';
import { createSettingsRepository } from '../database/repositories/settings.repository.js';
import { createThreatRepository } from '../database/repositories/threat.repository.js';
import { createApiApp } from './api-app.js';

const repoRoot = path.resolve(process.cwd());
const migrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260612100556_define_domain_model',
  'migration.sql',
);
const migrationSql = readFileSync(migrationPath, 'utf8');
const schemaSql = migrationSql.slice(migrationSql.indexOf('-- CreateTable'));
const assessmentMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260619120000_add_owasp_taxonomy_version_to_assessment',
  'migration.sql',
);
const assessmentMigrationSql = readFileSync(assessmentMigrationPath, 'utf8');
const settingsBrandingMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260617120000_extend_settings_branding',
  'migration.sql',
);
const settingsBrandingMigrationSql = readFileSync(
  settingsBrandingMigrationPath,
  'utf8',
);
const threatMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260616120000_add_finding_category_fields',
  'migration.sql',
);
const threatMigrationSql = readFileSync(threatMigrationPath, 'utf8');
const evidenceMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260616190000_add_structured_evidence',
  'migration.sql',
);
const evidenceMigrationSql = readFileSync(evidenceMigrationPath, 'utf8');
const companyLogoMigrationPath = path.resolve(
  repoRoot,
  'prisma',
  'migrations',
  '20260619130000_add_company_logo_url',
  'migration.sql',
);
const companyLogoMigrationSql = readFileSync(companyLogoMigrationPath, 'utf8');
const allowedOrigin = 'http://localhost:5173';
const config = loadServerConfig({
  FRONTEND_ORIGIN: allowedOrigin,
});

const nodeRequire = createRequire(import.meta.url);
const Database = nodeRequire('better-sqlite3') as new (
  databasePath: string,
) => {
  exec(sql: string): void;
  close(): void;
  pragma(sql: string): void;
};

const startTestServer = async (app: ReturnType<typeof createApiApp>) => {
  const server = createServer(app);

  await new Promise<void>(resolve => {
    server.listen(0, resolve);
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected the test server to listen on an ephemeral port.');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
};

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'appsec-reports-'));
const databasePath = path.join(tempDir, 'reports.sqlite');
const adapterUrl = `file:${databasePath.replaceAll('\\', '/')}`;
const prismaClientPath = pathToFileURL(
  path.join(repoRoot, 'generated', 'prisma', 'client.js'),
).href;
const { PrismaClient } = await import(prismaClientPath);

const bootstrapDb = new Database(databasePath);

try {
  bootstrapDb.exec(schemaSql);
  bootstrapDb.exec(companyLogoMigrationSql);
  bootstrapDb.exec(assessmentMigrationSql);
  bootstrapDb.exec(settingsBrandingMigrationSql);
  bootstrapDb.exec(threatMigrationSql);
  bootstrapDb.exec(evidenceMigrationSql);
} finally {
  bootstrapDb.close();
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: adapterUrl }),
});

try {
  await prisma.$executeRawUnsafe('PRAGMA journal_mode = MEMORY');
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

  const companyRepository = createCompanyRepository(prisma);
  const assessmentRepository = createAssessmentRepository(prisma);
  const threatRepository = createThreatRepository(prisma);
  const evidenceRepository = createEvidenceRepository(prisma);
  const reportRepository = createReportRepository(prisma);
  const settingsRepository = createSettingsRepository(prisma);

  const company = await prisma.company.create({
    data: {
      id: 'cmp_00000000-0000-0000-0000-000000000001',
      name: 'Northstar Digital',
      description: 'Security consulting and managed assessment services',
      website: 'https://northstar.example',
      contactName: 'Alex Mercer',
      contactEmail: 'security@northstar.example',
      logoPath: '/logos/northstar.svg',
      footerText: 'Confidential - do not distribute.',
    },
  });

  const assessment = await prisma.assessment.create({
    data: {
      id: 'asm_00000000-0000-0000-0000-000000000001',
      companyId: company.id,
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
    },
  });

  const foreignAssessment = await prisma.assessment.create({
    data: {
      id: 'asm_00000000-0000-0000-0000-000000000099',
      companyId: company.id,
      title: 'Other assessment',
      status: 'draft',
    },
  });

  const threatA = await prisma.threat.create({
    data: {
      id: 'thr_00000000-0000-0000-0000-000000000001',
      assessmentId: assessment.id,
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
    },
  });

  const threatB = await prisma.threat.create({
    data: {
      id: 'thr_00000000-0000-0000-0000-000000000002',
      assessmentId: assessment.id,
      title: 'Verbose Error Messages',
      description: 'Detailed stack traces are exposed.',
      severity: 'medium',
      strideCategories: ['information-disclosure'],
      status: 'mitigated',
      affectedAsset: '/api/debug',
      recommendation: 'Return generic errors.',
    },
  });

  const foreignThreat = await prisma.threat.create({
    data: {
      id: 'thr_00000000-0000-0000-0000-000000000099',
      assessmentId: foreignAssessment.id,
      title: 'Foreign threat',
      description: 'Not selected',
      severity: 'low',
      strideCategories: ['spoofing'],
      status: 'open',
    },
  });

  const evidenceResponse = await prisma.evidence.create({
    data: {
      id: 'evd_00000000-0000-0000-0000-000000000001',
      assessmentId: assessment.id,
      type: 'note',
      title: 'Captured response',
      content: 'Late content',
      fileName: 'late.txt',
      filePath: 'uploads/evidence/late.txt',
      mimeType: 'text/plain',
      capturedAt: '2026-06-03',
      threatLinks: {
        create: [{ threatId: threatB.id }],
      },
    },
  });

  const evidenceRequest = await prisma.evidence.create({
    data: {
      id: 'evd_00000000-0000-0000-0000-000000000002',
      assessmentId: assessment.id,
      type: 'note',
      title: 'Captured request',
      content: 'Early content',
      fileName: 'early.txt',
      filePath: 'uploads/evidence/early.txt',
      mimeType: 'text/plain',
      capturedAt: '2026-06-02',
      threatLinks: {
        create: [{ threatId: threatB.id }],
      },
    },
  });

  await prisma.evidence.create({
    data: {
      id: 'evd_00000000-0000-0000-0000-000000000003',
      assessmentId: assessment.id,
      type: 'note',
      title: 'Threat A note',
      content: 'Threat A content',
      fileName: 'a.txt',
      filePath: 'uploads/evidence/a.txt',
      mimeType: 'text/plain',
      capturedAt: '2026-06-01',
      threatLinks: {
        create: [{ threatId: threatA.id }],
      },
    },
  });

  const report = await prisma.report.create({
    data: {
      id: 'rpt_00000000-0000-0000-0000-000000000001',
      assessmentId: assessment.id,
      title: 'Application Security Assessment',
      status: 'draft',
      executiveSummary: 'Executive summary',
      selectedThreats: {
        create: [{ threatId: threatB.id }, { threatId: threatA.id }],
      },
    },
  });

  await settingsRepository.upsert({
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
  });

  const server = await startTestServer(
    createApiApp(config, {
      reportRepository,
      assessmentRepository,
      companyRepository,
      threatRepository,
      evidenceRepository,
      settingsRepository,
    }),
  );

  try {
    const response = await fetch(`${server.baseUrl}/api/reports/${report.id}`);

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      data: {
        report: { id: string; selectedThreatIds: string[] };
        company: { id: string; name: string };
        assessments: Array<{
          assessment: { id: string };
          findings: Array<{
            threat: { id: string };
            evidence: Array<{ id: string; filePath?: string }>;
          }>;
        }>;
        branding: {
          issuerLogoId?: string;
          reportFooterText?: string;
          reportConfidentialityLabel?: string;
          confidentialReports?: boolean;
          defaultBrandingMode?: string;
        };
        configuration: { methodology?: string; includeEvidence?: boolean };
        snapshot: {
          branding: {
            issuerLogoId?: string;
            clientName: string;
            confidentialityLabel?: string;
            brandingMode?: string;
          };
        };
      };
    };

    assert.equal(body.data.report.id, report.id);
    assert.equal(body.data.company.id, company.id);
    assert.deepEqual(body.data.report.selectedThreatIds, [
      threatA.id,
      threatB.id,
    ]);
    assert.equal(body.data.assessments.length, 1);
    assert.equal(body.data.assessments[0]?.assessment.id, assessment.id);
    assert.deepEqual(
      body.data.assessments[0]?.findings.map(finding => finding.threat.id),
      [threatA.id, threatB.id],
    );
    assert.deepEqual(
      body.data.assessments[0]?.findings[0]?.evidence.map(item => item.id),
      ['evd_00000000-0000-0000-0000-000000000003'],
    );
    assert.deepEqual(
      body.data.assessments[0]?.findings[1]?.evidence.map(item => item.id),
      [evidenceRequest.id, evidenceResponse.id],
    );
    assert.equal(
      'filePath' in (body.data.assessments[0]?.findings[0]?.evidence[0] ?? {}),
      false,
    );
    assert.equal(body.data.branding.reportFooterText, 'Confidential');
    assert.equal(
      body.data.branding.reportConfidentialityLabel,
      'Strictly confidential',
    );
    assert.equal(body.data.branding.confidentialReports, true);
    assert.equal(
      body.data.branding.issuerLogoId,
      'logo_00000000-0000-0000-0000-000000000001',
    );
    assert.equal(body.data.branding.defaultBrandingMode, 'issuer');
    assert.equal(
      body.data.snapshot.branding.issuerLogoId,
      'logo_00000000-0000-0000-0000-000000000001',
    );
    assert.equal(body.data.snapshot.branding.clientName, company.name);
    assert.equal(
      body.data.snapshot.branding.confidentialityLabel,
      'Strictly confidential',
    );
    assert.equal(body.data.snapshot.branding.brandingMode, 'issuer');
    assert.equal(body.data.configuration.methodology, 'OWASP ASVS / WSTG');
    assert.equal(body.data.configuration.includeEvidence, true);
  } finally {
    await server.close();
  }

  const invalidReport = await prisma.report.create({
    data: {
      id: 'rpt_00000000-0000-0000-0000-000000000099',
      assessmentId: assessment.id,
      title: 'Broken report',
      status: 'draft',
      selectedThreats: {
        create: [{ threatId: foreignThreat.id }],
      },
    },
  });

  const brokenServer = await startTestServer(
    createApiApp(config, {
      reportRepository,
      assessmentRepository,
      companyRepository,
      threatRepository,
      evidenceRepository,
      settingsRepository,
    }),
  );

  try {
    const response = await fetch(
      `${brokenServer.baseUrl}/api/reports/${invalidReport.id}`,
    );

    assert.equal(response.status, 400);
    const body = (await response.json()) as {
      error: { code: string; message: string; details: [] };
    };
    assert.deepEqual(body, {
      error: {
        code: 'REPORT_INVALID_RELATIONSHIP',
        message: 'Report contains invalid related records',
        details: [],
      },
    });
  } finally {
    await brokenServer.close();
  }
} finally {
  await prisma.$disconnect();
  await rm(tempDir, { recursive: true, force: true });
}

console.log('reports API integration checks passed');
