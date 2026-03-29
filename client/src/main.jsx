import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppProvider>
              <App />
              <Toaster
                position="top-right"
                containerStyle={{ top: '80px' }}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--color-surface-800)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    fontSize: '14px',
                  },
                  success: {
                    iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-surface-900)' },
                  },
                  error: {
                    iconTheme: { primary: 'var(--color-danger)', secondary: 'var(--color-surface-900)' },
                  },
                }}
              />
            </AppProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
