import React from 'react';

import StyledToast from './toast.styled';
import type { ToastProps } from './toast.type';

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path d="M6 6 18 18M18 6 6 18" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Toast = ({
  title,
  description,
  icon,
  actions,
  variant = 'info',
  dismissLabel = 'Dismiss notification',
  onDismiss,
  ...rest
}: ToastProps) => (
  <StyledToast
    className={`toast toast--${variant}`}
    role={variant === 'error' ? 'alert' : 'status'}
    {...rest}
  >
    {icon && (
      <span className="toast-icon" aria-hidden="true">
        {icon}
      </span>
    )}

    <div className="toast-content">
      <h4 className="toast-title">{title}</h4>

      {description && <p className="toast-description">{description}</p>}
    </div>

    {(actions || onDismiss) && (
      <div className="toast-actions">
        {actions}

        {onDismiss && (
          <button
            className="toast-dismiss-button"
            type="button"
            aria-label={dismissLabel}
            onClick={onDismiss}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    )}
  </StyledToast>
);

export default Toast;
