import type { HTMLAttributes, ReactNode } from 'react';

export interface ReportHeaderProps extends HTMLAttributes<HTMLElement> {
  companyName: string;
  companyLogo?: ReactNode;
  reportTitle: string;
  applicationName: string;
  environment: string;
  assessmentId: string;
  dateRange: string;
  testerName: string;
}
