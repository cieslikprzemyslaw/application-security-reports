import React from 'react';

import StyledEvidenceList from './evidenceList.styled';
import type { EvidenceKind, EvidenceListProps } from './evidenceList.type';

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
      <li className="evidence-list-empty">
        {emptyState ?? 'No evidence added.'}
      </li>
    ) : (
      items.map(item => {
        const kind = item.kind ?? 'document';

        return (
          <li key={item.id} className="evidence-list-item">
            <button
              className="evidence-list-preview"
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
            </button>

            <div className="evidence-list-content">
              <div className="evidence-list-header">
                <div className="evidence-list-details">
                  <button
                    className="evidence-list-name"
                    type="button"
                    disabled={!onOpen}
                    onClick={() => onOpen?.(item)}
                  >
                    {item.filename}
                  </button>

                  {(item.mimeType || item.sizeLabel) && (
                    <p className="evidence-list-metadata">
                      {[item.mimeType, item.sizeLabel]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>

                {onRemove && (
                  <button
                    className="evidence-list-remove-button"
                    type="button"
                    aria-label={`Remove ${item.filename}`}
                    onClick={() => onRemove(item)}
                  >
                    Remove
                  </button>
                )}
              </div>

              {item.description && (
                <p className="evidence-list-description">{item.description}</p>
              )}
            </div>
          </li>
        );
      })
    )}
  </StyledEvidenceList>
);

export default EvidenceList;
