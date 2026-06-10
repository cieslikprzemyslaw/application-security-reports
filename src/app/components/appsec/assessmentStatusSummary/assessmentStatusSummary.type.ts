import type { HTMLAttributes } from 'react';

export interface AssessmentStatusItem {
  label: string;
  count: number;
  tone: 'brand' | 'success' | 'warning' | 'neutral';
}

export interface AssessmentStatusSummaryProps extends HTMLAttributes<HTMLDivElement> {
  items: AssessmentStatusItem[];
}
