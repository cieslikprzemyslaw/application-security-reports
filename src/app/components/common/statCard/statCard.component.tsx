import React from 'react';

import StyledStatCard from './statCard.styled';

import type { StatCardProps, StatTrendDirection } from './statCard.type';

const TrendIcon = ({ direction }: { direction: StatTrendDirection }) => {
  if (direction === 'equal') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path d="M5 12h14" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (direction === 'down') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          d="m4 8 5 5 4-4 7 7"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M16 16h4v-4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        d="m4 16 5-5 4 4 7-7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16 8h4v4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const StatCard = ({
  label,
  value,
  icon,
  iconTone = 'brand',
  helperText,
  trendDirection = 'equal',
  trendTone = 'neutral',
  trendValue,
  ...rest
}: StatCardProps) => (
  <StyledStatCard $iconTone={iconTone} $trendTone={trendTone} {...rest}>
    <div className="stat-card-top">
      {icon && (
        <span className="stat-card-icon" aria-hidden="true">
          {icon}
        </span>
      )}

      <span className="stat-card-label">{label}</span>
    </div>

    <strong className="stat-card-value">{value}</strong>

    {(trendValue || helperText) && (
      <div className="stat-card-footer">
        {trendValue && (
          <span className="stat-card-stat-trend-value">
            <TrendIcon direction={trendDirection} />

            {trendValue}
          </span>
        )}

        {helperText && <span>{helperText}</span>}
      </div>
    )}
  </StyledStatCard>
);

export default StatCard;
