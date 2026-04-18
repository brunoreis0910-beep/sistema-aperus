import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Chip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, IconButton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert,
  FormControl, InputLabel, Select, MenuItem, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Refresh as RefreshIcon, QrCode2 as QrIcon,
  CheckCircle as PagoIcon, HourglassEmpty as PendenteIcon,
  Settings as SettingsIcon, ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const fmtMoeda = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDataHora = (d) =>
  d ? new Date(d).toLocaleString('pt-BR') : '—';

const StatusChip = ({ status }) => {
  const map = {
    ATIVA: { label: 'Aguardando Pagamento', color: 'warning' },
    CONCLUIDA: { label: 'Pago', color: 'success' },
    EXPIRADA: { label: 'Expirado', color: 'error' },
    REMOVIDA_PELO_USUARIO_RECEBEDOR: { label: 'Removida', color: 'default' },
    REMOVIDA_PELO_PSP: { label: 'Removida PSP', color: 'default' },
  };
  const info = map[status] || { label: status, color: 'default' };
  return <Chip label={info.label} color={info.color} size="small" />;
};

// ── Dialog de QR Code ─────────────────────────────────────────────────────────
const DialogQR = ({ cobranca, open, onClose, onAtualizar }) => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState(cobranca?.status);
  const pollingRef = useRef(null);

  // Polling enquanto ATIVA
  useEffect(() => {
    if (!open || !cobranca) return;
    setStatus(cobranca.status);

    if (cobranca.status === 'ATIVA') {
      pollingRef.current = setInterval(async () => {
        try {
          const { data } = await axiosInstance.post(
            `/pix/cobrancas/${cobranca.id_cobranca}/consultar_status/`
          );
          setStatus(data.status);
          if (data.status !== 'ATIVA') {
            clearInterval(pollingRef.current);
            onAtualizar();
            if (data.status === 'CONCLUIDA') {
              showToast('Pix confirmado! Pagamento recebido.', 'success');
            }
          }
        } catch { /* silent */ }
      }, 4000);
    }

    return () => clearInterval(pollingRef.current);
  }, [open, cobranca]);

  const copiarCodigo = () => {
    if (cobranca?.qr_code_payload) {
      navigator.clipboard.writeText(cobranca.qr_code_payload);
      showToast('Código copiado!', 'success');
    }
  };

  if (!cobranca) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Pix — {fmtMoeda(cobranca.valor)}
        <StatusChip status={status} />
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={1}>
          {status === 'ATIVA' && (
            <Stack direction="row" alignItems="center" gap={1}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Aguardando confirmação de pagamento...
              </Typography>
            </Stack>
          )}
          {status === 'CONCLUIDA' && (
            <Alert severity="success" icon={<PagoIcon />}>
              Pagamento confirmado!
            </Alert>
          )}

          {cobranca.qr_code_imagem_base64 ? (
            <Box
              component="img"
              src={`data:image/png;base64,${cobranca.qr_code_imagem_base64}`}
              alt="QR Code Pix"
              sx={{ width: 220, height: 220, border: '4px solid #4caf50', borderRadius: 2 }}
            />
          ) : (
            <Box
              sx={{
                width: 220, height: 220, bgcolor: 'grey.100',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 2,
              }}
            >
              <QrIcon sx={{ fontSize: 80, color: 'grey.400' }} />
            </Box>
          )}

          {cobranca.qr_code_payload && (
            <Box sx={{ width: '100%' }}>
              <TextField
                label="Código Copia e Cola"
                value={cobranca.qr_code_payload}
                fullWidth
                size="small"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton size="small" onClick={copiarCodigo}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  ),
                }}
              />
            </Box>
          )}

          {cobranca.expira_em && (
            <Typography variant="caption" color="text.secondary">
              Expira em: {fmtDataHora(cobranca.expira_em)}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Dialog Nova Cobrança ──────────────────────────────────────────────────────
const DialogNovaCobranca = ({ open, onClose, onSaved }) => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    valor: '', descricao: '', nome_pagador: '',
    cpf_cnpj_pagador: '', expiracao_segundos: 3600,
  });

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const gerar = async () => {
    if (!form.valor) return showToast('Informe o valor', 'warning');
    setSaving(true);
    try {
      const { data } = await axiosInstance.post('/pix/cobrancas/gerar/', form);
      showToast('QR Code Pix gerado!', 'success');
      onSaved(data);
      onClose();
    } catch (e) {
      showToast(e.response?.data?.erro || 'Erro ao gerar Pix', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Nova Cobrança Pix</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={12}>
            <TextField
              label="Valor (R$) *" type="number" fullWidth size="small"
              value={form.valor} onChange={f('valor')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Descrição" fullWidth size="small"
              value={form.descricao} onChange={f('descricao')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Nome do Pagador" fullWidth size="small"
              value={form.nome_pagador} onChange={f('nome_pagador')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="CPF/CNPJ do Pagador" fullWidth size="small"
              value={form.cpf_cnpj_pagador} onChange={f('cpf_cnpj_pagador')}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Validade</InputLabel>
              <Select
                value={form.expiracao_segundos}
                onChange={(e) => setForm((p) => ({ ...p, expiracao_segundos: e.target.value }))}
                label="Validade"
              >
                {[
                  [900, '15 minutos'], [1800, '30 minutos'], [3600, '1 hora'],
                  [7200, '2 horas'], [86400, '24 horas'],
                ].map(([v, l]) => (
                  <MenuItem key={v} value={v}>{l}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={gerar} disabled={saving} startIcon={<QrIcon />}>
          {saving ? <CircularProgress size={18} /> : 'Gerar QR Code'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Página Principal ──────────────────────────────────────────────────────────
const PixPage = () => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qrDialog, setQrDialog] = useState({ open: false, cobranca: null });
  const [novaDialog, setNovaDialog] = useState(false);
  const [semConfig, setSemConfig] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [cobs, cfg] = await Promise.all([
        axiosInstance.get('/pix/cobrancas/'),
        axiosInstance.get('/pix/config/'),
      ]);
      const cobsArr = cobs.data?.results ?? cobs.data;
      setLista(Array.isArray(cobsArr) ? cobsArr : []);
      const configs = cfg.data?.results ?? cfg.data;
      setSemConfig(!configs.some((c) => c.ativo));
    } catch { showToast('Erro ao carregar Pix', 'error'); }
    finally { setLoading(false); }
  }, [axiosInstance, showToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirQR = (cobranca) => setQrDialog({ open: true, cobranca });

  const onNovaCobrancaSalva = (cobranca) => {
    carregar();
    abrirQR(cobranca);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" fontWeight={700}>Pix Dinâmico</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={carregar} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            href="#/configuracoes"
            size="small"
          >
            Configs
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNovaDialog(true)}
          >
            Nova Cobrança
          </Button>
        </Stack>
      </Box>

      {semConfig && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Nenhuma configuração Pix ativa. Configure em{' '}
          <b>/api/pix/config/</b> para começar a gerar cobranças.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Txid</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>Pagador</TableCell>
              <TableCell>Gerado em</TableCell>
              <TableCell>Expira em</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>QR</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lista.map((c) => (
              <TableRow key={c.id_cobranca} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                  {c.txid?.slice(0, 16)}...
                </TableCell>
                <TableCell>{c.descricao || '—'}</TableCell>
                <TableCell align="right"><b>{fmtMoeda(c.valor)}</b></TableCell>
                <TableCell>{c.nome_pagador || '—'}</TableCell>
                <TableCell>{fmtDataHora(c.gerado_em)}</TableCell>
                <TableCell>{fmtDataHora(c.expira_em)}</TableCell>
                <TableCell><StatusChip status={c.status} /></TableCell>
                <TableCell>
                  <Tooltip title="Ver QR Code">
                    <IconButton size="small" onClick={() => abrirQR(c)} color="primary">
                      <QrIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <DialogQR
        cobranca={qrDialog.cobranca}
        open={qrDialog.open}
        onClose={() => setQrDialog({ open: false, cobranca: null })}
        onAtualizar={carregar}
      />
      <DialogNovaCobranca
        open={novaDialog}
        onClose={() => setNovaDialog(false)}
        onSaved={onNovaCobrancaSalva}
      />
    </Box>
  );
};

export default PixPage;
