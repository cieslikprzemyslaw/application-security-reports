import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';

import StyledReportCover from './reportCover.styled';

import type { ReportCoverProps } from './reportCover.type';

const ReportCover = ({
  companyName,
  companyLogo,
  companyWebsite,
  companyContactEmail,
  reportId,
  issuedDate,
  applicationName,
  environment,
  engagementDate,
  testerName,
  methodology,
  findingsCount,
  overallRisk,
  executiveSummary,
  scope = [],
  findings = [],
  footerText,
  confidential = true,
}: ReportCoverProps) => (
  <StyledReportCover>
    <div className="report-cover-brand-row">
      <div className="report-cover-brand">
        {companyLogo && <div className="report-cover-logo">{companyLogo}</div>}

        <div>
          <strong className="report-cover-brand-name">{companyName}</strong>

          <span className="report-cover-brand-meta">{companyWebsite}</span>

          {companyContactEmail && (
            <span className="report-cover-brand-meta">
              {companyContactEmail}
            </span>
          )}
        </div>
      </div>

      <div className="report-cover-confidential">
        {confidential && <strong>● Confidential</strong>}

        <span>Report ID: {reportId}</span>

        <span>Issued: {issuedDate}</span>
      </div>
    </div>

    <div>
      <p className="report-cover-eyebrow">Application Security Assessment</p>

      <h1 className="report-cover-title">
        {applicationName}
        <br />
        Security Assessment Report
      </h1>

      <p className="report-cover-subtitle">
        Web Application Security Assessment
        {' — '}
        {environment}
        {' · '}
        Prepared for {companyName}
      </p>
    </div>

    <dl className="report-cover-meta-grid">
      {[
        ['Application', applicationName],
        ['Environment', environment],
        ['Engagement', engagementDate],
        ['Overall Risk', overallRisk],
        ['Tester', testerName],
        ['Methodology', methodology],
        ['Findings', `${findingsCount} confirmed`],
        ['Report ID', reportId],
      ].map(([label, value]) => (
        <div key={label} className="report-cover-meta-item">
          <dt className="report-cover-meta-label">{label}</dt>

          <dd className="report-cover-meta-value">{value}</dd>
        </div>
      ))}
    </dl>

    <section className="report-cover-section">
      <h2 className="report-cover-section-title">1. Executive Summary</h2>

      <div className="report-cover-summary-box">
        <div className="report-cover-risk-box" data-risk={overallRisk}>
          <span>Overall Risk</span>

          <strong>{overallRisk.toUpperCase()}</strong>
        </div>

        <p>{executiveSummary}</p>
      </div>
    </section>

    {scope.length > 0 && (
      <section className="report-cover-section">
        <h2 className="report-cover-section-title">2. Scope and Methodology</h2>

        <ul className="report-cover-scope-list">
          {scope.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    )}

    {findings.length > 0 && (
      <section className="report-cover-section">
        <h2 className="report-cover-section-title">3. Detailed Findings</h2>

        <div className="report-cover-findings-list">
          {findings.map((finding, index) => (
            <article key={finding.id} className="report-cover-finding">
              <div className="report-cover-finding-header">
                <div>
                  <h3 className="report-cover-finding-title">
                    {index + 1}. {finding.title}
                  </h3>

                  <span className="report-cover-brand-meta">
                    {finding.affectedAsset}
                  </span>
                </div>

                <div>
                  <SeverityBadge severity={finding.severity} size="small" />

                  <StatusBadge status={finding.status} size="small" />
                </div>
              </div>

              <div className="report-cover-finding-grid">
                <div className="report-cover-finding-section">
                  <h4>Observation</h4>

                  <p>{finding.observation}</p>
                </div>

                <div className="report-cover-finding-section">
                  <h4>Risk</h4>

                  <p>{finding.risk}</p>
                </div>

                <div className="report-cover-finding-section">
                  <h4>Recommendation</h4>

                  <p>{finding.recommendation}</p>
                </div>

                {finding.evidence && (
                  <div className="report-cover-finding-section">
                    <h4>Evidence</h4>

                    <div>{finding.evidence}</div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    )}

    {footerText && (
      <footer className="report-cover-footer">{footerText}</footer>
    )}
  </StyledReportCover>
);

export default ReportCover;
