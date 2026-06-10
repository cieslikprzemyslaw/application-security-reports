export const fontFamilies = {
  heading: '"IBM Plex Sans", Arial, sans-serif',
  body: '"IBM Plex Sans", Arial, sans-serif',
  mono: '"IBM Plex Mono", Consolas, monospace',
} as const;
export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;
export const typography = {
  fontFamilies,
  fontWeights,
  headings: {
    display: { size: '2rem', lineHeight: '2.5rem', weight: 700 },
    h1: { size: '1.75rem', lineHeight: '2.25rem', weight: 700 },
    h2: { size: '1.5rem', lineHeight: '2rem', weight: 600 },
    h3: { size: '1.25rem', lineHeight: '1.75rem', weight: 600 },
    h4: { size: '1.125rem', lineHeight: '1.625rem', weight: 600 },
    h5: { size: '1rem', lineHeight: '1.5rem', weight: 600 },
    h6: { size: '0.875rem', lineHeight: '1.25rem', weight: 600 },
  },
  body: {
    large: { size: '1rem', lineHeight: '1.5rem', weight: 400 },
    medium: { size: '0.875rem', lineHeight: '1.25rem', weight: 400 },
    small: { size: '0.75rem', lineHeight: '1.125rem', weight: 400 },
  },
  label: {
    medium: { size: '0.875rem', lineHeight: '1.25rem', weight: 500 },
    small: { size: '0.75rem', lineHeight: '1rem', weight: 500 },
  },
  mono: {
    medium: { size: '0.875rem', lineHeight: '1.25rem', weight: 400 },
    small: { size: '0.75rem', lineHeight: '1.125rem', weight: 400 },
  },
} as const;
