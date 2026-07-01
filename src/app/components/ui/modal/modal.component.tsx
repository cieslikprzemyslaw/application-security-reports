import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import StyledModal, { getModalWidth } from './modal.styled';
import type { ModalProps } from './modal.type';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const getFocusableElements = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ??
          [],
      ).filter(element => !element.hasAttribute('disabled'));

    const focusFirstElement = () => {
      const preferredElement = dialogRef.current?.querySelector<HTMLElement>(
        '[data-modal-autofocus="true"]',
      );
      const firstElement = getFocusableElements()[0];

      (preferredElement ?? firstElement ?? dialogRef.current)?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const focusTimeoutId = window.setTimeout(focusFirstElement, 0);

    document.addEventListener('keydown', handleKeyDown);

    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(focusTimeoutId);
      document.removeEventListener('keydown', handleKeyDown);

      document.body.style.overflow = '';

      const previouslyFocusedElement = previouslyFocusedElementRef.current;

      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
      }

      previouslyFocusedElementRef.current = null;
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
          ref={dialogRef}
          className="modal-dialog"
          style={{ width: `min(100%, ${getModalWidth(size)})` }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
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
