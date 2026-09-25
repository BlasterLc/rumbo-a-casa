import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { temaRumbo } from './theme/theme';
import './theme/tokens.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={temaRumbo}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
