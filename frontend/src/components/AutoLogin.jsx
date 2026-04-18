import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, CircularProgress } from '@mui/material';

const AutoLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const performAutoLogin = async () => {
      try {
        // Simular login automático com credenciais de teste
        const userData = {
          nome: 'Administrador',
          email: 'admin@teste.com',
          role: 'admin'
        };

        login(userData);

        // Redirecionar para dashboard após login
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } catch (error) {
        console.error('Erro no auto login:', error);
        navigate('/login');
      }
    };

    performAutoLogin();
  }, [login, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <CircularProgress sx={{ color: 'white', mb: 2 }} />
      <Typography variant="h6" sx={{ color: 'white' }}>
        Configurando sistema para monitor ultra-wide...
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
        Detectando resolução e aplicando otimizações
      </Typography>
    </Box>
  );
};

export default AutoLogin;