import React from 'react';

import StyledTabs from './tabs.styled';
import type { TabsProps } from './tabs.type';

const Tabs = ({ items, activeTabId, onChange, ariaLabel }: TabsProps) => {
  const activeItem = items.find(item => item.id === activeTabId) ?? items[0];

  if (!activeItem) {
    return null;
  }

  return (
    <StyledTabs className="tabs-root">
      <div className="tabs-tab-list" role="tablist" aria-label={ariaLabel}>
        {items.map(item => {
          const isActive = item.id === activeItem.id;

          return (
            <button
              key={item.id}
              id={`${item.id}-tab`}
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
