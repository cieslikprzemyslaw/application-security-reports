import ReportReadinessChecklist from '~/app/components/appsec/reportReadinessChecklist';
import Callout from '~/app/components/ui/callout';

import type { ReportReadinessResult, ReportReadinessTarget } from '~/domain';
import type { ReportReadinessControllerStatus } from './reportReadiness.controller';

interface ReportReadinessPanelProps {
  status: ReportReadinessControllerStatus;
  result?: ReportReadinessResult;
  message?: string;
  onTargetActivate: (target: ReportReadinessTarget) => void;
}

const ReportReadinessPanel = ({
  status,
  result,
  message,
  onTargetActivate,
}: ReportReadinessPanelProps) => {
  if (status === 'idle') {
    return null;
  }

  if (status === 'pending') {
    return (
      <section
        className="report-readiness-panel no-print"
        data-print-hidden="true"
        aria-live="polite"
      >
        <p role="status">{message ?? 'Checking Report readiness…'}</p>
      </section>
    );
  }

  if (status === 'error' || !result) {
    return (
      <section
        className="report-readiness-panel no-print"
        data-print-hidden="true"
      >
        <Callout variant="error" title="Unable to check Report readiness">
          <p>{message ?? 'Try again from Save as final.'}</p>
        </Callout>
      </section>
    );
  }

  return (
    <ReportReadinessChecklist
      result={result}
      onTargetActivate={onTargetActivate}
    />
  );
};

export default ReportReadinessPanel;
