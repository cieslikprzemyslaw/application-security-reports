import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import Button from '~/app/components/ui/button';
import IconButton from '~/app/components/ui/iconButton';
import IconSVG from '~/app/components/ui/iconSVG';
import Tooltip from '~/app/components/ui/tooltip';

import StyledPageActionGroup from './pageActionGroup.styled';
import type {
  PageActionGroupProps,
  PageActionItem,
} from './pageActionGroup.type';

interface ActionButtonProps {
  action: PageActionItem;
  variant: 'primary' | 'secondary' | 'destructive';
  compact: boolean;
}

const ActionButton = ({ action, variant, compact }: ActionButtonProps) => {
  const button = (
    <Button
      {...action.buttonProps}
      {...action.dataAttributes}
      title={action.label}
      ariaLabel={action.ariaLabel}
      icon={action.icon}
      variant={variant}
      size={compact ? 'small' : 'medium'}
      disabled={action.disabled}
      isLoading={action.isLoading}
      type={action.type}
      form={action.form}
      onClick={action.onActivate}
    />
  );

  if (!action.disabled || !action.disabledReason) {
    return button;
  }

  return <Tooltip content={action.disabledReason}>{button}</Tooltip>;
};

const PageActionGroup = ({
  primaryAction,
  secondaryActions = [],
  overflowActions = [],
  destructiveAction,
  legacyActions,
  compact = false,
}: PageActionGroupProps) => {
  const menuId = useId();
  const groupRef = useRef<HTMLDivElement | null>(null);
  const menuWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const firstMenuItem =
      menuWrapperRef.current?.querySelector<HTMLButtonElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      );
    firstMenuItem?.focus();

    const closeMenu = (event: MouseEvent) => {
      if (!menuWrapperRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', closeMenu);

    return () => document.removeEventListener('click', closeMenu);
  }, [isMenuOpen]);

  const focusOverflowTrigger = () => {
    groupRef.current
      ?.querySelector<HTMLButtonElement>('button[aria-label="More actions"]')
      ?.focus();
  };

  const closeOverflowMenu = (restoreFocus = false) => {
    setIsMenuOpen(false);

    if (restoreFocus) {
      window.setTimeout(focusOverflowTrigger, 0);
    }
  };

  const handleMenuNavigation = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isMenuOpen) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeOverflowMenu(true);
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return;
    }

    const items = Array.from(
      menuWrapperRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      ) ?? [],
    );

    if (items.length === 0) {
      return;
    }

    const currentIndex = items.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : event.key === 'ArrowUp'
            ? (currentIndex - 1 + items.length) % items.length
            : (currentIndex + 1) % items.length;

    event.preventDefault();
    items[nextIndex]?.focus();
  };

  const activateOverflowAction = (action: PageActionItem) => {
    if (action.disabled || action.isLoading) {
      return;
    }

    closeOverflowMenu();
    action.onActivate();
  };

  return (
    <StyledPageActionGroup
      ref={groupRef}
      className="page-action-group"
      $compact={compact}
      onKeyDown={handleMenuNavigation}
    >
      {legacyActions && (
        <div className="page-action-group__secondary">{legacyActions}</div>
      )}

      {secondaryActions.length > 0 && (
        <div className="page-action-group__secondary">
          {secondaryActions.map(action => (
            <ActionButton
              key={action.id}
              action={action}
              variant="secondary"
              compact={compact}
            />
          ))}
        </div>
      )}

      {overflowActions.length > 0 && (
        <div ref={menuWrapperRef} className="page-action-group__overflow">
          <IconButton
            icon={<IconSVG name="more" />}
            ariaLabel="More actions"
            size={compact ? 'small' : 'medium'}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-controls={isMenuOpen ? menuId : undefined}
            onClick={() => setIsMenuOpen(current => !current)}
          />

          {isMenuOpen && (
            <div id={menuId} className="page-action-group__menu" role="menu">
              {overflowActions.map(action => (
                <button
                  key={action.id}
                  type="button"
                  className="page-action-group__menu-item"
                  role="menuitem"
                  aria-disabled={action.disabled || action.isLoading}
                  title={action.disabledReason}
                  onClick={() => activateOverflowAction(action)}
                >
                  {action.icon && <span aria-hidden="true">{action.icon}</span>}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {primaryAction && (
        <div className="page-action-group__primary">
          <ActionButton
            action={primaryAction}
            variant="primary"
            compact={compact}
          />
        </div>
      )}

      {destructiveAction && (
        <div className="page-action-group__destructive">
          <ActionButton
            action={destructiveAction}
            variant="destructive"
            compact={compact}
          />
        </div>
      )}
    </StyledPageActionGroup>
  );
};

export default PageActionGroup;
