import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import EmptyState from '~/app/components/ui/emptyState';
import ThreatDrawer from '~/app/components/appsec/threatDrawer';
import ThreatForm from '~/app/components/appsec/threatForm';
import ThreatTable from '~/app/components/appsec/threatTable';

import { threatToTableRow } from '../assessmentDetails.mapper';
import type { AssessmentDetailsAssessment } from '../assessmentDetails.type';
import type { AssessmentFindingsController } from '../hooks/useAssessmentFindings';

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
  | 'canEditFindings'
  | 'openCreateFinding'
  | 'openEditFinding'
  | 'openFindingDetails'
  | 'closeFindingDrawer'
  | 'handleFindingChange'
  | 'handleFindingSave'
> {
  assessment: AssessmentDetailsAssessment;
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
  canEditFindings,
  openCreateFinding,
  openEditFinding,
  openFindingDetails,
  closeFindingDrawer,
  handleFindingChange,
  handleFindingSave,
}: AssessmentFindingsSectionProps) => {
  const tableEmptyState =
    !isLoading && threats.length === 0 ? (
      <EmptyState
        title="No findings yet"
        description="Add the first finding to start tracking security issues in this assessment."
      />
    ) : undefined;

  const drawerTitle =
    drawerMode === 'create'
      ? 'Create finding'
      : drawerMode === 'edit'
        ? 'Edit finding'
        : 'Finding details';

  return (
    <>
      <Card
        title="Findings"
        subtitle="Assessment-scoped findings and their current status."
        padding="large"
        actions={
          assessment.status === 'archived' ? undefined : (
            <Button title="Add finding" onClick={openCreateFinding} />
          )
        }
      >
        {loadError ? (
          <Callout variant="error" title="Unable to load findings">
            <p>{loadError}</p>
          </Callout>
        ) : (
          <ThreatTable
            threats={threats.map(threatToTableRow)}
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
        onClose={closeFindingDrawer}
        onEdit={
          drawerMode === 'view' && selectedFinding && canEditFindings
            ? () => openEditFinding(selectedFinding)
            : undefined
        }
      >
        {drawerMode === 'create' || drawerMode === 'edit' ? (
          <>
            {formError && (
              <Callout variant="error" title="Unable to save finding">
                <p>{formError}</p>
              </Callout>
            )}

            <ThreatForm
              value={draftValue}
              errors={fieldErrors}
              isSubmitting={isSubmitting}
              submitLabel={
                drawerMode === 'create' ? 'Create finding' : 'Save finding'
              }
              onChange={handleFindingChange}
              onSubmit={handleFindingSave}
            />
          </>
        ) : null}
      </ThreatDrawer>
    </>
  );
};

export default AssessmentFindingsSection;
