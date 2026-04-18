// Utilitário para detecçéo e configuração automática de tela
import { useEffect } from 'react';

export const detectScreenConfig = () => {
  const width = window.screen.width;
  const height = window.screen.height;
  const pixelRatio = window.devicePixelRatio || 1;

  // Detecçéo de tipos de monitor
  const isUltraWide = width >= 3440;
  const isSuperWide = width >= 5120;
  const isHighDPI = pixelRatio > 1;

  // configuração específica para 5120x1440
  const is5120x1440 = width === 5120 && height === 1440;

  // Configurações otimizadas por resolução
  const configs = {
    // Super Ultra-Wide (5120x1440)
    superWide: {
      containerPadding: { xs: 1, sm: 2, md: 3 },
      cardSpacing: { xs: 1, sm: 1.5, md: 2 },
      contentColumns: 4, // 4 colunas principais
      cardColumns: {
        xs: 12, // Mobile: 1 por linha
        sm: 6,  // Tablet: 2 por linha
        md: 4,  // Desktop: 3 por linha
        lg: 3,  // Large: 4 por linha
        xl: 2,  // XL: 6 por linha
        xxl: 2  // Super-wide: 6 por linha
      },
      fontSize: {
        h4: '2.5rem',
        h5: '2rem',
        h6: '1.5rem',
        body1: '1.1rem',
        body2: '0.95rem'
      },
      maxWidth: false, // Sem limitação de largura
      fullScreen: true
    },

    // Ultra-Wide (3440px+)
    ultraWide: {
      containerPadding: { xs: 2, sm: 3 },
      cardSpacing: { xs: 1.5, sm: 2 },
      contentColumns: 3,
      cardColumns: {
        xs: 12,
        sm: 6,
        md: 4,
        lg: 4,
        xl: 3
      },
      fontSize: {
        h4: '2.2rem',
        h5: '1.8rem',
        h6: '1.3rem',
        body1: '1rem',
        body2: '0.9rem'
      },
      maxWidth: false,
      fullScreen: true
    },

    // Standard Desktop
    standard: {
      containerPadding: { xs: 2, sm: 3 },
      cardSpacing: { xs: 2, sm: 3 },
      contentColumns: 2,
      cardColumns: {
        xs: 12,
        sm: 6,
        md: 6,
        lg: 4,
        xl: 4
      },
      fontSize: {
        h4: '2rem',
        h5: '1.5rem',
        h6: '1.25rem',
        body1: '1rem',
        body2: '0.875rem'
      },
      maxWidth: 'lg',
      fullScreen: false
    }
  };

  // Selecionar configuração baseada na resolução
  let selectedConfig;
  if (isSuperWide) {
    selectedConfig = configs.superWide;
  } else if (isUltraWide) {
    selectedConfig = configs.ultraWide;
  } else {
    selectedConfig = configs.standard;
  }

  return {
    width,
    height,
    pixelRatio,
    isUltraWide,
    isSuperWide,
    isHighDPI,
    is5120x1440,
    config: selectedConfig,

    // Informações de debug
    debug: {
      screenType: isSuperWide ? 'Super Ultra-Wide' : isUltraWide ? 'Ultra-Wide' : 'Standard',
      aspectRatio: (width / height).toFixed(2),
      totalPixels: width * height,
      configUsed: isSuperWide ? 'superWide' : isUltraWide ? 'ultraWide' : 'standard'
    }
  };
};

// função para aplicar configurações CSS dinâmicas
export const applyScreenConfig = (config) => {
  const root = document.documentElement;

  // Aplicar variáveis CSS customizadas
  if (config.isSuperWide) {
    root.style.setProperty('--container-max-width', 'none');
    root.style.setProperty('--container-padding', '8px 16px');
    root.style.setProperty('--grid-spacing', '8px');
    root.style.setProperty('--content-width', '98%');
  } else if (config.isUltraWide) {
    root.style.setProperty('--container-max-width', 'none');
    root.style.setProperty('--container-padding', '16px 24px');
    root.style.setProperty('--grid-spacing', '16px');
    root.style.setProperty('--content-width', '95%');
  } else {
    root.style.setProperty('--container-max-width', '1200px');
    root.style.setProperty('--container-padding', '24px');
    root.style.setProperty('--grid-spacing', '24px');
    root.style.setProperty('--content-width', '100%');
  }

  return config;
};

// Hook para monitoramento de mudanças de resolução
export const useScreenMonitor = (callback) => {
  useEffect(() => {
    const handleResize = () => {
      const newConfig = detectScreenConfig();
      applyScreenConfig(newConfig);
      if (callback) callback(newConfig);
    };

    // Aplicar configuração inicial
    handleResize();

    // Monitorar mudanças
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [callback]);
};

// função para otimização de performance em telas ultra-wide
export const optimizeForUltraWide = () => {
  const config = detectScreenConfig();

  if (config.isSuperWide) {
    // Otimizações específicas para 5120x1440
    return {
      enableVirtualization: true, // Para listas longas
      lazyLoadImages: true,
      reducedAnimations: false, // Hardware geralmente é potente
      maxConcurrentRequests: 8,
      chunkSize: 50
    };
  } else if (config.isUltraWide) {
    return {
      enableVirtualization: true,
      lazyLoadImages: true,
      reducedAnimations: false,
      maxConcurrentRequests: 6,
      chunkSize: 40
    };
  }

  return {
    enableVirtualization: false,
    lazyLoadImages: false,
    reducedAnimations: false,
    maxConcurrentRequests: 4,
    chunkSize: 20
  };
};

export default {
  detectScreenConfig,
  applyScreenConfig,
  useScreenMonitor,
  optimizeForUltraWide
};