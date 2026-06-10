import React from 'react';

import StyledReportHeader from './reportHeader.styled';

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
    <div className="report-header-brand-row">
      <div className="report-header-company">
        {companyLogo && <div className="report-header-logo">{companyLogo}</div>}

        <strong className="report-header-company-name">{companyName}</strong>
      </div>

      <dl className="report-header-meta">
        <div className="report-header-meta-row">
          <dt className="report-header-meta-label">Assessment ID</dt>

          <dd className="report-header-meta-value">{assessmentId}</dd>
        </div>

        <div className="report-header-meta-row">
          <dt className="report-header-meta-label">Date range</dt>

          <dd className="report-header-meta-value">{dateRange}</dd>
        </div>

        <div className="report-header-meta-row">
          <dt className="report-header-meta-label">Tester</dt>

          <dd className="report-header-meta-value">{testerName}</dd>
        </div>
      </dl>
    </div>

    <div className="report-header-title-group">
      <h1 className="report-header-title">{reportTitle}</h1>

      <p className="report-header-subtitle">
        {applicationName} ({environment})
      </p>
    </div>
  </StyledReportHeader>
);

export default ReportHeader;
