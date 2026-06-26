import { useState } from 'react';

import Badge from '~/app/components/ui/badge';
import Checkbox from '~/app/components/ui/checkbox';
import IconSVG from '~/app/components/ui/iconSVG';

import {
  getAssessmentSelectionState,
  getEvidenceSelectionState,
  getThreatSelectionState,
  type ReportBuilderSelectionTreeState,
} from './reportBuilderSelectionTree';
import type { ReportReadinessTarget } from '~/domain';
import type {
  ReportBuilderHierarchy,
  ReportBuilderHierarchyAssessmentNode,
  ReportBuilderHierarchyEvidenceNode,
  ReportBuilderHierarchyThreatNode,
} from './reportBuilderTree.service';

interface ReportBuilderTreeContentProps {
  hierarchy: ReportBuilderHierarchy;
  selectionState: ReportBuilderSelectionTreeState;
  lockedAssessmentId?: string;
  focusTarget?: ReportReadinessTarget;
  onAssessmentChange: (
    assessment: ReportBuilderHierarchyAssessmentNode,
    checked: boolean,
  ) => void;
  onThreatChange: (
    assessmentId: string,
    threatId: string,
    checked: boolean,
  ) => void;
  onEvidenceChange: (
    assessmentId: string,
    threatId: string,
    evidenceId: string,
    checked: boolean,
  ) => void;
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

const createInitialExpandedAssessmentIds = (
  hierarchy: ReportBuilderHierarchy,
  selectionState: ReportBuilderSelectionTreeState,
): Set<string> => {
  const selectedAssessmentId = selectionState.selectedAssessmentId;

  if (
    selectedAssessmentId &&
    hierarchy.assessments.some(
      node => node.assessment.id === selectedAssessmentId,
    )
  ) {
    return new Set([selectedAssessmentId]);
  }

  const firstAssessmentId = hierarchy.assessments[0]?.assessment.id;

  return firstAssessmentId ? new Set([firstAssessmentId]) : new Set<string>();
};

const getReadinessAssessmentId = (
  hierarchy: ReportBuilderHierarchy,
  focusTarget?: ReportReadinessTarget,
): string | undefined => {
  if (!focusTarget) {
    return undefined;
  }

  if (focusTarget.resourceType === 'assessment') {
    return focusTarget.resourceId;
  }

  return hierarchy.assessments.find(assessment =>
    focusTarget.resourceType === 'threat'
      ? assessment.threats.some(
          threat => threat.threat.id === focusTarget.resourceId,
        )
      : focusTarget.resourceType === 'evidence'
        ? assessment.threats.some(threat =>
            threat.evidence.some(
              evidence => evidence.evidence.id === focusTarget.resourceId,
            ),
          )
        : false,
  )?.assessment.id;
};

const ReportBuilderTreeContent = ({
  hierarchy,
  selectionState,
  lockedAssessmentId,
  focusTarget,
  onAssessmentChange,
  onThreatChange,
  onEvidenceChange,
}: ReportBuilderTreeContentProps) => {
  const [expandedAssessmentIds, setExpandedAssessmentIds] = useState<
    Set<string>
  >(() => createInitialExpandedAssessmentIds(hierarchy, selectionState));
  const readinessAssessmentId = getReadinessAssessmentId(
    hierarchy,
    focusTarget,
  );

  const setAssessmentExpanded = (assessmentId: string, expanded: boolean) => {
    setExpandedAssessmentIds(current => {
      const next = new Set(current);

      if (expanded) {
        next.add(assessmentId);
      } else {
        next.delete(assessmentId);
      }

      return next;
    });
  };

  function renderEvidenceNode(
    assessment: ReportBuilderHierarchyAssessmentNode,
    threat: ReportBuilderHierarchyThreatNode,
    node: ReportBuilderHierarchyEvidenceNode,
  ) {
    const branchState = getEvidenceSelectionState(
      assessment,
      threat,
      node,
      selectionState,
    );

    return (
      <li key={node.evidence.id} className="report-builder-tree-item">
        <Checkbox
          id={`report-builder-evidence-${node.evidence.id}-${assessment.assessment.id}-${threat.threat.id}`}
          label={node.evidence.title}
          description={formatEvidenceSubtitle(node)}
          labelAddon={
            <Badge
              label={branchState.checked ? 'Selected' : 'Evidence'}
              variant={branchState.checked ? 'success' : 'neutral'}
              size="small"
            />
          }
          checked={branchState.checked}
          indeterminate={false}
          data-readiness-resource-type="evidence"
          data-readiness-resource-id={node.evidence.id}
          disabled={
            lockedAssessmentId !== undefined &&
            lockedAssessmentId !== assessment.assessment.id
          }
          onChange={event =>
            onEvidenceChange(
              assessment.assessment.id,
              threat.threat.id,
              node.evidence.id,
              event.target.checked,
            )
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
            data-readiness-resource-type="threat"
            data-readiness-resource-id={node.threat.id}
            disabled={
              lockedAssessmentId !== undefined &&
              lockedAssessmentId !== assessment.assessment.id
            }
            onChange={event =>
              onThreatChange(
                assessment.assessment.id,
                node.threat.id,
                event.target.checked,
              )
            }
          />

          <ul className="report-builder-tree-children report-builder-tree-node-subtree">
            {node.evidence.length > 0 ? (
              node.evidence.map(evidenceNode =>
                renderEvidenceNode(assessment, node, evidenceNode),
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
    const assessmentId = node.assessment.id;
    const branchState = getAssessmentSelectionState(node, selectionState);
    const { threatCount, evidenceCount } = countAssessmentDescendants(node);
    const isExpanded =
      expandedAssessmentIds.has(assessmentId) ||
      readinessAssessmentId === assessmentId;
    const panelId = `report-builder-assessment-panel-${assessmentId}`;

    return (
      <li
        key={assessmentId}
        className="report-builder-tree-item report-builder-tree-assessment"
      >
        <div className="report-builder-tree-assessment-header">
          <div className="report-builder-tree-assessment-selection">
            <Checkbox
              id={`report-builder-assessment-${assessmentId}`}
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
              data-readiness-resource-type="assessment"
              data-readiness-resource-id={assessmentId}
              disabled={lockedAssessmentId !== undefined}
              onChange={event => {
                const checked = event.target.checked;

                if (checked) {
                  setAssessmentExpanded(assessmentId, true);
                }

                onAssessmentChange(node, checked);
              }}
            />
          </div>

          <button
            className="report-builder-tree-assessment-toggle"
            type="button"
            aria-expanded={isExpanded}
            aria-controls={panelId}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.assessment.name}`}
            onClick={() => setAssessmentExpanded(assessmentId, !isExpanded)}
          >
            <IconSVG
              name={isExpanded ? 'chevronUp' : 'chevronDown'}
              size="small"
            />
          </button>
        </div>

        <div
          className="report-builder-tree-assessment-panel"
          id={panelId}
          hidden={!isExpanded}
        >
          <ul className="report-builder-tree-children report-builder-tree-node-subtree">
            {node.threats.length > 0 ? (
              node.threats.map(renderThreatNode(node))
            ) : (
              <li className="report-builder-tree-empty-node">
                No threats in this assessment yet.
              </li>
            )}
          </ul>
        </div>
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
    </div>
  );
};

export default ReportBuilderTreeContent;
