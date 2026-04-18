import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  IconButton,
  Skeleton
} from '@mui/material';
import {
  TrendingUp,
  People,
  ShoppingCart,
  AttachMoney,
  Inventory,
  BusinessCenter,
  Assessment,
  Warning,
  CheckCircle,
  Refresh,
  ArrowForward
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useScreenSize, getOptimalLayout } from '../hooks/useScreenSize';
import SystemStatus from '../components/SystemStatus';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user, axiosInstance } = useAuth();
  const theme = useTheme();
  const screenSize = useScreenSize();
  const layout = getOptimalLayout(screenSize);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    vendas: { hoje: 0, total: 0, valor: 0 },
    clientes: { total: 0, novos: 0 },
    produtos: { total: 0, baixoEstoque: 0 },
    financeiro: { receitas: 0, despesas: 0, saldo: 0 }
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Log da resolução detectada para debug
  console.log('resolução detectada:', screenSize);
  console.log('Layout otimizado:', layout);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const hoje = new Date().toISOString().split('T')[0];

      // Buscar dados em paralelo com fallback
      const requests = [
        axiosInstance.get('/vendas/').catch(() => ({ data: [] })),
        axiosInstance.get('/clientes/').catch(() => ({ data: [] })),
        axiosInstance.get('/produtos/').catch(() => ({ data: [] })),
        axiosInstance.get(`/vendas/?data_venda=${hoje}`).catch(() => ({ data: [] }))
      ];

      const [vendasRes, clientesRes, produtosRes, vendasHojeRes] = await Promise.all(requests);

      // Processar vendas
      const vendas = Array.isArray(vendasRes.data) ? vendasRes.data : vendasRes.data?.results || [];
      const vendasHoje = Array.isArray(vendasHojeRes.data) ? vendasHojeRes.data : vendasHojeRes.data?.results || [];

      const valorVendasHoje = Array.isArray(vendasHoje) ? vendasHoje.reduce((total, venda) => {
        return total + parseFloat(venda.valor_total || 0);
      }, 0) : 0;

      // Processar clientes
      const clientes = Array.isArray(clientesRes.data) ? clientesRes.data : clientesRes.data?.results || [];

      // Processar produtos
      const produtos = Array.isArray(produtosRes.data) ? produtosRes.data : produtosRes.data?.results || [];
      const produtosBaixoEstoque = Array.isArray(produtos) ? produtos.filter(p => (p.estoque || p.quantidade_estoque || 0) <= 5).length : 0;

      setDashboardData({
        vendas: {
          hoje: Array.isArray(vendasHoje) ? vendasHoje.length : 0,
          total: Array.isArray(vendas) ? vendas.length : 0,
          valor: valorVendasHoje
        },
        clientes: {
          total: Array.isArray(clientes) ? clientes.length : 0,
          novos: Array.isArray(clientes) ? clientes.filter(c => {
            const created = new Date(c.created_at || c.data_cadastro || '2024-01-01');
            const diffDays = (new Date() - created) / (1000 * 60 * 60 * 24);
            return diffDays <= 30;
          }).length : 0
        },
        produtos: {
          total: Array.isArray(produtos) ? produtos.length : 0,
          baixoEstoque: produtosBaixoEstoque
        },
        financeiro: {
          receitas: valorVendasHoje,
          despesas: 0,
          saldo: valorVendasHoje
        }
      });

      // Atividades recentes
      const activities = [
        ...(Array.isArray(vendasHoje) ? vendasHoje.slice(0, 3).map(v => ({
          icon: '💰',
          title: `Venda #${v.numero_documento || v.id}`,
          description: `R$ ${parseFloat(v.valor_total || 0).toFixed(2)}`,
          time: 'Hoje'
        })) : []),
        {
          icon: '📊',
          title: 'Dashboard atualizado',
          description: 'Dados sincronizados com sucesso',
          time: 'Agora'
        }
      ];

      setRecentActivity(activities);

    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Alguns dados podem não estar atualizados');

      // Dados de fallback
      setDashboardData({
        vendas: { hoje: 0, total: 0, valor: 0 },
        clientes: { total: 0, novos: 0 },
        produtos: { total: 0, baixoEstoque: 0 },
        financeiro: { receitas: 0, despesas: 0, saldo: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [axiosInstance]);

  const stats = [
    {
      title: 'Vendas Hoje',
      value: dashboardData.vendas.hoje,
      subtitle: `R$ ${dashboardData.vendas.valor.toFixed(2)}`,
      icon: <AttachMoney />,
      color: '#4caf50',
      action: () => navigate('/vendas')
    },
    {
      title: 'Clientes',
      value: dashboardData.clientes.total,
      subtitle: `${dashboardData.clientes.novos} novos este mês`,
      icon: <People />,
      color: '#2196f3',
      action: () => navigate('/clientes')
    },
    {
      title: 'Produtos',
      value: dashboardData.produtos.total,
      subtitle: `${dashboardData.produtos.baixoEstoque} com estoque baixo`,
      icon: <Inventory />,
      color: dashboardData.produtos.baixoEstoque > 0 ? '#ff9800' : '#4caf50',
      action: () => navigate('/produtos')
    },
    {
      title: 'Saldo',
      value: `R$ ${dashboardData.financeiro.saldo.toFixed(2)}`,
      subtitle: 'Faturamento hoje',
      icon: <BusinessCenter />,
      color: '#9c27b0',
      action: () => navigate('/financeiro')
    }
  ];

  const quickActions = [
    {
      title: 'Nova Venda',
      description: 'Criar uma nova venda',
      icon: <AttachMoney />,
      color: '#4caf50',
      action: () => navigate('/vendas')
    },
    {
      title: 'Novo Cliente',
      description: 'Cadastrar cliente',
      icon: <People />,
      color: '#2196f3',
      action: () => navigate('/clientes')
    },
    {
      title: 'Estoque',
      description: 'Gerenciar produtos',
      icon: <Inventory />,
      color: '#ff9800',
      action: () => navigate('/produtos')
    },
    {
      title: 'Relatórios',
      description: 'Ver relatórios',
      icon: <Assessment />,
      color: '#9c27b0',
      action: () => navigate('/aprovacoes')
    }
  ];

  return (
    <Box sx={{ width: '100%', height: '100%', maxWidth: 'none' }}>
      {/* Sistema Status */}
      <SystemStatus />

      {/* Debug Info - Remover em produçéo */}
      {screenSize.isSuperWide && (
        <Alert severity="info" sx={{ mb: 2 }}>
          🖥️ Monitor Super Ultra-Wide detectado: {screenSize.width}x{screenSize.height}
          (Ratio: {screenSize.ratio.toFixed(2)}:1) - Layout {layout.columns} colunas
        </Alert>
      )}

      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
        mb: { xs: 2, sm: 3 },
        width: '100%',
        maxWidth: 'none'
      }}>
        <Box>
          <Typography
            variant={isSmallScreen ? "h5" : "h4"}
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Dashboard
          </Typography>
          <Typography
            variant={isSmallScreen ? "body2" : "subtitle1"}
            color="text.secondary"
          >
            Bem-vindo de volta, {user?.first_name || user?.username}!
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size={isSmallScreen ? "small" : "medium"}
          startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
          onClick={fetchDashboardData}
          disabled={loading}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: { xs: 2, sm: 3 } }}>
          {error}
        </Alert>
      )}

      {/* Cards de Estatísticas - Layout Dinâmico */}
      <Grid container spacing={{ xs: 1, sm: 2, md: 2 }} sx={{
        mb: { xs: 3, sm: 4 },
        width: '100%',
        margin: 0,
        maxWidth: 'none'
      }}>
        {stats.map((stat, index) => (
          <Grid item {...layout.cardColumns} key={index}>
            <Card
              sx={{
                cursor: 'pointer',
                height: '100%',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[8]
                },
                transition: 'all 0.2s',
                border: `1px solid ${theme.palette.divider}`,
                minHeight: screenSize.isSuperWide ? 140 : 120
              }}
              onClick={stat.action}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: stat.color,
                      mr: 2,
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 }
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant={isSmallScreen ? "h5" : "h4"}
                      component="div"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {loading ? '...' : stat.value}
                    </Typography>
                    <Typography
                      variant={isSmallScreen ? "body2" : "body1"}
                      color="text.secondary"
                    >
                      {stat.title}
                    </Typography>
                  </Box>
                  {stat.action && !loading && (
                    <IconButton size="small" sx={{ color: stat.color }}>
                      <ArrowForward />
                    </IconButton>
                  )}
                </Box>
                <Typography
                  variant={isSmallScreen ? "body2" : "body1"}
                  color="text.secondary"
                >
                  {stat.subtitle}
                </Typography>
                {loading && <LinearProgress sx={{ mt: 1 }} />}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Layout Principal - Baseado na resolução */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{
        width: '100%',
        margin: 0,
        maxWidth: 'none'
      }}>
        {/* Ações Rápidas */}
        <Grid item xs={12} lg={layout.contentColumns} xl={layout.contentColumns}>
          <Paper sx={{ p: { xs: 2, sm: 2.5 }, height: '100%' }}>
            <Typography
              variant={isSmallScreen ? "subtitle1" : "h6"}
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Ações Rápidas
            </Typography>
            <Grid container spacing={{ xs: 1, sm: 1.5 }}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={layout.contentColumns === 4 ? 12 : 6} key={index}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4]
                      },
                      transition: 'all 0.2s'
                    }}
                    onClick={action.action}
                  >
                    <CardContent
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: { xs: 1.5, sm: 2 },
                        '&:last-child': { pb: { xs: 1.5, sm: 2 } }
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: action.color,
                          mr: 2,
                          width: { xs: 36, sm: 40 },
                          height: { xs: 36, sm: 40 }
                        }}
                      >
                        {action.icon}
                      </Avatar>
                      <Box>
                        <Typography
                          variant={isSmallScreen ? "body1" : "subtitle1"}
                          sx={{ fontWeight: 'bold' }}
                        >
                          {action.title}
                        </Typography>
                        <Typography
                          variant={isSmallScreen ? "body2" : "body1"}
                          color="text.secondary"
                        >
                          {action.description}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Atividade Recente */}
        <Grid item xs={12} lg={layout.contentColumns} xl={layout.contentColumns}>
          <Paper sx={{ p: { xs: 2, sm: 2.5 }, height: '100%' }}>
            <Typography
              variant={isSmallScreen ? "subtitle1" : "h6"}
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Atividade Recente
            </Typography>
            <Box sx={{ maxHeight: { xs: 300, md: 400 }, overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: { xs: 1, sm: 1.5 },
                      borderBottom: index < recentActivity.length - 1 ? '1px solid' : 'none',
                      borderBottomColor: 'divider'
                    }}
                  >
                    <Typography sx={{ mr: 2, fontSize: { xs: '1rem', sm: '1.2rem' } }}>
                      {activity.icon}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant={isSmallScreen ? "body2" : "body1"}
                        sx={{ fontWeight: 'bold' }}
                      >
                        {activity.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        {activity.description}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      >
                        {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma atividade recente
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Terceira coluna para ultra-wide */}
        <Grid
          item
          xs={12}
          lg={layout.contentColumns}
          xl={layout.contentColumns}
          sx={{
            display: { xs: 'block', lg: layout.contentColumns === 4 ? 'block' : 'none' }
          }}
        >
          <Paper sx={{ p: { xs: 2, sm: 2.5 }, height: '100%' }}>
            <Typography
              variant={isSmallScreen ? "subtitle1" : "h6"}
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Estatísticas Rápidas
            </Typography>
            <Box sx={{ space: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Vendas Este Mês
                </Typography>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                  R$ 45.780,50
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  +12% vs mês anterior
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Meta Mensal
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mr: 2 }}>
                    78%
                  </Typography>
                  <Chip label="No prazo" color="info" size="small" />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={78}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Novos Clientes
                </Typography>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  23
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Últimos 30 dias
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Taxa de Conversão
                </Typography>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                  8.4%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Leads → Vendas
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Quarta coluna adicional para super ultra-wide */}
        {layout.contentColumns === 4 && screenSize.isSuperWide && (
          <Grid item xs={12} lg={3} xl={3}>
            <Paper sx={{ p: { xs: 2, sm: 2.5 }, height: '100%' }}>
              <Typography
                variant={isSmallScreen ? "subtitle1" : "h6"}
                gutterBottom
                sx={{ fontWeight: 'bold' }}
              >
                Informações do Monitor
              </Typography>
              <Box sx={{ space: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    resolução Detectada
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {screenSize.width} × {screenSize.height}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Layout Ativo
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {layout.contentColumns} Colunas
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Cards por Linha
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {layout.cardColumns.xs === 12 ? 1 : layout.cardColumns.sm === 6 ? 2 :
                      layout.cardColumns.md === 4 ? 3 : layout.cardColumns.lg === 3 ? 4 :
                        layout.cardColumns.xl === 2 ? 6 : 'Auto'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tipo de Tela
                  </Typography>
                  <Chip
                    label={screenSize.isSuperWide ? 'Super Ultra-Wide' :
                      screenSize.isUltraWide ? 'Ultra-Wide' : 'Standard'}
                    color={screenSize.isSuperWide ? 'success' :
                      screenSize.isUltraWide ? 'primary' : 'default'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DashboardHome;