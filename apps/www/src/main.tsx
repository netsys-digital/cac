import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { PortalAuthProvider } from './app/auth/PortalAuthContext';
import './i18n';
import '@cac/ui/styles.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PortalAuthProvider>
        <App />
      </PortalAuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
