import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Alert,
  Button,
  Chip
} from '@mui/material';
import { Monitor, Fullscreen, ViewModule } from '@mui/icons-material';

const FullScreenDashboardTest = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const ratio = width / height;

  const checkFullScreen = () => {
    const body = document.body;
    const html = document.documentElement;
    const root = document.getElementById('root');

    console.log('🔍 VERIFICação DE TELA CHEIA:');
    console.log('📏 Dimensões:');
    console.log(`- window.innerWidth: ${window.innerWidth}px`);
    console.log(`- window.innerHeight: ${window.innerHeight}px`);
    console.log(`- body.clientWidth: ${body.clientWidth}px`);
    console.log(`- documentElement.clientWidth: ${html.clientWidth}px`);
    console.log(`- root.clientWidth: ${root.clientWidth}px`);

    console.log('🎨 Estilos aplicados:');
    const bodyStyles = getComputedStyle(body);
    console.log(`- body width: ${bodyStyles.width}`);
    console.log(`- body margin: ${bodyStyles.margin}`);
    console.log(`- body padding: ${bodyStyles.padding}`);

    const rootStyles = getComputedStyle(root);
    console.log(`- root width: ${rootStyles.width}`);
    console.log(`- root margin: ${rootStyles.margin}`);
    console.log(`- root padding: ${rootStyles.padding}`);
  };

  const forceFullScreen = () => {
    // Aplicar CSS diretamente via JavaScript
    const elements = [
      document.documentElement,
      document.body,
      document.getElementById('root')
    ];

    elements.forEach(el => {
      if (el) {
        el.style.width = '100vw';
        el.style.height = '100vh';
        el.style.margin = '0';
        el.style.padding = '0';
        el.style.maxWidth = 'none';
      }
    });

    // Forçar containers MUI
    const containers = document.querySelectorAll('.MuiContainer-root');
    containers.forEach(container => {
      container.style.maxWidth = 'none';
      container.style.width = '100vw';
      container.style.margin = '0';
    });

    console.log('✅ Tela cheia forçada!');
  };

  return (
    <Box sx={{
      width: '100vw',
      height: '100vh',
      p: 3,
      backgroundColor: '#f5f5f5',
      overflow: 'auto'
    }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6">🖥️ Teste de Tela Cheia do Dashboard</Typography>
        <Typography>
          Esta página verifica se o dashboard está ocupando toda a tela
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Informações da Tela */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Monitor sx={{ mr: 1 }} />
                <Typography variant="h6">Informações da Tela</Typography>
              </Box>

              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>resolução:</strong> {width} × {height}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Proporçéo:</strong> {ratio.toFixed(2)}:1
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Tipo:</strong> {width >= 5120 ? 'Super Ultra-Wide (5K+)' :
                  width >= 3440 ? 'Ultra-Wide' :
                    width >= 2560 ? 'QHD Wide' : 'Standard'}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`${width}×${height}`}
                  color="primary"
                  icon={<Fullscreen />}
                />
                {width >= 3440 && (
                  <Chip label="Ultra-Wide" color="success" />
                )}
                {width >= 5120 && (
                  <Chip label="Super Wide" color="error" />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Controles de Teste */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ViewModule sx={{ mr: 1 }} />
                <Typography variant="h6">Controles de Teste</Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={checkFullScreen}
                  fullWidth
                >
                  Verificar no Console (F12)
                </Button>

                <Button
                  variant="contained"
                  onClick={forceFullScreen}
                  color="warning"
                  fullWidth
                >
                  Forçar Tela Cheia
                </Button>

                <Typography variant="caption" color="text.secondary">
                  Use F12 para abrir o console e ver os resultados dos testes
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cards de Teste */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
          <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={num}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Card {num}</Typography>
              <Typography variant="body2" color="text.secondary">
                Teste de responsividade
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Largura: {width}px
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 3, backgroundColor: '#fff3e0' }}>
        <Typography variant="h6" gutterBottom>
          ✅ Se você consegue ver este conteúdo ocupando toda a tela:
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          O dashboard principal também deveria estar funcionando corretamente.
          Use os botões acima para verificar no console ou forçar tela cheia.
        </Typography>

        <Alert severity="success">
          <Typography variant="body2">
            <strong>Dica:</strong> Se o dashboard principal ainda não estiver em tela cheia,
            use o botão "Forçar Tela Cheia" e depois navegue para o dashboard.
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default FullScreenDashboardTest;