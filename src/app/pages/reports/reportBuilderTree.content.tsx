import Badge from '~/app/components/ui/badge';
import Checkbox from '~/app/components/ui/checkbox';

import {
  getAssessmentSelectionState,
  getThreatSelectionState,
  type ReportBuilderSelectionTreeState,
} from './reportBuilderSelectionTree';
import type {
  ReportBuilderHierarchy,
  ReportBuilderHierarchyAssessmentNode,
  ReportBuilderHierarchyEvidenceNode,
  ReportBuilderHierarchyThreatNode,
} from './reportBuilderTree.service';

interface ReportBuilderTreeContentProps {
  hierarchy: ReportBuilderHierarchy;
  exactSelectedAssessmentId?: string;
  exactSelectedThreatIds: string[];
  exactSelectedEvidenceIds: string[];
  selectionState: ReportBuilderSelectionTreeState;
  onAssessmentChange: (assessmentId: string, checked: boolean) => void;
  onThreatChange: (threatId: string, checked: boolean) => void;
  onEvidenceChange: (evidenceId: string, checked: boolean) => void;
}

const formatAssessmentSubtitle = (
  assessment: ReportBuilderHierarchyAssessmentNode,
) => {
  const subtitle =
    assessment.assessment.applicationName ??
    assessment.assessment.type ??
    assessment.assessment.description;

  if (subtitle === assessment.assessment.name) {
    return assessment.assessment.type ?? assessment.assessment.description;
  }

  return subtitle;
};

const formatThreatSubtitle = (threat: ReportBuilderHierarchyThreatNode) =>
  threat.threat.severity.charAt(0).toUpperCase() +
  threat.threat.severity.slice(1);

const formatEvidenceSubtitle = (evidence: ReportBuilderHierarchyEvidenceNode) =>
  evidence.evidence.type.toUpperCase();

const countAssessmentDescendants = (
  assessment: ReportBuilderHierarchyAssessmentNode,
) =>
  assessment.threats.reduce(
    (counts, threat) => ({
      threatCount: counts.threatCount + 1,
      evidenceCount: counts.evidenceCount + threat.evidence.length,
    }),
    { threatCount: 0, evidenceCount: 0 },
  );

const ReportBuilderTreeContent = ({
  hierarchy,
  exactSelectedAssessmentId,
  exactSelectedThreatIds,
  exactSelectedEvidenceIds,
  selectionState,
  onAssessmentChange,
  onThreatChange,
  onEvidenceChange,
}: ReportBuilderTreeContentProps) => {
  const selectedEvidenceIdSet = new Set(exactSelectedEvidenceIds);

  function renderEvidenceNode(
    assessmentId: string,
    threatId: string,
    node: ReportBuilderHierarchyEvidenceNode,
  ) {
    const checked = selectedEvidenceIdSet.has(node.evidence.id);

    return (
      <li key={node.evidence.id} className="report-builder-tree-item">
        <Checkbox
          id={`report-builder-evidence-${node.evidence.id}-${assessmentId}-${threatId}`}
          label={node.evidence.title}
          description={formatEvidenceSubtitle(node)}
          labelAddon={
            <Badge
              label={checked ? 'Selected' : 'Evidence'}
              variant={checked ? 'success' : 'neutral'}
              size="small"
            />
          }
          checked={checked}
          indeterminate={false}
          onChange={event =>
            onEvidenceChange(node.evidence.id, event.target.checked)
          }
        />
      </li>
    );
  }

  function renderThreatNode(assessment: ReportBuilderHierarchyAssessmentNode) {
    return (node: ReportBuilderHierarchyThreatNode) => {
      const branchState = getThreatSelectionState(
        assessment,
        node,
        selectionState,
      );

      return (
        <li key={node.threat.id} className="report-builder-tree-item">
          <Checkbox
            id={`report-builder-threat-${node.threat.id}`}
            label={node.threat.title}
            description={formatThreatSubtitle(node)}
            labelAddon={
              <Badge
                label={
                  branchState.checked
                    ? 'Selected'
                    : branchState.indeterminate
                      ? 'Partial'
                      : `${node.evidence.length} evidence`
                }
                variant={
                  branchState.checked
                    ? 'success'
                    : branchState.indeterminate
                      ? 'warning'
                      : 'neutral'
                }
                size="small"
              />
            }
            checked={branchState.checked}
            indeterminate={branchState.indeterminate}
            onChange={event =>
              onThreatChange(node.threat.id, event.target.checked)
            }
          />

          <ul className="report-builder-tree-children report-builder-tree-node-subtree">
            {node.evidence.length > 0 ? (
              node.evidence.map(evidenceNode =>
                renderEvidenceNode(
                  assessment.assessment.id,
                  node.threat.id,
                  evidenceNode,
                ),
              )
            ) : (
              <li className="report-builder-tree-empty-node">
                No evidence linked to this threat yet.
              </li>
            )}
          </ul>
        </li>
      );
    };
  }

  function renderAssessmentNode(node: ReportBuilderHierarchyAssessmentNode) {
    const branchState = getAssessmentSelectionState(node, selectionState);
    const { threatCount, evidenceCount } = countAssessmentDescendants(node);

    return (
      <li key={node.assessment.id} className="report-builder-tree-item">
        <Checkbox
          id={`report-builder-assessment-${node.assessment.id}`}
          label={node.assessment.name}
          description={formatAssessmentSubtitle(node)}
          labelAddon={
            <Badge
              label={
                branchState.checked
                  ? 'Selected'
                  : branchState.indeterminate
                    ? 'Partial'
                    : `${threatCount + evidenceCount} descendants`
              }
              variant={
                branchState.checked
                  ? 'success'
                  : branchState.indeterminate
                    ? 'warning'
                    : 'neutral'
              }
              size="small"
            />
          }
          checked={branchState.checked}
          indeterminate={branchState.indeterminate}
          onChange={event =>
            onAssessmentChange(node.assessment.id, event.target.checked)
          }
        />

        <ul className="report-builder-tree-children report-builder-tree-node-subtree">
          {node.threats.length > 0 ? (
            node.threats.map(renderThreatNode(node))
          ) : (
            <li className="report-builder-tree-empty-node">
              No threats in this assessment yet.
            </li>
          )}
        </ul>
      </li>
    );
  }

  return (
    <div className="report-builder-tree-company">
      <p className="report-builder-tree-company-meta">
        {hierarchy.assessments.length} assessments in this company
      </p>

      <ul className="report-builder-tree-list">
        {hierarchy.assessments.map(renderAssessmentNode)}
      </ul>

      <section
        className="report-builder-tree-summary"
        aria-labelledby="report-builder-tree-summary-title"
      >
        <h4
          className="report-builder-tree-summary-title"
          id="report-builder-tree-summary-title"
        >
          Exact selected IDs
        </h4>

        <pre className="report-builder-tree-summary-json">
          {JSON.stringify(
            {
              selectedAssessmentId: exactSelectedAssessmentId,
              selectedThreatIds: exactSelectedThreatIds,
              selectedEvidenceIds: exactSelectedEvidenceIds,
            },
            null,
            2,
          )}
        </pre>
      </section>
    </div>
  );
};

export default ReportBuilderTreeContent;
