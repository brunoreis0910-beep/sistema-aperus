import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Checkbox,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  AccountBalance as TribIcon,
  GridOn as GridIcon,
  Receipt as ReceiptIcon,
  AutoFixHigh as AutoFixIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import api from '../services/api';

// ── constantes ────────────────────────────────────────────────────────────────

const UFS_BRASIL = [
  'AC','AL','AM','AP','BA','CE','DF','ES','EX',
  'GO','MA','MG','MS','MT','PA','PB','PE','PI',
  'PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
];

const MODALIDADE_BC_ICMS = [
  { value: '0', label: '0 - Margem Valor Agregado (%)' },
  { value: '1', label: '1 - Pauta (valor)' },
  { value: '2', label: '2 - Preço Tabelado Máx. Sugerido' },
  { value: '3', label: '3 - Valor da Operação' },
];

const MODALIDADE_BC_ST = [
  { value: '0', label: '0 - Preço Tabelado ou Máximo Sugerido' },
  { value: '1', label: '1 - Lista Negativa (valor)' },
  { value: '2', label: '2 - Lista Positiva (valor)' },
  { value: '3', label: '3 - Lista Neutra (valor)' },
  { value: '4', label: '4 - Margem Valor Agregado (%)' },
  { value: '5', label: '5 - Pauta (valor)' },
  { value: '6', label: '6 - Valor da Operação' },
];

const CST_PIS_COFINS_OPTIONS = [
  { value: '01', label: '01 - Operação Tributável (Alíquota Normal)' },
  { value: '02', label: '02 - Operação Tributável (Alíquota Diferenciada)' },
  { value: '03', label: '03 - Operação Tributável (Quantidade x Alíquota)' },
  { value: '04', label: '04 - Operação Tributável Monofásica - Alíquota Zero' },
  { value: '05', label: '05 - Operação Tributável por Substituição Tributária' },
  { value: '06', label: '06 - Operação Tributável a Alíquota Zero' },
  { value: '07', label: '07 - Operação Isenta da Contribuição' },
  { value: '08', label: '08 - Operação Sem Incidência da Contribuição' },
  { value: '09', label: '09 - Operação com Suspensão da Contribuição' },
  { value: '49', label: '49 - Outras Operações de Saída' },
  { value: '99', label: '99 - Outras Operações' },
];

const CST_IPI_OPTIONS = [
  { value: '50', label: '50 - Saída Tributada' },
  { value: '51', label: '51 - Saída Tributável com Alíquota Zero' },
  { value: '52', label: '52 - Saída Isenta' },
  { value: '53', label: '53 - Saída Não-Tributada' },
  { value: '54', label: '54 - Saída Imune' },
  { value: '55', label: '55 - Saída com Suspensão' },
  { value: '99', label: '99 - Outras Saídas' },
];

const CABECALHO_VAZIO = {
  nome: '',
  regime_tributario: 'SIMPLES',
  icms_cst_csosn: '',
  icms_modalidade_bc: '3',
  cfop_padrao: '',
  cfop_devolucao: '',
  icmsst_modalidade_bc: '',
  antecipacao_tributaria: '0.0000',
  pis_cst: '01',
  pis_aliq: '0.6500',
  cofins_cst: '01',
  cofins_aliq: '3.0000',
  ipi_cst: '53',
  ipi_aliq: '0.0000',
  ipi_enquadramento: '999',
  considera_sintegra: false,
  observacao_nfe: '',
  ativo: true,
};

function NumCell({ value, onChange, disabled }) {
  return (
    <TextField
      value={value ?? '0.0000'}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      size="small"
      inputProps={{ style: { width: 72, textAlign: 'right', padding: '2px 4px', fontSize: '0.78rem' } }}
      variant="standard"
    />
  );
}

function TxtCell({ value, onChange, disabled, width = 60 }) {
  return (
    <TextField
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      size="small"
      inputProps={{ style: { width, padding: '2px 4px', fontSize: '0.78rem' } }}
      variant="standard"
      placeholder="—"
    />
  );
}

export default function TributacaoConfig() {
  const [regimeTab, setRegimeTab] = useState('SIMPLES'); // 'SIMPLES', 'NORMAL' ou 'CORRECAO_MASSA'
  const [tipos, setTipos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Perfil selecionado
  const [selectedId, setSelectedId] = useState(null);
  const [cabecalho, setCabecalho] = useState(CABECALHO_VAZIO);
  const [gridUF, setGridUF] = useState([]);
  const [dirty, setDirty] = useState(false);

  // Diálogos
  const [dlgNovo, setDlgNovo] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [dlgExcluir, setDlgExcluir] = useState(false);
  const [cfopLote, setCfopLote] = useState('');

  // ── ESTADOS DA ABA CORREÇÃO EM MASSA ────────────────────────────────────────
  const [filtroMassa, setFiltroMassa] = useState({
    id_grupo: '',
    referencia: '',
    ncm: '',
  });

  const [massaConfig, setMassaConfig] = useState({
    tipo_tributacao_id: '',
    ncm_novo: '',
    cfop_novo: '',
    cst_icms_novo: '',
    csosn_novo: '',
    icms_aliquota_nova: '',
    pis_cst_novo: '',
    pis_aliquota_nova: '',
    cofins_cst_novo: '',
    cofins_aliquota_nova: '',
    ipi_cst_novo: '',
    ipi_aliquota_nova: '',
  });

  const [simulacaoMassa, setSimulacaoMassa] = useState([]);
  const [selecionadosMassa, setSelecionadosMassa] = useState(new Set());
  const [carregandoMassa, setCarregandoMassa] = useState(false);

  // ── CARGA INICIAL ───────────────────────────────────────────────────────────

  const carregarTipos = useCallback(async () => {
    setLoading(true);
    try {
      const [respTipos, respGrupos] = await Promise.all([
        api.get('/api/tipos-tributacao/?ativo=true'),
        api.get('/api/grupos-produto/'),
      ]);
      const dataTipos = Array.isArray(respTipos.data) ? respTipos.data : (respTipos.data.results ?? []);
      const dataGrupos = Array.isArray(respGrupos.data) ? respGrupos.data : (respGrupos.data.results ?? []);
      setTipos(dataTipos);
      setGrupos(dataGrupos);
    } catch {
      setError('Erro ao carregar dados de tributação.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarTipos(); }, [carregarTipos]);

  const tiposFiltrados = tipos.filter((t) => (t.regime_tributario || 'SIMPLES') === regimeTab);

  // ── SELECIONAR PERFIL ───────────────────────────────────────────────────────

  const selecionarTipo = useCallback(async (tipo) => {
    if (dirty) {
      if (!window.confirm('Há alterações não salvas. Deseja descartar?')) return;
    }
    setSelectedId(tipo.id);
    setCabecalho({
      nome:                   tipo.nome,
      regime_tributario:      tipo.regime_tributario ?? 'SIMPLES',
      icms_cst_csosn:         tipo.icms_cst_csosn ?? '',
      icms_modalidade_bc:     tipo.icms_modalidade_bc ?? '3',
      cfop_padrao:            tipo.cfop_padrao ?? '',
      cfop_devolucao:         tipo.cfop_devolucao ?? '',
      icmsst_modalidade_bc:   tipo.icmsst_modalidade_bc ?? '',
      antecipacao_tributaria: tipo.antecipacao_tributaria ?? '0.0000',
      pis_cst:                tipo.pis_cst ?? '01',
      pis_aliq:               tipo.pis_aliq ?? '0.6500',
      cofins_cst:             tipo.cofins_cst ?? '01',
      cofins_aliq:            tipo.cofins_aliq ?? '3.0000',
      ipi_cst:                tipo.ipi_cst ?? '53',
      ipi_aliq:               tipo.ipi_aliq ?? '0.0000',
      ipi_enquadramento:      tipo.ipi_enquadramento ?? '999',
      considera_sintegra:     tipo.considera_sintegra ?? false,
      observacao_nfe:         tipo.observacao_nfe ?? '',
      ativo:                  tipo.ativo ?? true,
    });

    try {
      const resp = await api.get(`/api/tributacao-uf/?tipo_tributacao_id=${tipo.id}`);
      const linhas = Array.isArray(resp.data) ? resp.data : (resp.data.results ?? []);
      const existentes = new Map(linhas.map((l) => [l.uf_destino, l]));
      const grid = UFS_BRASIL.map((uf) =>
        existentes.get(uf) ?? {
          id: null,
          tipo_tributacao: tipo.id,
          uf_destino: uf,
          cfop_saida: '',
          icms_aliq: '0.0000',
          reducao_bc_perc: '0.0000',
          icmsst_aliq: '0.0000',
          icmsst_mva_perc: '0.0000',
          reducao_bc_st_perc: '0.0000',
          frete_perc: '0.0000',
          seguro_perc: '0.0000',
          outras_despesas_perc: '0.0000',
          fcp_aliq: '0.0000',
        }
      );
      setGridUF(grid);
    } catch {
      setError('Erro ao carregar alíquotas por UF.');
    }
    setDirty(false);
  }, [dirty]);

  const setCab = (field, value) => {
    setCabecalho((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const setUFCell = (index, field, value) => {
    setGridUF((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setDirty(true);
  };

  const salvar = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/tipos-tributacao/${selectedId}/`, cabecalho);
      for (const linha of gridUF) {
        const payload = {
          tipo_tributacao: selectedId,
          uf_destino: linha.uf_destino,
          cfop_saida: linha.cfop_saida || null,
          icms_aliq: linha.icms_aliq,
          reducao_bc_perc: linha.reducao_bc_perc,
          icmsst_aliq: linha.icmsst_aliq,
          icmsst_mva_perc: linha.icmsst_mva_perc,
          reducao_bc_st_perc: linha.reducao_bc_st_perc,
          frete_perc: linha.frete_perc,
          seguro_perc: linha.seguro_perc,
          outras_despesas_perc: linha.outras_despesas_perc,
          fcp_aliq: linha.fcp_aliq,
        };
        if (linha.id) {
          await api.patch(`/api/tributacao-uf/${linha.id}/`, payload);
        } else {
          const criada = await api.post('/api/tributacao-uf/', payload);
          linha.id = criada.data.id;
        }
      }
      setSuccess('Salvo com sucesso!');
      setDirty(false);
      await carregarTipos();
    } catch (err) {
      const detail = err?.response?.data ? JSON.stringify(err.response.data) : err?.message || 'Erro desconhecido';
      setError(`Erro ao salvar: ${detail}`);
    } finally {
      setSaving(false);
    }
  };

  const aplicarCfopLote = () => {
    if (!cfopLote.trim()) return;
    setGridUF((prev) => prev.map((l) => ({ ...l, cfop_saida: cfopLote.trim() })));
    setCab('cfop_padrao', cfopLote.trim());
    setCfopLote('');
    setDirty(true);
  };

  const criarNovoPerfil = async () => {
    if (!novoNome.trim()) return;
    setSaving(true);
    try {
      const resp = await api.post('/api/tipos-tributacao/', {
        nome: novoNome.trim(),
        regime_tributario: regimeTab,
        ativo: true
      });
      await api.post(`/api/tipos-tributacao/${resp.data.id}/popular_ufs/`);
      setDlgNovo(false);
      setNovoNome('');
      await carregarTipos();
      selecionarTipo(resp.data);
    } catch {
      setError('Erro ao criar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const excluirPerfil = async () => {
    setSaving(true);
    try {
      await api.delete(`/api/tipos-tributacao/${selectedId}/`);
      setDlgExcluir(false);
      setSelectedId(null);
      setCabecalho(CABECALHO_VAZIO);
      setGridUF([]);
      setDirty(false);
      await carregarTipos();
      setSuccess('Perfil excluído.');
    } catch {
      setError('Não foi possível excluir o perfil.');
    } finally {
      setSaving(false);
    }
  };

  // ── FUNÇÕES DE CORREÇÃO EM MASSA ───────────────────────────────────────────

  const buscarEsimularMassa = async () => {
    setCarregandoMassa(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        simulacao: true,
        id_grupo: filtroMassa.id_grupo || null,
        referencia: filtroMassa.referencia || null,
        ncm: filtroMassa.ncm || null,
        tipo_tributacao_id: massaConfig.tipo_tributacao_id || null,
        ncm_novo: massaConfig.ncm_novo || null,
        cfop_novo: massaConfig.cfop_novo || null,
        cst_icms_novo: massaConfig.cst_icms_novo || null,
        csosn_novo: massaConfig.csosn_novo || null,
        icms_aliquota_nova: massaConfig.icms_aliquota_nova || null,
        pis_cst_novo: massaConfig.pis_cst_novo || null,
        pis_aliquota_nova: massaConfig.pis_aliquota_nova || null,
        cofins_cst_novo: massaConfig.cofins_cst_novo || null,
        cofins_aliquota_nova: massaConfig.cofins_aliquota_nova || null,
        ipi_cst_novo: massaConfig.ipi_cst_novo || null,
        ipi_aliquota_nova: massaConfig.ipi_aliquota_nova || null,
      };
      const resp = await api.post('/api/produtos/alteracao-tributaria-em-massa/', payload);
      const lista = resp.data.simulacao || [];
      setSimulacaoMassa(lista);
      setSelecionadosMassa(new Set(lista.map((item) => item.id_produto)));
      if (lista.length === 0) {
        setError('Nenhum produto encontrado com os filtros informados.');
      } else {
        setSuccess(`${lista.length} produtos encontrados para simulação.`);
      }
    } catch (err) {
      setError('Erro ao simular alteração em massa.');
    } finally {
      setCarregandoMassa(false);
    }
  };

  const aplicarAlteracaoMassa = async () => {
    if (selecionadosMassa.size === 0) {
      alert('Selecione pelo menos um produto no grid para aplicar as alterações.');
      return;
    }

    if (!window.confirm(`Confirma aplicar a alteração tributária em massa para ${selecionadosMassa.size} produtos selecionados?`)) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        simulacao: false,
        produto_ids: Array.from(selecionadosMassa),
        tipo_tributacao_id: massaConfig.tipo_tributacao_id || null,
        ncm_novo: massaConfig.ncm_novo || null,
        cfop_novo: massaConfig.cfop_novo || null,
        cst_icms_novo: massaConfig.cst_icms_novo || null,
        csosn_novo: massaConfig.csosn_novo || null,
        icms_aliquota_nova: massaConfig.icms_aliquota_nova || null,
        pis_cst_novo: massaConfig.pis_cst_novo || null,
        pis_aliquota_nova: massaConfig.pis_aliquota_nova || null,
        cofins_cst_novo: massaConfig.cofins_cst_novo || null,
        cofins_aliquota_nova: massaConfig.cofins_aliquota_nova || null,
        ipi_cst_novo: massaConfig.ipi_cst_novo || null,
        ipi_aliquota_nova: massaConfig.ipi_aliquota_nova || null,
      };

      const resp = await api.post('/api/produtos/alteracao-tributaria-em-massa/', payload);
      setSuccess(resp.data.mensagem || 'Produtos atualizados com sucesso!');
      setSimulacaoMassa([]);
      setSelecionadosMassa(new Set());
    } catch (err) {
      setError('Erro ao aplicar alteração em massa.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectAllMassa = (e) => {
    if (e.target.checked) {
      setSelecionadosMassa(new Set(simulacaoMassa.map((item) => item.id_produto)));
    } else {
      setSelecionadosMassa(new Set());
    }
  };

  const toggleSelectRowMassa = (id) => {
    setSelecionadosMassa((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 2 }}>
      {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Navegação por Regime e Correção em Massa */}
      <Paper sx={{ mb: 2, px: 2, pt: 1, pb: 0.5 }}>
        <Tabs
          value={regimeTab}
          onChange={(e, val) => {
            if (dirty && !window.confirm('Há alterações não salvas. Deseja trocar de aba?')) return;
            setRegimeTab(val);
            setSelectedId(null);
            setCabecalho(CABECALHO_VAZIO);
            setGridUF([]);
            setDirty(false);
          }}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Simples Nacional" value="SIMPLES" sx={{ fontWeight: 'bold' }} />
          <Tab label="Regime Normal (Lucro Presumido / Real)" value="NORMAL" sx={{ fontWeight: 'bold' }} />
          <Tab
            label="Correção Tributária em Massa"
            value="CORRECAO_MASSA"
            icon={<AutoFixIcon fontSize="small" />}
            iconPosition="start"
            sx={{ fontWeight: 'bold', color: 'secondary.main' }}
          />
        </Tabs>
      </Paper>

      {/* ── SE ESTIVER NA ABA CORREÇÃO EM MASSA ────────────────────────────────── */}
      {regimeTab === 'CORRECAO_MASSA' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Painel 1: Filtros de Busca de Produtos */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <SearchIcon fontSize="small" /> 1. Filtros para Selecionar Produtos
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Grupo de Produtos</InputLabel>
                  <Select
                    value={filtroMassa.id_grupo}
                    onChange={(e) => setFiltroMassa({ ...filtroMassa, id_grupo: e.target.value })}
                    label="Grupo de Produtos"
                  >
                    <MenuItem value=""><em>Todos os Grupos</em></MenuItem>
                    {grupos.map((g) => (
                      <MenuItem key={g.id_grupo} value={g.id_grupo}>{g.nome_grupo}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  label="Referência do Produto"
                  value={filtroMassa.referencia}
                  onChange={(e) => setFiltroMassa({ ...filtroMassa, referencia: e.target.value })}
                  fullWidth size="small"
                  placeholder="Ex: REF-1020"
                />
              </Grid>

              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  label="NCM (Código ou Prefixo)"
                  value={filtroMassa.ncm}
                  onChange={(e) => setFiltroMassa({ ...filtroMassa, ncm: e.target.value })}
                  fullWidth size="small"
                  placeholder="Ex: 8471"
                />
              </Grid>

              <Grid item xs={12} sm={12} md={3}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={carregandoMassa ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
                  onClick={buscarEsimularMassa}
                  disabled={carregandoMassa}
                >
                  {carregandoMassa ? 'Buscando...' : 'Filtrar & Simular'}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Painel 2: Formulário de tributação a ser aplicada em massa */}
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: 'secondary.main' }}>
              <AutoFixIcon fontSize="small" /> 2. Tributação a ser Aplicada em Massa
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vincular Perfil Tributário</InputLabel>
                  <Select
                    value={massaConfig.tipo_tributacao_id}
                    onChange={(e) => setMassaConfig({ ...massaConfig, tipo_tributacao_id: e.target.value })}
                    label="Vincular Perfil Tributário"
                  >
                    <MenuItem value=""><em>Manter Perfil Atual</em></MenuItem>
                    {tipos.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{t.nome} ({t.regime_tributario})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  label="Novo NCM"
                  value={massaConfig.ncm_novo}
                  onChange={(e) => setMassaConfig({ ...massaConfig, ncm_novo: e.target.value })}
                  fullWidth size="small" inputProps={{ maxLength: 10 }}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  label="Novo CFOP"
                  value={massaConfig.cfop_novo}
                  onChange={(e) => setMassaConfig({ ...massaConfig, cfop_novo: e.target.value })}
                  fullWidth size="small" inputProps={{ maxLength: 5 }}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  label="Novo CST ICMS"
                  value={massaConfig.cst_icms_novo}
                  onChange={(e) => setMassaConfig({ ...massaConfig, cst_icms_novo: e.target.value })}
                  fullWidth size="small" inputProps={{ maxLength: 3 }}
                  placeholder="Ex: 00, 60"
                />
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  label="Novo CSOSN ICMS"
                  value={massaConfig.csosn_novo}
                  onChange={(e) => setMassaConfig({ ...massaConfig, csosn_novo: e.target.value })}
                  fullWidth size="small" inputProps={{ maxLength: 4 }}
                  placeholder="Ex: 102, 500"
                />
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Novo CST PIS</InputLabel>
                  <Select
                    value={massaConfig.pis_cst_novo}
                    onChange={(e) => setMassaConfig({ ...massaConfig, pis_cst_novo: e.target.value })}
                    label="Novo CST PIS"
                  >
                    <MenuItem value=""><em>Manter Atual</em></MenuItem>
                    {CST_PIS_COFINS_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Novo CST COFINS</InputLabel>
                  <Select
                    value={massaConfig.cofins_cst_novo}
                    onChange={(e) => setMassaConfig({ ...massaConfig, cofins_cst_novo: e.target.value })}
                    label="Novo CST COFINS"
                  >
                    <MenuItem value=""><em>Manter Atual</em></MenuItem>
                    {CST_PIS_COFINS_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Novo CST IPI</InputLabel>
                  <Select
                    value={massaConfig.ipi_cst_novo}
                    onChange={(e) => setMassaConfig({ ...massaConfig, ipi_cst_novo: e.target.value })}
                    label="Novo CST IPI"
                  >
                    <MenuItem value=""><em>Manter Atual</em></MenuItem>
                    {CST_IPI_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Painel 3: Grid de Pré-Visualização da Alteração em Massa */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Produtos Encontrados para Alteração ({selecionadosMassa.size} de {simulacaoMassa.length} selecionados)
              </Typography>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={aplicarAlteracaoMassa}
                disabled={saving || selecionadosMassa.size === 0}
              >
                {saving ? 'Aplicando...' : `Aplicar Alteração em Massa (${selecionadosMassa.size})`}
              </Button>
            </Box>

            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selecionadosMassa.size > 0 && selecionadosMassa.size < simulacaoMassa.length}
                        checked={simulacaoMassa.length > 0 && selecionadosMassa.size === simulacaoMassa.length}
                        onChange={toggleSelectAllMassa}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Cód</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nome do Produto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Grupo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Ref.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>NCM Atual → Novo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>CFOP</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>CST/CSOSN ICMS</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>PIS</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>COFINS</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>IPI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {simulacaoMassa.map((row) => {
                    const isSelected = selecionadosMassa.has(row.id_produto);
                    return (
                      <TableRow key={row.id_produto} hover selected={isSelected}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={isSelected} onChange={() => toggleSelectRowMassa(row.id_produto)} />
                        </TableCell>
                        <TableCell>{row.codigo}</TableCell>
                        <TableCell fontWeight="bold">{row.nome}</TableCell>
                        <TableCell>{row.grupo}</TableCell>
                        <TableCell>{row.referencia}</TableCell>
                        <TableCell>
                          {row.ncm_atual} {row.ncm_novo !== row.ncm_atual && <Chip label={`→ ${row.ncm_novo}`} color="warning" size="small" />}
                        </TableCell>
                        <TableCell>{row.cfop_novo !== '-' ? row.cfop_novo : row.cfop_atual}</TableCell>
                        <TableCell>{row.cst_icms_atual !== '-' ? row.cst_icms_atual : row.csosn_atual}</TableCell>
                        <TableCell>{row.pis_cst_atual}</TableCell>
                        <TableCell>{row.cofins_cst_atual}</TableCell>
                        <TableCell>{row.ipi_cst_atual}</TableCell>
                      </TableRow>
                    );
                  })}
                  {simulacaoMassa.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        Utilize os filtros acima e clique em "Filtrar & Simular" para visualizar os produtos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      ) : (
        /* ── SE ESTIVER NA ABA SIMPLES OU REGIME NORMAL ────────────────────────── */
        <Grid container spacing={2} sx={{ height: 'calc(100vh - 280px)', minHeight: 500 }}>
          {/* Lista de perfis do Regime Selecionado */}
          <Grid item xs={12} sm={3} md={2.5}>
            <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Perfis ({regimeTab === 'SIMPLES' ? 'Simples' : 'Normal'})
                </Typography>
                <Tooltip title="Novo Perfil">
                  <IconButton size="small" color="primary" onClick={() => setDlgNovo(true)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List dense sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
                  {tiposFiltrados.map((t) => (
                    <ListItem key={t.id} disablePadding>
                      <ListItemButton
                        selected={selectedId === t.id}
                        onClick={() => selecionarTipo(t)}
                        sx={{ py: 0.75 }}
                      >
                        <ListItemText
                          primary={t.nome}
                          secondary={t.icms_cst_csosn ? `CST/CSOSN: ${t.icms_cst_csosn}` : null}
                          primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: selectedId === t.id ? 700 : 400 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  {tiposFiltrados.length === 0 && (
                    <Typography sx={{ p: 2, color: 'text.secondary', fontSize: '0.8rem' }}>
                      Nenhum perfil cadastrado para este regime.
                    </Typography>
                  )}
                </List>
              )}

              <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  fullWidth size="small" startIcon={<RefreshIcon />}
                  onClick={carregarTipos} disabled={loading}
                >
                  Atualizar
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Painel direito: Configuração do Perfil Selecionado */}
          {selectedId ? (
            <Grid item xs={12} sm={9} md={9.5} sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ flex: 1, fontWeight: 'bold' }}>
                  {cabecalho.nome}
                  <Chip
                    label={regimeTab === 'SIMPLES' ? 'Simples Nacional' : 'Regime Normal'}
                    color={regimeTab === 'SIMPLES' ? 'success' : 'info'}
                    size="small" sx={{ ml: 1 }}
                  />
                  {dirty && <Chip label="Alterado" color="warning" size="small" sx={{ ml: 1 }} />}
                </Typography>
                <Button
                  variant="contained" startIcon={<SaveIcon />} onClick={salvar}
                  disabled={saving || !dirty}
                  size="small"
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </Button>
                <Button
                  variant="outlined" color="error" startIcon={<DeleteIcon />}
                  onClick={() => setDlgExcluir(true)} size="small"
                >
                  Excluir
                </Button>
              </Box>

              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TribIcon fontSize="small" color="primary" /> Configuração ICMS & Operações
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Nome do Perfil"
                      value={cabecalho.nome}
                      onChange={(e) => setCab('nome', e.target.value)}
                      fullWidth size="small"
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      label={regimeTab === 'SIMPLES' ? 'CSOSN (ex: 102, 500)' : 'CST ICMS (ex: 00, 60)'}
                      value={cabecalho.icms_cst_csosn}
                      onChange={(e) => setCab('icms_cst_csosn', e.target.value)}
                      fullWidth size="small"
                      inputProps={{ maxLength: 4 }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Modalidade BC ICMS</InputLabel>
                      <Select
                        value={cabecalho.icms_modalidade_bc}
                        onChange={(e) => setCab('icms_modalidade_bc', e.target.value)}
                        label="Modalidade BC ICMS"
                      >
                        {MODALIDADE_BC_ICMS.map((m) => (
                          <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Modalidade ICMS ST</InputLabel>
                      <Select
                        value={cabecalho.icmsst_modalidade_bc ?? ''}
                        onChange={(e) => setCab('icmsst_modalidade_bc', e.target.value)}
                        label="Modalidade ICMS ST"
                      >
                        <MenuItem value=""><em>Selecione</em></MenuItem>
                        {MODALIDADE_BC_ST.map((m) => (
                          <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={6} sm={2}>
                    <TextField
                      label="CFOP Padrão"
                      value={cabecalho.cfop_padrao}
                      onChange={(e) => setCab('cfop_padrao', e.target.value)}
                      fullWidth size="small" inputProps={{ maxLength: 5 }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      label="CFOP Devolução"
                      value={cabecalho.cfop_devolucao}
                      onChange={(e) => setCab('cfop_devolucao', e.target.value)}
                      fullWidth size="small" inputProps={{ maxLength: 5 }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      label="Antecipação Trib. (%)"
                      value={cabecalho.antecipacao_tributaria}
                      onChange={(e) => setCab('antecipacao_tributaria', e.target.value)}
                      fullWidth size="small" type="number"
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={cabecalho.considera_sintegra}
                          onChange={(e) => setCab('considera_sintegra', e.target.checked)}
                          size="small"
                        />
                      }
                      label="SINTEGRA"
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={cabecalho.ativo}
                          onChange={(e) => setCab('ativo', e.target.checked)}
                          size="small"
                        />
                      }
                      label="Ativo"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Observação NF-e"
                      value={cabecalho.observacao_nfe}
                      onChange={(e) => setCab('observacao_nfe', e.target.value)}
                      fullWidth size="small" multiline rows={2}
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: 'secondary.main' }}>
                  <ReceiptIcon fontSize="small" /> Tributação Federal (PIS, COFINS e IPI)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>CST PIS</InputLabel>
                      <Select
                        value={cabecalho.pis_cst ?? '01'}
                        onChange={(e) => setCab('pis_cst', e.target.value)}
                        label="CST PIS"
                      >
                        {CST_PIS_COFINS_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Alíquota PIS (%)"
                      value={cabecalho.pis_aliq}
                      onChange={(e) => setCab('pis_aliq', e.target.value)}
                      fullWidth size="small" type="number"
                      inputProps={{ step: '0.01' }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>CST COFINS</InputLabel>
                      <Select
                        value={cabecalho.cofins_cst ?? '01'}
                        onChange={(e) => setCab('cofins_cst', e.target.value)}
                        label="CST COFINS"
                      >
                        {CST_PIS_COFINS_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Alíquota COFINS (%)"
                      value={cabecalho.cofins_aliq}
                      onChange={(e) => setCab('cofins_aliq', e.target.value)}
                      fullWidth size="small" type="number"
                      inputProps={{ step: '0.01' }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>CST IPI</InputLabel>
                      <Select
                        value={cabecalho.ipi_cst ?? '53'}
                        onChange={(e) => setCab('ipi_cst', e.target.value)}
                        label="CST IPI"
                      >
                        {CST_IPI_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Alíquota IPI (%)"
                      value={cabecalho.ipi_aliq}
                      onChange={(e) => setCab('ipi_aliq', e.target.value)}
                      fullWidth size="small" type="number"
                      inputProps={{ step: '0.01' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Cód. Enquadramento IPI"
                      value={cabecalho.ipi_enquadramento}
                      onChange={(e) => setCab('ipi_enquadramento', e.target.value)}
                      fullWidth size="small"
                      inputProps={{ maxLength: 3 }}
                      placeholder="999"
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 300 }}>
                <Box sx={{
                  p: 1.5, display: 'flex', alignItems: 'center', gap: 1,
                  borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap'
                }}>
                  <GridIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
                    Alíquotas por UF de Destino
                  </Typography>
                  <TextField
                    placeholder="CFOP p/ todas as UFs"
                    value={cfopLote}
                    onChange={(e) => setCfopLote(e.target.value)}
                    size="small"
                    inputProps={{ maxLength: 5, style: { width: 120 } }}
                  />
                  <Button
                    variant="outlined" size="small"
                    onClick={aplicarCfopLote} disabled={!cfopLote.trim()}
                  >
                    Atualiza CFOP Grid
                  </Button>
                </Box>

                <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {['UF', 'CFOP Saída', 'Alíq. ICMS %', 'Red. BC %', 'ST ICMS %', 'MVA %', 'Red. BC ST %', 'Frete %', 'Seguro %', 'Outras %', 'FCP %'].map((h) => (
                          <TableCell
                            key={h}
                            sx={{ fontWeight: 'bold', fontSize: '0.72rem', whiteSpace: 'nowrap', bgcolor: 'grey.100', py: 0.5 }}
                          >
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gridUF.map((linha, i) => (
                        <TableRow
                          key={linha.uf_destino}
                          sx={{
                            '&:hover': { bgcolor: 'action.hover' },
                            bgcolor: selectedId && i % 2 === 0 ? 'transparent' : 'grey.50',
                          }}
                        >
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.82rem', py: 0.25, pl: 1 }}>
                            {linha.uf_destino}
                          </TableCell>
                          <TableCell sx={{ py: 0.25 }}>
                            <TxtCell value={linha.cfop_saida} onChange={(v) => setUFCell(i, 'cfop_saida', v)} />
                          </TableCell>
                          <TableCell sx={{ py: 0.25 }}>
                            <NumCell value={linha.icms_aliq} onChange={(v) => setUFCell(i, 'icms_aliq', v)} />
                          </TableCell>
                          <TableCell sx={{ py: 0.25 }}>
                            <NumCell value={linha.reducao_bc_perc} onChange={(v) => setUFCell(i, 'reducao_bc_perc', v)} />
                          </TableCell>
                          <TableCell sx={{ py: 0.25 }}>
                            <NumCell value={linha.icmsst_aliq} onChange={(v) => setUFCell(i, 'icmsst_aliq', v)} />
                          </TableCell>
                          <TableCell sx={{ py: 0.25 }}>
                            <NumCell value={linha.icmsst_mva_perc} onChange={(v) => setUFCell(i, 'icmsst_mva_perc', v)} />
                          </TableCell>
                          <TableCell sx={{ py: 0.25 }}>
                            <NumCell value={linha.reducao_bc_st_perc} onChange={(v) => setUFCell(i, 'reducao_bc_st_perc', v)} />
                          </TableCell>
                          <TableCell sx={{ py: 0.25 }}>
                            <NumCell value={linha.frete_perc} onChange={(v) => setUFCell(i, 'frete_perc', v)} />
                          </TableCell>
                          <TableCell sx={{ py: 0.25 }}>
                            <NumCell value={linha.seguro_perc} onChange={(v) => setUFCell(i, 'seguro_perc', v)} />
                          </TableCell>
                          <TableCell sx={{ py: 0.25 }}>
                            <NumCell value={linha.outras_despesas_perc} onChange={(v) => setUFCell(i, 'outras_despesas_perc', v)} />
                          </TableCell>
                          <TableCell sx={{ py: 0.25 }}>
                            <NumCell value={linha.fcp_aliq} onChange={(v) => setUFCell(i, 'fcp_aliq', v)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          ) : (
            <Grid item xs={12} sm={9} md={9.5}>
              <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                <TribIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography variant="body1">
                  Selecione um perfil de tributação ao lado para visualizar e editar as alíquotas.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* ── Diálogo Novo Perfil ──────────────────────────────────────────────── */}
      <Dialog open={dlgNovo} onClose={() => setDlgNovo(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Novo Perfil de Tributação ({regimeTab === 'SIMPLES' ? 'Simples Nacional' : 'Regime Normal'})</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus margin="dense" label="Nome do Perfil" fullWidth size="small"
            value={novoNome} onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Ex: CONSUMIDOR, REVENDEDOR, ISENTO..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgNovo(false)}>Cancelar</Button>
          <Button onClick={criarNovoPerfil} variant="contained" disabled={saving || !novoNome.trim()}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Diálogo Excluir Perfil ───────────────────────────────────────────── */}
      <Dialog open={dlgExcluir} onClose={() => setDlgExcluir(false)} maxWidth="xs">
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Deseja realmente excluir o perfil <strong>{cabecalho.nome}</strong>? Essa ação excluirá todas as alíquotas por UF associadas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgExcluir(false)}>Cancelar</Button>
          <Button onClick={excluirPerfil} color="error" variant="contained" disabled={saving}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
