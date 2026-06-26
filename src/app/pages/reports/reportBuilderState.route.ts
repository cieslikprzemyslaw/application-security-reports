import {
  type ReportBuilderConfiguration,
  type ReportBuilderRouteBranding,
  type ReportBuilderRouteConfiguration,
  type ReportBuilderRouteSelection,
  type ReportBuilderRouteState,
  type ReportBuilderSelection,
  type ReportBuilderState,
} from '~/domain';
import {
  reportBuilderBrandingSchema,
  reportBuilderConfigurationSchema,
  reportBuilderRouteStateSchema,
  reportBuilderStateSchema,
} from '~/domain/schemas';

const createDefaultSelection = (): ReportBuilderSelection => ({
  selectedThreatIds: [],
  selectedEvidenceIds: [],
});

const createDefaultConfiguration = (): ReportBuilderConfiguration =>
  reportBuilderConfigurationSchema.parse({});

const createDefaultBranding = (): ReportBuilderState['branding'] =>
  reportBuilderBrandingSchema.parse({});

export const createDefaultReportBuilderState = (
  companyId: string,
): ReportBuilderState =>
  reportBuilderStateSchema.parse({
    companyId,
    selection: createDefaultSelection(),
    configuration: createDefaultConfiguration(),
    branding: createDefaultBranding(),
  });

const mergeRouteState = (
  baseState: ReportBuilderState,
  routeState: ReportBuilderRouteState,
): ReportBuilderState =>
  reportBuilderStateSchema.parse({
    companyId: baseState.companyId,
    ...(routeState.reportId !== undefined
      ? {
          reportId: routeState.reportId,
        }
      : {}),
    selection: {
      ...baseState.selection,
      ...(routeState.selection?.selectedAssessmentId !== undefined
        ? {
            selectedAssessmentId: routeState.selection.selectedAssessmentId,
          }
        : {}),
      ...(routeState.selection?.selectedThreatIds !== undefined
        ? {
            selectedThreatIds: routeState.selection.selectedThreatIds,
          }
        : {}),
      ...(routeState.selection?.selectedEvidenceIds !== undefined
        ? {
            selectedEvidenceIds: routeState.selection.selectedEvidenceIds,
          }
        : {}),
      ...(routeState.selection?.selectedEvidenceSelections !== undefined
        ? {
            selectedEvidenceSelections:
              routeState.selection.selectedEvidenceSelections,
          }
        : {}),
    },
    configuration: {
      ...baseState.configuration,
      ...(routeState.configuration?.methodology !== undefined
        ? {
            methodology: routeState.configuration.methodology,
          }
        : {}),
      ...(routeState.configuration?.reportStyle !== undefined
        ? {
            reportStyle: routeState.configuration.reportStyle,
          }
        : {}),
      ...(routeState.configuration?.includeEvidence !== undefined
        ? {
            includeEvidence: routeState.configuration.includeEvidence,
          }
        : {}),
    },
    branding: {
      ...baseState.branding,
      ...(routeState.branding?.brandingMode !== undefined
        ? {
            brandingMode: routeState.branding.brandingMode,
          }
        : {}),
    },
  });

export const parseReportBuilderRouteState = (
  companyId: string,
  value: unknown,
): ReportBuilderRouteState | undefined => {
  const parsed = reportBuilderRouteStateSchema.safeParse(value);

  if (!parsed.success || parsed.data.companyId !== companyId) {
    return undefined;
  }

  return parsed.data;
};

export const restoreReportBuilderRouteState = (
  companyId: string,
  value: unknown,
): ReportBuilderState => {
  const routeState = parseReportBuilderRouteState(companyId, value);

  if (!routeState) {
    return createDefaultReportBuilderState(companyId);
  }

  return mergeRouteState(
    createDefaultReportBuilderState(companyId),
    routeState,
  );
};

export const restoreReportBuilderState = restoreReportBuilderRouteState;

const isDefined = (value: unknown): value is string | number | boolean | null =>
  value !== undefined;

const createSelectionRouteState = (
  selection: ReportBuilderSelection,
): ReportBuilderRouteSelection => {
  const routeSelection: ReportBuilderRouteSelection = {};

  if (selection.selectedAssessmentId !== undefined) {
    routeSelection.selectedAssessmentId = selection.selectedAssessmentId;
  }

  if (selection.selectedThreatIds.length > 0) {
    routeSelection.selectedThreatIds = selection.selectedThreatIds;
  }

  if (selection.selectedEvidenceIds.length > 0) {
    routeSelection.selectedEvidenceIds = selection.selectedEvidenceIds;
  }

  if (selection.selectedEvidenceSelections?.length) {
    routeSelection.selectedEvidenceSelections =
      selection.selectedEvidenceSelections;
  }

  return routeSelection;
};

const createConfigurationRouteState = (
  configuration: ReportBuilderConfiguration,
): ReportBuilderRouteConfiguration => {
  const routeConfiguration: ReportBuilderRouteConfiguration = {};

  if (configuration.methodology !== undefined) {
    routeConfiguration.methodology = configuration.methodology;
  }

  if (configuration.reportStyle !== undefined) {
    routeConfiguration.reportStyle = configuration.reportStyle;
  }

  if (configuration.includeEvidence) {
    routeConfiguration.includeEvidence = true;
  }

  return routeConfiguration;
};

const createBrandingRouteState = (
  branding: ReportBuilderState['branding'],
): ReportBuilderRouteBranding => {
  const routeBranding: ReportBuilderRouteBranding = {};

  if (branding.brandingMode !== 'issuer') {
    routeBranding.brandingMode = branding.brandingMode;
  }

  return routeBranding;
};

const hasSerializableEntries = (value: Record<string, unknown>) =>
  Object.values(value).some(isDefined);

export const serializeReportBuilderRouteState = (
  state: ReportBuilderState,
): ReportBuilderRouteState => {
  const parsedState = reportBuilderStateSchema.parse(state);
  const routeState: ReportBuilderRouteState = {
    companyId: parsedState.companyId,
    ...(parsedState.reportId !== undefined
      ? {
          reportId: parsedState.reportId,
        }
      : {}),
  };

  const selection = createSelectionRouteState(parsedState.selection);
  const configuration = createConfigurationRouteState(
    parsedState.configuration,
  );
  const branding = createBrandingRouteState(parsedState.branding);

  if (hasSerializableEntries(selection)) {
    routeState.selection = selection;
  }

  if (hasSerializableEntries(configuration)) {
    routeState.configuration = configuration;
  }

  if (hasSerializableEntries(branding)) {
    routeState.branding = branding;
  }

  return routeState;
};

export const serializeReportBuilderState = serializeReportBuilderRouteState;
