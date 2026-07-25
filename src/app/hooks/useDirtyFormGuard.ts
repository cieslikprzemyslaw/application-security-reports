import { useCallback, useEffect, useState } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';

export interface DirtyFormGuardControls {
  isBlocked: boolean;
  proceed: () => void;
  cancel: () => void;
  requestDiscard: (action: () => void) => boolean;
}

export type DirtyFormNavigationPredicate = (
  currentPathname: string,
  nextPathname: string,
) => boolean;

export const useDirtyFormGuard = (
  isDirty: boolean,
  shouldBlockNavigation?: DirtyFormNavigationPredicate,
): DirtyFormGuardControls => {
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    isDirty
      ? (shouldBlockNavigation?.(
          currentLocation.pathname,
          nextLocation.pathname,
        ) ?? true)
      : false,
  );
  const { reset, state } = blocker;
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (!isDirty) return;
        event.preventDefault();
        event.returnValue = '';
      },
      [isDirty],
    ),
  );

  useEffect(() => {
    if (!isDirty && state === 'blocked') {
      reset();
    }

    if (!isDirty && pendingAction) {
      const action = pendingAction;
      const timeoutId = window.setTimeout(() => {
        setPendingAction(null);
        action();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [isDirty, pendingAction, reset, state]);

  const requestDiscard = useCallback(
    (action: () => void) => {
      if (!isDirty) {
        action();
        return true;
      }

      setPendingAction(() => action);
      return false;
    },
    [isDirty],
  );

  const proceed = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
      return;
    }

    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      action();
    }
  }, [blocker, pendingAction]);

  const cancel = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }

    setPendingAction(null);
  }, [blocker]);

  return {
    isBlocked: blocker.state === 'blocked' || pendingAction !== null,
    proceed,
    cancel,
    requestDiscard,
  };
};
