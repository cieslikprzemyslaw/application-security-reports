import type { DefaultTheme } from 'styled-components';

import { colors } from './colors';
import { breakpoints, grid, layoutSizes, mq, spacing } from './layout';
import { radii } from './radii';
import { shadows } from './shadows';
import { tags } from './tags';
import { transitions } from './transitions';
import { typography } from './typography';
import { zIndices } from './zIndices';

export const defaultTheme: DefaultTheme = {
  colors,
  breakpoints,
  mq,
  spacing,
  grid,
  layoutSizes,
  typography,
  radii,
  shadows,
  transitions,
  zIndices,
  tags,
};
