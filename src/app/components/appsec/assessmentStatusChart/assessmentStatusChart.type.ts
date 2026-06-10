import type { HTMLAttributes } from 'react';

export type AssessmentStatusTone =
  | 'completed'
  | 'inProgress'
  | 'inReview'
  | 'draft';

export interface AssessmentStatusChartItem {
  label: string;
  count: number;
  tone: AssessmentStatusTone;
}

export interface AssessmentStatusChartProps extends HTMLAttributes<HTMLDivElement> {
  items: AssessmentStatusChartItem[];
  centreLabel?: string;
}
