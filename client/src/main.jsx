import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'oklch(0.22 0.02 270)',
                color: 'oklch(0.95 0.01 270)',
                border: '1px solid oklch(0.35 0.02 270 / 0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: 'oklch(0.72 0.19 155)', secondary: 'white' },
              },
              error: {
                iconTheme: { primary: 'oklch(0.65 0.22 25)', secondary: 'white' },
              },
            }}
          />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
