import React, { useState, useCallback } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Grid, Card, CardContent,
    CircularProgress, Alert, Chip, Divider, Tabs, Tab, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip,
    Autocomplete,
} from '@mui/material';
import {
    Search as SearchIcon,
    Print as PrintIcon,
    Person as PersonIcon,
    ShoppingCart as VendasIcon,
    Build as OSIcon,
    Receipt as NFeIcon,
    LocalShipping as CTeIcon,
    AccountBalance as FinanceiroIcon,
    Star as CreditoIcon,
    PointOfSale as CupomIcon,
    Inventory as ProdutoIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const fmtMoeda = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtData = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
};

const STATUS_VENDA = {
    'Autorizada': 'success',
    'Pendente': 'warning',
    'Cancelada': 'error',
    'Em digitação': 'default',
};

const STATUS_OS = {
    'Aberta': 'primary',
    'Em Andamento': 'warning',
    'Aguardando Peça': 'default',
    'Finalizada': 'success',
    'Cancelada': 'error',
};

const STATUS_CONTA = {
    'Aberta': 'warning',
    'Paga': 'success',
    'Vencida': 'error',
    'Cancelada': 'default',
};

function TabPanel({ children, value, index }) {
    return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

function ResumoCard({ titulo, valor, cor, icone }) {
    return (
        <Paper sx={{ p: 2, textAlign: 'center', borderTop: `4px solid`, borderTopColor: cor || 'primary.main' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>{icone}</Box>
            <Typography variant="h6" fontWeight={700} color={cor || 'primary.main'}>{valor}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">{titulo}</Typography>
        </Paper>
    );
}

export default function FichaClientePage() {
    const { axiosInstance } = useAuth();

    const [clientes, setClientes] = useState([]);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [buscandoClientes, setBuscandoClientes] = useState(false);

    const [tabAtiva, setTabAtiva] = useState(0);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');

    const [vendas, setVendas] = useState([]);
    const [nfes, setNfes] = useState([]);
    const [nfces, setNfces] = useState([]);
    const [ordens, setOrdens] = useState([]);
    const [contasReceber, setContasReceber] = useState([]);
    const [contasPagas, setContasPagas] = useState([]);
    const [ctes, setCtes] = useState([]);
    const [creditos, setCreditos] = useState([]);
    const [produtos, setProdutos] = useState([]);

    const buscarClientes = useCallback(async (busca) => {
        if (!busca || busca.length < 2) return;
        setBuscandoClientes(true);
        try {
            const resp = await axiosInstance.get('clientes/', { params: { search: busca, page_size: 30 } });
            const lista = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
            setClientes(lista);
        } catch {
            setClientes([]);
        } finally {
            setBuscandoClientes(false);
        }
    }, [axiosInstance]);

    const carregarFicha = useCallback(async (cliente) => {
        if (!cliente) return;
        setClienteSelecionado(cliente);
        setCarregando(true);
        setErro('');
        setVendas([]); setNfes([]); setNfces([]); setOrdens([]); setContasReceber([]);
        setContasPagas([]); setCtes([]); setCreditos([]); setProdutos([]);

        const id = cliente.id_cliente;
        const safe = async (fn) => { try { return await fn(); } catch { return null; } };

        const [vendasRes, nfeRes, nfceRes, ordensRes, contasAberRes, contasPagRes, ctesRes, credRes, prodRes] = await Promise.all([
            safe(() => axiosInstance.get('vendas/', { params: { id_cliente: id, page_size: 300 } })),
            safe(() => axiosInstance.get('vendas/', { params: { id_cliente: id, modelo: '55', page_size: 300 } })),
            safe(() => axiosInstance.get('vendas/', { params: { id_cliente: id, modelo: '65', page_size: 300 } })),
            safe(() => axiosInstance.get('ordem-servico/', { params: { cliente: id, page_size: 200 } })),
            safe(() => axiosInstance.get('contas/', { params: { id_cliente_fornecedor: id, tipo_conta: 'Receber', status_conta: 'Aberta', page_size: 200 } })),
            safe(() => axiosInstance.get('contas/', { params: { id_cliente_fornecedor: id, tipo_conta: 'Receber', status_conta: 'Paga', page_size: 200 } })),
            safe(() => axiosInstance.get('ctes/', { params: { id_cliente: id, page_size: 100 } })),
            safe(() => axiosInstance.get('creditos/', { params: { id_cliente: id, page_size: 100 } })),
            safe(() => axiosInstance.get(`clientes/${id}/produtos/`, { params: { page_size: 500 } })),
        ]);

        const arr = (r) => {
            if (!r || !r.data) return [];
            if (Array.isArray(r.data)) return r.data;
            return r.data.results || r.data.vendas || [];
        };
        setVendas(arr(vendasRes));
        setNfes(arr(nfeRes));
        setNfces(arr(nfceRes));
        setOrdens(arr(ordensRes));
        setContasReceber(arr(contasAberRes));
        setContasPagas(arr(contasPagRes));
        setCtes(arr(ctesRes));
        setCreditos(arr(credRes));
        setProdutos(arr(prodRes));
        setCarregando(false);
    }, [axiosInstance]);

    // --- Totalizadores ---
    const totalVendas = vendas.reduce((a, v) => a + Number(v.valor_total || 0), 0);
    const totalNfes = nfes.reduce((a, v) => a + Number(v.valor_total || 0), 0);
    const totalNfces = nfces.reduce((a, v) => a + Number(v.valor_total || 0), 0);
    const totalOS = ordens.reduce((a, o) => a + Number(o.valor_total_os || 0), 0);
    const totalAReceber = contasReceber.reduce((a, c) => a + Number(c.valor_parcela || 0), 0);
    const totalRecebido = contasPagas.reduce((a, c) => a + Number(c.valor_liquidado || c.valor_parcela || 0), 0);
    const saldoCredito = creditos.reduce((a, c) => a + Number(c.saldo || 0), 0);
    const totalProdutos = produtos.reduce((a, p) => a + Number(p.valor_total || 0), 0);

    const tabs = [
        { label: `Vendas (${vendas.length})`, icon: <VendasIcon fontSize="small" /> },
        { label: `NF-e 55 (${nfes.length})`, icon: <NFeIcon fontSize="small" /> },
        { label: `NFC-e 65 (${nfces.length})`, icon: <CupomIcon fontSize="small" /> },
        { label: `Ordens de Serviço (${ordens.length})`, icon: <OSIcon fontSize="small" /> },
        { label: `A Receber (${contasReceber.length})`, icon: <FinanceiroIcon fontSize="small" /> },
        { label: `Recebidos (${contasPagas.length})`, icon: <FinanceiroIcon fontSize="small" /> },
        { label: `CT-e (${ctes.length})`, icon: <CTeIcon fontSize="small" /> },
        { label: `Produtos (${produtos.length})`, icon: <ProdutoIcon fontSize="small" /> },
        { label: `Créditos (${creditos.length})`, icon: <CreditoIcon fontSize="small" /> },
    ];

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <PersonIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={700}>Ficha do Cliente</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Histórico completo de movimentações
                    </Typography>
                </Box>
                {clienteSelecionado && (
                    <Tooltip title="Imprimir ficha">
                        <IconButton onClick={() => window.print()} color="primary">
                            <PrintIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* Busca */}
            <Paper sx={{ p: 2, mb: 3 }} className="no-print">
                <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
                    Buscar cliente por nome, CPF/CNPJ ou telefone
                </Typography>
                <Autocomplete
                    options={clientes}
                    getOptionLabel={(c) => `${c.nome_razao_social || ''} ${c.cpf_cnpj ? `— ${c.cpf_cnpj}` : ''}`}
                    loading={buscandoClientes}
                    onInputChange={(_, v) => buscarClientes(v)}
                    onChange={(_, v) => v && carregarFicha(v)}
                    filterOptions={(x) => x}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Nome / CPF / CNPJ / Telefone"
                            size="small"
                            autoFocus
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {buscandoClientes ? <CircularProgress size={18} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    sx={{ maxWidth: 500 }}
                />
            </Paper>

            {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>{erro}</Alert>}

            {carregando && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2, alignSelf: 'center' }}>Carregando ficha do cliente...</Typography>
                </Box>
            )}

            {clienteSelecionado && !carregando && (
                <>
                    {/* Card do cliente */}
                    <Card sx={{ mb: 3, borderLeft: '5px solid', borderLeftColor: 'primary.main' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon color="primary" />
                                {clienteSelecionado.nome_razao_social}
                            </Typography>
                            <Grid container spacing={2}>
                                {clienteSelecionado.cpf_cnpj && (
                                    <Grid item xs={6} sm={4} md={3}>
                                        <Typography variant="caption" color="text.secondary">CPF/CNPJ</Typography>
                                        <Typography fontWeight={600}>{clienteSelecionado.cpf_cnpj}</Typography>
                                    </Grid>
                                )}
                                {clienteSelecionado.telefone && (
                                    <Grid item xs={6} sm={4} md={3}>
                                        <Typography variant="caption" color="text.secondary">Telefone</Typography>
                                        <Typography>{clienteSelecionado.telefone}</Typography>
                                    </Grid>
                                )}
                                {clienteSelecionado.email && (
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="text.secondary">E-mail</Typography>
                                        <Typography>{clienteSelecionado.email}</Typography>
                                    </Grid>
                                )}
                                {clienteSelecionado.cidade && (
                                    <Grid item xs={6} sm={4} md={3}>
                                        <Typography variant="caption" color="text.secondary">Cidade/UF</Typography>
                                        <Typography>{clienteSelecionado.cidade}{clienteSelecionado.estado ? ` — ${clienteSelecionado.estado}` : ''}</Typography>
                                    </Grid>
                                )}
                                {clienteSelecionado.endereco && (
                                    <Grid item xs={12} sm={8}>
                                        <Typography variant="caption" color="text.secondary">Endereço</Typography>
                                        <Typography>
                                            {[clienteSelecionado.endereco, clienteSelecionado.numero, clienteSelecionado.bairro].filter(Boolean).join(', ')}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Resumo numérico */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={4} lg={2}>
                            <ResumoCard titulo="Total Vendas" valor={fmtMoeda(totalVendas)} cor="#1976d2" icone={<VendasIcon sx={{ color: '#1976d2' }} />} />
                        </Grid>
                        <Grid item xs={6} sm={4} lg={2}>
                            <ResumoCard titulo="NF-e Emitidas" valor={nfes.length} cor="#0288d1" icone={<NFeIcon sx={{ color: '#0288d1' }} />} />
                        </Grid>
                        <Grid item xs={6} sm={4} lg={2}>
                            <ResumoCard titulo="NFC-e (Cupons)" valor={nfces.length} cor="#7b1fa2" icone={<CupomIcon sx={{ color: '#7b1fa2' }} />} />
                        </Grid>
                        <Grid item xs={6} sm={4} lg={2}>
                            <ResumoCard titulo="Total OS" valor={fmtMoeda(totalOS)} cor="#ed6c02" icone={<OSIcon sx={{ color: '#ed6c02' }} />} />
                        </Grid>
                        <Grid item xs={6} sm={4} lg={2}>
                            <ResumoCard titulo="A Receber" valor={fmtMoeda(totalAReceber)} cor="#d32f2f" icone={<FinanceiroIcon sx={{ color: '#d32f2f' }} />} />
                        </Grid>
                        <Grid item xs={6} sm={4} lg={2}>
                            <ResumoCard titulo="Já Recebido" valor={fmtMoeda(totalRecebido)} cor="#2e7d32" icone={<FinanceiroIcon sx={{ color: '#2e7d32' }} />} />
                        </Grid>
                        <Grid item xs={6} sm={4} lg={2}>
                            <ResumoCard titulo="CT-e Emitidos" valor={ctes.length} cor="#1565c0" icone={<CTeIcon sx={{ color: '#1565c0' }} />} />
                        </Grid>
                        <Grid item xs={6} sm={4} lg={2}>
                            <ResumoCard titulo="Itens Comprados" valor={produtos.length} cor="#558b2f" icone={<ProdutoIcon sx={{ color: '#558b2f' }} />} />
                        </Grid>
                        <Grid item xs={6} sm={4} lg={2}>
                            <ResumoCard titulo="Saldo Crédito" valor={fmtMoeda(saldoCredito)} cor="#9c27b0" icone={<CreditoIcon sx={{ color: '#9c27b0' }} />} />
                        </Grid>
                    </Grid>

                    {/* Abas de movimentação */}
                    <Paper sx={{ mb: 3 }}>
                        <Tabs
                            value={tabAtiva}
                            onChange={(_, v) => setTabAtiva(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                            {tabs.map((t, i) => (
                                <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />
                            ))}
                        </Tabs>

                        <Box sx={{ p: 2 }}>

                            {/* VENDAS */}
                            <TabPanel value={tabAtiva} index={0}>
                                {vendas.length === 0 ? (
                                    <Alert severity="info">Nenhuma venda encontrada para este cliente.</Alert>
                                ) : (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                    <TableCell>#</TableCell>
                                                    <TableCell>Data</TableCell>
                                                    <TableCell>Documento</TableCell>
                                                    <TableCell>Operação</TableCell>
                                                    <TableCell>NF-e/NFC-e</TableCell>
                                                    <TableCell align="right">Total</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {vendas.map((v) => (
                                                    <TableRow key={v.id_venda} hover>
                                                        <TableCell>{v.id_venda}</TableCell>
                                                        <TableCell>{fmtData(v.data_emissao || v.data_venda)}</TableCell>
                                                        <TableCell>{v.numero_documento || '—'}</TableCell>
                                                        <TableCell>{v.nome_operacao || v.id_operacao || '—'}</TableCell>
                                                        <TableCell>
                                                            {v.numero_nfe ? (
                                                                <Chip label={`NF-e ${v.numero_nfe}`} size="small" color="info" variant="outlined" />
                                                            ) : v.numero_nfce ? (
                                                                <Chip label={`NFC-e ${v.numero_nfce}`} size="small" color="secondary" variant="outlined" />
                                                            ) : '—'}
                                                        </TableCell>
                                                        <TableCell align="right">{fmtMoeda(v.valor_total)}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={v.status_nfe || v.status_nfce || 'Digitação'}
                                                                size="small"
                                                                color={STATUS_VENDA[v.status_nfe || v.status_nfce] || 'default'}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                                {vendas.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Typography variant="body2" fontWeight={700}>
                                            Total: {fmtMoeda(totalVendas)}
                                        </Typography>
                                    </Box>
                                )}
                            </TabPanel>

                            {/* NF-e 55 */}
                            <TabPanel value={tabAtiva} index={1}>
                                {nfes.length === 0 ? (
                                    <Alert severity="info">Nenhuma NF-e (modelo 55) encontrada para este cliente.</Alert>
                                ) : (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                    <TableCell>#</TableCell>
                                                    <TableCell>Data</TableCell>
                                                    <TableCell>Nº NF-e</TableCell>
                                                    <TableCell>Série</TableCell>
                                                    <TableCell>Operação</TableCell>
                                                    <TableCell align="right">Total</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {nfes.map((v) => (
                                                    <TableRow key={v.id_venda || v.id} hover>
                                                        <TableCell>{v.id_venda || v.id}</TableCell>
                                                        <TableCell>{fmtData(v.data_emissao || v.data_venda || v.data)}</TableCell>
                                                        <TableCell>{v.numero_nfe || '—'}</TableCell>
                                                        <TableCell>{v.serie_nfe || '1'}</TableCell>
                                                        <TableCell>{v.nome_operacao || v.operacao || '—'}</TableCell>
                                                        <TableCell align="right">{fmtMoeda(v.valor_total)}</TableCell>
                                                        <TableCell>
                                                            <Chip label={v.status_nfe || v.status || 'Digitação'} size="small" color={STATUS_VENDA[v.status_nfe || v.status] || 'default'} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                                {nfes.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Typography variant="body2" fontWeight={700}>
                                            Total: {fmtMoeda(totalNfes)}
                                        </Typography>
                                    </Box>
                                )}
                            </TabPanel>

                            {/* NFC-e 65 (Cupons) */}
                            <TabPanel value={tabAtiva} index={2}>
                                {nfces.length === 0 ? (
                                    <Alert severity="info">Nenhum cupom NFC-e (modelo 65) encontrado para este cliente.</Alert>
                                ) : (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                    <TableCell>#</TableCell>
                                                    <TableCell>Data</TableCell>
                                                    <TableCell>Nº NFC-e</TableCell>
                                                    <TableCell>Série</TableCell>
                                                    <TableCell>Operação</TableCell>
                                                    <TableCell align="right">Total</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {nfces.map((v) => (
                                                    <TableRow key={v.id_venda || v.id} hover>
                                                        <TableCell>{v.id_venda || v.id}</TableCell>
                                                        <TableCell>{fmtData(v.data_emissao || v.data_venda || v.data)}</TableCell>
                                                        <TableCell>{v.numero_nfe || '—'}</TableCell>
                                                        <TableCell>{v.serie_nfe || '1'}</TableCell>
                                                        <TableCell>{v.nome_operacao || v.operacao || '—'}</TableCell>
                                                        <TableCell align="right">{fmtMoeda(v.valor_total)}</TableCell>
                                                        <TableCell>
                                                            <Chip label={v.status_nfe || v.status || 'Digitação'} size="small" color={STATUS_VENDA[v.status_nfe || v.status] || 'default'} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                                {nfces.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Typography variant="body2" fontWeight={700}>
                                            Total: {fmtMoeda(totalNfces)}
                                        </Typography>
                                    </Box>
                                )}
                            </TabPanel>

                            {/* ORDENS DE SERVIÇO */}
                            <TabPanel value={tabAtiva} index={3}>
                                {ordens.length === 0 ? (
                                    <Alert severity="info">Nenhuma ordem de serviço para este cliente.</Alert>
                                ) : (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                    <TableCell>OS #</TableCell>
                                                    <TableCell>Abertura</TableCell>
                                                    <TableCell>Técnico</TableCell>
                                                    <TableCell>Problema</TableCell>
                                                    <TableCell>Finalização</TableCell>
                                                    <TableCell align="right">Total</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {ordens.map((o) => (
                                                    <TableRow key={o.id_os} hover>
                                                        <TableCell>{o.id_os}</TableCell>
                                                        <TableCell>{fmtData(o.data_abertura)}</TableCell>
                                                        <TableCell>{o.tecnico_nome || '—'}</TableCell>
                                                        <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {o.descricao_problema || '—'}
                                                        </TableCell>
                                                        <TableCell>{fmtData(o.data_finalizacao)}</TableCell>
                                                        <TableCell align="right">{fmtMoeda(o.valor_total_os)}</TableCell>
                                                        <TableCell>
                                                            <Chip label={o.status_os || 'Aberta'} size="small" color={STATUS_OS[o.status_os] || 'default'} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                                {ordens.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Typography variant="body2" fontWeight={700}>Total: {fmtMoeda(totalOS)}</Typography>
                                    </Box>
                                )}
                            </TabPanel>

                            {/* A RECEBER */}
                            <TabPanel value={tabAtiva} index={4}>
                                {contasReceber.length === 0 ? (
                                    <Alert severity="info">Nenhuma conta a receber em aberto.</Alert>
                                ) : (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                    <TableCell>Descrição</TableCell>
                                                    <TableCell>Vencimento</TableCell>
                                                    <TableCell>Parcela</TableCell>
                                                    <TableCell align="right">Valor</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {contasReceber.map((c) => (
                                                    <TableRow key={c.id_conta} hover>
                                                        <TableCell>{c.descricao || '—'}</TableCell>
                                                        <TableCell>{fmtData(c.data_vencimento)}</TableCell>
                                                        <TableCell>{c.numero_parcela || 1}/{c.total_parcelas || 1}</TableCell>
                                                        <TableCell align="right">{fmtMoeda(c.valor_parcela)}</TableCell>
                                                        <TableCell>
                                                            <Chip label={c.status_conta || 'Aberta'} size="small" color={STATUS_CONTA[c.status_conta] || 'default'} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                                {contasReceber.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Typography variant="body2" fontWeight={700} color="error.main">
                                            Total a receber: {fmtMoeda(totalAReceber)}
                                        </Typography>
                                    </Box>
                                )}
                            </TabPanel>

                            {/* RECEBIDOS */}
                            <TabPanel value={tabAtiva} index={5}>
                                {contasPagas.length === 0 ? (
                                    <Alert severity="info">Nenhum recebimento registrado.</Alert>
                                ) : (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                    <TableCell>Descrição</TableCell>
                                                    <TableCell>Vencimento</TableCell>
                                                    <TableCell>Pagamento</TableCell>
                                                    <TableCell align="right">Valor</TableCell>
                                                    <TableCell align="right">Recebido</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {contasPagas.map((c) => (
                                                    <TableRow key={c.id_conta} hover>
                                                        <TableCell>{c.descricao || '—'}</TableCell>
                                                        <TableCell>{fmtData(c.data_vencimento)}</TableCell>
                                                        <TableCell>{fmtData(c.data_pagamento)}</TableCell>
                                                        <TableCell align="right">{fmtMoeda(c.valor_parcela)}</TableCell>
                                                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                                                            {fmtMoeda(c.valor_liquidado || c.valor_parcela)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                                {contasPagas.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Typography variant="body2" fontWeight={700} color="success.main">
                                            Total recebido: {fmtMoeda(totalRecebido)}
                                        </Typography>
                                    </Box>
                                )}
                            </TabPanel>

                            {/* CT-e */}
                            <TabPanel value={tabAtiva} index={6}>
                                {ctes.length === 0 ? (
                                    <Alert severity="info">Nenhum CT-e encontrado para este cliente.</Alert>
                                ) : (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                    <TableCell>#</TableCell>
                                                    <TableCell>Número</TableCell>
                                                    <TableCell>Data</TableCell>
                                                    <TableCell>Remetente</TableCell>
                                                    <TableCell>Destinatário</TableCell>
                                                    <TableCell align="right">Valor</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {ctes.map((c) => (
                                                    <TableRow key={c.id_cte} hover>
                                                        <TableCell>{c.id_cte}</TableCell>
                                                        <TableCell>{c.numero_cte || '—'}</TableCell>
                                                        <TableCell>{fmtData(c.data_emissao)}</TableCell>
                                                        <TableCell>{c.remetente_nome || c.remetente_razao_social || '—'}</TableCell>
                                                        <TableCell>{c.destinatario_nome || c.destinatario_razao_social || '—'}</TableCell>
                                                        <TableCell align="right">{fmtMoeda(c.valor_total_servico || c.valor_total)}</TableCell>
                                                        <TableCell>
                                                            <Chip label={c.status || '—'} size="small" color={c.status === 'Autorizada' ? 'success' : 'default'} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </TabPanel>

                            {/* PRODUTOS */}
                            <TabPanel value={tabAtiva} index={7}>
                                {produtos.length === 0 ? (
                                    <Alert severity="info">Nenhum produto encontrado para este cliente.</Alert>
                                ) : (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                    <TableCell>Data Venda</TableCell>
                                                    <TableCell>Venda #</TableCell>
                                                    <TableCell>Código</TableCell>
                                                    <TableCell>Produto</TableCell>
                                                    <TableCell>Unid.</TableCell>
                                                    <TableCell align="right">Qtd</TableCell>
                                                    <TableCell align="right">Vlr Unit.</TableCell>
                                                    <TableCell align="right">Total</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {produtos.map((p, i) => (
                                                    <TableRow key={p.id_item || i} hover>
                                                        <TableCell>{fmtData(p.data_venda)}</TableCell>
                                                        <TableCell>{p.id_venda || '—'}</TableCell>
                                                        <TableCell>{p.codigo_produto || '—'}</TableCell>
                                                        <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {p.nome_produto || '—'}
                                                        </TableCell>
                                                        <TableCell>{p.unidade_medida || '—'}</TableCell>
                                                        <TableCell align="right">{Number(p.quantidade).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</TableCell>
                                                        <TableCell align="right">{fmtMoeda(p.valor_unitario)}</TableCell>
                                                        <TableCell align="right">{fmtMoeda(p.valor_total)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                                {produtos.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Typography variant="body2" fontWeight={700} color="success.main">
                                            Total em produtos: {fmtMoeda(totalProdutos)}
                                        </Typography>
                                    </Box>
                                )}
                            </TabPanel>

                            {/* CRÉDITOS */}
                            <TabPanel value={tabAtiva} index={8}>
                                {creditos.length === 0 ? (
                                    <Alert severity="info">Nenhum crédito/cashback encontrado.</Alert>
                                ) : (
                                    <>
                                        <Box sx={{ mb: 2, p: 2, bgcolor: 'purple', color: 'white', borderRadius: 1, display: 'inline-block' }}>
                                            <Typography variant="h6" fontWeight={700}>
                                                Saldo disponível: {fmtMoeda(saldoCredito)}
                                            </Typography>
                                        </Box>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                        <TableCell>Tipo</TableCell>
                                                        <TableCell>Descrição</TableCell>
                                                        <TableCell>Data</TableCell>
                                                        <TableCell align="right">Valor</TableCell>
                                                        <TableCell align="right">Saldo</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {creditos.map((c) => (
                                                        <TableRow key={c.id_credito || c.id} hover>
                                                            <TableCell>{c.tipo || 'Crédito'}</TableCell>
                                                            <TableCell>{c.descricao || '—'}</TableCell>
                                                            <TableCell>{fmtData(c.data_criacao || c.data)}</TableCell>
                                                            <TableCell align="right">{fmtMoeda(c.valor)}</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 700, color: 'purple' }}>
                                                                {fmtMoeda(c.saldo)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </>
                                )}
                            </TabPanel>

                        </Box>
                    </Paper>
                </>
            )}

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; }
                }
            `}</style>
        </Box>
    );
}
