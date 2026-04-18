import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  MenuItem, Stack, CircularProgress, Alert, Divider, Chip, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, IconButton, Tooltip,
} from '@mui/material'
import {
  Search as SearchIcon, Refresh as RefreshIcon,
  TrendingUp, TrendingDown, AccountBalance,
  ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
  FileDownload as DownloadIcon, Print as PrintIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

const MESES = [
  {v:1,l:'Janeiro'},{v:2,l:'Fevereiro'},{v:3,l:'Março'},{v:4,l:'Abril'},
  {v:5,l:'Maio'},{v:6,l:'Junho'},{v:7,l:'Julho'},{v:8,l:'Agosto'},
  {v:9,l:'Setembro'},{v:10,l:'Outubro'},{v:11,l:'Novembro'},{v:12,l:'Dezembro'},
]

const hoje = new Date()

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (v) => `${Number(v || 0).toFixed(2)}%`

function LinhaDetalhe({ label, valor, nivel = 0, negativo = false, destaque = false, cor }) {
  const v = Number(valor || 0)
  const isNeg = v < 0 || negativo
  return (
    <TableRow sx={{ bgcolor: destaque ? (isNeg ? '#ffebee' : '#e8f5e9') : 'inherit' }}>
      <TableCell sx={{ pl: (nivel + 1) * 2, py: 0.8 }}>
        <Typography variant={destaque ? 'body2' : 'caption'} fontWeight={destaque ? 700 : 400} color={cor || 'inherit'}>
          {label}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ py: 0.8 }}>
        <Typography
          variant={destaque ? 'body2' : 'caption'}
          fontWeight={destaque ? 700 : 400}
          color={isNeg && v !== 0 ? 'error.main' : destaque ? (v >= 0 ? 'success.main' : 'error.main') : 'inherit'}
        >
          {negativo && v > 0 ? `(${fmt(v)})` : fmt(v)}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ py: 0.8 }}>
        {destaque && <Chip size="small" label={v >= 0 ? 'Positivo' : 'Negativo'} color={v >= 0 ? 'success' : 'error'} />}
      </TableCell>
    </TableRow>
  )
}

function SecaoExpandivel({ titulo, children, defaultOpen = false }) {
  const [aberto, setAberto] = useState(defaultOpen)
  return (
    <>
      <TableRow
        onClick={() => setAberto(!aberto)}
        sx={{ bgcolor: '#f5f5f5', cursor: 'pointer', '&:hover': { bgcolor: '#eeeeee' } }}
      >
        <TableCell colSpan={3} sx={{ py: 0.6, pl: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton size="small">{aberto ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}</IconButton>
            <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
              {titulo}
            </Typography>
          </Stack>
        </TableCell>
      </TableRow>
      {aberto && children}
    </>
  )
}

export default function RelatorioDREPage() {
  const { axiosInstance } = useAuth()
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())

  const buscar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const r = await axiosInstance.get('/dre/gerar/', { params: { mes, ano } })
      setDados(r.data)
    } catch (e) {
      setErro('Erro ao gerar DRE: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }, [mes, ano, axiosInstance])

  useEffect(() => { buscar() }, [buscar])

  const dre = dados?.dre
  const totais = dados?.totais_auxiliares
  const periodo = dados?.periodo

  const imprimir = () => window.print()

  return (
    <Box sx={{ p: 3 }} className="dre-print">
      {/* Cabeçalho */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary">
            DRE Gerencial
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Demonstrativo de Resultado do Exercício
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar">
            <IconButton onClick={buscar} disabled={loading}><RefreshIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Imprimir">
            <IconButton onClick={imprimir}><PrintIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filtros */}
      <Card sx={{ mb: 3 }} elevation={1}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Período</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            <TextField
              select size="small" label="Mês" value={mes}
              onChange={(e) => setMes(e.target.value)} sx={{ minWidth: 140 }}
            >
              {MESES.map((m) => <MenuItem key={m.v} value={m.v}>{m.l}</MenuItem>)}
            </TextField>
            <TextField
              size="small" label="Ano" type="number" value={ano}
              onChange={(e) => setAno(e.target.value)} sx={{ width: 100 }}
            />
            <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={buscar} disabled={loading}>
              Gerar DRE
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      {loading && (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      )}

      {!loading && dre && (
        <>
          {/* Cards de resumo */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Receita Bruta', valor: dre.receita_bruta, color: '#1565c0', icon: <TrendingUp /> },
              { label: 'Receita Líquida', valor: dre.receita_liquida, color: '#2e7d32', icon: <AccountBalance /> },
              { label: 'Resultado Bruto', valor: dre.resultado_bruto, color: Number(dre.resultado_bruto) >= 0 ? '#2e7d32' : '#c62828', icon: Number(dre.resultado_bruto) >= 0 ? <TrendingUp /> : <TrendingDown /> },
              { label: 'Resultado Operacional', valor: dre.resultado_operacional, color: Number(dre.resultado_operacional) >= 0 ? '#1b5e20' : '#b71c1c', icon: Number(dre.resultado_operacional) >= 0 ? <TrendingUp /> : <TrendingDown /> },
            ].map((item) => (
              <Grid item xs={6} sm={3} key={item.label}>
                <Card elevation={2} sx={{ borderLeft: `4px solid ${item.color}` }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Box sx={{ color: item.color }}>{item.icon}</Box>
                      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} sx={{ color: item.color }}>
                      {fmt(item.valor)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Margens */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 1.5, textAlign: 'center' }} elevation={1}>
                <Typography variant="caption" color="text.secondary">Margem Bruta</Typography>
                <Typography variant="h6" fontWeight={700} color={Number(dre.margem_bruta_perc) >= 0 ? 'success.main' : 'error.main'}>
                  {pct(dre.margem_bruta_perc)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 1.5, textAlign: 'center' }} elevation={1}>
                <Typography variant="caption" color="text.secondary">Margem Operacional</Typography>
                <Typography variant="h6" fontWeight={700} color={Number(dre.margem_operacional_perc) >= 0 ? 'success.main' : 'error.main'}>
                  {pct(dre.margem_operacional_perc)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 1.5, textAlign: 'center' }} elevation={1}>
                <Typography variant="caption" color="text.secondary">Ticket Médio</Typography>
                <Typography variant="h6" fontWeight={700}>{fmt(totais?.ticket_medio)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 1.5, textAlign: 'center' }} elevation={1}>
                <Typography variant="caption" color="text.secondary">Qtd. Vendas</Typography>
                <Typography variant="h6" fontWeight={700}>{totais?.qtd_vendas || 0}</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Tabela DRE */}
          <Card elevation={2}>
            <CardContent sx={{ pb: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1}>
                DRE — {MESES.find(m => m.v === Number(mes))?.l} / {ano}
              </Typography>
              {periodo && (
                <Typography variant="caption" color="text.secondary">
                  Período: {new Date(periodo.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')} a {new Date(periodo.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}
                </Typography>
              )}
            </CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: '#fff', fontWeight: 700, width: '60%' }}>Descrição</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 700 }} align="right">Valor (R$)</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 700 }} align="right" width={100}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* RECEITA */}
                  <SecaoExpandivel titulo="Receitas de Vendas" defaultOpen>
                    <LinhaDetalhe label="Receita Bruta de Vendas" valor={dre.receita_bruta} nivel={0} />
                    <LinhaDetalhe label="(-) Devoluções" valor={dre.devolucoes} nivel={1} negativo />
                  </SecaoExpandivel>

                  <SecaoExpandivel titulo="Impostos sobre Vendas" defaultOpen>
                    <LinhaDetalhe label="(-) ICMS" valor={dre.impostos_sobre_vendas.icms} nivel={1} negativo />
                    <LinhaDetalhe label="(-) ICMS-ST" valor={dre.impostos_sobre_vendas.icms_st} nivel={1} negativo />
                    <LinhaDetalhe label="(-) PIS" valor={dre.impostos_sobre_vendas.pis} nivel={1} negativo />
                    <LinhaDetalhe label="(-) COFINS" valor={dre.impostos_sobre_vendas.cofins} nivel={1} negativo />
                    <LinhaDetalhe label="(-) IPI" valor={dre.impostos_sobre_vendas.ipi} nivel={1} negativo />
                  </SecaoExpandivel>

                  <LinhaDetalhe label="= Receita Líquida" valor={dre.receita_liquida} destaque />

                  {/* CMV */}
                  <SecaoExpandivel titulo="Custo das Mercadorias">
                    <LinhaDetalhe label="(-) CMV — Custo da Mercadoria Vendida" valor={dre.cmv} nivel={1} negativo />
                  </SecaoExpandivel>

                  <LinhaDetalhe label="= Resultado Bruto (Lucro Bruto)" valor={dre.resultado_bruto} destaque cor={Number(dre.resultado_bruto) >= 0 ? 'success.main' : 'error.main'} />

                  {/* DESPESAS */}
                  <SecaoExpandivel titulo="Despesas Operacionais">
                    {dre.despesas_operacionais.por_departamento.length > 0 ? (
                      dre.despesas_operacionais.por_departamento.map((d, i) => (
                        <LinhaDetalhe key={i} label={`(-) ${d.departamento}`} valor={d.total} nivel={1} negativo />
                      ))
                    ) : (
                      <LinhaDetalhe label="(-) Total Despesas Operacionais" valor={dre.despesas_operacionais.total} nivel={1} negativo />
                    )}
                  </SecaoExpandivel>

                  {/* SERVIÇOS */}
                  {Number(dre.contas_servicos.total) > 0 && (
                    <SecaoExpandivel titulo="Contas de Serviços / Utilidades">
                      {dre.contas_servicos.por_tipo.map((s, i) => (
                        <LinhaDetalhe key={i} label={`(-) ${s.tipo}`} valor={s.total} nivel={1} negativo />
                      ))}
                    </SecaoExpandivel>
                  )}

                  {/* RECEITAS NÃO-OP */}
                  {Number(dre.receitas_nao_operacionais) > 0 && (
                    <SecaoExpandivel titulo="Receitas Não Operacionais">
                      <LinhaDetalhe label="(+) Outras Receitas" valor={dre.receitas_nao_operacionais} nivel={1} />
                    </SecaoExpandivel>
                  )}

                  <LinhaDetalhe label="= Resultado Operacional (EBIT)" valor={dre.resultado_operacional} destaque cor={Number(dre.resultado_operacional) >= 0 ? 'success.dark' : 'error.dark'} />
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  )
}
