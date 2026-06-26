import { useState } from 'react';

import ReportActions from '~/app/components/appsec/reportActions';
import { LightThemeProvider } from '~/theme';

import ReportPrintStyles from './reportPrintStyles';
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
  reportActions,
  reportActionStatus,
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
      <ReportPrintStyles />
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
              id="report-preview-shell-preview-tab"
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
              aria-controls="report-preview-shell-preview-panel"
              onClick={() => handleTabChange('preview')}
            >
              Preview
            </button>

            <button
              id="report-preview-shell-data-tab"
              className={[
                'report-preview-shell-tab-button',
                resolvedActiveTab === 'data'
                  ? 'report-preview-shell-tab-button--active'
                  : 'report-preview-shell-tab-button--inactive',
              ].join(' ')}
              type="button"
              role="tab"
              aria-selected={resolvedActiveTab === 'data'}
              aria-controls="report-preview-shell-data-panel"
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

            {reportActionStatus && (
              <span
                className="report-preview-shell-action-status"
                role={reportActionStatus.role ?? 'status'}
                aria-live="polite"
                aria-atomic="true"
              >
                {reportActionStatus.message}
              </span>
            )}

            {reportActions && <ReportActions {...reportActions} />}

            {reportActions?.generatePdf && (
              <span
                className="report-preview-shell-print-hint no-print"
                role="note"
              >
                For a clean PDF, open More settings and disable browser Headers
                and footers.
              </span>
            )}
          </div>
        </div>

        <div className="report-preview-shell-stage">
          <div className="report-preview-shell-paper">
            <div
              id="report-preview-shell-preview-panel"
              className={[
                'report-preview-shell-panel',
                'report-preview-shell-panel--preview',
                resolvedActiveTab === 'preview'
                  ? 'report-preview-shell-panel--active'
                  : 'report-preview-shell-panel--inactive',
              ].join(' ')}
              role="tabpanel"
              aria-labelledby="report-preview-shell-preview-tab"
              aria-hidden={resolvedActiveTab !== 'preview'}
            >
              {preview}
            </div>

            <div
              id="report-preview-shell-data-panel"
              className={[
                'report-preview-shell-panel',
                'report-preview-shell-panel--data',
                resolvedActiveTab === 'data'
                  ? 'report-preview-shell-panel--active'
                  : 'report-preview-shell-panel--inactive',
              ].join(' ')}
              role="tabpanel"
              aria-labelledby="report-preview-shell-data-tab"
              aria-hidden={resolvedActiveTab !== 'data'}
            >
              {resolvedActiveTab === 'data' ? dataView : null}
            </div>
          </div>
        </div>
      </StyledReportPreviewShell>
    </LightThemeProvider>
  );
};

export default ReportPreviewShell;
