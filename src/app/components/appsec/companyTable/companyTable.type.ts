import type { ReactNode } from 'react';

import type { Severity } from '~/app/components/ui/severityBadge';

export type CompanyLogoTone =
  | 'blue'
  | 'cyan'
  | 'orange'
  | 'green'
  | 'purple'
  | 'slate';

export interface CompanyTableRow {
  id: string;
  name: string;
  initials: string;
  logoTone?: CompanyLogoTone;
  applicationCount: number;
  website: string;
  primaryContact: string;
  assessmentCount: number;
  openThreats: number;
  riskPosture: Severity;
}

export interface CompanyTableProps {
  companies: CompanyTableRow[];
  onCompanyClick?: (company: CompanyTableRow) => void;
  emptyState?: ReactNode;
}
