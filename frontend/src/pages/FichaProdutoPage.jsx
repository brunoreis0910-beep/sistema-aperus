import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Grid,
    Card,
    CardContent,
    Autocomplete,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Assessment as AssessmentIcon,
    Print as PrintIcon,
    GetApp as DownloadIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function FichaProdutoPage() {
    const { axiosInstance } = useAuth();
    const [loading, setLoading] = useState(false);
    const [produtos, setProdutos] = useState([]);
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [resumo, setResumo] = useState(null);
    const [produtoInfo, setProdutoInfo] = useState(null);
    const [erro, setErro] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    // Carregar lista de produtos
    useEffect(() => {
        carregarProdutos();
    }, []);

    const carregarProdutos = async () => {
        try {
            const response = await axiosInstance.get('/produtos/');
            setProdutos(response.data || []);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            setErro('Erro ao carregar lista de produtos');
        }
    };

    const buscarMovimentacoes = async () => {
        if (!produtoSelecionado) {
            setErro('Selecione um produto para buscar as movimentações');
            return;
        }

        setLoading(true);
        setErro('');

        try {
            const params = {
                produto_id: produtoSelecionado.id_produto
            };

            if (dataInicio) params.data_inicio = dataInicio;
            if (dataFim) params.data_fim = dataFim;

            const response = await axiosInstance.get('/relatorios/ficha-produto/', { params });

            setMovimentacoes(response.data.movimentacoes || []);
            setResumo(response.data.resumo || null);
            setProdutoInfo(response.data.produto || null);
        } catch (error) {
            console.error('Erro ao buscar movimentações:', error);
            setErro(error.response?.data?.error || 'Erro ao buscar movimentações do produto');
        } finally {
            setLoading(false);
        }
    };

    const limparFiltros = () => {
        setProdutoSelecionado(null);
        setDataInicio('');
        setDataFim('');
        setMovimentacoes([]);
        setResumo(null);
        setProdutoInfo(null);
        setErro('');
    };

    const getTipoChipColor = (tipo) => {
        const colors = {
            'VENDA': 'error',
            'COMPRA': 'success',
            'COMANDA': 'warning',
            'OS': 'info'
        };
        return colors[tipo] || 'default';
    };

    const getMovimentoIcon = (tipo) => {
        return tipo === 'Entrada' ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />;
    };

    const formatarValor = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    };

    const formatarQuantidade = (quantidade) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
        }).format(quantidade || 0);
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Cabeçalho */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Ficha de Produto
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Visualize todas as movimentações de um produto (vendas, compras, comandas, OS)
                    </Typography>
                </Box>
            </Box>

            {/* Filtros */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Filtros
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <Autocomplete
                            options={produtos}
                            getOptionLabel={(option) => `${option.codigo_produto} - ${option.nome_produto}`}
                            value={produtoSelecionado}
                            onChange={(event, newValue) => setProdutoSelecionado(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Selecione o Produto *"
                                    variant="outlined"
                                    fullWidth
                                />
                            )}
                            noOptionsText="Nenhum produto encontrado"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Data Início"
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Data Fim"
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<SearchIcon />}
                                onClick={buscarMovimentacoes}
                                disabled={loading || !produtoSelecionado}
                                fullWidth
                            >
                                Buscar
                            </Button>
                            <Tooltip title="Limpar filtros">
                                <IconButton onClick={limparFiltros} color="error">
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Mensagem de erro */}
            {erro && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErro('')}>
                    {erro}
                </Alert>
            )}

            {/* Loading */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Informações do Produto e Resumo */}
            {!loading && produtoInfo && resumo && (
                <>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                        Produto
                                    </Typography>
                                    <Typography variant="h6">
                                        {produtoInfo.codigo}
                                    </Typography>
                                    <Typography variant="body2">
                                        {produtoInfo.nome}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Card sx={{ bgcolor: 'success.light' }}>
                                <CardContent>
                                    <Typography variant="body2" color="success.dark">
                                        Total Entradas
                                    </Typography>
                                    <Typography variant="h5" color="success.dark">
                                        {formatarQuantidade(resumo.total_entradas)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Card sx={{ bgcolor: 'error.light' }}>
                                <CardContent>
                                    <Typography variant="body2" color="error.dark">
                                        Total Saídas
                                    </Typography>
                                    <Typography variant="h5" color="error.dark">
                                        {formatarQuantidade(resumo.total_saidas)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Card sx={{ bgcolor: 'info.light' }}>
                                <CardContent>
                                    <Typography variant="body2" color="info.dark">
                                        Saldo Movimentado
                                    </Typography>
                                    <Typography variant="h5" color="info.dark">
                                        {formatarQuantidade(resumo.saldo)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card sx={{ bgcolor: 'warning.light' }}>
                                <CardContent>
                                    <Typography variant="body2" color="warning.dark">
                                        Total Movimentações
                                    </Typography>
                                    <Typography variant="h5" color="warning.dark">
                                        {resumo.total_movimentacoes}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Divider sx={{ mb: 3 }} />

                    {/* Tabela de Movimentações */}
                    <Paper>
                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">
                                Movimentações do Produto
                            </Typography>
                            <Box>
                                <Tooltip title="Imprimir">
                                    <IconButton color="primary">
                                        <PrintIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Exportar">
                                    <IconButton color="primary">
                                        <DownloadIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Documento</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pessoa</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Operação</TableCell>
                                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Movimento</TableCell>
                                        <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Qtd</TableCell>
                                        <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Vlr Unit.</TableCell>
                                        <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Vlr Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {movimentacoes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center">
                                                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                                    Nenhuma movimentação encontrada para este produto
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        movimentacoes.map((mov, index) => (
                                            <TableRow key={index} hover>
                                                <TableCell>
                                                    <Chip
                                                        label={mov.tipo}
                                                        size="small"
                                                        color={getTipoChipColor(mov.tipo)}
                                                    />
                                                </TableCell>
                                                <TableCell>{mov.numero || mov.documento_id}</TableCell>
                                                <TableCell>{mov.data}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                                        {mov.pessoa}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                                                        {mov.operacao}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        icon={getMovimentoIcon(mov.tipo_movimento)}
                                                        label={mov.tipo_movimento}
                                                        size="small"
                                                        color={mov.tipo_movimento === 'Entrada' ? 'success' : 'error'}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatarQuantidade(mov.quantidade)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    {formatarValor(mov.valor_unitario)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatarValor(mov.valor_total)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </>
            )}

            {/* Mensagem quando não há busca */}
            {!loading && !produtoInfo && !erro && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <AssessmentIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Selecione um produto e clique em Buscar
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        As movimentações do produto serão exibidas aqui
                    </Typography>
                </Paper>
            )}
        </Box>
    );
}

export default FichaProdutoPage;
