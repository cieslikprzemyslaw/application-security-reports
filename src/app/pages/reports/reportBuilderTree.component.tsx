import React, { useEffect, useMemo, useState } from 'react';

import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import EmptyState from '~/app/components/ui/emptyState';
import Badge from '~/app/components/ui/badge';

import StyledReportBuilderTree from './reportBuilderTree.styled';
import {
  reportBuilderHierarchyLoader,
  type ReportBuilderHierarchy,
  type ReportBuilderHierarchyAssessmentNode,
  type ReportBuilderHierarchyThreatNode,
  type ReportBuilderHierarchyEvidenceNode,
} from './reportBuilderTree.service';

type SelectionHandler = (id: string) => void;

interface ReportBuilderTreeProps {
  companyId: string;
  companyName: string;
  selectedAssessmentId?: string;
  selectedThreatIds: string[];
  selectedEvidenceIds: string[];
  onAssessmentSelect: SelectionHandler;
  onThreatToggle: (threatId: string, selected: boolean) => void;
  onEvidenceToggle: (evidenceId: string, selected: boolean) => void;
  loadHierarchy?: (
    companyId: string,
    signal?: AbortSignal,
  ) => Promise<ReportBuilderHierarchy>;
}

const formatAssessmentSubtitle = (
  assessment: ReportBuilderHierarchyAssessmentNode,
) =>
  assessment.assessment.applicationName ??
  assessment.assessment.type ??
  assessment.assessment.description;

const formatThreatSubtitle = (threat: ReportBuilderHierarchyThreatNode) =>
  threat.threat.severity.charAt(0).toUpperCase() +
  threat.threat.severity.slice(1);

const formatEvidenceSubtitle = (evidence: ReportBuilderHierarchyEvidenceNode) =>
  evidence.evidence.type.toUpperCase();

const ReportBuilderTree = ({
  companyId,
  companyName,
  selectedAssessmentId,
  selectedThreatIds,
  selectedEvidenceIds,
  onAssessmentSelect,
  onThreatToggle,
  onEvidenceToggle,
  loadHierarchy = reportBuilderHierarchyLoader,
}: ReportBuilderTreeProps) => {
  const [hierarchy, setHierarchy] = useState<ReportBuilderHierarchy>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadTree = async () => {
      setIsLoading(true);
      setLoadError(undefined);

      try {
        const nextHierarchy = await loadHierarchy(companyId, controller.signal);

        if (isActive) {
          setHierarchy(nextHierarchy);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        setHierarchy(undefined);
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load the report builder hierarchy.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadTree();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [companyId, loadHierarchy, reloadKey]);

  const selectedThreatIdSet = useMemo(
    () => new Set(selectedThreatIds),
    [selectedThreatIds],
  );
  const selectedEvidenceIdSet = useMemo(
    () => new Set(selectedEvidenceIds),
    [selectedEvidenceIds],
  );

  const renderAssessmentNode = (node: ReportBuilderHierarchyAssessmentNode) => {
    const isSelected = selectedAssessmentId === node.assessment.id;

    return (
      <li key={node.assessment.id} className="report-builder-tree-item">
        <button
          className={[
            'report-builder-tree-node-button',
            isSelected ? 'report-builder-tree-node-button--selected' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          type="button"
          aria-pressed={isSelected}
          onClick={() => onAssessmentSelect(node.assessment.id)}
        >
          <span className="report-builder-tree-node-copy">
            <span className="report-builder-tree-node-title">
              {node.assessment.name}
            </span>

            <span className="report-builder-tree-node-meta">
              {formatAssessmentSubtitle(node)}
            </span>
          </span>

          <span className="report-builder-tree-node-state">
            {isSelected ? 'Selected assessment' : 'Assessment'}
          </span>
        </button>

        <ul className="report-builder-tree-children report-builder-tree-node-subtree">
          {node.threats.length > 0 ? (
            node.threats.map(renderThreatNode)
          ) : (
            <li className="report-builder-tree-empty-node">
              No threats in this assessment yet.
            </li>
          )}
        </ul>
      </li>
    );
  };

  const renderThreatNode = (node: ReportBuilderHierarchyThreatNode) => {
    const isSelected = selectedThreatIdSet.has(node.threat.id);

    return (
      <li key={node.threat.id} className="report-builder-tree-item">
        <button
          className={[
            'report-builder-tree-node-button',
            isSelected ? 'report-builder-tree-node-button--selected' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          type="button"
          aria-pressed={isSelected}
          onClick={() => onThreatToggle(node.threat.id, !isSelected)}
        >
          <span className="report-builder-tree-node-copy">
            <span className="report-builder-tree-node-title">
              {node.threat.title}
            </span>

            <span className="report-builder-tree-node-meta">
              {formatThreatSubtitle(node)}
            </span>
          </span>

          <Badge
            label={isSelected ? 'Selected' : `${node.evidence.length} evidence`}
            variant={isSelected ? 'success' : 'neutral'}
            size="small"
          />
        </button>

        <ul className="report-builder-tree-children report-builder-tree-node-subtree">
          {node.evidence.length > 0 ? (
            node.evidence.map(renderEvidenceNode)
          ) : (
            <li className="report-builder-tree-empty-node">
              No evidence linked to this threat yet.
            </li>
          )}
        </ul>
      </li>
    );
  };

  const renderEvidenceNode = (node: ReportBuilderHierarchyEvidenceNode) => {
    const isSelected = selectedEvidenceIdSet.has(node.evidence.id);

    return (
      <li key={node.evidence.id} className="report-builder-tree-item">
        <button
          className={[
            'report-builder-tree-node-button',
            isSelected ? 'report-builder-tree-node-button--selected' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          type="button"
          aria-pressed={isSelected}
          onClick={() => onEvidenceToggle(node.evidence.id, !isSelected)}
        >
          <span className="report-builder-tree-node-copy">
            <span className="report-builder-tree-node-title">
              {node.evidence.title}
            </span>

            <span className="report-builder-tree-node-meta">
              {formatEvidenceSubtitle(node)}
            </span>
          </span>

          <span className="report-builder-tree-node-state">
            {isSelected ? 'Selected evidence' : 'Evidence'}
          </span>
        </button>
      </li>
    );
  };

  return (
    <StyledReportBuilderTree aria-labelledby="report-builder-tree-title">
      <Card
        title="Selection tree"
        subtitle="Company, assessment, threat, and evidence selection for the active report builder state."
        padding="large"
      >
        <div className="report-builder-tree-header">
          <p className="report-builder-tree-eyebrow">Company scope</p>

          <h3
            className="report-builder-tree-title"
            id="report-builder-tree-title"
          >
            {companyName}
          </h3>

          <p className="report-builder-tree-subtitle">
            Select the assessment, threats, and evidence to include in the
            report draft.
          </p>
        </div>

        {isLoading ? (
          <div
            className="report-builder-tree-state"
            role="status"
            aria-live="polite"
          >
            <p>Loading company hierarchy…</p>
          </div>
        ) : loadError ? (
          <Callout variant="error" title="Unable to load hierarchy">
            <p>{loadError}</p>

            <div className="report-builder-tree-error-actions">
              <Button
                title="Retry"
                variant="secondary"
                onClick={() => setReloadKey(key => key + 1)}
              />
            </div>
          </Callout>
        ) : hierarchy?.assessments.length ? (
          <div className="report-builder-tree-company">
            <p className="report-builder-tree-company-meta">
              {hierarchy.assessments.length} assessments in this company
            </p>

            <ul className="report-builder-tree-list">
              {hierarchy.assessments.map(renderAssessmentNode)}
            </ul>
          </div>
        ) : (
          <EmptyState
            variant="first-use"
            title="No assessments yet"
            description="Create the first assessment for this company to populate the report builder tree."
          />
        )}
      </Card>
    </StyledReportBuilderTree>
  );
};

export default ReportBuilderTree;
