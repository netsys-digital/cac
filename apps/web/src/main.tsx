import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { applyFontScale } from '@cac/ui';
import App from './app/App';
import { AuthProvider } from './app/auth/AuthContext';
import { AppDialogProvider } from './app/components/AppDialogProvider';
import { fontEnv } from './config';
import './i18n';
import '@cac/ui/styles.css';
import './styles.css';

applyFontScale(fontEnv);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppDialogProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppDialogProvider>
    </BrowserRouter>
  </StrictMode>,
);
