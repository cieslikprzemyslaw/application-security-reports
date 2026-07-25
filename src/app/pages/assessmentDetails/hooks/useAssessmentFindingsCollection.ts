import { useEffect, useRef, useState } from 'react';

import type { ThreatResponse } from '~/domain';
import { threatService } from '~/services';

export const useAssessmentFindingsCollection = (assessmentId?: string) => {
  const [threats, setThreats] = useState<ThreatResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedFindings, setHasLoadedFindings] = useState(false);
  const hasLoadedFindingsRef = useRef(false);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadFindings = async () => {
      if (!assessmentId) {
        if (isActive) {
          setIsLoading(false);
        }

        return;
      }

      setIsLoading(true);
      setLoadError(undefined);

      try {
        const nextFindings = await threatService.listByAssessment(
          assessmentId,
          controller.signal,
        );

        if (isActive) {
          setThreats(nextFindings);
          hasLoadedFindingsRef.current = true;
          setHasLoadedFindings(true);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        if (!hasLoadedFindingsRef.current) {
          setThreats([]);
        }

        setLoadError(
          error instanceof Error ? error.message : 'Unable to load findings.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadFindings();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [assessmentId, reloadKey]);

  return {
    threats,
    isLoading,
    isRefreshing: isLoading && hasLoadedFindings,
    hasLoadedFindings,
    loadError,
    reloadFindings: () => setReloadKey(key => key + 1),
    replaceFinding: (nextFinding: ThreatResponse) =>
      setThreats(current =>
        current.map(threat =>
          threat.id === nextFinding.id ? nextFinding : threat,
        ),
      ),
  };
};
