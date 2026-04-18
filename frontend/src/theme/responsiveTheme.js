import { createTheme } from '@mui/material/styles';

const responsiveTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '2rem',
      },
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '1.125rem',
      },
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
    body1: {
      fontSize: '1rem',
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
      },
    },
    body2: {
      fontSize: '0.875rem',
      '@media (max-width:600px)': {
        fontSize: '0.75rem',
      },
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
      xxl: 2560,    // Ultra-wide monitors
      ultrawide: 3440, // Ultra-wide 21:9
      superwide: 5120  // Super ultra-wide 32:9
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
          '@media (max-width:600px)': {
            padding: '6px 12px',
            fontSize: '0.875rem',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
          transition: 'box-shadow 0.3s ease-in-out',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover fieldset': {
              borderColor: '#1976d2',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8f9fa',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#2c3e50',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          '@media (max-width:600px)': {
            margin: 0,
            borderRadius: 0,
            maxHeight: 'none',
            height: '100%',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 25px rgba(25, 118, 210, 0.4)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            paddingLeft: 8,
            paddingRight: 8,
          },
          '@media (min-width:3440px)': {
            maxWidth: '90%',
            paddingLeft: 32,
            paddingRight: 32,
          },
          '@media (min-width:5120px)': {
            maxWidth: '85%',
            paddingLeft: 64,
            paddingRight: 64,
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '2px 0 12px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
          '@media (max-width:600px)': {
            minHeight: 40,
          },
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 48,
          fontWeight: 500,
          '@media (max-width:600px)': {
            minHeight: 40,
            fontSize: '0.875rem',
            padding: '6px 12px',
          },
        },
      },
    },
  },
});

// Extensões personalizadas para responsividade
responsiveTheme.custom = {
  // Espaçamentos responsivos
  spacing: {
    mobile: {
      padding: responsiveTheme.spacing(1, 2),
      margin: responsiveTheme.spacing(1),
    },
    tablet: {
      padding: responsiveTheme.spacing(2, 3),
      margin: responsiveTheme.spacing(2),
    },
    desktop: {
      padding: responsiveTheme.spacing(3, 4),
      margin: responsiveTheme.spacing(3),
    },
  },
  // Tamanhos de componentes responsivos
  componentSizes: {
    avatar: {
      small: { width: 32, height: 32 },
      medium: { width: 40, height: 40 },
      large: { width: 48, height: 48 },
    },
    icon: {
      small: 16,
      medium: 20,
      large: 24,
    },
  },
  // Mixins para responsividade
  mixins: {
    responsivePadding: {
      padding: responsiveTheme.spacing(1, 2),
      [responsiveTheme.breakpoints.up('sm')]: {
        padding: responsiveTheme.spacing(2, 3),
      },
      [responsiveTheme.breakpoints.up('md')]: {
        padding: responsiveTheme.spacing(3, 4),
      },
    },
    responsiveMargin: {
      margin: responsiveTheme.spacing(1),
      [responsiveTheme.breakpoints.up('sm')]: {
        margin: responsiveTheme.spacing(2),
      },
      [responsiveTheme.breakpoints.up('md')]: {
        margin: responsiveTheme.spacing(3),
      },
    },
    mobileFriendly: {
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
        padding: responsiveTheme.spacing(1),
        margin: responsiveTheme.spacing(0.5),
      },
    },
  },
};

export default responsiveTheme;