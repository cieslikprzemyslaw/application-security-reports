import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import App from './app/App';
import { defaultTheme } from './theme';
import GlobalStyle from './theme/globalStyles';
import PrintStyle from './theme/printStyles';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={defaultTheme}>
      <GlobalStyle />
      <PrintStyle />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
