/**
 * Design Tokens - Sistema de Design Unificado
 * 
 * Centraliza todas as variáveis de design (cores, espaçamentos, tipografia, etc)
 * para garantir consistência visual em todo o sistema.
 */

// ========================================
// CORES
// ========================================

export const colors = {
  // Cores primárias - Azul profissional
  primary: {
    main: '#1976d2',      // Azul principal (Material Blue 700)
    light: '#42a5f5',     // Azul claro (Material Blue 400)
    dark: '#0d47a1',      // Azul escuro (Material Blue 900)
    contrast: '#ffffff'   // Texto sobre primário
  },

  // Cores secundárias - Roxo/Rosa
  secondary: {
    main: '#9c27b0',      // Roxo principal (Material Purple 500)
    light: '#ba68c8',     // Roxo claro (Material Purple 300)
    dark: '#7b1fa2',      // Roxo escuro (Material Purple 700)
    contrast: '#ffffff'   // Texto sobre secundário
  },

  // Cores de status
  status: {
    success: '#2e7d32',   // Verde escuro - sucesso
    successLight: '#4caf50', // Verde - sucesso claro
    warning: '#ed6c02',   // Laranja - aviso
    warningLight: '#ff9800', // Laranja claro
    error: '#d32f2f',     // Vermelho - erro
    errorLight: '#f44336', // Vermelho claro
    info: '#0288d1',      // Azul claro - informação
    infoLight: '#03a9f4'  // Azul muito claro
  },

  // Tons neutros (escala de cinza)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    black: '#000000',
    white: '#ffffff'
  },

  // Cores de background
  background: {
    default: '#fafafa',   // Fundo principal
    paper: '#ffffff',     // Fundo de cards/papers
    dark: '#121212',      // Fundo escuro (modo dark)
    paperDark: '#1e1e1e'  // Cards em modo dark
  },

  // Cores de texto
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',      // Texto principal
    secondary: 'rgba(0, 0, 0, 0.6)',     // Texto secundário
    disabled: 'rgba(0, 0, 0, 0.38)',     // Texto desabilitado
    hint: 'rgba(0, 0, 0, 0.38)',         // Texto de hint
    inverse: '#ffffff',                   // Texto invertido (em fundos escuros)
    primaryDark: 'rgba(255, 255, 255, 0.87)',
    secondaryDark: 'rgba(255, 255, 255, 0.6)',
    disabledDark: 'rgba(255, 255, 255, 0.38)'
  },

  // Cores de ação (botões, links, etc)
  action: {
    active: 'rgba(0, 0, 0, 0.54)',
    hover: 'rgba(0, 0, 0, 0.04)',
    hoverOpacity: 0.04,
    selected: 'rgba(0, 0, 0, 0.08)',
    selectedOpacity: 0.08,
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
    disabledOpacity: 0.38,
    focus: 'rgba(0, 0, 0, 0.12)',
    focusOpacity: 0.12,
    activatedOpacity: 0.12
  },

  // Cores de divider
  divider: 'rgba(0, 0, 0, 0.12)',
  dividerDark: 'rgba(255, 255, 255, 0.12)'
};

// ========================================
// ESPAÇAMENTOS
// ========================================

export const spacing = {
  unit: 6, // Unidade base compacta (6px)

  // Valores pré-definidos (compactos)
  xs: 2,    // 2px
  sm: 6,    // 6px
  md: 8,    // 8px (era 16px)
  lg: 14,   // 14px (era 24px)
  xl: 20,   // 20px (era 32px)
  xxl: 28,  // 28px (era 48px)

  // Função para calcular espaçamentos
  multiply: (factor) => spacing.unit * factor
};

// ========================================
// TIPOGRAFIA
// ========================================

export const typography = {
  // Famílias de fonte
  fontFamily: {
    primary: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    code: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace'
  },

  // Tamanhos de fonte - COMPACTO
  fontSize: {
    xs: '0.7rem',     // 11px
    sm: '0.78rem',    // 12.5px
    base: '0.85rem',  // 13.6px (era 16px)
    lg: '0.95rem',    // 15px (era 18px)
    xl: '1.05rem',    // 16.8px (era 20px)
    '2xl': '1.2rem',  // 19px (era 24px)
    '3xl': '1.4rem',  // 22px (era 30px)
    '4xl': '1.7rem',  // 27px (era 36px)
    '5xl': '2.2rem'   // 35px (era 48px)
  },

  // Pesos de fonte
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },

  // Alturas de linha
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2
  },

  // Letter spacing
  letterSpacing: {
    tight: '-0.05em',
    normal: '0em',
    wide: '0.05em',
    wider: '0.1em'
  }
};

// ========================================
// SOMBRAS (SHADOWS)
// ========================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  // Sombras específicas para elevação (Material Design)
  elevation: {
    0: 'none',
    1: '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    2: '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
    3: '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
    4: '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    6: '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
    8: '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
    12: '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
    16: '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
    24: '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)'
  }
};

// ========================================
// BORDER RADIUS
// ========================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  base: '0.5rem',  // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  full: '9999px'   // Círculo/pílula
};

// ========================================
// BREAKPOINTS (Responsividade)
// ========================================

export const breakpoints = {
  values: {
    xs: 0,      // Mobile pequeno
    sm: 600,    // Mobile grande
    md: 960,    // Tablet
    lg: 1280,   // Desktop
    xl: 1920    // Desktop grande
  },

  // Helper para media queries
  up: (key) => `@media (min-width:${breakpoints.values[key]}px)`,
  down: (key) => `@media (max-width:${breakpoints.values[key] - 1}px)`,
  between: (start, end) => `@media (min-width:${breakpoints.values[start]}px) and (max-width:${breakpoints.values[end] - 1}px)`
};

// ========================================
// TRANSIÇÕES E ANIMAÇÕES
// ========================================

export const transitions = {
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195
  },

  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
  },

  // Transições pré-definidas
  create: (property = 'all', duration = transitions.duration.standard, easing = transitions.easing.easeInOut) => {
    return `${property} ${duration}ms ${easing}`;
  }
};

// ========================================
// Z-INDEX (Camadas)
// ========================================

export const zIndex = {
  mobileStepper: 1000,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500
};

// ========================================
// EXPORTAR COMO VARIÁVEIS CSS
// ========================================

export const generateCssVariables = () => {
  return `
    :root {
      /* Cores Primárias */
      --color-primary-main: ${colors.primary.main};
      --color-primary-light: ${colors.primary.light};
      --color-primary-dark: ${colors.primary.dark};
      
      /* Cores Secundárias */
      --color-secondary-main: ${colors.secondary.main};
      --color-secondary-light: ${colors.secondary.light};
      --color-secondary-dark: ${colors.secondary.dark};
      
      /* Cores de Status */
      --color-success: ${colors.status.success};
      --color-warning: ${colors.status.warning};
      --color-error: ${colors.status.error};
      --color-info: ${colors.status.info};
      
      /* Background */
      --color-bg-default: ${colors.background.default};
      --color-bg-paper: ${colors.background.paper};
      
      /* Texto */
      --color-text-primary: ${colors.text.primary};
      --color-text-secondary: ${colors.text.secondary};
      --color-text-disabled: ${colors.text.disabled};
      
      /* Espaçamentos */
      --spacing-xs: ${spacing.xs}px;
      --spacing-sm: ${spacing.sm}px;
      --spacing-md: ${spacing.md}px;
      --spacing-lg: ${spacing.lg}px;
      --spacing-xl: ${spacing.xl}px;
      
      /* Border Radius */
      --radius-sm: ${borderRadius.sm};
      --radius-base: ${borderRadius.base};
      --radius-lg: ${borderRadius.lg};
      
      /* Fonte */
      --font-family: ${typography.fontFamily.primary};
      --font-size-base: ${typography.fontSize.base};
    }
  `;
};

// Exportar tudo junto
export default {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  breakpoints,
  transitions,
  zIndex,
  generateCssVariables
};
