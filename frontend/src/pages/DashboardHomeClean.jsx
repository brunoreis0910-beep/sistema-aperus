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
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  TrendingUp,
  People,
  ShoppingCart,
  AttachMoney,
  Inventory,
  BusinessCenter,
  Assessment,
  ArrowForward,
  Refresh,
  ExitToApp,
  Edit
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSafeDashboardData, formatCurrency, calculatePercentage } from '../hooks/useSafeDashboardData';
import { normalizeAPIResponse, getFieldValue, safeNumeric } from '../utils/apiUtils';
import LogoutDialog from '../components/LogoutDialog';
import AniversariantesModal from '../components/AniversariantesModal';

const DashboardHomeClean = () => {
  const navigate = useNavigate();
  const { user, axiosInstance, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    vendas: { hoje: 0, total: 0, valor: 0, valorMes: 0 },
    clientes: { total: 0, novos: 0 },
    produtos: { total: 0, baixoEstoque: 0 },
    financeiro: { receitas: 0, receitasMes: 0, despesas: 0, saldo: 0 }
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [aniversariantesModalOpen, setAniversariantesModalOpen] = useState(false);
  const [metaMensal, setMetaMensal] = useState(() => {
    // Carregar meta do localStorage ou usar 50000 como padrão
    const savedMeta = localStorage.getItem('metaMensal');
    return savedMeta ? parseFloat(savedMeta) : 50000;
  });
  const [editMetaDialogOpen, setEditMetaDialogOpen] = useState(false);
  const [novaMeta, setNovaMeta] = useState('');

  // Hook para dados seguros
  const safeData = useSafeDashboardData(dashboardData);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Debug: Verificar se o token está disponível
      const token = sessionStorage.getItem('accessToken');
      console.log('🔐 Token disponível:', token ? 'Sim' : 'não');

      if (!token) {
        setError('Token de autenticação não encontrado. Faça login novamente.');
        return;
      }

      const hoje = new Date().toISOString().split('T')[0];
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

      console.log('📊 Buscando dados do dashboard:', { hoje, inicioMes, fimMes });
      console.log('🔧 Usando axiosInstance com base URL:', axiosInstance.defaults.baseURL);

      // Buscar dados em paralelo com endpoints específicos
      const requests = [
        // Vendas do mês
        axiosInstance.get('/vendas/', {
          params: {
            data_venda__gte: inicioMes,
            data_venda__lte: fimMes,
            page_size: 1000
          }
        }).then(response => {
          console.log('✅ Vendas do mês carregadas:', response.data);
          return response;
        }).catch(err => {
          console.error('❌ Erro ao buscar vendas do mês:', err.response?.data || err.message);
          return { data: { results: [] } };
        }),

        // Vendas de hoje
        axiosInstance.get('/vendas/', {
          params: {
            data_venda: hoje,
            page_size: 1000
          }
        }).then(response => {
          console.log('✅ Vendas de hoje carregadas:', response.data);
          return response;
        }).catch(err => {
          console.error('❌ Erro ao buscar vendas de hoje:', err.response?.data || err.message);
          return { data: { results: [] } };
        }),

        // Clientes
        axiosInstance.get('/clientes/', {
          params: { page_size: 1000 }
        }).then(response => {
          console.log('✅ Clientes carregados:', response.data);
          return response;
        }).catch(err => {
          console.error('❌ Erro ao buscar clientes:', err.response?.data || err.message);
          return { data: { results: [] } };
        }),

        // Produtos
        axiosInstance.get('/produtos/', {
          params: { page_size: 1000 }
        }).then(response => {
          console.log('✅ Produtos carregados:', response.data);
          return response;
        }).catch(err => {
          console.error('❌ Erro ao buscar produtos:', err.response?.data || err.message);
          return { data: { results: [] } };
        }),

        // Fornecedores
        axiosInstance.get('/fornecedores/', {
          params: { page_size: 100 }
        }).catch(err => {
          console.error('Erro ao buscar fornecedores:', err);
          return { data: { results: [] } };
        })
      ];

      const [vendasMesRes, vendasHojeRes, clientesRes, produtosRes, fornecedoresRes] = await Promise.all(requests);

      // Processar dados usando utilitários de normalização
      const vendasMes = normalizeAPIResponse(vendasMesRes);
      const vendasHoje = normalizeAPIResponse(vendasHojeRes);
      const clientes = normalizeAPIResponse(clientesRes);
      const produtos = normalizeAPIResponse(produtosRes);
      const fornecedores = normalizeAPIResponse(fornecedoresRes);

      console.log('📈 Dados normalizados:', {
        vendasMes: vendasMes.length,
        vendasHoje: vendasHoje.length,
        clientes: clientes.length,
        produtos: produtos.length,
        fornecedores: fornecedores.length
      });

      // Calcular valores das vendas usando mapeamento de campos
      const valorVendasHoje = Array.isArray(vendasHoje) ? vendasHoje.reduce((total, venda) => {
        // Garantir que sempre converta para número
        const valorBruto = getFieldValue(venda, 'valor') || venda.valor_total || venda.total || venda.valor || 0;
        const valor = safeNumeric(valorBruto, 0);
        const totalAtual = total + valor;
        console.log('💰 Venda hoje:', {
          id: venda.id,
          valor_total: venda.valor_total,
          valorBruto,
          valor,
          total_anterior: total,
          total_parcial: totalAtual
        });
        return totalAtual;
      }, 0) : 0;

      const valorVendasMes = Array.isArray(vendasMes) ? vendasMes.reduce((total, venda) => {
        const valorBruto = getFieldValue(venda, 'valor') || venda.valor_total || venda.total || venda.valor || 0;
        const valor = safeNumeric(valorBruto, 0);
        return total + valor;
      }, 0) : 0;

      console.log('💵 TOTAL VENDAS HOJE:', valorVendasHoje, 'tipo:', typeof valorVendasHoje);
      console.log('💵 TOTAL VENDAS MÊS:', valorVendasMes, 'tipo:', typeof valorVendasMes);

      // Calcular produtos com estoque baixo (menor que 10)
      const produtosBaixoEstoque = Array.isArray(produtos) ? produtos.filter(p => {
        const estoque = getFieldValue(p, 'estoque') || safeNumeric(p.estoque) || safeNumeric(p.quantidade_estoque) || safeNumeric(p.quantidade);
        return estoque <= 10;
      }).length : 0;

      // Calcular clientes novos (últimos 30 dias)
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

      const clientesNovos = Array.isArray(clientes) ? clientes.filter(c => {
        const dataCriacao = getFieldValue(c, 'data_criacao');
        if (!dataCriacao) return false;
        const dataObj = new Date(dataCriacao);
        return dataObj >= trintaDiasAtras;
      }).length : 0;

      console.log('📈 Dados processados:', {
        vendasHoje: vendasHoje.length,
        valorVendasHoje,
        vendasMes: vendasMes.length,
        valorVendasMes,
        clientes: clientes.length,
        clientesNovos,
        produtos: produtos.length,
        produtosBaixoEstoque,
        fornecedores: fornecedores.length
      });

      setDashboardData({
        vendas: {
          hoje: vendasHoje.length,
          total: vendasMes.length,
          valor: valorVendasHoje,
          valorMes: valorVendasMes
        },
        clientes: {
          total: clientes.length,
          novos: clientesNovos
        },
        produtos: {
          total: produtos.length,
          baixoEstoque: produtosBaixoEstoque
        },
        financeiro: {
          receitas: valorVendasHoje,
          receitasMes: valorVendasMes,
          despesas: 0, // TODO: Implementar quando tiver endpoint de despesas
          saldo: valorVendasHoje
        }
      });

      // Atividades recentes baseadas em dados reais
      const atividades = [
        ...(Array.isArray(vendasHoje) ? vendasHoje.slice(0, 5).map((v, index) => {
          const valorRaw = getFieldValue(v, 'valor') || safeNumeric(v.valor_total) || safeNumeric(v.total) || safeNumeric(v.valor) || 0;
          const valor = safeNumeric(valorRaw, 0); // Garantir que é numérico
          const cliente = getFieldValue(v, 'cliente') || v.cliente_nome || v.cliente || 'Cliente não informado';
          const numero = v.numero_documento || v.numero || v.id || `#${index + 1}`;

          return {
            icon: '💰',
            title: `Venda ${numero}`,
            description: `R$ ${valor.toFixed(2)}`,
            time: 'Hoje',
            cliente: cliente
          };
        }) : []),
        {
          icon: '📊',
          title: 'Dashboard atualizado',
          description: `${Array.isArray(vendasMes) ? vendasMes.length : 0} vendas, ${Array.isArray(clientes) ? clientes.length : 0} clientes, ${Array.isArray(produtos) ? produtos.length : 0} produtos`,
          time: 'Agora'
        },
        {
          icon: '👥',
          title: 'Clientes ativos',
          description: `${clientes.length} clientes cadastrados`,
          time: 'Hoje'
        },
        {
          icon: '📦',
          title: 'Estoque',
          description: `${produtosBaixoEstoque} produtos com estoque baixo`,
          time: 'Hoje'
        }
      ];

      setRecentActivity(atividades);

    } catch (err) {
      console.error('❌ Erro ao buscar dados do dashboard:', err);
      setError(`Erro ao carregar dados: ${err.response?.data?.detail || err.message || 'Erro desconhecido'}`);

      // Dados de fallback em caso de erro
      setDashboardData({
        vendas: { hoje: 0, total: 0, valor: 0, valorMes: 0 },
        clientes: { total: 0, novos: 0 },
        produtos: { total: 0, baixoEstoque: 0 },
        financeiro: { receitas: 0, receitasMes: 0, despesas: 0, saldo: 0 }
      });
      setRecentActivity([{
        icon: '⚠️',
        title: 'Erro ao carregar dados',
        description: 'Verifique a conexéo com o banco de dados',
        time: 'Agora'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditMeta = () => {
    setNovaMeta(metaMensal.toString());
    setEditMetaDialogOpen(true);
  };

  const handleCloseEditMeta = () => {
    setEditMetaDialogOpen(false);
    setNovaMeta('');
  };

  const handleSaveMeta = () => {
    const valorMeta = parseFloat(novaMeta.replace(/\./g, '').replace(',', '.'));
    if (isNaN(valorMeta) || valorMeta <= 0) {
      alert('Por favor, insira um valor válido para a meta.');
      return;
    }
    setMetaMensal(valorMeta);
    localStorage.setItem('metaMensal', valorMeta.toString());
    handleCloseEditMeta();
  };

  useEffect(() => {
    fetchDashboardData();
  }, [axiosInstance]);

  // Verificar aniversariantes ao carregar o dashboard
  useEffect(() => {
    const verificarAniversariantes = async () => {
      try {
        const response = await axiosInstance.get('/aniversariantes/');
        if (response.data.aniversariantes && response.data.aniversariantes.length > 0) {
          setAniversariantesModalOpen(true);
        }
      } catch (err) {
        console.error('Erro ao verificar aniversariantes:', err);
      }
    };

    if (!loading) {
      verificarAniversariantes();
    }
  }, [loading, axiosInstance]);

  const stats = [
    {
      title: 'Vendas Hoje',
      value: safeData.vendas.hoje,
      subtitle: `R$ ${formatCurrency(safeData.vendas.valor)}`,
      icon: <AttachMoney />,
      color: '#4caf50',
      action: () => navigate('/vendas')
    },
    {
      title: 'Clientes',
      value: safeData.clientes.total,
      subtitle: `${safeData.clientes.novos} novos este mês`,
      icon: <People />,
      color: '#2196f3',
      action: () => navigate('/clientes')
    },
    {
      title: 'Produtos',
      value: safeData.produtos.total,
      subtitle: `${safeData.produtos.baixoEstoque} com estoque baixo`,
      icon: <Inventory />,
      color: safeData.produtos.baixoEstoque > 0 ? '#ff9800' : '#4caf50',
      action: () => navigate('/produtos')
    },
    {
      title: 'Saldo',
      value: `R$ ${formatCurrency(safeData.financeiro.saldo)}`,
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
    <Box
      className="no-max-width"
      sx={{
        p: 2,
        width: '100%',
        maxWidth: 'none',
        height: '100%'
      }}
    >
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 'bold', color: '#1976d2' }}
          >
            Dashboard
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
          >
            Bem-vindo de volta, {user?.first_name || user?.username}!
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
            onClick={fetchDashboardData}
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<ExitToApp />}
            onClick={() => setLogoutDialogOpen(true)}
            sx={{
              '&:hover': {
                backgroundColor: 'error.main',
                color: 'white'
              }
            }}
          >
            Sair
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Cards de Estatísticas */}
      <Grid
        container
        spacing={3}
        sx={{
          mb: 4,
          width: '100%',
          margin: 0,
          '& .MuiGrid-item': {
            paddingLeft: '12px !important'
          }
        }}
      >
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                cursor: 'pointer',
                height: '100%',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                },
                transition: 'all 0.3s ease',
                border: `2px solid ${stat.color}20`,
                borderRadius: 2
              }}
              onClick={stat.action}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: stat.color,
                      mr: 2,
                      width: 56,
                      height: 56,
                      '& svg': {
                        fontSize: '2rem',
                        color: 'white'
                      }
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: 'bold', color: stat.color }}
                    >
                      {loading ? '...' : stat.value}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ fontWeight: 500 }}
                    >
                      {stat.title}
                    </Typography>
                  </Box>
                  {!loading && (
                    <IconButton size="small" sx={{ color: stat.color }}>
                      <ArrowForward />
                    </IconButton>
                  )}
                </Box>
                <Typography
                  variant="body2"
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

      {/* Layout Principal */}
      <Grid
        container
        spacing={3}
        sx={{
          width: '100%',
          margin: 0,
          '& .MuiGrid-item': {
            paddingLeft: '12px !important'
          }
        }}
      >
        {/* Ações Rápidas */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 'bold', mb: 3 }}
            >
              Ações Rápidas
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} key={index}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease',
                      border: '1px solid #e0e0e0'
                    }}
                    onClick={action.action}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            bgcolor: action.color,
                            mr: 2,
                            width: 40,
                            height: 40,
                            '& svg': {
                              fontSize: '1.5rem',
                              color: 'white'
                            }
                          }}
                        >
                          {action.icon}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 'bold' }}
                          >
                            {action.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {action.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Atividades Recentes */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 'bold', mb: 3 }}
            >
              Atividades Recentes
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                  >
                    <Typography sx={{ fontSize: '1.5rem', mr: 2 }}>
                      {activity.icon}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {activity.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {activity.description}
                      </Typography>
                      {activity.cliente && (
                        <Typography
                          variant="caption"
                          color="primary.main"
                        >
                          {activity.cliente}
                        </Typography>
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {activity.time}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  {loading ? 'Carregando atividades...' : 'Nenhuma atividade recente'}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Estatísticas Resumidas */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 'bold', mb: 3 }}
            >
              Resumo do Mês
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Vendas Este Mês
              </Typography>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                R$ {formatCurrency(safeData.financeiro.receitasMes)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {safeData.vendas.total} vendas realizadas
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Meta Mensal - R$ {formatCurrency(metaMensal)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleOpenEditMeta}
                  sx={{ color: 'primary.main' }}
                  title="Editar meta"
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mr: 2 }}>
                  {(calculatePercentage(safeData.financeiro.receitasMes, metaMensal) || 0).toFixed(0)}%
                </Typography>
                <Typography
                  variant="body2"
                  color={safeData.financeiro.receitasMes >= 39000 ? "success.main" : "warning.main"}
                >
                  {safeData.financeiro.receitasMes >= 39000 ? "No prazo" : "Atençéo"}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={calculatePercentage(safeData.financeiro.receitasMes, metaMensal)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: safeData.financeiro.receitasMes >= (metaMensal * 0.78) ? '#4caf50' : '#ff9800'
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Restam R$ {formatCurrency(Math.max(metaMensal - safeData.financeiro.receitasMes, 0))} para a meta
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Novos Clientes
              </Typography>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {safeData.clientes.novos}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Últimos 30 dias
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal de Aniversariantes */}
      <AniversariantesModal
        open={aniversariantesModalOpen}
        onClose={() => setAniversariantesModalOpen(false)}
      />

      {/* Dialog de Confirma��o de Logout */}
      <LogoutDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={() => {
          setLogoutDialogOpen(false);
          logout();
        }}
        userName={user?.first_name || user?.username}
      />

      {/* Dialog de Edição da Meta */}
      <Dialog
        open={editMetaDialogOpen}
        onClose={handleCloseEditMeta}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney color="primary" />
            <Typography variant="h6">Definir Meta Mensal</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Valor da Meta (R$)"
              type="text"
              value={novaMeta}
              onChange={(e) => {
                // Permitir apenas números, vírgula e ponto
                const valor = e.target.value.replace(/[^\d.,]/g, '');
                setNovaMeta(valor);
              }}
              placeholder="Ex: 50000 ou 50.000,00"
              helperText="Digite o valor da meta mensal em reais"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
              }}
            />

            {novaMeta && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Meta definida: R$ {formatCurrency(parseFloat(novaMeta.replace(/\./g, '').replace(',', '.')) || 0)}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEditMeta} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveMeta}
            variant="contained"
            startIcon={<AttachMoney />}
          >
            Salvar Meta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardHomeClean;


