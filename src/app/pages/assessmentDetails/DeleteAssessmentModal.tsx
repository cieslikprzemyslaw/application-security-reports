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
    if (!isOpen || controller.isLoadingImpact) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      document
        .getElementById('assessment-permanent-delete-confirmation')
        ?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [controller.isLoadingImpact, isOpen]);

  if (!target) {
    return null;
  }

  const impact = controller.deletionImpact;
  const dependencyCounts = impact
    ? [
        formatCount(impact.threatCount, 'Threat'),
        formatCount(impact.evidenceCount, 'Evidence item', 'Evidence items'),
        formatCount(
          impact.evidenceAttachmentCount,
          'Evidence attachment',
          'Evidence attachments',
        ),
        formatCount(impact.reportCount, 'Report'),
        formatCount(
          impact.reportVersionCount,
          'Report version',
          'Report versions',
        ),
      ]
    : [];

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
            disabled={
              controller.isDeleting ||
              controller.isLoadingImpact ||
              !controller.isConfirmationValid
            }
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

        <div
          className="assessment-details-delete-counts"
          aria-live="polite"
          aria-busy={controller.isLoadingImpact}
        >
          <h3>Dependency counts loaded before confirmation</h3>
          {controller.isLoadingImpact ? (
            <p>Checking dependent records…</p>
          ) : (
            <ul>
              {dependencyCounts.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        {impact?.warnings.map(warning => (
          <Callout key={warning} variant="warning" title="Deletion limitation">
            <p>{warning}</p>
          </Callout>
        ))}

        {controller.impactError && (
          <div role="alert">
            <Callout variant="error" title="Unable to check dependencies">
              <p>{controller.impactError}</p>
            </Callout>
          </div>
        )}

        <Input
          id="assessment-permanent-delete-confirmation"
          label="Type the Assessment name to confirm"
          description={`Enter exactly: ${controller.deleteTargetName}`}
          value={controller.confirmationValue}
          disabled={controller.isDeleting || controller.isLoadingImpact}
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
