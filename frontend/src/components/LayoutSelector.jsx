import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LayoutSelector = () => {
  const navigate = useNavigate();

  const layouts = [
    {
      name: 'Login Limpo (NOVO)',
      url: '/login-clean',
      description: 'Tela de login completamente nova, sem CSS problemático',
      status: 'recommended',
      color: 'success'
    },
    {
      name: 'Login Original',
      url: '/login',
      description: 'Tela de login original com possíveis conflitos de CSS',
      status: 'original',
      color: 'primary'
    },
    {
      name: 'Login Simples',
      url: '/login-simple',
      description: 'Versão simplificada da tela de login',
      status: 'alternative',
      color: 'info'
    },
    {
      name: 'Auto Login',
      url: '/auto-login',
      description: 'Login automático para desenvolvimento',
      status: 'dev',
      color: 'warning'
    }
  ];

  const dashboardLayouts = [
    {
      name: 'Dashboard Limpo (NOVO)',
      url: '/home',
      description: 'Layout completamente novo, limpo e responsivo',
      status: 'recommended',
      color: 'success'
    },
    {
      name: 'Teste Tela Inteira',
      url: '/fullscreen-test',
      description: 'Teste das otimizações de tela inteira',
      status: 'test',
      color: 'secondary'
    },
    {
      name: 'Demo Ultra-Wide',
      url: '/demo',
      description: 'Demonstração para monitores ultra-wide',
      status: 'demo',
      color: 'info'
    }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      p: 3
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Alert severity="success" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            🎉 Layout Completamente Renovado!
          </Typography>
          <Typography>
            Removidos todos os CSS problemáticos que causavam a tela preta.
            Escolha uma das opções abaixo para testar o novo layout limpo.
          </Typography>
        </Alert>

        {/* Telas de Login */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              🔐 Opções de Login
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Escolha uma das telas de login para testar
            </Typography>

            <Grid container spacing={2}>
              {layouts.map((layout, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => navigate(layout.url)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          {layout.name}
                        </Typography>
                        <Chip
                          label={layout.status}
                          color={layout.color}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {layout.description}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 2 }}
                        onClick={() => navigate(layout.url)}
                      >
                        Testar
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Telas do Dashboard */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              📊 Opções do Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Layouts do sistema principal (requer login)
            </Typography>

            <Grid container spacing={2}>
              {dashboardLayouts.map((layout, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => navigate(layout.url)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          {layout.name}
                        </Typography>
                        <Chip
                          label={layout.status}
                          color={layout.color}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {layout.description}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 2 }}
                        onClick={() => navigate(layout.url)}
                      >
                        Testar
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Divider sx={{ my: 4 }} />

        {/* Informações Técnicas */}
        <Card sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              🔧 Correções Aplicadas
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  ✅ Problemas Resolvidos:
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Tela preta removida
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • CSS conflitante eliminado
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Layout completamente recriado
                </Typography>
                <Typography variant="body2">
                  • Componentes limpos e funcionais
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  🎨 Melhorias Aplicadas:
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Design moderno e limpo
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Responsividade otimizada
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Cores e contraste melhorados
                </Typography>
                <Typography variant="body2">
                  • Performance otimizada
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default LayoutSelector;