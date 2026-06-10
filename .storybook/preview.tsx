import type { Preview } from '@storybook/react';
import { ThemeProvider } from 'styled-components';

import { defaultTheme } from '../src/theme';
import GlobalStyle from '../src/theme/globalStyles';

const preview: Preview = {
  decorators: [
    Story => (
      <ThemeProvider theme={defaultTheme}>
        <GlobalStyle />
        <Story />
      </ThemeProvider>
    ),
  ],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
