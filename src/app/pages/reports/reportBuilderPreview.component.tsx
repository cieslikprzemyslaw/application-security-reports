import React from 'react';

import ReportCover from '~/app/components/appsec/reportCover';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import EmptyState from '~/app/components/ui/emptyState';

import type { ReportPreviewControllerState } from './reportPreview.controller';
import { toReportPreviewPresentation } from './reportPreview.mapper';
import StyledReportBuilderPreview from './reportBuilderPreview.styled';

interface ReportBuilderPreviewProps extends ReportPreviewControllerState {
  reportId?: string;
  issuedDate?: string;
  onRetry: () => void;
}

const ReportBuilderPreview = ({
  status,
  snapshot,
  errorMessage,
  reportId,
  issuedDate,
  onRetry,
}: ReportBuilderPreviewProps) => {
  if (status === 'idle') {
    return (
      <StyledReportBuilderPreview>
        <EmptyState
          variant="first-use"
          title="Select an assessment"
          description="Choose an assessment and report content in the Data tab to generate a preview."
        />
      </StyledReportBuilderPreview>
    );
  }

  if (status === 'pending' && !snapshot) {
    return (
      <StyledReportBuilderPreview>
        <div className="report-builder-preview-state" role="status" aria-busy>
          <p>Generating report preview…</p>
        </div>
      </StyledReportBuilderPreview>
    );
  }

  if (status === 'error' && !snapshot) {
    return (
      <StyledReportBuilderPreview>
        <Callout
          variant="error"
          title="Unable to generate preview"
          actions={
            <Button title="Retry" variant="secondary" onClick={onRetry} />
          }
        >
          <p>{errorMessage ?? 'Unable to generate the report preview.'}</p>
        </Callout>
      </StyledReportBuilderPreview>
    );
  }

  if (!snapshot) {
    return null;
  }

  const presentation = toReportPreviewPresentation(snapshot, {
    reportId,
    issuedDate,
  });

  return (
    <StyledReportBuilderPreview className="report-builder-preview">
      {status === 'pending' && (
        <Callout variant="info" title="Refreshing preview">
          <p>
            The previous preview remains visible while the latest selection is
            processed.
          </p>
        </Callout>
      )}

      {status === 'error' && (
        <Callout
          variant="error"
          title="Preview refresh failed"
          actions={
            <Button title="Retry" variant="secondary" onClick={onRetry} />
          }
        >
          <p>{errorMessage ?? 'Unable to refresh the report preview.'}</p>
        </Callout>
      )}

      {snapshot.warnings.length > 0 && (
        <Callout
          className="report-builder-preview-warnings no-print"
          variant="warning"
          title="Report preview warnings"
        >
          <ul>
            {snapshot.warnings.map((warning, index) => (
              <li key={`${warning}:${index}`}>{warning}</li>
            ))}
          </ul>
        </Callout>
      )}

      <ReportCover
        {...presentation.cover}
        companyLogo={
          presentation.logoUrl ? (
            <img
              className="report-builder-preview-logo"
              src={presentation.logoUrl}
              alt={presentation.logoAlt}
            />
          ) : undefined
        }
      />
    </StyledReportBuilderPreview>
  );
};

export default ReportBuilderPreview;
