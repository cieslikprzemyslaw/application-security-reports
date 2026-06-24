export const buildRequest = (harness: {
  company: { id: string };
  assessment: { id: string };
  threatB: { id: string };
  evidenceRequest: { id: string };
}) => ({
  companyId: harness.company.id,
  assessmentId: harness.assessment.id,
  selection: {
    threatIds: [harness.threatB.id],
    evidenceIds: [harness.evidenceRequest.id],
  },
  configuration: {
    methodology: 'OWASP ASVS / WSTG',
    reportStyle: 'Technical',
    includeEvidence: true,
  },
  brandingMode: 'issuer' as const,
});

export const postReadiness = (
  baseUrl: string,
  reportId: string,
  request: unknown,
) =>
  fetch(`${baseUrl}/api/reports/${reportId}/readiness`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

export const postDraft = (
  baseUrl: string,
  reportId: string,
  request: unknown,
) =>
  fetch(`${baseUrl}/api/reports/${reportId}/versions/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
