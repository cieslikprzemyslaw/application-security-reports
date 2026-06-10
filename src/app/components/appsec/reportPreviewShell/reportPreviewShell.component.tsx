import React, { useState } from 'react';

import Button from '~/app/components/ui/button';

import StyledReportPreviewShell, {
  Actions,
  AutoSaved,
  Header,
  Paper,
  Stage,
  Subtitle,
  TabButton,
  Tabs,
  Title,
  Toolbar,
} from './reportPreviewShell.styled';

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
      <Header>
        <div>
          <Title>Report Preview</Title>

          <Subtitle>
            {applicationName}
            {' · '}
            {assessmentCode}
          </Subtitle>
        </div>
      </Header>

      <Toolbar>
        <Tabs>
          <TabButton
            type="button"
            $active={activeTab === 'preview'}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </TabButton>

          <TabButton
            type="button"
            $active={activeTab === 'data'}
            onClick={() => setActiveTab('data')}
          >
            Data
          </TabButton>
        </Tabs>

        <Actions>
          {autoSaved && <AutoSaved>✓ Auto-saved</AutoSaved>}

          {onPrint && (
            <Button title="Print" variant="secondary" onClick={onPrint} />
          )}

          {onDownloadPdf && (
            <Button title="Download PDF" onClick={onDownloadPdf} />
          )}
        </Actions>
      </Toolbar>

      <Stage>
        <Paper>{activeTab === 'preview' ? preview : dataView}</Paper>
      </Stage>
    </StyledReportPreviewShell>
  );
};

export default ReportPreviewShell;
