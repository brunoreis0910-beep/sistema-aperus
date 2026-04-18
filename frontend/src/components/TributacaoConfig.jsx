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
  Divider,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  AccountBalance as TribIcon,
  GridOn as GridIcon,
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

const CABECALHO_VAZIO = {
  nome: '',
  icms_cst_csosn: '',
  icms_modalidade_bc: '3',
  cfop_padrao: '',
  cfop_devolucao: '',
  icmsst_modalidade_bc: '',
  antecipacao_tributaria: '0.0000',
  considera_sintegra: false,
  observacao_nfe: '',
  ativo: true,
};

// célula numérica editável no grid
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

// célula de texto (CFOP)
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

// ── componente principal ──────────────────────────────────────────────────────

export default function TributacaoConfig() {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // perfil selecionado
  const [selectedId, setSelectedId] = useState(null);
  const [cabecalho, setCabecalho] = useState(CABECALHO_VAZIO);
  const [gridUF, setGridUF] = useState([]);   // lista de TributacaoUF
  const [dirty, setDirty] = useState(false);

  // diálogo novo perfil
  const [dlgNovo, setDlgNovo] = useState(false);
  const [novoNome, setNovoNome] = useState('');

  // diálogo excluir
  const [dlgExcluir, setDlgExcluir] = useState(false);

  // CFOP em lote
  const [cfopLote, setCfopLote] = useState('');

  // ── carga inicial ───────────────────────────────────────────────────────────

  const carregarTipos = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get('/api/tipos-tributacao/?ativo=true');
      const data = Array.isArray(resp.data) ? resp.data : (resp.data.results ?? []);
      setTipos(data);
    } catch (err) {
      setError('Erro ao carregar perfis de tributação.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarTipos(); }, [carregarTipos]);

  // ── selecionar perfil ───────────────────────────────────────────────────────

  const selecionarTipo = useCallback(async (tipo) => {
    if (dirty) {
      if (!window.confirm('Há alterações não salvas. Deseja descartar?')) return;
    }
    setSelectedId(tipo.id);
    setCabecalho({
      nome:                   tipo.nome,
      icms_cst_csosn:         tipo.icms_cst_csosn ?? '',
      icms_modalidade_bc:     tipo.icms_modalidade_bc ?? '3',
      cfop_padrao:            tipo.cfop_padrao ?? '',
      cfop_devolucao:         tipo.cfop_devolucao ?? '',
      icmsst_modalidade_bc:   tipo.icmsst_modalidade_bc ?? '',
      antecipacao_tributaria: tipo.antecipacao_tributaria ?? '0.0000',
      considera_sintegra:     tipo.considera_sintegra ?? false,
      observacao_nfe:         tipo.observacao_nfe ?? '',
      ativo:                  tipo.ativo ?? true,
    });

    // carrega grid de UF
    try {
      const resp = await api.get(`/api/tributacao-uf/?tipo_tributacao_id=${tipo.id}`);
      const linhas = Array.isArray(resp.data) ? resp.data : (resp.data.results ?? []);

      // garante todas as UFs no grid (criar linhas zeradas para as que faltam)
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

  // ── editar cabeçalho ────────────────────────────────────────────────────────

  const setCab = (field, value) => {
    setCabecalho((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  // ── editar célula do grid ───────────────────────────────────────────────────

  const setUFCell = (index, field, value) => {
    setGridUF((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setDirty(true);
  };

  // ── salvar ──────────────────────────────────────────────────────────────────

  const salvar = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // 1. Salva o cabeçalho
      await api.patch(`/api/tipos-tributacao/${selectedId}/`, cabecalho);

      // 2. Salva cada linha do grid (PATCH se tem id, POST se não tem)
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
          // atualiza id local para evitar POST duplo
          linha.id = criada.data.id;
        }
      }

      setSuccess('Salvo com sucesso!');
      setDirty(false);
      await carregarTipos();
    } catch (err) {
      const detail = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || 'Erro desconhecido';
      setError(`Erro ao salvar: ${detail}`);
    } finally {
      setSaving(false);
    }
  };

  // ── atualizar CFOP em lote ──────────────────────────────────────────────────

  const aplicarCfopLote = () => {
    if (!cfopLote.trim()) return;
    setGridUF((prev) => prev.map((l) => ({ ...l, cfop_saida: cfopLote.trim() })));
    setCab('cfop_padrao', cfopLote.trim());
    setCfopLote('');
    setDirty(true);
  };

  // ── novo perfil ─────────────────────────────────────────────────────────────

  const criarNovoPerfil = async () => {
    if (!novoNome.trim()) return;
    setSaving(true);
    try {
      const resp = await api.post('/api/tipos-tributacao/', { nome: novoNome.trim(), ativo: true });
      // popula UFs automaticamente
      await api.post(`/api/tipos-tributacao/${resp.data.id}/popular_ufs/`);
      setDlgNovo(false);
      setNovoNome('');
      await carregarTipos();
      // seleciona o recém-criado
      selecionarTipo(resp.data);
    } catch {
      setError('Erro ao criar perfil. O nome pode já estar em uso.');
    } finally {
      setSaving(false);
    }
  };

  // ── excluir perfil ──────────────────────────────────────────────────────────

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

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 2 }}>
      {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={2} sx={{ height: 'calc(100vh - 220px)', minHeight: 500 }}>

        {/* ── Lista de perfis ─────────────────────────────────────────────── */}
        <Grid item xs={12} sm={3} md={2}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight="bold">Tipo Tributação</Typography>
              <Tooltip title="Novo perfil">
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
                {tipos.map((t) => (
                  <ListItem key={t.id} disablePadding>
                    <ListItemButton
                      selected={selectedId === t.id}
                      onClick={() => selecionarTipo(t)}
                      sx={{ py: 0.75 }}
                    >
                      <ListItemText
                        primary={t.nome}
                        primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: selectedId === t.id ? 700 : 400 }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                {tipos.length === 0 && (
                  <Typography sx={{ p: 2, color: 'text.secondary', fontSize: '0.8rem' }}>
                    Nenhum perfil cadastrado.
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

        {/* ── Painel direito ───────────────────────────────────────────────── */}
        {selectedId ? (
          <Grid item xs={12} sm={9} md={10} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Barra de ações */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ flex: 1, fontWeight: 'bold' }}>
                {cabecalho.nome}
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

            {/* ── Dados Gerais (cabeçalho) ─────────────────────────────────── */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TribIcon fontSize="small" /> Dados Gerais
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
                    label="CST / CSOSN"
                    value={cabecalho.icms_cst_csosn}
                    onChange={(e) => setCab('icms_cst_csosn', e.target.value)}
                    fullWidth size="small"
                    inputProps={{ maxLength: 3 }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Modalidade ICMS</InputLabel>
                    <Select
                      value={cabecalho.icms_modalidade_bc}
                      onChange={(e) => setCab('icms_modalidade_bc', e.target.value)}
                      label="Modalidade ICMS"
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

            {/* ── Grid de alíquotas por UF ──────────────────────────────────── */}
            <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{
                p: 1.5, display: 'flex', alignItems: 'center', gap: 1,
                borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap'
              }}>
                <GridIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
                  Alíquotas por UF de Destino
                </Typography>
                {/* Atualizar CFOP em lote */}
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
          <Grid item xs={12} sm={9} md={10}>
            <Paper sx={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2, opacity: 0.6,
            }}>
              <TribIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
              <Typography color="text.secondary">
                Selecione um perfil de tributação na lista ao lado,
                <br />ou clique em <strong>+</strong> para criar um novo.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* ── Diálogo: novo perfil ──────────────────────────────────────────────── */}
      <Dialog open={dlgNovo} onClose={() => setDlgNovo(false)} fullWidth maxWidth="xs">
        <DialogTitle>Novo Perfil de Tributação</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome (ex: CONSUMIDOR, REVENDEDOR)"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            fullWidth autoFocus
            sx={{ mt: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && criarNovoPerfil()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgNovo(false)}>Cancelar</Button>
          <Button variant="contained" onClick={criarNovoPerfil} disabled={saving || !novoNome.trim()}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Diálogo: confirmar exclusão ───────────────────────────────────────── */}
      <Dialog open={dlgExcluir} onClose={() => setDlgExcluir(false)}>
        <DialogTitle>Excluir Perfil</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o perfil <strong>{cabecalho.nome}</strong>?<br />
            Todas as alíquotas por UF serão removidas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgExcluir(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={excluirPerfil} disabled={saving}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
