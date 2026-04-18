import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  MenuItem, Stack, CircularProgress, Alert, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Chip, IconButton, Tooltip, Divider,
} from '@mui/material'
import {
  Search as SearchIcon, Refresh as RefreshIcon,
  Person as PersonIcon, TrendingUp, MonetizationOn,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

const MESES = [
  {v:1,l:'Janeiro'},{v:2,l:'Fevereiro'},{v:3,l:'Março'},{v:4,l:'Abril'},
  {v:5,l:'Maio'},{v:6,l:'Junho'},{v:7,l:'Julho'},{v:8,l:'Agosto'},
  {v:9,l:'Setembro'},{v:10,l:'Outubro'},{v:11,l:'Novembro'},{v:12,l:'Dezembro'},
]

const hoje = new Date()
const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const MEDAIS = ['#FFD700', '#C0C0C0', '#CD7F32']
const RANK_LABELS = ['🥇 1°', '🥈 2°', '🥉 3°']

export default function RelatorioComissoesPage() {
  const { axiosInstance } = useAuth()
  const [dados, setDados] = useState(null)
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [filtroVendedor, setFiltroVendedor] = useState('')

  // Busca lista de vendedores para o filtro
  useEffect(() => {
    // axiosInstance já tem baseURL=/api, então aqui usamos apenas 'vendedores/' ou '/vendedores/'
    // O axios trata '/vendedores' como absoluto SE a baseURL não terminar com /
    // Para garantir, vamos usar o caminho relativo ao baseURL
    axiosInstance.get('vendedores/').then(r => {
      const d = r.data;
      setVendedores(Array.isArray(d) ? d : Array.isArray(d?.results) ? d.results : []);
    }).catch(() => {})
  }, [axiosInstance])

  const buscar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const params = { mes, ano }
      if (filtroVendedor) params.id_vendedor = filtroVendedor
      const r = await axiosInstance.get('relatorios/comissoes/', { params })
      setDados(r.data)
    } catch (e) {
      setErro('Erro ao carregar comissões: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }, [mes, ano, filtroVendedor, axiosInstance])

  useEffect(() => { buscar() }, [buscar])

  const lista = dados?.vendedores || []
  const totais = dados?.totais

  // valor máximo para barra de progresso
  const maxVendas = lista.length > 0
    ? Math.max(...lista.map(v => Number(v.total_vendas)))
    : 1

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary">
            Comissões de Vendedores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Totais de vendas e comissões calculadas por período
          </Typography>
        </Box>
        <Tooltip title="Atualizar">
          <IconButton onClick={buscar} disabled={loading}><RefreshIcon /></IconButton>
        </Tooltip>
      </Stack>

      {/* Filtros */}
      <Card sx={{ mb: 3 }} elevation={1}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Filtros</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              select size="small" label="Mês" value={mes}
              onChange={(e) => setMes(e.target.value)} sx={{ minWidth: 140 }}
            >
              {MESES.map(m => <MenuItem key={m.v} value={m.v}>{m.l}</MenuItem>)}
            </TextField>
            <TextField
              size="small" label="Ano" type="number" value={ano}
              onChange={(e) => setAno(e.target.value)} sx={{ width: 100 }}
            />
            <TextField
              select size="small" label="Vendedor" value={filtroVendedor}
              onChange={(e) => setFiltroVendedor(e.target.value)} sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Todos os vendedores</MenuItem>
              {vendedores.map(v => (
                <MenuItem key={v.id_vendedor} value={v.id_vendedor}>{v.nome}</MenuItem>
              ))}
            </TextField>
            <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={buscar} disabled={loading}>
              Buscar
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      {loading && (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      )}

      {!loading && dados && (
        <>
          {/* Cards totais */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4}>
              <Card elevation={2} sx={{ borderLeft: '4px solid #1565c0' }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <TrendingUp sx={{ color: '#1565c0' }} fontSize="small" />
                    <Typography variant="caption" color="text.secondary">Total de Vendas</Typography>
                  </Stack>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {fmt(totais?.total_vendas)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Card elevation={2} sx={{ borderLeft: '4px solid #2e7d32' }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <MonetizationOn sx={{ color: '#2e7d32' }} fontSize="small" />
                    <Typography variant="caption" color="text.secondary">Total de Comissões</Typography>
                  </Stack>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {fmt(totais?.total_comissoes)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Card elevation={2} sx={{ borderLeft: '4px solid #e65100' }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <PersonIcon sx={{ color: '#e65100' }} fontSize="small" />
                    <Typography variant="caption" color="text.secondary">Vendedores Ativos</Typography>
                  </Stack>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#e65100' }}>
                    {totais?.qtd_vendedores || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {lista.length === 0 ? (
            <Alert severity="info">Nenhuma venda encontrada para o período selecionado.</Alert>
          ) : (
            <>
              {/* Ranking visual */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {lista.slice(0, 3).map((v, i) => (
                  <Grid item xs={12} sm={4} key={v.id_vendedor}>
                    <Card elevation={3} sx={{ borderTop: `4px solid ${MEDAIS[i] || '#9e9e9e'}` }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                          <Typography variant="h6">{RANK_LABELS[i]}</Typography>
                          <Typography variant="subtitle1" fontWeight={700}>{v.nome_reduzido}</Typography>
                        </Stack>
                        <Typography variant="h5" fontWeight={800} color="primary">
                          {fmt(v.total_vendas)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {v.qtd_total_vendas} venda{v.qtd_total_vendas !== 1 ? 's' : ''} · Ticket: {fmt(v.ticket_medio)}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Comissão ({v.percentual_comissao}%)
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={700} color="success.main">
                            {fmt(v.comissao_calculada)}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Tabela completa */}
              <TableContainer component={Paper} elevation={2}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      {['#', 'Vendedor', 'Qtd. Vendas', 'Total Vendas', 'Ticket Médio', '% Comissão', 'Comissão Calculada', 'Participação'].map(h => (
                        <TableCell key={h} sx={{ color: '#fff', fontWeight: 600, py: 1, whiteSpace: 'nowrap' }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lista.map((v, i) => {
                      const participacao = maxVendas > 0
                        ? (Number(v.total_vendas) / Number(totais?.total_vendas || 1)) * 100
                        : 0
                      const barraWidth = maxVendas > 0
                        ? (Number(v.total_vendas) / maxVendas) * 100
                        : 0

                      return (
                        <TableRow key={v.id_vendedor} hover>
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                              {i < 3 ? RANK_LABELS[i] : `${i + 1}°`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <PersonIcon fontSize="small" sx={{ color: MEDAIS[i] || '#9e9e9e' }} />
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{v.nome}</Typography>
                                {v.qtd_vendas_secundario > 0 && (
                                  <Typography variant="caption" color="text.secondary">
                                    +{v.qtd_vendas_secundario} como 2° vendedor
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={v.qtd_total_vendas}
                              size="small"
                              color={v.qtd_total_vendas > 0 ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{fmt(v.total_vendas)}</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={barraWidth}
                              sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: MEDAIS[i] || '#90caf9' } }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{fmt(v.ticket_medio)}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${v.percentual_comissao}%`}
                              size="small"
                              color={Number(v.percentual_comissao) > 0 ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700} color="success.main">
                              {fmt(v.comissao_calculada)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <LinearProgress
                                variant="determinate"
                                value={participacao}
                                sx={{ width: 60, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption">{participacao.toFixed(1)}%</Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      )}
    </Box>
  )
}
