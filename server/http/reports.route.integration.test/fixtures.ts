import type { SettingsRepository } from '../../database/repositories/settings.repository.js';

export type ReportsSeedData = {
  company: {
    id: string;
    name: string;
  };
  assessment: {
    id: string;
  };
  foreignThreat: {
    id: string;
  };
  report: {
    id: string;
    title: string;
  };
  threatA: {
    id: string;
  };
  threatB: {
    id: string;
  };
  evidenceRequest: {
    id: string;
  };
  evidenceResponse: {
    id: string;
  };
};

export const seedReportsData = async (
  prisma: {
    company: {
      create: (input: {
        data: {
          id: string;
          name: string;
          description: string;
          website: string;
          contactName: string;
          contactEmail: string;
          logoUrl: string | null;
          footerText: string;
        };
      }) => Promise<{ id: string; name: string }>;
    };
    assessment: {
      create: (input: {
        data: {
          id: string;
          companyId: string;
          title: string;
          description?: string;
          scope?: string;
          status: string;
          startedAt?: string;
          completedAt?: string;
          applicationName?: string;
          environment?: string;
          assessmentType?: string;
          overallRisk?: string;
        };
      }) => Promise<{ id: string }>;
    };
    threat: {
      create: (input: {
        data: {
          id: string;
          assessmentId: string;
          title: string;
          description: string;
          severity: string;
          strideCategories: string[];
          status: string;
          affectedAsset?: string;
          impact?: string;
          recommendation?: string;
          observation?: string;
          affectedComponent?: string;
          affectedEndpoint?: string;
          risk?: string;
          remediation?: string;
          references?: string;
          owaspCategoryCode?: string;
          customCategory?: string;
          reproductionSteps?: string;
        };
      }) => Promise<{ id: string }>;
    };
    evidence: {
      create: (input: {
        data: {
          id: string;
          assessmentId: string;
          type: string;
          title: string;
          content: string;
          fileName: string;
          filePath: string;
          mimeType: string;
          capturedAt: string;
          threatLinks: {
            create: Array<{ threatId: string }>;
          };
        };
      }) => Promise<{ id: string }>;
    };
    report: {
      create: (input: {
        data: {
          id: string;
          assessmentId: string;
          title: string;
          status: string;
          executiveSummary: string;
          selectedThreats: {
            create: Array<{ threatId: string; position: number }>;
          };
        };
      }) => Promise<{ id: string }>;
    };
  },
  settingsRepository: SettingsRepository,
): Promise<ReportsSeedData> => {
  const company = await prisma.company.create({
    data: {
      id: 'cmp_00000000-0000-0000-0000-000000000001',
      name: 'Northstar Digital',
      description: 'Security consulting and managed assessment services',
      website: 'https://northstar.example',
      contactName: 'Alex Mercer',
      contactEmail: 'security@northstar.example',
      logoUrl: null,
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
        create: [
          { threatId: threatB.id, position: 0 },
          { threatId: threatA.id, position: 1 },
        ],
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

  return {
    company: {
      id: company.id,
      name: company.name,
    },
    assessment: {
      id: assessment.id,
    },
    foreignThreat: {
      id: foreignThreat.id,
    },
    report: {
      id: report.id,
      title: 'Application Security Assessment',
    },
    threatA: {
      id: threatA.id,
    },
    threatB: {
      id: threatB.id,
    },
    evidenceRequest: {
      id: evidenceRequest.id,
    },
    evidenceResponse: {
      id: evidenceResponse.id,
    },
  };
};
