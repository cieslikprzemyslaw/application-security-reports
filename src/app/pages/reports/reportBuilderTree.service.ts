import type { Evidence, Threat } from '~/domain';
import {
  assessmentService,
  evidenceService,
  threatService,
  type AssessmentListItem,
  type AssessmentService,
  type EvidenceService,
  type ThreatService,
} from '~/services';

export interface ReportBuilderHierarchyEvidenceNode {
  evidence: Evidence;
}

export interface ReportBuilderHierarchyThreatNode {
  threat: Threat;
  evidence: ReportBuilderHierarchyEvidenceNode[];
}

export interface ReportBuilderHierarchyAssessmentNode {
  assessment: AssessmentListItem;
  threats: ReportBuilderHierarchyThreatNode[];
}

export interface ReportBuilderHierarchy {
  companyId: string;
  assessments: ReportBuilderHierarchyAssessmentNode[];
}

interface ReportBuilderHierarchyDependencies {
  assessmentService: Pick<AssessmentService, 'list'>;
  threatService: Pick<ThreatService, 'listByAssessment'>;
  evidenceService: Pick<EvidenceService, 'list'>;
}

const defaultDependencies: ReportBuilderHierarchyDependencies = {
  assessmentService,
  threatService,
  evidenceService,
};

const groupEvidenceByThreatId = (evidence: Evidence[]) => {
  const groupedEvidence = new Map<string, Evidence[]>();

  for (const item of evidence) {
    if (item.threatIds.length === 0) {
      continue;
    }

    for (const threatId of item.threatIds) {
      const currentItems = groupedEvidence.get(threatId) ?? [];
      currentItems.push(item);
      groupedEvidence.set(threatId, currentItems);
    }
  }

  return groupedEvidence;
};

export const createReportBuilderHierarchyLoader = (
  dependencies: ReportBuilderHierarchyDependencies = defaultDependencies,
) => {
  return async (
    companyId: string,
    signal?: AbortSignal,
  ): Promise<ReportBuilderHierarchy> => {
    const assessments = await dependencies.assessmentService.list(
      { companyId },
      signal,
    );

    const assessmentNodes = await Promise.all(
      assessments.map(async assessment => {
        const [threats, evidence] = await Promise.all([
          dependencies.threatService.listByAssessment(assessment.id, signal),
          dependencies.evidenceService.list(
            { assessmentId: assessment.id },
            signal,
          ),
        ]);

        const evidenceByThreatId = groupEvidenceByThreatId(evidence);

        return {
          assessment,
          threats: threats.map(threat => ({
            threat,
            evidence: (evidenceByThreatId.get(threat.id) ?? []).map(
              evidenceItem => ({
                evidence: evidenceItem,
              }),
            ),
          })),
        };
      }),
    );

    return {
      companyId,
      assessments: assessmentNodes,
    };
  };
};

export const reportBuilderHierarchyLoader =
  createReportBuilderHierarchyLoader();
