import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Stack, CircularProgress, Alert, Paper, Chip, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, MenuItem, LinearProgress,
} from '@mui/material'
import {
  Refresh as RefreshIcon, Search as SearchIcon,
  Receipt as BoletoIcon, CheckCircle as PagoIcon,
  Schedule as PendenteIcon, Cancel as VencidoIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

const fmtDate = (d) => d ? new Date(d + (d.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('pt-BR') : '—'
const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_CORES = { pago: '#4CAF50', pendente: '#FF9800', vencido: '#F44336', cancelado: '#9E9E9E' }
const STATUS_LABELS = { pago: 'Pago', pendente: 'Pendente', vencido: 'Vencido', cancelado: 'Cancelado' }

const MESES = [
  {v:1,l:'Janeiro'},{v:2,l:'Fevereiro'},{v:3,l:'Março'},{v:4,l:'Abril'},
  {v:5,l:'Maio'},{v:6,l:'Junho'},{v:7,l:'Julho'},{v:8,l:'Agosto'},
  {v:9,l:'Setembro'},{v:10,l:'Outubro'},{v:11,l:'Novembro'},{v:12,l:'Dezembro'},
]

export default function BoletosPage() {
  const { axiosInstance } = useAuth()
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [boletos, setBoletos] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  const buscar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const params = { mes, ano }
      if (filtroStatus) params.status = filtroStatus
      const r = await axiosInstance.get('/boletos/', { params })
      setBoletos(Array.isArray(r.data) ? r.data : (r.data.results || []))
    } catch {
      setErro('Não foi possível carregar os boletos. Verifique se o módulo está configurado.')
      setBoletos([])
    } finally {
      setLoading(false)
    }
  }, [axiosInstance, mes, ano, filtroStatus])

  useEffect(() => { buscar() }, [buscar])

  const copiarLinhaDigitavel = (linha) => {
    if (linha) {
      navigator.clipboard.writeText(linha).then(() => alert('Linha digitável copiada!'))
    }
  }

  const boletosFiltrados = boletos.filter(b =>
    !busca || [
      b.cliente_nome, b.numero_documento, b.nosso_numero
    ].some(f => (f || '').toLowerCase().includes(busca.toLowerCase()))
  )

  const totalPorStatus = Object.keys(STATUS_LABELS).reduce((acc, s) => {
    acc[s] = boletos.filter(b => b.status === s).length
    return acc
  }, {})

  const totalValor = boletos.reduce((s, b) => s + Number(b.valor || 0), 0)
  const totalPago = boletos.filter(b => b.status === 'pago').reduce((s, b) => s + Number(b.valor || 0), 0)
  const totalPendente = boletos.filter(b => b.status === 'pendente').reduce((s, b) => s + Number(b.valor || 0), 0)

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <BoletoIcon sx={{ color: '#1565C0', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="bold">Boletos</Typography>
      </Stack>

      {/* Cards de resumo */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderLeft: '4px solid #1565C0' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Total</Typography>
              <Typography variant="h6" fontWeight="bold" color="#1565C0">{fmt(totalValor)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderLeft: `4px solid ${STATUS_CORES.pago}` }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Recebido</Typography>
              <Typography variant="h6" fontWeight="bold" color={STATUS_CORES.pago}>{fmt(totalPago)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderLeft: `4px solid ${STATUS_CORES.pendente}` }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">A Receber</Typography>
              <Typography variant="h6" fontWeight="bold" color={STATUS_CORES.pendente}>{fmt(totalPendente)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderLeft: `4px solid ${STATUS_CORES.vencido}` }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">Vencidos</Typography>
              <Typography variant="h6" fontWeight="bold" color={STATUS_CORES.vencido}>
                {boletos.filter(b => b.status === 'vencido').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField label="Mês" select size="small" value={mes} onChange={e => setMes(Number(e.target.value))} sx={{ minWidth: 130 }}>
            {MESES.map(m => <MenuItem key={m.v} value={m.v}>{m.l}</MenuItem>)}
          </TextField>
          <TextField label="Ano" type="number" size="small" value={ano}
            onChange={e => setAno(Number(e.target.value))} sx={{ width: 100 }} />
          <TextField label="Status" select size="small" value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </TextField>
          <TextField label="Buscar cliente / documento" size="small" value={busca}
            onChange={e => setBusca(e.target.value)} sx={{ flex: 1 }}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
          <Tooltip title="Atualizar">
            <IconButton onClick={buscar} color="primary"><RefreshIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 1 }} />}
      {erro && <Alert severity="info" sx={{ mb: 2 }}>{erro}</Alert>}

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#1565C0' }}>
              {['#', 'Cliente', 'Nosso Número', 'Vencimento', 'Valor', 'Status', 'Ações'].map(h => (
                <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {boletosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" py={3}>
                    {loading ? 'Carregando...' : 'Nenhum boleto encontrado para o período.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : boletosFiltrados.map((b, idx) => (
              <TableRow key={b.id || idx} hover>
                <TableCell>{b.id || idx + 1}</TableCell>
                <TableCell>{b.cliente_nome || b.sacado || '—'}</TableCell>
                <TableCell>{b.nosso_numero || b.numero_documento || '—'}</TableCell>
                <TableCell sx={{ color: b.status === 'vencido' ? '#F44336' : 'inherit' }}>
                  {fmtDate(b.data_vencimento)}
                </TableCell>
                <TableCell fontWeight="bold">{fmt(b.valor)}</TableCell>
                <TableCell>
                  <Chip label={STATUS_LABELS[b.status] || b.status}
                    size="small"
                    sx={{ bgcolor: STATUS_CORES[b.status] || '#9E9E9E', color: '#fff', fontWeight: 'bold' }} />
                </TableCell>
                <TableCell>
                  {b.linha_digitavel && (
                    <Tooltip title="Copiar linha digitável">
                      <IconButton size="small" onClick={() => copiarLinhaDigitavel(b.linha_digitavel)}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {b.url_boleto && (
                    <Tooltip title="Abrir boleto">
                      <IconButton size="small" component="a" href={b.url_boleto} target="_blank">
                        <BoletoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
