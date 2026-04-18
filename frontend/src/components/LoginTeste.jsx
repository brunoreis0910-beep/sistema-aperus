import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Container
} from '@mui/material';
import { LoginRounded as LoginIcon } from '@mui/icons-material';

const LoginTeste = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: 'admin',
    password: 'admin'
  });
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Login simples para teste
    if (credentials.username === 'admin' && credentials.password === 'admin') {
      // Simular dados do usuário
      const userData = {
        id: 1,
        nome: 'Administrador',
        email: 'admin@teste.com',
        token: 'teste-token-123'
      };

      onLogin(userData);
    } else {
      setError('Credenciais inválidas. Use: admin/admin');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />

        <Typography variant="h4" component="h1" gutterBottom>
          Sistema de Vendas
        </Typography>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Login de Teste
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Usuário"
            value={credentials.username}
            onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
            margin="normal"
            required
            autoFocus
          />

          <TextField
            fullWidth
            label="Senha"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
            margin="normal"
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            size="large"
          >
            Entrar
          </Button>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>Credenciais de teste:</strong><br />
          Usuário: admin<br />
          Senha: admin
        </Alert>
      </Paper>
    </Container>
  );
};

export default LoginTeste;