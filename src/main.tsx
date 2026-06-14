import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { AppThemeProvider } from './theme';
import GlobalStyle from './theme/globalStyles';
import PrintStyle from './theme/printStyles';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppThemeProvider>
      <GlobalStyle />
      <PrintStyle />
      <App />
    </AppThemeProvider>
  </React.StrictMode>,
);
