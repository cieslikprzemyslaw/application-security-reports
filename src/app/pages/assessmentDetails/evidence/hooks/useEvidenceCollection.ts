import { useEffect, useRef, useState } from 'react';

import type { Evidence } from '~/domain';
import { evidenceService } from '~/services';

export const useEvidenceCollection = (assessmentId?: string) => {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedEvidence, setHasLoadedEvidence] = useState(false);
  const hasLoadedEvidenceRef = useRef(false);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadEvidence = async () => {
      if (!assessmentId) {
        if (isActive) {
          setIsLoading(false);
        }

        return;
      }

      setIsLoading(true);
      setLoadError(undefined);

      try {
        const nextEvidence = await evidenceService.list(
          { assessmentId },
          controller.signal,
        );

        if (isActive) {
          setEvidence(nextEvidence);
          hasLoadedEvidenceRef.current = true;
          setHasLoadedEvidence(true);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        if (!hasLoadedEvidenceRef.current) {
          setEvidence([]);
        }

        setLoadError(
          error instanceof Error ? error.message : 'Unable to load evidence.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadEvidence();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [assessmentId, reloadKey]);

  return {
    evidence,
    isLoading,
    isRefreshing: isLoading && hasLoadedEvidence,
    hasLoadedEvidence,
    loadError,
    reloadEvidence: () => setReloadKey(key => key + 1),
  };
};
