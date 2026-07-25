import React from 'react';

import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import IconSVG from '~/app/components/ui/iconSVG';
import { DirtyFormGuard, PageActionGroup } from '~/app/components/common';
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
}: AssessmentEvidenceSectionProps) => {
  const showInitialError =
    Boolean(controller.loadError) && !controller.hasLoadedEvidence;
  const showInitialLoading =
    controller.isLoading && !controller.hasLoadedEvidence;

  return (
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

      {showInitialError ? (
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
              <PageActionGroup
                compact
                primaryAction={{
                  id: 'add-assessment-evidence',
                  label: 'Add evidence',
                  icon: <IconSVG name="add" />,
                  dataAttributes: {
                    'data-evidence-add-action': 'true',
                  },
                  onActivate: controller.openCreateEvidence,
                }}
              />
            ) : undefined
          }
        >
          {showInitialLoading ? (
            <div className="assessment-evidence-loading">
              <Callout variant="info" title="Loading evidence">
                <p>Fetching evidence for this assessment.</p>
              </Callout>
            </div>
          ) : (
            <>
              {controller.isRefreshing && (
                <div role="status" aria-live="polite">
                  Refreshing evidence...
                </div>
              )}

              {controller.loadError && (
                <Callout
                  variant="warning"
                  title="Evidence may be out of date"
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
              )}

              <EvidenceList
                evidence={controller.evidence}
                controller={controller}
              />
            </>
          )}
        </Card>
      )}

      <EvidenceDrawer
        assessment={assessment}
        threats={threats}
        controller={controller}
      />
      <DeleteEvidenceModal controller={controller} />
      <DirtyFormGuard
        isBlocked={controller.dirtyFormGuard.isBlocked}
        onCancel={controller.dirtyFormGuard.cancel}
        onProceed={controller.dirtyFormGuard.proceed}
      />
    </StyledAssessmentEvidenceSection>
  );
};

export default AssessmentEvidenceSection;
