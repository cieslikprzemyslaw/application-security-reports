import { useState } from 'react';

import type { Evidence } from '~/domain';

export const useEvidenceDownload = () => {
  const [downloadTargetId, setDownloadTargetId] = useState<
    string | undefined
  >();
  const [downloadError, setDownloadError] = useState<string | undefined>();

  const downloadAttachment = async (evidence: Evidence) => {
    setDownloadError(undefined);
    setDownloadTargetId(evidence.id);

    try {
      setDownloadError(
        'Attachment download is unavailable because the current backend stores only attachment metadata, not retrievable binary content.',
      );
    } finally {
      setDownloadTargetId(undefined);
    }
  };

  return {
    downloadTargetId,
    downloadError,
    setDownloadError,
    downloadAttachment,
  };
};
