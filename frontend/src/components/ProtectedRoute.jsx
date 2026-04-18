// Em: src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// 1. Importa o "atalho" do nosso Gerenciador
import { useAuth } from '../context/AuthContext';

// Este componente recebe "children" (os filhos, ou seja, a página que ele protege)
const ProtectedRoute = ({ children }) => {
  // 2. Pega o 'user' e o 'isLoading' do Gerenciador
  const { user, isLoading } = useAuth();
  const location = useLocation(); // Pega a URL atual

  // 3. Se estiver carregando, espera
  if (isLoading) {
    // Se ainda estamos verificando se o token é válido, mostra um loading
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#0d47a1' // Fundo azul para o loading
      }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  // 4. Se terminou de carregar E não HÁ usuário, redireciona para o login
  if (!user) {
    // Se o loading terminou e não há usuário, redireciona para a página de login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 5. Se terminou de carregar E HÁ usuário, mostra a página
  return children;
};

export default ProtectedRoute;