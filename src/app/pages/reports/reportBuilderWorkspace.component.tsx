import React from 'react';

import Select from '~/app/components/ui/select';
import type { ReportBrandingMode, ReportBuilderState } from '~/domain';

import StyledReportBuilderWorkspace from './reportBuilderWorkspace.styled';

const sectionTargets = [
  { id: 'report-builder-select-section', label: 'Select content' },
  { id: 'report-builder-configure-section', label: 'Configure report' },
  { id: 'report-builder-branding-section', label: 'Branding' },
  { id: 'report-builder-readiness-section', label: 'Readiness' },
] as const;

interface ReportBuilderWorkspaceProps {
  builderState: ReportBuilderState;
  readinessStatus: string;
  children: React.ReactNode;
  onBrandingModeChange: (mode: ReportBrandingMode) => void;
}

const focusSection = (sectionId: string) => {
  const section = document.getElementById(sectionId);

  if (!section) {
    return;
  }

  const reduceMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  section.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
  });
  section.focus({ preventScroll: true });
};

const readinessLabel = (status: string) => {
  if (status === 'loading') return 'Checking';
  if (status === 'success') return 'Check complete';
  if (status === 'error') return 'Needs attention';
  return 'Not checked';
};

const ReportBuilderWorkspace = ({
  builderState,
  readinessStatus,
  children,
  onBrandingModeChange,
}: ReportBuilderWorkspaceProps) => {
  const selection = builderState.selection;
  const evidenceCount = new Set([
    ...selection.selectedEvidenceIds,
    ...(selection.selectedEvidenceSelections ?? []).map(
      selectionItem => selectionItem.evidenceId,
    ),
  ]).size;
  const counts = [
    {
      label: 'Assessment',
      value: selection.selectedAssessmentId ? 1 : 0,
      target: 'report-builder-select-section',
    },
    {
      label: 'Threats',
      value: selection.selectedThreatIds.length,
      target: 'report-builder-select-section',
    },
    {
      label: 'Evidence',
      value: evidenceCount,
      target: 'report-builder-select-section',
    },
  ];

  return (
    <StyledReportBuilderWorkspace>
      <nav
        className="report-builder-section-navigation"
        aria-label="Report Builder sections"
      >
        {sectionTargets.map(section => (
          <button
            key={section.id}
            type="button"
            onClick={() => focusSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <section
        className="report-builder-progress"
        aria-labelledby="report-builder-progress-heading"
      >
        <div>
          <p className="report-builder-progress-eyebrow">Selection progress</p>
          <h2 id="report-builder-progress-heading">Current report scope</h2>
        </div>

        <div className="report-builder-progress-counts">
          {counts.map(count => (
            <button
              key={count.label}
              type="button"
              aria-label={`${count.value} selected ${count.label.toLowerCase()}. Go to Select content.`}
              onClick={() => focusSection(count.target)}
            >
              <strong>{count.value}</strong>
              <span>{count.label}</span>
            </button>
          ))}
        </div>

        <button
          className="report-builder-progress-readiness"
          type="button"
          onClick={() => focusSection('report-builder-readiness-section')}
        >
          <span>Readiness</span>
          <strong>{readinessLabel(readinessStatus)}</strong>
        </button>
      </section>

      {children}

      <section
        id="report-builder-branding-section"
        className="report-builder-workspace-section"
        tabIndex={-1}
        aria-labelledby="report-builder-branding-heading"
      >
        <div>
          <p className="report-builder-progress-eyebrow">Branding</p>
          <h2 id="report-builder-branding-heading">Report identity</h2>
          <p>
            Choose the existing branding contract used by the generated report.
          </p>
        </div>

        <Select
          id="report-builder-branding-mode"
          label="Branding mode"
          value={builderState.branding.brandingMode}
          options={[
            { value: 'issuer', label: 'Issuer branding' },
            { value: 'client', label: 'Client branding' },
            { value: 'none', label: 'No branding' },
          ]}
          onChange={event =>
            onBrandingModeChange(event.target.value as ReportBrandingMode)
          }
        />
      </section>

      <section
        id="report-builder-readiness-section"
        className="report-builder-workspace-section"
        tabIndex={-1}
        aria-labelledby="report-builder-readiness-heading"
        aria-live="polite"
      >
        <div>
          <p className="report-builder-progress-eyebrow">Readiness</p>
          <h2 id="report-builder-readiness-heading">Validation status</h2>
          <p>
            {readinessLabel(readinessStatus)}. The backend readiness result
            above remains authoritative for save and finalisation actions.
          </p>
        </div>
      </section>
    </StyledReportBuilderWorkspace>
  );
};

export default ReportBuilderWorkspace;
