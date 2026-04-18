import React from 'react';
import { Box, Container, ThemeProvider } from '@mui/material';
import DashboardHome from '../pages/DashboardHome';
import { useScreenSize } from '../hooks/useScreenSize';
import { detectScreenConfig, applyScreenConfig } from '../utils/screenDetection';
import ScreenDebugInfo from './ScreenDebugInfo';
import neutralTheme from '../theme/neutralTheme';

const UltraWideDemo = () => {
  const screenSize = useScreenSize();

  // Aplicar configuração de tela automaticamente
  React.useEffect(() => {
    const config = detectScreenConfig();
    applyScreenConfig(config);

    // Log de debug para verificar detecçéo
    console.log('🖥️ Demo Ultra-Wide - configuração Detectada:', {
      resolução: `${config.width}x${config.height}`,
      tipo: config.debug.screenType,
      aspectRatio: config.debug.aspectRatio,
      configUsada: config.debug.configUsed
    });
  }, []);

  return (
    <ThemeProvider theme={neutralTheme}>
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: '#fafafa', // Cor de fundo mais neutra
        width: '100vw', // Usar toda a largura da viewport
        maxWidth: 'none',
        margin: 0,
        padding: 0,
        overflow: 'auto'
      }}>
        {/* Container principal sem limitação de largura */}
        <Container
          maxWidth={false}
          disableGutters
          sx={{
            width: '100%',
            maxWidth: 'none',
            p: 2,
            m: 0
          }}
        >
          {/* Componente Dashboard com otimizações */}
          <DashboardHome />
        </Container>

        {/* Debug Info sempre visível para demonstração */}
        <ScreenDebugInfo enabled={true} />
      </Box>
    </ThemeProvider>
  );
};

export default UltraWideDemo;