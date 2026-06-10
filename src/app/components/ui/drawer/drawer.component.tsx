import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

import {
  DrawerBody,
  DrawerCloseButton,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPanel,
  DrawerTitle,
  DrawerTitleGroup,
} from './drawer.styled';
import type { DrawerProps } from './drawer.type';

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path d="M6 6 18 18M18 6 6 18" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Drawer = ({
  isOpen,
  title,
  description,
  children,
  footer,
  size = 'medium',
  closeLabel = 'Close drawer',
  onClose,
}: DrawerProps) => {
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
    <DrawerOverlay
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <DrawerPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        $size={size}
      >
        <DrawerHeader>
          <DrawerTitleGroup>
            <DrawerTitle id={titleId}>{title}</DrawerTitle>

            {description && (
              <DrawerDescription id={descriptionId}>
                {description}
              </DrawerDescription>
            )}
          </DrawerTitleGroup>

          <DrawerCloseButton
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <CloseIcon />
          </DrawerCloseButton>
        </DrawerHeader>

        <DrawerBody>{children}</DrawerBody>

        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </DrawerPanel>
    </DrawerOverlay>,
    document.body,
  );
};

export default Drawer;
