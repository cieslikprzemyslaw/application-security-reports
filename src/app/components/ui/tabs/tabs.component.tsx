import React, { useEffect, useRef } from 'react';

import StyledTabs from './tabs.styled';
import type { TabsProps } from './tabs.type';

const Tabs = <TTabId extends string>({
  items,
  activeTabId,
  onChange,
  ariaLabel,
}: TabsProps<TTabId>) => {
  const activeItem = items.find(item => item.id === activeTabId) ?? items[0];
  const tabButtonRefs = useRef<Record<TTabId, HTMLButtonElement | null>>(
    {} as Record<TTabId, HTMLButtonElement | null>,
  );

  useEffect(() => {
    if (!activeItem) {
      return;
    }

    tabButtonRefs.current[activeItem.id]?.focus();
  }, [activeItem?.id]);

  if (!activeItem) {
    return null;
  }

  const getNextEnabledTabId = (
    currentTabId: TTabId,
    offset: number,
  ): TTabId => {
    const currentIndex = items.findIndex(item => item.id === currentTabId);

    if (currentIndex < 0) {
      return activeItem.id;
    }

    for (let step = 1; step <= items.length; step += 1) {
      const nextIndex =
        (currentIndex + offset * step + items.length) % items.length;
      const nextItem = items[nextIndex];

      if (!nextItem.disabled) {
        return nextItem.id;
      }
    }

    return currentTabId;
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    tabId: TTabId,
  ) => {
    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return;
    }

    event.preventDefault();

    const nextTabId =
      event.key === 'Home'
        ? (items.find(item => !item.disabled)?.id ?? tabId)
        : event.key === 'End'
          ? ([...items].reverse().find(item => !item.disabled)?.id ?? tabId)
          : getNextEnabledTabId(tabId, event.key === 'ArrowRight' ? 1 : -1);

    if (nextTabId !== tabId) {
      onChange(nextTabId);
    }
  };

  return (
    <StyledTabs className="tabs-root">
      <div
        className="tabs-tab-list"
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
      >
        {items.map(item => {
          const isActive = item.id === activeItem.id;

          return (
            <button
              key={item.id}
              id={`${item.id}-tab`}
              ref={element => {
                tabButtonRefs.current[item.id] = element;
              }}
              className={[
                'tabs-tab-button',
                isActive ? 'tabs-tab-button--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${item.id}-panel`}
              tabIndex={isActive ? 0 : -1}
              disabled={item.disabled}
              onClick={() => onChange(item.id)}
              onKeyDown={event => handleTabKeyDown(event, item.id)}
            >
              {item.label}

              {typeof item.count === 'number' && (
                <span className="tabs-tab-count">{item.count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="tabs-tab-panel"
        id={`${activeItem.id}-panel`}
        role="tabpanel"
        aria-labelledby={`${activeItem.id}-tab`}
      >
        {activeItem.content}
      </div>
    </StyledTabs>
  );
};

export default Tabs;
