import { useCallback } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';

export interface DirtyFormGuardControls {
  isBlocked: boolean;
  proceed: () => void;
  cancel: () => void;
}

export const useDirtyFormGuard = (isDirty: boolean): DirtyFormGuardControls => {
  const blocker = useBlocker(isDirty);

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
