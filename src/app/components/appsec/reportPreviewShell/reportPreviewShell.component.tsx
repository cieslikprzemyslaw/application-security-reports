import React, { useState } from 'react';

import Button from '~/app/components/ui/button';

import StyledReportPreviewShell from './reportPreviewShell.styled';

import type { ReportPreviewShellProps } from './reportPreviewShell.type';

const ReportPreviewShell = ({
  applicationName,
  assessmentCode,
  autoSaved = true,
  preview,
  dataView,
  onPrint,
  onDownloadPdf,
}: ReportPreviewShellProps) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'data'>('preview');

  return (
    <StyledReportPreviewShell>
      <header className="report-preview-shell-header">
        <div>
          <h1 className="report-preview-shell-title">Report Preview</h1>

          <p className="report-preview-shell-subtitle">
            {applicationName}
            {' · '}
            {assessmentCode}
          </p>
        </div>
      </header>

      <div className="report-preview-shell-toolbar">
        <div className="report-preview-shell-tabs">
          <button
            className={[
              'report-preview-shell-tab-button',
              activeTab === 'preview'
                ? 'report-preview-shell-tab-button--active'
                : 'report-preview-shell-tab-button--inactive',
            ].join(' ')}
            type="button"
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>

          <button
            className={[
              'report-preview-shell-tab-button',
              activeTab === 'data'
                ? 'report-preview-shell-tab-button--active'
                : 'report-preview-shell-tab-button--inactive',
            ].join(' ')}
            type="button"
            onClick={() => setActiveTab('data')}
          >
            Data
          </button>
        </div>

        <div className="report-preview-shell-actions">
          {autoSaved && (
            <span className="report-preview-shell-auto-saved">
              ✓ Auto-saved
            </span>
          )}

          {onPrint && (
            <Button title="Print" variant="secondary" onClick={onPrint} />
          )}

          {onDownloadPdf && (
            <Button title="Download PDF" onClick={onDownloadPdf} />
          )}
        </div>
      </div>

      <div className="report-preview-shell-stage">
        <div className="report-preview-shell-paper">
          {activeTab === 'preview' ? preview : dataView}
        </div>
      </div>
    </StyledReportPreviewShell>
  );
};

export default ReportPreviewShell;
