import React, { createContext, useContext, useState } from 'react';

const MenuStateContext = createContext();

export const MenuStateProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [menusDesabilitados, setMenusDesabilitados] = useState(false);

  const navigateToPage = (page) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
  };

  const desabilitarMenus = () => {
    setMenusDesabilitados(true);
  };

  const habilitarMenus = () => {
    setMenusDesabilitados(false);
  };

  const value = {
    currentPage,
    setCurrentPage,
    isMenuOpen,
    setIsMenuOpen,
    sidebarExpanded,
    setSidebarExpanded,
    navigateToPage,
    menusDesabilitados,
    desabilitarMenus,
    habilitarMenus
  };

  return (
    <MenuStateContext.Provider value={value}>
      {children}
    </MenuStateContext.Provider>
  );
};

export const useMenuState = () => {
  const context = useContext(MenuStateContext);
  if (!context) {
    throw new Error('useMenuState deve ser usado dentro de MenuStateProvider');
  }
  return context;
};