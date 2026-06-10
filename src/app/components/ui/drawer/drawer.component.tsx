import React, { useEffect, useId } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';

import StyledDrawer, { getDrawerWidth } from './drawer.styled';
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
    <StyledDrawer>
      <div
        className="drawer-overlay"
        onMouseDown={event => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <aside
          className="drawer-panel"
          style={{ '--drawer-width': getDrawerWidth(size) } as CSSProperties}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
        >
          <header className="drawer-header">
            <div className="drawer-title-group">
              <h2 id={titleId} className="drawer-title">
                {title}
              </h2>

              {description && (
                <p id={descriptionId} className="drawer-description">
                  {description}
                </p>
              )}
            </div>

            <button
              className="drawer-close-button"
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </header>

          <div className="drawer-body">{children}</div>

          {footer && <footer className="drawer-footer">{footer}</footer>}
        </aside>
      </div>
    </StyledDrawer>,
    document.body,
  );
};

export default Drawer;
