import React from 'react';

import SeverityBadge from '~/app/components/ui/severityBadge';
import StatusBadge from '~/app/components/ui/statusBadge';

import StyledAssessmentSummary from './assessmentSummary.styled';

import type {
  AssessmentMetadataItem as AssessmentMetadataItemType,
  AssessmentSummaryProps,
} from './assessmentSummary.type';

const AssessmentSummary = ({
  companyName,
  companyLogo,
  applicationName,
  assessmentId,
  environment,
  dateRange,
  testerName,
  overallRisk,
  status,
  metadata = [],
  ...rest
}: AssessmentSummaryProps) => {
  const defaultMetadata: AssessmentMetadataItemType[] = [
    {
      label: 'Environment',
      value: environment,
    },
    {
      label: 'Date range',
      value: dateRange,
    },
    {
      label: 'Tester',
      value: testerName,
    },
    {
      label: 'Assessment ID',
      value: assessmentId,
    },
  ];

  const allMetadata: AssessmentMetadataItemType[] = [
    ...defaultMetadata,
    ...metadata,
  ];

  return (
    <StyledAssessmentSummary {...rest}>
      <div className="assessment-summary-header">
        <div className="assessment-summary-identity">
          {companyLogo && (
            <div className="assessment-summary-company-logo">{companyLogo}</div>
          )}

          <div className="assessment-summary-title-group">
            <p className="assessment-summary-company-name">{companyName}</p>

            <h2 className="assessment-summary-application-name">
              {applicationName}
            </h2>
          </div>
        </div>

        <div className="assessment-summary-badges">
          <SeverityBadge severity={overallRisk} />

          <StatusBadge status={status} />
        </div>
      </div>

      <dl className="assessment-summary-metadata-grid">
        {allMetadata.map(item => (
          <div key={item.label} className="assessment-summary-metadata-item">
            <dt className="assessment-summary-metadata-label">{item.label}</dt>

            <dd className="assessment-summary-metadata-value">
              {item.icon}
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </StyledAssessmentSummary>
  );
};

export default AssessmentSummary;
