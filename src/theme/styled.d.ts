import 'styled-components';
import { colors } from './colors';
import { breakpoints, grid, layoutSizes, mq, spacing } from './layout';
import { radii } from './radii';
import { shadows } from './shadows';
import { tags } from './tags';
import { transitions } from './transitions';
import { typography } from './typography';
import { zIndices } from './zIndices';
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: typeof colors;
    breakpoints: typeof breakpoints;
    mq: typeof mq;
    spacing: typeof spacing;
    grid: typeof grid;
    layoutSizes: typeof layoutSizes;
    typography: typeof typography;
    radii: typeof radii;
    shadows: typeof shadows;
    transitions: typeof transitions;
    zIndices: typeof zIndices;
    tags: typeof tags;
  }
}
