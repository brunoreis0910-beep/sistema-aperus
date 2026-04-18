import React from 'react';
import { Box } from '@mui/material';
import { useMenu } from './MenuContext';
import { useNavigation } from './NavigationContext';
import { iconMapping } from '../config/iconMapping';

const MenuPrincipal = () => {
  const { menusHabilitados } = useMenu();
  const { navegarPara } = useNavigation();

  const menuItems = [
    { id: 'inicial', label: 'Início', iconName: 'inicial' },
    { id: 'cadastro', label: 'Cadastro', iconName: 'cadastro' },
    { id: 'produto', label: 'Produto', iconName: 'produto' },
    { id: 'cliente', label: 'Cliente', iconName: 'cliente' },
    { id: 'financeiro', label: 'Financeiro', iconName: 'financeiro' },
    { id: 'cheques', label: 'Cheques', iconName: 'cheques' },
    { id: 'autorizacao', label: 'Autorização', iconName: 'autorizacao' },
    { id: 'configuracoes', label: 'Configurações', iconName: 'configuracoes' },
    { id: 'compra', label: 'Compra', iconName: 'compra' },
    { id: 'venda', label: 'Venda', iconName: 'venda' },
  ];

  const handleMenuClick = (pagina, event) => {
    event.preventDefault();
    if (!menusHabilitados) {
      return;
    }
    navegarPara(pagina);
  };

  return (
    <nav className="menu-principal">
      <ul className="menu-list">
        {menuItems.map((item) => {
          const IconComponent = iconMapping[item.iconName];

          return (
            <li key={item.id} className="menu-item">
              <a
                href="#"
                onClick={(e) => handleMenuClick(item.id, e)}
                className={`menu-link ${!menusHabilitados ? 'disabled' : ''}`}
                style={{
                  pointerEvents: menusHabilitados ? 'auto' : 'none',
                  opacity: menusHabilitados ? 1 : 0.5,
                  cursor: menusHabilitados ? 'pointer' : 'not-allowed'
                }}
              >
                <Box
                  component="span"
                  className="menu-icon"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    mr: 1
                  }}
                >
                  {IconComponent && <IconComponent sx={{ fontSize: 24 }} />}
                </Box>
                <span className="menu-text">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MenuPrincipal;