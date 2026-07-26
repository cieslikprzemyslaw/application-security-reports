import { useEffect, useRef, useState } from 'react';

import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import EmptyState from '~/app/components/ui/emptyState';
import ThreatDrawer from '~/app/components/appsec/threatDrawer';
import ThreatForm from '~/app/components/appsec/threatForm';
import ThreatTable from '~/app/components/appsec/threatTable';
import { DirtyFormGuard, PageActionGroup } from '~/app/components/common';
import IconSVG from '~/app/components/ui/iconSVG';
import { CWE_CATALOG_CURRENT_VERSION } from '~/domain';

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
  | 'isRefreshing'
  | 'hasLoadedFindings'
  | 'loadError'
  | 'drawerMode'
  | 'selectedFinding'
  | 'draftValue'
  | 'fieldErrors'
  | 'formError'
  | 'isSubmitting'
  | 'isDeleting'
  | 'deleteError'
  | 'pendingReviewAction'
  | 'reviewError'
  | 'canEditFindings'
  | 'reloadFindings'
  | 'openCreateFinding'
  | 'openEditFinding'
  | 'openFindingDetails'
  | 'closeFindingDrawer'
  | 'handleFindingChange'
  | 'handleFindingSave'
  | 'handleFindingDelete'
  | 'handleReviewAction'
  | 'dirtyFormGuard'
> {
  assessment: AssessmentDetailsAssessment;
  initialEditTarget?: AssessmentFindingsInitialEditTarget;
  onInitialEditTargetHandled?: () => void;
}

const AssessmentFindingsSection = ({
  assessment,
  threats,
  isLoading,
  isRefreshing,
  hasLoadedFindings,
  loadError,
  drawerMode,
  selectedFinding,
  draftValue,
  fieldErrors,
  formError,
  isSubmitting,
  isDeleting,
  deleteError,
  pendingReviewAction,
  reviewError,
  canEditFindings,
  reloadFindings,
  openCreateFinding,
  openEditFinding,
  openFindingDetails,
  closeFindingDrawer,
  handleFindingChange,
  handleFindingSave,
  handleFindingDelete,
  handleReviewAction,
  dirtyFormGuard,
  initialEditTarget,
  onInitialEditTargetHandled,
}: AssessmentFindingsSectionProps) => {
  const { owaspTaxonomyVersion } = assessment;
  const cweCatalogVersion =
    assessment.cweCatalogVersion ?? CWE_CATALOG_CURRENT_VERSION;
  const handledTargetRef = useRef<string>();
  const [readinessFocusTarget, setReadinessFocusTarget] =
    useState(initialEditTarget);

  useEffect(() => {
    if (!initialEditTarget || isLoading || !hasLoadedFindings) {
      return;
    }

    const targetKey = `${initialEditTarget.threatId}:${initialEditTarget.focusField}`;

    if (handledTargetRef.current === targetKey) {
      return;
    }

    const targetThreat = threats.find(
      threat => threat.id === initialEditTarget.threatId,
    );

    handledTargetRef.current = targetKey;

    if (!targetThreat) {
      onInitialEditTargetHandled?.();
      return;
    }

    if (canEditFindings) {
      openEditFinding(targetThreat);
    } else {
      openFindingDetails(targetThreat);
    }

    window.setTimeout(() => {
      onInitialEditTargetHandled?.();
    }, 0);
  }, [
    canEditFindings,
    hasLoadedFindings,
    initialEditTarget,
    isLoading,
    onInitialEditTargetHandled,
    openEditFinding,
    openFindingDetails,
    threats,
  ]);

  const tableEmptyState =
    hasLoadedFindings && threats.length === 0 ? (
      <EmptyState
        variant={canEditFindings ? 'first-use' : 'unavailable'}
        title={canEditFindings ? 'No threats yet' : 'No threats available'}
        description={
          canEditFindings
            ? 'Add the first threat to start tracking security issues in this assessment.'
            : 'This archived assessment is read-only and has no recorded threats.'
        }
        primaryAction={
          canEditFindings ? (
            <Button title="Add threat" onClick={openCreateFinding} />
          ) : undefined
        }
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
          cweCatalogVersion={cweCatalogVersion}
          errors={fieldErrors}
          isSubmitting={isSubmitting}
          focusField={
            selectedFinding?.id === readinessFocusTarget?.threatId
              ? readinessFocusTarget.focusField
              : undefined
          }
          submitLabel={
            drawerMode === 'create' ? 'Create threat' : 'Save threat'
          }
          onChange={handleFindingChange}
          onSubmit={handleFindingSave}
        />
      </>
    ) : undefined;
  const showInitialError = Boolean(loadError && !hasLoadedFindings);
  const handleDrawerClose = () => {
    setReadinessFocusTarget(undefined);
    closeFindingDrawer();
  };

  return (
    <>
      <Card
        title="Threats"
        subtitle="Assessment-scoped threats and their current status."
        padding="large"
        actions={
          assessment.status === 'archived' ? undefined : (
            <PageActionGroup
              compact
              primaryAction={{
                id: 'add-assessment-threat',
                label: 'Add threat',
                icon: <IconSVG name="add" />,
                dataAttributes: {
                  'data-threat-delete-success-focus': 'true',
                },
                onActivate: openCreateFinding,
              }}
            />
          )
        }
      >
        {showInitialError ? (
          <Callout
            variant="error"
            title="Unable to load threats"
            actions={
              <Button
                title="Retry"
                variant="secondary"
                onClick={reloadFindings}
              />
            }
          >
            <p>{loadError}</p>
          </Callout>
        ) : (
          <>
            {isRefreshing && (
              <div role="status" aria-live="polite">
                Refreshing threats...
              </div>
            )}

            {loadError && (
              <Callout
                variant="warning"
                title="Threats may be out of date"
                actions={
                  <Button
                    title="Retry"
                    variant="secondary"
                    onClick={reloadFindings}
                  />
                }
              >
                <p>{loadError}</p>
              </Callout>
            )}

            {deleteError && drawerMode === null ? (
              <Callout variant="error" title="Unable to delete threat">
                <p>{deleteError}</p>
              </Callout>
            ) : null}

            <ThreatTable
              threats={threats.map(threatToTableRow)}
              owaspTaxonomyVersion={owaspTaxonomyVersion}
              isLoading={isLoading && !hasLoadedFindings}
              emptyState={tableEmptyState}
              onThreatClick={openFindingDetails}
              onEditThreatClick={
                canEditFindings ? threat => openEditFinding(threat) : undefined
              }
              onDeleteThreatClick={
                canEditFindings
                  ? threat => {
                      void handleFindingDelete(threat);
                    }
                  : undefined
              }
            />
          </>
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
          drawerMode === 'view' && selectedFinding ? (
            <div>
              {reviewError && (
                <Callout variant="error" title="Unable to update review state">
                  <p>{reviewError}</p>
                </Callout>
              )}
              {deleteError && (
                <Callout variant="error" title="Unable to delete threat">
                  <p>{deleteError}</p>
                </Callout>
              )}
              {canEditFindings &&
                selectedFinding.reviewActions?.map(action => (
                  <div key={action.command}>
                    <Button
                      title={action.label}
                      variant={
                        action.command === 'request-changes'
                          ? 'secondary'
                          : 'primary'
                      }
                      disabled={!action.allowed || Boolean(pendingReviewAction)}
                      isLoading={pendingReviewAction === action.command}
                      onClick={() => {
                        void handleReviewAction(action.command);
                      }}
                    />
                    {!action.allowed && action.reason && <p>{action.reason}</p>}
                  </div>
                ))}
            </div>
          ) : deleteError ? (
            <Callout variant="error" title="Unable to delete threat">
              <p>{deleteError}</p>
            </Callout>
          ) : undefined
        }
        onClose={handleDrawerClose}
        onEdit={
          drawerMode === 'view' && selectedFinding && canEditFindings
            ? () => {
                setReadinessFocusTarget(undefined);
                openEditFinding(selectedFinding);
              }
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
      <DirtyFormGuard
        isBlocked={dirtyFormGuard.isBlocked}
        onCancel={dirtyFormGuard.cancel}
        onProceed={dirtyFormGuard.proceed}
      />
    </>
  );
};

export default AssessmentFindingsSection;
