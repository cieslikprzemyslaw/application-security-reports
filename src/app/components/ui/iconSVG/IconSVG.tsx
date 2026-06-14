import React from 'react';
import type { SVGProps } from 'react';

import { iconRegistry } from './iconRegistry';
import type { IconName } from './iconRegistry';

export type IconSize = 'small' | 'medium' | 'large';

export interface IconSVGProps extends Omit<
  SVGProps<SVGSVGElement>,
  'children'
> {
  name: IconName;
  label?: string;
  size?: IconSize;
}

const iconSizes: Record<IconSize, string> = {
  small: '0.875rem',
  medium: '1rem',
  large: '1.25rem',
};

const IconSVG = ({
  name,
  label,
  size = 'medium',
  width,
  height,
  ...rest
}: IconSVGProps) => {
  const icon = iconRegistry[name];

  return (
    <svg
      {...rest}
      viewBox={icon.viewBox ?? '0 0 24 24'}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={width ?? iconSizes[size]}
      height={height ?? iconSizes[size]}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
    >
      {icon.children}
    </svg>
  );
};

export default IconSVG;
