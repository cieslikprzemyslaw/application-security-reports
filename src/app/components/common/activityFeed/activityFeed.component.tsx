import React from 'react';

import {
  ActivityFeedContent,
  ActivityFeedEmpty,
  ActivityFeedIcon,
  ActivityFeedItem,
  ActivityFeedMeta,
  ActivityFeedTitle,
  StyledActivityFeed,
} from './activityFeed.styled';
import type { ActivityFeedProps } from './activityFeed.type';

const ActivityFeed = ({ items, emptyState, ...rest }: ActivityFeedProps) => (
  <StyledActivityFeed {...rest}>
    {items.length === 0 ? (
      <ActivityFeedEmpty>
        {emptyState ?? 'No recent activity.'}
      </ActivityFeedEmpty>
    ) : (
      items.map(item => (
        <ActivityFeedItem key={item.id}>
          {item.icon && (
            <ActivityFeedIcon $tone={item.tone ?? 'brand'} aria-hidden="true">
              {item.icon}
            </ActivityFeedIcon>
          )}

          <ActivityFeedContent>
            <ActivityFeedTitle>{item.title}</ActivityFeedTitle>

            {item.meta && <ActivityFeedMeta>{item.meta}</ActivityFeedMeta>}
          </ActivityFeedContent>
        </ActivityFeedItem>
      ))
    )}
  </StyledActivityFeed>
);

export default ActivityFeed;
