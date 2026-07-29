import React from 'react';

import StyledActivityFeed from './activityFeed.styled';
import type { ActivityFeedProps, ActivityItem } from './activityFeed.type';

const ActivityFeedItemContent = ({ item }: { item: ActivityItem }) => (
  <>
    {item.icon && (
      <span
        className={`activity-feed-icon activity-feed-icon--${
          item.tone ?? 'brand'
        }`}
        aria-hidden="true"
      >
        {item.icon}
      </span>
    )}

    <span className="activity-feed-content">
      <span className="activity-feed-title">{item.title}</span>

      {item.meta && <span className="activity-feed-meta">{item.meta}</span>}
    </span>
  </>
);

const ActivityFeed = ({ items, emptyState, ...rest }: ActivityFeedProps) => (
  <StyledActivityFeed {...rest}>
    {items.length === 0 ? (
      <div className="activity-feed-empty">
        {emptyState ?? 'No recent activity.'}
      </div>
    ) : (
      items.map(item =>
        item.href ? (
          <a
            key={item.id}
            className="activity-feed-item activity-feed-item--interactive"
            href={item.href}
          >
            <ActivityFeedItemContent item={item} />
          </a>
        ) : (
          <div key={item.id} className="activity-feed-item">
            <ActivityFeedItemContent item={item} />
          </div>
        ),
      )
    )}
  </StyledActivityFeed>
);

export default ActivityFeed;
