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
import { Search, FileDownload, PictureAsPdf, DirectionsCar } from '@mui/icons-material';

const RelatorioMDFePage = () => {
    const { axiosInstance } = useAuth();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [condutores, setCondutores] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    
    const [filtros, setFiltros] = useState({
        data_inicio: '',
        data_fim: '',
        numero_mdfe: '',
        chave_acesso: '',
        placa_veiculo: '',
        condutor: '',
        uf_origem: '',
        uf_destino: '',
        status: 'todos',
        tipo_emitente: 'todos'
    });

    const [dados, setDados] = useState([]);
    const [totais, setTotais] = useState(null);
    const [filtrosAplicados, setFiltrosAplicados] = useState([]);

    useEffect(() => {
        carregarDadosAuxiliares();
    }, []);

    const carregarDadosAuxiliares = async () => {
        try {
            // Carregar condutores
            const responseCondutores = await axiosInstance.get('/condutores/');
            const dataCondutores = responseCondutores.data;
            if (Array.isArray(dataCondutores)) {
                setCondutores(dataCondutores);
            } else if (dataCondutores && Array.isArray(dataCondutores.results)) {
                setCondutores(dataCondutores.results);
            } else {
                setCondutores([]);
            }

            // Carregar veículos
            const responseVeiculos = await axiosInstance.get('/veiculos/');
            const dataVeiculos = responseVeiculos.data;
            if (Array.isArray(dataVeiculos)) {
                setVeiculos(dataVeiculos);
            } else if (dataVeiculos && Array.isArray(dataVeiculos.results)) {
                setVeiculos(dataVeiculos.results);
            } else {
                setVeiculos([]);
            }
        } catch (error) {
            console.error('Erro ao carregar dados auxiliares:', error);
            setCondutores([]);
            setVeiculos([]);
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
            const response = await axiosInstance.post('/relatorios/gerar/', {
                tipo: 'mdfe',
                filtros: {
                    ...filtros,
                    formato: 'json'
                }
            });
            
            if (response.data) {
                setDados(response.data.mdfes || []);
                setTotais(response.data.totais || null);
                setFiltrosAplicados(response.data.filtros_aplicados || []);
                showToast('Relatório carregado com sucesso!', 'success');
            }
        } catch (error) {
            console.error('Erro ao buscar relatório:', error);
            showToast('Erro ao carregar relatório de MDF-e', 'error');
        } finally {
            setLoading(false);
        }
    };

    const exportarExcel = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.post('/relatorios/gerar/', {
                tipo: 'mdfe',
                filtros: {
                    ...filtros,
                    formato: 'excel'
                }
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `relatorio_mdfe_${new Date().toISOString().split('T')[0]}.xlsx`);
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
            const response = await axiosInstance.post('/relatorios/gerar/', {
                tipo: 'mdfe',
                filtros: {
                    ...filtros,
                    formato: 'pdf'
                }
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `relatorio_mdfe_${new Date().toISOString().split('T')[0]}.pdf`);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'AUTORIZADO':
                return 'success';
            case 'ENCERRADO':
                return 'info';
            case 'CANCELADO':
                return 'error';
            case 'PENDENTE':
                return 'warning';
            case 'REJEITADO':
                return 'error';
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

    const formatarPeso = (peso) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(peso) + ' kg';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <DirectionsCar sx={{ fontSize: 40, mr: 2, color: '#BF360C' }} />
                <Typography variant="h4" component="h1">
                    Relatório de MDF-e (Manifesto Eletrônico de Documentos Fiscais)
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
                            label="Data Início"
                            type="date"
                            value={filtros.data_inicio}
                            onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Data Fim"
                            type="date"
                            value={filtros.data_fim}
                            onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Número MDF-e"
                            value={filtros.numero_mdfe}
                            onChange={(e) => handleFiltroChange('numero_mdfe', e.target.value)}
                            placeholder="Número do MDF-e"
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Placa do Veículo"
                            value={filtros.placa_veiculo}
                            onChange={(e) => handleFiltroChange('placa_veiculo', e.target.value)}
                            placeholder="ABC-1234"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Chave de Acesso"
                            value={filtros.chave_acesso}
                            onChange={(e) => handleFiltroChange('chave_acesso', e.target.value)}
                            placeholder="44 dígitos da chave"
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Condutor</InputLabel>
                            <Select
                                value={filtros.condutor}
                                onChange={(e) => handleFiltroChange('condutor', e.target.value)}
                                label="Condutor"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {Array.isArray(condutores) && condutores.map((condutor) => (
                                    <MenuItem key={condutor.id} value={condutor.id}>
                                        {condutor.nome}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="UF Origem"
                            value={filtros.uf_origem}
                            onChange={(e) => handleFiltroChange('uf_origem', e.target.value)}
                            placeholder="SP"
                            inputProps={{ maxLength: 2 }}
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="UF Destino"
                            value={filtros.uf_destino}
                            onChange={(e) => handleFiltroChange('uf_destino', e.target.value)}
                            placeholder="RJ"
                            inputProps={{ maxLength: 2 }}
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Status</FormLabel>
                            <RadioGroup
                                row
                                value={filtros.status}
                                onChange={(e) => handleFiltroChange('status', e.target.value)}
                            >
                                <FormControlLabel value="todos" control={<Radio />} label="Todos" />
                                <FormControlLabel value="autorizado" control={<Radio />} label="Autorizado" />
                                <FormControlLabel value="encerrado" control={<Radio />} label="Encerrado" />
                                <FormControlLabel value="cancelado" control={<Radio />} label="Cancelado" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Tipo de Emitente</InputLabel>
                            <Select
                                value={filtros.tipo_emitente}
                                onChange={(e) => handleFiltroChange('tipo_emitente', e.target.value)}
                                label="Tipo de Emitente"
                            >
                                <MenuItem value="todos">Todos</MenuItem>
                                <MenuItem value="1">Prestador de Serviço de Transporte</MenuItem>
                                <MenuItem value="2">Transportador de Carga Própria</MenuItem>
                                <MenuItem value="3">Prestador de Serviço de Transporte que emitirá CT-e Globalizado</MenuItem>
                            </Select>
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
                                    Total de MDF-e
                                </Typography>
                                <Typography variant="h5">
                                    {totais.total_mdfes}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Peso Total Carga
                                </Typography>
                                <Typography variant="h5">
                                    {formatarPeso(totais.peso_total)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Documentos Vinculados
                                </Typography>
                                <Typography variant="h5">
                                    {totais.total_documentos}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Encerrados
                                </Typography>
                                <Typography variant="h5" color="info.main">
                                    {totais.total_encerrados}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Resultados
                </Typography>
                
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#BF360C' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Número</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data Emissão</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Placa Veículo</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Condutor</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Percurso</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Peso Bruto (kg)</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Docs</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.isArray(dados) && dados.map((item, index) => (
                                <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' } }}>
                                    <TableCell>{item.numero}</TableCell>
                                    <TableCell>{new Date(item.data_emissao).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell>{item.placa_veiculo}</TableCell>
                                    <TableCell>{item.condutor}</TableCell>
                                    <TableCell>{item.percurso}</TableCell>
                                    <TableCell align="right">{item.peso_bruto?.toFixed(2)}</TableCell>
                                    <TableCell align="center">{item.qtd_documentos}</TableCell>
                                    <TableCell align="center">
                                        <Chip 
                                            label={item.status} 
                                            color={getStatusColor(item.status)} 
                                            size="small"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!Array.isArray(dados) || dados.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <Typography variant="body2" color="textSecondary">
                                            Nenhum MDF-e encontrado com os filtros aplicados
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default RelatorioMDFePage;
