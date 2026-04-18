import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Alert, CircularProgress, Divider,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Card, CardContent, Tooltip,
  Autocomplete, LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Agriculture as AgroIcon,
  Grass as TalhaoIcon,
  AttachMoney as DespesaIcon,
  Build as MaqIcon,
  People as MdoIcon,
  Assignment as LancIcon,
  Search as SearchIcon,
  TrendingDown as CustoIcon,
  BarChart as ResumoIcon,
  PlaylistAdd as LancarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

// ─── helpers ───
const fmtDate  = v => v ? new Date(v + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
const fmtMoeda = v => v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';
const fmtNum   = (v, dec = 2) => v != null ? Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec }) : '—';

const CORES_CATEGORIA = {
  'Sementes': '#388e3c', 'Fertilizantes': '#1565c0', 'Defensivos': '#e65100',
  'Combustível': '#6a1b9a', 'Mão de Obra': '#c62828', 'Manutenção': '#4e342e',
  'Transporte': '#00695c', 'Arrendamento': '#f9a825', 'Outros': '#546e7a',
};

const STATUS_TALHAO_COLOR = {
  'Planejado': 'default', 'Plantado': 'primary', 'Em Desenvolvimento': 'warning',
  'Colhido': 'success', 'Cancelado': 'error',
};

// ─── Component ───
const AgroOperacionalPage = () => {
  const { axiosInstance } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // dados
  const [safras, setSafras] = useState([]);
  const [talhoes, setTalhoes] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [maquinarios, setMaquinarios] = useState([]);
  const [lancamentosMaq, setLancamentosMaq] = useState([]);
  const [trabalhadores, setTrabalhadores] = useState([]);
  const [lancamentosMdo, setLancamentosMdo] = useState([]);

  // filtros globais
  const [safraFiltro, setSafraFiltro] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');

  // dialogs
  const [dlg, setDlg] = useState({ tipo: '', open: false });
  const [editandoId, setEditandoId] = useState(null);

  // forms
  const emptyTalhao = {
    id_safra: '', nome: '', cultura: 'Soja', variedade: '',
    area_hectares: '', data_plantio: '', data_colheita_prevista: '', data_colheita_real: '',
    status: 'Planejado', produtividade_prevista: '', produtividade_real: '',
    populacao_plantas: '', observacoes: '',
  };
  const emptyDespesa = {
    id_safra: '', id_talhao: '', categoria: 'Outros', descricao: '',
    data_lancamento: '', valor: '', quantidade: '', unidade: '',
    fornecedor: '', numero_nota: '', observacoes: '',
  };
  const emptyMaquinario = {
    nome: '', tipo: 'Trator', marca: '', modelo: '', ano_fabricacao: '',
    placa: '', horimetro_atual: '0', valor_hora: '0', capacidade: '',
    status: 'Disponível', observacoes: '',
  };
  const emptyLancMaq = {
    id_safra: '', id_talhao: '', id_maquinario: '', operacao: 'Outro',
    data_inicio: '', data_fim: '', horas_trabalhadas: '0',
    area_trabalhada_ha: '', operador: '', combustivel_litros: '', observacoes: '',
  };
  const emptyTrabalhador = {
    nome: '', funcao: '', tipo: 'Diarista', cpf: '', telefone: '',
    valor_diaria: '0', valor_hora: '0', observacoes: '',
  };
  const emptyLancMdo = {
    id_safra: '', id_talhao: '', id_trabalhador: '', nome_avulso: '',
    atividade: 'Outro', data: '', quantidade: '1',
    tipo_pagamento: 'Diária', valor_unitario: '0', observacoes: '',
  };

  const [formTalhao, setFormTalhao] = useState(emptyTalhao);
  const [formDespesa, setFormDespesa] = useState(emptyDespesa);
  const [formMaquinario, setFormMaquinario] = useState(emptyMaquinario);
  const [formLancMaq, setFormLancMaq] = useState(emptyLancMaq);
  const [formTrabalhador, setFormTrabalhador] = useState(emptyTrabalhador);
  const [formLancMdo, setFormLancMdo] = useState(emptyLancMdo);

  // ── fetch ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [safrasR, talhoesR, despesasR, maqR, lancMaqR, trabR, lancMdoR] = await Promise.all([
        axiosInstance.get('/safras/'),
        axiosInstance.get('/agro-talhoes/'),
        axiosInstance.get('/agro-despesas/'),
        axiosInstance.get('/agro-maquinarios/'),
        axiosInstance.get('/agro-lancamentos-maq/'),
        axiosInstance.get('/agro-mao-de-obra/'),
        axiosInstance.get('/agro-lancamentos-mdo/'),
      ]);
      setSafras(safrasR.data || []);
      setTalhoes(talhoesR.data || []);
      setDespesas(despesasR.data || []);
      setMaquinarios(maqR.data || []);
      setLancamentosMaq(lancMaqR.data || []);
      setTrabalhadores(trabR.data || []);
      setLancamentosMdo(lancMdoR.data || []);
    } catch (e) {
      setError('Erro ao carregar dados: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── auto-preenche valor_hora do trabalhador ao selecionar ──
  const handleTrabalhadorSelect = (idTrab, tipoPag) => {
    const t = Array.isArray(trabalhadores) ? trabalhadores.find(x => x.id_trabalhador === Number(idTrab) || x.id_trabalhador === idTrab) : null;
    if (t) {
      const vUnit = tipoPag === 'Hora' ? t.valor_hora : (tipoPag === 'Diária' ? t.valor_diaria : t.valor_diaria);
      setFormLancMdo(p => ({ ...p, id_trabalhador: idTrab, valor_unitario: String(vUnit || '0') }));
    }
  };

  // ── auto-preenche valor_hora do maquinário ──
  const handleMaquinarioSelect = (idMaq) => {
    const m = Array.isArray(maquinarios) ? maquinarios.find(x => x.id_maquinario === Number(idMaq) || x.id_maquinario === idMaq) : null;
    setFormLancMaq(p => ({ ...p, id_maquinario: idMaq }));
  };

  // ── abertura de dialog ──
  const abrirDlg = (tipo, dados = null, id = null) => {
    setEditandoId(id);
    if (tipo === 'talhao')      setFormTalhao(dados    || { ...emptyTalhao,    id_safra: safraFiltro });
    if (tipo === 'despesa')     setFormDespesa(dados   || { ...emptyDespesa,   id_safra: safraFiltro });
    if (tipo === 'maquinario')  setFormMaquinario(dados || emptyMaquinario);
    if (tipo === 'lancMaq')     setFormLancMaq(dados   || { ...emptyLancMaq,   id_safra: safraFiltro });
    if (tipo === 'trabalhador') setFormTrabalhador(dados || emptyTrabalhador);
    if (tipo === 'lancMdo')     setFormLancMdo(dados   || { ...emptyLancMdo,   id_safra: safraFiltro });
    setDlg({ tipo, open: true });
  };

  // ── CRUD genérico ──
  const salvar = async (tipo) => {
    const MAP = {
      talhao:      { url: '/agro-talhoes/',          pk: 'id_talhao',          form: formTalhao,       empty: emptyTalhao,       set: setFormTalhao },
      despesa:     { url: '/agro-despesas/',          pk: 'id_despesa',         form: formDespesa,      empty: emptyDespesa,      set: setFormDespesa },
      maquinario:  { url: '/agro-maquinarios/',       pk: 'id_maquinario',      form: formMaquinario,   empty: emptyMaquinario,   set: setFormMaquinario },
      lancMaq:     { url: '/agro-lancamentos-maq/',   pk: 'id_lancamento_maq',  form: formLancMaq,      empty: emptyLancMaq,      set: setFormLancMaq },
      trabalhador: { url: '/agro-mao-de-obra/',       pk: 'id_trabalhador',     form: formTrabalhador,  empty: emptyTrabalhador,  set: setFormTrabalhador },
      lancMdo:     { url: '/agro-lancamentos-mdo/',   pk: 'id_lancamento_mdo',  form: formLancMdo,      empty: emptyLancMdo,      set: setFormLancMdo },
    };
    const { url, form, empty, set } = MAP[tipo];
    try {
      const clean = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
      );
      if (editandoId) {
        await axiosInstance.put(`${url}${editandoId}/`, clean);
        toast.success('Atualizado com sucesso!');
      } else {
        await axiosInstance.post(url, clean);
        toast.success('Registrado com sucesso!');
      }
      setDlg({ tipo: '', open: false }); setEditandoId(null); set(empty);
      fetchAll();
    } catch (e) {
      toast.error('Erro: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message));
    }
  };

  const excluir = async (url, id, label) => {
    if (!window.confirm(`Excluir ${label}?`)) return;
    try {
      await axiosInstance.delete(`${url}${id}/`);
      toast.success('Excluído!'); fetchAll();
    } catch (e) {
      toast.error('Erro ao excluir');
    }
  };

  // ── filtros ──
  const filtrarPorSafra = lista => {
    if (!Array.isArray(lista)) return [];
    return safraFiltro ? lista.filter(i => String(i.id_safra) === String(safraFiltro)) : lista;
  };
  const filtrarBusca = (lista, campos) => {
    if (!Array.isArray(lista)) return [];
    return !filtroBusca ? lista : lista.filter(i =>
      campos.some(c => String(i[c] || '').toLowerCase().includes(filtroBusca.toLowerCase()))
    );
  };

  // ── resumos dash ──
  const resumo = useMemo(() => {
    const tBase = filtrarPorSafra(talhoes);
    const dBase = filtrarPorSafra(despesas);
    const mBase = filtrarPorSafra(lancamentosMaq);
    const mdoBase = filtrarPorSafra(lancamentosMdo);
    const totalHa  = Array.isArray(tBase) ? tBase.reduce((s, t) => s + Number(t.area_hectares || 0), 0) : 0;
    const totalDesp = Array.isArray(dBase) ? dBase.reduce((s, d) => s + Number(d.valor || 0), 0) : 0;
    const totalMaq  = Array.isArray(mBase) ? mBase.reduce((s, l) => s + Number(l.valor_total || 0), 0) : 0;
    const totalMdo  = Array.isArray(mdoBase) ? mdoBase.reduce((s, l) => s + Number(l.valor_total || 0), 0) : 0;
    const totalGeral = totalDesp + totalMaq + totalMdo;
    // agrupamento por categoria
    const porCategoria = {};
    if (Array.isArray(dBase)) {
      dBase.forEach(d => {
        porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + Number(d.valor || 0);
      });
    }
    return { totalHa, totalDesp, totalMaq, totalMdo, totalGeral, porCategoria, qtdTalhoes: Array.isArray(tBase) ? tBase.length : 0 };
  }, [talhoes, despesas, lancamentosMaq, lancamentosMdo, safraFiltro]);

  const talhoesFiltrados = useMemo(() =>
    filtrarBusca(filtrarPorSafra(talhoes), ['nome', 'cultura', 'status']),
    [talhoes, safraFiltro, filtroBusca]
  );
  const despesasFiltradas = useMemo(() =>
    filtrarBusca(filtrarPorSafra(despesas), ['descricao', 'categoria', 'fornecedor']),
    [despesas, safraFiltro, filtroBusca]
  );
  const lancMaqFiltrados = useMemo(() =>
    filtrarBusca(filtrarPorSafra(lancamentosMaq), ['nome_maquinario', 'operacao_display', 'operador']),
    [lancamentosMaq, safraFiltro, filtroBusca]
  );
  const lancMdoFiltrados = useMemo(() =>
    filtrarBusca(filtrarPorSafra(lancamentosMdo), ['nome_trabalhador', 'atividade_display', 'nome_avulso']),
    [lancamentosMdo, safraFiltro, filtroBusca]
  );

  if (loading) return <Box display="flex" justifyContent="center" pt={8}><CircularProgress /></Box>;

  // ── RENDER ──
  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #388e3c 100%)',
        borderRadius: 2, p: 3, mb: 2, color: 'white',
        display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
      }}>
        <AgroIcon sx={{ fontSize: 42 }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">Gestão Operacional Agro</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Talhões · Despesas · Mão de Obra · Maquinário
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', minWidth: 200 }}>
          <FormControl fullWidth size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 1 }}>
            <InputLabel sx={{ color: 'white' }}>Safra</InputLabel>
            <Select value={safraFiltro} label="Safra"
              onChange={e => setSafraFiltro(e.target.value)}
              sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }}>
              <MenuItem value="">Todas as safras</MenuItem>
              {Array.isArray(safras) && safras.map(s => <MenuItem key={s.id_safra} value={String(s.id_safra)}>{s.descricao}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setFiltroBusca(''); }} variant="scrollable" scrollButtons="auto">
          <Tab icon={<ResumoIcon />} iconPosition="start" label="Dashboard" />
          <Tab icon={<TalhaoIcon />} iconPosition="start" label="Talhões / Área" />
          <Tab icon={<DespesaIcon />} iconPosition="start" label="Despesas" />
          <Tab icon={<MdoIcon />} iconPosition="start" label="Mão de Obra" />
          <Tab icon={<MaqIcon />} iconPosition="start" label="Maquinário" />
          <Tab icon={<PersonIcon />} iconPosition="start" label="Cadastros" />
        </Tabs>
      </Paper>

      {/* ══════ TAB 0: DASHBOARD ══════ */}
      {tab === 0 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Área Total (ha)', value: fmtNum(resumo.totalHa, 2) + ' ha', color: '#2e7d32', icon: <TalhaoIcon /> },
              { label: 'Talhões', value: resumo.qtdTalhoes, color: '#1565c0', icon: <TalhaoIcon /> },
              { label: 'Total Despesas', value: fmtMoeda(resumo.totalDesp), color: '#c62828', icon: <DespesaIcon /> },
              { label: 'Custo Maquinário', value: fmtMoeda(resumo.totalMaq), color: '#6a1b9a', icon: <MaqIcon /> },
              { label: 'Custo Mão de Obra', value: fmtMoeda(resumo.totalMdo), color: '#e65100', icon: <MdoIcon /> },
              { label: 'Custo Total', value: fmtMoeda(resumo.totalGeral), color: '#37474f', icon: <CustoIcon /> },
            ].map(c => (
              <Grid item xs={6} md={2} key={c.label}>
                <Card sx={{ borderLeft: `4px solid ${c.color}`, height: '100%' }}>
                  <CardContent sx={{ py: '10px !important', px: 2 }}>
                    <Box sx={{ color: c.color, mb: 0.5 }}>{c.icon}</Box>
                    <Typography variant="h6" fontWeight="bold" color={c.color} sx={{ lineHeight: 1.2 }}>
                      {c.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            {/* Custo por categoria */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>💰 Despesas por Categoria</Typography>
                {Object.entries(resumo.porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
                  const pct = resumo.totalDesp > 0 ? (val / resumo.totalDesp) * 100 : 0;
                  return (
                    <Box key={cat} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                        <Typography variant="body2" fontWeight="bold">{cat}</Typography>
                        <Typography variant="body2">{fmtMoeda(val)} ({pct.toFixed(1)}%)</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={pct}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': { bgcolor: CORES_CATEGORIA[cat] || '#546e7a' } }} />
                    </Box>
                  );
                })}
                {Object.keys(resumo.porCategoria).length === 0 &&
                  <Typography color="text.secondary">Nenhuma despesa lançada.</Typography>}
              </Paper>
            </Grid>

            {/* Talhões resumo */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>🌱 Talhões da Safra</Typography>
                {filtrarPorSafra(talhoes).length === 0
                  ? <Typography color="text.secondary">Nenhum talhão cadastrado.</Typography>
                  : filtrarPorSafra(talhoes).map(t => {
                    const custot = Number(t.custo_total || 0);
                    const custoPorHa = t.area_hectares > 0 ? custot / Number(t.area_hectares) : 0;
                    return (
                      <Box key={t.id_talhao} sx={{ p: 1.5, mb: 1, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography fontWeight="bold">{t.nome}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t.cultura} · {fmtNum(t.area_hectares, 2)} ha
                              {t.produtividade_prevista && ` · Prev: ${t.produtividade_prevista} sc/ha`}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Chip label={t.status} color={STATUS_TALHAO_COLOR[t.status] || 'default'} size="small" />
                            {custot > 0 && (
                              <Typography variant="caption" display="block" color="error.main">
                                {fmtMoeda(custot)} ({fmtMoeda(custoPorHa)}/ha)
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })
                }
              </Paper>
            </Grid>

            {/* Maquinário resumo */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>🚜 Uso de Maquinário</Typography>
                {filtrarPorSafra(lancamentosMaq).length === 0
                  ? <Typography color="text.secondary">Nenhum lançamento de maquinário.</Typography>
                  : (() => {
                    const agrup = {};
                    filtrarPorSafra(lancamentosMaq).forEach(l => {
                      if (!agrup[l.nome_maquinario]) agrup[l.nome_maquinario] = { horas: 0, custo: 0 };
                      agrup[l.nome_maquinario].horas += Number(l.horas_trabalhadas || 0);
                      agrup[l.nome_maquinario].custo += Number(l.valor_total || 0);
                    });
                    return Object.entries(agrup).sort((a, b) => b[1].custo - a[1].custo).map(([nome, v]) => (
                      <Box key={nome} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: '1px solid #f0f0f0' }}>
                        <Typography variant="body2">{nome}</Typography>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight="bold">{fmtMoeda(v.custo)}</Typography>
                          <Typography variant="caption" color="text.secondary">{fmtNum(v.horas)} h</Typography>
                        </Box>
                      </Box>
                    ));
                  })()
                }
              </Paper>
            </Grid>

            {/* MDO resumo */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>👷 Mão de Obra</Typography>
                {filtrarPorSafra(lancamentosMdo).length === 0
                  ? <Typography color="text.secondary">Nenhum lançamento de mão de obra.</Typography>
                  : (() => {
                    const agrup = {};
                    filtrarPorSafra(lancamentosMdo).forEach(l => {
                      const k = l.nome_trabalhador || l.nome_avulso || 'Avulso';
                      if (!agrup[k]) agrup[k] = { qtd: 0, custo: 0 };
                      agrup[k].qtd += Number(l.quantidade || 0);
                      agrup[k].custo += Number(l.valor_total || 0);
                    });
                    return Object.entries(agrup).sort((a, b) => b[1].custo - a[1].custo).map(([nome, v]) => (
                      <Box key={nome} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: '1px solid #f0f0f0' }}>
                        <Typography variant="body2">{nome}</Typography>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight="bold">{fmtMoeda(v.custo)}</Typography>
                          <Typography variant="caption" color="text.secondary">{fmtNum(v.qtd)} lançamentos</Typography>
                        </Box>
                      </Box>
                    ));
                  })()
                }
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ══════ TAB 1: TALHÕES ══════ */}
      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Buscar talhão / cultura..." value={filtroBusca}
              onChange={e => setFiltroBusca(e.target.value)} sx={{ minWidth: 240 }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
            <Button variant="contained" color="success" startIcon={<AddIcon />}
              onClick={() => abrirDlg('talhao')}>
              Novo Talhão
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#2e7d32' }}>
                <TableRow>
                  {['Safra','Talhão','Cultura','Variedade','Área (ha)','Plantio','Colheita Prev.','Prod. Prev.(sc/ha)','Prod. Real','Status','Custo Total','Ações'].map(h =>
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {talhoesFiltrados.map(t => (
                  <TableRow key={t.id_talhao} hover>
                    <TableCell>{t.descricao_safra}</TableCell>
                    <TableCell><b>{t.nome}</b></TableCell>
                    <TableCell>{t.cultura_display}</TableCell>
                    <TableCell>{t.variedade || '—'}</TableCell>
                    <TableCell>{fmtNum(t.area_hectares, 4)}</TableCell>
                    <TableCell>{fmtDate(t.data_plantio)}</TableCell>
                    <TableCell>{fmtDate(t.data_colheita_prevista)}</TableCell>
                    <TableCell>{t.produtividade_prevista ? `${t.produtividade_prevista} sc/ha` : '—'}</TableCell>
                    <TableCell>{t.produtividade_real ? `${t.produtividade_real} sc/ha` : '—'}</TableCell>
                    <TableCell><Chip label={t.status} color={STATUS_TALHAO_COLOR[t.status] || 'default'} size="small" /></TableCell>
                    <TableCell>{t.custo_total > 0 ? fmtMoeda(t.custo_total) : '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Editar"><IconButton size="small"
                          onClick={() => abrirDlg('talhao', {...t, id_safra: String(t.id_safra)}, t.id_talhao)}>
                          <EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Excluir"><IconButton size="small" color="error"
                          onClick={() => excluir('/agro-talhoes/', t.id_talhao, t.nome)}>
                          <DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {talhoesFiltrados.length === 0 && (
                  <TableRow><TableCell colSpan={12} align="center">Nenhum talhão encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ══════ TAB 2: DESPESAS ══════ */}
      {tab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Buscar descrição / fornecedor..." value={filtroBusca}
              onChange={e => setFiltroBusca(e.target.value)} sx={{ minWidth: 240 }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
            <Button variant="contained" color="error" startIcon={<LancarIcon />}
              onClick={() => abrirDlg('despesa')}>
              Lançar Despesa
            </Button>
          </Box>

          {/* mini-resumo por categoria */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {Object.entries(resumo.porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
              <Chip key={cat} label={`${cat}: ${fmtMoeda(val)}`}
                sx={{ bgcolor: CORES_CATEGORIA[cat] || '#546e7a', color: 'white' }} size="small" />
            ))}
            {Array.isArray(despesasFiltradas) && despesasFiltradas.length > 0 && (
              <Chip label={`TOTAL: ${fmtMoeda(despesasFiltradas.reduce((s, d) => s + Number(d.valor), 0))}`}
                color="default" size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />
            )}
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#b71c1c' }}>
                <TableRow>
                  {['Safra','Talhão','Categoria','Descrição','Data','Qtde','Un.','Valor','Fornecedor','NF','Ações'].map(h =>
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {despesasFiltradas.map(d => (
                  <TableRow key={d.id_despesa} hover>
                    <TableCell>{d.descricao_safra}</TableCell>
                    <TableCell>{d.nome_talhao || <em style={{color:'#aaa'}}>Geral</em>}</TableCell>
                    <TableCell>
                      <Chip label={d.categoria_display}
                        sx={{ bgcolor: CORES_CATEGORIA[d.categoria] || '#546e7a', color: 'white' }} size="small" />
                    </TableCell>
                    <TableCell>{d.descricao}</TableCell>
                    <TableCell>{fmtDate(d.data_lancamento)}</TableCell>
                    <TableCell>{d.quantidade ? fmtNum(d.quantidade, 2) : '—'}</TableCell>
                    <TableCell>{d.unidade || '—'}</TableCell>
                    <TableCell><b>{fmtMoeda(d.valor)}</b></TableCell>
                    <TableCell>{d.fornecedor || '—'}</TableCell>
                    <TableCell>{d.numero_nota || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Editar"><IconButton size="small"
                          onClick={() => abrirDlg('despesa', {...d, id_safra: String(d.id_safra), id_talhao: String(d.id_talhao||'')}, d.id_despesa)}>
                          <EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Excluir"><IconButton size="small" color="error"
                          onClick={() => excluir('/agro-despesas/', d.id_despesa, d.descricao)}>
                          <DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {despesasFiltradas.length === 0 && (
                  <TableRow><TableCell colSpan={11} align="center">Nenhuma despesa encontrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ══════ TAB 3: MÃO DE OBRA ══════ */}
      {tab === 3 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Buscar trabalhador / atividade..." value={filtroBusca}
              onChange={e => setFiltroBusca(e.target.value)} sx={{ minWidth: 240 }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
            <Button variant="contained" startIcon={<LancarIcon />}
              sx={{ bgcolor: '#c62828' }}
              onClick={() => abrirDlg('lancMdo')}>
              Lançar Mão de Obra
            </Button>
          </Box>

          {/* total */}
          {Array.isArray(lancMdoFiltrados) && lancMdoFiltrados.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Chip label={`Total lançado: ${fmtMoeda(lancMdoFiltrados.reduce((s, l) => s + Number(l.valor_total || 0), 0))}`}
                color="error" variant="outlined" />
            </Box>
          )}

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#c62828' }}>
                <TableRow>
                  {['Safra','Talhão','Trabalhador','Atividade','Data','Qtde','Tipo Pgto','Vlr Unit.','Valor Total','Ações'].map(h =>
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {lancMdoFiltrados.map(l => (
                  <TableRow key={l.id_lancamento_mdo} hover>
                    <TableCell>{l.descricao_safra}</TableCell>
                    <TableCell>{l.nome_talhao || <em style={{color:'#aaa'}}>Geral</em>}</TableCell>
                    <TableCell><b>{l.nome_trabalhador}</b></TableCell>
                    <TableCell>{l.atividade_display}</TableCell>
                    <TableCell>{fmtDate(l.data)}</TableCell>
                    <TableCell>{fmtNum(l.quantidade, 1)}</TableCell>
                    <TableCell>{l.tipo_pagamento_display}</TableCell>
                    <TableCell>{fmtMoeda(l.valor_unitario)}</TableCell>
                    <TableCell><b>{fmtMoeda(l.valor_total)}</b></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Editar"><IconButton size="small"
                          onClick={() => abrirDlg('lancMdo', {...l, id_safra: String(l.id_safra), id_talhao: String(l.id_talhao||''), id_trabalhador: String(l.id_trabalhador||'')}, l.id_lancamento_mdo)}>
                          <EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Excluir"><IconButton size="small" color="error"
                          onClick={() => excluir('/agro-lancamentos-mdo/', l.id_lancamento_mdo, 'lançamento')}>
                          <DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {lancMdoFiltrados.length === 0 && (
                  <TableRow><TableCell colSpan={10} align="center">Nenhum lançamento encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ══════ TAB 4: MAQUINÁRIO ══════ */}
      {tab === 4 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Buscar maquinário / operação..." value={filtroBusca}
              onChange={e => setFiltroBusca(e.target.value)} sx={{ minWidth: 240 }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
            <Button variant="contained" startIcon={<LancarIcon />}
              sx={{ bgcolor: '#6a1b9a' }}
              onClick={() => abrirDlg('lancMaq')}>
              Lançar Uso de Máquina
            </Button>
          </Box>

          {Array.isArray(lancMaqFiltrados) && lancMaqFiltrados.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
              <Chip label={`Total horas: ${fmtNum(lancMaqFiltrados.reduce((s, l) => s + Number(l.horas_trabalhadas || 0), 0))} h`}
                color="secondary" variant="outlined" />
              <Chip label={`Custo total: ${fmtMoeda(lancMaqFiltrados.reduce((s, l) => s + Number(l.valor_total || 0), 0))}`}
                sx={{ color: '#6a1b9a', borderColor: '#6a1b9a' }} variant="outlined" />
            </Box>
          )}

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#6a1b9a' }}>
                <TableRow>
                  {['Safra','Talhão','Máquina','Operação','Data Início','Horas','Área (ha)','Operador','Combustível (L)','Custo','Ações'].map(h =>
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {lancMaqFiltrados.map(l => (
                  <TableRow key={l.id_lancamento_maq} hover>
                    <TableCell>{l.descricao_safra}</TableCell>
                    <TableCell>{l.nome_talhao || <em style={{color:'#aaa'}}>Geral</em>}</TableCell>
                    <TableCell><b>{l.nome_maquinario}</b></TableCell>
                    <TableCell>{l.operacao_display}</TableCell>
                    <TableCell>{l.data_inicio ? new Date(l.data_inicio).toLocaleString('pt-BR') : '—'}</TableCell>
                    <TableCell>{fmtNum(l.horas_trabalhadas)} h</TableCell>
                    <TableCell>{l.area_trabalhada_ha ? `${fmtNum(l.area_trabalhada_ha, 2)} ha` : '—'}</TableCell>
                    <TableCell>{l.operador || '—'}</TableCell>
                    <TableCell>{l.combustivel_litros ? `${fmtNum(l.combustivel_litros)} L` : '—'}</TableCell>
                    <TableCell><b>{fmtMoeda(l.valor_total)}</b></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Editar"><IconButton size="small"
                          onClick={() => abrirDlg('lancMaq', {...l, id_safra: String(l.id_safra), id_talhao: String(l.id_talhao||''), id_maquinario: String(l.id_maquinario)}, l.id_lancamento_maq)}>
                          <EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Excluir"><IconButton size="small" color="error"
                          onClick={() => excluir('/agro-lancamentos-maq/', l.id_lancamento_maq, 'lançamento')}>
                          <DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {lancMaqFiltrados.length === 0 && (
                  <TableRow><TableCell colSpan={11} align="center">Nenhum lançamento encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ══════ TAB 5: CADASTROS ══════ */}
      {tab === 5 && (
        <Grid container spacing={3}>
          {/* Trabalhadores */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">👷 Trabalhadores</Typography>
                <Button size="small" variant="contained" startIcon={<AddIcon />}
                  onClick={() => abrirDlg('trabalhador')}>
                  Novo
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#c62828' }}>
                    <TableRow>
                      {['Nome','Função','Tipo','Diária','Hora','Ativo','Ações'].map(h =>
                        <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(trabalhadores) && trabalhadores.map(t => (
                      <TableRow key={t.id_trabalhador} hover>
                        <TableCell><b>{t.nome}</b></TableCell>
                        <TableCell>{t.funcao || '—'}</TableCell>
                        <TableCell><Chip label={t.tipo_display || t.tipo} size="small" /></TableCell>
                        <TableCell>{fmtMoeda(t.valor_diaria)}</TableCell>
                        <TableCell>{fmtMoeda(t.valor_hora)}</TableCell>
                        <TableCell><Chip label={t.ativo ? 'Ativo' : 'Inativo'} color={t.ativo ? 'success' : 'default'} size="small" /></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex' }}>
                            <IconButton size="small" onClick={() => abrirDlg('trabalhador', {...t}, t.id_trabalhador)}>
                              <EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error"
                              onClick={() => excluir('/agro-mao-de-obra/', t.id_trabalhador, t.nome)}>
                              <DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {trabalhadores.length === 0 && (
                      <TableRow><TableCell colSpan={7} align="center">Nenhum trabalhador cadastrado.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Maquinários */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">🚜 Máquinas e Implementos</Typography>
                <Button size="small" variant="contained" startIcon={<AddIcon />}
                  sx={{ bgcolor: '#6a1b9a' }}
                  onClick={() => abrirDlg('maquinario')}>
                  Nova
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#6a1b9a' }}>
                    <TableRow>
                      {['Nome','Tipo','Placa','Horímetro','R$/h','Status','Ações'].map(h =>
                        <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(maquinarios) && maquinarios.map(m => (
                      <TableRow key={m.id_maquinario} hover>
                        <TableCell><b>{m.nome}</b></TableCell>
                        <TableCell>{m.tipo_display}</TableCell>
                        <TableCell>{m.placa || '—'}</TableCell>
                        <TableCell>{fmtNum(m.horimetro_atual)} h</TableCell>
                        <TableCell>{fmtMoeda(m.valor_hora)}</TableCell>
                        <TableCell>
                          <Chip label={m.status_display}
                            color={m.status === 'Disponível' ? 'success' : m.status === 'Em Uso' ? 'warning' : m.status === 'Manutenção' ? 'error' : 'default'}
                            size="small" />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex' }}>
                            <IconButton size="small" onClick={() => abrirDlg('maquinario', {...m}, m.id_maquinario)}>
                              <EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error"
                              onClick={() => excluir('/agro-maquinarios/', m.id_maquinario, m.nome)}>
                              <DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {maquinarios.length === 0 && (
                      <TableRow><TableCell colSpan={7} align="center">Nenhuma máquina cadastrada.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ══════════════════════ DIALOGS ══════════════════════ */}

      {/* Dialog Talhão */}
      <Dialog open={dlg.open && dlg.tipo === 'talhao'} onClose={() => setDlg({tipo:'',open:false})} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white' }}>
          <TalhaoIcon sx={{ mr: 1 }} />{editandoId ? 'Editar Talhão' : 'Novo Talhão'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Safra *</InputLabel>
                <Select value={formTalhao.id_safra} label="Safra *"
                  onChange={e => setFormTalhao(p => ({ ...p, id_safra: e.target.value }))}>
                  {Array.isArray(safras) && safras.map(s => <MenuItem key={s.id_safra} value={String(s.id_safra)}>{s.descricao}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Nome do Talhão *" required
                value={formTalhao.nome} onChange={e => setFormTalhao(p => ({ ...p, nome: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Cultura</InputLabel>
                <Select value={formTalhao.cultura} label="Cultura"
                  onChange={e => setFormTalhao(p => ({ ...p, cultura: e.target.value }))}>
                  {['Soja','Milho','Trigo','Sorgo','Algodão','Cana','Café','Feijão','Arroz','Pastagem','Outro'].map(c =>
                    <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Variedade"
                value={formTalhao.variedade} onChange={e => setFormTalhao(p => ({ ...p, variedade: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Área (ha) *" type="number"
                value={formTalhao.area_hectares} onChange={e => setFormTalhao(p => ({ ...p, area_hectares: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Pop. Plantas (pl/ha)" type="number"
                value={formTalhao.populacao_plantas} onChange={e => setFormTalhao(p => ({ ...p, populacao_plantas: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Data Plantio" type="date"
                InputLabelProps={{ shrink: true }}
                value={formTalhao.data_plantio} onChange={e => setFormTalhao(p => ({ ...p, data_plantio: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Colheita Prevista" type="date"
                InputLabelProps={{ shrink: true }}
                value={formTalhao.data_colheita_prevista} onChange={e => setFormTalhao(p => ({ ...p, data_colheita_prevista: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Colheita Real" type="date"
                InputLabelProps={{ shrink: true }}
                value={formTalhao.data_colheita_real} onChange={e => setFormTalhao(p => ({ ...p, data_colheita_real: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={formTalhao.status} label="Status"
                  onChange={e => setFormTalhao(p => ({ ...p, status: e.target.value }))}>
                  {['Planejado','Plantado','Em Desenvolvimento','Colhido','Cancelado'].map(s =>
                    <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Produtividade Prevista (sc/ha)" type="number"
                value={formTalhao.produtividade_prevista} onChange={e => setFormTalhao(p => ({ ...p, produtividade_prevista: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Produtividade Real (sc/ha)" type="number"
                value={formTalhao.produtividade_real} onChange={e => setFormTalhao(p => ({ ...p, produtividade_real: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Observações"
                value={formTalhao.observacoes} onChange={e => setFormTalhao(p => ({ ...p, observacoes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg({tipo:'',open:false})}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={() => salvar('talhao')}>
            {editandoId ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Despesa */}
      <Dialog open={dlg.open && dlg.tipo === 'despesa'} onClose={() => setDlg({tipo:'',open:false})} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#b71c1c', color: 'white' }}>
          <DespesaIcon sx={{ mr: 1 }} />{editandoId ? 'Editar Despesa' : 'Lançar Despesa'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Safra *</InputLabel>
                <Select value={formDespesa.id_safra} label="Safra *"
                  onChange={e => setFormDespesa(p => ({ ...p, id_safra: e.target.value }))}>
                  {Array.isArray(safras) && safras.map(s => <MenuItem key={s.id_safra} value={String(s.id_safra)}>{s.descricao}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Talhão (opcional)</InputLabel>
                <Select value={formDespesa.id_talhao} label="Talhão (opcional)"
                  onChange={e => setFormDespesa(p => ({ ...p, id_talhao: e.target.value }))}>
                  <MenuItem value="">— Geral da Safra —</MenuItem>
                  {Array.isArray(talhoes) && talhoes.filter(t => !formDespesa.id_safra || String(t.id_safra) === String(formDespesa.id_safra))
                    .map(t => <MenuItem key={t.id_talhao} value={String(t.id_talhao)}>{t.nome}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select value={formDespesa.categoria} label="Categoria"
                  onChange={e => setFormDespesa(p => ({ ...p, categoria: e.target.value }))}>
                  {['Sementes','Fertilizantes','Defensivos','Combustível','Energia','Manutenção','Mão de Obra','Transporte','Armazenagem','Seguro','Arrendamento','Consultoria','Outros'].map(c =>
                    <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth size="small" label="Descrição *" required
                value={formDespesa.descricao} onChange={e => setFormDespesa(p => ({ ...p, descricao: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Data *" type="date"
                InputLabelProps={{ shrink: true }}
                value={formDespesa.data_lancamento} onChange={e => setFormDespesa(p => ({ ...p, data_lancamento: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Valor (R$) *" type="number"
                value={formDespesa.valor} onChange={e => setFormDespesa(p => ({ ...p, valor: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Quantidade" type="number"
                value={formDespesa.quantidade} onChange={e => setFormDespesa(p => ({ ...p, quantidade: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Unidade" placeholder="kg, L, sc, ha..."
                value={formDespesa.unidade} onChange={e => setFormDespesa(p => ({ ...p, unidade: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Fornecedor"
                value={formDespesa.fornecedor} onChange={e => setFormDespesa(p => ({ ...p, fornecedor: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Nº NF / Documento"
                value={formDespesa.numero_nota} onChange={e => setFormDespesa(p => ({ ...p, numero_nota: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Observações"
                value={formDespesa.observacoes} onChange={e => setFormDespesa(p => ({ ...p, observacoes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg({tipo:'',open:false})}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={() => salvar('despesa')}>
            {editandoId ? 'Atualizar' : 'Lançar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Lançamento Mão de Obra */}
      <Dialog open={dlg.open && dlg.tipo === 'lancMdo'} onClose={() => setDlg({tipo:'',open:false})} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#c62828', color: 'white' }}>
          <MdoIcon sx={{ mr: 1 }} />{editandoId ? 'Editar Lançamento MDO' : 'Lançar Mão de Obra'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Safra *</InputLabel>
                <Select value={formLancMdo.id_safra} label="Safra *"
                  onChange={e => setFormLancMdo(p => ({ ...p, id_safra: e.target.value }))}>
                  {Array.isArray(safras) && safras.map(s => <MenuItem key={s.id_safra} value={String(s.id_safra)}>{s.descricao}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Talhão (opcional)</InputLabel>
                <Select value={formLancMdo.id_talhao} label="Talhão (opcional)"
                  onChange={e => setFormLancMdo(p => ({ ...p, id_talhao: e.target.value }))}>
                  <MenuItem value="">— Geral —</MenuItem>
                  {Array.isArray(talhoes) && talhoes.filter(t => !formLancMdo.id_safra || String(t.id_safra) === String(formLancMdo.id_safra))
                    .map(t => <MenuItem key={t.id_talhao} value={String(t.id_talhao)}>{t.nome}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Trabalhador Cadastrado</InputLabel>
                <Select value={formLancMdo.id_trabalhador} label="Trabalhador Cadastrado"
                  onChange={e => handleTrabalhadorSelect(e.target.value, formLancMdo.tipo_pagamento)}>
                  <MenuItem value="">— Avulso (digitar nome) —</MenuItem>
                  {Array.isArray(trabalhadores) && trabalhadores.filter(t => t.ativo).map(t =>
                    <MenuItem key={t.id_trabalhador} value={String(t.id_trabalhador)}>{t.nome} ({t.tipo})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Nome Avulso"
                placeholder="Se não cadastrado, preencha aqui"
                disabled={!!formLancMdo.id_trabalhador}
                value={formLancMdo.nome_avulso}
                onChange={e => setFormLancMdo(p => ({ ...p, nome_avulso: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Atividade</InputLabel>
                <Select value={formLancMdo.atividade} label="Atividade"
                  onChange={e => setFormLancMdo(p => ({ ...p, atividade: e.target.value }))}>
                  {['Preparo Solo','Plantio','Adubação','Pulverização','Irrigação','Capina','Colheita','Pós-Colheita','Manutenção','Transporte','Outro'].map(a =>
                    <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Data *" type="date"
                InputLabelProps={{ shrink: true }}
                value={formLancMdo.data} onChange={e => setFormLancMdo(p => ({ ...p, data: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo Pagto</InputLabel>
                <Select value={formLancMdo.tipo_pagamento} label="Tipo Pagto"
                  onChange={e => {
                    setFormLancMdo(p => ({ ...p, tipo_pagamento: e.target.value }));
                    if (formLancMdo.id_trabalhador) handleTrabalhadorSelect(formLancMdo.id_trabalhador, e.target.value);
                  }}>
                  {['Diária','Hora','Empreitada','Mensal'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Quantidade" type="number"
                value={formLancMdo.quantidade} onChange={e => setFormLancMdo(p => ({ ...p, quantidade: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Valor Unitário (R$)" type="number"
                value={formLancMdo.valor_unitario} onChange={e => setFormLancMdo(p => ({ ...p, valor_unitario: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2">
                  <b>Valor Total:</b> {fmtMoeda(Number(formLancMdo.quantidade || 0) * Number(formLancMdo.valor_unitario || 0))}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Observações"
                value={formLancMdo.observacoes} onChange={e => setFormLancMdo(p => ({ ...p, observacoes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg({tipo:'',open:false})}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={() => salvar('lancMdo')}>
            {editandoId ? 'Atualizar' : 'Lançar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Lançamento Maquinário */}
      <Dialog open={dlg.open && dlg.tipo === 'lancMaq'} onClose={() => setDlg({tipo:'',open:false})} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#6a1b9a', color: 'white' }}>
          <MaqIcon sx={{ mr: 1 }} />{editandoId ? 'Editar Lançamento Maquinário' : 'Lançar Uso de Maquinário'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Safra *</InputLabel>
                <Select value={formLancMaq.id_safra} label="Safra *"
                  onChange={e => setFormLancMaq(p => ({ ...p, id_safra: e.target.value }))}>
                  {Array.isArray(safras) && safras.map(s => <MenuItem key={s.id_safra} value={String(s.id_safra)}>{s.descricao}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Talhão (opcional)</InputLabel>
                <Select value={formLancMaq.id_talhao} label="Talhão (opcional)"
                  onChange={e => setFormLancMaq(p => ({ ...p, id_talhao: e.target.value }))}>
                  <MenuItem value="">— Geral —</MenuItem>
                  {Array.isArray(talhoes) && talhoes.filter(t => !formLancMaq.id_safra || String(t.id_safra) === String(formLancMaq.id_safra))
                    .map(t => <MenuItem key={t.id_talhao} value={String(t.id_talhao)}>{t.nome}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Máquina *</InputLabel>
                <Select value={formLancMaq.id_maquinario} label="Máquina *"
                  onChange={e => handleMaquinarioSelect(e.target.value)}>
                  {Array.isArray(maquinarios) && maquinarios.map(m => <MenuItem key={m.id_maquinario} value={String(m.id_maquinario)}>{m.nome}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Operação</InputLabel>
                <Select value={formLancMaq.operacao} label="Operação"
                  onChange={e => setFormLancMaq(p => ({ ...p, operacao: e.target.value }))}>
                  {['Preparo Solo','Plantio','Adubação','Pulverização','Irrigação','Colheita','Transporte','Manutenção','Outro'].map(o =>
                    <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth size="small" label="Data / Hora Início *" type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={formLancMaq.data_inicio} onChange={e => setFormLancMaq(p => ({ ...p, data_inicio: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth size="small" label="Data / Hora Fim" type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={formLancMaq.data_fim} onChange={e => setFormLancMaq(p => ({ ...p, data_fim: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Horas Trabalhadas *" type="number"
                value={formLancMaq.horas_trabalhadas} onChange={e => setFormLancMaq(p => ({ ...p, horas_trabalhadas: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Área Trabalhada (ha)" type="number"
                value={formLancMaq.area_trabalhada_ha} onChange={e => setFormLancMaq(p => ({ ...p, area_trabalhada_ha: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Operador"
                value={formLancMaq.operador} onChange={e => setFormLancMaq(p => ({ ...p, operador: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Combustível (L)" type="number"
                value={formLancMaq.combustivel_litros} onChange={e => setFormLancMaq(p => ({ ...p, combustivel_litros: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ p: 1, bgcolor: '#f3e5f5', borderRadius: 1 }}>
                <Typography variant="body2">
                  <b>Custo Estimado:</b>{' '}
                  {(() => {
                    const maqArray = Array.isArray(maquinarios) ? maquinarios : [];
                    const m = maqArray.find(x => String(x.id_maquinario) === String(formLancMaq.id_maquinario));
                    const custo = (Number(formLancMaq.horas_trabalhadas || 0)) * (Number(m?.valor_hora || 0));
                    return fmtMoeda(custo);
                  })()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Observações"
                value={formLancMaq.observacoes} onChange={e => setFormLancMaq(p => ({ ...p, observacoes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg({tipo:'',open:false})}>Cancelar</Button>
          <Button variant="contained" sx={{ bgcolor: '#6a1b9a' }} onClick={() => salvar('lancMaq')}>
            {editandoId ? 'Atualizar' : 'Lançar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Cadastro Trabalhador */}
      <Dialog open={dlg.open && dlg.tipo === 'trabalhador'} onClose={() => setDlg({tipo:'',open:false})} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#c62828', color: 'white' }}>
          <PersonIcon sx={{ mr: 1 }} />{editandoId ? 'Editar Trabalhador' : 'Cadastrar Trabalhador'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth size="small" label="Nome Completo *" required
                value={formTrabalhador.nome} onChange={e => setFormTrabalhador(p => ({ ...p, nome: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={formTrabalhador.tipo} label="Tipo"
                  onChange={e => setFormTrabalhador(p => ({ ...p, tipo: e.target.value }))}>
                  {['CLT','Diarista','Terceirizado','Empreiteiro','Sazonal'].map(t =>
                    <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Função"
                placeholder="Ex: Tratorista, Peão, Operador"
                value={formTrabalhador.funcao} onChange={e => setFormTrabalhador(p => ({ ...p, funcao: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="CPF"
                value={formTrabalhador.cpf} onChange={e => setFormTrabalhador(p => ({ ...p, cpf: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Telefone"
                value={formTrabalhador.telefone} onChange={e => setFormTrabalhador(p => ({ ...p, telefone: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Valor Diária (R$)" type="number"
                value={formTrabalhador.valor_diaria} onChange={e => setFormTrabalhador(p => ({ ...p, valor_diaria: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Valor/Hora (R$)" type="number"
                value={formTrabalhador.valor_hora} onChange={e => setFormTrabalhador(p => ({ ...p, valor_hora: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Observações"
                value={formTrabalhador.observacoes} onChange={e => setFormTrabalhador(p => ({ ...p, observacoes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg({tipo:'',open:false})}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={() => salvar('trabalhador')}>
            {editandoId ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Cadastro Maquinário */}
      <Dialog open={dlg.open && dlg.tipo === 'maquinario'} onClose={() => setDlg({tipo:'',open:false})} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#6a1b9a', color: 'white' }}>
          <MaqIcon sx={{ mr: 1 }} />{editandoId ? 'Editar Máquina' : 'Cadastrar Máquina/Implemento'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth size="small" label="Nome / Identificação *" required
                value={formMaquinario.nome} onChange={e => setFormMaquinario(p => ({ ...p, nome: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={formMaquinario.tipo} label="Tipo"
                  onChange={e => setFormMaquinario(p => ({ ...p, tipo: e.target.value }))}>
                  {['Trator','Colheitadeira','Pulverizador','Plantadeira','Semeadeira','Grade','Caminhão','Implemento','Outro'].map(t =>
                    <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth size="small" label="Marca"
                value={formMaquinario.marca} onChange={e => setFormMaquinario(p => ({ ...p, marca: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth size="small" label="Modelo"
                value={formMaquinario.modelo} onChange={e => setFormMaquinario(p => ({ ...p, modelo: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth size="small" label="Ano Fab." type="number"
                value={formMaquinario.ano_fabricacao} onChange={e => setFormMaquinario(p => ({ ...p, ano_fabricacao: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth size="small" label="Placa"
                value={formMaquinario.placa} onChange={e => setFormMaquinario(p => ({ ...p, placa: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth size="small" label="Horímetro Atual (h)" type="number"
                value={formMaquinario.horimetro_atual} onChange={e => setFormMaquinario(p => ({ ...p, horimetro_atual: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth size="small" label="Custo/Hora (R$)" type="number"
                value={formMaquinario.valor_hora} onChange={e => setFormMaquinario(p => ({ ...p, valor_hora: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Capacidade"
                placeholder="Ex: 180 cv, Tanque 2000L"
                value={formMaquinario.capacidade} onChange={e => setFormMaquinario(p => ({ ...p, capacidade: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={formMaquinario.status} label="Status"
                  onChange={e => setFormMaquinario(p => ({ ...p, status: e.target.value }))}>
                  {['Disponível','Em Uso','Manutenção','Inativo'].map(s =>
                    <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Observações"
                value={formMaquinario.observacoes} onChange={e => setFormMaquinario(p => ({ ...p, observacoes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlg({tipo:'',open:false})}>Cancelar</Button>
          <Button variant="contained" sx={{ bgcolor: '#6a1b9a' }} onClick={() => salvar('maquinario')}>
            {editandoId ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgroOperacionalPage;
