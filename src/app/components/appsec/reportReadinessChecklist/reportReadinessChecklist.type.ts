import type { HTMLAttributes } from 'react';

import type {
  ReportReadinessResult,
  ReportReadinessTarget,
} from '~/domain/schemas';

export interface ReportReadinessChecklistProps extends HTMLAttributes<HTMLElement> {
  result: ReportReadinessResult;
  heading?: string;
  onTargetActivate?: (target: ReportReadinessTarget) => void;
}
