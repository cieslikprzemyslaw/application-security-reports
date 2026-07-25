import type { AssessmentStatus } from './common.js';
import type { Threat } from './threat.js';

export const THREAT_REVIEW_COMMANDS = [
  'submit-review',
  'approve',
  'request-changes',
  'reopen',
] as const;

export type ThreatReviewCommand = (typeof THREAT_REVIEW_COMMANDS)[number];

export interface ThreatReviewAction {
  command: ThreatReviewCommand;
  label: string;
  allowed: boolean;
  reason?: string;
}

export interface ThreatReviewCandidate {
  title?: string | null;
  owaspCategoryCode?: string | null;
  customCategory?: string | null;
  affectedComponent?: string | null;
  reproductionSteps?: string | null;
  observation?: string | null;
  impact?: string | null;
  risk?: string | null;
  remediation?: string | null;
  recommendation?: string | null;
  references?: string | null;
}

const hasText = (value?: string | null) => Boolean(value?.trim().length);

export const isThreatReadyForReview = (threat: ThreatReviewCandidate) =>
  hasText(threat.title) &&
  hasText(threat.owaspCategoryCode) &&
  (threat.owaspCategoryCode !== 'custom' || hasText(threat.customCategory)) &&
  hasText(threat.affectedComponent) &&
  hasText(threat.reproductionSteps ?? threat.observation) &&
  hasText(threat.impact ?? threat.risk) &&
  hasText(threat.remediation ?? threat.recommendation) &&
  hasText(threat.references);

export const getThreatReviewActions = (
  threat: Threat,
  assessmentStatus?: AssessmentStatus,
): ThreatReviewAction[] => {
  if (assessmentStatus === 'archived') {
    return [];
  }

  if (threat.status === 'open') {
    const allowed = isThreatReadyForReview(threat);

    return [
      {
        command: 'submit-review',
        label: 'Submit for review',
        allowed,
        ...(allowed
          ? {}
          : {
              reason:
                'Complete the required Threat details before submitting for review.',
            }),
      },
    ];
  }

  if (threat.status === 'in-review') {
    return [
      {
        command: 'approve',
        label: 'Approve resolution',
        allowed: true,
      },
      {
        command: 'request-changes',
        label: 'Request changes',
        allowed: true,
      },
    ];
  }

  if (threat.status === 'resolved') {
    return [
      {
        command: 'reopen',
        label: 'Reopen threat',
        allowed: true,
      },
    ];
  }

  return [];
};
