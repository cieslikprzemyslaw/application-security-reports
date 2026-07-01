import React, { useEffect } from 'react';

import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Input from '~/app/components/ui/input';
import Modal from '~/app/components/ui/modal';

import type { PermanentAssessmentDeletionController } from './hooks/usePermanentAssessmentDeletion';

const formatCount = (
  count: number,
  singular: string,
  plural = `${singular}s`,
) => `${count} ${count === 1 ? singular : plural}`;

const DeleteAssessmentModal = ({
  controller,
}: {
  controller: PermanentAssessmentDeletionController;
}) => {
  const target = controller.deleteTarget;
  const isOpen = target !== undefined;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      document
        .getElementById('assessment-permanent-delete-confirmation')
        ?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  if (!target) {
    return null;
  }

  const dependencyCounts = [
    formatCount(target.findingsCount, 'Threat'),
    formatCount(target.evidenceCount, 'Evidence item', 'Evidence items'),
    formatCount(target.reportVersionCount, 'Report version', 'Report versions'),
  ];

  return (
    <Modal
      isOpen={isOpen}
      title="Permanently delete Assessment"
      description="This destructive action is different from Archive and cannot be undone."
      closeLabel="Close permanent delete confirmation"
      onClose={controller.cancelPermanentDelete}
      size="medium"
      footer={
        <>
          <Button
            title="Cancel"
            variant="secondary"
            disabled={controller.isDeleting}
            onClick={controller.cancelPermanentDelete}
          />
          <Button
            title={controller.isDeleting ? 'Deleting' : 'Permanent delete'}
            variant="destructive"
            isLoading={controller.isDeleting}
            disabled={controller.isDeleting || !controller.isConfirmationValid}
            data-assessment-permanent-delete-confirm="true"
            onClick={() => void controller.confirmPermanentDelete()}
          />
        </>
      }
    >
      <div className="assessment-details-delete-confirmation">
        <Callout variant="warning" title="Permanent delete is irreversible">
          <p>
            <strong>{controller.deleteTargetName}</strong> is archived now. Use
            Permanent delete only when this Assessment and its dependent records
            should be removed from the workspace instead of restored later.
          </p>
        </Callout>

        <div className="assessment-details-delete-counts" aria-live="polite">
          <h3>Dependency counts loaded before confirmation</h3>
          <ul>
            {dependencyCounts.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <Input
          id="assessment-permanent-delete-confirmation"
          label="Type the Assessment name to confirm"
          description={`Enter exactly: ${controller.deleteTargetName}`}
          value={controller.confirmationValue}
          disabled={controller.isDeleting}
          autoComplete="off"
          data-modal-autofocus="true"
          onChange={event =>
            controller.setConfirmationValue(event.target.value)
          }
        />

        {controller.deleteError && (
          <div role="alert">
            <Callout variant="error" title="Unable to delete Assessment">
              <p>{controller.deleteError}</p>
            </Callout>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DeleteAssessmentModal;
