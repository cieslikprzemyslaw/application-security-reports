import React from 'react';

import ReportPreviewShell from '~/app/components/appsec/reportPreviewShell';
import {
  EntityNotFoundView,
  RouteErrorView,
  RouteLoadingView,
} from '~/app/components/routeStateViews';
import ReportBuilderPreview from '~/app/pages/reports/reportBuilderPreview.component';
import { routes } from '~/routes';

import { useReportDetailsController } from './reportDetails.controller';

import type { ReportDetailsProps } from './reportDetails.type';

const formatReportVersionNumber = (version: number): string => {
  const major = Math.floor(version / 10);
  const minor = version % 10;

  return `${major}.${minor}`;
};

const ignoreRetry = () => undefined;

const ReportDetails = ({
  reportId,
  versionId,
  onPrint,
  onDownloadPdf,
}: ReportDetailsProps) => {
  const state = useReportDetailsController(reportId, versionId);

  if (state.status === 'pending') {
    return <RouteLoadingView />;
  }

  if (state.status === 'empty' || state.status === 'not-found') {
    return (
      <EntityNotFoundView
        entityName={state.notFoundEntity ?? 'Report version'}
        listHref={routes.reports}
        listLabel="Return to reports"
      />
    );
  }

  if (state.status === 'error' || !state.version) {
    return <RouteErrorView />;
  }

  const { version } = state;
  const { snapshot } = version;
  const applicationName =
    snapshot.assessment.applicationName ?? snapshot.assessment.title;

  return (
    <ReportPreviewShell
      applicationName={applicationName}
      assessmentCode={`${reportId} · v${formatReportVersionNumber(version.version)}`}
      autoSaved={false}
      preview={
        <ReportBuilderPreview
          status="success"
          snapshot={snapshot}
          reportId={reportId}
          issuedDate={version.generatedAt}
          onRetry={ignoreRetry}
        />
      }
      dataView={<pre>{JSON.stringify(version, null, 2)}</pre>}
      onPrint={onPrint}
      onDownloadPdf={onDownloadPdf}
    />
  );
};

export default ReportDetails;
