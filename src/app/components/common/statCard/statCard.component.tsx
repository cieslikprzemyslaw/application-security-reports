import React from 'react';

import IconSVG from '~/app/components/ui/iconSVG';
import StyledStatCard from './statCard.styled';

import type { StatCardProps, StatTrendDirection } from './statCard.type';

const trendIconNameMap: Record<
  StatTrendDirection,
  'trendUp' | 'trendDown' | 'trendEqual'
> = {
  up: 'trendUp',
  down: 'trendDown',
  equal: 'trendEqual',
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
            <IconSVG name={trendIconNameMap[trendDirection]} />

            {trendValue}
          </span>
        )}

        {helperText && <span>{helperText}</span>}
      </div>
    )}
  </StyledStatCard>
);

export default StatCard;
