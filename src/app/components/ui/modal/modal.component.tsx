import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

import {
  ModalBody,
  ModalCloseButton,
  ModalDescription,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
  ModalTitleGroup,
} from './modal.styled';
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
    <ModalOverlay
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <ModalDialog
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        $size={size}
      >
        <ModalHeader>
          <ModalTitleGroup>
            <ModalTitle id={titleId}>{title}</ModalTitle>

            {description && (
              <ModalDescription id={descriptionId}>
                {description}
              </ModalDescription>
            )}
          </ModalTitleGroup>

          <ModalCloseButton
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <CloseIcon />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>{children}</ModalBody>

        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalDialog>
    </ModalOverlay>,
    document.body,
  );
};

export default Modal;
