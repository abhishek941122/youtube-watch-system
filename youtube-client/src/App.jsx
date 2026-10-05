import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes.jsx';
import { Toaster } from 'sonner';

export function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        theme="dark"
        richColors
        closeButton
        duration={3500}
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
