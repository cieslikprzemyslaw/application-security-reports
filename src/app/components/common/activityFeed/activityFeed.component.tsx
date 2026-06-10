import React from 'react';

import StyledActivityFeed from './activityFeed.styled';
import type { ActivityFeedProps } from './activityFeed.type';

const ActivityFeed = ({ items, emptyState, ...rest }: ActivityFeedProps) => (
  <StyledActivityFeed {...rest}>
    {items.length === 0 ? (
      <div className="activity-feed-empty">
        {emptyState ?? 'No recent activity.'}
      </div>
    ) : (
      items.map(item => (
        <div key={item.id} className="activity-feed-item">
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

          <div className="activity-feed-content">
            <div className="activity-feed-title">{item.title}</div>

            {item.meta && <div className="activity-feed-meta">{item.meta}</div>}
          </div>
        </div>
      ))
    )}
  </StyledActivityFeed>
);

export default ActivityFeed;
