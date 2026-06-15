import React, { useId, useLayoutEffect, useRef } from 'react';
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
  const panelRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusFirstElement = () => {
      const focusableElement =
        panelRef.current?.querySelector<HTMLElement>(focusableSelector);

      (focusableElement ?? panelRef.current)?.focus();
    };

    const getFocusableElements = () =>
      panelRef.current
        ? Array.from(
            panelRef.current.querySelectorAll<HTMLElement>(focusableSelector),
          ).filter(element => !element.hasAttribute('disabled'))
        : [];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    document.body.style.overflow = 'hidden';
    focusFirstElement();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      document.body.style.overflow = '';
      previouslyFocusedElementRef.current?.focus();
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
          ref={panelRef}
          className="drawer-panel"
          tabIndex={-1}
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
