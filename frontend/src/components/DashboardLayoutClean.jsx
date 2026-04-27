import React from 'react';
import { Outlet, useLocation, Link as RouterLink, useNavigate } from 'react-router-dom';
import { fetchShortcutsApi } from '../services/shortcutService';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Paper,
  Button,
  Divider
} from '@mui/material';
import {
  Logout as LogoutIcon,
  AccountCircle,
  Dashboard as DashboardIcon,
  ShoppingCart as VendasIcon,
  FlashOn as VendaRapidaIcon,
  People as ClientesIcon,
  Inventory as ProdutosIcon,
  LocalShipping as ComprasIcon,
  AssignmentReturn as DevolucoesIcon,
  Receipt as ReceiptIcon,
  SwapHoriz as TrocasIcon,
  Business as FornecedoresIcon,
  AccountBalance as FinanceiroIcon,
  Lock as AprovacoesIcon,
  Settings as ConfigIcon,
  MenuBook as CatalogosIcon,
  QrCode2 as QrCodeIcon,
  Description as RelatoriosIcon,
  BarChart as GraficosIcon,
  Build as OrdemServicoIcon,
  TableRestaurant as MesasIcon,
  AddCircle as AddIcon,
  Label as EtiquetasIcon,
  Pets as PetIcon,
  Tune as AjusteIcon,
  History as LogIcon,
  Menu as MenuIcon,
  Backup as BackupIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as MonetizationOnIcon,
  Payment as PaymentIcon,
  LocalShipping,
  Description
  ,BusinessCenter as BusinessCenterIcon
  ,DirectionsCar as DirectionsCarIcon
  ,Agriculture as AgricultureIcon
  ,WhatsApp as WhatsAppIcon
  ,Event as EventIcon
  ,Scale as BalancaIcon
  ,LocalAtm as LocalAtmIcon
  ,CreditCard as CreditCardIcon
  ,Storefront as StorefrontIcon
  ,SmartToy as AssistenteIAIcon
  ,Insights as ConsultorIAIcon
  ,RequestQuote as RequestQuoteIcon
  ,PeopleAlt as CRMIcon
  ,Badge as RHIcon
  ,Autorenew as RecorrenciaIcon
  ,TrendingDown as ChurnIcon
  ,AccessTime as AccessTimeIcon
  ,MoveToInbox as EntregasIcon
  ,Inventory as InventoryIcon
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

import DashboardErrorBoundary from './DashboardErrorBoundary';
import QRCodeFloating from './QRCodeFloating';
import AIChat from './AIChat';
import LogoutDialog from './LogoutDialog';
import MobileMenuDrawer from './MobileMenuDrawer';
import ShortcutManager from './ShortcutManager';
import GlobalSearch from './GlobalSearch';
import AcessoNegado from './AcessoNegado';
import NotificationBell from './NotificationBell';

const DashboardLayoutClean = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const theme = useTheme();

  // Detectar tela ultrawide e forçar modo desktop
  const isUltraWide = window.innerWidth >= 2560;
  const isMobileQuery = useMediaQuery(theme.breakpoints.down('md'));
  const isMobile = !isUltraWide && isMobileQuery;

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [trocasMenuAnchor, setTrocasMenuAnchor] = React.useState(null);
  const [opcoesMenuAnchor, setOpcoesMenuAnchor] = React.useState(null);
  const [relatoriosMenuAnchor, setRelatoriosMenuAnchor] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [shortcutManagerOpen, setShortcutManagerOpen] = React.useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = React.useState(false);

  // Define todos os itens de menu com suas permissões (usando nomes do banco de dados)
  const allMenuItems = [
    { key: 'home', label: 'Dashboard', icon: <DashboardIcon />, path: '/home', color: '#9C27B0', permission: null }, // Todos têm acesso
    { key: 'dashboard-bi', label: 'Dashboard BI', icon: <ConsultorIAIcon />, path: '/dashboard-bi', color: '#0D47A1', permission: null },
    { key: 'vendas', label: 'Vendas', icon: <VendasIcon />, path: '/vendas', color: '#2196F3', permission: 'vendas_acessar' },
    { key: 'venda-rapida', label: 'Venda Rápida', icon: <VendaRapidaIcon />, path: '/venda-rapida', color: '#FF9800', permission: 'vendas_criar' },
    { key: 'entregas', label: 'Entregas', icon: <EntregasIcon />, path: '/entregas', color: '#1565C0', permission: null },
    { key: 'pdv-nfce', label: 'PDV NFC-e', icon: <ReceiptIcon />, path: '/api/pdv-nfce/', color: '#673AB7', permission: 'vendas_criar', isExternal: true },
    { key: 'nfce', label: 'NFC-e', icon: <ReceiptIcon />, path: '/nfce', color: '#673AB7', permission: 'nfce_acessar' },
    { key: 'nfe', label: 'NF-e', icon: <ReceiptIcon />, path: '/nfe', color: '#673AB7', permission: 'nfe_acessar' },
    { key: 'faturamento', label: 'Faturamento', icon: <RequestQuoteIcon />, path: '/faturamento', color: '#1976D2', permission: 'nfe_acessar' },
    { key: 'cte', label: 'CT-e', icon: <ComprasIcon />, path: '/cte', color: '#673AB7', permission: 'cte_acessar' },
    { key: 'mdfe', label: 'MDF-e', icon: <ComprasIcon />, path: '/mdfe', color: '#0277BD', permission: 'mdfe_acessar' },

    { key: 'ordem-servico', label: 'Ordem Serviço', icon: <OrdemServicoIcon />, path: '/ordem-servico', color: '#00BCD4', permission: 'ordens_acessar' },
    { key: 'mesas', label: 'Controle de Mesas', icon: <MesasIcon />, path: '/comandas', color: '#E91E63', permission: 'comandas_acessar' },
    { key: 'clientes', label: 'Clientes', icon: <ClientesIcon />, path: '/clientes', color: '#4CAF50', permission: 'clientes_acessar' },
    { key: 'produtos', label: 'Produtos', icon: <ProdutosIcon />, path: '/produtos', color: '#F44336', permission: 'produtos_acessar' },
    { key: 'cadastro-turbo', label: 'Cadastro Turbo ⚡', icon: <VendaRapidaIcon />, path: '/cadastro-turbo', color: '#FF6F00', permission: 'produtos_acessar' },
    { key: 'agro', label: 'Gestão Agro', icon: <AgricultureIcon />, path: '/agro', color: '#2E7D32', permission: 'agro_acessar' },
    { key: 'compras', label: 'Compras', icon: <ComprasIcon />, path: '/compras', color: '#00BCD4', permission: 'compras_acessar' },
    { key: 'devolucoes', label: 'Devoluções', icon: <DevolucoesIcon />, path: '/devolucoes', color: '#FF5722', permission: 'devolucoes_acessar' },
    { key: 'trocas', label: 'Trocas', icon: <TrocasIcon />, path: '/trocas', hasSubmenu: true, color: '#FFC107', permission: 'trocas_acessar' },
    { key: 'catalogos', label: 'Catálogos', icon: <CatalogosIcon />, path: '/catalogos', color: '#795548', permission: 'catalogo_acessar' },
    { key: 'relatorios', label: 'Relatórios', icon: <RelatoriosIcon />, hasSubmenu: true, color: '#607D8B', permission: 'relatorios_acessar' },
    { key: 'graficos', label: 'Gráficos', icon: <GraficosIcon />, path: '/graficos', color: '#E91E63', permission: 'graficos_acessar' },
    { key: 'fornecedores', label: 'Fornecedores', icon: <FornecedoresIcon />, path: '/fornecedores', color: '#3F51B5', permission: 'fornecedores_acessar' },
    { key: 'financeiro', label: 'Financeiro', icon: <FinanceiroIcon />, path: '/financeiro', color: '#4CAF50', permission: 'financeiro_acessar' },
    { key: 'sped', label: 'SPED ICMS', icon: <AssessmentIcon />, path: '/sped', color: '#9C27B0', permission: 'sped_acessar' },
    { key: 'sped-contribuicoes', label: 'SPED PIS/COFINS', icon: <AssessmentIcon />, path: '/sped-contribuicoes', color: '#7B1FA2', permission: 'sped_contribuicoes_acessar' },
    { key: 'aprovacoes', label: 'Autorização', icon: <AprovacoesIcon />, path: '/aprovacoes', color: '#F44336', permission: 'config_acessar' },

    { key: 'boletos', label: 'Boletos', icon: <ReceiptIcon />, path: '/boletos', color: '#1565C0', permission: 'boletos_acessar' },
    { key: 'mapa-carga', label: 'Mapa de Carga', icon: <LocalShipping />, path: '/mapa-carga', color: '#0277BD', permission: 'mapa_carga_acessar' },
    { key: 'producao', label: 'Produção', icon: <StorefrontIcon />, path: '/producao', color: '#FF5722', permission: 'producao_acessar' },
    { key: 'comissoes', label: 'Comissões', icon: <MonetizationOnIcon />, path: '/relatorios/comissoes', color: '#37474F', permission: 'comissoes_acessar' },
    { key: 'conciliacao', label: 'Conciliação', icon: <PaymentIcon />, path: '/conciliacao', color: '#00897B', permission: 'conciliacao_acessar' },
    { key: 'cartoes', label: 'Cartões', icon: <CreditCardIcon />, path: '/cartoes', color: '#1565C0', permission: 'cartoes_acessar' },
    { key: 'agenda', label: 'Agenda', icon: <EventIcon />, path: '/agenda', color: '#6A1B9A', permission: 'agenda_acessar' },
    { key: 'balancas', label: 'Balanças', icon: <LocalAtmIcon />, path: '/balancas', color: '#558B2F', permission: 'balancas_acessar' },
    { key: 'cotacao', label: 'Cotação', icon: <MonetizationOnIcon />, path: '/cotacao', color: '#E65100', permission: 'cotacoes_acessar' },
    { key: 'contas-servicos', label: 'Contas e Serviços', icon: <AssessmentIcon />, path: '/contas-servicos', color: '#1976D2', permission: 'contas_servicos_acessar' },
    { key: 'bancario', label: 'Bancário', icon: <FinanceiroIcon />, path: '/bancario', color: '#1565C0', permission: 'bancario_acessar' },
    { key: 'minhas-solicitacoes', label: 'Minhas Solic.', icon: <AssessmentIcon />, path: '/minhas-solicitacoes', color: '#6A1B9A', permission: null },


    { key: 'opcoes', label: '+Opções', icon: <AddIcon />, hasSubmenu: true, color: '#FF5722', permission: null }, // Todos têm acesso
    { key: 'backup', label: 'Backup', icon: <BackupIcon />, path: '/backup', color: '#FF9800', permission: 'config_acessar' },
    { key: 'configuracoes', label: 'Config', icon: <ConfigIcon />, path: '/configuracoes', color: '#9E9E9E', permission: 'config_acessar' }
  ];

  // Filtra itens de menu baseado nas permissões
  const menuItems = allMenuItems.filter(item => {
    // Se não tem permissão definida, mostra para todos
    if (!item.permission) return true;
    // Usa o hook de permissões
    const hasPermission = can(item.permission);
    return hasPermission;
  });

  // Sub-itens para menus expansíveis (usados no drawer mobile)
  const subMenuItems = React.useMemo(() => ({
    trocas: [
      { label: 'Listar Trocas', path: '/trocas', icon: <TrocasIcon /> },
      { label: 'Nova Troca', path: '/trocas/nova', icon: <TrocasIcon /> },
    ],
    relatorios: [
      { label: 'Vendas', path: '/relatorios/vendas', icon: <VendasIcon sx={{ color: '#fff' }} /> },
      { label: 'Estoque', path: '/relatorios?categoria=estoque', icon: <ProdutosIcon sx={{ color: '#fff' }} /> },
      { label: 'Compras', path: '/relatorios?categoria=compras', icon: <ComprasIcon sx={{ color: '#fff' }} /> },
      { label: 'Financeiro', path: '/relatorios?categoria=financeiro', icon: <FinanceiroIcon sx={{ color: '#fff' }} /> },
      { label: 'DRE', path: '/relatorios/dre', icon: <AssessmentIcon sx={{ color: '#fff' }} /> },
      { label: 'Clientes', path: '/relatorios/clientes', icon: <ClientesIcon sx={{ color: '#fff' }} /> },
      { label: 'Produtos', path: '/relatorios/produtos', icon: <ProdutosIcon sx={{ color: '#fff' }} /> },
      { label: 'Desempenho', path: '/relatorios?categoria=desempenho', icon: <GraficosIcon sx={{ color: '#fff' }} /> },
      { label: 'Comissões', path: '/relatorios/comissoes', icon: <MonetizationOnIcon sx={{ color: '#fff' }} /> },
      { label: 'Cashback', path: '/relatorios/cashback', icon: <MonetizationOnIcon sx={{ color: '#fff' }} /> },
      { label: 'Lucratividade', path: '/relatorios/lucratividade', icon: <GraficosIcon sx={{ color: '#fff' }} /> },
      { label: 'Projeção de Compras', path: '/relatorios/projecao-compra', icon: <ComprasIcon sx={{ color: '#fff' }} /> },
      { label: 'Inventário', path: '/relatorios/inventario', icon: <ProdutosIcon sx={{ color: '#fff' }} /> },
      { label: 'Comandas', path: '/relatorios?categoria=comandas', icon: <ReceiptIcon sx={{ color: '#fff' }} /> },
      { label: 'CT-e', path: '/relatorios/cte', icon: <LocalShipping sx={{ color: '#fff' }} /> },
      { label: 'MDF-e', path: '/relatorios/mdfe', icon: <Description sx={{ color: '#fff' }} /> },
      { label: 'Ficha de Produto', path: '/relatorios/ficha-produto', icon: <AssessmentIcon sx={{ color: '#fff' }} /> },
      { label: 'Ficha do Veículo', path: '/relatorios/ficha-veiculo', icon: <AssessmentIcon sx={{ color: '#fff' }} /> },
      { label: 'Ficha do Cliente', path: '/relatorios/ficha-cliente', icon: <AssessmentIcon sx={{ color: '#fff' }} /> },
    ],
    opcoes: [
      ...(can('produtos_acessar') ? [{ label: 'Etiquetas', path: '/etiquetas', icon: <EtiquetasIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('produtos_editar') ? [{ label: 'Ajustar Estoque', path: '/estoque-config', icon: <AjusteIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('produtos_acessar') ? [{ label: 'Consulta Estoque', path: '/consulta-estoque', icon: <InventoryIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('produtos_editar') ? [{ label: 'Tabela Comercial', path: '/tabela-comercial', icon: <MonetizationOnIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('produtos_acessar') ? [{ label: 'Veículos', path: '/veiculos', icon: <DirectionsCarIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('financeiro_acessar') ? [{ label: 'Cheques', path: '/cheques', icon: <PaymentIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('produtos_acessar') ? [{ label: 'Equipamentos', path: '/equipamentos', icon: <BusinessCenterIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('financeiro_acessar') ? [{ label: 'Aluguel', path: '/alugueis', icon: <BusinessCenterIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('config_acessar') ? [{ label: 'Config. Contrato', path: '/configuracao-contrato', icon: <BusinessCenterIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('nfe_acessar') ? [{ label: 'Manifestação NF-e', path: '/manifestacao-destinatario', icon: <ReceiptIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('whatsapp_acessar') ? [{ label: 'WhatsApp em Massa', path: '/whatsapp', icon: <WhatsAppIcon sx={{ color: '#fff' }} /> }] : []),
      { label: 'Debug Conexão', path: '/debug-conexao', icon: <AssessmentIcon sx={{ color: '#fff' }} /> },
      ...(can('mapa_promocao_acessar') ? [{ label: 'Mapa de Promoção', path: '/mapa-promocao', icon: <AddIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('relatorios_acessar') ? [{ label: 'Ficha de Produto', path: '/relatorios/ficha-produto', icon: <AssessmentIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('relatorios_acessar') ? [{ label: 'Ficha do Veículo', path: '/relatorios/ficha-veiculo', icon: <AssessmentIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('petshop_acessar') ? [{ label: 'Pet Shop - Banho e Tosa', path: '/pet-shop', icon: <PetIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('petshop_acessar') ? [{ label: 'Clínica Veterinária', path: '/clinica-veterinaria', icon: <PetIcon sx={{ color: '#fff' }} /> }] : []),
      ...(can('ordens_acessar') ? [{ label: 'Status Ordem de Serviço', path: '/status-ordem-servico', icon: <OrdemServicoIcon sx={{ color: '#fff' }} /> }] : []),
      { label: 'CRM — Pipeline', path: '/crm', icon: <CRMIcon sx={{ color: '#fff' }} /> },
      { label: 'Recursos Humanos', path: '/rh', icon: <RHIcon sx={{ color: '#fff' }} /> },
      { label: 'Terminal de Ponto', path: '/ponto', icon: <AccessTimeIcon sx={{ color: '#fff' }} /> },
      { label: 'Pix Dinâmico', path: '/pix', icon: <QrCodeIcon sx={{ color: '#fff' }} /> },
      { label: 'Contratos de Recorrência', path: '/recorrencia', icon: <RecorrenciaIcon sx={{ color: '#fff' }} /> },
      { label: 'Análise de Churn', path: '/churn', icon: <ChurnIcon sx={{ color: '#fff' }} /> },
    ],
  }), [can]);

  // Mapa completo de rota → permissão (inclui rotas que não estão no menu)
  const routePermissions = React.useMemo(() => {
    // Constrói mapa a partir dos itens de menu que têm path e permission
    const map = {};
    allMenuItems.forEach(item => {
      if (item.path && item.permission) {
        map[item.path] = item.permission;
      }
    });
    // Rotas adicionais que não aparecem no menu (sub-páginas, etc.)
    Object.assign(map, {
      '/venda-rapida': 'vendas_acessar',
      '/tabela-comercial': 'vendas_acessar',
      '/veiculos': 'produtos_acessar',
      '/equipamentos': 'produtos_acessar',
      '/etiquetas': 'etiquetas_acessar',
      '/alugueis': 'financeiro_acessar',
      '/alugueis/nova': 'financeiro_acessar',
      '/cheques': 'financeiro_acessar',
      '/estoque-config': 'config_acessar',
      '/consulta-estoque': 'produtos_acessar',
      '/mapa-promocao': 'mapa_promocao_acessar',
      '/pet-shop': 'petshop_acessar',
      '/clinica-veterinaria': 'petshop_acessar',
      '/documentos-fiscais': 'nfe_acessar',
      '/manifestacao-destinatario': 'nfe_acessar',
      '/acesso-mobile': 'config_acessar',
      '/status-ordem-servico': 'config_acessar',
      '/configuracao-contrato': 'config_acessar',
      '/formas-pagamento': 'config_acessar',
      '/relatorios/cashback': 'relatorios_acessar',
      '/relatorios/lucratividade': 'relatorios_acessar',
      '/relatorios/projecao-compra': 'relatorios_acessar',
      '/relatorios/ficha-produto': 'relatorios_acessar',
      '/relatorios/ficha-veiculo': 'relatorios_acessar',
      '/relatorios/ficha-cliente': 'relatorios_acessar',
      '/relatorios/comissoes': 'comissoes_acessar',
      '/relatorios/dre': 'relatorios_acessar',
      '/relatorios/inventario': 'relatorios_acessar',
      '/relatorios/cte': 'cte_acessar',
      '/relatorios/mdfe': 'mdfe_acessar',
      '/agro/safras': 'agro_acessar',
      '/agro/contratos': 'agro_acessar',
      '/agro/conversoes': 'agro_acessar',
      '/agro/operacional': 'agro_acessar',
      '/devolucoes/nova': 'devolucoes_acessar',
      '/trocas/nova': 'trocas_acessar',
      '/cadastro-turbo': 'produtos_acessar',
    });
    return map;
  }, []);

  // Verifica se o usuário tem permissão para a rota atual
  const currentPath = location.pathname;
  const requiredPermission = routePermissions[currentPath];
  const hasRouteAccess = !requiredPermission || can(requiredPermission);
  // Para rotas com parâmetros dinâmicos (ex: /alugueis/editar/:id)
  const hasRouteAccessDynamic = React.useMemo(() => {
    if (hasRouteAccess) return true;
    // Verifica prefixos de rota
    const prefixMap = {
      '/alugueis/': 'financeiro_acessar',
      '/agro/': 'agro_acessar',
      '/relatorios/': 'relatorios_acessar',
      '/devolucoes/': 'devolucoes_acessar',
      '/trocas/': 'trocas_acessar',
    };
    for (const [prefix, perm] of Object.entries(prefixMap)) {
      if (currentPath.startsWith(prefix)) {
        return can(perm);
      }
    }
    return hasRouteAccess;
  }, [currentPath, hasRouteAccess]);


  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    setLogoutDialogOpen(true);
  };

  const handleConfirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
  };

  const handleCancelLogout = () => {
    setLogoutDialogOpen(false);
  };

  // Mapa de atalhos em ref para o handler de teclado acessar sem re-render
  const shortcutsMapRef = React.useRef({});

  // Carrega atalhos da API ao montar (repopula localStorage caso cache tenha sido limpo)
  React.useEffect(() => {
    fetchShortcutsApi()
      .then(map => { if (map) shortcutsMapRef.current = map; })
      .catch(() => {
        try {
          const raw = localStorage.getItem('appShortcuts_v1');
          shortcutsMapRef.current = JSON.parse(raw || '{}');
        } catch { shortcutsMapRef.current = {}; }
      });
  }, []);

  // Listener global para atalhos de teclado (F1, F2 e Esc)
  React.useEffect(() => {
    const handler = (e) => {
      try {
        // Ignorar quando o usuário estiver digitando em um input/textarea ou elemento editável
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
          return;
        }

        const key = e.key;

        // Ctrl+K — Busca global
        if ((e.ctrlKey || e.metaKey) && key === 'k') {
          e.preventDefault();
          setGlobalSearchOpen(true);
          return;
        }

        if (key === 'Escape') {
          e.preventDefault();
          navigate(-1);
          return;
        }

        // Tratar teclas de função (F1, F2, ...)
        if (key && key.startsWith('F')) {
          // ⚠️ NÃO bloquear F12 (DevTools) e F5 (Refresh)
          if (key === 'F12' || key === 'F5') {
            return; // Deixa o navegador processar normalmente
          }

          // Evitar ação padrão do navegador para outras teclas F
          e.preventDefault();

          const path = shortcutsMapRef.current[key];
          if (path) {
            navigate(path);
          }
        }
      } catch (err) {
        console.error('Erro no handler de atalho:', err);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  // Define a aba atual lendo a URL
  const getCurrentTab = () => {
    const fullPath = location.pathname;
    const path = fullPath.split('/')[1];

    // Caminhos completos específicos
    if (fullPath === '/whatsapp') return 'whatsapp-massa';
    if (fullPath.startsWith('/relatorios/comissoes')) return 'comissoes';

    // Páginas que pertencem ao submenu "+Opções"
    if (['etiquetas', 'status-ordem-servico', 'crm', 'rh', 'ponto', 'pix', 'recorrencia', 'churn', 'consulta-estoque'].includes(path)) {
      return 'opcoes';
    }

    // Páginas que pertencem ao submenu "Trocas"
    if (path === 'trocas') {
      return 'trocas';
    }

    // Mapeia "comandas" para "mesas" (aba "Controle de Mesas")
    if (path === 'comandas') {
      return 'mesas';
    }

    // Páginas que são abas diretas
    if (['clientes', 'produtos', 'cadastro-turbo', 'financeiro', 'vendas', 'venda-rapida', 'entregas', 'ordem-servico', 'mesas', 'compras', 'catalogos', 'devolucoes', 'relatorios', 'graficos', 'fornecedores', 'aprovacoes', 'acesso-mobile', 'configuracoes', 'nfce', 'boletos', 'mapa-carga', 'producao', 'conciliacao', 'cartoes', 'agenda', 'balancas', 'cotacao', 'contas-servicos', 'bancario', 'minhas-solicitacoes', 'whatsapp', 'assistente-ia', 'consultor-negocios', 'dashboard-bi', 'documentos-fiscais'].includes(path)) {
      return path;
    }

    return 'home';
  };
  const currentTab = getCurrentTab();

  return (
    <Box
      className="dashboard-container full-viewport"
      sx={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        padding: 0
      }}
    >
      {/* App Bar Superior */}
      <AppBar
        position="static"
        sx={{
          backgroundColor: '#1976d2',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}
      >
        <Toolbar>
          {/* Botão Menu Hambúrguer (Mobile) */}
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/logos/aperus-desktop.jpeg"
              alt="Logo Aperus"
              sx={{
                height: 44,
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
              }}
            />
            {user && (
              <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.2 }}>
                Bem-vindo, {user?.first_name || user?.username}
              </Typography>
            )}
          </Box>

           <Box sx={{ display: 'flex', alignItems: 'center' }}>
             <NotificationBell />
             <IconButton
               size="large"
               color="inherit"
               onClick={handleProfileMenuOpen}
             >
               <AccountCircle />
             </IconButton>
           </Box>

          {/* Bot�o de Logout Direto */}
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              mr: 2,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Sair
          </Button>

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
            <MenuItem disabled>
              <AccountCircle sx={{ mr: 1 }} />
              {user?.first_name || user?.username}
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/configuracoes'); }}>
              <ConfigIcon sx={{ mr: 1 }} />
              Configura��es
            </MenuItem>
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/database-test'); }}>
              <DashboardIcon sx={{ mr: 1 }} />
              Teste de Banco
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <LogoutIcon sx={{ mr: 1 }} />
              Sair do Sistema
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Container Principal */}
      <Container
        className="no-max-width"
        maxWidth={false}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          py: 2,
          px: { xs: 2, sm: 3, md: 4 },
          width: '100vw',
          maxWidth: 'none',
          margin: 0
        }}
      >
        <Paper
          className="main-paper"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            width: '100%',
            height: 'calc(100vh - 100px)'
          }}
        >
          {/* Navegação por Tabs - Desktop */}
          {!isMobile && (
            <Box sx={{
              borderBottom: 1,
              borderColor: 'divider',
              backgroundColor: '#1976d2'
            }}>
              <Tabs
                value={currentTab}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                textColor="inherit"
                sx={{
                  '& .MuiTab-root': {
                    minWidth: 100,
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.92)',
                    '&.Mui-selected': {
                      color: '#ffffff',
                      fontWeight: 800
                    },
                    '&:hover': {
                      color: '#ffffff',
                      backgroundColor: 'rgba(255,255,255,0.15)'
                    }
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    backgroundColor: '#ffffff'
                  },
                  '& .MuiTabs-scrollButtons': {
                    color: '#ffffff'
                  }
                }}
              >
                {menuItems.map((item) => (
                  item.hasSubmenu ? (
                    <Tab
                      key={item.key}
                      label={item.label}
                      value={item.key}
                      icon={React.cloneElement(item.icon, {
                        sx: { fontSize: '1.2rem' }
                      })}
                      iconPosition="start"
                      onClick={(e) => {
                        e.preventDefault();
                        if (item.key === 'trocas') {
                          setTrocasMenuAnchor(e.currentTarget);
                        } else if (item.key === 'opcoes') {
                          setOpcoesMenuAnchor(e.currentTarget);
                        } else if (item.key === 'relatorios') {
                          setRelatoriosMenuAnchor(e.currentTarget);
                        }
                      }}
                    />
                  ) : (
                    <Tab
                      key={item.key}
                      label={item.label}
                      value={item.key}
                      {...(item.isExternal 
                        ? { component: 'a', href: item.path }
                        : { component: RouterLink, to: item.path }
                      )}
                      icon={React.cloneElement(item.icon, {
                        sx: { fontSize: '1.2rem' }
                      })}
                      iconPosition="start"
                    />
                  )
                ))}
              </Tabs>

              {/* Submenu de Trocas */}
              <Menu
                anchorEl={trocasMenuAnchor}
                open={Boolean(trocasMenuAnchor)}
                onClose={() => setTrocasMenuAnchor(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
              >
                <MenuItem
                  onClick={() => {
                    setTrocasMenuAnchor(null);
                    navigate('/trocas');
                  }}
                >
                  <TrocasIcon sx={{ mr: 1 }} />
                  Listar Trocas
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setTrocasMenuAnchor(null);
                    navigate('/trocas/nova');
                  }}
                >
                  <TrocasIcon sx={{ mr: 1 }} />
                  Nova Troca
                </MenuItem>
              </Menu>

              {/* Submenu de Relatórios */}
              <Menu
                anchorEl={relatoriosMenuAnchor}
                open={Boolean(relatoriosMenuAnchor)}
                onClose={() => setRelatoriosMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/vendas'); }}>
                  <VendasIcon sx={{ mr: 1, color: '#1976d2' }} />
                  Vendas
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios?categoria=estoque'); }}>
                  <ProdutosIcon sx={{ mr: 1, color: '#2e7d32' }} />
                  Estoque
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios?categoria=compras'); }}>
                  <ComprasIcon sx={{ mr: 1, color: '#ed6c02' }} />
                  Compras
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios?categoria=financeiro'); }}>
                  <FinanceiroIcon sx={{ mr: 1, color: '#9c27b0' }} />
                  Financeiro
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/dre'); }}>
                  <AssessmentIcon sx={{ mr: 1, color: '#00695c' }} />
                  DRE
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/clientes'); }}>
                  <ClientesIcon sx={{ mr: 1, color: '#0288d1' }} />
                  Clientes
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/produtos'); }}>
                  <ProdutosIcon sx={{ mr: 1, color: '#d32f2f' }} />
                  Produtos
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios?categoria=desempenho'); }}>
                  <GraficosIcon sx={{ mr: 1, color: '#388e3c' }} />
                  Desempenho
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/comissoes'); }}>
                  <MonetizationOnIcon sx={{ mr: 1, color: '#f57c00' }} />
                  Comissões
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/cashback'); }}>
                  <MonetizationOnIcon sx={{ mr: 1, color: '#9c27b0' }} />
                  Cashback
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/lucratividade'); }}>
                  <GraficosIcon sx={{ mr: 1, color: '#2e7d32' }} />
                  Lucratividade
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/projecao-compra'); }}>
                  <ComprasIcon sx={{ mr: 1, color: '#f57c00' }} />
                  Projeção de Compras
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/inventario'); }}>
                  <ProdutosIcon sx={{ mr: 1, color: '#795548' }} />
                  Inventário
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios?categoria=comandas'); }}>
                  <ReceiptIcon sx={{ mr: 1, color: '#00796b' }} />
                  Comandas
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/cte'); }}>
                  <LocalShipping sx={{ mr: 1, color: '#1565c0' }} />
                  CT-e
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/mdfe'); }}>
                  <Description sx={{ mr: 1, color: '#6a1b9a' }} />
                  MDF-e
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/ficha-produto'); }}>
                  <AssessmentIcon sx={{ mr: 1, color: '#607D8B' }} />
                  Ficha de Produto
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/ficha-veiculo'); }}>
                  <AssessmentIcon sx={{ mr: 1, color: '#1565c0' }} />
                  Ficha do Veículo
                </MenuItem>
                <MenuItem onClick={() => { setRelatoriosMenuAnchor(null); navigate('/relatorios/ficha-cliente'); }}>
                  <AssessmentIcon sx={{ mr: 1, color: '#2e7d32' }} />
                  Ficha do Cliente
                </MenuItem>
              </Menu>

              {/* Submenu de +Opções */}
              <Menu
                anchorEl={opcoesMenuAnchor}
                open={Boolean(opcoesMenuAnchor)}
                onClose={() => setOpcoesMenuAnchor(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
              >
                {can('produtos_acessar') && (
                  <MenuItem
                    onClick={() => {
                      setOpcoesMenuAnchor(null);
                      navigate('/etiquetas');
                    }}
                  >
                    <EtiquetasIcon sx={{ mr: 1 }} />
                    Etiquetas
                  </MenuItem>
                )}
                {can('produtos_editar') && (
                  <MenuItem
                    onClick={() => {
                      setOpcoesMenuAnchor(null);
                      navigate('/estoque-config');
                    }}
                  >
                    <AjusteIcon sx={{ mr: 1, color: '#FFA500' }} />
                    Ajustar Estoque
                  </MenuItem>
                )}
                {can('produtos_editar') && (
                  <MenuItem
                    onClick={() => {
                      setOpcoesMenuAnchor(null);
                      navigate('/tabela-comercial');
                    }}
                  >
                    💰
                    <span style={{ marginLeft: '8px' }}>Tabela Comercial</span>
                  </MenuItem>
                )}
                {can('produtos_acessar') && (
                 <MenuItem
                    onClick={() => {
                      setOpcoesMenuAnchor(null);
                      navigate('/veiculos');
                    }}
                  >
                    <DirectionsCarIcon sx={{ mr: 1, color: '#FF5722' }} />
                    Veículos
                  </MenuItem>
                )}
                {can('financeiro_acessar') && (
                <MenuItem
                  onClick={() => {
                    setOpcoesMenuAnchor(null);
                    navigate('/cheques');
                  }}
                >
                  <PaymentIcon sx={{ mr: 1, color: '#2196F3' }} />
                  Cheques
                </MenuItem>
                )}
                {can('produtos_acessar') && (
                <MenuItem
                  onClick={() => {
                    setOpcoesMenuAnchor(null);
                    navigate('/equipamentos');
                  }}
                >
                  <BusinessCenterIcon sx={{ mr: 1, color: '#1976d2' }} />
                  Equipamentos
                </MenuItem>
                )}
                {can('financeiro_acessar') && (
                <MenuItem
                  onClick={() => {
                    setOpcoesMenuAnchor(null);
                    navigate('/alugueis');
                  }}
                >
                  <BusinessCenterIcon sx={{ mr: 1, color: '#FF5722' }} />
                  Aluguel
                </MenuItem>
                )}
                {can('config_acessar') && (
                <MenuItem
                  onClick={() => {
                    setOpcoesMenuAnchor(null);
                    navigate('/configuracao-contrato');
                  }}
                >
                  <BusinessCenterIcon sx={{ mr: 1, color: '#9C27B0' }} />
                  Config. Contrato
                </MenuItem>
                )}
                {can('nfe_acessar') && (
                <MenuItem
                  onClick={() => {
                    setOpcoesMenuAnchor(null);
                    navigate('/manifestacao-destinatario');
                  }}
                >
                  <ReceiptIcon sx={{ mr: 1, color: '#0288D1' }} />
                  Manifestação NF-e
                </MenuItem>
                )}
                {can('whatsapp_acessar') && (
                <MenuItem
                  onClick={() => {
                    setOpcoesMenuAnchor(null);
                    navigate('/whatsapp');
                  }}
                >
                  <WhatsAppIcon sx={{ mr: 1, color: '#25D366' }} />
                  WhatsApp em Massa
                </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    setOpcoesMenuAnchor(null);
                    navigate('/debug-conexao');
                  }}
                >
                  🐛
                  <span style={{ marginLeft: '8px' }}>Debug Conexão</span>
                </MenuItem>
                {can('mapa_promocao_acessar') && (
                <MenuItem
                  onClick={() => {
                    setOpcoesMenuAnchor(null);
                    navigate('/mapa-promocao');
                  }}
                >
                  <AddIcon sx={{ mr: 1, color: '#FF5722' }} />
                  Mapa de Promoção
                </MenuItem>
                )}
                {can('relatorios_acessar') && (
                  <MenuItem
                    onClick={() => {
                      setOpcoesMenuAnchor(null);
                      setRelatoriosMenuAnchor(null);
                      navigate('/relatorios/ficha-produto');
                    }}
                  >
                    <AssessmentIcon sx={{ mr: 1, color: '#607D8B' }} />
                    Ficha de Produto
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    setOpcoesMenuAnchor(null);
                    setShortcutManagerOpen(true);
                  }}
                >
                  ⌨️
                  <span style={{ marginLeft: '8px' }}>Configurar Atalhos (F1–F12)</span>
                </MenuItem>
                {can('petshop_acessar') && (
                <MenuItem
                  onClick={() => {
                    setOpcoesMenuAnchor(null);
                    navigate('/pet-shop');
                  }}
                >
                  <PetIcon sx={{ mr: 1, color: '#FF69B4' }} />
                  Pet Shop - Banho e Tosa
                </MenuItem>
                )}
                {can('petshop_acessar') && (
                <MenuItem
                  onClick={() => {
                    setOpcoesMenuAnchor(null);
                    navigate('/clinica-veterinaria');
                  }}
                >
                  <PetIcon sx={{ mr: 1, color: '#1a237e' }} />
                  Clínica Veterinária
                </MenuItem>
                )}
                {can('ordens_acessar') && (
                  <MenuItem
                    onClick={() => {
                      setOpcoesMenuAnchor(null);
                      navigate('/status-ordem-servico');
                    }}
                  >
                    ⚙️
                    <span style={{ marginLeft: '8px' }}>Status Ordem de Serviço</span>
                  </MenuItem>
                )}
                {can('auditoria_acessar') && (
                  <MenuItem
                    onClick={() => {
                      console.log('🖱️ Clicou em Log de Auditoria!');
                      setOpcoesMenuAnchor(null);

                      // O sistema usa sessionStorage.setItem('accessToken') - verificar todas as variantes
                      const token = sessionStorage.getItem('accessToken') ||
                        sessionStorage.getItem('access_token') ||
                        localStorage.getItem('accessToken') ||
                        localStorage.getItem('access_token');

                      const refreshToken = sessionStorage.getItem('refreshToken') ||
                        sessionStorage.getItem('refresh_token') ||
                        localStorage.getItem('refreshToken') ||
                        localStorage.getItem('refresh_token');

                      console.log('🔑 Token encontrado:', token ? 'SIM' : 'NÃO');
                      console.log('🔄 Refresh Token:', refreshToken ? 'SIM' : 'NÃO');

                      if (token) {
                        // Salvar em todas as variantes para garantir compatibilidade
                        sessionStorage.setItem('accessToken', token);
                        sessionStorage.setItem('access_token', token);
                        if (refreshToken) {
                          sessionStorage.setItem('refreshToken', refreshToken);
                          sessionStorage.setItem('refresh_token', refreshToken);
                        }
                        console.log('💾 Tokens salvos no sessionStorage');
                        console.log('🚀 Navegando para /log_auditoria.html...');

                        // Usar setTimeout para garantir que sessionStorage foi salvo
                        setTimeout(() => {
                          window.location.href = '/log_auditoria.html';
                        }, 100);
                      } else {
                        console.error('❌ Token não encontrado!');
                        alert('Token não encontrado. Faça login novamente.');
                      }
                    }}
                  >
                    <LogIcon sx={{ mr: 1, color: '#667eea' }} />
                    Log de Auditoria
                  </MenuItem>
                )}
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/conciliacao'); }}>
                  <PaymentIcon sx={{ mr: 1, color: '#00897B' }} />
                  Conciliação
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/cartoes'); }}>
                  <PaymentIcon sx={{ mr: 1, color: '#1565C0' }} />
                  Cartões
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/agenda'); }}>
                  <AssessmentIcon sx={{ mr: 1, color: '#6A1B9A' }} />
                  Agenda
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/balancas'); }}>
                  <MonetizationOnIcon sx={{ mr: 1, color: '#558B2F' }} />
                  Balanças
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/cotacao'); }}>
                  <MonetizationOnIcon sx={{ mr: 1, color: '#E65100' }} />
                  Cotação
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/contas-servicos'); }}>
                  <AssessmentIcon sx={{ mr: 1, color: '#1976D2' }} />
                  Contas e Serviços
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/formas-pagamento'); }}>
                  <PaymentIcon sx={{ mr: 1, color: '#7B1FA2' }} />
                  Formas de Pagamento
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/boletos'); }}>
                  <ReceiptIcon sx={{ mr: 1, color: '#1565C0' }} />
                  Boletos
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/producao'); }}>
                  <AssessmentIcon sx={{ mr: 1, color: '#FF5722' }} />
                  Produção
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/relatorios/comissoes'); }}>
                  <RelatoriosIcon sx={{ mr: 1, color: '#37474F' }} />
                  Relatório de Comissões
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/crm'); }}>
                  <CRMIcon sx={{ mr: 1, color: '#1565C0' }} />
                  CRM — Pipeline de Vendas
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/rh'); }}>
                  <RHIcon sx={{ mr: 1, color: '#2E7D32' }} />
                  Recursos Humanos
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/ponto'); }}>
                  <AccessTimeIcon sx={{ mr: 1, color: '#1565C0' }} />
                  Terminal de Ponto
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/pix'); }}>
                  <QrCodeIcon sx={{ mr: 1, color: '#00897B' }} />
                  Pix Dinâmico
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/recorrencia'); }}>
                  <RecorrenciaIcon sx={{ mr: 1, color: '#6A1B9A' }} />
                  Contratos de Recorrência
                </MenuItem>
                <MenuItem onClick={() => { setOpcoesMenuAnchor(null); navigate('/churn'); }}>
                  <ChurnIcon sx={{ mr: 1, color: '#C62828' }} />
                  Análise de Churn
                </MenuItem>
              </Menu>
            </Box>
          )}

          {/* �rea de Conte�do */}
          <Box
            className="content-area"
            sx={{
              flexGrow: 1,
              p: 3,
              backgroundColor: '#ffffff',
              minHeight: 'calc(100vh - 200px)',
              width: '100%',
              overflow: 'auto'
            }}
          >
            <DashboardErrorBoundary>
              {hasRouteAccessDynamic ? <Outlet /> : <AcessoNegado />}
            </DashboardErrorBoundary>
          </Box>
        </Paper>
      </Container>

      {/* Dialog de Confirmação de Logout */}
      <LogoutDialog
        open={logoutDialogOpen}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        userName={user?.first_name || user?.username}
      />

      {/* Gerenciador de Atalhos */}
      <ShortcutManager open={shortcutManagerOpen} onClose={() => setShortcutManagerOpen(false)} />

      {/* Busca Global (Ctrl+K) */}
      <GlobalSearch open={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />

      {/* Menu Mobile Drawer */}
      <MobileMenuDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        menuItems={menuItems}
        currentTab={currentTab}
        subMenuItems={subMenuItems}
      />

      {/* Assistente IA Flutuante */}
      <AIChat />

      {/* Botão Flutuante de QR Code */}
      <QRCodeFloating />
    </Box>
  );
}

export default DashboardLayoutClean;
