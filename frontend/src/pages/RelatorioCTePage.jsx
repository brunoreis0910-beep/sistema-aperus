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
    Chip,
    Switch,
    Tooltip,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Search, FileDownload, PictureAsPdf, LocalShipping, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const RelatorioCTePage = () => {
    const { axiosInstance } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [condutores, setCondutores] = useState([]);

    const hoje = new Date().toISOString().split('T')[0];
    const primeiroDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [filtros, setFiltros] = useState({
        data_inicio: primeiroDiaMes,
        data_fim: hoje,
        destinatario: '',
        remetente: '',
        numero_cte: '',
        chave_acesso: '',
        status: 'todos',
        tipo_servico: 'todos',
        condutor: '',
    });

    const [dados, setDados] = useState([]);
    const [totais, setTotais] = useState(null);
    const [filtrosAplicados, setFiltrosAplicados] = useState([]);
    const [buscou, setBuscou] = useState(false);
    const [incluirMotorista, setIncluirMotorista] = useState(false);
    const [incluirVeiculo, setIncluirVeiculo] = useState(false);

    useEffect(() => {
        carregarClientes();
        carregarCondutores();
    }, []);

    const carregarClientes = async () => {
        try {
            const res = await axiosInstance.get('/clientes/?page_size=500');
            const data = res.data;
            setClientes(Array.isArray(data) ? data : (data?.results || []));
        } catch {
            setClientes([]);
        }
    };

    const carregarCondutores = async () => {
        try {
            const res = await axiosInstance.get('/relatorios/cte/condutores/');
            setCondutores(Array.isArray(res.data) ? res.data : []);
        } catch {
            setCondutores([]);
        }
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
    };

    const buscarRelatorio = async () => {
        setLoading(true);
        setBuscou(true);
        try {
            const params = new URLSearchParams();
            if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
            if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
            if (filtros.destinatario) params.append('destinatario', filtros.destinatario);
            if (filtros.remetente) params.append('remetente', filtros.remetente);
            if (filtros.status !== 'todos') params.append('status', filtros.status);
            if (filtros.numero_cte) params.append('numero_cte', filtros.numero_cte);
            if (filtros.chave_acesso) params.append('chave_acesso', filtros.chave_acesso);
            if (filtros.tipo_servico !== 'todos') params.append('tipo_servico', filtros.tipo_servico);
            if (filtros.condutor) params.append('condutor', filtros.condutor);

            const response = await axiosInstance.get(`/relatorios/cte/dados/?${params.toString()}`);
            setDados(response.data.ctes || []);
            setTotais(response.data.totais || null);
            setFiltrosAplicados(response.data.filtros_aplicados || []);
            showToast(`${response.data.ctes?.length || 0} CT-e(s) encontrado(s)`, 'success');
        } catch (error) {
            console.error('Erro ao buscar CT-es:', error);
            showToast('Erro ao carregar relatório de CT-e', 'error');
        } finally {
            setLoading(false);
        }
    };

    const exportarPDF = async () => {
        if (!filtros.data_inicio || !filtros.data_fim) {
            showToast('Selecione o período para exportar o PDF', 'warning');
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams({
                data_inicio: filtros.data_inicio,
                data_fim: filtros.data_fim,
            });
            const response = await axiosInstance.get(`/relatorios/cte/pdf/?${params.toString()}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `relatorio_cte_${filtros.data_inicio}_${filtros.data_fim}.pdf`);
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

    const exportarExcel = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
            if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
            if (filtros.destinatario) params.append('destinatario', filtros.destinatario);
            if (filtros.remetente) params.append('remetente', filtros.remetente);
            if (filtros.status !== 'todos') params.append('status', filtros.status);
            if (filtros.numero_cte) params.append('numero_cte', filtros.numero_cte);
            if (filtros.chave_acesso) params.append('chave_acesso', filtros.chave_acesso);
            if (filtros.tipo_servico !== 'todos') params.append('tipo_servico', filtros.tipo_servico);
            if (filtros.condutor) params.append('condutor', filtros.condutor);

            const response = await axiosInstance.get(`/relatorios/cte/excel/?${params.toString()}`, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `relatorio_cte_${filtros.data_inicio}_${filtros.data_fim}.xlsx`);
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

    const getStatusColor = (s) => {
        switch ((s || '').toUpperCase()) {
            case 'AUTORIZADO': return 'success';
            case 'CANCELADO': return 'error';
            case 'PENDENTE': return 'warning';
            case 'REJEITADO': return 'error';
            case 'EMITIDO': return 'info';
            default: return 'default';
        }
    };

    const fmt = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

    return (
        <Box sx={{ p: 3 }}>
            {/* Cabeçalho */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate('/relatorios')} sx={{ mr: 1 }}>
                    Relatórios
                </Button>
                <LocalShipping sx={{ fontSize: 36, color: '#1565c0' }} />
                <Box>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                        Relatório de CT-e
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Conhecimento de Transporte Eletrônico
                    </Typography>
                </Box>
            </Box>

            {/* Filtros */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                    Filtros
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField fullWidth label="Data Início" type="date"
                            value={filtros.data_inicio}
                            onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
                            InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField fullWidth label="Data Fim" type="date"
                            value={filtros.data_fim}
                            onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
                            InputLabelProps={{ shrink: true }} />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Remetente</InputLabel>
                            <Select value={filtros.remetente}
                                onChange={(e) => handleFiltroChange('remetente', e.target.value)}
                                label="Remetente">
                                <MenuItem value="">Todos</MenuItem>
                                {clientes.map((c) => (
                                    <MenuItem key={c.id_cliente} value={c.id_cliente}>{c.nome_razao_social}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Destinatário</InputLabel>
                            <Select value={filtros.destinatario}
                                onChange={(e) => handleFiltroChange('destinatario', e.target.value)}
                                label="Destinatário">
                                <MenuItem value="">Todos</MenuItem>
                                {clientes.map((c) => (
                                    <MenuItem key={c.id_cliente} value={c.id_cliente}>{c.nome_razao_social}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                        <TextField fullWidth label="Nº CT-e"
                            value={filtros.numero_cte}
                            onChange={(e) => handleFiltroChange('numero_cte', e.target.value)}
                            placeholder="Ex: 123" />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <TextField fullWidth label="Chave de Acesso"
                            value={filtros.chave_acesso}
                            onChange={(e) => handleFiltroChange('chave_acesso', e.target.value)}
                            placeholder="44 dígitos (ou parte)" />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Tipo de Serviço</InputLabel>
                            <Select value={filtros.tipo_servico}
                                onChange={(e) => handleFiltroChange('tipo_servico', e.target.value)}
                                label="Tipo de Serviço">
                                <MenuItem value="todos">Todos</MenuItem>
                                <MenuItem value="0">Normal</MenuItem>
                                <MenuItem value="1">Subcontratação</MenuItem>
                                <MenuItem value="2">Redespacho</MenuItem>
                                <MenuItem value="3">Redespacho Intermediário</MenuItem>
                                <MenuItem value="4">Multimodal</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Condutor</InputLabel>
                            <Select value={filtros.condutor}
                                onChange={(e) => handleFiltroChange('condutor', e.target.value)}
                                label="Condutor">
                                <MenuItem value="">Todos</MenuItem>
                                {condutores.map((c) => (
                                    <MenuItem key={c.nome} value={c.nome}>
                                        {c.nome}{c.cpf ? ` — ${c.cpf}` : ''}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Status</FormLabel>
                            <RadioGroup row value={filtros.status}
                                onChange={(e) => handleFiltroChange('status', e.target.value)}>
                                <FormControlLabel value="todos" control={<Radio size="small" />} label="Todos" />
                                <FormControlLabel value="AUTORIZADO" control={<Radio size="small" />} label="Autorizado" />
                                <FormControlLabel value="PENDENTE" control={<Radio size="small" />} label="Pendente" />
                                <FormControlLabel value="CANCELADO" control={<Radio size="small" />} label="Cancelado" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Dados adicionais na tabela</FormLabel>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControlLabel
                                    control={<Switch size="small" checked={incluirMotorista}
                                        onChange={(e) => setIncluirMotorista(e.target.checked)} />}
                                    label="Dados do motorista" />
                                <FormControlLabel
                                    control={<Switch size="small" checked={incluirVeiculo}
                                        onChange={(e) => setIncluirVeiculo(e.target.checked)} />}
                                    label="Dados do veículo" />
                            </Box>
                        </FormControl>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button variant="contained" color="primary"
                        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Search />}
                        onClick={buscarRelatorio} disabled={loading}>
                        Buscar
                    </Button>
                    <Button variant="contained" color="error"
                        startIcon={<PictureAsPdf />}
                        onClick={exportarPDF} disabled={loading || !filtros.data_inicio}>
                        Exportar PDF
                    </Button>
                    <Button variant="contained" color="success"
                        startIcon={<FileDownload />}
                        onClick={exportarExcel} disabled={loading || dados.length === 0}>
                        Exportar Excel
                    </Button>
                </Box>
            </Paper>

            {/* Tags de filtros aplicados */}
            {filtrosAplicados.length > 0 && (
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {filtrosAplicados.map((f, i) => (
                        <Chip key={i} label={f} size="small" color="primary" variant="outlined" />
                    ))}
                </Box>
            )}

            {/* Cards de totais */}
            {totais && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        { label: 'Total de CT-e', valor: totais.quantidade, tipo: 'numero' },
                        { label: 'Valor Total', valor: totais.valor_total, tipo: 'moeda' },
                        { label: 'Autorizados', valor: totais.autorizados, tipo: 'numero', cor: 'success.main' },
                        { label: 'Cancelados', valor: totais.cancelados, tipo: 'numero', cor: 'error.main' },
                    ].map((item) => (
                        <Grid item xs={6} md={3} key={item.label}>
                            <Card variant="outlined">
                                <CardContent sx={{ pb: '12px !important' }}>
                                    <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                    <Typography variant="h5" fontWeight="bold" color={item.cor || 'text.primary'}>
                                        {item.tipo === 'moeda' ? fmt(item.valor) : item.valor}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Tabela */}
            {dados.length > 0 ? (
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 560 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Nº CT-e</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Data Emissão</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Remetente</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Destinatário</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Origem → Destino</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Placa</TableCell>
                                    {incluirVeiculo && <TableCell sx={{ fontWeight: 'bold' }}>UF Veíc.</TableCell>}
                                    {incluirVeiculo && <TableCell sx={{ fontWeight: 'bold' }}>RENAVAM</TableCell>}
                                    <TableCell sx={{ fontWeight: 'bold' }}>Condutor</TableCell>
                                    {incluirMotorista && <TableCell sx={{ fontWeight: 'bold' }}>CPF Condutor</TableCell>}
                                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Valor</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Tipo Serviço</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dados.map((row) => (
                                    <TableRow hover key={row.id}>
                                        <TableCell>{row.numero || '-'}</TableCell>
                                        <TableCell>{row.data_emissao || '-'}</TableCell>
                                        <TableCell>{row.remetente || '-'}</TableCell>
                                        <TableCell>{row.destinatario || '-'}</TableCell>
                                        <TableCell>
                                            <Tooltip title={`${row.origem || ''} → ${row.destino || ''}`}>
                                                <span>{row.origem || '-'} → {row.destino || '-'}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>{row.placa || '-'}</TableCell>
                                        {incluirVeiculo && <TableCell>{row.veiculo_uf || '-'}</TableCell>}
                                        {incluirVeiculo && <TableCell>{row.veiculo_renavam || '-'}</TableCell>}
                                        <TableCell>{row.condutor || '-'}</TableCell>
                                        {incluirMotorista && <TableCell>{row.condutor_cpf || '-'}</TableCell>}
                                        <TableCell align="right">{fmt(row.valor_total)}</TableCell>
                                        <TableCell>{row.tipo_servico}</TableCell>
                                        <TableCell>
                                            <Chip label={row.status} color={getStatusColor(row.status)} size="small" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            ) : buscou && !loading ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">Nenhum CT-e encontrado com os filtros selecionados.</Typography>
                </Paper>
            ) : null}
        </Box>
    );
};

export default RelatorioCTePage;
