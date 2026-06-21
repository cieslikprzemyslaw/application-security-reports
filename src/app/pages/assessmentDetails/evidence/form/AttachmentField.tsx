import React from 'react';

import Dropzone from '~/app/components/ui/dropzone';
import { formatFileSize } from '~/app/utils/formatters';
import {
  isEvidenceFileNameCompatibleWithMimeType,
  type SupportedEvidenceMimeType,
} from '~/domain/schemas/evidence-request.schema';

import {
  attachmentAcceptedTypes,
  MAX_ATTACHMENT_SIZE_BYTES,
} from './EvidenceForm.constants';
import {
  evidenceAttachmentFromFile,
  type EvidenceAttachmentValue,
} from './EvidenceForm.mapper';

interface AttachmentFieldProps {
  attachment?: EvidenceAttachmentValue;
  error?: string;
  selectionError?: string;
  onSelectionError: (error?: string) => void;
  onChange: (attachment: EvidenceAttachmentValue) => void;
}

const AttachmentField = ({
  attachment,
  error,
  selectionError,
  onSelectionError,
  onChange,
}: AttachmentFieldProps) => {
  const handleAttachmentSelection = (files: File[]) => {
    const file = files[0];

    if (!file) {
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      onSelectionError('Evidence attachment must be 5 MB or smaller.');
      return;
    }

    if (!file.type) {
      onSelectionError(
        'The selected file type is not supported by the evidence attachment allowlist.',
      );
      return;
    }

    if (
      !isEvidenceFileNameCompatibleWithMimeType(
        file.name,
        file.type as SupportedEvidenceMimeType,
      )
    ) {
      onSelectionError(
        'The selected file name extension does not match the selected file type.',
      );
      return;
    }

    onSelectionError(undefined);
    onChange(evidenceAttachmentFromFile(file));
  };

  const currentAttachmentDescription =
    attachment != null
      ? `${attachment.fileName} · ${attachment.mimeType} · ${formatFileSize(attachment.attachmentSizeBytes)}`
      : 'No attachment selected.';

  return (
    <div className="evidence-form-full-width">
      <Dropzone
        id="evidence-attachment"
        label="Attachment"
        description={`Accepted file types: PNG, JPEG, GIF, WEBP, PDF, JSON, TXT. Maximum size: ${formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)}.`}
        error={error ?? selectionError}
        acceptedTypes={attachmentAcceptedTypes}
        multiple={false}
        onFilesSelected={handleAttachmentSelection}
      />

      <p className="evidence-form-help evidence-form-attachment-summary">
        {currentAttachmentDescription}
      </p>
      {attachment && (
        <p className="evidence-form-help">
          Attachment metadata can be saved, but binary upload and later download
          are unavailable until the backend provides that contract.
        </p>
      )}
    </div>
  );
};

export default AttachmentField;
