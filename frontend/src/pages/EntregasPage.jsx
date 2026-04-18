import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box, Typography, Paper, Grid, Chip, Button, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  LinearProgress, Stepper, Step, StepLabel, Tooltip, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert,
  Tabs, Tab, Avatar, List, ListItem, ListItemText, ListItemAvatar,
  Badge, Card, CardContent, CardActions, Collapse
} from '@mui/material'
import {
  LocalShipping as TruckIcon,
  CheckCircle as CheckCircleIcon,
  Inventory as BoxIcon,
  Schedule as ClockIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  WhatsApp as WhatsAppIcon,
  Print as PrintIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  History as HistoryIcon,
  Done as DoneIcon,
  NotListedLocation as PendingIcon,
  DirectionsBike as BikeIcon,
  Store as StoreIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { API_ENDPOINT } from '../config/api'
import { useToast } from '../components/common/Toast'

const getToken = () => sessionStorage.getItem('accessToken') || sessionStorage.getItem('token')
const getApiUrl = (path) => `${API_ENDPOINT}/${path}`

const STATUS_CONFIG = {
  PREPARANDO: {
    label: 'Preparando',
    color: '#FF9800',
    bg: '#FFF3E0',
    icon: <BoxIcon fontSize="small" />,
    step: 0,
  },
  AGUARDANDO_RETIRADA: {
    label: 'Ag. Retirada',
    color: '#2196F3',
    bg: '#E3F2FD',
    icon: <StoreIcon fontSize="small" />,
    step: 1,
  },
  DESPACHADO: {
    label: 'Despachado',
    color: '#9C27B0',
    bg: '#F3E5F5',
    icon: <TruckIcon fontSize="small" />,
    step: 2,
  },
  ENTREGUE: {
    label: 'Entregue',
    color: '#4CAF50',
    bg: '#E8F5E9',
    icon: <CheckCircleIcon fontSize="small" />,
    step: 3,
  },
}

const STEPS = ['Preparando', 'Ag. Retirada', 'Despachado', 'Entregue']
const STATUS_KEYS = ['PREPARANDO', 'AGUARDANDO_RETIRADA', 'DESPACHADO', 'ENTREGUE']

function calcProgresso(itens) {
  if (!itens || itens.length === 0) return 0
  const total = itens.reduce((s, i) => s + parseFloat(i.quantidade || 0), 0)
  const entregue = itens.reduce((s, i) => s + parseFloat(i.quantidade_entregue || 0), 0)
  if (total === 0) return 0
  return Math.round((entregue / total) * 100)
}

function fmtData(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

function fmtDataHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('pt-BR')
}

function fmtMoeda(v) {
  return parseFloat(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ---- Dialog de atualização de entrega ----
function DialogAtualizarEntrega({ open, venda, onClose, onSalvo }) {
  const { showToast } = useToast()
  const [novoStatus, setNovoStatus] = useState('')
  const [observacao, setObservacao] = useState('')
  const [recebedorNome, setRecebedorNome] = useState('')
  const [recebedorDoc, setRecebedorDoc] = useState('')
  const [endereco, setEndereco] = useState('')
  const [dataPrevista, setDataPrevista] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [obsEntrega, setObsEntrega] = useState('')
  const [itens, setItens] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [aba, setAba] = useState(0)

  useEffect(() => {
    if (venda) {
      setNovoStatus(venda.status_logistica)
      setEndereco(venda.endereco_entrega || '')
      setDataPrevista(venda.data_prevista_entrega || '')
      setResponsavel(venda.responsavel_entrega || '')
      setObsEntrega(venda.observacao_entrega || '')
      setObservacao('')
      setRecebedorNome('')
      setRecebedorDoc('')
      setItens((venda.itens || []).map(i => ({ ...i, qtd_nova: parseFloat(i.quantidade_entregue || 0) })))
      setAba(0)
    }
  }, [venda])

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      const token = getToken()
      const payload = {
        status_logistica: novoStatus,
        observacao,
        recebedor_nome: recebedorNome,
        recebedor_documento: recebedorDoc,
        endereco_entrega: endereco,
        data_prevista_entrega: dataPrevista || null,
        responsavel_entrega: responsavel,
        observacao_entrega: obsEntrega,
        itens: itens.map(i => ({ id_item: i.id_item, quantidade_entregue: i.qtd_nova })),
      }
      const resp = await fetch(getApiUrl(`vendas/${venda.id_venda}/atualizar_entrega/`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.detail || 'Erro ao salvar')
      }
      showToast('Entrega atualizada com sucesso!', 'success')
      onSalvo()
      onClose()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSalvando(false)
    }
  }

  const handleMarcarTudo = () => {
    setItens(prev => prev.map(i => ({ ...i, qtd_nova: parseFloat(i.quantidade) })))
  }

  if (!venda) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TruckIcon color="primary" />
        Controle de Entrega — {venda.numero_documento}
        <IconButton onClick={onClose} sx={{ ml: 'auto' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Tabs value={aba} onChange={(_, v) => setAba(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Status" />
        <Tab label="Itens" />
        <Tab label="Informações" />
        <Tab label={<Badge badgeContent={venda.logs?.length || 0} color="primary">Histórico</Badge>} />
      </Tabs>

      <DialogContent sx={{ pt: 2 }}>
        {/* ABA 0: STATUS */}
        {aba === 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Cliente: <strong>{venda.cliente}</strong></Typography>
            <Typography variant="subtitle2" gutterBottom>Total: <strong>{fmtMoeda(venda.valor_total)}</strong></Typography>
            <Divider sx={{ my: 2 }} />

            <Stepper activeStep={STATUS_CONFIG[novoStatus]?.step ?? 0} alternativeLabel sx={{ mb: 3 }}>
              {STEPS.map(label => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Novo Status</InputLabel>
              <Select value={novoStatus} label="Novo Status" onChange={e => setNovoStatus(e.target.value)}>
                {STATUS_KEYS.map(k => (
                  <MenuItem key={k} value={k}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {STATUS_CONFIG[k].icon}
                      {STATUS_CONFIG[k].label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Observação"
              fullWidth
              multiline
              rows={2}
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="Digite alguma observação sobre esta atualização de status..."
            />

            {novoStatus === 'ENTREGUE' && (
              <Box sx={{ p: 2, bgcolor: '#E8F5E9', borderRadius: 1, border: '1px solid #A5D6A7' }}>
                <Typography variant="subtitle2" gutterBottom>Dados do Recebedor</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Nome de quem recebeu"
                      fullWidth
                      size="small"
                      value={recebedorNome}
                      onChange={e => setRecebedorNome(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="CPF / RG"
                      fullWidth
                      size="small"
                      value={recebedorDoc}
                      onChange={e => setRecebedorDoc(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        )}

        {/* ABA 1: ITENS */}
        {aba === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2">Informe as quantidades entregues</Typography>
              <Button size="small" onClick={handleMarcarTudo}>Marcar tudo como entregue</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                    <TableCell>Produto</TableCell>
                    <TableCell align="center">Qtd. Pedido</TableCell>
                    <TableCell align="center">Já Entregue</TableCell>
                    <TableCell align="center">Entregar Agora</TableCell>
                    <TableCell align="center">Progresso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itens.map((item, idx) => {
                    const prog = item.quantidade > 0 ? Math.round((item.qtd_nova / parseFloat(item.quantidade)) * 100) : 0
                    return (
                      <TableRow key={item.id_item}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{item.produto}</Typography>
                          {item.codigo && <Typography variant="caption" color="text.secondary">{item.codigo}</Typography>}
                        </TableCell>
                        <TableCell align="center">{parseFloat(item.quantidade).toLocaleString('pt-BR')}</TableCell>
                        <TableCell align="center">{parseFloat(item.quantidade_entregue || 0).toLocaleString('pt-BR')}</TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={item.qtd_nova}
                            inputProps={{ min: 0, max: parseFloat(item.quantidade), step: 0.001, style: { textAlign: 'center', width: 80 } }}
                            onChange={e => {
                              const val = Math.min(parseFloat(e.target.value) || 0, parseFloat(item.quantidade))
                              setItens(prev => prev.map((ii, i) => i === idx ? { ...ii, qtd_nova: val } : ii))
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ minWidth: 100 }}>
                          <Tooltip title={`${prog}%`}>
                            <Box>
                              <LinearProgress
                                variant="determinate"
                                value={prog}
                                sx={{ height: 8, borderRadius: 4, bgcolor: '#E0E0E0',
                                  '& .MuiLinearProgress-bar': { bgcolor: prog === 100 ? '#4CAF50' : '#2196F3' } }}
                              />
                              <Typography variant="caption">{prog}%</Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ABA 2: INFORMAÇÕES DE ENTREGA */}
        {aba === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Endereço de Entrega"
                fullWidth
                multiline
                rows={2}
                value={endereco}
                onChange={e => setEndereco(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><LocationIcon color="action" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data Prevista de Entrega"
                type="date"
                fullWidth
                value={dataPrevista}
                onChange={e => setDataPrevista(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarIcon color="action" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Entregador / Responsável"
                fullWidth
                value={responsavel}
                onChange={e => setResponsavel(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observações de Entrega"
                fullWidth
                multiline
                rows={3}
                value={obsEntrega}
                onChange={e => setObsEntrega(e.target.value)}
                placeholder="Ponto de referência, instruções especiais, etc."
              />
            </Grid>
          </Grid>
        )}

        {/* ABA 3: HISTÓRICO */}
        {aba === 3 && (
          <Box>
            {(!venda.logs || venda.logs.length === 0) ? (
              <Alert severity="info">Nenhum histórico registrado ainda.</Alert>
            ) : (
              <List>
                {venda.logs.map(log => (
                  <ListItem key={log.id_entrega_log} alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: STATUS_CONFIG[log.status_novo]?.color, width: 36, height: 36 }}>
                        {STATUS_CONFIG[log.status_novo]?.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={STATUS_CONFIG[log.status_anterior]?.label || log.status_anterior}
                            size="small"
                            sx={{ bgcolor: STATUS_CONFIG[log.status_anterior]?.bg, color: STATUS_CONFIG[log.status_anterior]?.color, fontSize: 11 }}
                          />
                          <Typography variant="caption">→</Typography>
                          <Chip
                            label={STATUS_CONFIG[log.status_novo]?.label || log.status_novo}
                            size="small"
                            sx={{ bgcolor: STATUS_CONFIG[log.status_novo]?.bg, color: STATUS_CONFIG[log.status_novo]?.color, fontSize: 11 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">{fmtDataHora(log.data_log)} — {log.usuario}</Typography>
                          {log.observacao && <Typography variant="body2" sx={{ mt: 0.5 }}>{log.observacao}</Typography>}
                          {log.recebedor_nome && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Recebedor: {log.recebedor_nome} {log.recebedor_documento && `(${log.recebedor_documento})`}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={salvando}>Fechar</Button>
        <Button
          variant="contained"
          onClick={handleSalvar}
          disabled={salvando}
          startIcon={salvando ? <CircularProgress size={16} /> : <DoneIcon />}
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---- Card de uma venda ----
function VendaEntregaCard({ venda, onAtualizar, onWhatsapp, onImprimir }) {
  const [expandido, setExpandido] = useState(false)
  const cfg = STATUS_CONFIG[venda.status_logistica] || STATUS_CONFIG.PREPARANDO
  const progresso = calcProgresso(venda.itens)

  return (
    <Card variant="outlined" sx={{ mb: 2, border: `1.5px solid ${cfg.color}33`, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 3 } }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: cfg.color, width: 32, height: 32 }}>{cfg.icon}</Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>{venda.numero_documento}</Typography>
              <Typography variant="caption" color="text.secondary">{fmtData(venda.data_documento)}</Typography>
            </Box>
          </Box>
          <Chip
            label={cfg.label}
            size="small"
            icon={cfg.icon}
            sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 600, border: `1px solid ${cfg.color}` }}
          />
        </Box>

        <Divider sx={{ my: 1 }} />

        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>{venda.cliente}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Valor Total</Typography>
            <Typography variant="body2" fontWeight={600}>{fmtMoeda(venda.valor_total)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Taxa Entrega</Typography>
            <Typography variant="body2">{fmtMoeda(venda.taxa_entrega)}</Typography>
          </Grid>
        </Grid>

        {venda.endereco_entrega && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 1 }}>
            <LocationIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>{venda.endereco_entrega}</Typography>
          </Box>
        )}

        {venda.data_prevista_entrega && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <CalendarIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
              Previsto: {fmtData(venda.data_prevista_entrega)}
            </Typography>
          </Box>
        )}

        {venda.responsavel_entrega && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <BikeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>{venda.responsavel_entrega}</Typography>
          </Box>
        )}

        <Box sx={{ mt: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Progresso de entrega</Typography>
            <Typography variant="caption" fontWeight={700} color={progresso === 100 ? '#4CAF50' : '#2196F3'}>{progresso}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progresso}
            sx={{ height: 8, borderRadius: 4,
              '& .MuiLinearProgress-bar': { bgcolor: progresso === 100 ? '#4CAF50' : cfg.color } }}
          />
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 1, pt: 0, gap: 0.5, flexWrap: 'wrap' }}>
        <Button size="small" variant="contained" startIcon={<EditIcon />} onClick={() => onAtualizar(venda)}>
          Atualizar
        </Button>
        {venda.cliente_telefone && (
          <Tooltip title="Enviar status via WhatsApp">
            <IconButton size="small" onClick={() => onWhatsapp(venda)} sx={{ color: '#25D366' }}>
              <WhatsAppIcon />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Imprimir comprovante">
          <IconButton size="small" onClick={() => onImprimir(venda)}>
            <PrintIcon />
          </IconButton>
        </Tooltip>
        <IconButton size="small" sx={{ ml: 'auto' }} onClick={() => setExpandido(!expandido)}>
          {expandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </CardActions>

      <Collapse in={expandido}>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>ITENS DO PEDIDO</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Produto</TableCell>
                <TableCell align="right">Qtd</TableCell>
                <TableCell align="right">Entregue</TableCell>
                <TableCell align="center">Progresso</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(venda.itens || []).map(item => {
                const p = parseFloat(item.quantidade) > 0
                  ? Math.round((parseFloat(item.quantidade_entregue || 0) / parseFloat(item.quantidade)) * 100) : 0
                return (
                  <TableRow key={item.id_item}>
                    <TableCell><Typography variant="caption">{item.produto}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="caption">{parseFloat(item.quantidade).toLocaleString('pt-BR')}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="caption" color={p === 100 ? 'success.main' : 'text.primary'}>{parseFloat(item.quantidade_entregue || 0).toLocaleString('pt-BR')}</Typography></TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LinearProgress sx={{ flex: 1, height: 6, borderRadius: 3 }} variant="determinate" value={p} />
                        <Typography variant="caption" sx={{ width: 28 }}>{p}%</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      </Collapse>
    </Card>
  )
}

// ---- Página principal ----
export default function EntregasPage() {
  const { showToast } = useToast()
  const [vendas, setVendas] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [mostrarEntregues, setMostrarEntregues] = useState(false)
  const [vendaSelecionada, setVendaSelecionada] = useState(null)
  const [dialogAberto, setDialogAberto] = useState(false)
  const printRef = useRef()

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const token = getToken()
      const params = new URLSearchParams()
      if (filtroStatus) params.set('status', filtroStatus)
      if (mostrarEntregues) params.set('todos', '1')
      if (busca) params.set('busca', busca)
      const resp = await fetch(getApiUrl(`vendas/entregas/?${params}`), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!resp.ok) throw new Error('Erro ao buscar entregas')
      const data = await resp.json()
      setVendas(data)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setCarregando(false)
    }
  }, [filtroStatus, mostrarEntregues, busca, showToast])

  useEffect(() => { carregar() }, [carregar])

  const handleAtualizar = (venda) => {
    setVendaSelecionada(venda)
    setDialogAberto(true)
  }

  const handleWhatsapp = (venda) => {
    const cfg = STATUS_CONFIG[venda.status_logistica] || STATUS_CONFIG.PREPARANDO
    const msg = [
      `📦 *Atualização de Pedido*`,
      ``,
      `Olá, ${venda.cliente}!`,
      `Seu pedido *${venda.numero_documento}* está com status: *${cfg.label}*`,
      venda.data_prevista_entrega ? `📅 Previsão de entrega: ${fmtData(venda.data_prevista_entrega)}` : '',
      venda.responsavel_entrega ? `🚴 Entregador: ${venda.responsavel_entrega}` : '',
      ``,
      `Qualquer dúvida, entre em contato conosco!`,
    ].filter(Boolean).join('\n')

    const tel = venda.cliente_telefone?.replace(/\D/g, '')
    if (tel) {
      window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank')
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    }
  }

  const handleImprimir = (venda) => {
    const itensHtml = (venda.itens || []).map(i => `
      <tr>
        <td>${i.produto}</td>
        <td align="center">${parseFloat(i.quantidade).toLocaleString('pt-BR')}</td>
        <td align="center">${parseFloat(i.quantidade_entregue || 0).toLocaleString('pt-BR')}</td>
      </tr>`).join('')

    const html = `
      <!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Comprovante de Entrega - ${venda.numero_documento}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { font-size: 18px; text-align: center; border-bottom: 2px solid #000; pb: 10px; }
        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 16px 0; }
        .info-item { border: 1px solid #ddd; padding: 8px; border-radius: 4px; }
        .info-item label { font-size: 11px; color: #666; display: block; }
        .info-item span { font-size: 14px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
        th { background: #f0f0f0; }
        .assinatura { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .assinatura-box { text-align: center; border-top: 1px solid #000; padding-top: 8px; font-size: 12px; }
        @media print { body { padding: 5px; } }
      </style>
      </head><body>
      <h1>📦 COMPROVANTE DE ENTREGA</h1>
      <div class="info">
        <div class="info-item"><label>Pedido / Documento</label><span>${venda.numero_documento}</span></div>
        <div class="info-item"><label>Data</label><span>${fmtData(venda.data_documento)}</span></div>
        <div class="info-item"><label>Cliente</label><span>${venda.cliente}</span></div>
        <div class="info-item"><label>Status</label><span>${STATUS_CONFIG[venda.status_logistica]?.label || venda.status_logistica}</span></div>
        ${venda.endereco_entrega ? `<div class="info-item" style="grid-column:1/-1"><label>Endereço de Entrega</label><span>${venda.endereco_entrega}</span></div>` : ''}
        ${venda.responsavel_entrega ? `<div class="info-item"><label>Entregador</label><span>${venda.responsavel_entrega}</span></div>` : ''}
        ${venda.data_prevista_entrega ? `<div class="info-item"><label>Data Prevista</label><span>${fmtData(venda.data_prevista_entrega)}</span></div>` : ''}
        <div class="info-item"><label>Valor Total</label><span>${fmtMoeda(venda.valor_total)}</span></div>
      </div>
      <table>
        <thead><tr><th>Produto</th><th>Qtd Pedido</th><th>Qtd Entregue</th></tr></thead>
        <tbody>${itensHtml}</tbody>
      </table>
      <div class="assinatura">
        <div class="assinatura-box">Assinatura do Entregador</div>
        <div class="assinatura-box">Assinatura do Recebedor</div>
      </div>
      <script>window.onload = function(){ window.print(); }</script>
      </body></html>`
    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
  }

  // Agrupamento por status
  const contagemPorStatus = STATUS_KEYS.reduce((acc, k) => {
    acc[k] = vendas.filter(v => v.status_logistica === k).length
    return acc
  }, {})

  const vendasFiltradas = vendas.filter(v =>
    !filtroStatus || v.status_logistica === filtroStatus
  )

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TruckIcon sx={{ fontSize: 36, color: '#1565C0' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Controle de Entregas</Typography>
          <Typography variant="body2" color="text.secondary">Gerencie o status logístico das vendas</Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Tooltip title="Atualizar">
            <IconButton onClick={carregar} disabled={carregando}>
              {carregando ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Chips de contagem por status */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          label={`Todas (${vendas.length})`}
          onClick={() => setFiltroStatus('')}
          variant={!filtroStatus ? 'filled' : 'outlined'}
          color={!filtroStatus ? 'primary' : 'default'}
        />
        {STATUS_KEYS.map(k => (
          <Chip
            key={k}
            label={`${STATUS_CONFIG[k].label} (${contagemPorStatus[k] || 0})`}
            icon={STATUS_CONFIG[k].icon}
            onClick={() => setFiltroStatus(filtroStatus === k ? '' : k)}
            variant={filtroStatus === k ? 'filled' : 'outlined'}
            sx={filtroStatus === k
              ? { bgcolor: STATUS_CONFIG[k].color, color: '#fff', '& .MuiChip-icon': { color: '#fff' } }
              : { borderColor: STATUS_CONFIG[k].color, color: STATUS_CONFIG[k].color, '& .MuiChip-icon': { color: STATUS_CONFIG[k].color } }
            }
          />
        ))}
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              fullWidth
              size="small"
              label="Buscar por nº doc. ou cliente"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && carregar()}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs="auto">
            <Button
              variant={mostrarEntregues ? 'contained' : 'outlined'}
              size="small"
              startIcon={<CheckCircleIcon />}
              onClick={() => setMostrarEntregues(!mostrarEntregues)}
              color={mostrarEntregues ? 'success' : 'inherit'}
            >
              {mostrarEntregues ? 'Ocultando' : 'Mostrar'} Entregues
            </Button>
          </Grid>
          <Grid item xs="auto">
            <Button size="small" variant="contained" onClick={carregar} startIcon={<SearchIcon />}>
              Buscar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de cards */}
      {carregando ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Carregando entregas...</Typography>
        </Box>
      ) : vendasFiltradas.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Nenhuma venda encontrada com os filtros aplicados.
          {!mostrarEntregues && ' (Entregas concluídas estão ocultas — clique em "Mostrar Entregues" para exibi-las)'}
        </Alert>
      ) : (
        <Box>
          <Typography variant="body2" color="text.secondary" mb={1}>
            {vendasFiltradas.length} venda{vendasFiltradas.length !== 1 ? 's' : ''} encontrada{vendasFiltradas.length !== 1 ? 's' : ''}
          </Typography>
          {vendasFiltradas.map(venda => (
            <VendaEntregaCard
              key={venda.id_venda}
              venda={venda}
              onAtualizar={handleAtualizar}
              onWhatsapp={handleWhatsapp}
              onImprimir={handleImprimir}
            />
          ))}
        </Box>
      )}

      {/* Dialog de atualização */}
      <DialogAtualizarEntrega
        open={dialogAberto}
        venda={vendaSelecionada}
        onClose={() => setDialogAberto(false)}
        onSalvo={carregar}
      />
    </Box>
  )
}
