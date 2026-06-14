import React from 'react';

import IconSVG from '~/app/components/ui/iconSVG';
import StyledEvidenceList from './evidenceList.styled';
import { EvidenceListProps } from './evidenceList.type';

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
                (item.icon ?? (
                  <IconSVG name={kind === 'image' ? 'image' : 'file'} />
                ))
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
