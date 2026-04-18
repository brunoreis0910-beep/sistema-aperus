import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Grid, Card, CardContent, TextField, MenuItem,
  Stack, CircularProgress, Alert, Paper, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, InputAdornment, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress,
} from '@mui/material'
import {
  LocalShipping as TruckIcon,
  Add as AddIcon,
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  PlayArrow as StartIcon,
  CheckCircle as DoneIcon,
  Receipt as NFeIcon,
  OpenInNew as MdfeIcon,
  Cancel as CancelIcon,
  Scale as ScaleIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

// ─── Configurações ─────────────────────────────────────────────────────────

const STATUS_MAP = {
  EM_MONTAGEM: { label: 'Em Montagem',  color: 'warning' },
  EM_ROTA:     { label: 'Em Rota',      color: 'info'    },
  ENTREGUE:    { label: 'Entregue',     color: 'success' },
  CANCELADO:   { label: 'Cancelado',    color: 'error'   },
}

const ENTREGA_STATUS = {
  PENDENTE:    { label: 'Pendente',    color: 'warning' },
  ENTREGUE:    { label: 'Entregue',    color: 'success' },
  RECUSADA:    { label: 'Recusada',    color: 'error'   },
  REAGENDADA:  { label: 'Reagendada',  color: 'info'    },
}

const STATUS_NFE = {
  PENDENTE:   { label: 'Pendente',   color: 'warning' },
  EMITIDA:    { label: 'Emitida',    color: 'success' },
  AUTORIZADA: { label: 'Autorizada', color: 'success' },
  CANCELADA:  { label: 'Cancelada',  color: 'error'   },
  ERRO:       { label: 'Erro',       color: 'error'   },
}

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtPeso = (v) => {
  const n = Number(v || 0)
  if (n === 0) return '—'
  return n >= 1000
    ? (n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 3 }) + ' t'
    : n.toLocaleString('pt-BR', { maximumFractionDigits: 3 }) + ' kg'
}
const fmtData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
const fmtDataHora = (d) => d ? new Date(d).toLocaleString('pt-BR') : '—'

function SummaryChip({ label, value, color }) {
  return (
    <Box sx={{ textAlign: 'center', px: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="h6" fontWeight="bold" sx={{ color }}>{value}</Typography>
    </Box>
  )
}

// ─── Diálogo: Criar Novo Mapa ───────────────────────────────────────────────
function NovoMapaDialog({ open, onClose, onSalvo, axiosInstance }) {
  const [veiculos, setVeiculos]   = useState([])
  const [motoristas, setMotoristas] = useState([])
  const [form, setForm] = useState({ id_veiculo: '', id_motorista: '', data_saida: '', observacoes: '' })
  const [saving, setSaving]       = useState(false)
  const [erro, setErro]           = useState(null)

  useEffect(() => {
    if (!open) return
    setForm({ id_veiculo: '', id_motorista: '', data_saida: '', observacoes: '' })
    setErro(null)
    Promise.all([
      axiosInstance.get('/veiculos/', { params: { page_size: 200 } }),
      axiosInstance.get('/vendedores/', { params: { page_size: 200 } }),
    ]).then(([rv, rm]) => {
      const vData = rv.data
      const mData = rm.data
      setVeiculos(Array.isArray(vData) ? vData : vData?.results || [])
      setMotoristas(Array.isArray(mData) ? mData : mData?.results || [])
    }).catch(() => {})
  }, [open, axiosInstance])

  const handleSalvar = async () => {
    if (!form.id_veiculo || !form.id_motorista) {
      setErro('Selecione o veículo e o motorista.')
      return
    }
    setSaving(true)
    setErro(null)
    try {
      const payload = { id_veiculo: form.id_veiculo, id_motorista: form.id_motorista }
      if (form.data_saida) payload.data_saida = form.data_saida
      if (form.observacoes) payload.observacoes = form.observacoes
      const r = await axiosInstance.post('/mapas-carga/', payload)
      onSalvo(r.data)
    } catch (e) {
      const msg = e.response?.data?.detail || JSON.stringify(e.response?.data) || e.message
      setErro('Erro ao criar mapa: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Novo Mapa de Carga</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }}>
          {erro && <Alert severity="error">{erro}</Alert>}
          <TextField
            select label="Veículo" value={form.id_veiculo}
            onChange={e => setForm(f => ({ ...f, id_veiculo: e.target.value }))}
            size="small" required
          >
            {veiculos.map(v => (
              <MenuItem key={v.id_veiculo} value={v.id_veiculo}>
                {v.placa} {v.marca ? `— ${v.marca}` : ''} {v.modelo ? v.modelo : ''}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select label="Motorista / Responsável" value={form.id_motorista}
            onChange={e => setForm(f => ({ ...f, id_motorista: e.target.value }))}
            size="small" required
          >
            {motoristas.map(m => (
              <MenuItem key={m.id_vendedor} value={m.id_vendedor}>{m.nome}</MenuItem>
            ))}
          </TextField>
          <TextField
            type="datetime-local" label="Data/Hora de Saída (prevista)"
            value={form.data_saida}
            onChange={e => setForm(f => ({ ...f, data_saida: e.target.value }))}
            size="small" InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Observações" multiline rows={2}
            value={form.observacoes}
            onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSalvar} disabled={saving}>
          {saving ? 'Salvando...' : 'Criar Mapa'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Diálogo: Adicionar NF-e ────────────────────────────────────────────────
function AddNFeDialog({ open, onClose, onAdicionado, axiosInstance, idMapa, jaAdicionados }) {
  const [lista, setLista]   = useState([])
  const [loading, setLoading] = useState(false)
  const [busca, setBusca]   = useState('')
  const [adicionando, setAdicionando] = useState(null)
  const [erro, setErro]     = useState(null)

  useEffect(() => {
    if (!open) return
    setBusca('')
    setErro(null)
    setLoading(true)
    axiosInstance.get('/vendas/', {
      params: { modelo: '55', ordering: '-id_venda', page_size: 500 }
    }).then(r => {
      const data = r.data
      const arr = Array.isArray(data) ? data : data?.results || []
      setLista(arr)
    }).catch(() => setLista([])).finally(() => setLoading(false))
  }, [open, axiosInstance])

  const jaAdicionadosSet = new Set((jaAdicionados || []).map(i => i.id_venda))

  const disponiveis = lista.filter(n => {
    if (jaAdicionadosSet.has(n.id)) return false
    if (!busca) return true
    const q = busca.toLowerCase()
    return (
      (n.nome_cliente || '').toLowerCase().includes(q) ||
      String(n.numero_nfe || n.numero_documento || '').includes(q) ||
      (n.placa_veiculo || '').toLowerCase().includes(q)
    )
  })

  const handleAdicionar = async (nfe) => {
    setAdicionando(nfe.id)
    setErro(null)
    try {
      const r = await axiosInstance.post(`/mapas-carga/${idMapa}/adicionar_venda/`, { id_venda: nfe.id })
      onAdicionado(r.data)
    } catch (e) {
      setErro(e.response?.data?.error || e.response?.data?.detail || 'Erro ao adicionar NF-e')
    } finally {
      setAdicionando(null)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <NFeIcon color="primary" />
          Adicionar NF-e ao Mapa
        </Stack>
      </DialogTitle>
      <DialogContent>
        {erro && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setErro(null)}>{erro}</Alert>}
        <TextField
          size="small" fullWidth label="Buscar por cliente, NF-e ou placa"
          value={busca} onChange={e => setBusca(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ mb: 1.5, mt: 0.5 }}
        />
        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={28} /></Box>
        ) : (
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['N° NF-e', 'Cliente', 'Placa', 'Peso Bruto', 'Valor', 'Status', ''].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {disponiveis.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">Nenhuma NF-e disponível</TableCell></TableRow>
                ) : disponiveis.map(n => {
                  const nNFe = n.numero_nfe
                    ? `${n.serie_nfe || 1}/${String(n.numero_nfe).padStart(6, '0')}`
                    : n.numero_documento || '—'
                  const stK = (n.status_nfe || '').toUpperCase()
                  const st = STATUS_NFE[stK] || { label: n.status_nfe || '?', color: 'default' }
                  return (
                    <TableRow key={n.id} hover>
                      <TableCell><Typography variant="body2" fontFamily="monospace" fontWeight="bold">{nNFe}</Typography></TableCell>
                      <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>{n.nome_cliente || '—'}</Typography></TableCell>
                      <TableCell>{n.placa_veiculo || '—'}</TableCell>
                      <TableCell>{fmtPeso(n.peso_bruto)}</TableCell>
                      <TableCell noWrap>{fmt(n.valor_total)}</TableCell>
                      <TableCell><Chip label={st.label} size="small" color={st.color} /></TableCell>
                      <TableCell>
                        <Button
                          size="small" variant="outlined"
                          disabled={adicionando === n.id}
                          onClick={() => handleAdicionar(n)}
                          startIcon={<AddIcon />}
                        >
                          {adicionando === n.id ? '...' : 'Adicionar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {disponiveis.length} NF-e(s) disponíveis para adição
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Vista Detalhe do Mapa ──────────────────────────────────────────────────
function DetalheMapaView({ mapa: mapaInicial, onVoltar, axiosInstance, navigate }) {
  const [mapa, setMapa]           = useState(mapaInicial)
  const [openAddNFe, setOpenAddNFe] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [erro, setErro]           = useState(null)

  const recarregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await axiosInstance.get(`/mapas-carga/${mapa.id_mapa}/`)
      setMapa(r.data)
    } catch (e) {
      setErro('Erro ao recarregar: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }, [mapa.id_mapa, axiosInstance])

  const handleRemover = async (idVenda) => {
    if (!window.confirm('Remover esta NF-e do mapa?')) return
    try {
      await axiosInstance.post(`/mapas-carga/${mapa.id_mapa}/remover_venda/`, { id_venda: idVenda })
      recarregar()
    } catch (e) {
      setErro(e.response?.data?.error || 'Erro ao remover')
    }
  }

  const handleMoverOrdem = async (itemId, direcao) => {
    const itens = [...(mapa.itens || [])].sort((a, b) => a.ordem_entrega - b.ordem_entrega)
    const idx = itens.findIndex(i => i.id_item_mapa === itemId)
    if (idx < 0) return
    const novoIdx = idx + direcao
    if (novoIdx < 0 || novoIdx >= itens.length) return
    // Troca
    const arr = [...itens]
    ;[arr[idx], arr[novoIdx]] = [arr[novoIdx], arr[idx]]
    const ordem = arr.map(i => i.id_item_mapa)
    try {
      await axiosInstance.post(`/mapas-carga/${mapa.id_mapa}/reordenar/`, { ordem })
      recarregar()
    } catch (e) {
      setErro('Erro ao reordenar: ' + (e.response?.data?.error || e.message))
    }
  }

  const handleAcao = async (acao) => {
    const msgs = { iniciar_rota: 'Iniciar rota?', finalizar: 'Finalizar mapa?', gerar_mdfe: 'Gerar MDF-e a partir deste mapa?' }
    if (!window.confirm(msgs[acao] || 'Confirmar?')) return
    setLoading(true)
    setErro(null)
    try {
      const r = await axiosInstance.post(`/mapas-carga/${mapa.id_mapa}/${acao}/`)
      if (acao === 'gerar_mdfe') {
        alert(`MDF-e gerado: ${r.data.numero_mdfe || r.data.id_mdfe}`)
        navigate('/fiscal/mdfe')
        return
      }
      recarregar()
    } catch (e) {
      setErro(e.response?.data?.error || e.response?.data?.detail || 'Erro ao executar ação')
    } finally {
      setLoading(false)
    }
  }

  const handleImprimir = () => {
    const itens = [...(mapa.itens || [])].sort((a, b) => a.ordem_entrega - b.ordem_entrega)
    const rows = itens.map(i => `<tr>
      <td style="text-align:center">${i.ordem_entrega}</td>
      <td>${i.numero_nfe ? `${i.serie_nfe || 1}/${String(i.numero_nfe).padStart(6, '0')}` : i.venda_numero || '—'}</td>
      <td>${i.cliente_nome || '—'}</td>
      <td>${i.cliente_endereco || '—'} ${i.cliente_bairro ? '— ' + i.cliente_bairro : ''}</td>
      <td>${i.cliente_cidade || '—'}</td>
      <td style="text-align:right">${fmtPeso(i.peso_bruto_venda)}</td>
      <td style="text-align:right">${fmt(i.valor_venda)}</td>
      <td>${(ENTREGA_STATUS[i.status_entrega] || {}).label || i.status_entrega}</td>
    </tr>`).join('')

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Mapa de Carga ${mapa.numero_mapa}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;margin:20px}
      h2{margin:0 0 2px;color:#1565C0}
      .info{display:flex;gap:30px;margin-bottom:12px;font-size:11px}
      .info span b{color:#333}
      table{width:100%;border-collapse:collapse}
      th{background:#1565C0;color:#fff;padding:6px 8px;text-align:left;white-space:nowrap}
      td{padding:5px 8px;border-bottom:1px solid #ddd}
      tr:nth-child(even) td{background:#f7f7f7}
      .rodape{margin-top:8px;font-size:9px;color:#999;text-align:right}
    </style></head><body>
    <h2>Mapa de Carga — ${mapa.numero_mapa}</h2>
    <div class="info">
      <span><b>Veículo:</b> ${mapa.veiculo_placa} ${mapa.veiculo_modelo || ''}</span>
      <span><b>Motorista:</b> ${mapa.motorista_nome || '—'}</span>
      <span><b>Saída:</b> ${fmtDataHora(mapa.data_saida)}</span>
      <span><b>Status:</b> ${STATUS_MAP[mapa.status]?.label || mapa.status}</span>
    </div>
    <table>
      <thead><tr><th>#</th><th>NF-e</th><th>Cliente</th><th>Endereço</th><th>Cidade</th><th>Peso</th><th>Valor</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="rodape">
      Peso total: ${fmtPeso(mapa.peso_total_kg)} | Valor total: ${fmt(mapa.valor_total_carga)} | 
      ${itens.length} entregas | Gerado: ${new Date().toLocaleString('pt-BR')}
    </div>
    </body></html>`

    const w = window.open('', '_blank', 'width=960,height=680')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }

  const statusCfg = STATUS_MAP[mapa.status] || { label: mapa.status, color: 'default' }
  const itensOrdenados = [...(mapa.itens || [])].sort((a, b) => a.ordem_entrega - b.ordem_entrega)

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <IconButton onClick={onVoltar} size="small"><BackIcon /></IconButton>
          <TruckIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="h5" fontWeight="bold">Mapa {mapa.numero_mapa}</Typography>
              <Chip label={statusCfg.label} color={statusCfg.color} size="small" />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {mapa.veiculo_placa} {mapa.veiculo_modelo ? `— ${mapa.veiculo_modelo}` : ''} | Motorista: {mapa.motorista_nome || '—'}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Tooltip title="Atualizar">
            <IconButton onClick={recarregar} disabled={loading} size="small"><RefreshIcon /></IconButton>
          </Tooltip>
          <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={handleImprimir}
            disabled={itensOrdenados.length === 0}>
            Imprimir
          </Button>
          {mapa.status === 'EM_MONTAGEM' && (
            <>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setOpenAddNFe(true)}>
                Adicionar NF-e
              </Button>
              <Button variant="contained" size="small" color="info" startIcon={<StartIcon />}
                onClick={() => handleAcao('iniciar_rota')} disabled={loading || itensOrdenados.length === 0}>
                Iniciar Rota
              </Button>
            </>
          )}
          {mapa.status === 'EM_ROTA' && (
            <>
              <Button variant="outlined" size="small" color="secondary" startIcon={<MdfeIcon />}
                onClick={() => handleAcao('gerar_mdfe')} disabled={loading || !!mapa.id_mdfe}>
                {mapa.id_mdfe ? `MDF-e: ${mapa.mdfe_numero || mapa.id_mdfe}` : 'Gerar MDF-e'}
              </Button>
              <Button variant="contained" size="small" color="success" startIcon={<DoneIcon />}
                onClick={() => handleAcao('finalizar')} disabled={loading}>
                Finalizar Mapa
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro(null)}>{erro}</Alert>}
      {loading && <LinearProgress sx={{ mb: 1 }} />}

      {/* Totalizadores */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" divider={<Divider orientation="vertical" flexItem />}
          justifyContent="space-around" flexWrap="wrap" gap={2}>
          <SummaryChip label="Entregas" value={mapa.quantidade_entregas || itensOrdenados.length} color="#1565C0" />
          <SummaryChip label="Peso Total" value={fmtPeso(mapa.peso_total_kg)} color="#2E7D32" />
          <SummaryChip label="Valor Total" value={fmt(mapa.valor_total_carga)} color="#E65100" />
          <SummaryChip label="Saída Prevista" value={fmtDataHora(mapa.data_saida)} color="#6A1B9A" />
          {mapa.id_mdfe && (
            <SummaryChip label="MDF-e" value={mapa.mdfe_numero || `#${mapa.id_mdfe}`} color="#1B5E20" />
          )}
        </Stack>
      </Paper>

      {/* Tabela de itens */}
      {itensOrdenados.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <NFeIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">Nenhuma NF-e adicionada</Typography>
          {mapa.status === 'EM_MONTAGEM' && (
            <Button variant="outlined" sx={{ mt: 2 }} startIcon={<AddIcon />} onClick={() => setOpenAddNFe(true)}>
              Adicionar NF-e
            </Button>
          )}
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                {['#', 'NF-e', 'Cliente / Destinatário', 'Cidade', 'Peso', 'Valor', 'Status NF-e', 'Entrega',
                  mapa.status === 'EM_MONTAGEM' ? 'Ações' : ''].filter(Boolean).map(h => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {itensOrdenados.map((item, idx) => {
                const nNFe = item.numero_nfe
                  ? `${item.serie_nfe || 1}/${String(item.numero_nfe).padStart(6, '0')}`
                  : item.venda_numero || '—'
                const stNFe = STATUS_NFE[(item.status_nfe || '').toUpperCase()] || { label: item.status_nfe || '?', color: 'default' }
                const stEntrega = ENTREGA_STATUS[item.status_entrega] || { label: item.status_entrega, color: 'default' }
                return (
                  <TableRow key={item.id_item_mapa} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" align="center">{item.ordem_entrega}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight="bold">{nNFe}</Typography>
                      {item.chave_nfe && (
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.58rem', display: 'block' }}>
                          ...{item.chave_nfe.slice(-8)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 180 }}>{item.cliente_nome || '—'}</Typography>
                      {item.cliente_endereco && (
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180, display: 'block' }}>
                          {item.cliente_endereco}{item.cliente_bairro ? ` — ${item.cliente_bairro}` : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>{item.cliente_cidade || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{fmtPeso(item.peso_bruto_venda)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{fmt(item.valor_venda)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={stNFe.label} size="small" color={stNFe.color} />
                    </TableCell>
                    <TableCell>
                      <Chip label={stEntrega.label} size="small" color={stEntrega.color} variant="outlined" />
                    </TableCell>
                    {mapa.status === 'EM_MONTAGEM' && (
                      <TableCell>
                        <Stack direction="row" gap={0.5}>
                          <Tooltip title="Mover para cima">
                            <span><IconButton size="small" disabled={idx === 0}
                              onClick={() => handleMoverOrdem(item.id_item_mapa, -1)}>
                              <UpIcon fontSize="small" />
                            </IconButton></span>
                          </Tooltip>
                          <Tooltip title="Mover para baixo">
                            <span><IconButton size="small" disabled={idx === itensOrdenados.length - 1}
                              onClick={() => handleMoverOrdem(item.id_item_mapa, 1)}>
                              <DownIcon fontSize="small" />
                            </IconButton></span>
                          </Tooltip>
                          <Tooltip title="Remover do mapa">
                            <IconButton size="small" color="error" onClick={() => handleRemover(item.id_venda)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">{itensOrdenados.length} entrega(s)</Typography>
            <Typography variant="caption" color="text.secondary">
              Peso: <strong>{fmtPeso(mapa.peso_total_kg)}</strong> | Valor: <strong>{fmt(mapa.valor_total_carga)}</strong>
            </Typography>
          </Box>
        </TableContainer>
      )}

      <AddNFeDialog
        open={openAddNFe}
        onClose={() => setOpenAddNFe(false)}
        onAdicionado={() => { setOpenAddNFe(false); recarregar() }}
        axiosInstance={axiosInstance}
        idMapa={mapa.id_mapa}
        jaAdicionados={mapa.itens || []}
      />
    </Box>
  )
}

// ─── Vista Lista de Mapas ───────────────────────────────────────────────────
function ListaMapasView({ onAbrir, axiosInstance }) {
  const [lista, setLista]           = useState([])
  const [loading, setLoading]       = useState(false)
  const [erro, setErro]             = useState(null)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [openNovo, setOpenNovo]     = useState(false)

  const buscar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const params = { ordering: '-data_criacao', page_size: 200 }
      if (filtroStatus) params.status = filtroStatus
      const r = await axiosInstance.get('/mapas-carga/', { params })
      const data = r.data
      setLista(Array.isArray(data) ? data : data?.results || [])
    } catch (e) {
      setErro('Erro ao carregar mapas: ' + (e.response?.data?.detail || e.message))
      setLista([])
    } finally {
      setLoading(false)
    }
  }, [filtroStatus, axiosInstance])

  useEffect(() => { buscar() }, [buscar])

  const resumo = {
    montagem: lista.filter(m => m.status === 'EM_MONTAGEM').length,
    rota:     lista.filter(m => m.status === 'EM_ROTA').length,
    entregue: lista.filter(m => m.status === 'ENTREGUE').length,
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <TruckIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">Mapa de Carga</Typography>
            <Typography variant="caption" color="text.secondary">
              Controle de viagens — base para emissão de MDF-e
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" gap={1}>
          <Tooltip title="Atualizar"><IconButton onClick={buscar} disabled={loading} size="small"><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenNovo(true)}>
            Novo Mapa
          </Button>
        </Stack>
      </Stack>

      {/* Cards resumo */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Em Montagem', value: resumo.montagem, color: '#E65100', icon: <TruckIcon sx={{ fontSize: 48, opacity: 0.15 }} /> },
          { label: 'Em Rota',     value: resumo.rota,     color: '#1565C0', icon: <StartIcon sx={{ fontSize: 48, opacity: 0.15 }} /> },
          { label: 'Entregues',   value: resumo.entregue, color: '#2E7D32', icon: <DoneIcon sx={{ fontSize: 48, opacity: 0.15 }} /> },
        ].map(c => (
          <Grid item xs={12} sm={4} key={c.label}>
            <Card sx={{ borderTop: `4px solid ${c.color}` }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: c.color }}>{loading ? '...' : c.value}</Typography>
                  </Box>
                  <Box sx={{ color: c.color }}>{c.icon}</Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filtro */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" gap={2} alignItems="center">
          <TextField
            select size="small" label="Filtrar por status" value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)} sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {erro && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setErro(null)}>{erro}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : lista.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <TruckIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>Nenhum mapa de carga encontrado</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenNovo(true)}>
            Criar Primeiro Mapa
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                {['N° Mapa', 'Veículo', 'Motorista', 'Entregas', 'Peso', 'Valor', 'Saída', 'Criado em', 'Status', 'Ações'].map(h => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {lista.map(m => {
                const stCfg = STATUS_MAP[m.status] || { label: m.status, color: 'default' }
                return (
                  <TableRow key={m.id_mapa} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" fontFamily="monospace">{m.numero_mapa}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={m.veiculo_placa || '—'} size="small" variant="outlined" color="primary"
                        sx={{ fontFamily: 'monospace', fontWeight: 'bold' }} />
                    </TableCell>
                    <TableCell><Typography variant="body2">{m.motorista_nome || '—'}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2">{m.quantidade_entregas}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{fmtPeso(m.peso_total_kg)}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{fmt(m.valor_total_carga)}</Typography></TableCell>
                    <TableCell><Typography variant="body2" noWrap>{fmtData(m.data_saida)}</Typography></TableCell>
                    <TableCell><Typography variant="body2" noWrap>{fmtData(m.data_criacao)}</Typography></TableCell>
                    <TableCell><Chip label={stCfg.label} size="small" color={stCfg.color} /></TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => onAbrir(m)}>Abrir</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <NovoMapaDialog
        open={openNovo}
        onClose={() => setOpenNovo(false)}
        onSalvo={(novoMapa) => { setOpenNovo(false); onAbrir(novoMapa) }}
        axiosInstance={axiosInstance}
      />
    </Box>
  )
}

// ─── Componente Principal ───────────────────────────────────────────────────
export default function MapaCargaPage() {
  const { axiosInstance } = useAuth()
  const navigate = useNavigate()
  const [mapaAtivo, setMapaAtivo] = useState(null)

  if (mapaAtivo) {
    return (
      <DetalheMapaView
        mapa={mapaAtivo}
        onVoltar={() => setMapaAtivo(null)}
        axiosInstance={axiosInstance}
        navigate={navigate}
      />
    )
  }

  return (
    <ListaMapasView
      onAbrir={setMapaAtivo}
      axiosInstance={axiosInstance}
    />
  )
}
