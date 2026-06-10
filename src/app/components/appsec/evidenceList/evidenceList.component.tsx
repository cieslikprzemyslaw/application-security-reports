import React from 'react';

import {
  EvidenceContent,
  EvidenceDescription,
  EvidenceDetails,
  EvidenceEmpty,
  EvidenceHeader,
  EvidenceListItem,
  EvidenceMetadata,
  EvidenceName,
  EvidencePreview,
  EvidenceRemoveButton,
  StyledEvidenceList,
} from './evidenceList.styled';

import type {
  EvidenceItem,
  EvidenceKind,
  EvidenceListProps,
} from './evidenceList.type';

const FileIcon = ({ kind }: { kind: EvidenceKind }) => {
  if (kind === 'image') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" />

        <circle cx="8.5" cy="9" r="1.5" strokeWidth="2" />

        <path
          d="m4 17 5-5 4 4 2-2 5 5"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path d="M6 3h8l4 4v14H6z" strokeWidth="2" strokeLinejoin="round" />

      <path d="M14 3v5h5" strokeWidth="2" />
    </svg>
  );
};

const EvidenceList = ({
  items,
  emptyState,
  onOpen,
  onRemove,
  ...rest
}: EvidenceListProps) => (
  <StyledEvidenceList {...rest}>
    {items.length === 0 ? (
      <EvidenceEmpty>{emptyState ?? 'No evidence added.'}</EvidenceEmpty>
    ) : (
      items.map(item => {
        const kind = item.kind ?? 'document';

        return (
          <EvidenceListItem key={item.id}>
            <EvidencePreview
              type="button"
              aria-label={`Open ${item.filename}`}
              disabled={!onOpen}
              onClick={() => onOpen?.(item)}
            >
              {item.previewUrl ? (
                <img src={item.previewUrl} alt="" />
              ) : (
                (item.icon ?? <FileIcon kind={kind} />)
              )}
            </EvidencePreview>

            <EvidenceContent>
              <EvidenceHeader>
                <EvidenceDetails>
                  <EvidenceName
                    type="button"
                    disabled={!onOpen}
                    onClick={() => onOpen?.(item)}
                  >
                    {item.filename}
                  </EvidenceName>

                  {(item.mimeType || item.sizeLabel) && (
                    <EvidenceMetadata>
                      {[item.mimeType, item.sizeLabel]
                        .filter(Boolean)
                        .join(' · ')}
                    </EvidenceMetadata>
                  )}
                </EvidenceDetails>

                {onRemove && (
                  <EvidenceRemoveButton
                    type="button"
                    aria-label={`Remove ${item.filename}`}
                    onClick={() => onRemove(item)}
                  >
                    Remove
                  </EvidenceRemoveButton>
                )}
              </EvidenceHeader>

              {item.description && (
                <EvidenceDescription>{item.description}</EvidenceDescription>
              )}
            </EvidenceContent>
          </EvidenceListItem>
        );
      })
    )}
  </StyledEvidenceList>
);

export default EvidenceList;
