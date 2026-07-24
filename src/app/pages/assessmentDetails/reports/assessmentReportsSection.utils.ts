import type { ReportVersionSummary } from '~/domain';

export const formatVersionNumber = (version: number): string =>
  `${Math.floor(version / 10)}.${version % 10}`;

export const reportStatusLabels = {
  draft: 'Draft',
  generated: 'Generated',
  archived: 'Archived',
} as const;

export const versionStatusLabels = {
  draft: 'Draft',
  final: 'Final',
} as const;

export const getDeleteConfirmationText = (
  version: ReportVersionSummary,
): string => `v${formatVersionNumber(version.version)}`;

export const getDeleteDescription = (
  version: ReportVersionSummary,
): string =>
  version.status === 'final'
    ? 'This final Report version is immutable history. Deleting it removes the saved snapshot from this local workspace.'
    : 'This draft Report version will be removed from this local workspace.';
