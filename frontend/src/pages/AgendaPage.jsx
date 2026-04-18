import React, { useState, useCallback, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Button, TextField, MenuItem,
  Stack, CircularProgress, Alert, Paper, Chip, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Avatar, Autocomplete,
} from '@mui/material'
import {
  Add as AddIcon, Refresh as RefreshIcon,
  Pets as PetIcon, Agriculture as AgroIcon,
  ChevronLeft, ChevronRight,
  CheckCircle as ConcluirIcon, Cancel as CancelarIcon,
  Edit as EditIcon, CalendarMonth as CalIcon,
  AccessTime as HoraIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

const TIPOS = {
  'consulta': { label: 'Consulta', color: '#1565c0' },
  'banho_tosa': { label: 'Banho/Tosa', color: '#6a1b9a' },
  'vacina': { label: 'Vacinação', color: '#2e7d32' },
  'cirurgia': { label: 'Cirurgia', color: '#c62828' },
  'visita_agro': { label: 'Visita Agro', color: '#e65100' },
  'pulverizacao': { label: 'Pulverização', color: '#558b2f' },
  'outros': { label: 'Outros', color: '#607d8b' },
}

const CORES_TIPO = ['#1565c0','#6a1b9a','#2e7d32','#c62828','#e65100','#558b2f','#00838f','#4527a0','#bf360c','#607d8b']

const STATUS_COLORS = {
  'Agendado': 'primary',
  'Concluído': 'success',
  'Cancelado': 'error',
  'Em Atendimento': 'warning',
}

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES_NOME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const hoje = new Date()

// Gera dias do mês com posição no calendário
function gerarCalendario(ano, mes) {
  const primeiro = new Date(ano, mes, 1).getDay()
  const total = new Date(ano, mes + 1, 0).getDate()
  const dias = []
  for (let i = 0; i < primeiro; i++) dias.push(null)
  for (let d = 1; d <= total; d++) dias.push(d)
  return dias
}

// Mock data para demonstração
const MOCK_AGENDAMENTOS = [
  { id:1, data:'2026-03-03', hora:'09:00', cliente:'Maria Silva', animal:'Rex (Labrador)', tipo:'consulta', profissional:'Dr. João', status:'Agendado' },
  { id:2, data:'2026-03-03', hora:'10:30', cliente:'Pedro Santos', animal:'Mimi (Gato)', tipo:'banho_tosa', profissional:'Ana Groomer', status:'Em Atendimento' },
  { id:3, data:'2026-03-03', hora:'14:00', cliente:'Fazenda São João', animal:'Gado (15 cabeças)', tipo:'vacina', profissional:'Dr. Carlos Agro', status:'Agendado' },
  { id:4, data:'2026-03-04', hora:'08:00', cliente:'Sítio do Milho', animal:'Plantação Soja', tipo:'pulverizacao', profissional:'Técnico Agro', status:'Agendado' },
  { id:5, data:'2026-03-05', hora:'11:00', cliente:'João Ferreira', animal:'Bolt (Pitbull)', tipo:'cirurgia', profissional:'Dr. João', status:'Agendado' },
]

export default function AgendaPage() {
  const { axiosInstance } = useAuth()
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear())
  const [mesAtual, setMesAtual] = useState(hoje.getMonth())
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate())
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(false)
  const [novoOpen, setNovoOpen] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [tiposServico, setTiposServico] = useState([])

  // Estados do formulário de novo agendamento
  const [formData, setFormData] = useState({ data: '', hora: '09:00', tipo: '', observacoes: '' })
  const [clienteSel, setClienteSel] = useState(null)
  const [animalSel, setAnimalSel] = useState(null)
  const [profissionalSel, setProfissionalSel] = useState(null)
  const [clientes, setClientes] = useState([])
  const [animais, setAnimais] = useState([])
  const [profissionais, setProfissionais] = useState([])
  const [buscandoClientes, setBuscandoClientes] = useState(false)
  const [buscandoAnimais, setBuscandoAnimais] = useState(false)
  const [buscandoProfissionais, setBuscandoProfissionais] = useState(false)

  // Buscar clientes por texto
  const buscarClientes = useCallback(async (texto) => {
    if (!texto || texto.length < 2) return
    setBuscandoClientes(true)
    try {
      const r = await axiosInstance.get('/clientes/', { params: { search: texto } })
      const data = r.data
      setClientes(Array.isArray(data) ? data : data?.results || [])
    } catch { setClientes([]) }
    finally { setBuscandoClientes(false) }
  }, [axiosInstance])

  // Buscar animais/pets filtrados pelo cliente selecionado
  const buscarAnimais = useCallback(async (texto) => {
    setBuscandoAnimais(true)
    try {
      const params = {}
      if (clienteSel) params.id_cliente = clienteSel.id_cliente
      if (texto) params.search = texto
      const r = await axiosInstance.get('/pets/', { params })
      const data = r.data
      setAnimais(Array.isArray(data) ? data : data?.results || [])
    } catch { setAnimais([]) }
    finally { setBuscandoAnimais(false) }
  }, [axiosInstance, clienteSel])

  // Buscar profissionais/funcionários
  const buscarProfissionais = useCallback(async (texto) => {
    if (!texto || texto.length < 2) return
    setBuscandoProfissionais(true)
    try {
      const r = await axiosInstance.get('/rh/funcionarios/', { params: { q: texto, ativo: 'true' } })
      const data = r.data
      setProfissionais(Array.isArray(data) ? data : data?.results || [])
    } catch { setProfissionais([]) }
    finally { setBuscandoProfissionais(false) }
  }, [axiosInstance])

  // Carregar tipos de serviço da API
  useEffect(() => {
    axiosInstance.get('/tipo-servicos/').then(r => {
      const data = r.data
      setTiposServico(Array.isArray(data) ? data : data?.results || [])
    }).catch(() => {})
  }, [axiosInstance])

  // Quando selecionar cliente, carregar seus pets
  useEffect(() => {
    if (clienteSel) {
      setAnimalSel(null)
      buscarAnimais('')
    } else {
      setAnimais([])
      setAnimalSel(null)
    }
  }, [clienteSel]) // eslint-disable-line react-hooks/exhaustive-deps

  // Estado para edição
  const [editandoId, setEditandoId] = useState(null)

  const abrirNovoAgendamento = () => {
    setEditandoId(null)
    setFormData({ data: dataSelecionada, hora: '09:00', tipo: '', observacoes: '' })
    setClienteSel(null)
    setAnimalSel(null)
    setProfissionalSel(null)
    setClientes([])
    setAnimais([])
    setProfissionais([])
    setNovoOpen(true)
  }

  const editarAgendamento = (ag) => {
    setEditandoId(ag.id)
    setFormData({ data: ag.data, hora: ag.hora, tipo: ag.id_tipo_servico || '', observacoes: ag.observacoes || '' })
    setClienteSel(null)
    setAnimalSel(null)
    setProfissionalSel(null)
    setNovoOpen(true)
  }

  const concluirAgendamento = async (id) => {
    try {
      await axiosInstance.post(`/agendamentos/${id}/concluir/`)
      buscar()
    } catch { /* erro tratado pelo interceptor */ }
  }

  const cancelarAgendamento = async (id) => {
    if (!window.confirm('Deseja realmente cancelar este agendamento?')) return
    try {
      await axiosInstance.post(`/agendamentos/${id}/cancelar/`)
      buscar()
    } catch { /* erro tratado pelo interceptor */ }
  }

  const salvarAgendamento = async () => {
    if (!clienteSel || !animalSel || !formData.data || !formData.hora) return
    try {
      const obs = [formData.observacoes || '']
      if (profissionalSel) obs.push(`Profissional: ${profissionalSel.nome_completo}`)
      const payload = {
        id_cliente: clienteSel?.id_cliente,
        id_pet: animalSel?.id_pet,
        data_agendamento: `${formData.data}T${formData.hora}:00`,
        id_tipo_servico: formData.tipo || null,
        observacoes: obs.filter(Boolean).join(' | '),
      }
      if (editandoId) {
        // Edição — enviar apenas campos preenchidos
        const editPayload = { data_agendamento: payload.data_agendamento, observacoes: payload.observacoes }
        if (payload.id_tipo_servico) editPayload.id_tipo_servico = payload.id_tipo_servico
        if (payload.id_cliente) editPayload.id_cliente = payload.id_cliente
        if (payload.id_pet) editPayload.id_pet = payload.id_pet
        await axiosInstance.patch(`/agendamentos/${editandoId}/`, editPayload)
      } else {
        await axiosInstance.post('/agendamentos/', payload)
      }
      setNovoOpen(false)
      setEditandoId(null)
      buscar()
    } catch { /* erro tratado pelo interceptor */ }
  }

  // Resolve cor de um tipo de serviço pelo id
  const corTipo = useCallback((idTipo) => {
    if (!idTipo) return '#607d8b'
    const idx = tiposServico.findIndex(t => t.id_tipo_servico === idTipo)
    return idx >= 0 ? CORES_TIPO[idx % CORES_TIPO.length] : '#607d8b'
  }, [tiposServico])

  const nomeTipo = useCallback((idTipo) => {
    if (!idTipo) return ''
    const t = tiposServico.find(t => t.id_tipo_servico === idTipo)
    return t ? t.nome_servico : ''
  }, [tiposServico])

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await axiosInstance.get('/agendamentos/', { params: { ordering: 'data_agendamento' } })
      const data = r.data
      const lista = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []
      const mapped = lista.map(a => {
        const dt = a.data_agendamento ? new Date(a.data_agendamento) : null
        return {
          id: a.id_agendamento,
          data: dt ? `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}` : '',
          hora: dt ? `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}` : '',
          cliente: a.cliente_nome || '',
          animal: a.pet_nome || '',
          id_tipo_servico: a.id_tipo_servico,
          tipo: a.servico_nome || '',
          profissional: '',
          status: a.status || 'Agendado',
          observacoes: a.observacoes || '',
        }
      })
      setAgendamentos(mapped)
    } catch {
      setAgendamentos([])
    } finally {
      setLoading(false)
    }
  }, [axiosInstance])

  useEffect(() => { buscar() }, [buscar])

  const diasCalendario = gerarCalendario(anoAtual, mesAtual)

  const dataSelecionada = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(diaSelecionado).padStart(2, '0')}`
  const agendamentosDia = agendamentos.filter(a => a.data === dataSelecionada)
  const agendamentosFilter = filtroTipo
    ? agendamentosDia.filter(a => String(a.id_tipo_servico) === String(filtroTipo))
    : agendamentosDia

  // marca dias com agendamentos no calendário
  const diasComAgendamento = new Set(
    agendamentos.map(a => {
      const d = new Date(a.data + 'T12:00:00')
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual ? d.getDate() : null
    }).filter(Boolean)
  )

  const irMesAnterior = () => {
    if (mesAtual === 0) { setMesAtual(11); setAnoAtual(a => a - 1) }
    else setMesAtual(m => m - 1)
    setDiaSelecionado(1)
  }

  const irProximoMes = () => {
    if (mesAtual === 11) { setMesAtual(0); setAnoAtual(a => a + 1) }
    else setMesAtual(m => m + 1)
    setDiaSelecionado(1)
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CalIcon sx={{ color: '#6a1b9a', fontSize: 32 }} />
            <Typography variant="h5" fontWeight={700} color="primary">Agenda Pet / Agro</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Agendamentos de serviços veterinários e visitas técnicas rurais
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar"><IconButton onClick={buscar} disabled={loading}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovoAgendamento}>
            Novo Agendamento
          </Button>
        </Stack>
      </Stack>

      {loading && <Alert severity="info" sx={{ mb: 2 }}>Carregando agenda...</Alert>}

      <Grid container spacing={2}>
        {/* Calendário */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <IconButton size="small" onClick={irMesAnterior}><ChevronLeft /></IconButton>
                <Typography fontWeight={700}>{MESES_NOME[mesAtual]} {anoAtual}</Typography>
                <IconButton size="small" onClick={irProximoMes}><ChevronRight /></IconButton>
              </Stack>

              {/* Dias da semana */}
              <Grid container columns={7} sx={{ mb: 0.5 }}>
                {SEMANA.map(s => (
                  <Grid item xs={1} key={s}>
                    <Typography variant="caption" color="text.secondary" align="center" display="block" fontWeight={600}>
                      {s}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {/* Dias do mês */}
              <Grid container columns={7}>
                {diasCalendario.map((dia, i) => {
                  const isHoje = dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear()
                  const isSelected = dia === diaSelecionado
                  const temAgend = dia && diasComAgendamento.has(dia)
                  return (
                    <Grid item xs={1} key={i}>
                      <Box
                        onClick={() => dia && setDiaSelecionado(dia)}
                        sx={{
                          width: 32, height: 32, mx: 'auto', mb: 0.3,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '50%', cursor: dia ? 'pointer' : 'default',
                          bgcolor: isSelected ? 'primary.main' : isHoje ? '#e3f2fd' : 'transparent',
                          color: isSelected ? '#fff' : 'inherit',
                          fontWeight: isHoje || isSelected ? 700 : 400,
                          fontSize: '0.8rem',
                          position: 'relative',
                          '&:hover': dia ? { bgcolor: isSelected ? 'primary.dark' : '#f5f5f5' } : {},
                        }}
                      >
                        {dia}
                        {temAgend && !isSelected && (
                          <Box sx={{ position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: '50%', bgcolor: '#6a1b9a' }} />
                        )}
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>LEGENDA</Typography>
                {tiposServico.map((t, i) => (
                  <Stack key={t.id_tipo_servico} direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: CORES_TIPO[i % CORES_TIPO.length] }} />
                    <Typography variant="caption">{t.nome_servico}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Lista do dia */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CalIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={700}>
                    {String(diaSelecionado).padStart(2,'0')}/{String(mesAtual+1).padStart(2,'0')}/{anoAtual}
                  </Typography>
                  <Chip size="small" label={`${agendamentosFilter.length} agendamento${agendamentosFilter.length !== 1 ? 's' : ''}`} />
                </Stack>
                <TextField select size="small" label="Filtrar tipo" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} sx={{ minWidth: 160 }}>
                  <MenuItem value="">Todos</MenuItem>
                  {tiposServico.map(t => <MenuItem key={t.id_tipo_servico} value={t.id_tipo_servico}>{t.nome_servico}</MenuItem>)}
                </TextField>
              </Stack>

              {agendamentosFilter.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <CalIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
                  <Typography color="text.secondary">Nenhum agendamento para este dia</Typography>
                  <Button variant="outlined" sx={{ mt: 2 }} startIcon={<AddIcon />} onClick={abrirNovoAgendamento}>
                    Agendar para este dia
                  </Button>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {agendamentosFilter.map(a => (
                    <Paper key={a.id} elevation={1} sx={{ p: 2, borderLeft: `4px solid ${corTipo(a.id_tipo_servico)}` }}>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ bgcolor: corTipo(a.id_tipo_servico), width: 36, height: 36 }}>
                            <PetIcon fontSize="small" />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
                              <HoraIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                              <Typography variant="body2" fontWeight={700}>{a.hora}</Typography>
                              <Chip size="small" label={a.tipo || 'Sem tipo'} sx={{ bgcolor: corTipo(a.id_tipo_servico), color: '#fff' }} />
                              <Chip size="small" label={a.status} color={STATUS_COLORS[a.status] || 'default'} variant="outlined" />
                            </Stack>
                            <Typography variant="body2" fontWeight={600} mt={0.5}>{a.cliente}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {a.animal} · Profissional: {a.profissional}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="outlined" startIcon={<EditIcon />}
                            onClick={() => editarAgendamento(a)}
                            sx={{ minWidth: 90, textTransform: 'none', minHeight: 36 }}>
                            Editar
                          </Button>
                          {a.status === 'Agendado' && (
                            <Button size="small" variant="contained" color="success" startIcon={<ConcluirIcon />}
                              onClick={() => concluirAgendamento(a.id)}
                              sx={{ minWidth: 100, textTransform: 'none', minHeight: 36 }}>
                              Concluir
                            </Button>
                          )}
                          {a.status === 'Agendado' && (
                            <Button size="small" variant="contained" color="error" startIcon={<CancelarIcon />}
                              onClick={() => cancelarAgendamento(a.id)}
                              sx={{ minWidth: 100, textTransform: 'none', minHeight: 36 }}>
                              Cancelar
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diálogo novo agendamento */}
      <Dialog open={novoOpen} onClose={() => setNovoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editandoId ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField size="small" type="date" label="Data" value={formData.data}
                onChange={e => setFormData(f => ({ ...f, data: e.target.value }))}
                InputLabelProps={{ shrink: true }} fullWidth />
              <TextField size="small" type="time" label="Hora" value={formData.hora}
                onChange={e => setFormData(f => ({ ...f, hora: e.target.value }))}
                InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
            <TextField select size="small" label="Tipo de Serviço" value={formData.tipo || ''}
              onChange={e => setFormData(f => ({ ...f, tipo: e.target.value }))} fullWidth>
              <MenuItem value="">Selecione...</MenuItem>
              {tiposServico.map(t => <MenuItem key={t.id_tipo_servico} value={t.id_tipo_servico}>{t.nome_servico}</MenuItem>)}
            </TextField>

            {/* Cliente — busca na tabela clientes */}
            <Autocomplete
              id="autocomplete-cliente"
              size="small"
              options={clientes}
              getOptionLabel={(o) => o.nome_razao_social || ''}
              value={clienteSel}
              onChange={(_, v) => setClienteSel(v)}
              onInputChange={(_, v, reason) => { if (reason === 'input') buscarClientes(v) }}
              loading={buscandoClientes}
              noOptionsText="Digite 2+ letras para buscar..."
              isOptionEqualToValue={(o, v) => o.id_cliente === v.id_cliente}
              renderInput={(params) => (
                <TextField {...params} label="Cliente / Proprietário"
                  InputProps={{ ...params.InputProps, endAdornment: (<>{buscandoClientes ? <CircularProgress size={18} /> : null}{params.InputProps.endAdornment}</>) }}
                />
              )}
            />

            {/* Animal — busca na tabela pets, filtrado pelo cliente */}
            <Autocomplete
              id="autocomplete-animal"
              size="small"
              options={animais}
              getOptionLabel={(o) => o.nome_pet ? `${o.nome_pet}${o.raca ? ` (${o.raca})` : ''}` : ''}
              value={animalSel}
              onChange={(_, v) => setAnimalSel(v)}
              onInputChange={(_, v, reason) => { if (reason === 'input') buscarAnimais(v) }}
              loading={buscandoAnimais}
              disabled={!clienteSel}
              noOptionsText={clienteSel ? 'Nenhum animal encontrado' : 'Selecione um cliente primeiro'}
              isOptionEqualToValue={(o, v) => o.id_pet === v.id_pet}
              renderInput={(params) => (
                <TextField {...params} label="Animal / Pet"
                  InputProps={{ ...params.InputProps, endAdornment: (<>{buscandoAnimais ? <CircularProgress size={18} /> : null}{params.InputProps.endAdornment}</>) }}
                />
              )}
            />

            {/* Profissional — busca na tabela funcionários */}
            <Autocomplete
              id="autocomplete-profissional"
              size="small"
              options={profissionais}
              getOptionLabel={(o) => o.nome_completo || ''}
              value={profissionalSel}
              onChange={(_, v) => setProfissionalSel(v)}
              onInputChange={(_, v, reason) => { if (reason === 'input') buscarProfissionais(v) }}
              loading={buscandoProfissionais}
              noOptionsText="Digite 2+ letras para buscar..."
              isOptionEqualToValue={(o, v) => o.id_funcionario === v.id_funcionario}
              renderInput={(params) => (
                <TextField {...params} label="Profissional Responsável"
                  InputProps={{ ...params.InputProps, endAdornment: (<>{buscandoProfissionais ? <CircularProgress size={18} /> : null}{params.InputProps.endAdornment}</>) }}
                />
              )}
            />

            <TextField size="small" label="Observações" multiline rows={2} fullWidth
              value={formData.observacoes}
              onChange={e => setFormData(f => ({ ...f, observacoes: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNovoOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvarAgendamento}
            disabled={!editandoId && (!clienteSel || !animalSel || !formData.data || !formData.hora)}>
            {editandoId ? 'Salvar Alterações' : 'Salvar Agendamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
