export const spacing = {
  none: '0',
  xxxs: '0.25rem',
  xxs: '0.5rem',
  xs: '0.75rem',
  s: '1rem',
  m: '1.5rem',
  l: '2rem',
  xl: '2.5rem',
  xxl: '3rem',
  xxxl: '4rem',
} as const;
export const breakpoints = {
  mobile: 30,
  tablet: 48,
  laptop: 64,
  desktop: 80,
  largeDesktop: 90,
} as const;
const r = (v: number) => `${v}rem`;
export const mq = {
  min: {
    mobile: `only screen and (min-width:${r(breakpoints.mobile)})`,
    tablet: `only screen and (min-width:${r(breakpoints.tablet)})`,
    laptop: `only screen and (min-width:${r(breakpoints.laptop)})`,
    desktop: `only screen and (min-width:${r(breakpoints.desktop)})`,
    largeDesktop: `only screen and (min-width:${r(breakpoints.largeDesktop)})`,
  },
  max: {
    mobile: `only screen and (max-width:${r(breakpoints.mobile)})`,
    tablet: `only screen and (max-width:${r(breakpoints.tablet)})`,
    laptop: `only screen and (max-width:${r(breakpoints.laptop)})`,
    desktop: `only screen and (max-width:${r(breakpoints.desktop)})`,
    largeDesktop: `only screen and (max-width:${r(breakpoints.largeDesktop)})`,
  },
} as const;
export const grid = {
  default: { maxWidth: '90rem', gutter: spacing.s, margin: spacing.s },
} as const;
export const layoutSizes = {
  sidebarWidth: '16rem',
  topbarHeight: '4rem',
  contentMaxWidth: '90rem',
  reportMaxWidth: '52.5rem',
  drawerWidth: '30rem',
} as const;
