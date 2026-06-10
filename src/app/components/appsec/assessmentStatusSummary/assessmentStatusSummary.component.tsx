import React from 'react';

import StyledAssessmentStatusSummary from './assessmentStatusSummary.styled';

import type { AssessmentStatusSummaryProps } from './assessmentStatusSummary.type';

const AssessmentStatusSummary = ({
  items,
  ...rest
}: AssessmentStatusSummaryProps) => (
  <StyledAssessmentStatusSummary {...rest}>
    {items.map(item => (
      <div
        key={item.label}
        className={[
          'assessment-status-summary-item',
          `assessment-status-summary-item--${item.tone}`,
        ].join(' ')}
      >
        <strong className="assessment-status-summary-value">
          {item.count}
        </strong>

        <span className="assessment-status-summary-label">{item.label}</span>
      </div>
    ))}
  </StyledAssessmentStatusSummary>
);

export default AssessmentStatusSummary;
