import React from 'react';

import Badge from '~/app/components/ui/badge';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Drawer from '~/app/components/ui/drawer';
import type { Threat } from '~/domain';

import type { AssessmentDetailsAssessment } from '../../assessmentDetails.type';
import EvidenceForm from '../form/EvidenceForm';
import type { AssessmentEvidenceController } from '../hooks/useAssessmentEvidence';
import EvidenceDetailView from './EvidenceDetailView';
import { getEvidenceTypeLabel } from './EvidenceSection.utils';

interface EvidenceDrawerProps {
  assessment: AssessmentDetailsAssessment;
  threats: Threat[];
  controller: AssessmentEvidenceController;
}

const EvidenceDrawer = ({
  assessment,
  threats,
  controller,
}: EvidenceDrawerProps) => {
  const detailTitle =
    controller.drawerMode === 'create'
      ? 'Create evidence'
      : controller.drawerMode === 'edit'
        ? 'Edit evidence'
        : (controller.selectedEvidence?.title ?? 'Evidence details');

  return (
    <Drawer
      isOpen={controller.drawerMode !== null}
      title={detailTitle}
      description={`${assessment.companyName} · ${assessment.applicationName}`}
      closeLabel="Close evidence details"
      onClose={controller.closeEvidenceDrawer}
      size="large"
    >
      {controller.drawerMode === 'create' ||
      controller.drawerMode === 'edit' ? (
        <EvidenceForm
          value={controller.draftValue}
          threats={threats}
          errors={controller.fieldErrors}
          formError={controller.formError}
          isSubmitting={controller.isSubmitting}
          submitLabel={
            controller.drawerMode === 'create'
              ? 'Create evidence'
              : 'Save evidence'
          }
          onChange={controller.handleEvidenceChange}
          onSubmit={controller.handleEvidenceSave}
          onCancel={controller.closeEvidenceDrawer}
        />
      ) : controller.selectedEvidenceLoading ? (
        <Callout variant="info" title="Loading evidence">
          <p>Loading the latest evidence details.</p>
        </Callout>
      ) : controller.selectedEvidenceLoadError ? (
        <Callout
          variant={
            controller.selectedEvidenceLoadError.includes('not found')
              ? 'warning'
              : 'error'
          }
          title={
            controller.selectedEvidenceLoadError.includes('not found')
              ? 'Evidence not found'
              : 'Unable to load evidence'
          }
          actions={
            <>
              <Button
                title="Retry"
                variant="secondary"
                onClick={controller.retrySelectedEvidenceLoad}
              />
              <Button
                title="Close"
                variant="secondary"
                onClick={controller.closeEvidenceDrawer}
              />
            </>
          }
        >
          <p>{controller.selectedEvidenceLoadError}</p>
        </Callout>
      ) : controller.selectedEvidence ? (
        <div className="assessment-evidence-detail-panel">
          <div className="assessment-evidence-card-meta">
            <Badge
              label={getEvidenceTypeLabel(controller.selectedEvidence.type)}
              variant="info"
              size="small"
            />
            <Badge
              label={`${controller.selectedEvidence.threatIds.length} linked threat${controller.selectedEvidence.threatIds.length === 1 ? '' : 's'}`}
              variant="neutral"
              size="small"
            />
          </div>

          <EvidenceDetailView
            evidence={controller.selectedEvidence}
            threats={threats}
            controller={controller}
          />

          <div className="assessment-evidence-card-actions">
            {controller.canEditEvidence && (
              <Button
                title="Edit evidence"
                onClick={() =>
                  controller.openEditEvidence(controller.selectedEvidence)
                }
              />
            )}

            {controller.canEditEvidence && (
              <Button
                title="Delete evidence"
                variant="destructive"
                onClick={event =>
                  controller.requestDeleteEvidence(
                    controller.selectedEvidence,
                    event.currentTarget,
                  )
                }
              />
            )}
          </div>
        </div>
      ) : null}
    </Drawer>
  );
};

export default EvidenceDrawer;
