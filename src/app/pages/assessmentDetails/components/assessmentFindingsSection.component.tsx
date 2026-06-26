import { useEffect, useRef, useState } from 'react';

import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import EmptyState from '~/app/components/ui/emptyState';
import ThreatDrawer from '~/app/components/appsec/threatDrawer';
import ThreatForm from '~/app/components/appsec/threatForm';
import ThreatTable from '~/app/components/appsec/threatTable';
import { OWASP_TOP_10_CURRENT_VERSION } from '~/domain';

import { threatToTableRow } from '../assessmentDetails.mapper';
import type { AssessmentDetailsAssessment } from '../assessmentDetails.type';
import type { AssessmentFindingsController } from '../hooks/useAssessmentFindings';
import type { ThreatFormValue } from '~/app/components/appsec/threatForm';

export interface AssessmentFindingsInitialEditTarget {
  threatId: string;
  focusField: keyof ThreatFormValue;
}

interface AssessmentFindingsSectionProps extends Pick<
  AssessmentFindingsController,
  | 'threats'
  | 'isLoading'
  | 'loadError'
  | 'drawerMode'
  | 'selectedFinding'
  | 'draftValue'
  | 'fieldErrors'
  | 'formError'
  | 'isSubmitting'
  | 'isDeleting'
  | 'deleteError'
  | 'canEditFindings'
  | 'openCreateFinding'
  | 'openEditFinding'
  | 'openFindingDetails'
  | 'closeFindingDrawer'
  | 'handleFindingChange'
  | 'handleFindingSave'
  | 'handleFindingDelete'
> {
  assessment: AssessmentDetailsAssessment;
  initialEditTarget?: AssessmentFindingsInitialEditTarget;
  onInitialEditTargetHandled?: () => void;
}

const AssessmentFindingsSection = ({
  assessment,
  threats,
  isLoading,
  loadError,
  drawerMode,
  selectedFinding,
  draftValue,
  fieldErrors,
  formError,
  isSubmitting,
  isDeleting,
  deleteError,
  canEditFindings,
  openCreateFinding,
  openEditFinding,
  openFindingDetails,
  closeFindingDrawer,
  handleFindingChange,
  handleFindingSave,
  handleFindingDelete,
  initialEditTarget,
  onInitialEditTargetHandled,
}: AssessmentFindingsSectionProps) => {
  const owaspTaxonomyVersion =
    assessment.owaspTaxonomyVersion ?? OWASP_TOP_10_CURRENT_VERSION;
  const handledTargetRef = useRef<string>();
  const [readinessFocusField] = useState(initialEditTarget?.focusField);

  useEffect(() => {
    if (!initialEditTarget || isLoading) {
      return undefined;
    }

    const targetKey = `${initialEditTarget.threatId}:${initialEditTarget.focusField}`;

    if (handledTargetRef.current === targetKey) {
      return undefined;
    }

    handledTargetRef.current = targetKey;
    const targetThreat = threats.find(
      threat => threat.id === initialEditTarget.threatId,
    );
    const frameId = window.requestAnimationFrame(() => {
      if (targetThreat) {
        if (canEditFindings) {
          openEditFinding(targetThreat);
        } else {
          openFindingDetails(targetThreat);
        }
      }

      onInitialEditTargetHandled?.();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    canEditFindings,
    initialEditTarget,
    isLoading,
    onInitialEditTargetHandled,
    openEditFinding,
    openFindingDetails,
    threats,
  ]);

  const tableEmptyState =
    !isLoading && threats.length === 0 ? (
      <EmptyState
        title="No threats yet"
        description="Add the first threat to start tracking security issues in this assessment."
      />
    ) : undefined;

  const drawerTitle =
    drawerMode === 'create'
      ? 'Create threat'
      : drawerMode === 'edit'
        ? 'Edit threat'
        : 'Threat details';
  const drawerContent =
    drawerMode === 'create' || drawerMode === 'edit' ? (
      <>
        {formError && (
          <Callout variant="error" title="Unable to save threat">
            <p>{formError}</p>
          </Callout>
        )}

        <ThreatForm
          value={draftValue}
          owaspTaxonomyVersion={owaspTaxonomyVersion}
          errors={fieldErrors}
          isSubmitting={isSubmitting}
          focusField={readinessFocusField}
          submitLabel={
            drawerMode === 'create' ? 'Create threat' : 'Save threat'
          }
          onChange={handleFindingChange}
          onSubmit={handleFindingSave}
        />
      </>
    ) : undefined;

  return (
    <>
      <Card
        title="Threats"
        subtitle="Assessment-scoped threats and their current status."
        padding="large"
        actions={
          assessment.status === 'archived' ? undefined : (
            <Button title="Add threat" onClick={openCreateFinding} />
          )
        }
      >
        {loadError ? (
          <Callout variant="error" title="Unable to load threats">
            <p>{loadError}</p>
          </Callout>
        ) : (
          <ThreatTable
            threats={threats.map(threatToTableRow)}
            owaspTaxonomyVersion={owaspTaxonomyVersion}
            isLoading={isLoading}
            emptyState={tableEmptyState}
            onThreatClick={openFindingDetails}
            onEditThreatClick={
              canEditFindings ? threat => openEditFinding(threat) : undefined
            }
          />
        )}
      </Card>

      <ThreatDrawer
        isOpen={drawerMode !== null}
        owaspTaxonomyVersion={owaspTaxonomyVersion}
        title={drawerTitle}
        description={`${assessment.companyName} · ${assessment.applicationName}`}
        threat={
          selectedFinding
            ? {
                ...threatToTableRow(selectedFinding),
                applicationName: assessment.applicationName,
                companyName: assessment.companyName,
              }
            : undefined
        }
        footer={
          deleteError ? (
            <Callout variant="error" title="Unable to delete threat">
              <p>{deleteError}</p>
            </Callout>
          ) : undefined
        }
        onClose={closeFindingDrawer}
        onEdit={
          drawerMode === 'view' && selectedFinding && canEditFindings
            ? () => openEditFinding(selectedFinding)
            : undefined
        }
        onDelete={
          drawerMode === 'view' &&
          selectedFinding &&
          canEditFindings &&
          !isDeleting
            ? handleFindingDelete
            : undefined
        }
        children={drawerContent}
      />
    </>
  );
};

export default AssessmentFindingsSection;
