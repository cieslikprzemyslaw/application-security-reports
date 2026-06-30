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
  logoUrl?: string | null;
  applicationCount: number;
  website: string;
  primaryContact: string;
  assessmentCount: number;
  openThreats: number;
  riskPosture: Severity;
}

export interface CompanyTableProps {
  companies: CompanyTableRow[];
  activeCompanyId?: string;
  onCompanyClick?: (company: CompanyTableRow) => void;
  onEditCompany?: (company: CompanyTableRow) => void;
  emptyState?: ReactNode;
}
