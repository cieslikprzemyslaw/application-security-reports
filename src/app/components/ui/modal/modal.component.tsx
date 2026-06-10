import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

import StyledModal, { getModalWidth } from './modal.styled';
import type { ModalProps } from './modal.type';

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path d="M6 6 18 18M18 6 6 18" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Modal = ({
  isOpen,
  title,
  description,
  children,
  footer,
  size = 'medium',
  closeLabel = 'Close dialog',
  onClose,
}: ModalProps) => {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <StyledModal>
      <div
        className="modal-overlay"
        onMouseDown={event => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="modal-dialog"
          style={{ width: `min(100%, ${getModalWidth(size)})` }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
        >
          <header className="modal-header">
            <div className="modal-title-group">
              <h2 id={titleId} className="modal-title">
                {title}
              </h2>

              {description && (
                <p id={descriptionId} className="modal-description">
                  {description}
                </p>
              )}
            </div>

            <button
              className="modal-close-button"
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </header>

          <div className="modal-body">{children}</div>

          {footer && <footer className="modal-footer">{footer}</footer>}
        </div>
      </div>
    </StyledModal>,
    document.body,
  );
};

export default Modal;
