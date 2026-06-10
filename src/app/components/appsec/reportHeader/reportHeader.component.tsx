import React from 'react';

import StyledReportHeader, {
  ReportBrandRow,
  ReportCompany,
  ReportCompanyName,
  ReportLogo,
  ReportMeta,
  ReportMetaLabel,
  ReportMetaRow,
  ReportMetaValue,
  ReportSubtitle,
  ReportTitle,
  ReportTitleGroup,
} from './reportHeader.styled';

import type { ReportHeaderProps } from './reportHeader.type';

const ReportHeader = ({
  companyName,
  companyLogo,
  reportTitle,
  applicationName,
  environment,
  assessmentId,
  dateRange,
  testerName,
  ...rest
}: ReportHeaderProps) => (
  <StyledReportHeader {...rest}>
    <ReportBrandRow>
      <ReportCompany>
        {companyLogo && <ReportLogo>{companyLogo}</ReportLogo>}

        <ReportCompanyName>{companyName}</ReportCompanyName>
      </ReportCompany>

      <ReportMeta>
        <ReportMetaRow>
          <ReportMetaLabel>Assessment ID</ReportMetaLabel>

          <ReportMetaValue>{assessmentId}</ReportMetaValue>
        </ReportMetaRow>

        <ReportMetaRow>
          <ReportMetaLabel>Date range</ReportMetaLabel>

          <ReportMetaValue>{dateRange}</ReportMetaValue>
        </ReportMetaRow>

        <ReportMetaRow>
          <ReportMetaLabel>Tester</ReportMetaLabel>

          <ReportMetaValue>{testerName}</ReportMetaValue>
        </ReportMetaRow>
      </ReportMeta>
    </ReportBrandRow>

    <ReportTitleGroup>
      <ReportTitle>{reportTitle}</ReportTitle>

      <ReportSubtitle>
        {applicationName} ({environment})
      </ReportSubtitle>
    </ReportTitleGroup>
  </StyledReportHeader>
);

export default ReportHeader;
