import React from 'react';

import {
  TabButton,
  TabCount,
  TabList,
  TabPanel,
  TabsRoot,
} from './tabs.styled';
import type { TabsProps } from './tabs.type';

const Tabs = ({ items, activeTabId, onChange, ariaLabel }: TabsProps) => {
  const activeItem = items.find(item => item.id === activeTabId) ?? items[0];

  if (!activeItem) {
    return null;
  }

  return (
    <TabsRoot>
      <TabList role="tablist" aria-label={ariaLabel}>
        {items.map(item => {
          const isActive = item.id === activeItem.id;

          return (
            <TabButton
              key={item.id}
              id={`${item.id}-tab`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${item.id}-panel`}
              tabIndex={isActive ? 0 : -1}
              disabled={item.disabled}
              $isActive={isActive}
              onClick={() => onChange(item.id)}
            >
              {item.label}

              {typeof item.count === 'number' && (
                <TabCount>{item.count}</TabCount>
              )}
            </TabButton>
          );
        })}
      </TabList>

      <TabPanel
        id={`${activeItem.id}-panel`}
        role="tabpanel"
        aria-labelledby={`${activeItem.id}-tab`}
      >
        {activeItem.content}
      </TabPanel>
    </TabsRoot>
  );
};

export default Tabs;
