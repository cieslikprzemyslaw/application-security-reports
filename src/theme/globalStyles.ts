import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    min-height: 100%;
    -moz-text-size-adjust: none;
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
  }

  body {
    min-height: 100vh;
    margin: 0;
    font-family: ${({ theme }) => theme.typography.fontFamilies.body};
    font-size: 1rem;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.surface.page};
    -webkit-font-smoothing: antialiased;
  }

  #root {
    isolation: isolate;
    min-height: 100vh;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p {
    margin: 0;
  }

  h1 {
    ${({ theme }) => theme.tags.h1}
  }

  h2 {
    ${({ theme }) => theme.tags.h2}
  }

  h3 {
    ${({ theme }) => theme.tags.h3}
  }

  h4 {
    ${({ theme }) => theme.tags.h4}
  }

  h5 {
    ${({ theme }) => theme.tags.h5}
  }

  h6 {
    ${({ theme }) => theme.tags.h6}
  }

  p,
  li {
    ${({ theme }) => theme.tags.textMedium}
  }

  .text-large {
    ${({ theme }) => theme.tags.textLarge}
  }

  .text-medium {
    ${({ theme }) => theme.tags.textMedium}
  }

  .text-small {
    ${({ theme }) => theme.tags.textSmall}
  }

  .mono {
    ${({ theme }) => theme.tags.mono}
  }

  .eyebrow {
    ${({ theme }) => theme.tags.textSmall}
    margin-bottom: ${({ theme }) => theme.spacing.xs};
    color: ${({ theme }) => theme.colors.brand.primary};
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  a {
    color: ${({ theme }) => theme.colors.text.link};
    text-underline-offset: 0.15em;
  }

  a:hover {
    color: ${({ theme }) => theme.colors.text.linkHover};
  }

  img,
  picture,
  video,
  canvas,
  svg {
    display: block;
    max-width: 100%;
  }

  input,
  button,
  textarea,
  select {
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.border.focus};
    outline-offset: 2px;
  }

  .visually-hidden,
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

export default GlobalStyle;
