import type {
  ReportBuilderHierarchy,
  ReportBuilderHierarchyAssessmentNode,
  ReportBuilderHierarchyThreatNode,
} from './reportBuilderTree.service';

const includesQuery = (value: string | undefined, query: string) =>
  value?.toLocaleLowerCase().includes(query) ?? false;

const threatMatches = (node: ReportBuilderHierarchyThreatNode, query: string) =>
  includesQuery(node.threat.title, query) ||
  includesQuery(node.threat.severity, query) ||
  includesQuery(node.threat.affectedEndpoint, query);

const filterAssessment = (
  node: ReportBuilderHierarchyAssessmentNode,
  query: string,
): ReportBuilderHierarchyAssessmentNode | undefined => {
  const assessmentMatches = [
    node.assessment.name,
    node.assessment.applicationName,
    node.assessment.type,
    node.assessment.description,
  ].some(value => includesQuery(value, query));

  if (assessmentMatches) {
    return node;
  }

  const threats = node.threats.flatMap(threat => {
    if (threatMatches(threat, query)) {
      return [threat];
    }

    const evidence = threat.evidence.filter(evidenceNode =>
      [evidenceNode.evidence.title, evidenceNode.evidence.type].some(value =>
        includesQuery(value, query),
      ),
    );

    return evidence.length > 0 ? [{ ...threat, evidence }] : [];
  });

  return threats.length > 0 ? { ...node, threats } : undefined;
};

export const filterReportBuilderHierarchy = (
  hierarchy: ReportBuilderHierarchy,
  rawQuery: string,
): ReportBuilderHierarchy => {
  const query = rawQuery.trim().toLocaleLowerCase();

  if (!query) {
    return hierarchy;
  }

  return {
    ...hierarchy,
    assessments: hierarchy.assessments.flatMap(assessment => {
      const filtered = filterAssessment(assessment, query);
      return filtered ? [filtered] : [];
    }),
  };
};
