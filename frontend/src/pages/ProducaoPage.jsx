import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Stack, CircularProgress, Alert, Paper, Chip, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, LinearProgress, Tabs, Tab, Autocomplete, Divider,
  List, ListItem, ListItemText, ListItemSecondaryAction,
} from '@mui/material'
import {
  Refresh as RefreshIcon, Add as AddIcon,
  Factory as ProducaoIcon, CheckCircle as FinalizarIcon,
  Cancel as CancelIcon, Edit as EditIcon, Delete as DeleteIcon,
  PlayArrow as IniciarIcon, Visibility as VerIcon,
  Build as BomIcon, Assessment as CustoIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d.includes('T') ? d : d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('pt-BR') : '—'
const fmt = (v, dec = 2) =>
  Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
const fmtBRL = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// ─── constantes ──────────────────────────────────────────────────────────────
const STATUS_META = {
  ABERTA:       { label: 'Aberta',       color: '#FF9800' },
  EM_PRODUCAO:  { label: 'Em Produção',  color: '#2196F3' },
  FINALIZADA:   { label: 'Finalizada',   color: '#4CAF50' },
  CANCELADA:    { label: 'Cancelada',    color: '#F44336' },
}

function StatusChip({ status }) {
  const meta = STATUS_META[status] || { label: status, color: '#9E9E9E' }
  return (
    <Chip
      label={meta.label}
      size="small"
      sx={{ bgcolor: meta.color, color: '#fff', fontWeight: 'bold' }}
    />
  )
}

// ─── Aba Ordens de Produção ───────────────────────────────────────────────────
function AbaOrdens() {
  const { axiosInstance } = useAuth()
  const [ordens, setOrdens] = useState([])
  const [depositos, setDepositos] = useState([])
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca] = useState('')

  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  // Dialog nova/editar OP
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ produto: '', deposito: '', quantidade_planejada: '', observacoes: '' })
  const [salvando, setSalvando] = useState(false)

  // Dialog verificação de insumos
  const [verificacaoOpen, setVerificacaoOpen] = useState(false)
  const [verificacao, setVerificacao] = useState(null)
  const [opVerificando, setOpVerificando] = useState(null)
  const [loadingVerif, setLoadingVerif] = useState(false)

  // Dialog cancelamento
  const [cancelarOpen, setCancelarOpen] = useState(false)
  const [opCancelando, setOpCancelando] = useState(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')

  const buscar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const params = { data_inicio: dataInicio, data_fim: dataFim }
      if (filtroStatus) params.status = filtroStatus
      const r = await axiosInstance.get('/pcp/ordens/', { params })
      setOrdens(Array.isArray(r.data) ? r.data : (r.data.results || []))
    } catch {
      setErro('Erro ao carregar ordens de produção.')
    } finally {
      setLoading(false)
    }
  }, [axiosInstance, dataInicio, dataFim, filtroStatus])

  useEffect(() => { buscar() }, [buscar])

  useEffect(() => {
    axiosInstance.get('/depositos/').then(r => setDepositos(Array.isArray(r.data) ? r.data : (r.data.results || [])))
    axiosInstance.get('/produtos/', { params: { page_size: 500 } }).then(r =>
      setProdutos(Array.isArray(r.data) ? r.data : (r.data.results || []))
    )
  }, [axiosInstance])

  const abrirNovo = () => {
    setEditando(null)
    setForm({ produto: '', deposito: '', quantidade_planejada: '', observacoes: '' })
    setDialogOpen(true)
  }

  const abrirEditar = (op) => {
    setEditando(op)
    setForm({
      produto: op.produto,
      deposito: op.deposito,
      quantidade_planejada: op.quantidade_planejada,
      observacoes: op.observacoes || '',
    })
    setDialogOpen(true)
  }

  const salvar = async () => {
    if (!form.produto || !form.deposito || !form.quantidade_planejada) {
      alert('Preencha Produto, Depósito e Quantidade.')
      return
    }
    setSalvando(true)
    try {
      if (editando) {
        await axiosInstance.patch(`/pcp/ordens/${editando.id_op}/`, form)
      } else {
        await axiosInstance.post('/pcp/ordens/', form)
      }
      setDialogOpen(false)
      buscar()
    } catch (e) {
      alert(e?.response?.data?.erro || e?.response?.data?.detail || 'Erro ao salvar OP.')
    } finally {
      setSalvando(false)
    }
  }

  const iniciar = async (op) => {
    if (!window.confirm(`Iniciar produção da OP #${op.id_op}?`)) return
    try {
      await axiosInstance.post(`/pcp/ordens/${op.id_op}/iniciar/`)
      buscar()
    } catch (e) {
      alert(e?.response?.data?.erro || 'Erro ao iniciar OP.')
    }
  }

  const abrirVerificacao = async (op) => {
    setOpVerificando(op)
    setVerificacaoOpen(true)
    setVerificacao(null)
    setLoadingVerif(true)
    try {
      const r = await axiosInstance.get(`/pcp/ordens/${op.id_op}/verificar_insumos/`)
      setVerificacao(r.data)
    } catch (e) {
      setVerificacao({ erro: e?.response?.data?.erro || 'Erro ao verificar insumos.' })
    } finally {
      setLoadingVerif(false)
    }
  }

  const finalizar = async (op) => {
    if (!window.confirm(`Finalizar OP #${op.id_op}?\n\nIsso irá baixar os insumos do estoque e dar entrada no produto acabado.`)) return
    try {
      const r = await axiosInstance.post(`/pcp/ordens/${op.id_op}/finalizar/`)
      alert(`✅ ${r.data.mensagem}\nCusto Total: ${fmtBRL(r.data.custo_total)}\nCusto Unitário: ${fmtBRL(r.data.custo_unitario)}`)
      buscar()
    } catch (e) {
      alert(e?.response?.data?.erro || 'Erro ao finalizar OP.')
    }
  }

  const abrirCancelar = (op) => {
    setOpCancelando(op)
    setMotivoCancelamento('')
    setCancelarOpen(true)
  }

  const confirmarCancelamento = async () => {
    try {
      await axiosInstance.post(`/pcp/ordens/${opCancelando.id_op}/cancelar/`, { motivo: motivoCancelamento })
      setCancelarOpen(false)
      buscar()
    } catch (e) {
      alert(e?.response?.data?.erro || 'Erro ao cancelar OP.')
    }
  }

  const ordensFiltradas = ordens.filter(o =>
    !busca || (o.produto_nome || '').toLowerCase().includes(busca.toLowerCase())
  )

  const totalPorStatus = Object.keys(STATUS_META).reduce((acc, s) => {
    acc[s] = ordens.filter(o => o.status === s).length
    return acc
  }, {})

  return (
    <Box>
      {/* Cards de resumo */}
      <Grid container spacing={2} mb={2}>
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <Grid item xs={6} sm={3} key={key}>
            <Card sx={{ borderLeft: `4px solid ${meta.color}` }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">{meta.label}</Typography>
                <Typography variant="h5" fontWeight="bold" color={meta.color}>
                  {totalPorStatus[key] || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
          <TextField label="Data Início" type="date" size="small" value={dataInicio}
            onChange={e => setDataInicio(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Data Fim" type="date" size="small" value={dataFim}
            onChange={e => setDataFim(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Status" select size="small" value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(STATUS_META).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
          </TextField>
          <TextField label="Buscar produto" size="small" value={busca}
            onChange={e => setBusca(e.target.value)} sx={{ flex: 1, minWidth: 180 }} />
          <Tooltip title="Atualizar">
            <IconButton onClick={buscar} color="primary"><RefreshIcon /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}
            sx={{ bgcolor: '#FF5722', '&:hover': { bgcolor: '#E64A19' }, whiteSpace: 'nowrap' }}>
            Nova OP
          </Button>
        </Stack>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 1 }} />}
      {erro && <Alert severity="warning" sx={{ mb: 2 }}>{erro}</Alert>}

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#FF5722' }}>
              {['#OP', 'Produto', 'Qtd Planejada', 'Status', 'Custo Total', 'Abertura', 'Finalização'].map(h => (
                <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>{h}</TableCell>
              ))}
              <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ordensFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary" py={3}>Nenhuma OP encontrada.</Typography>
                </TableCell>
              </TableRow>
            ) : ordensFiltradas.map(op => (
              <TableRow key={op.id_op} hover>
                <TableCell><strong>#{op.id_op}</strong></TableCell>
                <TableCell>{op.produto_nome}</TableCell>
                <TableCell>{fmt(op.quantidade_planejada, 3)} {op.produto_unidade || ''}</TableCell>
                <TableCell><StatusChip status={op.status} /></TableCell>
                <TableCell>{op.custo_total > 0 ? fmtBRL(op.custo_total) : '—'}</TableCell>
                <TableCell>{fmtDate(op.data_abertura)}</TableCell>
                <TableCell>{op.data_finalizacao ? fmtDateTime(op.data_finalizacao) : '—'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {op.status === 'ABERTA' && (
                      <>
                        <Tooltip title="Editar OP">
                          <IconButton size="small" onClick={() => abrirEditar(op)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Verificar insumos">
                          <IconButton size="small" color="info" onClick={() => abrirVerificacao(op)}>
                            <VerIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Iniciar produção">
                          <IconButton size="small" color="primary" onClick={() => iniciar(op)}>
                            <IniciarIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar OP">
                          <IconButton size="small" color="error" onClick={() => abrirCancelar(op)}>
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {op.status === 'EM_PRODUCAO' && (
                      <>
                        <Tooltip title="Verificar insumos">
                          <IconButton size="small" color="info" onClick={() => abrirVerificacao(op)}>
                            <VerIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Finalizar produção">
                          <IconButton size="small" sx={{ color: '#4CAF50' }} onClick={() => finalizar(op)}>
                            <FinalizarIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar OP">
                          <IconButton size="small" color="error" onClick={() => abrirCancelar(op)}>
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {op.status === 'FINALIZADA' && (
                      <Tooltip title="Ver custo">
                        <IconButton size="small" color="success">
                          <CustoIcon fontSize="small" />
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

      {/* Dialog Nova/Editar OP */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editando ? `Editar OP #${editando.id_op}` : 'Nova Ordem de Produção'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Produto Acabado" select fullWidth size="small"
              value={form.produto} onChange={e => setForm({ ...form, produto: e.target.value })}>
              <MenuItem value=""><em>Selecione…</em></MenuItem>
              {produtos.map(p => (
                <MenuItem key={p.id_produto} value={p.id_produto}>
                  {p.codigo_produto} — {p.nome_produto}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Depósito" select fullWidth size="small"
              value={form.deposito} onChange={e => setForm({ ...form, deposito: e.target.value })}>
              <MenuItem value=""><em>Selecione…</em></MenuItem>
              {depositos.map(d => (
                <MenuItem key={d.id_deposito} value={d.id_deposito}>{d.nome_deposito}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Quantidade Planejada" type="number" fullWidth size="small"
              value={form.quantidade_planejada}
              onChange={e => setForm({ ...form, quantidade_planejada: e.target.value })}
              inputProps={{ min: 0.001, step: 0.001 }} />
            <TextField
              label="Observações" fullWidth multiline rows={2} size="small"
              value={form.observacoes}
              onChange={e => setForm({ ...form, observacoes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvar} disabled={salvando}
            sx={{ bgcolor: '#FF5722' }}>
            {salvando ? <CircularProgress size={20} /> : (editando ? 'Salvar' : 'Criar OP')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Verificação de Insumos */}
      <Dialog open={verificacaoOpen} onClose={() => setVerificacaoOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Verificação de Insumos — OP #{opVerificando?.id_op}
          <Typography variant="body2" color="text.secondary">
            {opVerificando?.produto_nome} · Qtd: {fmt(opVerificando?.quantidade_planejada, 3)}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {loadingVerif && <LinearProgress />}
          {verificacao?.erro && <Alert severity="error">{verificacao.erro}</Alert>}
          {verificacao && !verificacao.erro && (
            <>
              <Alert severity={verificacao.tudo_ok ? 'success' : 'warning'} sx={{ mb: 2 }}>
                {verificacao.tudo_ok
                  ? '✅ Estoque suficiente para produzir!'
                  : '⚠️ Estoque insuficiente em alguns insumos.'}
                {' · '}Custo estimado: <strong>{fmtBRL(verificacao.custo_estimado)}</strong>
                {' · '}Custo/un: <strong>{fmtBRL(verificacao.custo_unitario_estimado)}</strong>
              </Alert>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      {['Insumo', 'Un', 'Qtd/Un (BOM)', 'Total Necessário', 'Disponível', 'Custo Unit.', 'Custo Item', 'OK'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 'bold' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {verificacao.itens.map(item => (
                      <TableRow key={item.insumo_id}
                        sx={{ bgcolor: item.ok ? 'transparent' : '#fff3e0' }}>
                        <TableCell>{item.insumo_nome}</TableCell>
                        <TableCell>{item.unidade}</TableCell>
                        <TableCell sx={{ color: '#666' }}>
                          {fmt(item.qtd_por_unidade, 4)}
                          {Number(item.percentual_perda) > 0 && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              +{fmt(item.percentual_perda, 2)}% perda
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{fmt(item.qtd_necessaria, 3)}</TableCell>
                        <TableCell sx={{ color: item.ok ? 'inherit' : '#f44336', fontWeight: item.ok ? 'normal' : 'bold' }}>
                          {fmt(item.qtd_disponivel, 3)}
                        </TableCell>
                        <TableCell>{fmtBRL(item.custo_medio)}</TableCell>
                        <TableCell>{fmtBRL(item.custo_item)}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.ok ? 'OK' : 'Falta'}
                            size="small"
                            color={item.ok ? 'success' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {verificacao?.tudo_ok && opVerificando?.status === 'EM_PRODUCAO' && (
            <Button variant="contained" color="success"
              onClick={() => { setVerificacaoOpen(false); finalizar(opVerificando) }}
              startIcon={<FinalizarIcon />}>
              Finalizar Agora
            </Button>
          )}
          <Button onClick={() => setVerificacaoOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Cancelamento */}
      <Dialog open={cancelarOpen} onClose={() => setCancelarOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancelar OP #{opCancelando?.id_op}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta ação não pode ser desfeita. A OP será marcada como cancelada.
          </Alert>
          <TextField
            label="Motivo do cancelamento (opcional)" fullWidth multiline rows={2}
            value={motivoCancelamento} onChange={e => setMotivoCancelamento(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelarOpen(false)}>Voltar</Button>
          <Button variant="contained" color="error" onClick={confirmarCancelamento}>
            Confirmar Cancelamento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ─── Aba Ficha Técnica (BOM) ──────────────────────────────────────────────────
function AbaFichaTecnica() {
  const { axiosInstance } = useAuth()
  const [produtos, setProdutos] = useState([])
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [composicao, setComposicao] = useState([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    insumo: '', quantidade_necessaria: '', percentual_perda: '0', observacao: '', ativo: true,
  })

  useEffect(() => {
    axiosInstance.get('/produtos/', { params: { page_size: 500 } }).then(r =>
      setProdutos(Array.isArray(r.data) ? r.data : (r.data.results || []))
    )
  }, [axiosInstance])

  const buscarComposicao = useCallback(async () => {
    if (!produtoSelecionado) { setComposicao([]); return }
    setLoading(true)
    try {
      const r = await axiosInstance.get('/pcp/composicoes/', {
        params: { produto_acabado: produtoSelecionado.id_produto },
      })
      setComposicao(Array.isArray(r.data) ? r.data : (r.data.results || []))
    } catch {
      setComposicao([])
    } finally {
      setLoading(false)
    }
  }, [axiosInstance, produtoSelecionado])

  useEffect(() => { buscarComposicao() }, [buscarComposicao])

  const abrirNovo = () => {
    setEditando(null)
    setForm({ insumo: '', quantidade_necessaria: '', percentual_perda: '0', observacao: '', ativo: true })
    setDialogOpen(true)
  }

  const abrirEditar = (item) => {
    setEditando(item)
    setForm({
      insumo: item.insumo,
      quantidade_necessaria: item.quantidade_necessaria,
      percentual_perda: item.percentual_perda,
      observacao: item.observacao || '',
      ativo: item.ativo,
    })
    setDialogOpen(true)
  }

  const salvar = async () => {
    if (!form.insumo || !form.quantidade_necessaria) {
      alert('Selecione o insumo e informe a quantidade.')
      return
    }
    setSalvando(true)
    try {
      const payload = {
        ...form,
        produto_acabado: produtoSelecionado.id_produto,
      }
      if (editando) {
        await axiosInstance.patch(`/pcp/composicoes/${editando.id_composicao}/`, payload)
      } else {
        await axiosInstance.post('/pcp/composicoes/', payload)
      }
      setDialogOpen(false)
      buscarComposicao()
    } catch (e) {
      alert(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || 'Erro ao salvar item da BOM.')
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (item) => {
    if (!window.confirm(`Remover "${item.insumo_nome}" da ficha técnica?`)) return
    try {
      await axiosInstance.delete(`/pcp/composicoes/${item.id_composicao}/`)
      buscarComposicao()
    } catch {
      alert('Erro ao excluir item.')
    }
  }

  const custoEstimado = composicao.reduce((acc, item) => {
    return acc  // custo dependeria do custo médio dos insumos
  }, 0)

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Autocomplete
            options={produtos}
            getOptionLabel={p => `${p.codigo_produto} — ${p.nome_produto}`}
            value={produtoSelecionado}
            onChange={(_, v) => setProdutoSelecionado(v)}
            sx={{ flex: 1 }}
            renderInput={params => (
              <TextField {...params} label="Produto Acabado" size="small"
                placeholder="Pesquise pelo nome ou código…" />
            )}
          />
          {produtoSelecionado && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}
              sx={{ bgcolor: '#FF5722', '&:hover': { bgcolor: '#E64A19' }, whiteSpace: 'nowrap' }}>
              Adicionar Insumo
            </Button>
          )}
        </Stack>
      </Paper>

      {!produtoSelecionado && (
        <Alert severity="info">
          Selecione um produto acabado para visualizar e editar sua Ficha Técnica (BOM).
        </Alert>
      )}

      {produtoSelecionado && (
        <>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <BomIcon color="primary" />
            <Typography variant="h6">
              Ficha Técnica: <strong>{produtoSelecionado.nome_produto}</strong>
            </Typography>
            <Chip label={`${composicao.length} insumos`} size="small" color="primary" />
          </Stack>

          {loading && <LinearProgress sx={{ mb: 1 }} />}

          {composicao.length === 0 && !loading && (
            <Alert severity="warning">
              Nenhum insumo cadastrado. Clique em "Adicionar Insumo" para montar a Ficha Técnica.
            </Alert>
          )}

          {composicao.length > 0 && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#FF5722' }}>
                    {['Insumo', 'Unidade', 'Qtd / Unidade', '% Perda', 'Qtd c/ Perda', 'Ativo', 'Observação'].map(h => (
                      <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>{h}</TableCell>
                    ))}
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {composicao.map(item => {
                    const qtdComPerda = (
                      Number(item.quantidade_necessaria) * (1 + Number(item.percentual_perda) / 100)
                    )
                    return (
                      <TableRow key={item.id_composicao} hover
                        sx={{ opacity: item.ativo ? 1 : 0.5 }}>
                        <TableCell>{item.insumo_nome}</TableCell>
                        <TableCell>{item.insumo_unidade || '—'}</TableCell>
                        <TableCell>{fmt(item.quantidade_necessaria, 4)}</TableCell>
                        <TableCell>{fmt(item.percentual_perda, 2)}%</TableCell>
                        <TableCell sx={{ color: '#FF9800', fontWeight: 'bold' }}>
                          {fmt(qtdComPerda, 4)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.ativo ? 'Ativo' : 'Inativo'}
                            size="small"
                            color={item.ativo ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{item.observacao || '—'}</TableCell>
                        <TableCell>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => abrirEditar(item)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remover">
                            <IconButton size="small" color="error" onClick={() => excluir(item)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Dialog Insumo */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editando ? 'Editar Insumo na BOM' : 'Adicionar Insumo à Ficha Técnica'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Insumo / Matéria-prima" select fullWidth size="small"
              value={form.insumo} onChange={e => setForm({ ...form, insumo: e.target.value })}>
              <MenuItem value=""><em>Selecione…</em></MenuItem>
              {produtos
                .filter(p => p.id_produto !== produtoSelecionado?.id_produto)
                .map(p => (
                  <MenuItem key={p.id_produto} value={p.id_produto}>
                    {p.codigo_produto} — {p.nome_produto} ({p.unidade_medida || 'UN'})
                  </MenuItem>
                ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Quantidade por Unidade" type="number" fullWidth size="small"
                value={form.quantidade_necessaria}
                onChange={e => setForm({ ...form, quantidade_necessaria: e.target.value })}
                inputProps={{ min: 0.0001, step: 0.0001 }}
                helperText="Quantidade de insumo para fabricar 1 unidade do produto acabado" />
              <TextField
                label="% Perda" type="number" fullWidth size="small"
                value={form.percentual_perda}
                onChange={e => setForm({ ...form, percentual_perda: e.target.value })}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                helperText="Ex: 5 = 5% de desperdício" />
            </Stack>
            <TextField
              label="Observação" fullWidth size="small"
              value={form.observacao}
              onChange={e => setForm({ ...form, observacao: e.target.value })} />
            <TextField
              label="Status" select fullWidth size="small"
              value={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.value })}>
              <MenuItem value={true}>Ativo</MenuItem>
              <MenuItem value={false}>Inativo</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvar} disabled={salvando}
            sx={{ bgcolor: '#FF5722' }}>
            {salvando ? <CircularProgress size={20} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ProducaoPage() {
  const [aba, setAba] = useState(0)

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <ProducaoIcon sx={{ color: '#FF5722', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="bold">PCP — Planejamento e Controle de Produção</Typography>
      </Stack>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={aba} onChange={(_, v) => setAba(v)} indicatorColor="primary" textColor="primary">
          <Tab label="Ordens de Produção" icon={<ProducaoIcon />} iconPosition="start" />
          <Tab label="Ficha Técnica (BOM)" icon={<BomIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {aba === 0 && <AbaOrdens />}
      {aba === 1 && <AbaFichaTecnica />}
    </Box>
  )
}

