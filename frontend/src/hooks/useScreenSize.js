import { useState, useEffect } from 'react';

console.log('📦 [useScreenSize.js] CARREGANDO módulo');

export const useScreenSize = () => {
  console.log('📐 useScreenSize: chamado');
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    isUltraWide: false,
    isSuperWide: false,
    ratio: 1.77
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = width / height;

      setScreenSize({
        width,
        height,
        isUltraWide: width >= 3440 || ratio >= 2.3, // 21:9 ou maior
        isSuperWide: width >= 5120 || ratio >= 3.0, // 32:9 ou maior  
        ratio
      });
    };

    // Detectar tamanho inicial
    handleResize();

    // Escutar mudanças de tamanho
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};
console.log('✅ [useScreenSize.js] useScreenSize DECLARADO');

export const getOptimalLayout = (screenSize) => {
  console.log('🎨 getOptimalLayout: chamado com', screenSize);
  const { width, isUltraWide, isSuperWide } = screenSize;

  if (isSuperWide) {
    return {
      columns: 6,           // 6 colunas para cards
      maxWidth: '100%',     // Usar toda a largura
      padding: 1,           // Padding mínimo
      cardColumns: { xs: 6, sm: 4, md: 3, lg: 2, xl: 2 }, // 6 cards por linha
      contentColumns: 4,    // 4 seções principais
      fontSize: 'large'
    };
  }

  if (isUltraWide) {
    return {
      columns: 5,
      maxWidth: '100%',     // Usar toda a largura
      padding: 1.5,
      cardColumns: { xs: 6, sm: 4, md: 3, lg: 2.4, xl: 2.4 }, // 5 cards por linha
      contentColumns: 3,
      fontSize: 'medium'
    };
  }

  // Layout padréo
  return {
    columns: 4,
    maxWidth: '90%',
    padding: 4,
    cardColumns: { xs: 12, sm: 6, md: 4, lg: 3, xl: 3 }, // 4 cards por linha
    contentColumns: 2,
    fontSize: 'medium'
  };
};