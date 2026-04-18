import { createTheme } from '@mui/material/styles';

/**
 * Tema Profissional Moderno para Sistema Gerencial
 * 
 * Paleta de cores cuidadosamente selecionada para:
 * - Reduzir fadiga visual
 * - Melhorar hierarquia de informações
 * - Proporcionar melhor contraste e acessibilidade
 * - Visual moderno e profissional
 */
export const modernTheme = createTheme({
    palette: {
        mode: 'light',

        // Cores primárias - Azul corporativo moderno
        primary: {
            main: '#0052CC', // Azul forte profissional (Atlassian blue)
            light: '#2684FF',
            dark: '#003380',
            contrastText: '#FFFFFF',
        },

        // Cores secundárias - Verde para ações positivas
        secondary: {
            main: '#00875A', // Verde sucesso
            light: '#36B37E',
            dark: '#006644',
            contrastText: '#FFFFFF',
        },

        // Background - Tons suaves
        background: {
            default: '#F4F5F7', // Cinza muito claro
            paper: '#FFFFFF',
            neutral: '#FAFBFC', // Alternativa para cards
        },

        // Textos - Alto contraste
        text: {
            primary: '#172B4D', // Azul escuro (quase preto)
            secondary: '#5E6C84', // Cinza médio
            disabled: '#A5ADBA',
        },

        // Status colors - Semântica clara
        success: {
            main: '#00875A',
            light: '#79F2C0',
            dark: '#006644',
            contrastText: '#FFFFFF',
        },
        warning: {
            main: '#FF991F',
            light: '#FFAB00',
            dark: '#FF8B00',
            contrastText: '#172B4D',
        },
        error: {
            main: '#DE350B',
            light: '#FF5630',
            dark: '#BF2600',
            contrastText: '#FFFFFF',
        },
        info: {
            main: '#0065FF',
            light: '#4C9AFF',
            dark: '#0747A6',
            contrastText: '#FFFFFF',
        },

        // Cores adicionais para diferentes contextos
        action: {
            active: '#0052CC',
            hover: '#F4F5F7',
            selected: '#DEEBFF',
            disabled: '#A5ADBA',
            disabledBackground: '#F4F5F7',
        },

        divider: '#DFE1E6',
    },

    // Tipografia moderna e legível
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',

        // Títulos - Hierarquia clara
        h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.01562em',
            color: '#172B4D',
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: '-0.00833em',
            color: '#172B4D',
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.4,
            color: '#172B4D',
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.4,
            color: '#172B4D',
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.5,
            color: '#172B4D',
        },
        h6: {
            fontSize: '1.125rem',
            fontWeight: 600,
            lineHeight: 1.5,
            color: '#172B4D',
        },

        // Corpo de texto
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
            color: '#172B4D',
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.57,
            color: '#5E6C84',
        },

        // Botões e labels
        button: {
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none', // Sem caixa alta
            letterSpacing: '0.02857em',
        },
        caption: {
            fontSize: '0.75rem',
            lineHeight: 1.66,
            color: '#5E6C84',
        },
        overline: {
            fontSize: '0.75rem',
            fontWeight: 600,
            lineHeight: 2.66,
            letterSpacing: '0.08333em',
            textTransform: 'uppercase',
            color: '#5E6C84',
        },
    },

    // Formas e bordas
    shape: {
        borderRadius: 8,
    },

    // Sombras customizadas - mais suaves
    shadows: [
        'none',
        '0px 1px 3px rgba(0, 0, 0, 0.04), 0px 0px 0px 1px rgba(0, 0, 0, 0.02)',
        '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 0px 0px 1px rgba(0, 0, 0, 0.02)',
        '0px 3px 6px rgba(0, 0, 0, 0.06), 0px 0px 0px 1px rgba(0, 0, 0, 0.02)',
        '0px 4px 8px rgba(0, 0, 0, 0.07), 0px 0px 0px 1px rgba(0, 0, 0, 0.02)',
        '0px 6px 12px rgba(0, 0, 0, 0.08), 0px 0px 0px 1px rgba(0, 0, 0, 0.02)',
        '0px 8px 16px rgba(0, 0, 0, 0.09), 0px 0px 0px 1px rgba(0, 0, 0, 0.02)',
        '0px 12px 24px rgba(0, 0, 0, 0.10), 0px 0px 0px 1px rgba(0, 0, 0, 0.02)',
        '0px 16px 32px rgba(0, 0, 0, 0.11), 0px 0px 0px 1px rgba(0, 0, 0, 0.02)',
        '0px 20px 40px rgba(0, 0, 0, 0.12), 0px 0px 0px 1px rgba(0, 0, 0, 0.02)',
        ...Array(15).fill('none'),
    ],

    // Componentes customizados
    components: {
        // Cards - Visual limpo e moderno
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08), 0px 0px 0px 1px rgba(0, 0, 0, 0.03)',
                    borderRadius: 12,
                    border: '1px solid #DFE1E6',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12), 0px 0px 0px 1px rgba(0, 0, 0, 0.04)',
                        transform: 'translateY(-2px)',
                    },
                },
            },
        },

        // Paper - Elevação sutil
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                elevation1: {
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.04), 0px 0px 0px 1px rgba(0, 0, 0, 0.02)',
                },
                elevation2: {
                    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.06), 0px 0px 0px 1px rgba(0, 0, 0, 0.02)',
                },
            },
        },

        // Botões - Destaque adequado
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                    fontWeight: 500,
                    padding: '8px 16px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                contained: {
                    '&:hover': {
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(180deg, #0052CC 0%, #0747A6 100%)',
                    '&:hover': {
                        background: 'linear-gradient(180deg, #0065FF 0%, #0052CC 100%)',
                    },
                },
                outlined: {
                    borderWidth: '2px',
                    '&:hover': {
                        borderWidth: '2px',
                        backgroundColor: 'rgba(0, 82, 204, 0.04)',
                    },
                },
            },
        },

        // AppBar - Header moderno
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#FFFFFF',
                    color: '#172B4D',
                    boxShadow: '0px 1px 0px rgba(0, 0, 0, 0.08)',
                    borderBottom: '1px solid #DFE1E6',
                },
            },
        },

        // Drawer - Sidebar elegante
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#FAFBFC',
                    borderRight: '1px solid #DFE1E6',
                },
            },
        },

        // Inputs - Campos de formulário
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: '#DFE1E6',
                            borderWidth: '2px',
                        },
                        '&:hover fieldset': {
                            borderColor: '#B3D4FF',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#0052CC',
                        },
                    },
                },
            },
        },

        // Tables - Tabelas limpas
        MuiTableHead: {
            styleOverrides: {
                root: {
                    backgroundColor: '#F4F5F7',
                    '& .MuiTableCell-head': {
                        color: '#5E6C84',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    },
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: '#F4F5F7',
                    },
                    '&.MuiTableRow-hover:hover': {
                        backgroundColor: '#DEEBFF',
                    },
                },
            },
        },

        // Chips - Tags e badges
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    fontWeight: 500,
                },
                filled: {
                    border: '1px solid transparent',
                },
            },
        },

        // Tooltips - Dicas contextuais
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#172B4D',
                    fontSize: '0.75rem',
                    padding: '8px 12px',
                    borderRadius: 6,
                },
            },
        },

        // Dialog - Modais
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 12,
                    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
                },
            },
        },

        // Tabs - Abas de navegação
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    minHeight: 48,
                    '&.Mui-selected': {
                        color: '#0052CC',
                        fontWeight: 600,
                    },
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                },
            },
        },
    },

    // Transições suaves
    transitions: {
        duration: {
            shortest: 150,
            shorter: 200,
            short: 250,
            standard: 300,
            complex: 375,
            enteringScreen: 225,
            leavingScreen: 195,
        },
    },
});

export default modernTheme;
