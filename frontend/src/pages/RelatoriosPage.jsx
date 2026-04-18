import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Divider,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    FormGroup,
    FormControlLabel,
    FormLabel,
    Checkbox,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    Assessment as AssessmentIcon,
    TrendingUp as TrendingUpIcon,
    Inventory as InventoryIcon,
    ShoppingCart as SalesIcon,
    People as PeopleIcon,
    LocalShipping as PurchaseIcon,
    AccountBalance as FinanceIcon,
    BarChart as ChartIcon,
    FilterList as FilterIcon,
    Close as CloseIcon,
    MonetizationOn as ComissaoIcon,
    ShoppingCart,
    Description as DescriptionIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function RelatoriosPage() {
    const { axiosInstance, user, permissions, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [gerando, setGerando] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    const [relatorioSelecionado, setRelatorioSelecionado] = useState(null);
    const [filtros, setFiltros] = useState({
        dataInicio: '',
        dataFim: '',
        dataRetroativa: '',
        cliente: '',
        produto: '',
        fornecedor: '',
        deposito: '',
        grupo: '',
        vendedor: '',
        operacao: '',
        formaPagamento: '',
        tipoData: 'vencimento',
        ordenacao: 'data_vencimento',
        resumoPor: [],
        resumosVendas: ['listagem', 'pagamento', 'grupo', 'operacao', 'cidade', 'clientes'],
        tipoRelatorio: 'todos',
        tipoValor: 'todos',
        tipoEstoque: 'todos',
        tipo: 'todos',
        status: 'todos',
        formato: 'pdf'
    });
    const [clientes, setClientes] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [depositos, setDepositos] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [operacoes, setOperacoes] = useState([]);
    const [formasPagamento, setFormasPagamento] = useState([]);

    const relatorios = [
        {
            id: 'vendas',
            titulo: 'Relatório de Vendas',
            descricao: 'Análise completa de vendas por período, produto e cliente',
            icone: <SalesIcon sx={{ fontSize: 40 }} />,
            cor: '#1976d2',
            disponivel: true,
            filtrosDisponiveis: ['dataInicio', 'dataFim', 'cliente', 'produto', 'status', 'vendedor', 'grupo', 'operacao', 'formaPagamento', 'resumosVendas'],
            categoria: 'vendas'
        },
        {
            id: 'estoque',
            titulo: 'Relatório de Estoque',
            descricao: 'posição atual de estoque, movimentações e alertas',
            icone: <InventoryIcon sx={{ fontSize: 40 }} />,
            cor: '#2e7d32',
            disponivel: true,
            filtrosDisponiveis: ['produto', 'deposito', 'tipoValor', 'grupo', 'tipoEstoque'],
            categoria: 'estoque'
        },
        {
            id: 'compras',
            titulo: 'Relatório de Compras',
            descricao: 'Histórico de compras, fornecedores e custos',
            icone: <PurchaseIcon sx={{ fontSize: 40 }} />,
            cor: '#ed6c02',
            disponivel: true,
            filtrosDisponiveis: ['dataInicio', 'dataFim', 'fornecedor', 'produto', 'status', 'grupo', 'operacao', 'deposito'],
            categoria: 'compras'
        },
        {
            id: 'financeiro',
            titulo: 'Relatório Financeiro',
            descricao: 'Fluxo de caixa, contas a pagar e receber',
            icone: <FinanceIcon sx={{ fontSize: 40 }} />,
            cor: '#9c27b0',
            disponivel: true,
            filtrosDisponiveis: ['dataInicio', 'dataFim', 'tipo', 'cliente', 'fornecedor', 'formaPagamento', 'status'],
            categoria: 'financeiro'
        },
        {
            id: 'dre',
            titulo: 'DRE - Demonstração do Resultado',
            descricao: 'Demonstrativo de receitas, despesas e resultado do período',
            icone: <AssessmentIcon sx={{ fontSize: 40 }} />,
            cor: '#00695c',
            disponivel: true,
            filtrosDisponiveis: ['dataInicio', 'dataFim', 'deposito', 'vendedor', 'operacao'],
            categoria: 'financeiro'
        },
        {
            id: 'clientes',
            titulo: 'Relatório de Clientes',
            descricao: 'Cadastro de clientes, histórico de compras e análise',
            icone: <PeopleIcon sx={{ fontSize: 40 }} />,
            cor: '#0288d1',
            disponivel: true,
            filtrosDisponiveis: ['cliente', 'status', 'dataInicio', 'dataFim', 'vendedor', 'grupo'],
            categoria: 'clientes'
        },
        {
            id: 'produtos',
            titulo: 'Relatório de Produtos',
            descricao: 'Catálogo completo, preços e performance de vendas',
            icone: <ChartIcon sx={{ fontSize: 40 }} />,
            cor: '#d32f2f',
            disponivel: true,
            filtrosDisponiveis: ['produto', 'grupo', 'deposito', 'tipoEstoque', 'dataInicio', 'dataFim'],
            categoria: 'produtos'
        },
        {
            id: 'desempenho',
            titulo: 'Análise de Desempenho',
            descricao: 'Indicadores de performance e tendências de negócio',
            icone: <TrendingUpIcon sx={{ fontSize: 40 }} />,
            cor: '#388e3c',
            disponivel: true,
            filtrosDisponiveis: ['dataInicio', 'dataFim', 'vendedor', 'produto', 'grupo', 'cliente'],
            categoria: 'desempenho'
        },
        {
            id: 'consolidado',
            titulo: 'Relatório Consolidado',
            descricao: 'Visão geral de todas as operações do sistema',
            icone: <AssessmentIcon sx={{ fontSize: 40 }} />,
            cor: '#7b1fa2',
            disponivel: true,
            filtrosDisponiveis: ['dataInicio', 'dataFim', 'deposito', 'vendedor', 'operacao'],
            categoria: 'desempenho'
        },
        {
            id: 'comissoes',
            titulo: 'Comissões por Vendedor',
            descricao: 'Comissões de vendas e contas recebidas por vendedor',
            icone: <ComissaoIcon sx={{ fontSize: 40 }} />,
            cor: '#f57c00',
            disponivel: true,
            filtrosDisponiveis: ['dataInicio', 'dataFim', 'vendedor', 'cliente', 'produto', 'operacao', 'status'],
            categoria: 'vendas'
        },
        {
            id: 'devolucoes',
            titulo: 'Relatório de Devoluções',
            descricao: 'Análise completa de produtos devolvidos',
            icone: <InventoryIcon sx={{ fontSize: 40 }} />,
            cor: '#c62828',
            disponivel: true,
            filtrosDisponiveis: ['dataInicio', 'dataFim', 'cliente', 'produto', 'status', 'vendedor', 'grupo', 'operacao'],
            categoria: 'vendas'
        },
        {
            id: 'trocas',
            titulo: 'Relatório de Trocas',
            descricao: 'Registro de trocas de produtos realizadas',
            icone: <SalesIcon sx={{ fontSize: 40 }} />,
            cor: '#6a1b9a',
            disponivel: true,
            filtrosDisponiveis: ['dataInicio', 'dataFim', 'cliente', 'produto', 'status', 'vendedor', 'grupo', 'operacao'],
            categoria: 'vendas'
        },        {
            id: 'cashback',
            titulo: 'Relatório de Cashback',
            descricao: 'Cashback gerado, utilizado e disponível por cliente',
            icone: <ComissaoIcon sx={{ fontSize: 40 }} />,
            cor: '#9c27b0',
            disponivel: true,
            redirect: '/relatorios/cashback',
            categoria: 'financeiro'
        },
        {
            id: 'lucratividade',
            titulo: 'Relatório de Lucratividade',
            descricao: 'Análise de receita, custo, lucro e margem por produto',
            icone: <TrendingUpIcon sx={{ fontSize: 40 }} />,
            cor: '#2e7d32',
            disponivel: true,
            redirect: '/relatorios/lucratividade',
            categoria: 'produtos'
        },
        {
            id: 'projecao-compra',
            titulo: 'Projeção de Compras',
            descricao: 'Sugestões de compra baseadas em estoque e consumo médio',
            icone: <ShoppingCart sx={{ fontSize: 40 }} />,
            cor: '#f57c00',
            disponivel: true,
            redirect: '/relatorios/projecao-compra',
            categoria: 'compras'
        },
        {
            id: 'inventario',
            titulo: 'Relatório de Inventário',
            descricao: 'Contagem física de estoque e divergências',
            icone: <InventoryIcon sx={{ fontSize: 40 }} />,
            cor: '#795548',
            disponivel: true,
            filtrosDisponiveis: ['deposito', 'produto', 'grupo'],
            categoria: 'estoque'
        },
        {
            id: 'inventario-retroativo',
            titulo: 'Inventário Retroativo',
            descricao: 'Análise completa de estoque com custos e valores retroativos',
            icone: <AssessmentIcon sx={{ fontSize: 40 }} />,
            cor: '#8d6e63',
            disponivel: true,
            filtrosDisponiveis: ['dataRetroativa', 'deposito', 'produto', 'grupo', 'tipoEstoque'],
            categoria: 'estoque'
        },
        {
            id: 'comandas',
            titulo: 'Relatório de Comandas',
            descricao: 'Histórico completo de pedidos em aberto',
            icone: <AssessmentIcon sx={{ fontSize: 40 }} />,
            cor: '#00796b',
            disponivel: true,
            filtrosDisponiveis: ['dataInicio', 'dataFim', 'cliente', 'status', 'vendedor', 'produto'],
            categoria: 'comandas'
        },
        {
            id: 'cte',
            titulo: 'Relatório de CT-e',
            descricao: 'Conhecimentos de Transporte Eletrônicos emitidos',
            icone: <PurchaseIcon sx={{ fontSize: 40 }} />,
            cor: '#1565c0',
            disponivel: true,
            redirect: '/relatorios/cte',
            categoria: 'fiscal'
        },
        {
            id: 'mdfe',
            titulo: 'Relatório de MDF-e',
            descricao: 'Manifestos Eletrônicos de Documentos Fiscais',
            icone: <DescriptionIcon sx={{ fontSize: 40 }} />,
            cor: '#6a1b9a',
            disponivel: true,
            filtrosDisponiveis: ['dataInicio', 'dataFim', 'placa_veiculo', 'condutor', 'status'],
            categoria: 'fiscal'
        },
        {
            id: 'contas-receber-pagar',
            titulo: 'Contas a Receber e Pagar',
            descricao: 'Relatório completo de contas a receber (recebidas/pendentes) e contas a pagar (pagas/pendentes)',
            icone: <FinanceIcon sx={{ fontSize: 40 }} />,
            cor: '#0288d1',
            disponivel: true,
            filtrosDisponiveis: ['dataInicio', 'dataFim', 'tipoData', 'cliente', 'operacao', 'tipoRelatorio', 'status', 'ordenacao', 'resumoPor'],
            categoria: 'financeiro'
        },
        {
            id: 'conferencia',
            titulo: 'Relatório de Conferência',
            descricao: 'Cruza Vendas × Contas a Receber × Valores Recebidos × Bancário e destaca divergências',
            icone: <AssessmentIcon sx={{ fontSize: 40 }} />,
            cor: '#1a237e',
            disponivel: true,
            filtrosDisponiveis: ['dataInicio', 'dataFim'],
            categoria: 'financeiro'
        }
    ];

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            const [resClientes, resProdutos, resFornecedores, resDepositos, resGrupos, resVendedores, resOperacoes, resFormasPagamento] = await Promise.all([
                axiosInstance.get('/clientes/?page_size=1000'),
                axiosInstance.get('/produtos/?page_size=1000'),
                axiosInstance.get('/fornecedores/?page_size=100'),
                axiosInstance.get('/depositos/?page_size=100').catch(() => ({ data: [] })),
                axiosInstance.get('/grupos-produto/').catch(() => ({ data: [] })),
                axiosInstance.get('/vendedores/').catch(() => ({ data: [] })),
                axiosInstance.get('/operacoes/?page_size=500').catch(() => ({ data: [] })),
                axiosInstance.get('/formas-pagamento/?page_size=100').catch(() => ({ data: [] }))
            ]);

            // Verificar se é paginado ou array direto
            const clientesData = Array.isArray(resClientes.data) ? resClientes.data : (resClientes.data?.results || []);
            const produtosData = Array.isArray(resProdutos.data) ? resProdutos.data : (resProdutos.data?.results || []);
            const fornecedoresData = Array.isArray(resFornecedores.data) ? resFornecedores.data : (resFornecedores.data?.results || []);
            const depositosData = Array.isArray(resDepositos.data) ? resDepositos.data : (resDepositos.data?.results || []);
            const gruposData = Array.isArray(resGrupos.data) ? resGrupos.data : (resGrupos.data?.results || []);
            const vendedoresData = Array.isArray(resVendedores.data) ? resVendedores.data : (resVendedores.data?.results || []);
            const operacoesData = Array.isArray(resOperacoes.data) ? resOperacoes.data : (resOperacoes.data?.results || []);
            const formasPagamentoData = Array.isArray(resFormasPagamento.data) ? resFormasPagamento.data : (resFormasPagamento.data?.results || []);

            setClientes(clientesData);
            setProdutos(produtosData);
            setFornecedores(fornecedoresData);
            setDepositos(depositosData);
            setGrupos(gruposData);
            setVendedores(vendedoresData);
            setOperacoes(operacoesData);
            setFormasPagamento(formasPagamentoData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    };

    const abrirModalFiltros = (relatorio) => {
        if (relatorio.redirect) {
            navigate(relatorio.redirect);
            return;
        }
        setRelatorioSelecionado(relatorio);
        setFiltros({
            dataInicio: '',
            dataFim: '',
            dataRetroativa: '',
            cliente: '',
            produto: '',
            fornecedor: '',
            deposito: '',
            grupo: '',
            vendedor: '',
            operacao: '',
            formaPagamento: '',
            tipoData: 'vencimento',
            ordenacao: 'data_vencimento',
            resumoPor: [],
            resumosVendas: ['listagem', 'pagamento', 'grupo', 'operacao', 'cidade', 'clientes'],
            tipoRelatorio: 'todos',
            tipoValor: 'todos',
            tipoEstoque: 'todos',
            tipo: 'todos',
            status: 'todos',
            formato: 'pdf'
        });
        setModalAberto(true);
    };

    const fecharModal = () => {
        setModalAberto(false);
        setRelatorioSelecionado(null);
    };

    const gerarRelatorio = async () => {
        try {
            setGerando(relatorioSelecionado.id);
            setModalAberto(false);

            console.log('Gerando relatório:', relatorioSelecionado.id, filtros);

            // Relatório de Vendas Completo - novo endpoint com resumos
            if (relatorioSelecionado.id === 'vendas') {
                if (!filtros.dataInicio || !filtros.dataFim) {
                    alert('Selecione a data inicial e final');
                    setGerando(null);
                    return;
                }
                
                const params = new URLSearchParams({
                    data_inicio: filtros.dataInicio,
                    data_fim: filtros.dataFim
                });
                
                if (filtros.cliente) params.append('cliente', filtros.cliente);
                if (filtros.vendedor) params.append('vendedor', filtros.vendedor);
                if (filtros.operacao) params.append('operacao', filtros.operacao);
                if (filtros.status && filtros.status !== 'todos') params.append('status', filtros.status);
                if (filtros.resumosVendas && filtros.resumosVendas.length > 0) {
                    params.append('resumos', filtros.resumosVendas.join(','));
                }
                
                const response = await axiosInstance.get(`/relatorios/vendas/pdf/?${params.toString()}`, {
                    responseType: 'blob'
                });
                
                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `relatorio_vendas_${filtros.dataInicio}_${filtros.dataFim}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                
                setGerando(null);
                return;
            }

            // Relatório de Vendas por Operação
            if (relatorioSelecionado.id === 'vendas-operacao') {
                if (!filtros.dataInicio || !filtros.dataFim) {
                    alert('Selecione a data inicial e final');
                    setGerando(null);
                    return;
                }
                
                const params = new URLSearchParams({
                    data_inicio: filtros.dataInicio,
                    data_fim: filtros.dataFim
                });
                
                const response = await axiosInstance.get(`/relatorios/vendas-operacao/pdf/?${params.toString()}`, {
                    responseType: 'blob'
                });
                
                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `vendas_por_operacao_${filtros.dataInicio}_${filtros.dataFim}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                
                setGerando(null);
                return;
            }

            // Relatório de Conferência
            if (relatorioSelecionado.id === 'conferencia') {
                if (!filtros.dataInicio || !filtros.dataFim) {
                    alert('Selecione a data inicial e final');
                    setGerando(null);
                    return;
                }

                const params = new URLSearchParams({
                    data_inicio: filtros.dataInicio,
                    data_fim: filtros.dataFim,
                });

                const response = await axiosInstance.get(`/relatorios/conferencia/pdf/?${params.toString()}`, {
                    responseType: 'blob',
                });

                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `conferencia_${filtros.dataInicio}_${filtros.dataFim}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

                setGerando(null);
                return;
            }

            // Outros relatórios - sistema genérico existente
            const response = await axiosInstance.post('/relatorios/gerar/', {
                tipo: relatorioSelecionado.id,
                filtros: filtros
            }, {
                responseType: 'blob'
            });

            console.log('Relatório gerado com sucesso!');

            // Determinar extensão do arquivo baseado no formato
            const extensao = filtros.formato === 'excel' ? 'xlsx' : 'pdf';
            const mimeType = filtros.formato === 'excel'
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'application/pdf';

            // Criar URL do blob e fazer download
            const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `relatorio_${relatorioSelecionado.id}_${new Date().getTime()}.${extensao}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setGerando(null);
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            setGerando(null);
            alert('Erro ao gerar relatório: ' + (error.response?.data?.error || error.message));
        }
    };

    const mostrarFiltro = (filtroNome) => {
        return relatorioSelecionado?.filtrosDisponiveis?.includes(filtroNome);
    };

    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!user?.is_staff && !permissions?.relatorios_acessar) {
        return (
            <Box p={3}>
                <Alert severity="warning">Você não tem permissão para acessar Relatórios.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5, color: 'primary.main' }}>
                    📊 Relatórios
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Gere relatórios detalhados em PDF com filtros personalizados
                </Typography>
            </Box>

            <Grid container spacing={2}>
                {relatorios
                    .filter(r => {
                        const categoria = searchParams.get('categoria');
                        return !categoria || r.categoria === categoria;
                    })
                    .map((relatorio) => (
                    <Grid item xs={12} sm={6} md={4} xl={3} key={relatorio.id}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.2s',
                                opacity: relatorio.disponivel ? 1 : 0.6,
                                '&:hover': {
                                    transform: relatorio.disponivel ? 'translateY(-2px)' : 'none',
                                    boxShadow: relatorio.disponivel ? 4 : 1
                                }
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1, p: 2 }}>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    mb: 1.5
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: 48,
                                        height: 48,
                                        borderRadius: 1.5,
                                        bgcolor: `${relatorio.cor}15`,
                                        color: relatorio.cor,
                                    }}>
                                        {React.cloneElement(relatorio.icone, { sx: { fontSize: 28 } })}
                                    </Box>
                                    {!relatorio.disponivel && (
                                        <Chip
                                            label="Em breve"
                                            size="small"
                                            color="default"
                                        />
                                    )}
                                </Box>
                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                                    {relatorio.titulo}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                                    {relatorio.descricao}
                                </Typography>
                            </CardContent>
                            <Divider />
                            <CardActions sx={{ p: 1.5 }}>
                                <Button
                                    fullWidth
                                    size="small"
                                    variant={relatorio.disponivel ? "contained" : "outlined"}
                                    startIcon={<FilterIcon />}
                                    onClick={() => abrirModalFiltros(relatorio)}
                                    disabled={!relatorio.disponivel || gerando === relatorio.id}
                                    sx={{
                                        bgcolor: relatorio.disponivel ? relatorio.cor : 'transparent',
                                        '&:hover': {
                                            bgcolor: relatorio.disponivel ? relatorio.cor : 'transparent',
                                            filter: 'brightness(0.9)'
                                        },
                                        textTransform: 'none',
                                        fontWeight: 500
                                    }}
                                >
                                    {gerando === relatorio.id ? 'Gerando...' : 'Filtros e Gerar'}
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Modal de Filtros */}
            <Dialog
                open={modalAberto}
                onClose={fecharModal}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{
                    bgcolor: relatorioSelecionado?.cor || 'primary.main',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    px: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {relatorioSelecionado && React.cloneElement(relatorioSelecionado.icone, { sx: { fontSize: 28 } })}
                        <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                            {relatorioSelecionado?.titulo}
                        </Typography>
                    </Box>
                    <Button
                        onClick={fecharModal}
                        sx={{ color: 'white', minWidth: 'auto', p: 0.5 }}
                    >
                        <CloseIcon fontSize="small" />
                    </Button>
                </DialogTitle>
                <DialogContent sx={{ pt: 2, pb: 1 }}>
                    <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
                        <Typography variant="caption">Configure os filtros para personalizar seu relatório</Typography>
                    </Alert>

                    <Grid container spacing={1.5}>
                        {mostrarFiltro('dataRetroativa') && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Data Retroativa"
                                    value={filtros.dataRetroativa}
                                    onChange={(e) => setFiltros({ ...filtros, dataRetroativa: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                    helperText="Selecione a data para calcular o estoque retroativo"
                                />
                            </Grid>
                        )}

                        {mostrarFiltro('dataInicio') && (
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Data Início"
                                    value={filtros.dataInicio}
                                    onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                />
                            </Grid>
                        )}

                        {mostrarFiltro('dataFim') && (
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Data Fim"
                                    value={filtros.dataFim}
                                    onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                />
                            </Grid>
                        )}

                        {mostrarFiltro('cliente') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Cliente</InputLabel>
                                    <Select
                                        value={filtros.cliente}
                                        onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
                                        label="Cliente"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        {clientes.map(cliente => (
                                            <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                                                {cliente.nome_razao_social || cliente.nome_fantasia}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('produto') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Produto</InputLabel>
                                    <Select
                                        value={filtros.produto}
                                        onChange={(e) => setFiltros({ ...filtros, produto: e.target.value })}
                                        label="Produto"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        {produtos.map(produto => (
                                            <MenuItem key={produto.id_produto} value={produto.id_produto}>
                                                {produto.nome_produto}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('fornecedor') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Fornecedor</InputLabel>
                                    <Select
                                        value={filtros.fornecedor}
                                        onChange={(e) => setFiltros({ ...filtros, fornecedor: e.target.value })}
                                        label="Fornecedor"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        {fornecedores.map(fornecedor => (
                                            <MenuItem key={fornecedor.id_fornecedor} value={fornecedor.id_fornecedor}>
                                                {fornecedor.nome_fornecedor}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('deposito') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Depósito</InputLabel>
                                    <Select
                                        value={filtros.deposito}
                                        onChange={(e) => setFiltros({ ...filtros, deposito: e.target.value })}
                                        label="Depósito"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        {depositos.map(deposito => (
                                            <MenuItem key={deposito.id_deposito} value={deposito.id_deposito}>
                                                {deposito.nome_deposito}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('tipoValor') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Tipo de Valor</InputLabel>
                                    <Select
                                        value={filtros.tipoValor}
                                        onChange={(e) => setFiltros({ ...filtros, tipoValor: e.target.value })}
                                        label="Tipo de Valor"
                                    >
                                        <MenuItem value="todos">Todos os Valores</MenuItem>
                                        <MenuItem value="venda">Valor de Venda</MenuItem>
                                        <MenuItem value="compra">Valor de Compra</MenuItem>
                                        <MenuItem value="custo">Valor de Custo</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('tipoEstoque') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Situação do Estoque</InputLabel>
                                    <Select
                                        value={filtros.tipoEstoque || 'todos'}
                                        onChange={(e) => setFiltros({ ...filtros, tipoEstoque: e.target.value })}
                                        label="Situação do Estoque"
                                    >
                                        <MenuItem value="todos">Todos</MenuItem>
                                        <MenuItem value="positivo">Estoque Positivo</MenuItem>
                                        <MenuItem value="negativo">Estoque Negativo</MenuItem>
                                        <MenuItem value="zerado">Estoque Zerado</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('tipo') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Tipo de Movimentação</InputLabel>
                                    <Select
                                        value={filtros.tipo}
                                        onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                                        label="Tipo de Movimentação"
                                    >
                                        <MenuItem value="todos">Todas (Entradas e Saídas)</MenuItem>
                                        <MenuItem value="entrada">Apenas Entradas (Vendas)</MenuItem>
                                        <MenuItem value="saida">Apenas Saídas (Compras)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('grupo') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Grupo de Produtos</InputLabel>
                                    <Select
                                        value={filtros.grupo}
                                        onChange={(e) => setFiltros({ ...filtros, grupo: e.target.value })}
                                        label="Grupo de Produtos"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        {grupos.map(grupo => (
                                            <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                                                {grupo.nome_grupo}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('status') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={filtros.status}
                                        onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                                        label="Status"
                                    >
                                        <MenuItem value="todos">Todos</MenuItem>
                                        <MenuItem value="ativo">Ativo</MenuItem>
                                        <MenuItem value="inativo">Inativo</MenuItem>
                                        <MenuItem value="pendente">Pendente</MenuItem>
                                        <MenuItem value="pago">Pago/Recebido</MenuItem>
                                        <MenuItem value="concluido">Concluído</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('vendedor') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Vendedor</InputLabel>
                                    <Select
                                        value={filtros.vendedor}
                                        onChange={(e) => setFiltros({ ...filtros, vendedor: e.target.value })}
                                        label="Vendedor"
                                    >
                                        <MenuItem value="">Todos os Vendedores</MenuItem>
                                        {vendedores.map(vendedor => (
                                            <MenuItem key={vendedor.id_vendedor} value={vendedor.id_vendedor}>
                                                {vendedor.nome} {vendedor.percentual_comissao && `(${vendedor.percentual_comissao}%)`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('tipoData') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Filtrar por Tipo de Data</InputLabel>
                                    <Select
                                        value={filtros.tipoData || 'vencimento'}
                                        onChange={(e) => setFiltros({ ...filtros, tipoData: e.target.value })}
                                        label="Filtrar por Tipo de Data"
                                    >
                                        <MenuItem value="vencimento">Data de Vencimento</MenuItem>
                                        <MenuItem value="pagamento">Data de Pagamento / Recebimento</MenuItem>
                                        <MenuItem value="emissao">Data do Documento (Emissão)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('operacao') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Operação</InputLabel>
                                    <Select
                                        value={filtros.operacao || ''}
                                        onChange={(e) => setFiltros({ ...filtros, operacao: e.target.value })}
                                        label="Operação"
                                    >
                                        <MenuItem value="">Todas as Operações</MenuItem>
                                        {operacoes.map(op => (
                                            <MenuItem key={op.id_operacao} value={op.id_operacao}>
                                                {op.nome_operacao}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('formaPagamento') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Forma de Pagamento</InputLabel>
                                    <Select
                                        value={filtros.formaPagamento || ''}
                                        onChange={(e) => setFiltros({ ...filtros, formaPagamento: e.target.value })}
                                        label="Forma de Pagamento"
                                    >
                                        <MenuItem value="">Todas as Formas</MenuItem>
                                        {formasPagamento.map(forma => (
                                            <MenuItem key={forma.id_forma_pagamento} value={forma.id_forma_pagamento}>
                                                {forma.nome_forma_pagamento}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('resumosVendas') && (
                            <Grid item xs={12}>
                                <Box sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    p: 1.5,
                                    bgcolor: 'background.paper'
                                }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                                        📋 SEÇÕES DO RELATÓRIO
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                                        <Button size="small" sx={{ fontSize: '0.7rem', p: 0, mr: 1, textTransform: 'none' }}
                                            onClick={() => setFiltros({ ...filtros, resumosVendas: ['listagem', 'pagamento', 'grupo', 'operacao', 'cidade', 'clientes'] })}>
                                            Todas
                                        </Button>
                                        <Button size="small" sx={{ fontSize: '0.7rem', p: 0, textTransform: 'none' }}
                                            onClick={() => setFiltros({ ...filtros, resumosVendas: [] })}>
                                            Nenhuma
                                        </Button>
                                    </Box>
                                    <FormGroup>
                                        {[
                                            { value: 'listagem', label: '🛒 Listagem de Vendas' },
                                            { value: 'pagamento', label: '💳 Resumo por Forma de Pagamento' },
                                            { value: 'grupo', label: '📦 Resumo por Grupo de Produtos' },
                                            { value: 'operacao', label: '📋 Resumo por Operação Fiscal' },
                                            { value: 'cidade', label: '🏙️ Resumo por Cidade' },
                                            { value: 'clientes', label: '🏆 Top 10 Clientes' },
                                        ].map(({ value, label }) => (
                                            <FormControlLabel
                                                key={value}
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={(filtros.resumosVendas || []).includes(value)}
                                                        onChange={(e) => {
                                                            const atual = filtros.resumosVendas || [];
                                                            const novo = e.target.checked
                                                                ? [...atual, value]
                                                                : atual.filter(v => v !== value);
                                                            setFiltros({ ...filtros, resumosVendas: novo });
                                                        }}
                                                    />
                                                }
                                                label={<span style={{ fontSize: '0.82rem' }}>{label}</span>}
                                                sx={{ mr: 0, mb: 0 }}
                                            />
                                        ))}
                                    </FormGroup>
                                </Box>
                            </Grid>
                        )}

                        {mostrarFiltro('tipoRelatorio') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Tipo de Conta</InputLabel>
                                    <Select
                                        value={filtros.tipoRelatorio || 'todos'}
                                        onChange={(e) => setFiltros({ ...filtros, tipoRelatorio: e.target.value })}
                                        label="Tipo de Conta"
                                    >
                                    <MenuItem value="todos">Ambos (Receber e Pagar)</MenuItem>
                                        <MenuItem value="receber">Contas a Receber (pendentes + recebidas)</MenuItem>
                                        <MenuItem value="receber_pendente">⏳ Somente A Receber (pendentes)</MenuItem>
                                        <MenuItem value="receber_liquidado">✅ Somente Recebidas</MenuItem>
                                        <MenuItem value="pagar">Contas a Pagar (pendentes + pagas)</MenuItem>
                                        <MenuItem value="pagar_pendente">⏳ Somente A Pagar (pendentes)</MenuItem>
                                        <MenuItem value="pagar_liquidado">✅ Somente Pagas</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('ordenacao') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Ordenar por</InputLabel>
                                    <Select
                                        value={filtros.ordenacao || 'data_vencimento'}
                                        onChange={(e) => setFiltros({ ...filtros, ordenacao: e.target.value })}
                                        label="Ordenar por"
                                    >
                                        <MenuItem value="data_vencimento">Data de Vencimento</MenuItem>
                                        <MenuItem value="cliente">Cliente / Fornecedor</MenuItem>
                                        <MenuItem value="data_emissao">Data do Documento</MenuItem>
                                        <MenuItem value="documento">Número do Documento</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('resumoPor') && (
                            <Grid item xs={12}>
                                <FormControl component="fieldset" size="small" fullWidth>
                                    <FormLabel component="legend" sx={{ fontSize: '0.75rem', mb: 0.5 }}>Resumo por (selecione um ou mais)</FormLabel>
                                    <FormGroup row sx={{ gap: 0 }}>
                                        {[
                                            { value: 'centro_custo', label: 'Centro de Custo' },
                                            { value: 'cond_pagamento', label: 'Cond. Pagamento' },
                                            { value: 'conta_baixa', label: 'Conta de Baixa' },
                                            { value: 'conta_lancamento', label: 'Conta de Lançamento' },
                                            { value: 'operacao', label: 'Operação' },
                                        ].map(({ value, label }) => (
                                            <FormControlLabel
                                                key={value}
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={(filtros.resumoPor || []).includes(value)}
                                                        onChange={(e) => {
                                                            const atual = filtros.resumoPor || [];
                                                            const novo = e.target.checked
                                                                ? [...atual, value]
                                                                : atual.filter(v => v !== value);
                                                            setFiltros({ ...filtros, resumoPor: novo });
                                                        }}
                                                    />
                                                }
                                                label={<span style={{ fontSize: '0.82rem' }}>{label}</span>}
                                                sx={{ mr: 1 }}
                                            />
                                        ))}
                                    </FormGroup>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('destinatario') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Destinatário</InputLabel>
                                    <Select
                                        value={filtros.destinatario || ''}
                                        onChange={(e) => setFiltros({ ...filtros, destinatario: e.target.value })}
                                        label="Destinatário"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        {clientes.map(c => (
                                            <MenuItem key={c.id_cliente} value={c.id_cliente}>
                                                {c.nome_razao_social}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('remetente') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Remetente</InputLabel>
                                    <Select
                                        value={filtros.remetente || ''}
                                        onChange={(e) => setFiltros({ ...filtros, remetente: e.target.value })}
                                        label="Remetente"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        {clientes.map(c => (
                                            <MenuItem key={c.id_cliente} value={c.id_cliente}>
                                                {c.nome_razao_social}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('motorista') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Motorista</InputLabel>
                                    <Select
                                        value={filtros.motorista || ''}
                                        onChange={(e) => setFiltros({ ...filtros, motorista: e.target.value })}
                                        label="Motorista"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        {vendedores.map(v => (
                                            <MenuItem key={v.id_vendedor} value={v.id_vendedor}>
                                                {v.nome}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {mostrarFiltro('placa_veiculo') && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Placa do Veículo"
                                    value={filtros.placa_veiculo || ''}
                                    onChange={(e) => setFiltros({ ...filtros, placa_veiculo: e.target.value })}
                                    placeholder="ABC-1234"
                                />
                            </Grid>
                        )}

                        {mostrarFiltro('condutor') && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Condutor</InputLabel>
                                    <Select
                                        value={filtros.condutor || ''}
                                        onChange={(e) => setFiltros({ ...filtros, condutor: e.target.value })}
                                        label="Condutor"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        {vendedores.map(v => (
                                            <MenuItem key={v.id_vendedor} value={v.id_vendedor}>
                                                {v.nome}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Formato</InputLabel>
                                <Select
                                    value={filtros.formato}
                                    onChange={(e) => setFiltros({ ...filtros, formato: e.target.value })}
                                    label="Formato"
                                >
                                    <MenuItem value="pdf">📄 PDF</MenuItem>
                                    <MenuItem value="excel">📊 Excel</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
                    <Button onClick={fecharModal} variant="outlined" size="small">
                        Cancelar
                    </Button>
                    <Button
                        onClick={gerarRelatorio}
                        variant="contained"
                        size="small"
                        startIcon={filtros.formato === 'excel' ? <ExcelIcon /> : <PdfIcon />}
                        sx={{
                            bgcolor: relatorioSelecionado?.cor,
                            '&:hover': {
                                bgcolor: relatorioSelecionado?.cor,
                                filter: 'brightness(0.9)'
                            }
                        }}
                    >
                        Gerar {filtros.formato === 'excel' ? 'Excel' : 'PDF'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Paper sx={{ p: 2, mt: 3, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    💡 Dica
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Clique em "Filtros e Gerar" em qualquer relatório para personalizar os dados que serão incluídos.
                    Você pode filtrar por período, cliente, produto, fornecedor e muito mais!
                </Typography>
            </Paper>
        </Box>
    );
}

export default RelatoriosPage;




