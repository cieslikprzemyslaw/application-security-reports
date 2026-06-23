import React, { useState } from 'react';

import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import Checkbox from '~/app/components/ui/checkbox';
import EmptyState from '~/app/components/ui/emptyState';

import StyledReportBuilderTree from './reportBuilderTree.styled';
import {
  getReportBuilderExactSelection,
  toggleReportBuilderAssessmentSelection,
  toggleReportBuilderEvidenceSelection,
  toggleReportBuilderThreatSelection,
  type ReportBuilderSelectionTreeState,
} from './reportBuilderSelectionTree';
import ReportBuilderTreeContent from './reportBuilderTree.content';
import {
  reportBuilderHierarchyLoader,
  type ReportBuilderHierarchy,
} from './reportBuilderTree.service';

import type { ReportBuilderSelection } from '~/domain';

interface ReportBuilderTreeProps {
  companyId: string;
  companyName: string;
  includeEvidence: boolean;
  selection: ReportBuilderSelection;
  selectionState: ReportBuilderSelectionTreeState;
  onSelectionChange: (
    nextState: ReportBuilderSelectionTreeState,
    exactSelection: ReportBuilderSelection,
  ) => void;
  onIncludeEvidenceChange: (includeEvidence: boolean) => void;
  loadHierarchy?: (
    companyId: string,
    signal?: AbortSignal,
  ) => Promise<ReportBuilderHierarchy>;
}

const ReportBuilderTree = ({
  companyId,
  companyName,
  includeEvidence,
  selection,
  selectionState,
  onSelectionChange,
  onIncludeEvidenceChange,
  loadHierarchy = reportBuilderHierarchyLoader,
}: ReportBuilderTreeProps) => {
  const [hierarchy, setHierarchy] = useState<ReportBuilderHierarchy>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  React.useEffect(() => {
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

  const commitSelection = (nextState: ReportBuilderSelectionTreeState) => {
    onSelectionChange(
      nextState,
      getReportBuilderExactSelection(nextState, hierarchy),
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

        <div className="report-builder-tree-configuration">
          <Checkbox
            id="report-builder-include-evidence"
            label="Include selected evidence"
            description="Only explicitly selected Evidence items are included. Changing this setting does not select or clear Evidence."
            checked={includeEvidence}
            onChange={event => onIncludeEvidenceChange(event.target.checked)}
          />
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
          <ReportBuilderTreeContent
            hierarchy={hierarchy}
            selectedEvidenceIds={selection.selectedEvidenceIds}
            selectionState={selectionState}
            onAssessmentChange={(assessmentId, checked) => {
              commitSelection(
                toggleReportBuilderAssessmentSelection(
                  selectionState,
                  assessmentId,
                  checked,
                ),
              );
            }}
            onThreatChange={(threatId, checked) => {
              commitSelection(
                toggleReportBuilderThreatSelection(
                  selectionState,
                  threatId,
                  checked,
                ),
              );
            }}
            onEvidenceChange={(evidenceId, checked) => {
              commitSelection(
                toggleReportBuilderEvidenceSelection(
                  selectionState,
                  evidenceId,
                  checked,
                ),
              );
            }}
          />
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
