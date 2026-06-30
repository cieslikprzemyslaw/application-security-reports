import React from 'react';

import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import type { Threat } from '~/domain';

import type { AssessmentDetailsAssessment } from '../../assessmentDetails.type';
import type { AssessmentEvidenceController } from '../hooks/useAssessmentEvidence';
import DeleteEvidenceModal from './DeleteEvidenceModal';
import EvidenceDrawer from './EvidenceDrawer';
import EvidenceList from './EvidenceList';
import StyledAssessmentEvidenceSection from './EvidenceSection.styles';

interface AssessmentEvidenceSectionProps {
  assessment: AssessmentDetailsAssessment;
  threats: Threat[];
  controller: AssessmentEvidenceController;
}

const AssessmentEvidenceSection = ({
  assessment,
  threats,
  controller,
}: AssessmentEvidenceSectionProps) => (
  <StyledAssessmentEvidenceSection>
    {controller.statusMessage && (
      <div className="assessment-evidence-status">
        <Callout
          variant="success"
          title={
            controller.statusMessage.includes('deleted')
              ? 'Evidence deleted'
              : 'Evidence saved'
          }
        >
          <p>{controller.statusMessage}</p>
        </Callout>
      </div>
    )}

    {controller.downloadError && (
      <Callout variant="error" title="Unable to download attachment">
        <p>{controller.downloadError}</p>
      </Callout>
    )}

    {controller.loadError ? (
      <Callout
        variant="error"
        title="Unable to load evidence"
        actions={
          <Button
            title="Retry"
            variant="secondary"
            onClick={controller.reloadEvidence}
          />
        }
      >
        <p>{controller.loadError}</p>
      </Callout>
    ) : (
      <Card
        title="Evidence"
        subtitle="Structured evidence scoped to the current assessment."
        padding="large"
        actions={
          controller.canEditEvidence ? (
            <Button
              title="Add evidence"
              data-evidence-add-action="true"
              onClick={controller.openCreateEvidence}
            />
          ) : undefined
        }
      >
        {controller.isLoading && controller.evidence.length === 0 ? (
          <div className="assessment-evidence-loading">
            <Callout variant="info" title="Loading evidence">
              <p>Fetching evidence for this assessment.</p>
            </Callout>
          </div>
        ) : (
          <EvidenceList
            evidence={controller.evidence}
            controller={controller}
          />
        )}
      </Card>
    )}

    <EvidenceDrawer
      assessment={assessment}
      threats={threats}
      controller={controller}
    />
    <DeleteEvidenceModal controller={controller} />
  </StyledAssessmentEvidenceSection>
);

export default AssessmentEvidenceSection;
