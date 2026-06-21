import { useCallback, useEffect } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';

export interface DirtyFormGuardControls {
  isBlocked: boolean;
  proceed: () => void;
  cancel: () => void;
}

export const useDirtyFormGuard = (isDirty: boolean): DirtyFormGuardControls => {
  const blocker = useBlocker(isDirty);
  const { reset, state } = blocker;

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
  }, [isDirty, reset, state]);

  const proceed = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker]);

  const cancel = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  return {
    isBlocked: blocker.state === 'blocked',
    proceed,
    cancel,
  };
};
