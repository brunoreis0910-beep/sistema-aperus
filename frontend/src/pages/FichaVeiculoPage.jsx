import React, { useState, useCallback } from 'react';
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
    CircularProgress,
    Alert,
    Chip,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Search as SearchIcon,
    Print as PrintIcon,
    DirectionsCar as CarIcon,
    ExpandMore as ExpandMoreIcon,
    Build as BuildIcon,
    Inventory2 as PartsIcon,
    MiscellaneousServices as ServicesIcon,
    Person as PersonIcon,
    CalendarToday as CalIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
    'Aberta': 'primary',
    'Em Andamento': 'warning',
    'Aguardando Peça': 'default',
    'Finalizada': 'success',
    'Cancelada': 'error',
};

const fmtMoeda = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtData = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR');
};

export default function FichaVeiculoPage() {
    const { axiosInstance } = useAuth();
    const [busca, setBusca] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingOS, setLoadingOS] = useState(false);
    const [veiculosEncontrados, setVeiculosEncontrados] = useState([]);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
    const [ordens, setOrdens] = useState([]);
    const [erro, setErro] = useState('');

    const buscarVeiculos = useCallback(async () => {
        const q = busca.trim();
        if (!q) return;
        setLoading(true);
        setErro('');
        setVeiculosEncontrados([]);
        setVeiculoSelecionado(null);
        setOrdens([]);
        try {
            const resp = await axiosInstance.get('veiculos/', { params: { search: q } });
            const lista = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
            if (lista.length === 0) {
                setErro('Nenhum veículo encontrado para esta busca.');
            } else if (lista.length === 1) {
                setVeiculosEncontrados(lista);
                selecionarVeiculo(lista[0]);
            } else {
                setVeiculosEncontrados(lista);
            }
        } catch {
            setErro('Erro ao buscar veículos. Verifique a conexão.');
        } finally {
            setLoading(false);
        }
    }, [busca, axiosInstance]);

    const selecionarVeiculo = useCallback(async (veiculo) => {
        setVeiculoSelecionado(veiculo);
        setLoadingOS(true);
        setOrdens([]);
        setErro('');
        try {
            const resp = await axiosInstance.get('ordem-servico/', {
                params: { id_veiculo: veiculo.id_veiculo, page_size: 1000 },
            });
            const lista = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
            setOrdens(lista);
        } catch {
            setErro('Erro ao buscar histórico de manutenções.');
        } finally {
            setLoadingOS(false);
        }
    }, [axiosInstance]);

    const handlePrint = () => window.print();

    const totalGeral = ordens.reduce(
        (acc, os) => acc + Number(os.valor_total_os || 0),
        0
    );

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3,
                    gap: 2,
                    flexWrap: 'wrap',
                }}
            >
                <CarIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={700}>
                        Ficha do Veículo
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Histórico completo de manutenções e serviços
                    </Typography>
                </Box>
                {veiculoSelecionado && (
                    <Tooltip title="Imprimir ficha">
                        <IconButton onClick={handlePrint} color="primary">
                            <PrintIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* Busca */}
            <Paper sx={{ p: 2, mb: 3 }} className="no-print">
                <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
                    Buscar veículo por placa, modelo ou marca
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <TextField
                        label="Placa / Modelo / Marca"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && buscarVeiculos()}
                        size="small"
                        sx={{ minWidth: 260 }}
                        autoFocus
                    />
                    <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
                        onClick={buscarVeiculos}
                        disabled={loading || !busca.trim()}
                    >
                        Buscar
                    </Button>
                </Box>
            </Paper>

            {erro && (
                <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setErro('')}>
                    {erro}
                </Alert>
            )}

            {/* Lista de veículos quando mais de um resultado */}
            {veiculosEncontrados.length > 1 && !veiculoSelecionado && (
                <Paper sx={{ mb: 3 }} className="no-print">
                    <Typography variant="subtitle1" fontWeight={600} sx={{ p: 2, pb: 1 }}>
                        Veículos encontrados — selecione um:
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell>Placa</TableCell>
                                    <TableCell>Marca</TableCell>
                                    <TableCell>Modelo</TableCell>
                                    <TableCell>Ano</TableCell>
                                    <TableCell>Cor</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {veiculosEncontrados.map((v) => (
                                    <TableRow
                                        key={v.id_veiculo}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => selecionarVeiculo(v)}
                                    >
                                        <TableCell>
                                            <Chip
                                                label={v.placa}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{v.marca || '—'}</TableCell>
                                        <TableCell>{v.modelo || '—'}</TableCell>
                                        <TableCell>{v.ano || '—'}</TableCell>
                                        <TableCell>{v.cor || '—'}</TableCell>
                                        <TableCell>
                                            <Button size="small" variant="outlined">
                                                Ver ficha
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Ficha do veículo selecionado */}
            {veiculoSelecionado && (
                <>
                    {/* Card de dados do veículo */}
                    <Card sx={{ mb: 3, borderLeft: '5px solid', borderLeftColor: 'primary.main' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CarIcon color="primary" />
                                {veiculoSelecionado.placa}
                                {veiculoSelecionado.marca && ` — ${veiculoSelecionado.marca}`}
                                {veiculoSelecionado.modelo && ` ${veiculoSelecionado.modelo}`}
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6} sm={4} md={2}>
                                    <Typography variant="caption" color="text.secondary">Placa</Typography>
                                    <Typography fontWeight={600}>{veiculoSelecionado.placa}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={4} md={2}>
                                    <Typography variant="caption" color="text.secondary">Marca</Typography>
                                    <Typography>{veiculoSelecionado.marca || '—'}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={4} md={2}>
                                    <Typography variant="caption" color="text.secondary">Modelo</Typography>
                                    <Typography>{veiculoSelecionado.modelo || '—'}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={4} md={2}>
                                    <Typography variant="caption" color="text.secondary">Ano</Typography>
                                    <Typography>{veiculoSelecionado.ano || '—'}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={4} md={2}>
                                    <Typography variant="caption" color="text.secondary">Cor</Typography>
                                    <Typography>{veiculoSelecionado.cor || '—'}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={4} md={2}>
                                    <Typography variant="caption" color="text.secondary">UF</Typography>
                                    <Typography>{veiculoSelecionado.uf || '—'}</Typography>
                                </Grid>
                                {veiculoSelecionado.chassi && (
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Chassi</Typography>
                                        <Typography>{veiculoSelecionado.chassi}</Typography>
                                    </Grid>
                                )}
                                {veiculoSelecionado.observacoes && (
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.secondary">Observações</Typography>
                                        <Typography>{veiculoSelecionado.observacoes}</Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Resumo */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="h4" fontWeight={700} color="primary.main">
                                    {ordens.length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Ordens de Serviço
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="h6" fontWeight={700} color="success.main">
                                    {fmtMoeda(totalGeral)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Total Investido
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="h4" fontWeight={700} color="warning.main">
                                    {ordens.filter((o) => o.status_os === 'Finalizada').length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Finalizadas
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="h4" fontWeight={700} color="info.main">
                                    {ordens.filter((o) => ['Aberta', 'Em Andamento', 'Aguardando Peça'].includes(o.status_os)).length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Em Aberto
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Histórico de OS */}
                    <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BuildIcon color="action" />
                        Histórico de Manutenções
                    </Typography>

                    {loadingOS ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : ordens.length === 0 ? (
                        <Alert severity="info">
                            Nenhuma ordem de serviço encontrada para este veículo.
                        </Alert>
                    ) : (
                        ordens.map((os, idx) => (
                            <Accordion key={os.id_os} defaultExpanded={idx === 0} sx={{ mb: 1 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            flexWrap: 'wrap',
                                            width: '100%',
                                            pr: 1,
                                        }}
                                    >
                                        <Typography fontWeight={700} sx={{ minWidth: 60 }}>
                                            OS #{os.id_os}
                                        </Typography>
                                        <Chip
                                            label={os.status_os || 'Aberta'}
                                            color={STATUS_COLORS[os.status_os] || 'default'}
                                            size="small"
                                        />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CalIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {fmtData(os.data_abertura)}
                                            </Typography>
                                        </Box>
                                        {os.tecnico_nome && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {os.tecnico_nome}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            color="success.main"
                                            sx={{ ml: 'auto' }}
                                        >
                                            {fmtMoeda(os.valor_total_os)}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0 }}>
                                    <Divider sx={{ mb: 2 }} />

                                    {/* Problema / Laudo */}
                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                        {os.descricao_problema && (
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Problema relatado
                                                </Typography>
                                                <Typography variant="body2">{os.descricao_problema}</Typography>
                                            </Grid>
                                        )}
                                        {os.laudo_tecnico && (
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Laudo técnico
                                                </Typography>
                                                <Typography variant="body2">{os.laudo_tecnico}</Typography>
                                            </Grid>
                                        )}
                                        {os.data_finalizacao && (
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Data de finalização
                                                </Typography>
                                                <Typography variant="body2">{fmtData(os.data_finalizacao)}</Typography>
                                            </Grid>
                                        )}
                                    </Grid>

                                    {/* Peças utilizadas */}
                                    {os.itens_produtos && os.itens_produtos.length > 0 && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography
                                                variant="subtitle2"
                                                fontWeight={700}
                                                mb={1}
                                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                            >
                                                <PartsIcon fontSize="small" color="action" />
                                                Peças / Produtos
                                            </Typography>
                                            <TableContainer component={Paper} variant="outlined">
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                            <TableCell>Produto</TableCell>
                                                            <TableCell align="center">Qtd</TableCell>
                                                            <TableCell align="right">Valor Unit.</TableCell>
                                                            <TableCell align="right">Total</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {os.itens_produtos.map((item) => (
                                                            <TableRow key={item.id_os_item_produto}>
                                                                <TableCell>{item.produto_nome || `Produto #${item.id_produto}`}</TableCell>
                                                                <TableCell align="center">
                                                                    {Number(item.quantidade).toLocaleString('pt-BR')}
                                                                </TableCell>
                                                                <TableCell align="right">{fmtMoeda(item.valor_unitario)}</TableCell>
                                                                <TableCell align="right">{fmtMoeda(item.valor_total)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    )}

                                    {/* Serviços realizados */}
                                    {os.itens_servicos && os.itens_servicos.length > 0 && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography
                                                variant="subtitle2"
                                                fontWeight={700}
                                                mb={1}
                                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                            >
                                                <ServicesIcon fontSize="small" color="action" />
                                                Serviços realizados
                                            </Typography>
                                            <TableContainer component={Paper} variant="outlined">
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                            <TableCell>Serviço</TableCell>
                                                            <TableCell>Técnico</TableCell>
                                                            <TableCell align="center">Qtd</TableCell>
                                                            <TableCell align="right">Valor Unit.</TableCell>
                                                            <TableCell align="right">Total</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {os.itens_servicos.map((item) => (
                                                            <TableRow key={item.id_os_item_servico}>
                                                                <TableCell>{item.descricao_servico}</TableCell>
                                                                <TableCell>{item.tecnico_nome || '—'}</TableCell>
                                                                <TableCell align="center">
                                                                    {Number(item.quantidade).toLocaleString('pt-BR')}
                                                                </TableCell>
                                                                <TableCell align="right">{fmtMoeda(item.valor_unitario)}</TableCell>
                                                                <TableCell align="right">{fmtMoeda(item.valor_total)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    )}

                                    {/* Totais da OS */}
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3, flexWrap: 'wrap' }}>
                                        {Number(os.valor_total_produtos) > 0 && (
                                            <Typography variant="body2" color="text.secondary">
                                                Peças: <strong>{fmtMoeda(os.valor_total_produtos)}</strong>
                                            </Typography>
                                        )}
                                        {Number(os.valor_total_servicos) > 0 && (
                                            <Typography variant="body2" color="text.secondary">
                                                Serviços: <strong>{fmtMoeda(os.valor_total_servicos)}</strong>
                                            </Typography>
                                        )}
                                        {Number(os.valor_desconto) > 0 && (
                                            <Typography variant="body2" color="error.main">
                                                Desconto: <strong>-{fmtMoeda(os.valor_desconto)}</strong>
                                            </Typography>
                                        )}
                                        <Typography variant="body2" fontWeight={700}>
                                            Total: {fmtMoeda(os.valor_total_os)}
                                        </Typography>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))
                    )}

                    {/* Total geral */}
                    {ordens.length > 0 && (
                        <Paper
                            sx={{
                                mt: 3,
                                p: 2,
                                display: 'flex',
                                justifyContent: 'flex-end',
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                            }}
                        >
                            <Typography variant="h6" fontWeight={700}>
                                Total geral investido: {fmtMoeda(totalGeral)}
                            </Typography>
                        </Paper>
                    )}
                </>
            )}

            {/* Estilos de impressão */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; }
                }
            `}</style>
        </Box>
    );
}
