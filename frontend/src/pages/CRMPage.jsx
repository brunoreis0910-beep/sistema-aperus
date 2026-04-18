import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, CardActions,
  Button, IconButton, Chip, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Avatar,
  Select, MenuItem, FormControl, InputLabel, Tooltip, Stack,
  Badge, Divider
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Person as PersonIcon, Phone as PhoneIcon, Email as EmailIcon,
  CheckCircle as CheckIcon, Flag as FlagIcon, Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon, AttachMoney as MoneyIcon,
  WhatsApp as WhatsAppIcon, Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const STATUS_CHOICES = [
  { value: 'NOVO', label: 'Novo', color: '#42a5f5' },
  { value: 'CONTATO', label: 'Contato', color: '#26c6da' },
  { value: 'QUALIFICADO', label: 'Qualificado', color: '#66bb6a' },
  { value: 'PROPOSTA', label: 'Proposta', color: '#ffa726' },
  { value: 'NEGOCIACAO', label: 'Negociação', color: '#ef5350' },
  { value: 'GANHO', label: 'Ganho', color: '#4caf50' },
  { value: 'PERDIDO', label: 'Perdido', color: '#9e9e9e' },
];

const fmtMoeda = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ── Card de Lead ─────────────────────────────────────────────────────────────
const LeadCard = ({ lead, etapas, onRefresh }) => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const moverEtapa = async (etapa_id) => {
    setLoading(true);
    try {
      await axiosInstance.post(`/crm/leads/${lead.id_lead}/mover_etapa/`, { etapa_id });
      onRefresh();
    } catch {
      showToast('Erro ao mover lead', 'error');
    } finally {
      setLoading(false);
    }
  };

  const converterCliente = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post(`/crm/leads/${lead.id_lead}/converter/`);
      showToast(`Lead convertido: ${data.cliente_nome}`, 'success');
      onRefresh();
    } catch (e) {
      showToast(e.response?.data?.erro || 'Erro ao converter', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{ mb: 1, cursor: 'grab', '&:hover': { boxShadow: 3 } }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="subtitle2" fontWeight={600} noWrap>{lead.nome}</Typography>
        {lead.empresa && (
          <Typography variant="caption" color="text.secondary" noWrap>{lead.empresa}</Typography>
        )}
        <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap">
          {lead.telefone && (
            <Chip
              size="small"
              icon={<PhoneIcon sx={{ fontSize: 12 }} />}
              label={lead.telefone}
              sx={{ fontSize: 10, height: 18 }}
            />
          )}
          {lead.valor_estimado && (
            <Chip
              size="small"
              icon={<MoneyIcon sx={{ fontSize: 12 }} />}
              label={fmtMoeda(lead.valor_estimado)}
              color="success"
              variant="outlined"
              sx={{ fontSize: 10, height: 18 }}
            />
          )}
        </Stack>
        {lead.atividades_pendentes > 0 && (
          <Badge badgeContent={lead.atividades_pendentes} color="warning" sx={{ mt: 0.5 }}>
            <FlagIcon fontSize="small" color="action" />
          </Badge>
        )}
      </CardContent>
      <CardActions sx={{ pt: 0, gap: 0.5, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={lead.etapa || ''}
            displayEmpty
            onChange={(e) => moverEtapa(e.target.value)}
            sx={{ fontSize: 11, height: 26 }}
          >
            <MenuItem value="">— Mover —</MenuItem>
            {etapas.map((et) => (
              <MenuItem key={et.id_etapa} value={et.id_etapa}>{et.nome}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {!lead.cliente_convertido && lead.status !== 'PERDIDO' && (
          <Tooltip title="Converter em cliente">
            <IconButton size="small" onClick={converterCliente} disabled={loading} color="success">
              <CheckIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {lead.whatsapp && (
          <Tooltip title="WhatsApp">
            <IconButton
              size="small"
              component="a"
              href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              color="success"
            >
              <WhatsAppIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

// ── Coluna Kanban ─────────────────────────────────────────────────────────────
const KanbanColuna = ({ coluna, etapas, onRefresh, onNovoLead }) => (
  <Box
    sx={{
      minWidth: 260, maxWidth: 280, mx: 1,
      bgcolor: 'grey.100', borderRadius: 2, p: 1,
      display: 'flex', flexDirection: 'column',
    }}
  >
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
      <Box display="flex" alignItems="center" gap={1}>
        <Box
          sx={{
            width: 12, height: 12, borderRadius: '50%',
            bgcolor: coluna.cor || '#9e9e9e',
          }}
        />
        <Typography variant="subtitle2" fontWeight={600}>{coluna.nome}</Typography>
        <Chip label={coluna.leads?.length || 0} size="small" sx={{ height: 18, fontSize: 10 }} />
      </Box>
      {coluna.valor_total > 0 && (
        <Typography variant="caption" color="success.main" fontWeight={600}>
          {fmtMoeda(coluna.valor_total)}
        </Typography>
      )}
    </Box>
    <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 260px)', pb: 1 }}>
      {(coluna.leads || []).map((lead) => (
        <LeadCard key={lead.id_lead} lead={lead} etapas={etapas} onRefresh={onRefresh} />
      ))}
    </Box>
    <Button
      size="small"
      startIcon={<AddIcon />}
      onClick={() => onNovoLead(coluna.id_etapa)}
      sx={{ mt: 0.5 }}
    >
      Novo Lead
    </Button>
  </Box>
);

// ── Dialog Novo Lead ──────────────────────────────────────────────────────────
const DialogNovoLead = ({ open, onClose, etapas, origens, etapaInicial, onSaved }) => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: '', empresa: '', email: '', telefone: '', whatsapp: '',
    valor_estimado: '', origem: '', etapa: '', observacoes: '',
  });

  useEffect(() => {
    if (open) setForm((p) => ({ ...p, etapa: etapaInicial || '' }));
  }, [open, etapaInicial]);

  const salvar = async () => {
    if (!form.nome) return showToast('Informe o nome do lead', 'warning');
    setSaving(true);
    try {
      await axiosInstance.post('/crm/leads/', { ...form });
      showToast('Lead criado!', 'success');
      onSaved();
      onClose();
    } catch (e) {
      showToast('Erro ao salvar lead', 'error');
    } finally {
      setSaving(false);
    }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Novo Lead</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={12} sm={6}>
            <TextField label="Nome *" value={form.nome} onChange={f('nome')} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Empresa" value={form.empresa} onChange={f('empresa')} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Telefone" value={form.telefone} onChange={f('telefone')} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="WhatsApp" value={form.whatsapp} onChange={f('whatsapp')} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="E-mail" value={form.email} onChange={f('email')} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Valor Estimado (R$)"
              value={form.valor_estimado}
              onChange={f('valor_estimado')}
              fullWidth size="small" type="number"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Etapa</InputLabel>
              <Select value={form.etapa} onChange={f('etapa')} label="Etapa">
                <MenuItem value="">Nenhuma</MenuItem>
                {etapas.map((et) => (
                  <MenuItem key={et.id_etapa} value={et.id_etapa}>{et.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Origem</InputLabel>
              <Select value={form.origem} onChange={f('origem')} label="Origem">
                <MenuItem value="">Nenhuma</MenuItem>
                {origens.map((o) => (
                  <MenuItem key={o.id_origem} value={o.id_origem}>{o.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Observações"
              value={form.observacoes}
              onChange={f('observacoes')}
              fullWidth size="small" multiline rows={2}
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
const CRMPage = () => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const [kanban, setKanban] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [origens, setOrigens] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [etapaInicial, setEtapaInicial] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [kb, et, ori, dash] = await Promise.all([
        axiosInstance.get('/crm/leads/kanban/'),
        axiosInstance.get('/crm/etapas/'),
        axiosInstance.get('/crm/origens/'),
        axiosInstance.get('/crm/leads/dashboard/'),
      ]);
      const kbArr = Array.isArray(kb.data) ? kb.data : [];
      const etArr = et.data?.results ?? et.data;
      const oriArr = ori.data?.results ?? ori.data;
      setKanban(kbArr);
      setEtapas(Array.isArray(etArr) ? etArr : []);
      setOrigens(Array.isArray(oriArr) ? oriArr : []);
      setDashboard(dash.data);
    } catch {
      showToast('Erro ao carregar CRM', 'error');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, showToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNovoLead = (etapaId) => {
    setEtapaInicial(etapaId);
    setDialogOpen(true);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" fontWeight={700}>
          CRM — Pipeline de Vendas
        </Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={carregar} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrirNovoLead(null)}>
            Novo Lead
          </Button>
        </Stack>
      </Box>

      {/* KPIs */}
      {dashboard && (
        <Grid container spacing={2} mb={2}>
          {[
            { label: 'Total Leads', value: dashboard.total, color: 'primary.main' },
            { label: 'Novos Hoje', value: dashboard.novos_hoje, color: 'info.main' },
            { label: 'Ganhos no Mês', value: dashboard.ganhos_mes, color: 'success.main' },
            {
              label: 'Valor Pipeline',
              value: fmtMoeda(dashboard.valor_pipeline),
              color: 'warning.main',
            },
            {
              label: 'Taxa de Conversão',
              value: `${dashboard.taxa_conversao}%`,
              color: 'secondary.main',
            },
          ].map((kpi) => (
            <Grid item xs={6} sm={4} md={2.4} key={kpi.label}>
              <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700} color={kpi.color}>
                  {kpi.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {kpi.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Kanban Board */}
      <Box sx={{ display: 'flex', overflowX: 'auto', pb: 2, gap: 0 }}>
        {kanban.map((coluna) => (
          <KanbanColuna
            key={coluna.id_etapa ?? 'sem-etapa'}
            coluna={coluna}
            etapas={etapas}
            onRefresh={carregar}
            onNovoLead={abrirNovoLead}
          />
        ))}
      </Box>

      <DialogNovoLead
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        etapas={etapas}
        origens={origens}
        etapaInicial={etapaInicial}
        onSaved={carregar}
      />
    </Box>
  );
};

export default CRMPage;
