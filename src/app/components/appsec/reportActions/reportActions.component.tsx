import React from 'react';

import Button from '~/app/components/ui/button';

import StyledReportActions from './reportActions.styled';

import type { ReportActionsProps } from './reportActions.type';

const ReportActions = ({
  isGenerating = false,
  onPreview,
  onPrint,
  onGeneratePdf,
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

    {onGeneratePdf && (
      <Button
        title={isGenerating ? 'Opening print dialog' : 'Generate PDF'}
        isLoading={isGenerating}
        onClick={onGeneratePdf}
      />
    )}
  </StyledReportActions>
);

export default ReportActions;
