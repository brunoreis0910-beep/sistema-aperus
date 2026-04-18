import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  SwapHoriz as SwapHorizIcon,
  People as PeopleIcon,
  Apartment as ApartmentIcon,
  AccountTree as AccountTreeIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  Warehouse as WarehouseIcon,
  SupportAgent as VendedorIcon,
  Inventory as InventoryIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  ReceiptLong as TributacaoIcon,
  PhoneAndroid as PhoneAndroidIcon
} from '@mui/icons-material';
import DepositosConfig from '../components/DepositosConfig';
import GruposProdutoConfig from '../components/GruposProdutoConfig';
import ProdutoConfig from '../components/ProdutoConfig';
import EmpresaConfig from '../components/EmpresaConfig';
import OperacoesConfig from '../components/OperacoesConfig';
import UsuariosConfig from '../components/UsuariosConfig';
import DepartamentosConfig from '../components/DepartamentosConfig';
import CentroCustoConfig from '../components/CentroCustoConfig';
import FormasPagamentoConfig from '../components/FormasPagamentoConfig';
import ContasBancariasConfig from '../components/ContasBancariasConfig';
import VendedoresConfig from '../components/VendedoresConfig';
import DocumentosFiscaisPage from '../components/DocumentosFiscaisPage';
import TributacaoConfig from '../components/TributacaoConfig';
import ConfiguracaoEmail from '../components/ConfiguracaoEmail';
import ImpressaoConfig from '../components/ImpressaoConfig';
import MercadoPagoConfig from '../components/MercadoPagoConfig';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SettingsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const tabs = [
    {
      label: 'Grupos de Produtos',
      icon: <CategoryIcon />,
      component: <GruposProdutoConfig />
    },
    {
      label: 'Produto',
      icon: <InventoryIcon />,
      component: <ProdutoConfig />
    },
    {
      label: 'Depósitos',
      icon: <WarehouseIcon />,
      component: <DepositosConfig />
    },
    {
      label: 'Empresa',
      icon: <BusinessIcon />,
      component: <EmpresaConfig />
    },
    {
      label: 'Documentos Fiscais',
      icon: <DescriptionIcon />, 
      component: <DocumentosFiscaisPage />
    },
    {
      label: 'Tributação',
      icon: <TributacaoIcon />,
      component: <TributacaoConfig />
    },
    {
      label: 'Operações',
      icon: <SwapHorizIcon />,
      component: <OperacoesConfig />
    },
    {
      label: 'Usuários',
      icon: <PeopleIcon />,
      component: <UsuariosConfig />
    },
    {
      label: 'Vendedores',
      icon: <VendedorIcon />,
      component: <VendedoresConfig />
    },
    {
      label: 'Departamentos',
      icon: <ApartmentIcon />,
      component: <DepartamentosConfig />
    },
    {
      label: 'Centro de Custo',
      icon: <AccountTreeIcon />,
      component: <CentroCustoConfig />
    },
    {
      label: 'Formas de Pagamento',
      icon: <PaymentIcon />,
      component: <FormasPagamentoConfig />
    },
    {
      label: 'Contas Bancárias',
      icon: <BankIcon />,
      component: <ContasBancariasConfig />
    },
    {
      label: 'Segurança',
      icon: <SecurityIcon />,
      component: <Typography>Configurações de segurança em desenvolvimento...</Typography>
    },
    {
      label: 'Notificações',
      icon: <NotificationsIcon />,
      component: <Typography>Configurações de notificações em desenvolvimento...</Typography>
    },
    {
      label: 'E-mail',
      icon: <EmailIcon />,
      component: <ConfiguracaoEmail />
    },
    {
      label: 'Impressão',
      icon: <PrintIcon />,
      component: <ImpressaoConfig />
    },
    {
      label: 'Mercado Pago',
      icon: <PhoneAndroidIcon />,
      component: <MercadoPagoConfig />
    },
  ];

  return (
    <Box sx={{
      width: '100%',
      p: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
      '@media (min-width: 3440px)': {
        p: 6
      },
      '@media (min-width: 5120px)': {
        p: 8
      }
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        mb: { xs: 2, sm: 3 }
      }}>
        <SettingsIcon sx={{
          fontSize: { xs: 32, sm: 40 },
          color: 'primary.main',
          mr: 2
        }} />
        <Typography
          variant={isMobile ? "h5" : "h4"}
          sx={{ fontWeight: 'bold' }}
        >
          Configurações
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: { xs: 48, sm: 64 },
              textTransform: 'none',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 500,
              minWidth: { xs: 80, sm: 120 },
            },
            '& .MuiTabScrollButton-root': {
              width: 40,
              opacity: 1,
              '&.Mui-disabled': { opacity: 0.3 },
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
              sx={{
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.5, sm: 1 }
              }}
            />
          ))}
        </Tabs>

        {tabs.map((tab, index) => (
          <TabPanel key={index} value={tabValue} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
};

export default SettingsPage;