import type {
  ISODateString,
  ReportVersionId,
  ReportVersionStatus,
} from './common.js';
import type { Report } from './report.js';

export interface ReportVersionSummary {
  id: ReportVersionId;
  version: number;
  status: ReportVersionStatus;
  generatedAt: ISODateString;
  createdAt: ISODateString;
}

export interface AssessmentReportListItem extends Report {
  versions: ReportVersionSummary[];
}
