import React from 'react';

import StyledToast, {
  ToastActions,
  ToastContent,
  ToastDescription,
  ToastDismissButton,
  ToastIcon,
  ToastTitle,
} from './toast.styled';
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
    role={variant === 'error' ? 'alert' : 'status'}
    $variant={variant}
    {...rest}
  >
    {icon && (
      <ToastIcon className="toast-icon" aria-hidden="true">
        {icon}
      </ToastIcon>
    )}

    <ToastContent>
      <ToastTitle>{title}</ToastTitle>

      {description && <ToastDescription>{description}</ToastDescription>}
    </ToastContent>

    {(actions || onDismiss) && (
      <ToastActions>
        {actions}

        {onDismiss && (
          <ToastDismissButton
            type="button"
            aria-label={dismissLabel}
            onClick={onDismiss}
          >
            <CloseIcon />
          </ToastDismissButton>
        )}
      </ToastActions>
    )}
  </StyledToast>
);

export default Toast;
