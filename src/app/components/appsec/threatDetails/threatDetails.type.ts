import type { HTMLAttributes, ReactNode } from 'react';

import type { Severity } from '~/app/components/ui/severityBadge';
import type { ThreatStatus } from '~/app/components/ui/statusBadge';

import type { StrideCategory } from '../threatForm';

export interface ThreatDetailsProps extends HTMLAttributes<HTMLElement> {
  title: string;
  threatId: string;
  severity: Severity;
  status: ThreatStatus;
  strideCategory: StrideCategory;
  affectedComponent?: string;
  affectedEndpoint?: string;
  observation: ReactNode;
  risk: ReactNode;
  recommendation: ReactNode;
  references?: ReactNode;
  evidence?: ReactNode;
  actions?: ReactNode;
}
