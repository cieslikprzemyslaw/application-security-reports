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
  reportBuilderRouteStateSchema,
  reportBuilderStateSchema,
} from '~/domain/schemas';

const normalizeOptionalText = (value?: string): string | undefined => {
  const trimmed = value?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const normalizeSelectedIds = (value?: readonly string[]) => {
  if (value === undefined) {
    return undefined;
  }

  return Array.from(new Set(value.map(item => item.trim()).filter(Boolean)));
};

const createDefaultSelection = (): ReportBuilderSelection =>
  reportBuilderStateSchema.parse({
    selection: {},
    configuration: {},
    branding: {},
  }).selection;

const createDefaultConfiguration = (): ReportBuilderConfiguration =>
  reportBuilderStateSchema.parse({
    selection: {},
    configuration: {},
    branding: {},
  }).configuration;

const createDefaultBranding = (): ReportBuilderState['branding'] =>
  reportBuilderStateSchema.parse({
    selection: {},
    configuration: {},
    branding: {},
  }).branding;

export const createDefaultReportBuilderState = (): ReportBuilderState =>
  reportBuilderStateSchema.parse({
    selection: createDefaultSelection(),
    configuration: createDefaultConfiguration(),
    branding: createDefaultBranding(),
  });

const mergeRouteState = (
  baseState: ReportBuilderState,
  routeState: ReportBuilderRouteState,
): ReportBuilderState =>
  reportBuilderStateSchema.parse({
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
      ...(routeState.branding?.companyName !== undefined
        ? {
            companyName: routeState.branding.companyName,
          }
        : {}),
      ...(routeState.branding?.companyWebsite !== undefined
        ? {
            companyWebsite: routeState.branding.companyWebsite,
          }
        : {}),
      ...(routeState.branding?.companyContactEmail !== undefined
        ? {
            companyContactEmail: routeState.branding.companyContactEmail,
          }
        : {}),
      ...(routeState.branding?.companyLogoUrl !== undefined
        ? {
            companyLogoUrl: routeState.branding.companyLogoUrl,
          }
        : {}),
      ...(routeState.branding?.companyFooterText !== undefined
        ? {
            companyFooterText: routeState.branding.companyFooterText,
          }
        : {}),
      ...(routeState.branding?.issuerName !== undefined
        ? {
            issuerName: routeState.branding.issuerName,
          }
        : {}),
      ...(routeState.branding?.issuerContactName !== undefined
        ? {
            issuerContactName: routeState.branding.issuerContactName,
          }
        : {}),
      ...(routeState.branding?.issuerContactEmail !== undefined
        ? {
            issuerContactEmail: routeState.branding.issuerContactEmail,
          }
        : {}),
      ...(routeState.branding?.issuerLogoUrl !== undefined
        ? {
            issuerLogoUrl: routeState.branding.issuerLogoUrl,
          }
        : {}),
      ...(routeState.branding?.reportFooterText !== undefined
        ? {
            reportFooterText: routeState.branding.reportFooterText,
          }
        : {}),
      ...(routeState.branding?.reportConfidentialityLabel !== undefined
        ? {
            reportConfidentialityLabel:
              routeState.branding.reportConfidentialityLabel,
          }
        : {}),
      ...(routeState.branding?.confidentialReports !== undefined
        ? {
            confidentialReports: routeState.branding.confidentialReports,
          }
        : {}),
      ...(routeState.branding?.allowedBrandingModes !== undefined
        ? {
            allowedBrandingModes: routeState.branding.allowedBrandingModes,
          }
        : {}),
      ...(routeState.branding?.defaultBrandingMode !== undefined
        ? {
            defaultBrandingMode: routeState.branding.defaultBrandingMode,
          }
        : {}),
    },
  });

export const restoreReportBuilderRouteState = (
  value: unknown,
): ReportBuilderState => {
  const parsed = reportBuilderRouteStateSchema.safeParse(value);

  if (!parsed.success) {
    return createDefaultReportBuilderState();
  }

  return mergeRouteState(createDefaultReportBuilderState(), parsed.data);
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

  if (branding.companyName !== undefined) {
    routeBranding.companyName = branding.companyName;
  }

  if (branding.companyWebsite !== undefined) {
    routeBranding.companyWebsite = branding.companyWebsite;
  }

  if (branding.companyContactEmail !== undefined) {
    routeBranding.companyContactEmail = branding.companyContactEmail;
  }

  if (branding.companyLogoUrl !== undefined) {
    routeBranding.companyLogoUrl = branding.companyLogoUrl;
  }

  if (branding.companyFooterText !== undefined) {
    routeBranding.companyFooterText = branding.companyFooterText;
  }

  if (branding.issuerName !== undefined) {
    routeBranding.issuerName = branding.issuerName;
  }

  if (branding.issuerContactName !== undefined) {
    routeBranding.issuerContactName = branding.issuerContactName;
  }

  if (branding.issuerContactEmail !== undefined) {
    routeBranding.issuerContactEmail = branding.issuerContactEmail;
  }

  if (branding.issuerLogoUrl !== undefined) {
    routeBranding.issuerLogoUrl = branding.issuerLogoUrl;
  }

  if (branding.reportFooterText !== undefined) {
    routeBranding.reportFooterText = branding.reportFooterText;
  }

  if (branding.reportConfidentialityLabel !== undefined) {
    routeBranding.reportConfidentialityLabel =
      branding.reportConfidentialityLabel;
  }

  if (branding.confidentialReports) {
    routeBranding.confidentialReports = true;
  }

  if (branding.allowedBrandingModes !== undefined) {
    routeBranding.allowedBrandingModes = branding.allowedBrandingModes;
  }

  if (branding.defaultBrandingMode !== undefined) {
    routeBranding.defaultBrandingMode = branding.defaultBrandingMode;
  }

  return routeBranding;
};

const hasSerializableEntries = (value: Record<string, unknown>) =>
  Object.values(value).some(isDefined);

export const serializeReportBuilderRouteState = (
  state: ReportBuilderState,
): ReportBuilderRouteState => {
  const parsedState = reportBuilderStateSchema.parse(state);
  const routeState: ReportBuilderRouteState = {};

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

export const updateReportBuilderConfiguration = (
  state: ReportBuilderState,
  patch: Partial<ReportBuilderConfiguration>,
): ReportBuilderState =>
  reportBuilderStateSchema.parse({
    ...state,
    configuration: {
      ...state.configuration,
      ...(patch.methodology === undefined
        ? {}
        : {
            methodology: normalizeOptionalText(patch.methodology),
          }),
      ...(patch.reportStyle === undefined
        ? {}
        : {
            reportStyle: normalizeOptionalText(patch.reportStyle),
          }),
      ...(patch.includeEvidence === undefined
        ? {}
        : {
            includeEvidence: patch.includeEvidence,
          }),
    },
  });

export const updateReportBuilderSelection = (
  state: ReportBuilderState,
  patch: Partial<ReportBuilderSelection>,
): ReportBuilderState =>
  reportBuilderStateSchema.parse({
    ...state,
    selection: {
      ...state.selection,
      ...(patch.selectedAssessmentId === undefined
        ? {}
        : {
            selectedAssessmentId: normalizeOptionalText(
              patch.selectedAssessmentId,
            ),
          }),
      ...(patch.selectedThreatIds === undefined
        ? {}
        : {
            selectedThreatIds:
              normalizeSelectedIds(patch.selectedThreatIds) ?? [],
          }),
      ...(patch.selectedEvidenceIds === undefined
        ? {}
        : {
            selectedEvidenceIds:
              normalizeSelectedIds(patch.selectedEvidenceIds) ?? [],
          }),
    },
  });
