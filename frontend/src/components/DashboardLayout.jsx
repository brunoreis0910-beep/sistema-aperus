import React from 'react';
import { Outlet, useLocation, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Logout as LogoutIcon,
  AccountCircle,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as VendasIcon,
  People as ClientesIcon,
  Inventory as ProdutosIcon,
  LocalShipping as ComprasIcon,
  Business as FornecedoresIcon,
  AccountBalance as FinanceiroIcon,
  Lock as AprovacoesIcon,
  Settings as ConfigIcon
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';
import { useScreenSize } from '../hooks/useScreenSize';
import { detectScreenConfig, applyScreenConfig } from '../utils/screenDetection';
import ScreenDebugInfo from './ScreenDebugInfo';
import NotificationBell from './NotificationBell';
import AIChat from './AIChat';  // ASSISTENTE IA

const StyledMainBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  borderRadius: 0, // Remover bordas para full-screen
  boxShadow: 'none', // Remover sombra para full-screen
  width: '100%',
  minHeight: 'calc(100vh - 64px)', // Altura total menos AppBar
  overflow: 'hidden' // Evitar scroll desnecessário
}));

function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const screenSize = useScreenSize();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Aplicar configuração de tela automaticamente
  React.useEffect(() => {
    const config = detectScreenConfig();
    applyScreenConfig(config);

    // Log de debug para verificar detecçéo
    console.log('🖥️ configuração de Tela Detectada:', {
      resolução: `${config.width}x${config.height}`,
      tipo: config.debug.screenType,
      aspectRatio: config.debug.aspectRatio,
      configUsada: config.debug.configUsed
    });
  }, []);

  // configuração dinâmica baseada na resolução
  const layoutConfig = React.useMemo(() => {
    if (screenSize.isSuperWide) {
      return {
        containerMaxWidth: false,
        containerPadding: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 },
        contentPadding: { xs: 0.5, sm: 1, md: 1, lg: 1, xl: 1 },
        tabMinWidth: 200,
        tabFontSize: '1.1rem'
      };
    } else if (screenSize.isUltraWide) {
      return {
        containerMaxWidth: false,
        containerPadding: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 },
        contentPadding: { xs: 1, sm: 1.5, md: 1.5, lg: 2, xl: 2 },
        tabMinWidth: 180,
        tabFontSize: '1rem'
      };
    } else {
      return {
        containerMaxWidth: 'xl',
        containerPadding: { xs: 1, sm: 2, md: 3 },
        contentPadding: { xs: 1, sm: 2, md: 3 },
        tabMinWidth: 120,
        tabFontSize: '0.875rem'
      };
    }
  }, [screenSize]);

  // Define a aba atual lendo a URL
  const getCurrentTab = () => {
    const path = location.pathname.split('/')[1];
    if (['clientes', 'produtos', 'financeiro', 'vendas', 'compras', 'fornecedores', 'aprovacoes', 'configuracoes'].includes(path)) {
      return path;
    }
    return 'home';
  };
  const currentTab = getCurrentTab();

  // Organizado em grupos lógicos: Vendas → Cadastros → Operações → Financeiro → Sistema
  const menuItems = [
    { key: 'home', label: 'Dashboard', icon: <DashboardIcon />, path: '/home' },
    { key: 'vendas', label: 'Vendas', icon: <VendasIcon />, path: '/vendas' },
    { key: 'clientes', label: 'Clientes', icon: <ClientesIcon />, path: '/clientes' },
    { key: 'produtos', label: 'Produtos', icon: <ProdutosIcon />, path: '/produtos' },
    { key: 'fornecedores', label: 'Fornecedores', icon: <FornecedoresIcon />, path: '/fornecedores' },
    { key: 'compras', label: 'Compras', icon: <ComprasIcon />, path: '/compras' },
    { key: 'financeiro', label: 'Financeiro', icon: <FinanceiroIcon />, path: '/financeiro' },
    { key: 'aprovacoes', label: 'Autorização', icon: <AprovacoesIcon />, path: '/aprovacoes' },
    { key: 'configuracoes', label: 'Config', icon: <ConfigIcon />, path: '/configuracoes' }
  ];

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuItemClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Bar Superior */}
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(45deg, #0d47a1 30%, #1976d2 90%)',
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar variant={isSmallScreen ? "dense" : "regular"}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleMobileMenuToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant={isSmallScreen ? "h6" : "h5"}
            component="div"
            sx={{ flexGrow: 1 }}
          >
            {isSmallScreen ? 'APERUS' : 'APERUS'}
            {!isSmallScreen && user && (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {user?.first_name || user?.username}
              </Typography>
            )}
          </Typography>

          <NotificationBell />
            
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/configuracoes'); }}>
              <ConfigIcon sx={{ mr: 1 }} />
              Configurações
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 300,
            background: '#1976d2'
          },
        }}
      >
        <Box sx={{
          p: 2.5,
          borderBottom: '2px solid rgba(255,255,255,0.2)'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
            APERUS
          </Typography>
          <Typography variant="body1" sx={{ color: '#ffffff', opacity: 0.9, fontSize: '1.05rem' }}>
            {user?.first_name || user?.username}
          </Typography>
        </Box>
        <List sx={{ p: 1.5 }}>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.key}
              onClick={() => handleMobileMenuItemClick(item.path)}
              selected={currentTab === item.key}
              sx={{
                borderRadius: '12px',
                py: 1.5,
                px: 2,
                mb: 1,
                backgroundColor: 'transparent',
                color: 'rgba(255, 255, 255, 0.85)',
                transition: 'all 0.3s ease',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.2)'
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  transform: 'translateX(4px)'
                }
              }}
            >
              <ListItemIcon sx={{
                color: 'inherit',
                minWidth: 50
              }}>
                {React.cloneElement(item.icon, {
                  sx: {
                    fontSize: '2.2rem'
                  }
                })}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: currentTab === item.key ? 700 : 500,
                  fontSize: '1.15rem'
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Container Principal */}
      <Container
        component="main"
        maxWidth={layoutConfig.containerMaxWidth}
        sx={{
          mt: 0, // Remover margem top para full-screen
          mb: 0, // Remover margem bottom para full-screen
          px: layoutConfig.containerPadding,
          width: '100vw !important',
          maxWidth: '100vw !important', // Force full viewport width
          marginLeft: 0,
          marginRight: 0,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <StyledMainBox>
          {/* Navegação por Tabs - Desktop */}
          {!isMobile && (
            <Box sx={{
              background: '#1976d2',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              px: 2,
              py: 1
            }}>
              <Tabs
                value={currentTab}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTab-root': {
                    minWidth: 140,
                    fontSize: '1.3rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    letterSpacing: '0.5px',
                    color: 'rgba(255, 255, 255, 0.85)',
                    padding: '14px 20px',
                    minHeight: '68px',
                    transition: 'all 0.3s ease',
                    borderRadius: '8px',
                    margin: '0 2px',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff'
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }
                  },
                  '& .MuiTabs-indicator': {
                    height: 4,
                    backgroundColor: '#ffffff',
                    borderRadius: '4px 4px 0 0'
                  }
                }}
              >
                {menuItems.map((item) => (
                  <Tab
                    key={item.key}
                    label={item.label}
                    value={item.key}
                    to={item.path}
                    component={RouterLink}
                    icon={React.cloneElement(item.icon, {
                      sx: {
                        fontSize: '2rem'
                      }
                    })}
                    iconPosition="start"
                  />
                ))}
              </Tabs>
            </Box>
          )}

          {/* Área de Conteúdo */}
          <Box
            sx={{
              flexGrow: 1,
              p: layoutConfig.contentPadding,
              overflow: 'auto',
              height: 'calc(100vh - 112px)', // Altura total menos AppBar e Tabs
              width: '100%',
              maxWidth: 'none'
            }}
          >
            <Outlet />
          </Box>

        </StyledMainBox>
      </Container>

      {/* Debug Info para ultra-wide */}
      <ScreenDebugInfo enabled={screenSize.isUltraWide} />
      
      {/* Assistente IA Flutuante */}
      <AIChat />
    </Box>
  );
}

export default DashboardLayout;