/**
 * Tema Unificado do Sistema
 * 
 * Tema centralizado usando os Design Tokens
 * para garantir consistência visual em todo o sistema
 */

import { createTheme } from '@mui/material/styles';
import { colors, spacing, typography, shadows, borderRadius, breakpoints, transitions, zIndex } from './designTokens';

/**
 * Tema Light (Padrão)
 */
export const lightTheme = createTheme({
  palette: {
    mode: 'light',

    // Cores primárias
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: colors.primary.contrast
    },

    // Cores secundárias
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: colors.secondary.contrast
    },

    // Cores de status
    success: {
      main: colors.status.success,
      light: colors.status.successLight,
      contrastText: colors.neutral.white
    },
    warning: {
      main: colors.status.warning,
      light: colors.status.warningLight,
      contrastText: colors.neutral.white
    },
    error: {
      main: colors.status.error,
      light: colors.status.errorLight,
      contrastText: colors.neutral.white
    },
    info: {
      main: colors.status.info,
      light: colors.status.infoLight,
      contrastText: colors.neutral.white
    },

    // Background
    background: {
      default: colors.background.default,
      paper: colors.background.paper
    },

    // Texto
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled
    },

    // Ações
    action: {
      active: colors.action.active,
      hover: colors.action.hover,
      hoverOpacity: colors.action.hoverOpacity,
      selected: colors.action.selected,
      selectedOpacity: colors.action.selectedOpacity,
      disabled: colors.action.disabled,
      disabledBackground: colors.action.disabledBackground,
      disabledOpacity: colors.action.disabledOpacity,
      focus: colors.action.focus,
      focusOpacity: colors.action.focusOpacity,
      activatedOpacity: colors.action.activatedOpacity
    },

    // Divider
    divider: colors.divider
  },

  // Tipografia
  typography: {
    fontFamily: typography.fontFamily.primary,

    // Tamanhos base
    fontSize: 16, // 1rem = 16px

    // Títulos
    h1: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.tight,
      color: colors.text.primary
    },
    h2: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.tight,
      color: colors.text.primary
    },
    h3: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      color: colors.text.primary
    },
    h4: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      color: colors.text.primary
    },
    h5: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
      color: colors.text.primary
    },
    h6: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
      color: colors.text.primary
    },

    // Corpo de texto
    body1: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.normal,
      color: colors.text.primary
    },
    body2: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.normal,
      color: colors.text.secondary
    },

    // Botões
    button: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      textTransform: 'none', // Sem CAPS
      letterSpacing: typography.letterSpacing.normal
    },

    // Caption e Overline
    caption: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.normal,
      color: colors.text.secondary
    },
    overline: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wider,
      color: colors.text.secondary
    }
  },

  // Espaçamentos - compacto
  spacing: spacing.unit, // 6px

  // Bordas arredondadas
  shape: {
    borderRadius: parseInt(borderRadius.base) // 8px
  },

  // Sombras
  shadows: [
    shadows.elevation[0],  // none
    shadows.elevation[1],
    shadows.elevation[2],
    shadows.elevation[3],
    shadows.elevation[4],
    shadows.elevation[4],
    shadows.elevation[6],
    shadows.elevation[6],
    shadows.elevation[8],
    shadows.elevation[8],
    shadows.elevation[8],
    shadows.elevation[12],
    shadows.elevation[12],
    shadows.elevation[12],
    shadows.elevation[16],
    shadows.elevation[16],
    shadows.elevation[16],
    shadows.elevation[16],
    shadows.elevation[16],
    shadows.elevation[16],
    shadows.elevation[16],
    shadows.elevation[24],
    shadows.elevation[24],
    shadows.elevation[24],
    shadows.elevation[24]
  ],

  // Breakpoints
  breakpoints: {
    values: breakpoints.values
  },

  // Transições
  transitions: {
    duration: transitions.duration,
    easing: transitions.easing,
    create: transitions.create
  },

  // Z-index
  zIndex: zIndex,

  // Customizações de componentes
  components: {
    // Toolbar compacto
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '48px !important',
          paddingLeft: '12px',
          paddingRight: '12px'
        }
      }
    },

    // Card compacto
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '8px 12px',
          '&:last-child': { paddingBottom: '8px' }
        }
      }
    },

    // Dialog Title compacto
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '10px 16px',
          fontSize: '0.95rem'
        }
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '8px 16px' }
      }
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: '6px 12px' }
      }
    },

    // Botões
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.base,
          padding: '5px 12px',
          minHeight: '30px',
          fontWeight: typography.fontWeight.medium,
          transition: transitions.create(['background-color', 'box-shadow', 'transform'], transitions.duration.short),

          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: shadows.md
          },

          '&:active': {
            transform: 'translateY(0)'
          }
        },

        contained: {
          boxShadow: shadows.sm,

          '&:hover': {
            boxShadow: shadows.md
          }
        },

        outlined: {
          borderWidth: '1.5px',

          '&:hover': {
            borderWidth: '1.5px'
          }
        }
      }
    },

    // Cards
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          boxShadow: shadows.base,
          transition: transitions.create(['box-shadow', 'transform'], transitions.duration.standard),

          '&:hover': {
            boxShadow: shadows.lg
          }
        }
      }
    },

    // Paper
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.base
        },

        elevation1: {
          boxShadow: shadows.elevation[1]
        },
        elevation2: {
          boxShadow: shadows.elevation[2]
        },
        elevation3: {
          boxShadow: shadows.elevation[3]
        },
        elevation4: {
          boxShadow: shadows.elevation[4]
        }
      }
    },

    // Inputs
    MuiTextField: {
      defaultProps: {
        InputLabelProps: { shrink: true },
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: borderRadius.base,
            transition: transitions.create(['border-color', 'box-shadow'], transitions.duration.shorter),

            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.primary.light
              }
            },

            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${colors.primary.main}20` // 20 = 12.5% opacidade
            }
          }
        }
      }
    },

    // Tabelas - COMPACTO
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.divider}`,
          padding: '6px 10px',
          fontSize: '0.9rem'
        },

        head: {
          fontWeight: typography.fontWeight.semibold,
          backgroundColor: colors.neutral[50],
          color: colors.text.primary,
          fontSize: '0.82rem',
          padding: '7px 10px'
        }
      }
    },

    // Inputs compactos
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.95rem'
        },
        input: {
          padding: '10px 12px',
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          padding: '10px 12px'
        }
      }
    },
    // FormControl — margem superior obrigatória para label não invadir elemento acima
    MuiFormControl: {
      styleOverrides: {
        root: {
          marginTop: '28px',
          marginBottom: '4px',
        }
      }
    },
    MuiInputLabel: {
      defaultProps: {
        shrink: true,   // sempre acima da borda, nunca dentro do campo
      },
      styleOverrides: {
        root: { fontSize: '0.92rem', color: '#555555' },
        outlined: { transform: 'translate(14px, -9px) scale(0.82)' },
        shrink: { transform: 'translate(14px, -9px) scale(0.82)', color: '#555555' }
      }
    },
    // Chip compacto
    MuiChip: {
      styleOverrides: {
        root: {
          height: '26px',
          fontSize: '0.82rem'
        },
        label: { paddingLeft: '8px', paddingRight: '8px' }
      }
    },

    // Chips
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.base,
          fontWeight: typography.fontWeight.medium
        }
      }
    },

    // Dialogs
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: borderRadius.lg,
          boxShadow: shadows.xl
        }
      }
    },

    // App Bar
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: shadows.sm
        }
      }
    },

    // Drawer
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${colors.divider}`
        }
      }
    }
  }
});

/**
 * Tema Dark (Opcional)
 */
export const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    mode: 'dark',

    primary: lightTheme.palette.primary,
    secondary: lightTheme.palette.secondary,
    success: lightTheme.palette.success,
    warning: lightTheme.palette.warning,
    error: lightTheme.palette.error,
    info: lightTheme.palette.info,

    background: {
      default: colors.background.dark,
      paper: colors.background.paperDark
    },

    text: {
      primary: colors.text.primaryDark,
      secondary: colors.text.secondaryDark,
      disabled: colors.text.disabledDark
    },

    divider: colors.dividerDark
  }
});

// Exportar tema padrão
export default lightTheme;
