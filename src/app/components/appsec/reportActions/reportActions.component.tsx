import React, { Fragment, useId, type KeyboardEvent } from 'react';

import Button, { type ButtonVariant } from '~/app/components/ui/button';

import StyledReportActions from './reportActions.styled';

import type {
  ReportActionConfig,
  ReportActionName,
  ReportActionsProps,
} from './reportActions.type';

interface ReportActionDefinition {
  name: ReportActionName;
  label: string;
  pendingLabel: string;
  defaultVariant: ButtonVariant;
}

const actionDefinitions: readonly ReportActionDefinition[] = [
  {
    name: 'backToEditor',
    label: 'Back to editor',
    pendingLabel: 'Returning to editor',
    defaultVariant: 'tertiary',
  },
  {
    name: 'generatePreview',
    label: 'Generate preview',
    pendingLabel: 'Generating preview',
    defaultVariant: 'secondary',
  },
  {
    name: 'saveDraft',
    label: 'Save draft',
    pendingLabel: 'Saving draft',
    defaultVariant: 'secondary',
  },
  {
    name: 'saveAsFinal',
    label: 'Save as final',
    pendingLabel: 'Saving as final',
    defaultVariant: 'secondary',
  },
  {
    name: 'generatePdf',
    label: 'Generate PDF',
    pendingLabel: 'Opening print dialog',
    defaultVariant: 'secondary',
  },
];

const navigationKeys = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

const ReportActions = ({
  backToEditor,
  generatePreview,
  saveDraft,
  saveAsFinal,
  generatePdf,
  primaryAction,
  className,
  onKeyDown,
  ...rest
}: ReportActionsProps) => {
  const descriptionIdPrefix = useId();

  const actions: Record<ReportActionName, ReportActionConfig | undefined> = {
    backToEditor,
    generatePreview,
    saveDraft,
    saveAsFinal,
    generatePdf,
  };

  const handleToolbarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);

    if (event.defaultPrevented || !navigationKeys.has(event.key)) {
      return;
    }

    const enabledButtons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        'button:not(:disabled)',
      ),
    );
    const currentIndex = enabledButtons.indexOf(
      event.target as HTMLButtonElement,
    );

    if (currentIndex < 0 || enabledButtons.length === 0) {
      return;
    }

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % enabledButtons.length;
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex =
          (currentIndex - 1 + enabledButtons.length) % enabledButtons.length;
        break;

      case 'Home':
        nextIndex = 0;
        break;

      case 'End':
        nextIndex = enabledButtons.length - 1;
        break;

      default:
        return;
    }

    event.preventDefault();
    enabledButtons[nextIndex]?.focus();
  };

  return (
    <StyledReportActions
      {...rest}
      className={['report-actions no-print', className]
        .filter(Boolean)
        .join(' ')}
      role={rest.role ?? 'toolbar'}
      aria-label={rest['aria-label'] ?? 'Report actions'}
      data-print-hidden="true"
      onKeyDown={handleToolbarKeyDown}
    >
      {actionDefinitions.map(definition => {
        const action = actions[definition.name];

        if (!action) {
          return null;
        }

        const isPending = action.isPending ?? false;
        const isDisabled = action.isDisabled ?? false;
        const isPrimary = primaryAction === definition.name;
        let disabledReason: string | undefined;

        if (isPending) {
          disabledReason = `${definition.pendingLabel}.`;
        } else if (isDisabled) {
          disabledReason =
            action.disabledReason ??
            `${definition.label} is currently unavailable.`;
        }

        const disabledReasonId = disabledReason
          ? `${descriptionIdPrefix}-${definition.name}-reason`
          : undefined;

        return (
          <Fragment key={definition.name}>
            <Button
              className={[
                'report-actions__action',
                `report-actions__action--${definition.name}`,
                isPrimary ? 'report-actions__action--primary' : undefined,
              ]
                .filter(Boolean)
                .join(' ')}
              data-report-action={definition.name}
              title={isPending ? definition.pendingLabel : definition.label}
              variant={isPrimary ? 'primary' : definition.defaultVariant}
              isLoading={isPending}
              disabled={isDisabled}
              aria-describedby={disabledReasonId}
              onClick={action.onActivate}
            />

            {disabledReason && (
              <span
                id={disabledReasonId}
                className="report-actions__disabled-reason"
              >
                {disabledReason}
              </span>
            )}
          </Fragment>
        );
      })}
    </StyledReportActions>
  );
};

export default ReportActions;
