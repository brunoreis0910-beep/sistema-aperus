import React, { createContext, useContext, useState } from 'react';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation deve ser usado dentro de NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  const [paginaAtual, setPaginaAtual] = useState('inicial');
  const [historico, setHistorico] = useState(['inicial']);

  const navegarPara = (pagina) => {
    setPaginaAtual(pagina);
    setHistorico(prev => [...prev, pagina]);
  };

  const voltarParaInicial = () => {
    setPaginaAtual('inicial');
    setHistorico(['inicial']);
  };

  const voltarPagina = () => {
    if (historico.length > 1) {
      const novoHistorico = historico.slice(0, -1);
      const paginaAnterior = novoHistorico[novoHistorico.length - 1];
      setHistorico(novoHistorico);
      setPaginaAtual(paginaAnterior);
    }
  };

  const podeVoltar = historico.length > 1;

  return (
    <NavigationContext.Provider value={{
      paginaAtual,
      navegarPara,
      voltarParaInicial,
      voltarPagina,
      podeVoltar,
      historico
    }}>
      {children}
    </NavigationContext.Provider>
  );
};