import React from 'react';

import Button from '~/app/components/ui/button';

import StyledReportActions from './reportActions.styled';

import type { ReportActionsProps } from './reportActions.type';

const ReportActions = ({
  isGenerating = false,
  onPreview,
  onPrint,
  onDownloadPdf,
  onDownloadMarkdown,
  ...rest
}: ReportActionsProps) => (
  <StyledReportActions {...rest}>
    {onPreview && (
      <Button title="Preview" variant="secondary" onClick={onPreview} />
    )}

    {onPrint && <Button title="Print" variant="secondary" onClick={onPrint} />}

    {onDownloadMarkdown && (
      <Button
        title="Download Markdown"
        variant="tertiary"
        onClick={onDownloadMarkdown}
      />
    )}

    {onDownloadPdf && (
      <Button
        title={isGenerating ? 'Generating PDF' : 'Download PDF'}
        isLoading={isGenerating}
        onClick={onDownloadPdf}
      />
    )}
  </StyledReportActions>
);

export default ReportActions;
