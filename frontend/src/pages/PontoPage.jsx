import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Avatar, Stack,
  CircularProgress, Alert, Select, MenuItem, FormControl,
  InputLabel, Divider, List, ListItem, ListItemText,
  ListItemAvatar, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  AccessTime as ClockIcon,
  Login as EntradaIcon,
  Logout as SaidaIcon,
  FreeBreakfast as AlmocoIcon,
  AssignmentReturn as RetornoIcon,
  MyLocation as GpsIcon,
  GpsOff as GpsOffIcon,
  Refresh as RefreshIcon,
  CheckCircle as OkIcon,
  History as HistoricoIcon,
  Person as PersonIcon,
  Assessment as RelatorioIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const TIPOS = [
  { key: 'ENTRADA',        label: 'Entrada',         icon: <EntradaIcon />,  color: '#2E7D32', bg: '#E8F5E9' },
  { key: 'SAIDA_ALMOCO',   label: 'Saída Almoço',    icon: <AlmocoIcon />,   color: '#E65100', bg: '#FBE9E7' },
  { key: 'RETORNO_ALMOCO', label: 'Retorno Almoço',  icon: <RetornoIcon />,  color: '#1565C0', bg: '#E3F2FD' },
  { key: 'SAIDA',          label: 'Saída',            icon: <SaidaIcon />,    color: '#B71C1C', bg: '#FFEBEE' },
];

const fmtHora = (d) => d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDataHora = (d) => d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

// ── Relógio ao vivo ──────────────────────────────────────────────────────────
const RelogioAoVivo = () => {
  const [hora, setHora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <Box textAlign="center" sx={{ py: 2 }}>
      <Typography
        variant="h2"
        fontWeight={800}
        sx={{ fontFamily: 'monospace', letterSpacing: 4, color: '#1565C0', lineHeight: 1 }}
      >
        {hora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5}>
        {hora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
      </Typography>
    </Box>
  );
};

// ── Chip de GPS ──────────────────────────────────────────────────────────────
const GpsChip = ({ gps, onAtualizar }) => (
  <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
    {gps ? (
      <Chip
        icon={<GpsIcon />}
        label={`GPS: ${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}`}
        color="success"
        size="small"
        variant="outlined"
      />
    ) : (
      <Chip
        icon={<GpsOffIcon />}
        label="GPS não disponível"
        color="warning"
        size="small"
        variant="outlined"
        onClick={onAtualizar}
      />
    )}
    <IconButton size="small" onClick={onAtualizar} title="Atualizar GPS">
      <RefreshIcon fontSize="small" />
    </IconButton>
  </Box>
);

// ── Histórico do dia ─────────────────────────────────────────────────────────
const HistoricoDia = ({ registros, loading }) => (
  <Paper sx={{ mt: 2, borderRadius: 3 }} elevation={1}>
    <Box px={2} pt={2} pb={1} display="flex" alignItems="center" gap={1}>
      <HistoricoIcon color="action" />
      <Typography variant="subtitle1" fontWeight={700}>Registros de Hoje</Typography>
    </Box>
    <Divider />
    {loading ? (
      <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
    ) : registros.length === 0 ? (
      <Box px={2} py={3} textAlign="center">
        <Typography variant="body2" color="text.secondary">Nenhum registro hoje</Typography>
      </Box>
    ) : (
      <List dense>
        {registros.map((r) => {
          const tipo = TIPOS.find((t) => t.key === r.tipo) || TIPOS[0];
          return (
            <ListItem key={r.id_ponto} divider>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: tipo.bg, color: tipo.color, width: 36, height: 36 }}>
                  {tipo.icon}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={600}>{tipo.label}</Typography>
                }
                secondary={
                  <span>
                    {fmtHora(r.data_hora)}
                    {r.observacao ? ` · ${r.observacao}` : ''}
                    {r.latitude ? ` · 📍 GPS` : ''}
                  </span>
                }
              />
              <Chip label={<OkIcon sx={{ fontSize: 14 }} />} size="small" color="success" variant="outlined" />
            </ListItem>
          );
        })}
      </List>
    )}
  </Paper>
);

// ── Terminal de Ponto ───────────────────────────────────────────────────────
function TerminalPonto() {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();

  const [funcionarios, setFuncionarios]   = useState([]);
  const [funcId, setFuncId]               = useState('');
  const [gps, setGps]                     = useState(null);
  const [gpsLoading, setGpsLoading]       = useState(false);
  const [registros, setRegistros]         = useState([]);
  const [regLoading, setRegLoading]       = useState(false);
  const [salvando, setSalvando]           = useState(null); // key do tipo sendo salvo
  const [successDialog, setSuccessDialog] = useState(null); // { tipo, data_hora }
  const [obs, setObs]                     = useState('');
  const [obsDialog, setObsDialog]         = useState(null); // key do tipo para confirmar

  // Carregar funcionários ativos
  useEffect(() => {
    axiosInstance.get('/rh/funcionarios/?ativo=true')
      .then(({ data }) => {
        const arr = data?.results ?? data;
        setFuncionarios(Array.isArray(arr) ? arr : []);
      })
      .catch(() => showToast('Erro ao carregar funcionários', 'error'));
  }, [axiosInstance, showToast]);

  // Capturar GPS
  const capturarGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        showToast('GPS não autorizado/disponível', 'warning');
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [showToast]);

  useEffect(() => { capturarGPS(); }, [capturarGPS]);

  // Carregar histórico do dia
  const carregarHistorico = useCallback(async () => {
    if (!funcId) return;
    setRegLoading(true);
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      const { data } = await axiosInstance.get(
        `/rh/pontos/?funcionario=${funcId}&data=${hoje}`
      );
      const arr = data?.results ?? data;
      setRegistros(Array.isArray(arr) ? arr : []);
    } catch { showToast('Erro ao carregar histórico', 'error'); }
    finally { setRegLoading(false); }
  }, [axiosInstance, funcId, showToast]);

  useEffect(() => { carregarHistorico(); }, [carregarHistorico]);

  // Registrar batida
  const registrar = async (tipo) => {
    if (!funcId) {
      showToast('Selecione um funcionário', 'warning');
      return;
    }
    setSalvando(tipo);
    try {
      const payload = {
        funcionario_id: funcId,
        tipo,
        observacao: obs,
        ...(gps ? { latitude: gps.latitude, longitude: gps.longitude } : {}),
      };
      const { data } = await axiosInstance.post('/rh/pontos/registrar/', payload);
      setSuccessDialog({ tipo, data_hora: data.data_hora });
      setObs('');
      setObsDialog(null);
      await carregarHistorico();
    } catch (e) {
      showToast(e.response?.data?.erro || 'Erro ao registrar', 'error');
    } finally {
      setSalvando(null);
    }
  };

  const tipoInfo = (key) => TIPOS.find((t) => t.key === key) || TIPOS[0];

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', p: 2, pb: 4 }}>
      {/* Relógio */}
      <Paper elevation={3} sx={{ borderRadius: 4, mb: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: '#1565C0', py: 1 }}>
          <Typography textAlign="center" color="white" variant="caption" fontWeight={600} letterSpacing={2}>
            CONTROLE DE PONTO
          </Typography>
        </Box>
        <RelogioAoVivo />
        {gpsLoading ? (
          <Box display="flex" justifyContent="center" pb={1}><CircularProgress size={16} /></Box>
        ) : (
          <GpsChip gps={gps} onAtualizar={capturarGPS} />
        )}
      </Paper>

      {/* Seleção de funcionário */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Funcionário</InputLabel>
          <Select
            value={funcId}
            label="Funcionário"
            onChange={(e) => setFuncId(e.target.value)}
            startAdornment={<PersonIcon sx={{ mr: 1, color: 'action.active', ml: 0.5 }} />}
          >
            {funcionarios.map((f) => (
              <MenuItem key={f.id_funcionario} value={f.id_funcionario}>
                {f.nome_completo}
                {f.matricula ? ` — ${f.matricula}` : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Campo de observação */}
        <TextField
          label="Observação (opcional)"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          size="small"
          fullWidth
          sx={{ mt: 1.5 }}
          placeholder="Ex.: chegada atrasada por trânsito"
        />
      </Paper>

      {/* Botões de batida */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" mb={1.5} textAlign="center">
          Registrar Batida
        </Typography>
        <Box
          display="grid"
          gridTemplateColumns="1fr 1fr"
          gap={1.5}
        >
          {TIPOS.map((t) => (
            <Button
              key={t.key}
              variant="contained"
              disabled={salvando !== null || !funcId}
              onClick={() => registrar(t.key)}
              startIcon={salvando === t.key ? <CircularProgress size={18} color="inherit" /> : t.icon}
              sx={{
                bgcolor: t.color,
                '&:hover': { bgcolor: t.color, filter: 'brightness(0.9)' },
                '&:disabled': { bgcolor: '#e0e0e0' },
                borderRadius: 3,
                py: 1.8,
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
              }}
            >
              {t.label}
            </Button>
          ))}
        </Box>

        {!funcId && (
          <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
            Selecione um funcionário para habilitar as batidas
          </Alert>
        )}
      </Paper>

      {/* Histórico do dia */}
      <HistoricoDia registros={registros} loading={regLoading} />

      {/* Dialog de sucesso */}
      <Dialog
        open={Boolean(successDialog)}
        onClose={() => setSuccessDialog(null)}
        PaperProps={{ sx: { borderRadius: 4, textAlign: 'center', p: 1 } }}
        maxWidth="xs"
        fullWidth
      >
        {successDialog && (() => {
          const info = tipoInfo(successDialog.tipo);
          return (
            <>
              <DialogTitle sx={{ pb: 0 }}>
                <Avatar sx={{ bgcolor: info.bg, color: info.color, width: 64, height: 64, mx: 'auto', mb: 1 }}>
                  <OkIcon sx={{ fontSize: 36 }} />
                </Avatar>
                <Typography variant="h6" fontWeight={700}>Ponto Registrado!</Typography>
              </DialogTitle>
              <DialogContent>
                <Chip
                  icon={info.icon}
                  label={info.label}
                  sx={{ bgcolor: info.bg, color: info.color, fontWeight: 700, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {fmtDataHora(successDialog.data_hora)}
                </Typography>
              </DialogContent>
              <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => setSuccessDialog(null)}
                  sx={{ borderRadius: 3, px: 4 }}
                >
                  OK
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}

// ── Relatório de Ponto ────────────────────────────────────────────────────────
const fmtData2 = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

function calcularHorasTrabalhadas(registrosDia) {
  const ent = registrosDia.find(r => r.tipo === 'ENTRADA');
  const sai = registrosDia.find(r => r.tipo === 'SAIDA');
  const saiAlm = registrosDia.find(r => r.tipo === 'SAIDA_ALMOCO');
  const retAlm = registrosDia.find(r => r.tipo === 'RETORNO_ALMOCO');
  if (!ent || !sai) return null;
  const toMs = (r) => new Date(r.data_hora).getTime();
  let total = toMs(sai) - toMs(ent);
  if (saiAlm && retAlm) total -= (toMs(retAlm) - toMs(saiAlm));
  if (total < 0) return null;
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  return `${h}h ${String(m).padStart(2, '0')}min`;
}

function RelatoriosPonto() {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const hoje = new Date().toISOString().slice(0, 10);
  const primDiaMes = hoje.slice(0, 8) + '01';
  const [filtro, setFiltro] = useState({ funcionario: '', de: primDiaMes, ate: hoje });
  const [funcionarios, setFuncionarios] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance.get('/rh/funcionarios/')
      .then(({ data }) => {
        const arr = data?.results ?? data;
        setFuncionarios(Array.isArray(arr) ? arr : []);
      })
      .catch(() => {});
  }, [axiosInstance]);

  const buscar = useCallback(async () => {
    if (!filtro.funcionario) { showToast('Selecione um funcionário', 'warning'); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        funcionario: filtro.funcionario,
        data_inicio: filtro.de,
        data_fim: filtro.ate,
      });
      const { data } = await axiosInstance.get(`/rh/pontos/?${params}`);
      const arr = data?.results ?? data;
      setRegistros(Array.isArray(arr) ? arr : []);
    } catch { showToast('Erro ao buscar registros', 'error'); }
    finally { setLoading(false); }
  }, [axiosInstance, filtro, showToast]);

  // Agrupar por data
  const porDia = registros.reduce((acc, r) => {
    const dia = new Date(r.data_hora).toISOString().slice(0, 10);
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(r);
    return acc;
  }, {});
  const dias = Object.keys(porDia).sort().reverse();

  const totalMinutos = dias.reduce((sum, dia) => {
    const regs = porDia[dia];
    const ent = regs.find(r => r.tipo === 'ENTRADA');
    const sai = regs.find(r => r.tipo === 'SAIDA');
    const saiAlm = regs.find(r => r.tipo === 'SAIDA_ALMOCO');
    const retAlm = regs.find(r => r.tipo === 'RETORNO_ALMOCO');
    if (!ent || !sai) return sum;
    const toMs = (r) => new Date(r.data_hora).getTime();
    let total = toMs(sai) - toMs(ent);
    if (saiAlm && retAlm) total -= (toMs(retAlm) - toMs(saiAlm));
    return total > 0 ? sum + Math.floor(total / 60000) : sum;
  }, 0);
  const totalH = Math.floor(totalMinutos / 60);
  const totalM = totalMinutos % 60;

  const nomeFuncionario = funcionarios.find(f => String(f.id_funcionario) === String(filtro.funcionario))?.nome_completo || '';

  const imprimirPDF = () => {
    const linhas = dias.map((dia) => {
      const regs = porDia[dia];
      const get = (tipo) => regs.find(r => r.tipo === tipo);
      const horas = calcularHorasTrabalhadas(regs);
      const obs = regs.filter(r => r.observacao).map(r => r.observacao).join(' | ') || '';
      return `<tr>
        <td>${fmtData2(dia)}</td>
        <td style="color:#2E7D32">${fmtHora(get('ENTRADA')?.data_hora)}</td>
        <td style="color:#E65100">${fmtHora(get('SAIDA_ALMOCO')?.data_hora)}</td>
        <td style="color:#1565C0">${fmtHora(get('RETORNO_ALMOCO')?.data_hora)}</td>
        <td style="color:#B71C1C">${fmtHora(get('SAIDA')?.data_hora)}</td>
        <td><b>${horas || 'Incompleto'}</b></td>
        <td>${obs}</td>
      </tr>`;
    }).join('');

    const h = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Relatório de Ponto</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:12px;margin:20px}
        h2{color:#1565C0;margin-bottom:4px}
        .info{color:#555;margin-bottom:16px}
        .resumo{display:flex;gap:40px;margin-bottom:16px;padding:12px;background:#E3F2FD;border-radius:6px}
        .resumo div{text-align:center}
        .resumo .lbl{font-size:11px;color:#555}
        .resumo .val{font-size:22px;font-weight:bold;color:#1565C0}
        table{width:100%;border-collapse:collapse}
        th{background:#F5F5F5;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;font-size:11px}
        td{padding:5px 8px;border-bottom:1px solid #eee}
        tr:nth-child(even){background:#FAFAFA}
      </style></head><body>
      <h2>Relatório de Ponto</h2>
      <div class="info"><b>Funcionário:</b> ${nomeFuncionario} &nbsp;|&nbsp; <b>Período:</b> ${fmtData2(filtro.de)} a ${fmtData2(filtro.ate)}</div>
      <div class="resumo">
        <div><div class="lbl">Dias trabalhados</div><div class="val">${dias.length}</div></div>
        <div><div class="lbl">Total de horas</div><div class="val">${totalH}h ${String(totalM).padStart(2,'0')}min</div></div>
        <div><div class="lbl">Média diária</div><div class="val">${dias.length > 0 ? `${Math.floor(totalMinutos/dias.length/60)}h ${String(Math.floor((totalMinutos/dias.length)%60)).padStart(2,'0')}min` : '—'}</div></div>
      </div>
      <table><thead><tr><th>Data</th><th>Entrada</th><th>S.Almoço</th><th>R.Almoço</th><th>Saída</th><th>Total</th><th>Ocorrências</th></tr></thead>
      <tbody>${linhas}</tbody></table>
      <p style="margin-top:20px;font-size:10px;color:#999">Gerado em ${new Date().toLocaleString('pt-BR')}</p>
      </body></html>`;

    const w = window.open('', '_blank');
    w.document.write(h);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>Relatório de Ponto</Typography>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }} elevation={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Funcionário</InputLabel>
            <Select value={filtro.funcionario}
              onChange={(e) => setFiltro(p => ({ ...p, funcionario: e.target.value }))}
              label="Funcionário">
              {funcionarios.map((f) => (
                <MenuItem key={f.id_funcionario} value={f.id_funcionario}>{f.nome_completo}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="De" type="date" size="small" value={filtro.de}
            onChange={(e) => setFiltro(p => ({ ...p, de: e.target.value }))}
            InputLabelProps={{ shrink: true }} />
          <TextField label="Até" type="date" size="small" value={filtro.ate}
            onChange={(e) => setFiltro(p => ({ ...p, ate: e.target.value }))}
            InputLabelProps={{ shrink: true }} />
          <Button variant="contained" onClick={buscar} disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : <RelatorioIcon />}>
            Gerar
          </Button>
          {dias.length > 0 && (
            <Button variant="outlined" color="error" onClick={imprimirPDF} startIcon={<PdfIcon />}>
              PDF
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Resumo */}
      {dias.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: '#E3F2FD' }} elevation={0}>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="caption" color="text.secondary">Dias trabalhados</Typography>
              <Typography variant="h5" fontWeight={700}>{dias.length}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Total de horas</Typography>
              <Typography variant="h5" fontWeight={700}>{totalH}h {String(totalM).padStart(2, '0')}min</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Média diária</Typography>
              <Typography variant="h5" fontWeight={700}>
                {dias.length > 0 ? `${Math.floor(totalMinutos / dias.length / 60)}h ${String(Math.floor((totalMinutos / dias.length) % 60)).padStart(2, '0')}min` : '—'}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Tabela por dia */}
      {dias.length === 0 && !loading ? (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          Selecione um funcionário e clique em Gerar.
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                <TableCell><b>Data</b></TableCell>
                <TableCell><b>Entrada</b></TableCell>
                <TableCell><b>S. Almoço</b></TableCell>
                <TableCell><b>R. Almoço</b></TableCell>
                <TableCell><b>Saída</b></TableCell>
                <TableCell><b>Total</b></TableCell>
                <TableCell><b>Ocorrências</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dias.map((dia) => {
                const regs = porDia[dia];
                const get = (tipo) => regs.find(r => r.tipo === tipo);
                const horas = calcularHorasTrabalhadas(regs);
                const temObs = regs.some(r => r.observacao);
                return (
                  <TableRow key={dia} hover>
                    <TableCell><b>{fmtData2(dia)}</b></TableCell>
                    <TableCell sx={{ color: '#2E7D32' }}>{fmtHora(get('ENTRADA')?.data_hora)}</TableCell>
                    <TableCell sx={{ color: '#E65100' }}>{fmtHora(get('SAIDA_ALMOCO')?.data_hora)}</TableCell>
                    <TableCell sx={{ color: '#1565C0' }}>{fmtHora(get('RETORNO_ALMOCO')?.data_hora)}</TableCell>
                    <TableCell sx={{ color: '#B71C1C' }}>{fmtHora(get('SAIDA')?.data_hora)}</TableCell>
                    <TableCell>
                      {horas ? (
                        <Chip label={horas} size="small" color="success" variant="outlined" />
                      ) : (
                        <Chip label="Incompleto" size="small" color="warning" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      {temObs && (
                        <Chip size="small" label={regs.filter(r => r.observacao).map(r => r.observacao).join(' | ')}
                          variant="outlined" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

// ── Página Principal ──────────────────────────────────────────────────────────
export default function PontoPageWrapper() {
  const [tab, setTab] = useState(0);
  return (
    <Box>
      <Paper sx={{ mb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab icon={<ClockIcon />} label="Terminal" iconPosition="start" />
          <Tab icon={<RelatorioIcon />} label="Relatório" iconPosition="start" />
        </Tabs>
      </Paper>
      {tab === 0 && <TerminalPonto />}
      {tab === 1 && <RelatoriosPonto />}
    </Box>
  );
}
