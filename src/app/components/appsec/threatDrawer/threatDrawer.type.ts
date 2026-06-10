import type { ReactNode } from 'react';

import type { GlobalThreatRow } from '../globalThreatTable';

export interface ThreatDrawerProps {
  isOpen: boolean;
  threat?: GlobalThreatRow;
  description?: ReactNode;
  recommendation?: ReactNode;
  onClose: () => void;
  onEdit?: () => void;
}
