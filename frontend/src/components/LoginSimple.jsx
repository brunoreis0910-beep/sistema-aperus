import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Avatar,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const LoginSimple = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(credentials.username, credentials.password);
    } catch (error) {
      setError('Credenciais inválidas. Use: admin / admin123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      data-login-page
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper
          sx={{
            padding: 4,
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                bgcolor: '#1976d2',
                mx: 'auto',
                mb: 2,
                width: 64,
                height: 64
              }}
            >
              <BusinessIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: '#000000',
                mb: 1
              }}
            >
              APERUS
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: '#666666' }}
            >
              Faça login para continuar
            </Typography>
          </Box>

          {/* Formulário */}
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              margin="normal"
              name="username"
              label="Usuário"
              type="text"
              value={credentials.username}
              onChange={handleChange}
              required
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: '#ffffff',
                  color: '#000000',
                },
                '& .MuiInputBase-input': {
                  color: '#000000',
                },
                '& .MuiFormLabel-root': {
                  color: '#666666',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e0e0e0',
                }
              }}
              InputProps={{
                startAdornment: <PersonIcon sx={{ color: '#666666', mr: 1 }} />
              }}
            />

            <TextField
              fullWidth
              margin="normal"
              name="password"
              label="Senha"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              required
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: '#ffffff',
                  color: '#000000',
                },
                '& .MuiInputBase-input': {
                  color: '#000000',
                },
                '& .MuiFormLabel-root': {
                  color: '#666666',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e0e0e0',
                }
              }}
              InputProps={{
                startAdornment: <LockIcon sx={{ color: '#666666', mr: 1 }} />
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                backgroundColor: '#1976d2',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#1565c0',
                }
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginSimple;