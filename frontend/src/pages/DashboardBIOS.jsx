import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box, Grid, Card, CardContent, Typography, Paper, CircularProgress,
  Alert, Chip, IconButton, Tooltip, Divider, Button, Stack, Avatar,
  LinearProgress, TextField, MenuItem, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, useTheme, useMediaQuery
} from '@mui/material'
import {
  TrendingUp, TrendingDown, TrendingFlat, Refresh, AttachMoney,
  Build, People, CheckCircle, AccessTime, Assignment,
  Cancel, HourglassEmpty, PlayArrow, DonutSmall, CalendarMonth,
  Receipt, Person, ShoppingCart, Handyman, BarChart as BarChartIcon
} from '@mui/icons-material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
  AreaChart, Area
} from 'recharts'
import { useAuth } from '../context/AuthContext'

// ── Helpers ──
const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

const fmtN = (v) =>
  new Intl.NumberFormat('pt-BR').format(v ?? 0)

const pct = (v) => {
  const n = Number(v ?? 0)
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`
}

const TrendIcon = ({ value, size = 18 }) => {
  if (value > 2) return <TrendingUp sx={{ color: 'success.main', fontSize: size }} />
  if (value < -2) return <TrendingDown sx={{ color: 'error.main', fontSize: size }} />
  return <TrendingFlat sx={{ color: 'warning.main', fontSize: size }} />
}

const CORES_STATUS = {
  'Aberta': '#42a5f5',
  'Em Andamento': '#ff9800',
  'Aguardando Peça': '#ab47bc',
  'Finalizada': '#66bb6a',
  'Cancelada': '#ef5350',
}

const CORES_GRAFICO = ['#1976d2', '#43a047', '#e53935', '#ff9800', '#ab47bc', '#00bcd4', '#795548', '#607d8b', '#f06292', '#4db6ac']

const PERIODOS = [
  { value: 7, label: 'Últimos 7 dias' },
  { value: 15, label: 'Últimos 15 dias' },
  { value: 30, label: 'Últimos 30 dias' },
  { value: 60, label: 'Últimos 60 dias' },
  { value: 90, label: 'Últimos 90 dias' },
  { value: 180, label: 'Últimos 6 meses' },
  { value: 365, label: 'Último ano' },
  { value: 0, label: 'Personalizado' },
]

// ── KPI Card ──
const KPICard = ({ titulo, valor, subtitulo, variacao, cor, icone, loading }) => (
  <Card sx={{ border: '1px solid', borderColor: `${cor}.200`, bgcolor: `${cor}.50`, height: '100%' }}>
    <CardContent sx={{ pb: '12px !important' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>{titulo}</Typography>
          {loading ? (
            <Box mt={1}><LinearProgress sx={{ borderRadius: 1 }} /></Box>
          ) : (
            <Typography variant="h5" fontWeight={700} color={`${cor}.main`} mt={0.5}>{valor}</Typography>
          )}
          {subtitulo && (
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">{subtitulo}</Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${cor}.100`, color: `${cor}.main`, width: 44, height: 44 }}>{icone}</Avatar>
      </Box>
      {variacao !== undefined && !loading && (
        <Box display="flex" alignItems="center" gap={0.5} mt={1}>
          <TrendIcon value={variacao} />
          <Typography variant="caption" color={variacao >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
            {pct(variacao)} vs período anterior
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
)

// ── Tooltip customizado recharts ──
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null
  return (
    <Paper sx={{ p: 1.5, border: '1px solid #e0e0e0' }}>
      <Typography variant="caption" fontWeight={600}>{label}</Typography>
      {payload.map((p, i) => (
        <Typography key={i} variant="body2" sx={{ color: p.color }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </Typography>
      ))}
    </Paper>
  )
}

// ════════════════════════════════════════════════════
// Componente Principal
// ════════════════════════════════════════════════════
export default function DashboardBIOS() {
  const { axiosInstance } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [data, setData] = useState(null)

  // Filtros
  const [periodo, setPeriodo] = useState(365);
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro('')
    try {
      const params = {}
      if (periodo === 0 && dataInicio && dataFim) {
        params.data_inicio = dataInicio
        params.data_fim = dataFim
      } else {
        params.periodo = periodo
      }
      const r = await axiosInstance.get('/bi/ordem-servico/', { params })
      setData(r.data)
    } catch (e) {
      setErro(e?.response?.data?.detail || e.message || 'Erro ao carregar dashboard')
    } finally {
      setLoading(false)
    }
  }, [axiosInstance, periodo, dataInicio, dataFim])

  useEffect(() => { carregar() }, [carregar])

  const resumo = data?.resumo || {}
  const comparativo = data?.comparativo || {}

  // ── Dados para gráficos ──
  const dadosStatus = useMemo(() => {
    if (!data?.por_status) return []
    return data.por_status.map(s => ({
      ...s,
      cor: CORES_STATUS[s.status] || s.cor || '#607d8b',
    }))
  }, [data])

  const dadosMensal = data?.evolucao_mensal || []
  const dadosDiaSemana = data?.por_dia_semana || []
  const rankingTecnicos = data?.ranking_tecnicos || []
  const topClientes = data?.top_clientes || []
  const topServicos = data?.top_servicos || []
  const topProdutos = data?.top_produtos || []

  return (
    <Box sx={{ p: { xs: 0, sm: 1 }, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary.main">
            <Assignment sx={{ verticalAlign: 'middle', mr: 1 }} />
            Dashboard BI — Ordem de Serviço
          </Typography>
          {data?.periodo && (
            <Typography variant="caption" color="text.secondary">
              {new Date(data.periodo.data_inicio).toLocaleDateString('pt-BR')} — {new Date(data.periodo.data_fim).toLocaleDateString('pt-BR')} ({data.periodo.dias} dias)
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <TextField
            select size="small" value={periodo} onChange={(e) => setPeriodo(Number(e.target.value))}
            sx={{ minWidth: 160 }}
          >
            {PERIODOS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
          </TextField>
          {periodo === 0 && (
            <>
              <TextField type="date" size="small" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} label="Início" InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
              <TextField type="date" size="small" value={dataFim} onChange={(e) => setDataFim(e.target.value)} label="Fim" InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            </>
          )}
          <Tooltip title="Atualizar">
            <IconButton onClick={carregar} color="primary"><Refresh /></IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      {/* ═══ KPI CARDS ═══ */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard titulo="Total de OS" valor={fmtN(resumo.total_os)} variacao={comparativo.variacao_qtd}
            cor="primary" icone={<Assignment />} loading={loading}
            subtitulo={`Anterior: ${fmtN(comparativo.total_os_anterior)}`} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard titulo="Faturamento" valor={fmtBRL(resumo.total_faturamento)} variacao={comparativo.variacao_faturamento}
            cor="success" icone={<AttachMoney />} loading={loading}
            subtitulo={`Ticket médio: ${fmtBRL(resumo.ticket_medio)}`} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard titulo="Finalizadas" valor={fmtN(resumo.finalizadas)}
            cor="success" icone={<CheckCircle />} loading={loading}
            subtitulo={`Taxa: ${resumo.taxa_finalizacao}%`} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard titulo="Em Andamento" valor={fmtN((resumo.abertas || 0) + (resumo.em_andamento || 0) + (resumo.aguardando || 0))}
            cor="warning" icone={<PlayArrow />} loading={loading}
            subtitulo={`Abertas: ${fmtN(resumo.abertas)} | Aguardando: ${fmtN(resumo.aguardando)}`} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard titulo="Tempo Médio" valor={`${resumo.tempo_medio_dias || 0} dias`}
            cor="info" icone={<AccessTime />} loading={loading}
            subtitulo={`Min: ${resumo.tempo_min_dias}d | Máx: ${resumo.tempo_max_dias}d`} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard titulo="NFS-e Emitidas" valor={fmtN(resumo.nfse_emitidas)}
            cor="secondary" icone={<Receipt />} loading={loading}
            subtitulo={fmtBRL(resumo.nfse_valor)} />
        </Grid>
      </Grid>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {!loading && data && (
        <>
          {/* ═══ GRÁFICOS LINHA 1: Status + Evolução Mensal ═══ */}
          <Grid container spacing={2} mb={3}>
            {/* PieChart por Status */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    <DonutSmall sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 20 }} />
                    OS por Status
                  </Typography>
                  {dadosStatus.length > 0 ? (
                    <Box sx={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={dadosStatus} dataKey="qtd" nameKey="status" cx="50%" cy="50%"
                            outerRadius={100} innerRadius={50} paddingAngle={2}
                            label={({ status, qtd }) => `${status}: ${qtd}`}
                            labelLine={false}
                          >
                            {dadosStatus.map((d, i) => (
                              <Cell key={i} fill={d.cor} />
                            ))}
                          </Pie>
                          <ReTooltip formatter={(v) => fmtN(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={8}>Sem dados</Typography>
                  )}
                  {/* Legenda */}
                  <Stack direction="row" flexWrap="wrap" gap={1} mt={1} justifyContent="center">
                    {dadosStatus.map((d, i) => (
                      <Chip key={i} size="small"
                        label={`${d.status}: ${d.qtd} (${fmtBRL(d.valor)})`}
                        sx={{ bgcolor: d.cor, color: '#fff', fontWeight: 600, fontSize: 11 }}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Evolução Mensal */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    <CalendarMonth sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 20 }} />
                    Evolução Mensal
                  </Typography>
                  {dadosMensal.length > 0 ? (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dadosMensal}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes_nome" fontSize={12} />
                          <YAxis yAxisId="left" fontSize={12} />
                          <YAxis yAxisId="right" orientation="right" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                          <ReTooltip content={<CustomTooltip formatter={fmtBRL} />} />
                          <Legend />
                          <Area yAxisId="left" type="monotone" dataKey="qtd" name="Quantidade" stroke="#1976d2" fill="#1976d233" strokeWidth={2} />
                          <Area yAxisId="right" type="monotone" dataKey="valor" name="Faturamento" stroke="#43a047" fill="#43a04733" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={8}>Sem dados</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ═══ GRÁFICOS LINHA 2: Dia da Semana + Produtos vs Serviços ═══ */}
          <Grid container spacing={2} mb={3}>
            {/* OS por Dia da Semana */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    <BarChartIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 20 }} />
                    OS por Dia da Semana
                  </Typography>
                  {dadosDiaSemana.length > 0 ? (
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dadosDiaSemana}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="dia" fontSize={11} />
                          <YAxis fontSize={12} />
                          <ReTooltip />
                          <Bar dataKey="qtd" name="Quantidade" fill="#1976d2" radius={[4, 4, 0, 0]}>
                            {dadosDiaSemana.map((_, i) => (
                              <Cell key={i} fill={CORES_GRAFICO[i % CORES_GRAFICO.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={8}>Sem dados</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Composição Produtos x Serviços */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    <AttachMoney sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 20 }} />
                    Composição do Faturamento
                  </Typography>
                  {(resumo.total_produtos > 0 || resumo.total_servicos > 0) ? (
                    <>
                      <Box sx={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Produtos', value: resumo.total_produtos || 0 },
                                { name: 'Serviços', value: resumo.total_servicos || 0 },
                                ...(resumo.total_desconto > 0 ? [{ name: 'Descontos', value: resumo.total_desconto }] : []),
                              ]}
                              dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={40}
                              label={({ name, value }) => `${name}: ${fmtBRL(value)}`}
                              labelLine={false}
                            >
                              <Cell fill="#1976d2" />
                              <Cell fill="#43a047" />
                              {resumo.total_desconto > 0 && <Cell fill="#ef5350" />}
                            </Pie>
                            <ReTooltip formatter={(v) => fmtBRL(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                      <Stack direction="row" justifyContent="center" gap={2} mt={1}>
                        <Typography variant="body2"><Box component="span" sx={{ color: '#1976d2', fontWeight: 700 }}>● Produtos:</Box> {fmtBRL(resumo.total_produtos)}</Typography>
                        <Typography variant="body2"><Box component="span" sx={{ color: '#43a047', fontWeight: 700 }}>● Serviços:</Box> {fmtBRL(resumo.total_servicos)}</Typography>
                      </Stack>
                    </>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={8}>Sem dados</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Evolução Mensal Qtd - Linha */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    <TrendingUp sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 20 }} />
                    Produtos vs Serviços (Mensal)
                  </Typography>
                  {dadosMensal.length > 0 ? (
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dadosMensal}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes_nome" fontSize={11} />
                          <YAxis fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                          <ReTooltip formatter={(v) => fmtBRL(v)} />
                          <Legend />
                          <Line type="monotone" dataKey="produtos" name="Produtos" stroke="#1976d2" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="servicos" name="Serviços" stroke="#43a047" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={8}>Sem dados</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ═══ RANKING TÉCNICOS ═══ */}
          {rankingTecnicos.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>
                  <Handyman sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 20 }} />
                  Ranking de Técnicos
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.100' } }}>
                        <TableCell>#</TableCell>
                        <TableCell>Técnico</TableCell>
                        <TableCell align="center">OS</TableCell>
                        <TableCell align="right">Faturamento</TableCell>
                        <TableCell align="right">Serviços</TableCell>
                        <TableCell align="right">Ticket Médio</TableCell>
                        <TableCell align="center">Finalizadas</TableCell>
                        <TableCell align="center">Taxa</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rankingTecnicos.map((t, i) => (
                        <TableRow key={t.id_tecnico} hover>
                          <TableCell>
                            <Chip size="small" label={i + 1}
                              color={i === 0 ? 'warning' : i === 1 ? 'default' : i === 2 ? 'info' : 'default'}
                              sx={{ fontWeight: 700, minWidth: 28 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t.nome}</TableCell>
                          <TableCell align="center">{t.qtd}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>{fmtBRL(t.valor)}</TableCell>
                          <TableCell align="right">{fmtBRL(t.servicos)}</TableCell>
                          <TableCell align="right">{fmtBRL(t.ticket_medio)}</TableCell>
                          <TableCell align="center">{t.finalizadas}</TableCell>
                          <TableCell align="center">
                            <Chip size="small" label={`${t.taxa_finalizacao}%`}
                              color={t.taxa_finalizacao >= 80 ? 'success' : t.taxa_finalizacao >= 50 ? 'warning' : 'error'}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* ═══ TOP CLIENTES + TOP SERVIÇOS ═══ */}
          <Grid container spacing={2} mb={3}>
            {/* Top Clientes */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    <People sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 20 }} />
                    Top Clientes
                  </Typography>
                  {topClientes.length > 0 ? (
                    <TableContainer sx={{ maxHeight: 400 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.100' } }}>
                            <TableCell>#</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Cidade</TableCell>
                            <TableCell align="center">OS</TableCell>
                            <TableCell align="right">Valor</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topClientes.map((c, i) => (
                            <TableRow key={c.id_cliente} hover>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.nome}
                              </TableCell>
                              <TableCell>{c.cidade}</TableCell>
                              <TableCell align="center">{c.qtd}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>{fmtBRL(c.valor)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={4}>Sem dados</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Top Serviços */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    <Build sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 20 }} />
                    Serviços Mais Realizados
                  </Typography>
                  {topServicos.length > 0 ? (
                    <TableContainer sx={{ maxHeight: 400 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.100' } }}>
                            <TableCell>#</TableCell>
                            <TableCell>Serviço</TableCell>
                            <TableCell align="center">Qtd</TableCell>
                            <TableCell align="right">Valor</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topServicos.map((s, i) => (
                            <TableRow key={i} hover>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 600, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.descricao}
                              </TableCell>
                              <TableCell align="center">{fmtN(s.qtd_total)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>{fmtBRL(s.valor)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={4}>Sem dados</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ═══ TOP PRODUTOS ═══ */}
          {topProdutos.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>
                  <ShoppingCart sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 20 }} />
                  Produtos Mais Utilizados
                </Typography>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.100' } }}>
                        <TableCell>#</TableCell>
                        <TableCell>Código</TableCell>
                        <TableCell>Produto</TableCell>
                        <TableCell align="center">Vezes Usado</TableCell>
                        <TableCell align="center">Qtd Total</TableCell>
                        <TableCell align="right">Valor Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topProdutos.map((p, i) => (
                        <TableRow key={p.id_produto} hover>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell><Chip size="small" label={p.codigo || '-'} variant="outlined" /></TableCell>
                          <TableCell sx={{ fontWeight: 600, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.nome}
                          </TableCell>
                          <TableCell align="center">{p.qtd}</TableCell>
                          <TableCell align="center">{fmtN(p.qtd_total)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>{fmtBRL(p.valor)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  )
}
