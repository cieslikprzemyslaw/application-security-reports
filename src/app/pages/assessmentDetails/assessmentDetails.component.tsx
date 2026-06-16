import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ThreatDrawer from '~/app/components/appsec/threatDrawer';
import ThreatForm from '~/app/components/appsec/threatForm';
import ThreatTable from '~/app/components/appsec/threatTable';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Card from '~/app/components/ui/card';
import EmptyState from '~/app/components/ui/emptyState';
import {
  EntityNotFoundView,
  RouteLoadingView,
} from '~/app/components/routeStateViews';
import { assessmentService, threatService } from '~/services';
import { ApiError } from '~/services/apiClient';
import { routes } from '~/routes';

import AssessmentDetailsView from './assessmentDetails.view';

import type {
  AssessmentDetailAction,
  AssessmentDetailSection,
  AssessmentDetailsAssessment,
} from './assessmentDetails.type';
import type { AssessmentWorkspaceOverview } from '~/services/assessmentService';
import type { Threat } from '~/domain';
import type { ThreatFormValue } from '~/app/components/appsec/threatForm';
import type { ThreatTableRow } from '~/app/components/appsec/threatTable';

interface AssessmentDetailsRouteProps {
  activeSection: AssessmentDetailSection;
}

type FindingDrawerMode = 'view' | 'create' | 'edit' | null;

const sectionHrefMap: Record<
  AssessmentDetailSection,
  (companyId: string, assessmentId: string) => string
> = {
  overview: routes.assessmentDetailsOverview,
  findings: routes.assessmentDetailsFindings,
  evidence: routes.assessmentDetailsEvidence,
  reports: routes.assessmentDetailsReports,
  history: routes.assessmentDetailsHistory,
};

const toAssessmentViewModel = (
  overview: AssessmentWorkspaceOverview,
): AssessmentDetailsAssessment => ({
  ...overview.assessment,
  companyName: overview.company.name,
  applicationName:
    overview.assessment.applicationName?.trim() ||
    overview.assessment.title?.trim() ||
    'Untitled assessment',
});

const normalizeOptionalText = (value?: string) => {
  const trimmed = value?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const createEmptyThreatFormValue = (): ThreatFormValue => ({
  title: '',
  owaspCategoryCode: 'A01:2021',
  customCategory: '',
  strideCategory: 'spoofing',
  severity: 'medium',
  status: 'draft',
  affectedComponent: '',
  affectedEndpoint: '',
  observation: '',
  reproductionSteps: '',
  risk: '',
  recommendation: '',
  references: '',
  resolutionNote: '',
  acceptedRiskJustification: '',
});

const threatToFormValue = (threat: Threat): ThreatFormValue => ({
  title: threat.title,
  owaspCategoryCode:
    threat.owaspCategoryCode ?? (threat.customCategory ? 'custom' : 'A01:2021'),
  customCategory: threat.customCategory ?? '',
  strideCategory: threat.strideCategories[0] ?? 'spoofing',
  severity: threat.severity,
  status: threat.status,
  affectedComponent: threat.affectedComponent ?? '',
  affectedEndpoint: threat.affectedEndpoint ?? threat.affectedAsset ?? '',
  observation:
    threat.reproductionSteps ?? threat.observation ?? threat.description ?? '',
  reproductionSteps:
    threat.reproductionSteps ?? threat.observation ?? threat.description ?? '',
  risk: threat.risk ?? threat.impact ?? '',
  recommendation: threat.remediation ?? threat.recommendation ?? '',
  references: threat.references ?? '',
  resolutionNote: threat.resolutionNote ?? '',
  acceptedRiskJustification: threat.acceptedRiskJustification ?? '',
});

const threatFormValueToInput = (
  assessmentId: string,
  value: ThreatFormValue,
) => ({
  assessmentId,
  title: value.title.trim(),
  severity: value.severity,
  status: value.status,
  strideCategories: value.strideCategory
    ? [value.strideCategory]
    : ['spoofing'],
  owaspCategoryCode: normalizeOptionalText(value.owaspCategoryCode),
  customCategory: normalizeOptionalText(value.customCategory),
  affectedComponent: normalizeOptionalText(value.affectedComponent),
  affectedEndpoint: normalizeOptionalText(value.affectedEndpoint),
  observation: normalizeOptionalText(value.observation),
  reproductionSteps: normalizeOptionalText(
    value.reproductionSteps ?? value.observation,
  ),
  risk: normalizeOptionalText(value.risk),
  recommendation: normalizeOptionalText(value.recommendation),
  remediation: normalizeOptionalText(value.recommendation),
  references: normalizeOptionalText(value.references),
  resolutionNote: normalizeOptionalText(value.resolutionNote),
  acceptedRiskJustification: normalizeOptionalText(
    value.acceptedRiskJustification,
  ),
});

const threatToTableRow = (threat: Threat): ThreatTableRow => ({
  id: threat.id,
  title: threat.title,
  owaspCategoryCode: threat.owaspCategoryCode,
  customCategory: threat.customCategory,
  severity: threat.severity,
  status: threat.status,
  evidenceCount: threat.evidenceCount,
  updatedAt: threat.updatedAt,
  affectedComponent: threat.affectedComponent,
  affectedEndpoint: threat.affectedEndpoint ?? threat.affectedAsset,
  impact: threat.impact ?? threat.risk,
  recommendation: threat.recommendation ?? threat.remediation,
  observation: threat.observation,
  reproductionSteps: threat.reproductionSteps ?? threat.observation,
});

const isThreatFormReadyForOpen = (value: ThreatFormValue) =>
  value.title.trim().length > 0 &&
  Boolean(value.owaspCategoryCode?.trim().length) &&
  (value.owaspCategoryCode !== 'custom' ||
    value.customCategory?.trim().length > 0) &&
  value.affectedComponent.trim().length > 0 &&
  value.observation.trim().length > 0 &&
  value.risk.trim().length > 0 &&
  value.recommendation.trim().length > 0 &&
  value.references.trim().length > 0;

const getThreatValidationErrors = (value: ThreatFormValue) => {
  const errors: Partial<Record<keyof ThreatFormValue, string>> = {};

  if (value.title.trim().length === 0) {
    errors.title = 'Title is required.';
  }

  if (!value.owaspCategoryCode?.trim()) {
    errors.owaspCategoryCode = 'OWASP category code is required.';
  }

  if (value.owaspCategoryCode === 'custom' && !value.customCategory?.trim()) {
    errors.customCategory = 'Custom category is required.';
  }

  if (value.status !== 'draft' && !isThreatFormReadyForOpen(value)) {
    if (value.affectedComponent.trim().length === 0) {
      errors.affectedComponent = 'Affected component is required.';
    }

    if (value.observation.trim().length === 0) {
      errors.observation = 'Reproduction steps are required.';
    }

    if (value.risk.trim().length === 0) {
      errors.risk = 'Impact is required.';
    }

    if (value.recommendation.trim().length === 0) {
      errors.recommendation = 'Remediation is required.';
    }

    if (value.references.trim().length === 0) {
      errors.references = 'References are required.';
    }
  }

  if (
    value.status === 'resolved' &&
    value.resolutionNote?.trim().length === 0
  ) {
    errors.resolutionNote = 'Resolution note is required.';
  }

  if (
    value.status === 'accepted-risk' &&
    value.acceptedRiskJustification?.trim().length === 0
  ) {
    errors.acceptedRiskJustification =
      'Accepted-risk justification is required.';
  }

  return errors;
};

const areThreatFormValuesEqual = (
  left: ThreatFormValue,
  right: ThreatFormValue,
) => JSON.stringify(left) === JSON.stringify(right);

const getActionCommand = (
  action: AssessmentDetailAction,
  companyId: string,
  assessmentId: string,
  recordVersion: number,
) => {
  switch (action) {
    case 'start':
      return assessmentService.start(companyId, assessmentId, recordVersion);
    case 'complete':
      return assessmentService.complete(companyId, assessmentId, recordVersion);
    case 'reopen':
      return assessmentService.reopen(companyId, assessmentId, recordVersion);
    case 'archive':
      return assessmentService.archive(companyId, assessmentId, recordVersion);
    default:
      return Promise.reject(new Error('Unsupported assessment action.'));
  }
};

const getNextAssessmentStatus = (
  action: AssessmentDetailAction,
): 'in-progress' | 'completed' | 'archived' => {
  switch (action) {
    case 'start':
    case 'reopen':
      return 'in-progress';
    case 'complete':
      return 'completed';
    case 'archive':
      return 'archived';
  }
};

const AssessmentDetails = ({ activeSection }: AssessmentDetailsRouteProps) => {
  const navigate = useNavigate();
  const { companyId, assessmentId } = useParams<{
    companyId?: string;
    assessmentId?: string;
  }>();
  const [overview, setOverview] = useState<
    AssessmentWorkspaceOverview | undefined
  >();
  const [threats, setThreats] = useState<Threat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [findingsLoading, setFindingsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [findingsLoadError, setFindingsLoadError] = useState<
    string | undefined
  >();
  const [isNotFound, setIsNotFound] = useState(false);
  const [pendingAction, setPendingAction] = useState<AssessmentDetailAction>();
  const [actionError, setActionError] = useState<string | undefined>();
  const [conflictError, setConflictError] = useState<string | undefined>();
  const [findingDrawerMode, setFindingDrawerMode] =
    useState<FindingDrawerMode>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string>();
  const [draftFindingValue, setDraftFindingValue] = useState(
    createEmptyThreatFormValue(),
  );
  const [baselineFindingValue, setBaselineFindingValue] = useState(
    createEmptyThreatFormValue(),
  );
  const [findingFieldErrors, setFindingFieldErrors] = useState<
    Partial<Record<keyof ThreatFormValue, string>>
  >({});
  const [findingFormError, setFindingFormError] = useState<
    string | undefined
  >();
  const [isFindingSubmitting, setIsFindingSubmitting] = useState(false);
  const [findingsReloadKey, setFindingsReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadOverview = async () => {
      if (!companyId || !assessmentId) {
        if (isActive) {
          setIsNotFound(true);
          setIsLoading(false);
        }

        return;
      }

      setIsLoading(true);
      setLoadError(undefined);
      setIsNotFound(false);
      setActionError(undefined);
      setConflictError(undefined);

      try {
        const nextOverview = await assessmentService.getOverview(
          companyId,
          assessmentId,
          controller.signal,
        );

        if (isActive) {
          setOverview(nextOverview);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        if (error instanceof ApiError && error.status === 404) {
          setIsNotFound(true);
          setOverview(undefined);
          return;
        }

        setOverview(undefined);
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load assessment overview.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [assessmentId, companyId]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadFindings = async () => {
      if (!assessmentId) {
        if (isActive) {
          setFindingsLoading(false);
        }

        return;
      }

      setFindingsLoading(true);
      setFindingsLoadError(undefined);

      try {
        const nextFindings = await threatService.listByAssessment(
          assessmentId,
          controller.signal,
        );

        if (isActive) {
          setThreats(nextFindings);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        setThreats([]);
        setFindingsLoadError(
          error instanceof Error ? error.message : 'Unable to load findings.',
        );
      } finally {
        if (isActive) {
          setFindingsLoading(false);
        }
      }
    };

    void loadFindings();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [assessmentId, findingsReloadKey]);

  useEffect(() => {
    const isDirty =
      findingDrawerMode !== null &&
      findingDrawerMode !== 'view' &&
      !areThreatFormValuesEqual(draftFindingValue, baselineFindingValue);

    if (!isDirty) {
      return undefined;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [baselineFindingValue, draftFindingValue, findingDrawerMode]);

  const assessmentView = useMemo(
    () => (overview ? toAssessmentViewModel(overview) : undefined),
    [overview],
  );

  const selectedFinding = useMemo(
    () => threats.find(threat => threat.id === selectedFindingId),
    [selectedFindingId, threats],
  );

  const handleSectionChange = (section: AssessmentDetailSection) => {
    if (!companyId || !assessmentId) {
      return;
    }

    navigate(sectionHrefMap[section](companyId, assessmentId));
  };

  const handleAction = async (action: AssessmentDetailAction) => {
    if (!companyId || !assessmentId || !overview || pendingAction) {
      return;
    }

    setPendingAction(action);
    setActionError(undefined);
    setConflictError(undefined);

    try {
      await getActionCommand(
        action,
        companyId,
        assessmentId,
        overview.assessment.recordVersion,
      );
      setOverview(currentOverview =>
        currentOverview
          ? {
              ...currentOverview,
              assessment: {
                ...currentOverview.assessment,
                status: getNextAssessmentStatus(action),
              },
            }
          : currentOverview,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setConflictError(
          error.message || 'The assessment was modified by another user.',
        );
      } else {
        setActionError(
          error instanceof Error
            ? error.message
            : 'Unable to update assessment.',
        );
      }
    } finally {
      setPendingAction(undefined);
    }
  };

  const closeFindingDrawer = () => {
    if (isFindingSubmitting) {
      return;
    }

    const isDirty =
      findingDrawerMode !== null &&
      findingDrawerMode !== 'view' &&
      !areThreatFormValuesEqual(draftFindingValue, baselineFindingValue);

    if (isDirty && !window.confirm('Discard unsaved finding changes?')) {
      return;
    }

    setFindingDrawerMode(null);
    setSelectedFindingId(undefined);
    setDraftFindingValue(createEmptyThreatFormValue());
    setBaselineFindingValue(createEmptyThreatFormValue());
    setFindingFieldErrors({});
    setFindingFormError(undefined);
    setIsFindingSubmitting(false);
  };

  const openFindingDetails = (threat: Threat | ThreatTableRow) => {
    const finding =
      'strideCategories' in threat
        ? threat
        : threats.find(item => item.id === threat.id);

    if (!finding) {
      return;
    }

    if (findingDrawerMode !== null && findingDrawerMode !== 'view') {
      if (
        !areThreatFormValuesEqual(draftFindingValue, baselineFindingValue) &&
        !window.confirm('Discard unsaved finding changes?')
      ) {
        return;
      }
    }

    setSelectedFindingId(finding.id);
    setFindingDrawerMode('view');
    setDraftFindingValue(threatToFormValue(finding));
    setBaselineFindingValue(threatToFormValue(finding));
    setFindingFieldErrors({});
    setFindingFormError(undefined);
  };

  const openCreateFinding = () => {
    if (
      findingDrawerMode !== null &&
      findingDrawerMode !== 'view' &&
      !areThreatFormValuesEqual(draftFindingValue, baselineFindingValue) &&
      !window.confirm('Discard unsaved finding changes?')
    ) {
      return;
    }

    const value = createEmptyThreatFormValue();

    setSelectedFindingId(undefined);
    setFindingDrawerMode('create');
    setDraftFindingValue(value);
    setBaselineFindingValue(value);
    setFindingFieldErrors({});
    setFindingFormError(undefined);
  };

  const openEditFinding = (threat?: Threat | ThreatTableRow) => {
    const finding =
      threat && 'strideCategories' in threat
        ? threat
        : threat
          ? threats.find(item => item.id === threat.id)
          : selectedFinding;

    if (!finding) {
      return;
    }

    if (
      findingDrawerMode !== null &&
      findingDrawerMode !== 'view' &&
      !areThreatFormValuesEqual(draftFindingValue, baselineFindingValue) &&
      !window.confirm('Discard unsaved finding changes?')
    ) {
      return;
    }

    const value = threatToFormValue(finding);

    setSelectedFindingId(finding.id);
    setFindingDrawerMode('edit');
    setDraftFindingValue(value);
    setBaselineFindingValue(value);
    setFindingFieldErrors({});
    setFindingFormError(undefined);
  };

  const handleFindingSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!companyId || !assessmentId) {
      return;
    }

    const validationErrors = getThreatValidationErrors(draftFindingValue);

    if (Object.keys(validationErrors).length > 0) {
      setFindingFieldErrors(validationErrors);
      setFindingFormError('Please fix the highlighted fields and try again.');
      return;
    }

    const payload = threatFormValueToInput(assessmentId, draftFindingValue);

    setIsFindingSubmitting(true);
    setFindingFieldErrors({});
    setFindingFormError(undefined);

    try {
      if (findingDrawerMode === 'edit' && selectedFindingId) {
        await threatService.update(selectedFindingId, payload);
      } else {
        await threatService.create(payload);
      }

      setFindingsReloadKey(key => key + 1);
      setFindingDrawerMode(null);
      setSelectedFindingId(undefined);
      setDraftFindingValue(createEmptyThreatFormValue());
      setBaselineFindingValue(createEmptyThreatFormValue());
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setFindingFieldErrors(
          error.details.reduce<Partial<Record<keyof ThreatFormValue, string>>>(
            (accumulator, detail) => {
              const key = detail.path.split('.')[0] as keyof ThreatFormValue;

              if (key in draftFindingValue && !accumulator[key]) {
                accumulator[key] = detail.message;
              }

              return accumulator;
            },
            {},
          ),
        );
        setFindingFormError('Please fix the highlighted fields and try again.');
      } else {
        setFindingFormError(
          error instanceof Error ? error.message : 'Unable to save finding.',
        );
      }
    } finally {
      setIsFindingSubmitting(false);
    }
  };

  const handleFindingChange = (value: ThreatFormValue) => {
    setDraftFindingValue(value);
    setFindingFieldErrors({});
    setFindingFormError(undefined);
  };

  const findingsContent = useMemo(() => {
    if (!assessmentView) {
      return undefined;
    }

    const showEmptyWorkspace = !findingsLoading && threats.length === 0;
    const showNoResults =
      !findingsLoading && !findingsLoadError && threats.length === 0;
    const tableEmptyState = showEmptyWorkspace ? (
      <EmptyState
        title="No findings yet"
        description="Add the first finding to start tracking security issues in this assessment."
      />
    ) : showNoResults ? (
      <EmptyState
        title="No findings found"
        description="The current assessment has no findings to display."
      />
    ) : undefined;

    const drawerTitle =
      findingDrawerMode === 'create'
        ? 'Create finding'
        : findingDrawerMode === 'edit'
          ? 'Edit finding'
          : 'Finding details';

    return (
      <>
        <Card
          title="Findings"
          subtitle="Assessment-scoped findings and their current status."
          padding="large"
          actions={
            assessmentView.status === 'archived' ? undefined : (
              <Button title="Add finding" onClick={openCreateFinding} />
            )
          }
        >
          {findingsLoadError ? (
            <Callout variant="error" title="Unable to load findings">
              <p>{findingsLoadError}</p>
            </Callout>
          ) : (
            <ThreatTable
              threats={threats.map(threatToTableRow)}
              isLoading={findingsLoading}
              emptyState={tableEmptyState}
              onThreatClick={openFindingDetails}
              onEditThreatClick={
                assessmentView.status === 'archived'
                  ? undefined
                  : threat => openEditFinding(threat)
              }
            />
          )}
        </Card>

        <ThreatDrawer
          isOpen={findingDrawerMode !== null}
          title={drawerTitle}
          description={
            assessmentView
              ? `${assessmentView.companyName} · ${assessmentView.applicationName}`
              : undefined
          }
          threat={
            selectedFinding
              ? {
                  ...threatToTableRow(selectedFinding),
                  applicationName: assessmentView.applicationName,
                  companyName: assessmentView.companyName,
                }
              : undefined
          }
          onClose={closeFindingDrawer}
          onEdit={
            findingDrawerMode === 'view' &&
            selectedFinding &&
            assessmentView.status !== 'archived'
              ? () => openEditFinding(selectedFinding)
              : undefined
          }
        >
          {findingDrawerMode === 'create' || findingDrawerMode === 'edit' ? (
            <>
              {findingFormError && (
                <Callout variant="error" title="Unable to save finding">
                  <p>{findingFormError}</p>
                </Callout>
              )}

              <ThreatForm
                value={draftFindingValue}
                errors={findingFieldErrors}
                isSubmitting={isFindingSubmitting}
                submitLabel={
                  findingDrawerMode === 'create'
                    ? 'Create finding'
                    : 'Save finding'
                }
                onChange={handleFindingChange}
                onSubmit={handleFindingSave}
              />
            </>
          ) : null}
        </ThreatDrawer>
      </>
    );
  }, [
    assessmentView,
    closeFindingDrawer,
    draftFindingValue,
    findingDrawerMode,
    findingFieldErrors,
    findingFormError,
    findingsLoadError,
    findingsLoading,
    handleFindingSave,
    isFindingSubmitting,
    openCreateFinding,
    openEditFinding,
    openFindingDetails,
    selectedFinding,
    threats,
  ]);

  if (isLoading) {
    return <RouteLoadingView />;
  }

  if (isNotFound || !companyId || !assessmentId) {
    const returnHref = companyId
      ? routes.companyWorkspaceAssessments(companyId)
      : routes.assessments;

    return (
      <EntityNotFoundView
        entityName="Assessment"
        listHref={returnHref}
        listLabel="Return to assessments"
      />
    );
  }

  if (loadError) {
    return (
      <div role="alert">
        <h1>Assessment workspace</h1>

        <p>{loadError}</p>
      </div>
    );
  }

  if (!assessmentView) {
    return <RouteLoadingView />;
  }

  return (
    <AssessmentDetailsView
      assessment={assessmentView}
      activeSection={activeSection}
      overviewHref={routes.assessmentDetailsOverview(companyId, assessmentId)}
      findingsContent={findingsContent}
      onSectionChange={handleSectionChange}
      onBack={() => navigate(routes.companyWorkspaceAssessments(companyId))}
      onAction={handleAction}
      isActionLoading={pendingAction !== undefined}
      pendingAction={pendingAction}
      actionError={actionError}
      conflictError={conflictError}
    />
  );
};

export default AssessmentDetails;
