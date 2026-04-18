import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Chip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, IconButton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert,
  FormControl, InputLabel, Select, MenuItem, Tooltip, Card, CardContent
} from '@mui/material';
import {
  Add as AddIcon, Refresh as RefreshIcon, Cancel as CancelIcon,
  TrendingUp as ReajusteIcon, PlayArrow as PlayIcon,
  AttachMoney as MoneyIcon, Pending as PendingIcon,
  CheckCircle as PagoIcon, Schedule as AgendaIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const fmtMoeda = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtData = (d) => d ? new Date(d + 'T00:00').toLocaleDateString('pt-BR') : '—';

const StatusContratoCor = { ATIVO: 'success', SUSPENSO: 'warning', CANCELADO: 'error', ENCERRADO: 'default' };
const StatusParcelaCor = { PAGA: 'success', PENDENTE: 'warning', ATRASADA: 'error', CANCELADA: 'default', ENVIADA: 'info' };

// ── Dialog Novo Contrato ──────────────────────────────────────────────────────
const DialogNovoContrato = ({ open, onClose, clientes, onSaved }) => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cliente: '', descricao: '', valor_mensal: '',
    data_inicio: new Date().toISOString().split('T')[0],
    dia_vencimento: 10, periodicidade: 'MENSAL',
    indice_reajuste: 'NENHUM',
    meses_para_reajuste: '',
    gerar_pix: true, gerar_boleto: false,
  });

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const salvar = async () => {
    if (!form.cliente || !form.valor_mensal) {
      return showToast('Preencha cliente e valor', 'warning');
    }
    setSaving(true);
    try {
      await axiosInstance.post('/recorrencia/contratos/', form);
      showToast('Contrato criado!', 'success');
      onSaved();
      onClose();
    } catch { showToast('Erro ao salvar', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Novo Contrato de Recorrência</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Cliente *</InputLabel>
              <Select value={form.cliente} onChange={f('cliente')} label="Cliente *">
                {clientes.map((c) => (
                  <MenuItem key={c.id_cliente} value={c.id_cliente}>{c.nome_razao_social}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Descrição do Serviço" fullWidth size="small" multiline rows={2}
              value={form.descricao} onChange={f('descricao')}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Valor Mensal (R$) *" type="number" fullWidth size="small"
              value={form.valor_mensal} onChange={f('valor_mensal')}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Dia de Vencimento" type="number" fullWidth size="small"
              value={form.dia_vencimento}
              onChange={(e) => setForm((p) => ({ ...p, dia_vencimento: e.target.value }))}
              inputProps={{ min: 1, max: 28 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Data de Início" type="date" fullWidth size="small"
              value={form.data_inicio} onChange={f('data_inicio')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Periodicidade</InputLabel>
              <Select value={form.periodicidade} onChange={f('periodicidade')} label="Periodicidade">
                {['MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'].map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Índice de Reajuste</InputLabel>
              <Select value={form.indice_reajuste} onChange={f('indice_reajuste')} label="Índice">
                {['NENHUM', 'IGPM', 'IPCA', 'INPC', 'FIXO'].map((i) => (
                  <MenuItem key={i} value={i}>{i}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Reajustar após (meses)" type="number" fullWidth size="small"
              value={form.meses_para_reajuste}
              onChange={(e) => setForm((p) => ({ ...p, meses_para_reajuste: e.target.value }))}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={salvar} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Página Principal ──────────────────────────────────────────────────────────
const RecorrenciaPage = () => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const [contratos, setContratos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [parcelasDialog, setParcelasDialog] = useState({ open: false, contrato: null, parcelas: [] });

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      // Carrega clientes separadamente para não falhar junto com contratos/dashboard
      const [ctrRes, dashRes] = await Promise.all([
        axiosInstance.get('/recorrencia/contratos/').catch(() => null),
        axiosInstance.get('/recorrencia/contratos/dashboard/').catch(() => null),
      ]);
      if (ctrRes) {
        const ctrArr = ctrRes.data?.results ?? ctrRes.data;
        setContratos(Array.isArray(ctrArr) ? ctrArr : []);
      }
      if (dashRes) setDashboard(dashRes.data);
    } catch { showToast('Erro ao carregar contratos', 'error'); }

    try {
      let allClientes = [];
      let url = '/clientes/?page_size=9999';
      while (url) {
        const resp = await axiosInstance.get(url);
        const items = resp.data?.results ?? resp.data;
        allClientes = allClientes.concat(Array.isArray(items) ? items : []);
        url = resp.data?.next ? resp.data.next.replace(/^https?:\/\/[^/]+/, '') : null;
      }
      setClientes(allClientes);
    } catch { showToast('Erro ao carregar clientes', 'error'); }

    setLoading(false);
  }, [axiosInstance, showToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const gerarParcelas = async (id) => {
    try {
      const { data } = await axiosInstance.post(`/recorrencia/contratos/${id}/gerar_parcelas/`);
      showToast(`${data.geradas} parcela(s) gerada(s)!`, 'success');
      carregar();
    } catch (e) { showToast(e.response?.data?.erro || 'Erro', 'error'); }
  };

  const aplicarReajuste = async (id) => {
    try {
      const { data } = await axiosInstance.post(`/recorrencia/contratos/${id}/aplicar_reajuste/`);
      showToast(data.mensagem || 'Reajuste aplicado!', 'success');
      carregar();
    } catch (e) { showToast(e.response?.data?.erro || 'Erro ao aplicar reajuste', 'error'); }
  };

  const cancelar = async (id) => {
    if (!window.confirm('Confirma o cancelamento do contrato?')) return;
    try {
      await axiosInstance.post(`/recorrencia/contratos/${id}/cancelar/`);
      showToast('Contrato cancelado', 'success');
      carregar();
    } catch { showToast('Erro ao cancelar', 'error'); }
  };

  const verParcelas = async (contrato) => {
    const { data } = await axiosInstance.get(`/recorrencia/parcelas/?contrato=${contrato.id_contrato}`
    );
    const pArr = data?.results ?? data;
    setParcelasDialog({
      open: true,
      contrato,
      parcelas: Array.isArray(pArr) ? pArr : [],
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" fontWeight={700}>Contratos de Recorrência</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={carregar} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog(true)}>
            Novo Contrato
          </Button>
        </Stack>
      </Box>

      {/* KPIs */}
      {dashboard && (
        <Grid container spacing={2} mb={2}>
          {[
            { label: 'Contratos Ativos', value: dashboard.total_ativos, color: 'success.main', icon: <PlayIcon /> },
            { label: 'Suspensos', value: dashboard.total_suspensos, color: 'warning.main', icon: <PendingIcon /> },
            { label: 'Receita Mensal', value: fmtMoeda(dashboard.receita_mensal_ativa), color: 'primary.main', icon: <MoneyIcon /> },
            { label: 'Vencem Hoje', value: dashboard.parcelas_vencendo_hoje, color: 'info.main', icon: <AgendaIcon /> },
            { label: 'Em Atraso', value: dashboard.parcelas_em_atraso, color: 'error.main', icon: <PendingIcon /> },
          ].map((kpi) => (
            <Grid item xs={6} sm={4} md={2.4} key={kpi.label}>
              <Card>
                <CardContent sx={{ py: 1.5 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box color={kpi.color}>{kpi.icon}</Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700} color={kpi.color}>
                        {kpi.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {kpi.label}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell align="right">Valor Mensal</TableCell>
              <TableCell>Periodicidade</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Próxima Parcela</TableCell>
              <TableCell>Índice</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contratos.map((c) => (
              <TableRow key={c.id_contrato} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{c.numero}</TableCell>
                <TableCell>{c.cliente_nome}</TableCell>
                <TableCell align="right"><b>{fmtMoeda(c.valor_mensal)}</b></TableCell>
                <TableCell>{c.periodicidade}</TableCell>
                <TableCell>Dia {c.dia_vencimento}</TableCell>
                <TableCell>
                  {c.proxima_parcela
                    ? `${fmtData(c.proxima_parcela.vencimento)} — ${fmtMoeda(c.proxima_parcela.valor)}`
                    : '—'}
                </TableCell>
                <TableCell>{c.indice_reajuste}</TableCell>
                <TableCell>
                  <Chip
                    label={c.status}
                    color={StatusContratoCor[c.status] || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Ver/Baixar Parcelas">
                      <IconButton size="small" onClick={() => verParcelas(c)}>
                        <MoneyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Gerar Parcela do Mês">
                      <IconButton size="small" color="primary" onClick={() => gerarParcelas(c.id_contrato)}>
                        <PlayIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {c.status === 'ATIVO' && c.indice_reajuste !== 'NENHUM' && (
                      <Tooltip title="Aplicar Reajuste">
                        <IconButton size="small" color="warning" onClick={() => aplicarReajuste(c.id_contrato)}>
                          <ReajusteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {c.status === 'ATIVO' && (
                      <Tooltip title="Cancelar Contrato">
                        <IconButton size="small" color="error" onClick={() => cancelar(c.id_contrato)}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Parcelas */}
      <Dialog
        open={parcelasDialog.open}
        onClose={() => setParcelasDialog((p) => ({ ...p, open: false }))}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Parcelas — {parcelasDialog.contrato?.numero_contrato} ({parcelasDialog.contrato?.cliente_nome})
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Competência</TableCell>
                  <TableCell>Vencimento</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Pago em</TableCell>
                  <TableCell>Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parcelasDialog.parcelas.map((p) => (
                  <TableRow key={p.id_parcela} hover>
                    <TableCell>{p.competencia}</TableCell>
                    <TableCell>{fmtData(p.data_vencimento)}</TableCell>
                    <TableCell align="right"><b>{fmtMoeda(p.valor)}</b></TableCell>
                    <TableCell>
                      <Chip
                        label={p.status}
                        color={StatusParcelaCor[p.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{p.data_pagamento ? fmtData(p.data_pagamento) : '—'}</TableCell>
                    <TableCell>
                      {p.status === 'PENDENTE' && (
                        <Tooltip title="Registrar Pagamento">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={async () => {
                              await axiosInstance.post(`/recorrencia/parcelas/${p.id_parcela}/baixar/`
                              );
                              showToast('Parcela baixada!', 'success');
                              const { data } = await axiosInstance.get(`/recorrencia/parcelas/?contrato=${parcelasDialog.contrato.id_contrato}`
                              );
                              const pArr2 = data?.results ?? data;
                              setParcelasDialog((prev) => ({
                                ...prev,
                                parcelas: Array.isArray(pArr2) ? pArr2 : [],
                              }));
                            }}
                          >
                            <PagoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParcelasDialog((p) => ({ ...p, open: false }))}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <DialogNovoContrato
        open={dialog}
        onClose={() => setDialog(false)}
        clientes={clientes}
        onSaved={carregar}
      />
    </Box>
  );
};

export default RecorrenciaPage;
