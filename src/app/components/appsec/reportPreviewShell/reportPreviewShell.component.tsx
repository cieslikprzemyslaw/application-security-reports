import React, { useState } from 'react';

import Button from '~/app/components/ui/button';
import { LightThemeProvider } from '~/theme';

import StyledReportPreviewShell from './reportPreviewShell.styled';

import type {
  ReportPreviewShellProps,
  ReportPreviewShellTab,
} from './reportPreviewShell.type';

const ReportPreviewShell = ({
  applicationName,
  assessmentCode,
  autoSaved = true,
  preview,
  dataView,
  activeTab,
  onActiveTabChange,
  previewTabRef,
  titleRef,
  onPrint,
  onDownloadPdf,
}: ReportPreviewShellProps) => {
  const [internalActiveTab, setInternalActiveTab] =
    useState<ReportPreviewShellTab>('preview');
  const resolvedActiveTab = activeTab ?? internalActiveTab;

  const handleTabChange = (nextTab: ReportPreviewShellTab) => {
    if (activeTab === undefined) {
      setInternalActiveTab(nextTab);
    }

    onActiveTabChange?.(nextTab);
  };

  return (
    <LightThemeProvider>
      <StyledReportPreviewShell>
        <header className="report-preview-shell-header">
          <div>
            <h1
              ref={titleRef}
              className="report-preview-shell-title"
              tabIndex={-1}
            >
              Report Preview
            </h1>

            <p className="report-preview-shell-subtitle">
              {applicationName}
              {' · '}
              {assessmentCode}
            </p>
          </div>
        </header>

        <div className="report-preview-shell-toolbar">
          <div
            className="report-preview-shell-tabs"
            role="tablist"
            aria-label="Report view"
          >
            <button
              ref={previewTabRef}
              className={[
                'report-preview-shell-tab-button',
                resolvedActiveTab === 'preview'
                  ? 'report-preview-shell-tab-button--active'
                  : 'report-preview-shell-tab-button--inactive',
              ].join(' ')}
              type="button"
              role="tab"
              aria-selected={resolvedActiveTab === 'preview'}
              onClick={() => handleTabChange('preview')}
            >
              Preview
            </button>

            <button
              className={[
                'report-preview-shell-tab-button',
                resolvedActiveTab === 'data'
                  ? 'report-preview-shell-tab-button--active'
                  : 'report-preview-shell-tab-button--inactive',
              ].join(' ')}
              type="button"
              role="tab"
              aria-selected={resolvedActiveTab === 'data'}
              onClick={() => handleTabChange('data')}
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
            {resolvedActiveTab === 'preview' ? preview : dataView}
          </div>
        </div>
      </StyledReportPreviewShell>
    </LightThemeProvider>
  );
};

export default ReportPreviewShell;
