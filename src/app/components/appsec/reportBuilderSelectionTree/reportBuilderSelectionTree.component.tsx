import React from 'react';

import Badge from '~/app/components/ui/badge';
import Checkbox from '~/app/components/ui/checkbox';

import StyledReportBuilderSelectionTree from './reportBuilderSelectionTree.styled';

import type { ReportBuilderSelectionTreeProps } from './reportBuilderSelectionTree.type';

const formatSeverityLabel = (severity: string) =>
  severity.charAt(0).toUpperCase() + severity.slice(1);

const ReportBuilderSelectionTree = ({
  assessmentTitle,
  includeEvidence,
  selectedThreatIds,
  selectedEvidenceIds,
  threats,
  onIncludeEvidenceChange,
  onThreatToggle,
  onEvidenceToggle,
}: ReportBuilderSelectionTreeProps) => (
  <StyledReportBuilderSelectionTree>
    <div className="report-builder-selection-tree-intro">
      <p className="report-builder-selection-tree-eyebrow">Selection</p>

      <h2 className="report-builder-selection-tree-title">
        Assessment, threat, and evidence selection
      </h2>

      <p className="report-builder-selection-tree-copy">
        Select the exact threats and evidence items that should be included in
        the report payload. Turning on evidence visibility does not select
        anything automatically.
      </p>
    </div>

    <div className="report-builder-selection-tree-control">
      <Checkbox
        id="report-builder-include-evidence"
        label="Include evidence"
        description="Show evidence rows without auto-selecting them."
        checked={includeEvidence}
        onChange={event => onIncludeEvidenceChange(event.target.checked)}
      />
    </div>

    <section
      className="report-builder-selection-tree-assessment"
      aria-labelledby="report-builder-selection-tree-assessment-title"
    >
      <div className="report-builder-selection-tree-assessment-header">
        <p className="report-builder-selection-tree-assessment-label">
          Assessment
        </p>

        <h3
          id="report-builder-selection-tree-assessment-title"
          className="report-builder-selection-tree-assessment-title"
        >
          {assessmentTitle}
        </h3>
      </div>

      {threats.length > 0 ? (
        <ul className="report-builder-selection-tree-threat-list">
          {threats.map(threat => {
            const isThreatChecked = selectedThreatIds.includes(threat.id);
            const selectedThreatEvidenceIds = threat.evidence.filter(item =>
              selectedEvidenceIds.includes(item.id),
            );
            const isThreatIndeterminate =
              selectedThreatEvidenceIds.length > 0 &&
              selectedThreatEvidenceIds.length < threat.evidence.length;
            const threatBadgeLabel =
              selectedThreatEvidenceIds.length > 0
                ? `${selectedThreatEvidenceIds.length}/${threat.evidence.length} evidence`
                : 'Threat';

            return (
              <li
                key={threat.id}
                className="report-builder-selection-tree-threat-item"
              >
                <Checkbox
                  id={`report-builder-threat-${threat.id}`}
                  className="report-builder-selection-tree-threat-checkbox"
                  label={`${threat.title} · ${formatSeverityLabel(
                    threat.severity,
                  )}`}
                  labelAddon={
                    <Badge
                      label={isThreatChecked ? 'Selected' : threatBadgeLabel}
                      variant={isThreatChecked ? 'success' : 'neutral'}
                      size="small"
                    />
                  }
                  checked={isThreatChecked}
                  indeterminate={isThreatIndeterminate}
                  onChange={event =>
                    onThreatToggle(threat.id, event.target.checked)
                  }
                />

                {includeEvidence && threat.evidence.length > 0 ? (
                  <ul className="report-builder-selection-tree-evidence-list">
                    {threat.evidence.map(evidence => {
                      const isEvidenceChecked = selectedEvidenceIds.includes(
                        evidence.id,
                      );

                      return (
                        <li
                          key={evidence.id}
                          className="report-builder-selection-tree-evidence-item"
                        >
                          <Checkbox
                            id={`report-builder-evidence-${evidence.id}`}
                            label={evidence.title}
                            description={evidence.description}
                            labelAddon={
                              <Badge
                                label={
                                  isEvidenceChecked ? 'Selected' : 'Evidence'
                                }
                                variant={
                                  isEvidenceChecked ? 'success' : 'neutral'
                                }
                                size="small"
                              />
                            }
                            checked={isEvidenceChecked}
                            onChange={event =>
                              onEvidenceToggle(
                                evidence.id,
                                event.target.checked,
                              )
                            }
                          />
                        </li>
                      );
                    })}
                  </ul>
                ) : includeEvidence ? (
                  <p className="report-builder-selection-tree-empty">
                    No evidence items are linked to this threat.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="report-builder-selection-tree-empty">
          No threats are available for this assessment yet.
        </p>
      )}
    </section>
  </StyledReportBuilderSelectionTree>
);

export default ReportBuilderSelectionTree;
