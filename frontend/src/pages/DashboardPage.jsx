import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    Paper,
    Divider,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    AttachMoney as MoneyIcon,
    ShoppingCart as ShoppingCartIcon,
    Build as BuildIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    AccountBalance as AccountBalanceIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { handleApiError } from '../utils/errorHandler';

/**
 * Página de Dashboard com KPIs e métricas do sistema
 */
const DashboardPage = () => {
    const { axiosInstance } = useAuth();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        vendasHoje: 0,
        vendasMes: 0,
        osAbertas: 0,
        osConcluidas: 0,
        contasReceber: 0,
        contasPagar: 0,
        clientesAtivos: 0,
        produtosEstoque: 0,
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const hoje = new Date().toISOString().split('T')[0];
            const primeiroDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                .toISOString()
                .split('T')[0];

            // Buscar métricas de vendas
            const vendasResponse = await axiosInstance.get('/vendas/');
            const vendas = Array.isArray(vendasResponse.data) ? vendasResponse.data : (vendasResponse.data.results || []);

            const vendasHoje = Array.isArray(vendas) 
                ? (vendas.filter((v) => v.data_venda?.startsWith(hoje)) || []).reduce((sum, v) => sum + parseFloat(v.valor_total || 0), 0)
                : 0;

            const vendasMes = Array.isArray(vendas)
                ? (vendas.filter((v) => v.data_venda >= primeiroDiaMes) || []).reduce((sum, v) => sum + parseFloat(v.valor_total || 0), 0)
                : 0;

            // Buscar métricas de OS
            const osResponse = await axiosInstance.get('/ordens-servico/');
            const ordens = Array.isArray(osResponse.data) ? osResponse.data : (osResponse.data.results || []);

            const osAbertas = Array.isArray(ordens) ? ordens.filter((os) =>
                os.status_nome?.toLowerCase().includes('aberta') ||
                os.status_nome?.toLowerCase().includes('andamento')
            ).length : 0;

            const osConcluidas = Array.isArray(ordens) ? ordens.filter((os) =>
                os.status_nome?.toLowerCase().includes('concluída') ||
                os.status_nome?.toLowerCase().includes('finalizada')
            ).length : 0;

            // Buscar contas a receber
            const contasReceberResponse = await axiosInstance.get('/contas/?tipo_conta=Receber');
            const contasReceber = Array.isArray(contasReceberResponse.data) ? contasReceberResponse.data : (contasReceberResponse.data.results || []);
            const totalReceber = Array.isArray(contasReceber)
                ? (contasReceber.filter((c) => c.status_conta !== 'Pago') || []).reduce((sum, c) => sum + parseFloat(c.valor_conta || 0), 0)
                : 0;

            // Buscar contas a pagar
            const contasPagarResponse = await axiosInstance.get('/contas/?tipo_conta=Pagar');
            const contasPagar = Array.isArray(contasPagarResponse.data) ? contasPagarResponse.data : (contasPagarResponse.data.results || []);
            const totalPagar = Array.isArray(contasPagar)
                ? (contasPagar.filter((c) => c.status_conta !== 'Pago') || []).reduce((sum, c) => sum + parseFloat(c.valor_conta || 0), 0)
                : 0;

            // Buscar clientes ativos
            const clientesResponse = await axiosInstance.get('/clientes/');
            const clientes = Array.isArray(clientesResponse.data) ? clientesResponse.data : (clientesResponse.data.results || []);
            const clientesAtivos = Array.isArray(clientes) ? clientes.filter((c) => c.ativo !== false).length : 0;

            // Buscar produtos em estoque
            const produtosResponse = await axiosInstance.get('/produtos/');
            const produtos = Array.isArray(produtosResponse.data) ? produtosResponse.data : (produtosResponse.data.results || []);
            const produtosEstoque = Array.isArray(produtos) ? produtos.filter((p) =>
                parseFloat(p.quantidade_estoque || 0) > 0
            ).length : 0;

            setMetrics({
                vendasHoje,
                vendasMes,
                osAbertas,
                osConcluidas,
                contasReceber: totalReceber,
                contasPagar: totalPagar,
                clientesAtivos,
                produtosEstoque,
            });
        } catch (error) {
            handleApiError(error, setSnackbar, 'Erro ao carregar métricas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const MetricCard = ({ title, value, icon: Icon, color, isCurrency = false, trend = null }) => (
        <Card
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                border: `1px solid ${color}30`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                },
            }}
        >
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box
                        sx={{
                            backgroundColor: `${color}20`,
                            borderRadius: 2,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon sx={{ fontSize: 32, color }} />
                    </Box>
                    {trend !== null && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                            {trend > 0 ? (
                                <TrendingUpIcon sx={{ fontSize: 20, color: 'success.main' }} />
                            ) : (
                                <TrendingDownIcon sx={{ fontSize: 20, color: 'error.main' }} />
                            )}
                            <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
                                {Math.abs(trend)}%
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Typography variant="h4" fontWeight="bold" color={color} mb={0.5}>
                    {isCurrency ? formatCurrency(value) : value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {title}
                </Typography>
            </CardContent>
        </Card>
    );

    if (loading) {
        return <LoadingSpinner message="Carregando dashboard..." />;
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Visão geral do sistema em tempo real
                    </Typography>
                </Box>
                <Tooltip title="Atualizar">
                    <IconButton onClick={fetchMetrics} color="primary">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Métricas Principais */}
            <Grid container spacing={3}>
                {/* Vendas Hoje */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Vendas Hoje"
                        value={metrics.vendasHoje}
                        icon={MoneyIcon}
                        color="#2e7d32"
                        isCurrency
                    />
                </Grid>

                {/* Vendas do Mês */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Vendas do Mês"
                        value={metrics.vendasMes}
                        icon={ShoppingCartIcon}
                        color="#1976d2"
                        isCurrency
                    />
                </Grid>

                {/* OS Abertas */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="OS Abertas"
                        value={metrics.osAbertas}
                        icon={BuildIcon}
                        color="#ed6c02"
                    />
                </Grid>

                {/* OS Concluídas */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="OS Concluídas"
                        value={metrics.osConcluidas}
                        icon={AssignmentIcon}
                        color="#9c27b0"
                    />
                </Grid>

                {/* Contas a Receber */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Contas a Receber"
                        value={metrics.contasReceber}
                        icon={TrendingUpIcon}
                        color="#388e3c"
                        isCurrency
                    />
                </Grid>

                {/* Contas a Pagar */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Contas a Pagar"
                        value={metrics.contasPagar}
                        icon={TrendingDownIcon}
                        color="#d32f2f"
                        isCurrency
                    />
                </Grid>

                {/* Clientes Ativos */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Clientes Ativos"
                        value={metrics.clientesAtivos}
                        icon={PeopleIcon}
                        color="#0288d1"
                    />
                </Grid>

                {/* Produtos em Estoque */}
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Produtos em Estoque"
                        value={metrics.produtosEstoque}
                        icon={AccountBalanceIcon}
                        color="#7b1fa2"
                    />
                </Grid>
            </Grid>

            {/* Resumo Financeiro */}
            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                    Resumo Financeiro
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Box textAlign="center" p={2}>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                                A Receber
                            </Typography>
                            <Typography variant="h5" color="success.main" fontWeight="bold">
                                {formatCurrency(metrics.contasReceber)}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box textAlign="center" p={2}>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                                A Pagar
                            </Typography>
                            <Typography variant="h5" color="error.main" fontWeight="bold">
                                {formatCurrency(metrics.contasPagar)}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box textAlign="center" p={2}>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                                Saldo Previsto
                            </Typography>
                            <Typography
                                variant="h5"
                                color={
                                    metrics.contasReceber - metrics.contasPagar >= 0
                                        ? 'success.main'
                                        : 'error.main'
                                }
                                fontWeight="bold"
                            >
                                {formatCurrency(metrics.contasReceber - metrics.contasPagar)}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default DashboardPage;
