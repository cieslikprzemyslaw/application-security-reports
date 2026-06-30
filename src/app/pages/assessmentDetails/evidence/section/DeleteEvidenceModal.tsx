import React from 'react';

import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Modal from '~/app/components/ui/modal';

import type { AssessmentEvidenceController } from '../hooks/useAssessmentEvidence';

const DeleteEvidenceModal = ({
  controller,
}: {
  controller: AssessmentEvidenceController;
}) => {
  const evidenceTitle = controller.deleteTarget?.title ?? 'this evidence';

  return (
    <Modal
      isOpen={controller.deleteTarget !== undefined}
      title="Delete evidence"
      description={`Confirm deletion of ${evidenceTitle}.`}
      closeLabel="Close delete confirmation"
      onClose={controller.cancelDeleteEvidence}
      footer={
        <>
          <Button
            title="Cancel"
            variant="secondary"
            disabled={controller.isDeleting}
            onClick={controller.cancelDeleteEvidence}
          />
          <Button
            title={controller.isDeleting ? 'Deleting' : 'Delete evidence'}
            variant="destructive"
            isLoading={controller.isDeleting}
            disabled={controller.isDeleting}
            onClick={() => void controller.confirmDeleteEvidence()}
          />
        </>
      }
    >
      <div className="assessment-evidence-detail-panel">
        <Callout variant="warning" title="Delete the current evidence record">
          <p>
            <strong>{evidenceTitle}</strong> will be deleted from this
            assessment. Retained immutable report snapshot data will not change,
            but an attachment referenced by an older retained report may become
            unavailable.
          </p>
        </Callout>

        {controller.deleteError && (
          <div role="alert">
            <Callout variant="error" title="Unable to delete evidence">
              <p>{controller.deleteError}</p>
            </Callout>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DeleteEvidenceModal;
