import React, { useId } from 'react';

import Callout from '~/app/components/ui/callout';
import IconSVG from '~/app/components/ui/iconSVG';
import type {
  ReportReadinessErrorItem,
  ReportReadinessTarget,
  ReportReadinessWarningItem,
} from '~/domain/schemas';

import StyledReportReadinessChecklist from './reportReadinessChecklist.styled';
import type { ReportReadinessChecklistProps } from './reportReadinessChecklist.type';

const targetTypeLabels: Record<ReportReadinessTarget['resourceType'], string> =
  {
    report: 'Report',
    company: 'Company',
    assessment: 'Assessment',
    threat: 'Threat',
    evidence: 'Evidence',
  };

const formatFieldLabel = (field: string): string =>
  field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, character => character.toUpperCase());

const formatTargetLabel = (target: ReportReadinessTarget): string => {
  const resourceLabel = targetTypeLabels[target.resourceType];

  return target.field
    ? `${resourceLabel} · ${formatFieldLabel(target.field)}`
    : resourceLabel;
};

type ReadinessItem = ReportReadinessErrorItem | ReportReadinessWarningItem;

interface ReadinessItemListProps {
  items: ReadinessItem[];
  onTargetActivate?: (target: ReportReadinessTarget) => void;
}

const ReadinessItemList = ({
  items,
  onTargetActivate,
}: ReadinessItemListProps) => (
  <ul className="report-readiness-checklist__items">
    {items.map((item, index) => {
      const targetLabel = formatTargetLabel(item.target);
      const key = [
        item.code,
        item.target.resourceType,
        item.target.resourceId,
        item.target.field ?? '',
        index,
      ].join(':');

      const content = (
        <>
          <span className="report-readiness-checklist__message">
            {item.message}
          </span>
          <span className="report-readiness-checklist__target">
            {targetLabel}
          </span>
        </>
      );

      return (
        <li key={key} className="report-readiness-checklist__item">
          {onTargetActivate ? (
            <button
              type="button"
              className="report-readiness-checklist__target-button"
              aria-label={`${item.message} Review ${targetLabel}`}
              onClick={() => onTargetActivate(item.target)}
            >
              {content}
              <span
                className="report-readiness-checklist__action"
                aria-hidden="true"
              >
                Review
              </span>
            </button>
          ) : (
            <div className="report-readiness-checklist__item-content">
              {content}
            </div>
          )}
        </li>
      );
    })}
  </ul>
);

const ReportReadinessChecklist = ({
  result,
  heading = 'Report readiness',
  onTargetActivate,
  ...rest
}: ReportReadinessChecklistProps) => {
  const headingId = useId();
  const hasErrors = result.errors.length > 0;
  const hasWarnings = result.warnings.length > 0;
  const isEmpty = !hasErrors && !hasWarnings;

  return (
    <StyledReportReadinessChecklist
      {...rest}
      className={['report-readiness-checklist no-print', rest.className]
        .filter(Boolean)
        .join(' ')}
      data-print-hidden="true"
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="report-readiness-checklist__heading">
        {heading}
      </h3>

      {hasErrors && (
        <Callout
          variant="error"
          title={`${result.errors.length} blocking ${result.errors.length === 1 ? 'issue' : 'issues'}`}
          icon={<IconSVG name="warning" />}
        >
          <ReadinessItemList
            items={result.errors}
            onTargetActivate={onTargetActivate}
          />
        </Callout>
      )}

      {hasWarnings && (
        <Callout
          variant="warning"
          title={`${result.warnings.length} ${result.warnings.length === 1 ? 'warning' : 'warnings'}`}
          icon={<IconSVG name="warning" />}
        >
          <ReadinessItemList
            items={result.warnings}
            onTargetActivate={onTargetActivate}
          />
        </Callout>
      )}

      {isEmpty && (
        <Callout
          variant="success"
          title="No readiness issues"
          icon={<IconSVG name="success" />}
        >
          <p>The backend returned no blocking issues or warnings.</p>
        </Callout>
      )}
    </StyledReportReadinessChecklist>
  );
};

export default ReportReadinessChecklist;
