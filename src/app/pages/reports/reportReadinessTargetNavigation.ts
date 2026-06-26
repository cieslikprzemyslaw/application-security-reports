import { useCallback, useEffect, useState } from 'react';

import type { ReportBuilderState, ReportReadinessTarget } from '~/domain';
import type { ReportPreviewShellTab } from '~/app/components/appsec/reportPreviewShell';

export type ReportReadinessExternalNavigator = (
  target: ReportReadinessTarget,
  builderState: ReportBuilderState,
) => void;

interface UseReportReadinessTargetNavigationOptions {
  activeView: ReportPreviewShellTab;
  builderState: ReportBuilderState;
  onViewChange?: (
    view: ReportPreviewShellTab,
    state: ReportBuilderState,
  ) => void;
  onExternalNavigate?: ReportReadinessExternalNavigator;
}

const findResourceElement = (
  target: ReportReadinessTarget,
): HTMLElement | undefined =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-readiness-resource-type][data-readiness-resource-id]',
    ),
  ).find(
    element =>
      element.dataset.readinessResourceType === target.resourceType &&
      element.dataset.readinessResourceId === target.resourceId,
  );

export const findReportReadinessTargetElement = (
  target: ReportReadinessTarget,
): HTMLElement | undefined => {
  if (target.resourceType === 'report') {
    if (target.field === 'selection.evidenceIds') {
      return (
        document.getElementById('report-builder-include-evidence') ?? undefined
      );
    }

    if (target.field === 'selection.threatIds') {
      return document.getElementById('report-builder-tree-title') ?? undefined;
    }

    return document.getElementById('report-preview-shell-title') ?? undefined;
  }

  if (target.resourceType === 'company') {
    return document.getElementById('report-builder-tree-title') ?? undefined;
  }

  return findResourceElement(target);
};

export const useReportReadinessTargetNavigation = ({
  activeView,
  builderState,
  onViewChange,
  onExternalNavigate,
}: UseReportReadinessTargetNavigationOptions) => {
  const [focusTarget, setFocusTarget] = useState<ReportReadinessTarget>();

  const activateTarget = useCallback(
    (target: ReportReadinessTarget) => {
      if (target.resourceType === 'report' && target.field === 'brandingMode') {
        onExternalNavigate?.(target, builderState);
        return;
      }

      setFocusTarget({ ...target });

      if (activeView !== 'data') {
        onViewChange?.('data', builderState);
      }
    },
    [activeView, builderState, onExternalNavigate, onViewChange],
  );

  useEffect(() => {
    if (!focusTarget || activeView !== 'data') {
      return undefined;
    }

    let observer: MutationObserver | undefined;
    let timeoutId: number | undefined;
    let isActive = true;

    const cleanup = () => {
      observer?.disconnect();

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };

    const tryFocus = () => {
      if (!isActive) {
        return false;
      }

      const element = findReportReadinessTargetElement(focusTarget);

      if (!element || element.closest('[hidden]')) {
        return false;
      }

      element.focus();

      if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({
          block: 'center',
          inline: 'nearest',
        });
      }

      cleanup();
      return true;
    };

    if (!tryFocus()) {
      observer = new MutationObserver(() => {
        tryFocus();
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['hidden'],
      });
      timeoutId = window.setTimeout(() => {
        cleanup();
      }, 5000);
    }

    return () => {
      isActive = false;
      cleanup();
    };
  }, [activeView, focusTarget]);

  return {
    activateTarget,
    focusTarget,
  };
};
