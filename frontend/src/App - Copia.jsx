// Em: C:\Projetos\SistemaGerencial\frontend\src\App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importa nossas páginas e componentes
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Importa as páginas que véo ficar dentro do Dashboard
import ClientPage from './pages/ClientPage';
import ProductPage from './pages/ProductPage';
import FinancePage from './pages/FinancePage';
import SettingsPage from './pages/SettingsPage';
import AprovacoesPage from './pages/AprovacoesPage'; // <-- 1. IMPORTA A NOVA PÁGINA

function App() {
  return (
    <Routes>
      {/* Rota 1: Página de Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rota 2: Rotas Protegidas (Dashboard) */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Define as rotas "filhas" que o DashboardLayout vai mostrar */}
        
        <Route index element={<Navigate to="/clientes" replace />} /> 
        
        <Route path="clientes" element={<ClientPage />} />
        <Route path="produtos" element={<ProductPage />} />
        <Route path="financeiro" element={<FinancePage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        
        {/* --- 2. ADICIONA A NOVA ROTA --- */}
        <Route path="aprovacoes" element={<AprovacoesPage />} />
        
      </Route>

      {/* Rota 3: Redirecionamento */}
      <Route path="*" element={<Navigate to="/" replace />} />
      
    </Routes>
  );
}

export default App;