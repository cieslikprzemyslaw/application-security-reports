import type { ActivityItem } from '~/app/components/common/activityFeed';
import type { AssessmentStatusChartItem } from '~/app/components/appsec/assessmentStatusChart';
import type { RecentAssessmentRow } from '~/app/components/appsec/recentAssessmentTable';
import type { SeverityDistributionItem } from '~/app/components/appsec/severityDistribution';

export type DashboardPeriod = '90' | '30' | 'all';

export interface DashboardStats {
  totalAssessments: number;
  totalAssessmentsChange: number;
  openThreats: number;
  openThreatsChange: number;
  criticalHighFindings: number;
  criticalHighChange: number;
  retestRequired: number;
  retestRequiredChange: number;
}

export interface DashboardProps {
  stats: DashboardStats;
  severityDistribution: SeverityDistributionItem[];
  assessmentStatuses: AssessmentStatusChartItem[];
  recentAssessments: RecentAssessmentRow[];
  recentActivity: ActivityItem[];
  selectedPeriod: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  onCreateAssessment?: () => void;
  onViewAllAssessments?: () => void;
  onAssessmentClick?: (assessment: RecentAssessmentRow) => void;
}
