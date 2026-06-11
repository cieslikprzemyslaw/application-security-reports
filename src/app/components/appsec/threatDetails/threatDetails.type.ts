import type { HTMLAttributes, ReactNode } from 'react';

import type { Severity, StrideCategory, ThreatStatus } from '~/domain';

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
