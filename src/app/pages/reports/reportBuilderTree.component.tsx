import React, { useMemo, useState } from 'react';
import { useInRouterContext, useNavigate } from 'react-router-dom';

import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import Checkbox from '~/app/components/ui/checkbox';
import EmptyState from '~/app/components/ui/emptyState';
import Input from '~/app/components/ui/input';
import { routes } from '~/routes';

import StyledReportBuilderTree from './reportBuilderTree.styled';
import { filterReportBuilderHierarchy } from './reportBuilderTree.filter';
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

import type {
  ReportBuilderConfiguration,
  ReportBuilderSelection,
  ReportReadinessTarget,
} from '~/domain';

interface ReportBuilderTreeProps {
  companyId: string;
  companyName: string;
  includeEvidence: boolean;
  methodology?: string;
  reportStyle?: string;
  selection: ReportBuilderSelection;
  selectionState: ReportBuilderSelectionTreeState;
  lockedAssessmentId?: string;
  focusTarget?: ReportReadinessTarget;
  onSelectionChange: (
    nextState: ReportBuilderSelectionTreeState,
    exactSelection: ReportBuilderSelection,
  ) => void;
  onIncludeEvidenceChange: (includeEvidence: boolean) => void;
  onConfigurationChange?: (patch: Partial<ReportBuilderConfiguration>) => void;
  loadHierarchy?: (
    companyId: string,
    signal?: AbortSignal,
  ) => Promise<ReportBuilderHierarchy>;
}

interface ReportBuilderEmptyStateProps {
  companyId: string;
}

const CreateAssessmentAction = ({
  companyId,
}: ReportBuilderEmptyStateProps) => {
  const navigate = useNavigate();

  return (
    <Button
      title="Create assessment"
      onClick={() => navigate(routes.companyWorkspaceAssessments(companyId))}
    />
  );
};

const ReportBuilderEmptyState = ({
  companyId,
}: ReportBuilderEmptyStateProps) => {
  const isInRouterContext = useInRouterContext();

  return (
    <EmptyState
      variant="first-use"
      title="No assessments yet"
      description="Create the first assessment for this company to populate the report builder tree."
      primaryAction={
        isInRouterContext ? (
          <CreateAssessmentAction companyId={companyId} />
        ) : undefined
      }
    />
  );
};

const ReportBuilderTree = ({
  companyId,
  companyName,
  includeEvidence,
  methodology = '',
  reportStyle = '',
  selectionState,
  lockedAssessmentId,
  focusTarget,
  onSelectionChange,
  onIncludeEvidenceChange,
  onConfigurationChange,
  loadHierarchy = reportBuilderHierarchyLoader,
}: ReportBuilderTreeProps) => {
  const [hierarchy, setHierarchy] = useState<ReportBuilderHierarchy>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredHierarchy = useMemo(
    () => (hierarchy ? filterReportBuilderHierarchy(hierarchy, searchQuery) : undefined),
    [hierarchy, searchQuery],
  );
  const normalizedSearchQuery = searchQuery.trim();

  const commitSelection = (nextState: ReportBuilderSelectionTreeState) => {
    onSelectionChange(
      nextState,
      getReportBuilderExactSelection(nextState, hierarchy),
    );
  };
  const showInitialLoading = isLoading && hierarchy === undefined;
  const showInitialError = loadError && hierarchy === undefined;

  return (
    <StyledReportBuilderTree
      id="report-builder-select-section"
      tabIndex={-1}
      aria-labelledby="report-builder-tree-title"
    >
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
            tabIndex={-1}
          >
            {companyName}
          </h3>

          <p className="report-builder-tree-subtitle">
            Select the assessment, threats, and evidence to include in the
            report draft.
          </p>
        </div>

        <div className="report-builder-tree-filter">
          <Input
            id="report-builder-tree-search"
            label="Search report content"
            description="Filter visible assessments, threats and evidence. Hidden selections remain selected."
            type="search"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
          {normalizedSearchQuery && (
            <Button
              title="Clear search"
              variant="secondary"
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>

        <section
          id="report-builder-configure-section"
          className="report-builder-tree-configuration"
          tabIndex={-1}
          aria-labelledby="report-builder-configuration-heading"
        >
          <div>
            <h3 id="report-builder-configuration-heading">Configure report</h3>
            <p className="report-builder-tree-subtitle">
              Use the existing report configuration fields without changing
              selection state.
            </p>
          </div>

          <div className="report-builder-tree-configuration-grid">
            <Input
              id="report-builder-methodology"
              label="Methodology"
              value={methodology}
              placeholder="OWASP ASVS and WSTG"
              onChange={event =>
                onConfigurationChange?.({ methodology: event.target.value })
              }
            />
            <Input
              id="report-builder-report-style"
              label="Report style"
              value={reportStyle}
              placeholder="Technical assessment"
              onChange={event =>
                onConfigurationChange?.({ reportStyle: event.target.value })
              }
            />
          </div>

          <Checkbox
            id="report-builder-include-evidence"
            label="Include selected evidence"
            description="Only explicitly selected Evidence items are included. Changing this setting does not select or clear Evidence."
            checked={includeEvidence}
            data-readiness-resource-type="report"
            data-readiness-field="selection.evidenceIds"
            onChange={event => onIncludeEvidenceChange(event.target.checked)}
          />
        </section>

        {showInitialLoading ? (
          <div
            className="report-builder-tree-state"
            role="status"
            aria-live="polite"
          >
            <p>Loading company hierarchy…</p>
          </div>
        ) : showInitialError ? (
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
        ) : (
          <>
            {isLoading && (
              <div
                className="report-builder-tree-state"
                role="status"
                aria-live="polite"
              >
                <p>Refreshing company hierarchy…</p>
              </div>
            )}

            {loadError && (
              <Callout
                variant="warning"
                title="Report data may be out of date"
                actions={
                  <Button
                    title="Retry"
                    variant="secondary"
                    onClick={() => setReloadKey(key => key + 1)}
                  />
                }
              >
                <p>{loadError}</p>
              </Callout>
            )}

            {filteredHierarchy?.assessments.length ? (
              <ReportBuilderTreeContent
                key={normalizedSearchQuery.toLocaleLowerCase()}
                hierarchy={filteredHierarchy}
                selectionState={selectionState}
                lockedAssessmentId={lockedAssessmentId}
                focusTarget={focusTarget}
                onAssessmentChange={(assessment, checked) => {
                  commitSelection(
                    toggleReportBuilderAssessmentSelection(
                      selectionState,
                      assessment,
                      checked,
                      lockedAssessmentId,
                    ),
                  );
                }}
                onThreatChange={(assessmentId, threatId, checked) => {
                  commitSelection(
                    toggleReportBuilderThreatSelection(
                      selectionState,
                      assessmentId,
                      threatId,
                      checked,
                      lockedAssessmentId,
                    ),
                  );
                }}
                onEvidenceChange={(
                  assessmentId,
                  threatId,
                  evidenceId,
                  checked,
                ) => {
                  commitSelection(
                    toggleReportBuilderEvidenceSelection(
                      selectionState,
                      assessmentId,
                      threatId,
                      evidenceId,
                      checked,
                      lockedAssessmentId,
                    ),
                  );
                }}
              />
            ) : hierarchy?.assessments.length && normalizedSearchQuery ? (
              <EmptyState
                variant="search"
                title="No matching report content"
                description={`No assessments, threats or evidence match “${normalizedSearchQuery}”.`}
                primaryAction={
                  <Button title="Clear search" onClick={() => setSearchQuery('')} />
                }
              />
            ) : (
              <ReportBuilderEmptyState companyId={companyId} />
            )}
          </>
        )}
      </Card>
    </StyledReportBuilderTree>
  );
};

export default ReportBuilderTree;
