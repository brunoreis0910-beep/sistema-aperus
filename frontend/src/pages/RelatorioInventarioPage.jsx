import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Select,
    MenuItem,
    InputLabel,
    CircularProgress,
    Card,
    CardContent,
    Chip
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Search, FileDownload, PictureAsPdf, Inventory } from '@mui/icons-material';

const RelatorioInventarioPage = () => {
    const { axiosInstance } = useAuth();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [depositos, setDepositos] = useState([]);
    const [grupos, setGrupos] = useState([]);
    
    const [filtros, setFiltros] = useState({
        data_retroativa: '',
        filtro_estoque: 'todos',
        id_deposito: '',
        id_grupo: ''
    });

    const [dados, setDados] = useState([]);
    const [totais, setTotais] = useState(null);
    const [filtrosAplicados, setFiltrosAplicados] = useState([]);

    useEffect(() => {
        carregarDepositos();
        carregarGrupos();
    }, []);

    const carregarDepositos = async () => {
        try {
            const response = await axiosInstance.get('/depositos/');
            const data = response.data;
            // Garante que sempre seja um array
            if (Array.isArray(data)) {
                setDepositos(data);
            } else if (data && Array.isArray(data.results)) {
                setDepositos(data.results);
            } else {
                setDepositos([]);
            }
        } catch (error) {
            console.error('Erro ao carregar depósitos:', error);
            setDepositos([]);
        }
    };

    const carregarGrupos = async () => {
        try {
            const response = await axiosInstance.get('/grupos-produto/');
            const data = response.data;
            // Garante que sempre seja um array
            if (Array.isArray(data)) {
                setGrupos(data);
            } else if (data && Array.isArray(data.results)) {
                setGrupos(data.results);
            } else {
                setGrupos([]);
            }
        } catch (error) {
            console.error('Erro ao carregar grupos:', error);
            setGrupos([]);
        }
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const buscarRelatorio = async () => {
        setLoading(true);
        try {
            const params = {
                formato: 'json',
                ...filtros
            };

            // Remover parâmetros vazios
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null) {
                    delete params[key];
                }
            });

            const response = await axiosInstance.get('/relatorios/inventario/', { params });
            
            setDados(response.data.produtos || []);
            setTotais(response.data.totais || null);
            setFiltrosAplicados(response.data.filtros_aplicados || []);
            
            showToast('Relatório carregado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao buscar relatório:', error);
            showToast('Erro ao carregar relatório', 'error');
        } finally {
            setLoading(false);
        }
    };

    const exportarExcel = async () => {
        setLoading(true);
        try {
            const params = {
                formato: 'excel',
                ...filtros
            };

            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null) {
                    delete params[key];
                }
            });

            const response = await axiosInstance.get('/relatorios/inventario/', {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showToast('Excel gerado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar Excel:', error);
            showToast('Erro ao gerar Excel', 'error');
        } finally {
            setLoading(false);
        }
    };

    const exportarPDF = async () => {
        setLoading(true);
        try {
            const params = {
                formato: 'pdf',
                ...filtros
            };

            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null) {
                    delete params[key];
                }
            });

            const response = await axiosInstance.get('/relatorios/inventario/', {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showToast('PDF gerado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            showToast('Erro ao gerar PDF', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getClassificacaoColor = (classificacao) => {
        switch (classificacao) {
            case 'CRÍTICO':
                return 'error';
            case 'BAIXO':
                return 'warning';
            case 'EXCESSO':
                return 'info';
            case 'NORMAL':
                return 'success';
            default:
                return 'default';
        }
    };

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Inventory sx={{ fontSize: 40, mr: 2, color: '#00796b' }} />
                <Typography variant="h4" component="h1">
                    Relatório de Inventário Retroativo
                </Typography>
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Filtros
                </Typography>
                
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Data Retroativa"
                            type="date"
                            value={filtros.data_retroativa}
                            onChange={(e) => handleFiltroChange('data_retroativa', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Depósito</InputLabel>
                            <Select
                                value={filtros.id_deposito}
                                onChange={(e) => handleFiltroChange('id_deposito', e.target.value)}
                                label="Depósito"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {Array.isArray(depositos) && depositos.map((dep) => (
                                    <MenuItem key={dep.id_deposito} value={dep.id_deposito}>
                                        {dep.nome_deposito}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Grupo de Produto</InputLabel>
                            <Select
                                value={filtros.id_grupo}
                                onChange={(e) => handleFiltroChange('id_grupo', e.target.value)}
                                label="Grupo de Produto"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {Array.isArray(grupos) && grupos.map((grupo) => (
                                    <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                                        {grupo.nome_grupo}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Tipo de Estoque</FormLabel>
                            <RadioGroup
                                row
                                value={filtros.filtro_estoque}
                                onChange={(e) => handleFiltroChange('filtro_estoque', e.target.value)}
                            >
                                <FormControlLabel value="todos" control={<Radio />} label="Todos" />
                                <FormControlLabel value="positivo" control={<Radio />} label="Positivo" />
                                <FormControlLabel value="negativo" control={<Radio />} label="Negativo" />
                                <FormControlLabel value="zerado" control={<Radio />} label="Zerado" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                        onClick={buscarRelatorio}
                        disabled={loading}
                    >
                        Buscar
                    </Button>

                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<FileDownload />}
                        onClick={exportarExcel}
                        disabled={loading || dados.length === 0}
                    >
                        Exportar Excel
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<PictureAsPdf />}
                        onClick={exportarPDF}
                        disabled={loading || dados.length === 0}
                    >
                        Exportar PDF
                    </Button>
                </Box>
            </Paper>

            {Array.isArray(filtrosAplicados) && filtrosAplicados.length > 0 && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Filtros Aplicados:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {filtrosAplicados.map((filtro, index) => (
                            <Chip key={index} label={filtro} size="small" />
                        ))}
                    </Box>
                </Paper>
            )}

            {totais && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total de Produtos
                                </Typography>
                                <Typography variant="h5">
                                    {totais.total_produtos}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Quantidade Total
                                </Typography>
                                <Typography variant="h5">
                                    {totais.total_quantidade?.toFixed(2)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: '#fff3cd' }}>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Valor Custo Médio
                                </Typography>
                                <Typography variant="h6">
                                    {formatarMoeda(totais.total_valor_custo_medio)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: '#d4edda' }}>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Valor de Venda
                                </Typography>
                                <Typography variant="h6">
                                    {formatarMoeda(totais.total_valor_venda)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Críticos
                                </Typography>
                                <Typography variant="h6" color="error">
                                    {totais.produtos_criticos}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Baixos
                                </Typography>
                                <Typography variant="h6" color="warning.main">
                                    {totais.produtos_baixos}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Normais
                                </Typography>
                                <Typography variant="h6" color="success.main">
                                    {totais.produtos_normais}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Excesso
                                </Typography>
                                <Typography variant="h6" color="info.main">
                                    {totais.produtos_excesso}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {dados.length > 0 && (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#1976d2' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Produto</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Grupo</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Depósito</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Quantidade</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Custo Médio</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Valor Custo</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Preço Venda</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Valor Venda</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Últ. Compra</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Valor Últ. Compra</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Classificação</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.isArray(dados) && dados.map((item, index) => (
                                <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' } }}>)
                                    <TableCell>{item.codigo}</TableCell>
                                    <TableCell>{item.nome}</TableCell>
                                    <TableCell>{item.grupo}</TableCell>
                                    <TableCell>{item.deposito}</TableCell>
                                    <TableCell align="right">{item.quantidade?.toFixed(2)}</TableCell>
                                    <TableCell align="right">{formatarMoeda(item.custo_medio_unitario)}</TableCell>
                                    <TableCell align="right">{formatarMoeda(item.valor_total_custo_medio)}</TableCell>
                                    <TableCell align="right">{formatarMoeda(item.preco_venda_unitario)}</TableCell>
                                    <TableCell align="right">{formatarMoeda(item.valor_total_venda)}</TableCell>
                                    <TableCell align="right">{formatarMoeda(item.valor_ultima_compra_unitario)}</TableCell>
                                    <TableCell align="right">{formatarMoeda(item.valor_total_ultima_compra)}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={item.classificacao}
                                            color={getClassificacaoColor(item.classificacao)}
                                            size="small"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {!loading && dados.length === 0 && (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="textSecondary">
                        Nenhum dado encontrado. Use os filtros acima e clique em "Buscar".
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default RelatorioInventarioPage;
