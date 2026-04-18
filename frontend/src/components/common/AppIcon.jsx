/**
 * Componente AppIcon - Ícone Reutilizável
 * 
 * Facilita o uso de ícones Material em todo o sistema
 * usando o mapeamento centralizado
 */

import React from 'react';
import { Box } from '@mui/material';
import { iconMapping } from '../../config/iconMapping';

/**
 * Componente de ícone padronizado
 * 
 * @param {string} name - Nome do ícone (conforme iconMapping)
 * @param {string} size - Tamanho: 'small' | 'medium' | 'large' | 'xlarge'
 * @param {string} color - Cor do tema: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'inherit'
 * @param {object} sx - Estilos adicionais (MUI sx prop)
 * @param {object} ...props - Outras props passadas ao componente do ícone
 * 
 * @example
 * // Ícone simples
 * <AppIcon name="venda" />
 * 
 * @example
 * // Ícone grande e colorido
 * <AppIcon name="cliente" size="large" color="primary" />
 * 
 * @example
 * // Ícone com estilos customizados
 * <AppIcon 
 *   name="produto" 
 *   size="xlarge" 
 *   sx={{ mr: 2, cursor: 'pointer' }}
 *   onClick={handleClick}
 * />
 */
const AppIcon = ({
  name,
  size = 'medium',
  color = 'inherit',
  sx = {},
  ...props
}) => {
  // Buscar o componente do ícone
  const IconComponent = iconMapping[name];

  // Se o ícone não existir, não renderizar nada (ou pode renderizar um placeholder)
  if (!IconComponent) {
    console.warn(`Ícone "${name}" não encontrado no iconMapping`);
    return null;
  }

  // Mapa de tamanhos
  const sizeMap = {
    small: 20,
    medium: 24,
    large: 32,
    xlarge: 48,
    xxlarge: 64
  };

  // Obter tamanho em pixels
  const iconSize = sizeMap[size] || sizeMap.medium;

  // Determinar a cor
  const getColor = () => {
    if (color === 'inherit') return 'inherit';

    // Cores do tema MUI
    const themeColors = {
      primary: 'primary.main',
      secondary: 'secondary.main',
      success: 'success.main',
      error: 'error.main',
      warning: 'warning.main',
      info: 'info.main',
      text: 'text.primary',
      textSecondary: 'text.secondary',
      disabled: 'text.disabled'
    };

    return themeColors[color] || color;
  };

  return (
    <IconComponent
      sx={{
        fontSize: iconSize,
        color: getColor(),
        ...sx
      }}
      {...props}
    />
  );
};

/**
 * Componente para agrupar ícones em um Box
 * Útil para menus, toolbars, etc
 */
export const AppIconGroup = ({ children, spacing = 1, ...props }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

/**
 * Componente de ícone com texto
 * Útil para botões e menu items
 */
export const AppIconWithText = ({
  iconName,
  text,
  iconSize = 'medium',
  iconColor = 'inherit',
  iconPosition = 'left', // 'left' | 'right' | 'top' | 'bottom'
  spacing = 1,
  ...props
}) => {
  const IconComponent = iconMapping[iconName];

  if (!IconComponent) {
    return <span>{text}</span>;
  }

  const iconElement = (
    <AppIcon name={iconName} size={iconSize} color={iconColor} />
  );

  const textElement = <span>{text}</span>;

  const flexDirection = {
    left: 'row',
    right: 'row-reverse',
    top: 'column',
    bottom: 'column-reverse'
  }[iconPosition] || 'row';

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing,
        flexDirection,
        ...props.sx
      }}
      {...props}
    >
      {iconElement}
      {textElement}
    </Box>
  );
};

export default AppIcon;
