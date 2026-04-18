import React, { createContext, useContext, useState } from 'react';

// Contexto para gerenciar o estado dos menus
const MenuContext = createContext();

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu deve ser usado dentro de MenuProvider');
  }
  return context;
};

export const MenuProvider = ({ children }) => {
  const [menusHabilitados, setMenusHabilitados] = useState(true);

  const habilitarMenus = () => {
    setMenusHabilitados(true);
  };

  const desabilitarMenus = () => {
    setMenusHabilitados(false);
  };

  return (
    <MenuContext.Provider value={{
      menusHabilitados,
      habilitarMenus,
      desabilitarMenus
    }}>
      {children}
    </MenuContext.Provider>
  );
};