import React from 'react';

import {
  StatCardFooter,
  StatCardIcon,
  StatCardLabel,
  StatCardTop,
  StatCardValue,
  StatTrendValue,
  StyledStatCard,
} from './statCard.styled';

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
  <StyledStatCard {...rest}>
    <StatCardTop>
      {icon && (
        <StatCardIcon $tone={iconTone} aria-hidden="true">
          {icon}
        </StatCardIcon>
      )}

      <StatCardLabel>{label}</StatCardLabel>
    </StatCardTop>

    <StatCardValue>{value}</StatCardValue>

    {(trendValue || helperText) && (
      <StatCardFooter>
        {trendValue && (
          <StatTrendValue $tone={trendTone}>
            <TrendIcon direction={trendDirection} />

            {trendValue}
          </StatTrendValue>
        )}

        {helperText && <span>{helperText}</span>}
      </StatCardFooter>
    )}
  </StyledStatCard>
);

export default StatCard;
