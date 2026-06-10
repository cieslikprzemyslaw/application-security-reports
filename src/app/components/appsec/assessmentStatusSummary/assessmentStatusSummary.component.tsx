import React from 'react';

import StyledAssessmentStatusSummary, {
  StatusSummaryItem,
  StatusSummaryLabel,
  StatusSummaryValue,
} from './assessmentStatusSummary.styled';

import type { AssessmentStatusSummaryProps } from './assessmentStatusSummary.type';

const AssessmentStatusSummary = ({
  items,
  ...rest
}: AssessmentStatusSummaryProps) => (
  <StyledAssessmentStatusSummary {...rest}>
    {items.map(item => (
      <StatusSummaryItem key={item.label} $tone={item.tone}>
        <StatusSummaryValue>{item.count}</StatusSummaryValue>

        <StatusSummaryLabel>{item.label}</StatusSummaryLabel>
      </StatusSummaryItem>
    ))}
  </StyledAssessmentStatusSummary>
);

export default AssessmentStatusSummary;
