import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Grid, Card, CardContent, Typography, Paper, CircularProgress,
  Alert, Chip, IconButton, Tooltip, Divider, Button, Stack, Avatar,
  LinearProgress
} from '@mui/material'
import {
  TrendingUp, TrendingDown, TrendingFlat, Refresh, AttachMoney,
  PrecisionManufacturing, People, Warning, CheckCircle, Business,
  ShoppingCart, BarChart as BarChartIcon, PersonOff, Inventory,
  ArrowForward, VerifiedUser
} from '@mui/icons-material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
  AreaChart, Area
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

// ────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────
// KPI Card
// ────────────────────────────────────────────────────
const KPICard = ({ titulo, valor, subtitulo, variacao, cor, icone, onClick, loading }) => (
  <Card
    sx={{
      border: '1px solid', borderColor: `${cor}.200`,
      bgcolor: `${cor}.50`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow .2s',
      '&:hover': onClick ? { boxShadow: 4 } : {}
    }}
    onClick={onClick}
  >
    <CardContent sx={{ pb: '12px !important' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {titulo}
          </Typography>
          {loading ? (
            <Box mt={1}><LinearProgress sx={{ borderRadius: 1 }} /></Box>
          ) : (
            <Typography variant="h5" fontWeight={700} color={`${cor}.main`} mt={0.5}>
              {valor}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            {subtitulo}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: `${cor}.100`, color: `${cor}.main`, width: 44, height: 44 }}>
          {icone}
        </Avatar>
      </Box>
      {variacao !== undefined && !loading && (
        <Box display="flex" alignItems="center" gap={0.5} mt={1}>
          <TrendIcon value={variacao} />
          <Typography variant="caption" color={variacao >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
            {pct(variacao)} vs mês anterior
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
)

// ────────────────────────────────────────────────────
// Cores por status
// ────────────────────────────────────────────────────
const CORES_OP = {
  ABERTA: '#42a5f5',
  EM_PRODUCAO: '#ff9800',
  FINALIZADA: '#66bb6a',
  CANCELADA: '#ef5350'
}

const CORES_CHURN = ['#66bb6a', '#ff9800', '#ef5350']
const LABELS_CHURN = ['Baixo Risco', 'Médio Risco', 'Alto Risco']

// ────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────
export default function DashboardBI() {
  const { axiosInstance } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [erros, setErros] = useState({})

  // Dados das APIs
  const [graficos, setGraficos] = useState(null)
  const [opsStatus, setOpsStatus] = useState([])
  const [totalFuncionarios, setTotalFuncionarios] = useState(0)
  const [ocorrenciasPendentes, setOcorrenciasPendentes] = useState(0)
  const [episAlerta, setEpisAlerta] = useState(0)
  const [crmDash, setCrmDash] = useState(null)
  const [churnDash, setChurnDash] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErros({})

    const fetchSafe = async (key, fn) => {
      try { return await fn() }
      catch (e) {
        setErros(prev => ({ ...prev, [key]: e?.response?.data?.error || e.message }))
        return null
      }
    }

    const [grafResult, opsResult, funcResult, ocorrResult, epiResult, crmResult, churnResult] =
      await Promise.all([
        fetchSafe('graficos', () => axiosInstance.get('/graficos/comparativos/')),
        fetchSafe('pcp', () => axiosInstance.get('/pcp/ordens/')),
        fetchSafe('rh_func', () => axiosInstance.get('/rh/funcionarios/?page_size=1')),
        fetchSafe('rh_ocorr', () => axiosInstance.get('/rh/ocorrencias/?status=PENDENTE&page_size=1')),
        fetchSafe('rh_epi', () => axiosInstance.get('/rh/epis/alertas_estoque/')),
        fetchSafe('crm', () => axiosInstance.get('/crm/leads/dashboard/')),
        fetchSafe('churn', () => axiosInstance.get('/churn/dashboard/')),
      ])

    if (grafResult) setGraficos(grafResult.data)

    if (opsResult) {
      const ordens = Array.isArray(opsResult.data?.results)
        ? opsResult.data.results
        : Array.isArray(opsResult.data) ? opsResult.data : []
      const contagem = { ABERTA: 0, EM_PRODUCAO: 0, FINALIZADA: 0, CANCELADA: 0 }
      ordens.forEach(op => { if (op.status in contagem) contagem[op.status]++ })
      setOpsStatus(
        Object.entries(contagem).map(([st, qt]) => ({ status: st, quantidade: qt }))
      )
    }

    if (funcResult) {
      const d = funcResult.data
      setTotalFuncionarios(d?.count ?? (Array.isArray(d) ? d.length : 0))
    }

    if (ocorrResult) {
      const d = ocorrResult.data
      setOcorrenciasPendentes(d?.count ?? (Array.isArray(d) ? d.length : 0))
    }

    if (epiResult) {
      const d = epiResult.data
      setEpisAlerta(Array.isArray(d) ? d.length : 0)
    }

    if (crmResult) setCrmDash(crmResult.data)
    if (churnResult) setChurnDash(churnResult.data)

    setLoading(false)
  }, [axiosInstance])

  useEffect(() => { carregar() }, [carregar])

  // ── Dados derivados ──────────────────────────────
  const vendas = graficos?.vendas
  const contasReceber = graficos?.contas_receber
  const contasPagar = graficos?.contas_pagar

  const saldoLiquido =
    (contasReceber?.valor_pago ?? 0) - (contasPagar?.valor_pago ?? 0)

  const inadimplencia = contasReceber?.valor_total > 0
    ? (contasReceber.valor_pendente / contasReceber.valor_total) * 100
    : 0

  // Dados para gráfico vendas vs compras
  const dadosVendasCompras = graficos ? [
    {
      periodo: graficos.periodos?.mes_anterior?.label ?? 'Mês Ant.',
      vendas: graficos.vendas?.mes_anterior?.total ?? 0,
      compras: graficos.compras?.mes_anterior?.total ?? 0,
    },
    {
      periodo: graficos.periodos?.mes_atual?.label ?? 'Mês Atual',
      vendas: graficos.vendas?.mes_atual?.total ?? 0,
      compras: graficos.compras?.mes_atual?.total ?? 0,
    },
    {
      periodo: graficos.periodos?.ano_passado?.label ?? 'Ano Ant.',
      vendas: graficos.vendas?.ano_passado?.total ?? 0,
      compras: graficos.compras?.ano_passado?.total ?? 0,
    },
  ] : []

  // Dados para gráfico financeiro (receber vs pagar)
  const dadosFinanceiro = contasReceber ? [
    { nome: 'Recebido', valor: contasReceber.valor_pago },
    { nome: 'A Receber', valor: contasReceber.valor_pendente },
    { nome: 'Pago', valor: contasPagar?.valor_pago ?? 0 },
    { nome: 'A Pagar', valor: contasPagar?.valor_pendente ?? 0 },
  ] : []

  // Dados churn
  const churnTotal = churnDash?.total_clientes ?? 0
  const dadosChurn = churnTotal > 0 ? [
    { name: 'Baixo Risco', value: churnDash?.baixo_risco ?? 0 },
    { name: 'Médio Risco', value: churnDash?.medio_risco ?? 0 },
    { name: 'Alto Risco', value: churnDash?.alto_risco ?? 0 },
  ] : []

  // Dados funil CRM
  const dadosFunil = crmDash?.por_etapa ?? []

  const totalOPs = opsStatus.reduce((s, o) => s + o.quantidade, 0)
  const opsEmProducao = opsStatus.find(o => o.status === 'EM_PRODUCAO')?.quantidade ?? 0

  // ── Render ─────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>

      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary.main">
            Dashboard Executivo — BI
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visão consolidada: Financeiro · PCP · RH · CRM · Churn
          </Typography>
        </Box>
        <Tooltip title="Atualizar dados">
          <IconButton onClick={carregar} disabled={loading} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {Object.keys(erros).length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Alguns módulos não carregaram: {Object.keys(erros).join(', ')}
        </Alert>
      )}

      {/* ── LINHA 1: KPIs principais ── */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            titulo="Faturamento do Mês"
            valor={fmtBRL(vendas?.mes_atual?.total)}
            subtitulo={`${fmtN(vendas?.mes_atual?.quantidade)} vendas realizadas`}
            variacao={vendas?.variacoes?.vs_mes_anterior}
            cor="primary"
            icone={<TrendingUp />}
            loading={loading}
            onClick={() => navigate('/financeiro')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            titulo="Saldo Líquido (Realizado)"
            valor={fmtBRL(saldoLiquido)}
            subtitulo={`Inadimplência: ${inadimplencia.toFixed(1)}%`}
            cor={saldoLiquido >= 0 ? 'success' : 'error'}
            icone={<AttachMoney />}
            loading={loading}
            onClick={() => navigate('/financeiro')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            titulo="Ordens de Produção"
            valor={fmtN(totalOPs)}
            subtitulo={`${opsEmProducao} em produção agora`}
            cor="warning"
            icone={<PrecisionManufacturing />}
            loading={loading}
            onClick={() => navigate('/producao')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            titulo="Funcionários"
            valor={fmtN(totalFuncionarios)}
            subtitulo={`${ocorrenciasPendentes} ocorrência${ocorrenciasPendentes !== 1 ? 's' : ''} pendente${ocorrenciasPendentes !== 1 ? 's' : ''}`}
            cor={ocorrenciasPendentes > 0 ? 'warning' : 'success'}
            icone={<People />}
            loading={loading}
            onClick={() => navigate('/rh')}
          />
        </Grid>
      </Grid>

      {/* ── LINHA 2: KPIs secundários ── */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            titulo="A Receber (Pendente)"
            valor={fmtBRL(contasReceber?.valor_pendente)}
            subtitulo={`${fmtN(contasReceber?.qtd_pendente)} títulos em aberto`}
            cor="info"
            icone={<ShoppingCart />}
            loading={loading}
            onClick={() => navigate('/financeiro')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            titulo="A Pagar (Pendente)"
            valor={fmtBRL(contasPagar?.valor_pendente)}
            subtitulo={`${fmtN(contasPagar?.qtd_pendente)} títulos a vencer`}
            cor="error"
            icone={<Business />}
            loading={loading}
            onClick={() => navigate('/financeiro')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            titulo="Alertas EPI"
            valor={fmtN(episAlerta)}
            subtitulo="EPIs abaixo do estoque mínimo"
            cor={episAlerta > 0 ? 'error' : 'success'}
            icone={<VerifiedUser />}
            loading={loading}
            onClick={() => navigate('/rh')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            titulo="Leads no CRM"
            valor={fmtN(crmDash?.total_leads ?? 0)}
            subtitulo={`${fmtN(crmDash?.leads_novos_mes ?? 0)} novos este mês`}
            cor="secondary"
            icone={<PersonOff />}
            loading={loading}
            onClick={() => navigate('/crm')}
          />
        </Grid>
      </Grid>

      {/* ── LINHA 3: Gráficos principais ── */}
      <Grid container spacing={3} mb={3}>

        {/* Vendas x Compras */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: 340 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>Vendas vs Compras</Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/graficos')}>
                Ver detalhes
              </Button>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={240}>
                <CircularProgress />
              </Box>
            ) : dadosVendasCompras.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={240}>
                <Typography color="text.secondary">Sem dados disponíveis</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dadosVendasCompras}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <ReTooltip formatter={(v) => fmtBRL(v)} />
                  <Legend />
                  <Bar dataKey="vendas" name="Vendas" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="compras" name="Compras" fill="#43a047" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Saúde da Carteira (Churn) */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: 340 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>Saúde da Carteira</Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/churn')}>
                Análise Churn
              </Button>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={240}>
                <CircularProgress />
              </Box>
            ) : dadosChurn.length === 0 || dadosChurn.every(d => d.value === 0) ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={240}>
                <Typography color="text.secondary">Sem dados de churn</Typography>
              </Box>
            ) : (
              <Box>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dadosChurn}
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dadosChurn.map((_, i) => (
                        <Cell key={i} fill={CORES_CHURN[i]} />
                      ))}
                    </Pie>
                    <ReTooltip formatter={(v, n) => [fmtN(v), n]} />
                  </PieChart>
                </ResponsiveContainer>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" mt={1}>
                  {dadosChurn.map((d, i) => (
                    <Chip
                      key={i}
                      label={`${LABELS_CHURN[i]}: ${fmtN(d.value)}`}
                      size="small"
                      sx={{ bgcolor: CORES_CHURN[i], color: '#fff', fontSize: 11 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── LINHA 4: PCP + Financeiro + CRM ── */}
      <Grid container spacing={3} mb={3}>

        {/* Status das OPs */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>OPs por Status (PCP)</Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/producao')}>
                Ver OPs
              </Button>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={220}>
                <CircularProgress />
              </Box>
            ) : totalOPs === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={220}>
                <Typography color="text.secondary">Nenhuma OP cadastrada</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={opsStatus} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} width={95} />
                  <ReTooltip />
                  <Bar dataKey="quantidade" name="Qtd" radius={[0, 4, 4, 0]}>
                    {opsStatus.map((o, i) => (
                      <Cell key={i} fill={CORES_OP[o.status] ?? '#9e9e9e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Contas Receber x Pagar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>Posição Financeira</Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/financeiro')}>
                Financeiro
              </Button>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={220}>
                <CircularProgress />
              </Box>
            ) : dadosFinanceiro.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={220}>
                <Typography color="text.secondary">Sem dados financeiros</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dadosFinanceiro}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <ReTooltip formatter={v => fmtBRL(v)} />
                  <Bar dataKey="valor" name="Valor" radius={[4, 4, 0, 0]}>
                    <Cell fill="#1976d2" />
                    <Cell fill="#90caf9" />
                    <Cell fill="#ef5350" />
                    <Cell fill="#ffcdd2" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Funil CRM */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>Funil CRM</Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/crm')}>
                Ver CRM
              </Button>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={220}>
                <CircularProgress />
              </Box>
            ) : dadosFunil.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={220}>
                <Typography color="text.secondary">Nenhum lead cadastrado</Typography>
              </Box>
            ) : (
              <Box sx={{ overflowY: 'auto', maxHeight: 220 }}>
                {dadosFunil.map((etapa, i) => {
                  const maxLeads = Math.max(...dadosFunil.map(e => e.quantidade ?? e.total ?? 0), 1)
                  const qtd = etapa.quantidade ?? etapa.total ?? 0
                  return (
                    <Box key={i} mb={1.2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" fontWeight={500} noWrap sx={{ maxWidth: 150 }}>
                          {etapa.etapa__nome ?? etapa.nome ?? etapa.etapa}
                        </Typography>
                        <Typography variant="caption" fontWeight={700}>
                          {fmtN(qtd)}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(qtd / maxLeads) * 100}
                        sx={{ borderRadius: 2, height: 6, bgcolor: 'grey.200', mt: 0.3 }}
                      />
                    </Box>
                  )
                })}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── LINHA 5: Resumo textual de alertas ── */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>Alertas e Ações Recomendadas</Typography>
        <Grid container spacing={2}>
          {episAlerta > 0 && (
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" gap={1} alignItems="center">
                <Warning color="error" fontSize="small" />
                <Typography variant="body2">
                  <strong>{episAlerta} EPI(s)</strong> abaixo do estoque mínimo — revisar almoxarifado
                </Typography>
              </Box>
            </Grid>
          )}
          {ocorrenciasPendentes > 0 && (
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" gap={1} alignItems="center">
                <Warning color="warning" fontSize="small" />
                <Typography variant="body2">
                  <strong>{ocorrenciasPendentes} ocorrência(s)</strong> de RH aguardando aprovação
                </Typography>
              </Box>
            </Grid>
          )}
          {inadimplencia > 10 && (
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" gap={1} alignItems="center">
                <Warning color="warning" fontSize="small" />
                <Typography variant="body2">
                  Inadimplência de <strong>{inadimplencia.toFixed(1)}%</strong> — acima do limite recomendado (10%)
                </Typography>
              </Box>
            </Grid>
          )}
          {churnDash?.alto_risco > 0 && (
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" gap={1} alignItems="center">
                <PersonOff color="error" fontSize="small" />
                <Typography variant="body2">
                  <strong>{fmtN(churnDash.alto_risco)} cliente(s)</strong> com alto risco de churn — ação de retenção urgente
                </Typography>
              </Box>
            </Grid>
          )}
          {opsEmProducao > 0 && (
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" gap={1} alignItems="center">
                <PrecisionManufacturing color="info" fontSize="small" />
                <Typography variant="body2">
                  <strong>{opsEmProducao} OP(s)</strong> em produção — verificar progresso e insumos
                </Typography>
              </Box>
            </Grid>
          )}
          {episAlerta === 0 && ocorrenciasPendentes === 0 && inadimplencia <= 10 &&
           !churnDash?.alto_risco && opsEmProducao === 0 && !loading && (
            <Grid item xs={12}>
              <Box display="flex" gap={1} alignItems="center">
                <CheckCircle color="success" fontSize="small" />
                <Typography variant="body2" color="success.main">
                  Nenhum alerta crítico no momento. Sistema operando normalmente.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  )
}
