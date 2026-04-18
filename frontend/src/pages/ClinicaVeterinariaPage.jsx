import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Alert, CircularProgress, Divider,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Card, CardContent, Autocomplete,
  Accordion, AccordionSummary, AccordionDetails, Tooltip, Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MedicalServices as MedicalIcon,
  Vaccines as VaccinesIcon,
  Biotech as BiotechIcon,
  Hotel as HospitalIcon,
  Pets as PetsIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  PlayArrow as AtendenrIcon,
  Assignment as ProntuarioIcon,
  LocalHospital as ClinicaIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

// ──────────────────── helpers ────────────────────
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('pt-BR') : '—');
const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('pt-BR') : '—');

const STATUS_CONSULTA_COLORS = {
  'Agendada': 'primary',
  'Em Atendimento': 'warning',
  'Concluída': 'success',
  'Cancelada': 'error',
};
const STATUS_EXAME_COLORS = {
  'Solicitado': 'default',
  'Coletado': 'info',
  'Aguardando': 'warning',
  'Concluído': 'success',
  'Cancelado': 'error',
};

// ──────────────────── component ────────────────────
const ClinicaVeterinariaPage = () => {
  const { axiosInstance, user, permissions } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // dados
  const [pets, setPets] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [vacinas, setVacinas] = useState([]);
  const [exames, setExames] = useState([]);
  const [internacoes, setInternacoes] = useState([]);
  const [vacinasVencendo, setVacinasVencendo] = useState([]);
  const [internados, setInternados] = useState([]);
  const [agendaHoje, setAgendaHoje] = useState([]);

  // dialogs
  const [dlgConsulta, setDlgConsulta] = useState(false);
  const [dlgVacina, setDlgVacina] = useState(false);
  const [dlgExame, setDlgExame] = useState(false);
  const [dlgInternacao, setDlgInternacao] = useState(false);
  const [dlgResultado, setDlgResultado] = useState(false);
  const [dlgAlta, setDlgAlta] = useState(false);
  const [dlgVeterinario, setDlgVeterinario] = useState(false);
  const [dlgProntuario, setDlgProntuario] = useState(false);
  const [prontuarioData, setProntuarioData] = useState(null);
  const [petProntuario, setPetProntuario] = useState(null);

  // form states
  const emptyConsulta = {
    id_pet: '', id_cliente: '', id_veterinario: '', tipo_consulta: 'Rotina',
    data_consulta: '', queixa_principal: '', historico_clinico: '',
    peso_consulta: '', temperatura: '', frequencia_cardiaca: '', frequencia_respiratoria: '',
    diagnostico: '', tratamento: '', receituario: '', observacoes: '',
    retorno_previsto: '', valor_consulta: '0.00', status: 'Agendada',
  };
  const emptyVacina = {
    id_pet: '', id_veterinario: '', nome_vacina: '', fabricante: '', lote: '',
    data_aplicacao: '', proxima_dose: '', via_aplicacao: 'Subcutânea', observacoes: '',
  };
  const emptyExame = {
    id_pet: '', id_veterinario: '', id_consulta: '', tipo_exame: 'Hemograma',
    descricao: '', data_solicitacao: '', laboratorio: '', valor: '0', observacoes: '',
  };
  const emptyInternacao = {
    id_pet: '', id_cliente: '', id_veterinario: '', motivo: 'Tratamento Clínico',
    descricao_motivo: '', data_entrada: '', numero_baia: '',
    dieta: '', medicamentos: '', observacoes: '', valor_diaria: '0',
  };
  const emptyVet = { nome: '', crmv: '', especialidade: '', telefone: '', email: '' };

  const [formConsulta, setFormConsulta] = useState(emptyConsulta);
  const [formVacina, setFormVacina] = useState(emptyVacina);
  const [formExame, setFormExame] = useState(emptyExame);
  const [formInternacao, setFormInternacao] = useState(emptyInternacao);
  const [formResultado, setFormResultado] = useState({ resultado: '' });
  const [formAlta, setFormAlta] = useState({ valor_total: '', observacoes_alta: '' });
  const [formVet, setFormVet] = useState(emptyVet);
  const [editandoId, setEditandoId] = useState(null);
  const [exameAlvo, setExameAlvo] = useState(null);
  const [internacaoAlvo, setInternacaoAlvo] = useState(null);

  // filtros
  const [filtroPet, setFiltroPet] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // ── fetch ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [
        petsR, clientesR, vetsR, consultasR, vacinasR,
        examesR, internacoesR, vacinasVR, internadosR, agendaR,
      ] = await Promise.all([
        axiosInstance.get('/pets/?page_size=1000'),
        axiosInstance.get('/clientes/?page_size=1000'),
        axiosInstance.get('/veterinarios/'),
        axiosInstance.get('/consultas-vet/?ordering=-data_consulta'),
        axiosInstance.get('/vacinas-pet/?ordering=-data_aplicacao'),
        axiosInstance.get('/exames-vet/?ordering=-data_solicitacao'),
        axiosInstance.get('/internacoes-vet/?ordering=-data_entrada'),
        axiosInstance.get('/vacinas-pet/vencendo/'),
        axiosInstance.get('/internacoes-vet/internados_ativos/'),
        axiosInstance.get('/consultas-vet/agenda_hoje/'),
      ]);
      const _sa = d => Array.isArray(d) ? d : Array.isArray(d?.results) ? d.results : [];
      setPets(_sa(petsR.data));
      setClientes(_sa(clientesR.data));
      setVeterinarios(_sa(vetsR.data));
      setConsultas(_sa(consultasR.data));
      setVacinas(_sa(vacinasR.data));
      setExames(_sa(examesR.data));
      setInternacoes(_sa(internacoesR.data));
      setVacinasVencendo(vacinasVR.data || []);
      setInternados(internadosR.data || []);
      setAgendaHoje(agendaR.data || []);
    } catch (e) {
      setError('Erro ao carregar dados da clínica veterinária');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── auto-preencher cliente ao selecionar pet ──
  const handlePetSelect = (idPet, setForm) => {
    const pet = pets.find(p => p.id_pet === Number(idPet) || p.id_pet === idPet);
    if (pet) {
      setForm(prev => ({ ...prev, id_pet: idPet, id_cliente: pet.id_cliente }));
    }
  };

  // ── salvar consulta ──
  const salvarConsulta = async () => {
    try {
      const payload = { ...formConsulta };
      if (!payload.id_pet || !payload.data_consulta) {
        toast.error('Pet e data são obrigatórios'); return;
      }
      
      // Limpar campos vazios (converter '' para null)
      const camposNumericos = ['peso_consulta', 'temperatura', 'frequencia_cardiaca', 'frequencia_respiratoria', 'valor_consulta'];
      camposNumericos.forEach(campo => {
        if (payload[campo] === '' || payload[campo] === null || payload[campo] === undefined) {
          payload[campo] = campo === 'valor_consulta' ? '0.00' : null;
        }
      });
      
      // Campos de texto vazios -> null
      const camposTexto = ['queixa_principal', 'historico_clinico', 'diagnostico', 'tratamento', 'receituario', 'observacoes', 'retorno_previsto'];
      camposTexto.forEach(campo => {
        if (payload[campo] === '') {
          payload[campo] = null;
        }
      });
      
      // id_veterinario vazio -> null
      if (!payload.id_veterinario || payload.id_veterinario === '') {
        payload.id_veterinario = null;
      }
      
      console.log('📋 Payload da consulta:', payload);
      
      if (editandoId) {
        await axiosInstance.put(`/consultas-vet/${editandoId}/`, payload);
        toast.success('Consulta atualizada!');
      } else {
        await axiosInstance.post('/consultas-vet/', payload);
        toast.success('Consulta agendada!');
      }
      setDlgConsulta(false); setEditandoId(null); setFormConsulta(emptyConsulta);
      fetchAll();
    } catch (e) {
      console.error('❌ Erro detalhado:', e.response?.data);
      console.error('❌ Erro expandido:', JSON.stringify(e.response?.data, null, 2));
      toast.error('Erro ao salvar consulta: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message));
    }
  };

  // ── salvar vacina ──
  const salvarVacina = async () => {
    try {
      const payload = { ...formVacina };
      if (!payload.id_pet || !payload.nome_vacina || !payload.data_aplicacao) {
        toast.error('Pet, vacina e data de aplicação são obrigatórios'); return;
      }
      await axiosInstance.post('/vacinas-pet/', payload);
      toast.success('Vacina registrada!');
      setDlgVacina(false); setFormVacina(emptyVacina); fetchAll();
    } catch (e) {
      toast.error('Erro ao registrar vacina: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message));
    }
  };

  // ── salvar exame ──
  const salvarExame = async () => {
    try {
      const payload = { ...formExame };
      if (!payload.id_pet || !payload.data_solicitacao) {
        toast.error('Pet e data são obrigatórios'); return;
      }
      await axiosInstance.post('/exames-vet/', payload);
      toast.success('Exame solicitado!');
      setDlgExame(false); setFormExame(emptyExame); fetchAll();
    } catch (e) {
      toast.error('Erro ao solicitar exame: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message));
    }
  };

  // ── registrar resultado de exame ──
  const registrarResultado = async () => {
    try {
      await axiosInstance.post(`/exames-vet/${exameAlvo}/registrar_resultado/`, formResultado);
      toast.success('Resultado registrado!');
      setDlgResultado(false); setFormResultado({ resultado: '' }); fetchAll();
    } catch (e) {
      toast.error('Erro: ' + e.message);
    }
  };

  // ── salvar internação ──
  const salvarInternacao = async () => {
    try {
      const payload = { ...formInternacao };
      if (!payload.id_pet || !payload.data_entrada) {
        toast.error('Pet e data de entrada são obrigatórios'); return;
      }
      if (editandoId) {
        await axiosInstance.put(`/internacoes-vet/${editandoId}/`, payload);
        toast.success('Internação atualizada!');
      } else {
        await axiosInstance.post('/internacoes-vet/', payload);
        toast.success('Internação registrada!');
      }
      setDlgInternacao(false); setEditandoId(null); setFormInternacao(emptyInternacao);
      fetchAll();
    } catch (e) {
      toast.error('Erro ao salvar internação: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message));
    }
  };

  // ── dar alta ──
  const darAlta = async () => {
    try {
      await axiosInstance.post(`/internacoes-vet/${internacaoAlvo}/dar_alta/`, formAlta);
      toast.success('Alta concedida!');
      setDlgAlta(false); setFormAlta({ valor_total: '', observacoes_alta: '' }); fetchAll();
    } catch (e) {
      toast.error('Erro: ' + e.message);
    }
  };

  // ── mudar status consulta ──
  const mudarStatusConsulta = async (id, novoStatus) => {
    const endpoints = {
      'Em Atendimento': 'iniciar',
      'Concluída': 'concluir',
      'Cancelada': 'cancelar',
    };
    const ep = endpoints[novoStatus];
    if (!ep) return;
    try {
      await axiosInstance.post(`/consultas-vet/${id}/${ep}/`);
      toast.success(`Consulta: ${novoStatus}`);
      fetchAll();
    } catch (e) {
      toast.error('Erro: ' + e.message);
    }
  };

  // ── salvar veterinário ──
  const salvarVeterinario = async () => {
    try {
      if (!formVet.nome || !formVet.crmv) { toast.error('Nome e CRMV são obrigatórios'); return; }
      if (editandoId) {
        await axiosInstance.put(`/veterinarios/${editandoId}/`, formVet);
        toast.success('Veterinário atualizado!');
      } else {
        await axiosInstance.post('/veterinarios/', formVet);
        toast.success('Veterinário cadastrado!');
      }
      setDlgVeterinario(false); setEditandoId(null); setFormVet(emptyVet); fetchAll();
    } catch (e) {
      toast.error('Erro: ' + e.message);
    }
  };

  // ── carregar prontuário ──
  const abrirProntuario = async (pet) => {
    try {
      const r = await axiosInstance.get(`/pets-clinica/${pet.id_pet}/prontuario/`);
      setProntuarioData(r.data);
      setPetProntuario(pet);
      setDlgProntuario(true);
    } catch (e) {
      toast.error('Erro ao carregar prontuário');
    }
  };

  // ────────────────── FILTROS ──────────────────
  const filtrar = (lista, campo = 'nome_pet') =>
    lista.filter(item =>
      !filtroPet || (item[campo] || '').toLowerCase().includes(filtroPet.toLowerCase())
    ).filter(item =>
      !filtroStatus || item.status === filtroStatus
    );

  if (loading) return <Box display="flex" justifyContent="center" pt={8}><CircularProgress /></Box>;

  // ────────────────── RENDER ──────────────────
  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 60%, #3949ab 100%)',
        borderRadius: 2, p: 3, mb: 3, color: 'white',
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <ClinicaIcon sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">Clínica Veterinária</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Prontuários · Consultas · Vacinas · Exames · Internações
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {vacinasVencendo.length > 0 && (
            <Chip icon={<WarningIcon />}
              label={`${vacinasVencendo.length} vacina(s) vencendo`}
              color="warning" size="small" />
          )}
          {internados.length > 0 && (
            <Chip icon={<HospitalIcon />}
              label={`${internados.length} internado(s)`}
              color="error" size="small" />
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<ScheduleIcon />} iconPosition="start" label="Agenda / Dashboard" />
          <Tab icon={<MedicalIcon />} iconPosition="start" label="Consultas" />
          <Tab icon={<VaccinesIcon />} iconPosition="start" label="Vacinas" />
          <Tab icon={<BiotechIcon />} iconPosition="start" label="Exames" />
          <Tab icon={<HospitalIcon />} iconPosition="start" label="Internações" />
          <Tab icon={<ProntuarioIcon />} iconPosition="start" label="Prontuário" />
          <Tab icon={<PersonIcon />} iconPosition="start" label="Veterinários" />
        </Tabs>
      </Paper>

      {/* ══════════════ TAB 0: DASHBOARD ══════════════ */}
      {tab === 0 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Consultas hoje', value: agendaHoje.length, icon: <MedicalIcon />, color: '#1a237e' },
              { label: 'Internados', value: internados.length, icon: <HospitalIcon />, color: '#b71c1c' },
              { label: 'Vacinas vencendo', value: vacinasVencendo.length, icon: <VaccinesIcon />, color: '#e65100' },
              { label: 'Exames pendentes', value: exames.filter(e => ['Solicitado','Aguardando'].includes(e.status)).length, icon: <BiotechIcon />, color: '#1b5e20' },
            ].map(card => (
              <Grid item xs={6} md={3} key={card.label}>
                <Card sx={{ borderLeft: `4px solid ${card.color}` }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
                    <Box sx={{ color: card.color }}>{card.icon}</Box>
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color={card.color}>{card.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            {/* Agenda do dia */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  📅 Agenda de Hoje ({new Date().toLocaleDateString('pt-BR')})
                </Typography>
                {agendaHoje.length === 0
                  ? <Typography color="text.secondary">Nenhuma consulta agendada para hoje.</Typography>
                  : agendaHoje.map(c => (
                    <Box key={c.id_consulta} sx={{
                      p: 1.5, mb: 1, borderRadius: 1, bgcolor: '#f5f5f5',
                      display: 'flex', alignItems: 'center', gap: 2,
                    }}>
                      <PetsIcon color="primary" />
                      <Box flex={1}>
                        <Typography fontWeight="bold">{c.nome_pet}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fmtDateTime(c.data_consulta)} · {c.tipo_consulta_display} · {c.nome_veterinario || 'Sem veterinário'}
                        </Typography>
                      </Box>
                      <Chip label={c.status} color={STATUS_CONSULTA_COLORS[c.status] || 'default'} size="small" />
                    </Box>
                  ))
                }
              </Paper>
            </Grid>

            {/* Internados ativos */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">🏥 Internados Agora</Typography>
                {internados.length === 0
                  ? <Typography color="text.secondary">Nenhum pet internado no momento.</Typography>
                  : internados.map(i => (
                    <Box key={i.id_internacao} sx={{
                      p: 1.5, mb: 1, borderRadius: 1, bgcolor: '#fff3e0',
                      display: 'flex', alignItems: 'center', gap: 2,
                    }}>
                      <HospitalIcon color="error" />
                      <Box flex={1}>
                        <Typography fontWeight="bold">{i.nome_pet}
                          {i.numero_baia && <Chip label={`Baia ${i.numero_baia}`} size="small" sx={{ ml: 1 }} />}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Entrada: {fmtDateTime(i.data_entrada)} · {i.motivo_display} · {i.dias_internado} dia(s)
                        </Typography>
                      </Box>
                      <Button size="small" variant="outlined" color="success"
                        onClick={() => { setInternacaoAlvo(i.id_internacao); setDlgAlta(true); }}>
                        Alta
                      </Button>
                    </Box>
                  ))
                }
              </Paper>
            </Grid>

            {/* Vacinas vencendo */}
            {vacinasVencendo.length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    ⚠️ Vacinas Vencendo nos Próximos 30 Dias
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Pet</TableCell>
                          <TableCell>Vacina</TableCell>
                          <TableCell>Última Dose</TableCell>
                          <TableCell>Próxima Dose</TableCell>
                          <TableCell>Situação</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {vacinasVencendo.map(v => (
                          <TableRow key={v.id_vacina}
                            sx={{ bgcolor: v.vencida ? '#ffebee' : '#fff8e1' }}>
                            <TableCell>{v.nome_pet}</TableCell>
                            <TableCell>{v.nome_vacina}</TableCell>
                            <TableCell>{fmtDate(v.data_aplicacao)}</TableCell>
                            <TableCell>{fmtDate(v.proxima_dose)}</TableCell>
                            <TableCell>
                              <Chip label={v.vencida ? 'Vencida' : 'Vence em breve'}
                                color={v.vencida ? 'error' : 'warning'} size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* ══════════════ TAB 1: CONSULTAS ══════════════ */}
      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Buscar por pet..." value={filtroPet}
              onChange={e => setFiltroPet(e.target.value)} sx={{ minWidth: 220 }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filtroStatus} label="Status" onChange={e => setFiltroStatus(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {['Agendada','Em Atendimento','Concluída','Cancelada'].map(s =>
                  <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<AddIcon />}
              onClick={() => { setFormConsulta(emptyConsulta); setEditandoId(null); setDlgConsulta(true); }}>
              Nova Consulta
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#1a237e' }}>
                <TableRow>
                  {['Pet','Espécie','Cliente','Veterinário','Tipo','Data','Status','Ações'].map(h =>
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtrar(consultas).map(c => (
                  <TableRow key={c.id_consulta} hover>
                    <TableCell><b>{c.nome_pet}</b></TableCell>
                    <TableCell>{c.especie_pet}</TableCell>
                    <TableCell>{c.nome_cliente}</TableCell>
                    <TableCell>{c.nome_veterinario || '—'}</TableCell>
                    <TableCell>{c.tipo_consulta_display}</TableCell>
                    <TableCell>{fmtDateTime(c.data_consulta)}</TableCell>
                    <TableCell>
                      <Chip label={c.status} color={STATUS_CONSULTA_COLORS[c.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => {
                            setFormConsulta({ ...emptyConsulta, ...c, id_pet: c.id_pet, id_cliente: c.id_cliente, id_veterinario: c.id_veterinario || '' });
                            setEditandoId(c.id_consulta); setDlgConsulta(true);
                          }}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        {c.status === 'Agendada' && (
                          <Tooltip title="Iniciar atendimento">
                            <IconButton size="small" color="warning"
                              onClick={() => mudarStatusConsulta(c.id_consulta, 'Em Atendimento')}>
                              <AtendenrIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {c.status === 'Em Atendimento' && (
                          <Tooltip title="Concluir">
                            <IconButton size="small" color="success"
                              onClick={() => mudarStatusConsulta(c.id_consulta, 'Concluída')}>
                              <CheckIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {['Agendada','Em Atendimento'].includes(c.status) && (
                          <Tooltip title="Cancelar">
                            <IconButton size="small" color="error"
                              onClick={() => mudarStatusConsulta(c.id_consulta, 'Cancelada')}>
                              <CancelIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filtrar(consultas).length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center">Nenhuma consulta encontrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ══════════════ TAB 2: VACINAS ══════════════ */}
      {tab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Buscar por pet..." value={filtroPet}
              onChange={e => setFiltroPet(e.target.value)} sx={{ minWidth: 220 }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
            <Button variant="contained" color="success" startIcon={<VaccinesIcon />}
              onClick={() => { setFormVacina(emptyVacina); setDlgVacina(true); }}>
              Registrar Vacina
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#1b5e20' }}>
                <TableRow>
                  {['Pet','Espécie','Vacina','Fabricante','Lote','Data Aplicação','Próxima Dose','Situação'].map(h =>
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtrar(vacinas).map(v => (
                  <TableRow key={v.id_vacina} hover
                    sx={{ bgcolor: v.vencida ? '#ffebee' : undefined }}>
                    <TableCell><b>{v.nome_pet}</b></TableCell>
                    <TableCell>{v.especie_pet}</TableCell>
                    <TableCell>{v.nome_vacina}</TableCell>
                    <TableCell>{v.fabricante || '—'}</TableCell>
                    <TableCell>{v.lote || '—'}</TableCell>
                    <TableCell>{fmtDate(v.data_aplicacao)}</TableCell>
                    <TableCell>{fmtDate(v.proxima_dose)}</TableCell>
                    <TableCell>
                      {v.proxima_dose
                        ? <Chip label={v.vencida ? 'Vencida' : 'OK'} color={v.vencida ? 'error' : 'success'} size="small" />
                        : <Chip label="Dose única" color="default" size="small" />
                      }
                    </TableCell>
                  </TableRow>
                ))}
                {filtrar(vacinas).length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center">Nenhuma vacina registrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ══════════════ TAB 3: EXAMES ══════════════ */}
      {tab === 3 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Buscar por pet..." value={filtroPet}
              onChange={e => setFiltroPet(e.target.value)} sx={{ minWidth: 220 }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filtroStatus} label="Status" onChange={e => setFiltroStatus(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {['Solicitado','Coletado','Aguardando','Concluído','Cancelado'].map(s =>
                  <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" color="info" startIcon={<BiotechIcon />}
              onClick={() => { setFormExame(emptyExame); setDlgExame(true); }}>
              Solicitar Exame
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#0d47a1' }}>
                <TableRow>
                  {['Pet','Espécie','Tipo','Laboratório','Data Solicitação','Resultado','Status','Ações'].map(h =>
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtrar(exames).map(e => (
                  <TableRow key={e.id_exame} hover>
                    <TableCell><b>{e.nome_pet}</b></TableCell>
                    <TableCell>{e.especie_pet}</TableCell>
                    <TableCell>{e.tipo_exame_display}</TableCell>
                    <TableCell>{e.laboratorio || '—'}</TableCell>
                    <TableCell>{fmtDate(e.data_solicitacao)}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="caption" noWrap>
                        {e.resultado ? e.resultado.substring(0, 60) + (e.resultado.length > 60 ? '…' : '') : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={e.status_display || e.status}
                        color={STATUS_EXAME_COLORS[e.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      {['Solicitado','Coletado','Aguardando'].includes(e.status) && (
                        <Tooltip title="Registrar resultado">
                          <IconButton size="small" color="success"
                            onClick={() => { setExameAlvo(e.id_exame); setFormResultado({ resultado: '' }); setDlgResultado(true); }}>
                            <CheckIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtrar(exames).length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center">Nenhum exame encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ══════════════ TAB 4: INTERNAÇÕES ══════════════ */}
      {tab === 4 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Buscar por pet..." value={filtroPet}
              onChange={e => setFiltroPet(e.target.value)} sx={{ minWidth: 220 }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
            <Button variant="contained" color="error" startIcon={<HospitalIcon />}
              onClick={() => { setFormInternacao(emptyInternacao); setEditandoId(null); setDlgInternacao(true); }}>
              Internar Pet
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#b71c1c' }}>
                <TableRow>
                  {['Pet','Baia','Motivo','Veterinário','Entrada','Alta','Dias','Situação','Ações'].map(h =>
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtrar(internacoes).map(i => (
                  <TableRow key={i.id_internacao} hover
                    sx={{ bgcolor: !i.alta_concedida ? '#fff3e0' : undefined }}>
                    <TableCell><b>{i.nome_pet}</b></TableCell>
                    <TableCell>{i.numero_baia || '—'}</TableCell>
                    <TableCell>{i.motivo_display}</TableCell>
                    <TableCell>{i.nome_veterinario || '—'}</TableCell>
                    <TableCell>{fmtDateTime(i.data_entrada)}</TableCell>
                    <TableCell>{i.data_alta ? fmtDateTime(i.data_alta) : '—'}</TableCell>
                    <TableCell>{i.dias_internado}</TableCell>
                    <TableCell>
                      <Chip label={i.alta_concedida ? 'Alta' : 'Internado'}
                        color={i.alta_concedida ? 'success' : 'error'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Editar">
                          <IconButton size="small"
                            onClick={() => {
                              setFormInternacao({ ...emptyInternacao, ...i });
                              setEditandoId(i.id_internacao); setDlgInternacao(true);
                            }}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        {!i.alta_concedida && (
                          <Tooltip title="Dar alta">
                            <IconButton size="small" color="success"
                              onClick={() => { setInternacaoAlvo(i.id_internacao); setFormAlta({ valor_total: String(i.valor_total || ''), observacoes_alta: '' }); setDlgAlta(true); }}>
                              <CheckIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filtrar(internacoes).length === 0 && (
                  <TableRow><TableCell colSpan={9} align="center">Nenhuma internação encontrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ══════════════ TAB 5: PRONTUÁRIO ══════════════ */}
      {tab === 5 && (
        <Box>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              🗂️ Prontuário do Pet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Pesquise um pet para ver todo o histórico clínico.
            </Typography>
            <Autocomplete
              options={pets}
              getOptionLabel={p => `${p.nome_pet} (${p.especie || ''}) — ${p.id_cliente_nome || p.id_cliente}`}
              renderOption={(props, p) => (
                <Box component="li" {...props} key={p.id_pet}>
                  <PetsIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography fontWeight="bold">{p.nome_pet}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.especie} · {p.raca} · Dono: {p.nome_razao_social || ''}
                    </Typography>
                  </Box>
                </Box>
              )}
              onChange={(_, pet) => pet && abrirProntuario(pet)}
              renderInput={params => <TextField {...params} label="Selecione o pet" size="small" sx={{ maxWidth: 400 }} />}
            />
          </Paper>
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Selecione um pet acima para visualizar o prontuário completo.
            </Typography>
          </Paper>
        </Box>
      )}

      {/* ══════════════ TAB 6: VETERINÁRIOS ══════════════ */}
      {tab === 6 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant="contained" startIcon={<PersonIcon />}
              onClick={() => { setFormVet(emptyVet); setEditandoId(null); setDlgVeterinario(true); }}>
              Cadastrar Veterinário
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#283593' }}>
                <TableRow>
                  {['Nome','CRMV','Especialidade','Telefone','E-mail','Ativo','Ações'].map(h =>
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {veterinarios.map(v => (
                  <TableRow key={v.id_veterinario} hover>
                    <TableCell><b>Dr(a). {v.nome}</b></TableCell>
                    <TableCell>{v.crmv}</TableCell>
                    <TableCell>{v.especialidade || '—'}</TableCell>
                    <TableCell>{v.telefone || '—'}</TableCell>
                    <TableCell>{v.email || '—'}</TableCell>
                    <TableCell>
                      <Chip label={v.ativo ? 'Ativo' : 'Inativo'}
                        color={v.ativo ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => {
                        setFormVet({ nome: v.nome, crmv: v.crmv, especialidade: v.especialidade || '', telefone: v.telefone || '', email: v.email || '', ativo: v.ativo });
                        setEditandoId(v.id_veterinario); setDlgVeterinario(true);
                      }}><EditIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {veterinarios.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center">Nenhum veterinário cadastrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ══════════════ DIALOGS ══════════════ */}

      {/* Dialog Nova/Editar Consulta */}
      <Dialog open={dlgConsulta} onClose={() => setDlgConsulta(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white' }}>
          <MedicalIcon sx={{ mr: 1 }} />
          {editandoId ? 'Editar Consulta' : 'Nova Consulta Veterinária'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Pet</InputLabel>
                <Select value={formConsulta.id_pet} label="Pet"
                  onChange={e => handlePetSelect(e.target.value, setFormConsulta)}>
                  {pets.map(p => <MenuItem key={p.id_pet} value={p.id_pet}>{p.nome_pet} ({p.especie})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Veterinário</InputLabel>
                <Select value={formConsulta.id_veterinario} label="Veterinário"
                  onChange={e => setFormConsulta(p => ({ ...p, id_veterinario: e.target.value }))}>
                  <MenuItem value="">— Sem veterinário —</MenuItem>
                  {veterinarios.map(v => <MenuItem key={v.id_veterinario} value={v.id_veterinario}>Dr(a). {v.nome}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={formConsulta.tipo_consulta} label="Tipo"
                  onChange={e => setFormConsulta(p => ({ ...p, tipo_consulta: e.target.value }))}>
                  <MenuItem value="Rotina">Rotina</MenuItem>
                  <MenuItem value="Retorno">Retorno</MenuItem>
                  <MenuItem value="Emergência">Emergência</MenuItem>
                  <MenuItem value="Cirurgia">Cirurgia</MenuItem>
                  <MenuItem value="Vacina">Vacina</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Data / Hora *" type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={formConsulta.data_consulta}
                onChange={e => setFormConsulta(p => ({ ...p, data_consulta: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={formConsulta.status} label="Status"
                  onChange={e => setFormConsulta(p => ({ ...p, status: e.target.value }))}>
                  {['Agendada','Em Atendimento','Concluída','Cancelada'].map(s =>
                    <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider>Sinais Vitais</Divider>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Peso (kg)" type="number"
                value={formConsulta.peso_consulta}
                onChange={e => setFormConsulta(p => ({ ...p, peso_consulta: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Temperatura (°C)" type="number"
                value={formConsulta.temperatura}
                onChange={e => setFormConsulta(p => ({ ...p, temperatura: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="FC (bpm)" type="number"
                value={formConsulta.frequencia_cardiaca}
                onChange={e => setFormConsulta(p => ({ ...p, frequencia_cardiaca: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="FR (rpm)" type="number"
                value={formConsulta.frequencia_respiratoria}
                onChange={e => setFormConsulta(p => ({ ...p, frequencia_respiratoria: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Divider>Clínica</Divider>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Queixa principal / Anamnese"
                value={formConsulta.queixa_principal}
                onChange={e => setFormConsulta(p => ({ ...p, queixa_principal: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Diagnóstico"
                value={formConsulta.diagnostico}
                onChange={e => setFormConsulta(p => ({ ...p, diagnostico: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Tratamento / Procedimentos"
                value={formConsulta.tratamento}
                onChange={e => setFormConsulta(p => ({ ...p, tratamento: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={3} label="Receituário (medicamentos, dose, frequência, duração)"
                value={formConsulta.receituario}
                onChange={e => setFormConsulta(p => ({ ...p, receituario: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Retorno previsto" type="date"
                InputLabelProps={{ shrink: true }}
                value={formConsulta.retorno_previsto}
                onChange={e => setFormConsulta(p => ({ ...p, retorno_previsto: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Valor (R$)" type="number"
                value={formConsulta.valor_consulta}
                onChange={e => setFormConsulta(p => ({ ...p, valor_consulta: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Observações"
                value={formConsulta.observacoes}
                onChange={e => setFormConsulta(p => ({ ...p, observacoes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgConsulta(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvarConsulta}>
            {editandoId ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Registrar Vacina */}
      <Dialog open={dlgVacina} onClose={() => setDlgVacina(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1b5e20', color: 'white' }}>
          <VaccinesIcon sx={{ mr: 1 }} />
          Registrar Vacina Aplicada
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Pet</InputLabel>
                <Select value={formVacina.id_pet} label="Pet"
                  onChange={e => setFormVacina(p => ({ ...p, id_pet: e.target.value }))}>
                  {pets.map(p => <MenuItem key={p.id_pet} value={p.id_pet}>{p.nome_pet} ({p.especie})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Vacina *" required placeholder="Ex: V10, Antirrábica"
                value={formVacina.nome_vacina}
                onChange={e => setFormVacina(p => ({ ...p, nome_vacina: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Veterinário</InputLabel>
                <Select value={formVacina.id_veterinario} label="Veterinário"
                  onChange={e => setFormVacina(p => ({ ...p, id_veterinario: e.target.value }))}>
                  <MenuItem value="">— Sem veterinário —</MenuItem>
                  {veterinarios.map(v => <MenuItem key={v.id_veterinario} value={v.id_veterinario}>Dr(a). {v.nome}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Fabricante"
                value={formVacina.fabricante}
                onChange={e => setFormVacina(p => ({ ...p, fabricante: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Lote"
                value={formVacina.lote}
                onChange={e => setFormVacina(p => ({ ...p, lote: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Data Aplicação *" type="date"
                InputLabelProps={{ shrink: true }}
                value={formVacina.data_aplicacao}
                onChange={e => setFormVacina(p => ({ ...p, data_aplicacao: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Próxima Dose" type="date"
                InputLabelProps={{ shrink: true }}
                value={formVacina.proxima_dose}
                onChange={e => setFormVacina(p => ({ ...p, proxima_dose: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Observações"
                value={formVacina.observacoes}
                onChange={e => setFormVacina(p => ({ ...p, observacoes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgVacina(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={salvarVacina}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Solicitar Exame */}
      <Dialog open={dlgExame} onClose={() => setDlgExame(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0d47a1', color: 'white' }}>
          <BiotechIcon sx={{ mr: 1 }} />
          Solicitar Exame Laboratorial
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Pet</InputLabel>
                <Select value={formExame.id_pet} label="Pet"
                  onChange={e => setFormExame(p => ({ ...p, id_pet: e.target.value }))}>
                  {pets.map(p => <MenuItem key={p.id_pet} value={p.id_pet}>{p.nome_pet} ({p.especie})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Exame</InputLabel>
                <Select value={formExame.tipo_exame} label="Tipo de Exame"
                  onChange={e => setFormExame(p => ({ ...p, tipo_exame: e.target.value }))}>
                  {['Hemograma','Bioquímico','Urinálise','Parasitológico','Raio-X','Ultrassom','Ecocardiograma','Citologia','Histopatológico','PCR','Sorologia','Outro'].map(t =>
                    <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Veterinário</InputLabel>
                <Select value={formExame.id_veterinario} label="Veterinário"
                  onChange={e => setFormExame(p => ({ ...p, id_veterinario: e.target.value }))}>
                  <MenuItem value="">— Sem veterinário —</MenuItem>
                  {veterinarios.map(v => <MenuItem key={v.id_veterinario} value={v.id_veterinario}>Dr(a). {v.nome}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Data Solicitação *" type="date"
                InputLabelProps={{ shrink: true }}
                value={formExame.data_solicitacao}
                onChange={e => setFormExame(p => ({ ...p, data_solicitacao: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth size="small" label="Laboratório"
                value={formExame.laboratorio}
                onChange={e => setFormExame(p => ({ ...p, laboratorio: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Valor (R$)" type="number"
                value={formExame.valor}
                onChange={e => setFormExame(p => ({ ...p, valor: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Descrição / Observações"
                value={formExame.descricao}
                onChange={e => setFormExame(p => ({ ...p, descricao: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgExame(false)}>Cancelar</Button>
          <Button variant="contained" color="info" onClick={salvarExame}>Solicitar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Registrar Resultado */}
      <Dialog open={dlgResultado} onClose={() => setDlgResultado(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1b5e20', color: 'white' }}>
          <CheckIcon sx={{ mr: 1 }} />
          Registrar Resultado do Exame
        </DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth multiline rows={8} label="Laudo / Resultado do Exame"
            value={formResultado.resultado}
            onChange={e => setFormResultado({ resultado: e.target.value })}
            sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgResultado(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={registrarResultado}>Salvar Resultado</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Internação */}
      <Dialog open={dlgInternacao} onClose={() => setDlgInternacao(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#b71c1c', color: 'white' }}>
          <HospitalIcon sx={{ mr: 1 }} />
          {editandoId ? 'Editar Internação' : 'Internar Pet'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Pet</InputLabel>
                <Select value={formInternacao.id_pet} label="Pet"
                  onChange={e => handlePetSelect(e.target.value, setFormInternacao)}>
                  {pets.map(p => <MenuItem key={p.id_pet} value={p.id_pet}>{p.nome_pet} ({p.especie})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Veterinário Responsável</InputLabel>
                <Select value={formInternacao.id_veterinario} label="Veterinário Responsável"
                  onChange={e => setFormInternacao(p => ({ ...p, id_veterinario: e.target.value }))}>
                  <MenuItem value="">— Sem veterinário —</MenuItem>
                  {veterinarios.map(v => <MenuItem key={v.id_veterinario} value={v.id_veterinario}>Dr(a). {v.nome}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Motivo</InputLabel>
                <Select value={formInternacao.motivo} label="Motivo"
                  onChange={e => setFormInternacao(p => ({ ...p, motivo: e.target.value }))}>
                  {['Pós-operatório','Tratamento Clínico','Observação','Cirurgia Eletiva','Emergência','Outro'].map(m =>
                    <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Data de Entrada *" type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={formInternacao.data_entrada}
                onChange={e => setFormInternacao(p => ({ ...p, data_entrada: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Número da Baia"
                value={formInternacao.numero_baia}
                onChange={e => setFormInternacao(p => ({ ...p, numero_baia: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Dieta / Alimentação"
                value={formInternacao.dieta}
                onChange={e => setFormInternacao(p => ({ ...p, dieta: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Valor Diária (R$)" type="number"
                value={formInternacao.valor_diaria}
                onChange={e => setFormInternacao(p => ({ ...p, valor_diaria: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={3}
                label="Medicamentos (nome, dose, frequência, via)"
                value={formInternacao.medicamentos}
                onChange={e => setFormInternacao(p => ({ ...p, medicamentos: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={3} label="Evolução Clínica / Observações"
                value={formInternacao.observacoes}
                onChange={e => setFormInternacao(p => ({ ...p, observacoes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgInternacao(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={salvarInternacao}>
            {editandoId ? 'Atualizar' : 'Internar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Dar Alta */}
      <Dialog open={dlgAlta} onClose={() => setDlgAlta(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white' }}>
          <CheckIcon sx={{ mr: 1 }} />
          Conceder Alta ao Pet
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Valor Total da Internação (R$)" type="number"
                value={formAlta.valor_total}
                onChange={e => setFormAlta(p => ({ ...p, valor_total: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={3}
                label="Observações de alta / Instruções ao tutor"
                value={formAlta.observacoes_alta}
                onChange={e => setFormAlta(p => ({ ...p, observacoes_alta: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgAlta(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={darAlta}>Confirmar Alta</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Veterinário */}
      <Dialog open={dlgVeterinario} onClose={() => setDlgVeterinario(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#283593', color: 'white' }}>
          <PersonIcon sx={{ mr: 1 }} />
          {editandoId ? 'Editar Veterinário' : 'Cadastrar Veterinário'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth size="small" label="Nome Completo *" required
                value={formVet.nome}
                onChange={e => setFormVet(p => ({ ...p, nome: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="CRMV *" required placeholder="UF-XXXXX"
                value={formVet.crmv}
                onChange={e => setFormVet(p => ({ ...p, crmv: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Especialidade"
                placeholder="Ex: Clínica Geral, Dermatologia, Oncologia"
                value={formVet.especialidade}
                onChange={e => setFormVet(p => ({ ...p, especialidade: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Telefone"
                value={formVet.telefone}
                onChange={e => setFormVet(p => ({ ...p, telefone: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="E-mail" type="email"
                value={formVet.email}
                onChange={e => setFormVet(p => ({ ...p, email: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgVeterinario(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvarVeterinario}>
            {editandoId ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Prontuário Completo */}
      <Dialog open={dlgProntuario} onClose={() => setDlgProntuario(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PetsIcon />
          Prontuário: {petProntuario?.nome_pet} ({petProntuario?.especie})
          <Typography variant="caption" sx={{ opacity: 0.8, ml: 1 }}>
            Tutor: {prontuarioData?.pet?.nome_cliente}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {prontuarioData && (
            <Box>
              {/* Pet info */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Espécie</Typography><Typography fontWeight="bold">{prontuarioData.pet.especie}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Raça</Typography><Typography fontWeight="bold">{prontuarioData.pet.raca || '—'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Sexo</Typography><Typography fontWeight="bold">{prontuarioData.pet.sexo === 'M' ? 'Macho' : 'Fêmea'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Peso</Typography><Typography fontWeight="bold">{prontuarioData.pet.peso ? `${prontuarioData.pet.peso} kg` : '—'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Nascimento</Typography><Typography fontWeight="bold">{fmtDate(prontuarioData.pet.data_nascimento)}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Microchip</Typography><Typography fontWeight="bold">{prontuarioData.pet.microchip || '—'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Cor</Typography><Typography fontWeight="bold">{prontuarioData.pet.cor || '—'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption">Tel. Tutor</Typography><Typography fontWeight="bold">{prontuarioData.pet.telefone_cliente || '—'}</Typography></Grid>
                </Grid>
              </Paper>

              {/* Consultas */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#e8eaf6' }}>
                  <MedicalIcon sx={{ mr: 1 }} />
                  <Typography fontWeight="bold">Histórico de Consultas ({prontuarioData.consultas.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {prontuarioData.consultas.length === 0
                    ? <Typography color="text.secondary">Sem consultas registradas.</Typography>
                    : prontuarioData.consultas.map(c => (
                      <Box key={c.id_consulta} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Typography fontWeight="bold">{fmtDateTime(c.data_consulta)} — {c.tipo_consulta_display}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip label={c.status} color={STATUS_CONSULTA_COLORS[c.status] || 'default'} size="small" />
                            {c.nome_veterinario && <Chip label={c.nome_veterinario} variant="outlined" size="small" />}
                          </Box>
                        </Box>
                        {c.queixa_principal && <Typography variant="body2"><b>Queixa:</b> {c.queixa_principal}</Typography>}
                        {c.diagnostico && <Typography variant="body2"><b>Diagnóstico:</b> {c.diagnostico}</Typography>}
                        {c.tratamento && <Typography variant="body2"><b>Tratamento:</b> {c.tratamento}</Typography>}
                        {c.receituario && <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}><b>Receituário:</b><br />{c.receituario}</Typography>}
                        {(c.peso_consulta || c.temperatura) && (
                          <Typography variant="caption" color="text.secondary">
                            Peso: {c.peso_consulta || '—'} kg · Temp: {c.temperatura || '—'} °C · FC: {c.frequencia_cardiaca || '—'} bpm
                          </Typography>
                        )}
                      </Box>
                    ))
                  }
                </AccordionDetails>
              </Accordion>

              {/* Vacinas */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#e8f5e9' }}>
                  <VaccinesIcon sx={{ mr: 1 }} />
                  <Typography fontWeight="bold">Vacinas ({prontuarioData.vacinas.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {prontuarioData.vacinas.length === 0
                    ? <Typography color="text.secondary">Sem vacinas registradas.</Typography>
                    : <TableContainer><Table size="small">
                      <TableHead><TableRow>
                        <TableCell>Vacina</TableCell><TableCell>Fabricante</TableCell>
                        <TableCell>Lote</TableCell><TableCell>Data Aplicação</TableCell>
                        <TableCell>Próxima Dose</TableCell><TableCell>Situação</TableCell>
                      </TableRow></TableHead>
                      <TableBody>
                        {prontuarioData.vacinas.map(v => (
                          <TableRow key={v.id_vacina} sx={{ bgcolor: v.vencida ? '#ffebee' : undefined }}>
                            <TableCell>{v.nome_vacina}</TableCell>
                            <TableCell>{v.fabricante || '—'}</TableCell>
                            <TableCell>{v.lote || '—'}</TableCell>
                            <TableCell>{fmtDate(v.data_aplicacao)}</TableCell>
                            <TableCell>{fmtDate(v.proxima_dose)}</TableCell>
                            <TableCell><Chip label={v.vencida ? 'Vencida' : 'OK'}
                              color={v.vencida ? 'error' : 'success'} size="small" /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table></TableContainer>
                  }
                </AccordionDetails>
              </Accordion>

              {/* Exames */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#e3f2fd' }}>
                  <BiotechIcon sx={{ mr: 1 }} />
                  <Typography fontWeight="bold">Exames ({prontuarioData.exames.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {prontuarioData.exames.length === 0
                    ? <Typography color="text.secondary">Sem exames registrados.</Typography>
                    : prontuarioData.exames.map(e => (
                      <Box key={e.id_exame} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1.5, mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography fontWeight="bold">{e.tipo_exame_display} — {fmtDate(e.data_solicitacao)}</Typography>
                          <Chip label={e.status} color={STATUS_EXAME_COLORS[e.status] || 'default'} size="small" />
                        </Box>
                        {e.laboratorio && <Typography variant="body2" color="text.secondary">Laboratório: {e.laboratorio}</Typography>}
                        {e.resultado && <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}><b>Resultado:</b><br />{e.resultado}</Typography>}
                      </Box>
                    ))
                  }
                </AccordionDetails>
              </Accordion>

              {/* Internações */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#fce4ec' }}>
                  <HospitalIcon sx={{ mr: 1 }} />
                  <Typography fontWeight="bold">Internações ({prontuarioData.internacoes.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {prontuarioData.internacoes.length === 0
                    ? <Typography color="text.secondary">Sem internações registradas.</Typography>
                    : prontuarioData.internacoes.map(i => (
                      <Box key={i.id_internacao} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1.5, mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography fontWeight="bold">{i.motivo_display}</Typography>
                          <Chip label={i.alta_concedida ? 'Alta' : 'Internado'}
                            color={i.alta_concedida ? 'success' : 'error'} size="small" />
                        </Box>
                        <Typography variant="body2">
                          Entrada: {fmtDateTime(i.data_entrada)}
                          {i.data_alta && ` · Alta: ${fmtDateTime(i.data_alta)}`}
                          {` · ${i.dias_internado} dia(s)`}
                          {i.numero_baia && ` · Baia ${i.numero_baia}`}
                        </Typography>
                        {i.medicamentos && <Typography variant="body2" sx={{ mt: 0.5 }}><b>Medicamentos:</b> {i.medicamentos}</Typography>}
                        {i.observacoes && <Typography variant="body2"><b>Evolução:</b> {i.observacoes}</Typography>}
                      </Box>
                    ))
                  }
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgProntuario(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClinicaVeterinariaPage;
