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
      selectedAssessmentId:
        routeState.selection?.selectedAssessmentId !== undefined
          ? routeState.selection.selectedAssessmentId
          : baseState.selection.selectedAssessmentId,
      selectedThreatIds:
        routeState.selection?.selectedThreatIds !== undefined
          ? routeState.selection.selectedThreatIds
          : baseState.selection.selectedThreatIds,
      selectedEvidenceIds:
        routeState.selection?.selectedEvidenceIds !== undefined
          ? routeState.selection.selectedEvidenceIds
          : baseState.selection.selectedEvidenceIds,
    },
    configuration: {
      methodology:
        routeState.configuration?.methodology !== undefined
          ? routeState.configuration.methodology
          : baseState.configuration.methodology,
      reportStyle:
        routeState.configuration?.reportStyle !== undefined
          ? routeState.configuration.reportStyle
          : baseState.configuration.reportStyle,
      includeEvidence:
        routeState.configuration?.includeEvidence !== undefined
          ? routeState.configuration.includeEvidence
          : baseState.configuration.includeEvidence,
    },
    branding: {
      brandingMode:
        routeState.branding?.brandingMode !== undefined
          ? routeState.branding.brandingMode
          : baseState.branding.brandingMode,
      companyName:
        routeState.branding?.companyName !== undefined
          ? routeState.branding.companyName
          : baseState.branding.companyName,
      companyWebsite:
        routeState.branding?.companyWebsite !== undefined
          ? routeState.branding.companyWebsite
          : baseState.branding.companyWebsite,
      companyContactEmail:
        routeState.branding?.companyContactEmail !== undefined
          ? routeState.branding.companyContactEmail
          : baseState.branding.companyContactEmail,
      companyLogoUrl:
        routeState.branding?.companyLogoUrl !== undefined
          ? routeState.branding.companyLogoUrl
          : baseState.branding.companyLogoUrl,
      companyFooterText:
        routeState.branding?.companyFooterText !== undefined
          ? routeState.branding.companyFooterText
          : baseState.branding.companyFooterText,
      issuerName:
        routeState.branding?.issuerName !== undefined
          ? routeState.branding.issuerName
          : baseState.branding.issuerName,
      issuerContactName:
        routeState.branding?.issuerContactName !== undefined
          ? routeState.branding.issuerContactName
          : baseState.branding.issuerContactName,
      issuerContactEmail:
        routeState.branding?.issuerContactEmail !== undefined
          ? routeState.branding.issuerContactEmail
          : baseState.branding.issuerContactEmail,
      issuerLogoUrl:
        routeState.branding?.issuerLogoUrl !== undefined
          ? routeState.branding.issuerLogoUrl
          : baseState.branding.issuerLogoUrl,
      reportFooterText:
        routeState.branding?.reportFooterText !== undefined
          ? routeState.branding.reportFooterText
          : baseState.branding.reportFooterText,
      reportConfidentialityLabel:
        routeState.branding?.reportConfidentialityLabel !== undefined
          ? routeState.branding.reportConfidentialityLabel
          : baseState.branding.reportConfidentialityLabel,
      confidentialReports:
        routeState.branding?.confidentialReports !== undefined
          ? routeState.branding.confidentialReports
          : baseState.branding.confidentialReports,
      allowedBrandingModes:
        routeState.branding?.allowedBrandingModes !== undefined
          ? routeState.branding.allowedBrandingModes
          : baseState.branding.allowedBrandingModes,
      defaultBrandingMode:
        routeState.branding?.defaultBrandingMode !== undefined
          ? routeState.branding.defaultBrandingMode
          : baseState.branding.defaultBrandingMode,
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
