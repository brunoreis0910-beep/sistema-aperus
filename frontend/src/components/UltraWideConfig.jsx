import React, { useEffect } from 'react';
import { Alert, Box, Typography, Chip } from '@mui/material';

const UltraWideConfig = ({ children }) => {
  useEffect(() => {
    // Detectar resolução e aplicar configurações
    const applyUltraWideConfig = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = width / height;

      console.log(`🖥️ resolução detectada: ${width}x${height} (${ratio.toFixed(2)}:1)`);

      // Configurações específicas para diferentes resoluções
      if (width >= 5120) {
        document.documentElement.style.setProperty('--dashboard-padding', '48px');
        document.documentElement.style.setProperty('--content-max-width', '100%');
        document.documentElement.style.setProperty('--grid-spacing', '24px');
      } else if (width >= 3440) {
        document.documentElement.style.setProperty('--dashboard-padding', '32px');
        document.documentElement.style.setProperty('--content-max-width', '100%');
        document.documentElement.style.setProperty('--grid-spacing', '20px');
      } else if (width >= 2560) {
        document.documentElement.style.setProperty('--dashboard-padding', '24px');
        document.documentElement.style.setProperty('--content-max-width', '100%');
        document.documentElement.style.setProperty('--grid-spacing', '16px');
      } else {
        document.documentElement.style.setProperty('--dashboard-padding', '16px');
        document.documentElement.style.setProperty('--content-max-width', '1200px');
        document.documentElement.style.setProperty('--grid-spacing', '12px');
      }

      // Força CSS de tela cheia
      const style = document.createElement('style');
      style.textContent = `
        html, body, #root {
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .MuiContainer-root {
          max-width: none !important;
          width: 100vw !important;
          margin: 0 !important;
        }
      `;
      document.head.appendChild(style);
    };

    applyUltraWideConfig();

    // Reagir a mudanças de tamanho
    window.addEventListener('resize', applyUltraWideConfig);

    return () => {
      window.removeEventListener('resize', applyUltraWideConfig);
    };
  }, []);

  return <>{children}</>;
};

export default UltraWideConfig;