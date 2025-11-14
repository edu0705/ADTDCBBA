// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// --- ¡NUEVAS IMPORTACIONES! ---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// --- ¡NUEVA INSTANCIA! ---
// Crea el "cliente" que manejará la caché de datos
const queryClient = new QueryClient();

const container = document.getElementById('root'); 

if (container) {
  const root = createRoot(container);
  
  root.render(
    <React.StrictMode>
      {/* 1. Envuelve tu app con el QueryClientProvider */}
      <QueryClientProvider client={queryClient}>
        <AuthProvider> 
          <App />
        </AuthProvider>

        {/* 2. (Opcional) Añade las herramientas de desarrollo */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </React.StrictMode>
  );
}