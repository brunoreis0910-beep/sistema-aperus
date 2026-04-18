import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Button, TextField, Card, CardContent, Alert, CircularProgress } from '@mui/material';

const AutoLoginDev = ({ onLoginSuccess }) => {
  const { login, user, isLoading } = useAuth();
  const [credentials, setCredentials] = useState({
    username: 'admin', // Usuário padréo para desenvolvimento
    password: 'admin123' // Senha padréo para desenvolvimento
  });
  const [loginStatus, setLoginStatus] = useState('');
  const [attempting, setAttempting] = useState(false);

  // função para fazer login automático
  const handleAutoLogin = async () => {
    setAttempting(true);
    setLoginStatus('🔄 Tentando login automático...');

    try {
      await login(credentials.username, credentials.password);
      setLoginStatus('✅ Login realizado com sucesso!');
      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      setLoginStatus(`❌ Erro no login: ${error.response?.data?.detail || error.message}`);
    } finally {
      setAttempting(false);
    }
  };

  // Login automático quando componente carrega
  useEffect(() => {
    if (!user && !isLoading) {
      // Delay de 1 segundo para dar tempo de carregar
      const timer = setTimeout(handleAutoLogin, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Verificando autenticação...</Typography>
      </Box>
    );
  }

  if (user) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Usuário logado: {user.username || user.email || 'Usuário'}
        </Alert>
        {onLoginSuccess && (
          <Button variant="contained" onClick={onLoginSuccess}>
            Continuar para o Sistema
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔧 Auto-Login para Desenvolvimento
          </Typography>

          {loginStatus && (
            <Alert
              severity={loginStatus.includes('✅') ? 'success' : loginStatus.includes('❌') ? 'error' : 'info'}
              sx={{ mb: 2 }}
            >
              {loginStatus}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Usuário"
            value={credentials.username}
            onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
            sx={{ mb: 2 }}
            disabled={attempting}
          />

          <TextField
            fullWidth
            type="password"
            label="Senha"
            value={credentials.password}
            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
            sx={{ mb: 2 }}
            disabled={attempting}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleAutoLogin}
              disabled={attempting}
              startIcon={attempting ? <CircularProgress size={20} /> : null}
              fullWidth
            >
              {attempting ? 'Fazendo Login...' : 'Login Manual'}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            ⚠️ Este componente é apenas para desenvolvimento.
            Configure suas credenciais no Django admin.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AutoLoginDev;