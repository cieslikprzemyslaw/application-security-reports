import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';

import StyledReportCover, {
  Brand,
  BrandMeta,
  BrandName,
  BrandRow,
  Confidential,
  Eyebrow,
  Finding,
  FindingGrid,
  FindingHeader,
  FindingSection,
  FindingsList,
  FindingTitle,
  Footer,
  Logo,
  MetaGrid,
  MetaItem,
  MetaLabel,
  MetaValue,
  RiskBox,
  ScopeList,
  Section,
  SectionTitle,
  Subtitle,
  SummaryBox,
  Title,
} from './reportCover.styled';

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
    <BrandRow>
      <Brand>
        {companyLogo && <Logo>{companyLogo}</Logo>}

        <div>
          <BrandName>{companyName}</BrandName>

          <BrandMeta>{companyWebsite}</BrandMeta>

          {companyContactEmail && <BrandMeta>{companyContactEmail}</BrandMeta>}
        </div>
      </Brand>

      <Confidential>
        {confidential && <strong>● Confidential</strong>}

        <span>Report ID: {reportId}</span>

        <span>Issued: {issuedDate}</span>
      </Confidential>
    </BrandRow>

    <div>
      <Eyebrow>Application Security Assessment</Eyebrow>

      <Title>
        {applicationName}
        <br />
        Security Assessment Report
      </Title>

      <Subtitle>
        Web Application Security Assessment
        {' — '}
        {environment}
        {' · '}
        Prepared for {companyName}
      </Subtitle>
    </div>

    <MetaGrid>
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
        <MetaItem key={label}>
          <MetaLabel>{label}</MetaLabel>

          <MetaValue>{value}</MetaValue>
        </MetaItem>
      ))}
    </MetaGrid>

    <Section>
      <SectionTitle>1. Executive Summary</SectionTitle>

      <SummaryBox>
        <RiskBox $risk={overallRisk}>
          <span>Overall Risk</span>

          <strong>{overallRisk.toUpperCase()}</strong>
        </RiskBox>

        <p>{executiveSummary}</p>
      </SummaryBox>
    </Section>

    {scope.length > 0 && (
      <Section>
        <SectionTitle>2. Scope and Methodology</SectionTitle>

        <ScopeList>
          {scope.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ScopeList>
      </Section>
    )}

    {findings.length > 0 && (
      <Section>
        <SectionTitle>3. Detailed Findings</SectionTitle>

        <FindingsList>
          {findings.map((finding, index) => (
            <Finding key={finding.id}>
              <FindingHeader>
                <div>
                  <FindingTitle>
                    {index + 1}. {finding.title}
                  </FindingTitle>

                  <BrandMeta>{finding.affectedAsset}</BrandMeta>
                </div>

                <div>
                  <SeverityBadge severity={finding.severity} size="small" />

                  <StatusBadge
                    status={
                      finding.status as
                        | 'Open'
                        | 'In Progress'
                        | 'Resolved'
                        | 'Retest Required'
                        | 'Accepted Risk'
                    }
                    size="small"
                  />
                </div>
              </FindingHeader>

              <FindingGrid>
                <FindingSection>
                  <h4>Observation</h4>

                  <p>{finding.observation}</p>
                </FindingSection>

                <FindingSection>
                  <h4>Risk</h4>

                  <p>{finding.risk}</p>
                </FindingSection>

                <FindingSection>
                  <h4>Recommendation</h4>

                  <p>{finding.recommendation}</p>
                </FindingSection>

                {finding.evidence && (
                  <FindingSection>
                    <h4>Evidence</h4>

                    <div>{finding.evidence}</div>
                  </FindingSection>
                )}
              </FindingGrid>
            </Finding>
          ))}
        </FindingsList>
      </Section>
    )}

    {footerText && <Footer>{footerText}</Footer>}
  </StyledReportCover>
);

export default ReportCover;
