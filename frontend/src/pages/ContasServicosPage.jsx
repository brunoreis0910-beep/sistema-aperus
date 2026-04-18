import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Tooltip,
  CircularProgress,
  Divider,
  InputAdornment,
  Snackbar,
  AlertTitle,
  Badge,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  Close as CloseIcon,
  ElectricBolt as EnergyIcon,
  WaterDrop as WaterIcon,
  Phone as PhoneIcon,
  LocalFireDepartment as GasIcon,
  Description as ServiceIcon,
  CheckCircle as PaidIcon,
  Warning as OverdueIcon,
  Schedule as PendingIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

// ─── Constantes ─────────────────────────────────────────────────────────────
const TIPOS = [
  { value: 'telefone', label: 'Conta de Telefone' },
  { value: 'energia', label: 'Conta de Energia Elétrica' },
  { value: 'agua', label: 'Conta de Água' },
  { value: 'gas', label: 'Conta de Gás' },
  { value: 'servico_terceiro', label: 'Nota de Serviço de Terceiro' },
]

const STATUS_LIST = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'pago', label: 'Pago' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'vencido', label: 'Vencido' },
]

const TIPO_META = {
  telefone: { color: '#2e7d32', bg: '#e8f5e9', icon: <PhoneIcon fontSize="small" />, label: 'Telefone' },
  energia:  { color: '#f57f17', bg: '#fffde7', icon: <EnergyIcon fontSize="small" />, label: 'Energia' },
  agua:     { color: '#0277bd', bg: '#e1f5fe', icon: <WaterIcon fontSize="small" />, label: 'Água' },
  gas:      { color: '#e64a19', bg: '#fbe9e7', icon: <GasIcon fontSize="small" />, label: 'Gás' },
  servico_terceiro: { color: '#6a1b9a', bg: '#f3e5f5', icon: <ServiceIcon fontSize="small" />, label: 'Serviço' },
}

const STATUS_META = {
  pendente:  { color: 'warning', label: 'Pendente' },
  pago:      { color: 'success', label: 'Pago' },
  cancelado: { color: 'default', label: 'Cancelado' },
  vencido:   { color: 'error',   label: 'Vencido' },
}

const MESES = [
  {v:1,l:'Janeiro'},{v:2,l:'Fevereiro'},{v:3,l:'Março'},{v:4,l:'Abril'},
  {v:5,l:'Maio'},{v:6,l:'Junho'},{v:7,l:'Julho'},{v:8,l:'Agosto'},
  {v:9,l:'Setembro'},{v:10,l:'Outubro'},{v:11,l:'Novembro'},{v:12,l:'Dezembro'},
]

const CST_PIS_COFINS = [
  { value: '50', label: '50 - Operação com Direito a Crédito' },
  { value: '70', label: '70 - Operação de Aquisição sem Direito a Crédito' },
  { value: '98', label: '98 - Outras Operações de Entrada' },
  { value: '99', label: '99 - Outras Operações' },
]

const hoje = new Date()
const anoAtual = hoje.getFullYear()
const mesAtual = hoje.getMonth() + 1

const FORM_INICIAL = {
  tipo: 'energia',
  descricao: '',
  fornecedor_nome: '',
  cnpj_fornecedor: '',
  numero_documento: '',
  serie: '',
  chave_acesso: '',
  data_emissao: new Date().toISOString().slice(0, 10),
  data_vencimento: '',
  data_pagamento: '',
  mes_competencia: mesAtual,
  ano_competencia: anoAtual,
  valor_total: '',
  valor_pis: '0.00',
  aliq_pis: '0.0000',
  valor_cofins: '0.00',
  aliq_cofins: '0.0000',
  valor_icms: '0.00',
  aliq_icms: '0.0000',
  cfop: '1949',
  cst_pis: '70',
  cst_cofins: '70',
  cst_icms: '',
  observacao: '',
  status: 'pendente',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = (d) => {
  if (!d) return '-'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function ContasServicosPage() {
  const { axiosInstance } = useAuth()
  const [contas, setContas] = useState([])
  const [resumo, setResumo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(null)

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroMes, setFiltroMes] = useState(mesAtual)
  const [filtroAno, setFiltroAno] = useState(anoAtual)
  const [filtroBusca, setFiltroBusca] = useState('')

  // Diálogo
  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [erroDialog, setErroDialog] = useState(null)

  // Diálogo exclusão
  const [dialogExcluir, setDialogExcluir] = useState(false)
  const [contaExcluir, setContaExcluir] = useState(null)

  // Diálogo SPED
  const [dialogSped, setDialogSped] = useState(false)
  const [spedLinhas, setSpedLinhas] = useState([])
  const [loadingSped, setLoadingSped] = useState(false)

  // ── Requisições ────────────────────────────────────────────────────────────
  const carregarContas = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const params = {}
      if (filtroTipo)   params.tipo   = filtroTipo
      if (filtroStatus) params.status = filtroStatus
      if (filtroMes)    params.mes    = filtroMes
      if (filtroAno)    params.ano    = filtroAno
      if (filtroBusca)  params.search = filtroBusca

      const [r1, r2] = await Promise.all([
        axiosInstance.get('/contas-servicos/', { params }),
        axiosInstance.get('/contas-servicos/resumo-mensal/', {
          params: { mes: filtroMes, ano: filtroAno },
        }),
      ])
      setContas(Array.isArray(r1.data) ? r1.data : Array.isArray(r1.data?.results) ? r1.data.results : [])
      setResumo(r2.data)
    } catch (e) {
      setErro('Erro ao carregar dados: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }, [filtroTipo, filtroStatus, filtroMes, filtroAno, filtroBusca])

  useEffect(() => { carregarContas() }, [carregarContas])

  // ── Diálogo Add/Edit ───────────────────────────────────────────────────────
  const abrirAdicionar = () => {
    setEditando(null)
    setForm({ ...FORM_INICIAL })
    setErroDialog(null)
    setDialogAberto(true)
  }

  const abrirEditar = (conta) => {
    setEditando(conta.id)
    setForm({
      tipo:             conta.tipo,
      descricao:        conta.descricao || '',
      fornecedor_nome:  conta.fornecedor_nome,
      cnpj_fornecedor:  conta.cnpj_fornecedor || '',
      numero_documento: conta.numero_documento || '',
      serie:            conta.serie || '',
      chave_acesso:     conta.chave_acesso || '',
      data_emissao:     conta.data_emissao || '',
      data_vencimento:  conta.data_vencimento || '',
      data_pagamento:   conta.data_pagamento || '',
      mes_competencia:  conta.mes_competencia,
      ano_competencia:  conta.ano_competencia,
      valor_total:      conta.valor_total,
      valor_pis:        conta.valor_pis,
      aliq_pis:         conta.aliq_pis,
      valor_cofins:     conta.valor_cofins,
      aliq_cofins:      conta.aliq_cofins,
      valor_icms:       conta.valor_icms,
      aliq_icms:        conta.aliq_icms,
      cfop:             conta.cfop,
      cst_pis:          conta.cst_pis,
      cst_cofins:       conta.cst_cofins,
      cst_icms:         conta.cst_icms || '',
      observacao:       conta.observacao || '',
      status:           conta.status,
    })
    setErroDialog(null)
    setDialogAberto(true)
  }

  const salvar = async () => {
    if (!form.fornecedor_nome.trim()) {
      setErroDialog('Informe o nome do fornecedor.')
      return
    }
    if (!form.data_emissao) {
      setErroDialog('Informe a data de emissão.')
      return
    }
    if (!form.valor_total || isNaN(Number(form.valor_total))) {
      setErroDialog('Informe o valor total.')
      return
    }
    setSalvando(true)
    setErroDialog(null)
    try {
      if (editando) {
        await axiosInstance.put(`/contas-servicos/${editando}/`, form)
      } else {
        await axiosInstance.post('/contas-servicos/', form)
      }
      setSucesso(editando ? 'Conta atualizada com sucesso!' : 'Conta adicionada com sucesso!')
      setDialogAberto(false)
      carregarContas()
    } catch (e) {
      const msgs = e.response?.data
      if (msgs && typeof msgs === 'object') {
        const erros = Object.entries(msgs).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        setErroDialog(erros)
      } else {
        setErroDialog('Erro ao salvar: ' + e.message)
      }
    } finally {
      setSalvando(false)
    }
  }

  // ── Exclusão ───────────────────────────────────────────────────────────────
  const confirmarExcluir = (conta) => {
    setContaExcluir(conta)
    setDialogExcluir(true)
  }

  const excluir = async () => {
    if (!contaExcluir) return
    try {
      await axiosInstance.delete(`/contas-servicos/${contaExcluir.id}/`)
      setSucesso('Conta excluída com sucesso!')
      setDialogExcluir(false)
      setContaExcluir(null)
      carregarContas()
    } catch (e) {
      setErro('Erro ao excluir: ' + e.message)
      setDialogExcluir(false)
    }
  }

  // ── SPED F100 ──────────────────────────────────────────────────────────────
  const gerarSpedF100 = async () => {
    setLoadingSped(true)
    try {
      const r = await axiosInstance.get('/contas-servicos/exportar-sped-f100/', {
        params: { mes: filtroMes, ano: filtroAno },
      })
      setSpedLinhas(r.data.linhas || [])
      setDialogSped(true)
    } catch (e) {
      setErro('Erro ao gerar SPED: ' + e.message)
    } finally {
      setLoadingSped(false)
    }
  }

  const copiarSped = () => {
    navigator.clipboard.writeText(spedLinhas.join('\n'))
    setSucesso('Registros SPED copiados para a área de transferência!')
  }

  // ── Campo form ─────────────────────────────────────────────────────────────
  const setF = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary">
            Contas de Serviços e Utilidades
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Telefone · Energia · Água · Gás · Notas de Serviço de Terceiros
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar">
            <IconButton onClick={carregarContas} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={loadingSped ? <CircularProgress size={16} /> : <FileDownloadIcon />}
            onClick={gerarSpedF100}
            disabled={loadingSped}
          >
            Exportar SPED F100
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirAdicionar}>
            Nova Conta
          </Button>
        </Stack>
      </Stack>

      {/* Erros globais */}
      {erro && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro(null)}>
          {erro}
        </Alert>
      )}

      {/* Cards de resumo */}
      {resumo && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card elevation={2}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="caption" color="text.secondary">Total do Mês</Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  {fmt(resumo.total_geral)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={2} sx={{ borderLeft: '4px solid #ed6c02' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PendingIcon color="warning" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">Pendente</Typography>
                </Stack>
                <Typography variant="h6" fontWeight={700} color="warning.main">
                  {fmt(resumo.total_pendente)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={2} sx={{ borderLeft: '4px solid #2e7d32' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PaidIcon color="success" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">Pago</Typography>
                </Stack>
                <Typography variant="h6" fontWeight={700} color="success.main">
                  {fmt(resumo.total_pago)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={2} sx={{ borderLeft: '4px solid #d32f2f' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <OverdueIcon color="error" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">Vencido</Typography>
                </Stack>
                <Typography variant="h6" fontWeight={700} color="error.main">
                  {fmt(resumo.total_vencido)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 2 }} elevation={1}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
            Filtros
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
            <TextField
              select size="small" label="Tipo" value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todos os tipos</MenuItem>
              {TIPOS.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select size="small" label="Status" value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {STATUS_LIST.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select size="small" label="Mês" value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              sx={{ minWidth: 130 }}
            >
              {MESES.map((m) => (
                <MenuItem key={m.v} value={m.v}>{m.l}</MenuItem>
              ))}
            </TextField>
            <TextField
              size="small" label="Ano" type="number" value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              sx={{ width: 90 }}
            />
            <TextField
              size="small" label="Buscar fornecedor / documento"
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && carregarContas()}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              }}
              sx={{ minWidth: 240 }}
            />
            <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={carregarContas}>
              Buscar
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabela */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                {['Tipo', 'Fornecedor', 'Nº Doc', 'Emissão', 'Vencimento', 'Valor Total', 'PIS', 'COFINS', 'Status', 'Ações'].map((h) => (
                  <TableCell key={h} sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', py: 1 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {contas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhum registro encontrado para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                contas.map((c) => {
                  const meta = TIPO_META[c.tipo] || TIPO_META.servico_terceiro
                  const stMeta = STATUS_META[c.status] || {}
                  return (
                    <TableRow key={c.id} hover>
                      <TableCell>
                        <Chip
                          icon={meta.icon}
                          label={meta.label}
                          size="small"
                          sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{c.fornecedor_nome}</Typography>
                        {c.cnpj_fornecedor && (
                          <Typography variant="caption" color="text.secondary">{c.cnpj_fornecedor}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{c.numero_documento || '-'}</Typography>
                        {c.serie && <Typography variant="caption" color="text.secondary">Série: {c.serie}</Typography>}
                      </TableCell>
                      <TableCell>{fmtDate(c.data_emissao)}</TableCell>
                      <TableCell>
                        {c.data_vencimento ? (
                          <Typography
                            variant="body2"
                            color={c.status === 'vencido' ? 'error.main' : 'inherit'}
                            fontWeight={c.status === 'vencido' ? 700 : 400}
                          >
                            {fmtDate(c.data_vencimento)}
                          </Typography>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{fmt(c.valor_total)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{fmt(c.valor_pis)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{fmt(c.valor_cofins)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={stMeta.label || c.status}
                          color={stMeta.color || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Editar">
                            <IconButton size="small" color="primary" onClick={() => abrirEditar(c)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton size="small" color="error" onClick={() => confirmarExcluir(c)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Rodapé totais SPED */}
      {resumo && contas.length > 0 && (
        <Paper sx={{ mt: 1, p: 1.5 }} elevation={1}>
          <Stack direction="row" spacing={3} divider={<Divider orientation="vertical" flexItem />} flexWrap="wrap" useFlexGap>
            <Typography variant="caption" color="text.secondary">
              <strong>PIS Total: </strong><span style={{ color: '#1565c0' }}>{fmt(resumo.total_pis)}</span>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>COFINS Total: </strong><span style={{ color: '#1565c0' }}>{fmt(resumo.total_cofins)}</span>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>ICMS Total: </strong><span style={{ color: '#1565c0' }}>{fmt(resumo.total_icms)}</span>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>Registros: </strong>{contas.length}
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* ── Diálogo Add/Edit ──────────────────────────────────────────────────── */}
      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editando ? 'Editar Conta de Serviço' : 'Nova Conta de Serviço'}
        </DialogTitle>
        <DialogContent dividers>
          {erroDialog && (
            <Alert severity="error" sx={{ mb: 2 }}>{erroDialog}</Alert>
          )}

          <Grid container spacing={2}>
            {/* Tipo */}
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth size="small" label="Tipo *"
                value={form.tipo} onChange={setF('tipo')}
              >
                {TIPOS.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {/* Status */}
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth size="small" label="Status *"
                value={form.status} onChange={setF('status')}
              >
                {STATUS_LIST.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Fornecedor */}
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth size="small" label="Fornecedor / Empresa *"
                value={form.fornecedor_nome} onChange={setF('fornecedor_nome')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="CNPJ do Fornecedor"
                value={form.cnpj_fornecedor} onChange={setF('cnpj_fornecedor')}
                placeholder="00.000.000/0001-00"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth size="small" label="Descrição"
                value={form.descricao} onChange={setF('descricao')}
              />
            </Grid>

            {/* Documento */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Número do Documento"
                value={form.numero_documento} onChange={setF('numero_documento')}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth size="small" label="Série"
                value={form.serie} onChange={setF('serie')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Chave de Acesso (44 dígitos)"
                value={form.chave_acesso} onChange={setF('chave_acesso')}
                inputProps={{ maxLength: 44 }}
              />
            </Grid>

            {/* Datas */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Data de Emissão *"
                type="date" value={form.data_emissao} onChange={setF('data_emissao')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Data de Vencimento"
                type="date" value={form.data_vencimento} onChange={setF('data_vencimento')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Data de Pagamento"
                type="date" value={form.data_pagamento} onChange={setF('data_pagamento')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Competência */}
            <Grid item xs={12} sm={3}>
              <TextField
                select fullWidth size="small" label="Mês Competência *"
                value={form.mes_competencia} onChange={setF('mes_competencia')}
              >
                {MESES.map((m) => <MenuItem key={m.v} value={m.v}>{m.l}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth size="small" label="Ano Competência *"
                type="number" value={form.ano_competencia} onChange={setF('ano_competencia')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth size="small" label="CFOP"
                value={form.cfop} onChange={setF('cfop')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth size="small" label="Valor Total *"
                type="number" value={form.valor_total} onChange={setF('valor_total')}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider><Typography variant="caption" color="text.secondary">PIS / COFINS</Typography></Divider>
            </Grid>

            {/* PIS */}
            <Grid item xs={12} sm={4}>
              <TextField
                select fullWidth size="small" label="CST PIS"
                value={form.cst_pis} onChange={setF('cst_pis')}
              >
                {CST_PIS_COFINS.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth size="small" label="Alíquota PIS (%)"
                type="number" value={form.aliq_pis} onChange={setF('aliq_pis')}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth size="small" label="Valor PIS (R$)"
                type="number" value={form.valor_pis} onChange={setF('valor_pis')}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>

            {/* COFINS */}
            <Grid item xs={12} sm={4}>
              <TextField
                select fullWidth size="small" label="CST COFINS"
                value={form.cst_cofins} onChange={setF('cst_cofins')}
              >
                {CST_PIS_COFINS.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth size="small" label="Alíquota COFINS (%)"
                type="number" value={form.aliq_cofins} onChange={setF('aliq_cofins')}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth size="small" label="Valor COFINS (R$)"
                type="number" value={form.valor_cofins} onChange={setF('valor_cofins')}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider><Typography variant="caption" color="text.secondary">ICMS (opcional)</Typography></Divider>
            </Grid>

            {/* ICMS */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="CST ICMS"
                value={form.cst_icms} onChange={setF('cst_icms')}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth size="small" label="Alíquota ICMS (%)"
                type="number" value={form.aliq_icms} onChange={setF('aliq_icms')}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth size="small" label="Valor ICMS (R$)"
                type="number" value={form.valor_icms} onChange={setF('valor_icms')}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth size="small" label="Observação"
                multiline rows={2} value={form.observacao} onChange={setF('observacao')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={salvar}
            disabled={salvando}
            startIcon={salvando ? <CircularProgress size={16} /> : null}
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Diálogo Exclusão ──────────────────────────────────────────────────── */}
      <Dialog open={dialogExcluir} onClose={() => setDialogExcluir(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja excluir a conta de <strong>{contaExcluir?.fornecedor_nome}</strong>{' '}
            ({contaExcluir?.data_emissao ? fmtDate(contaExcluir.data_emissao) : ''})?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogExcluir(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={excluir}>Excluir</Button>
        </DialogActions>
      </Dialog>

      {/* ── Diálogo SPED F100 ─────────────────────────────────────────────────── */}
      <Dialog open={dialogSped} onClose={() => setDialogSped(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              Registros SPED EFD Contribuições — Bloco F (F100)
              <Typography variant="caption" display="block" color="text.secondary">
                {MESES.find((m) => m.v === Number(filtroMes))?.l} / {filtroAno} — {spedLinhas.length} registro(s)
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={copiarSped}>
                Copiar Tudo
              </Button>
              <IconButton size="small" onClick={() => setDialogSped(false)}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {spedLinhas.length === 0 ? (
            <Alert severity="info">
              Nenhum registro F100 para o período selecionado.
            </Alert>
          ) : (
            <Box
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                bgcolor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: 500,
                overflowY: 'auto',
              }}
            >
              {spedLinhas.join('\n')}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogSped(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar sucesso */}
      <Snackbar
        open={!!sucesso}
        autoHideDuration={4000}
        onClose={() => setSucesso(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSucesso(null)}>
          {sucesso}
        </Alert>
      </Snackbar>
    </Box>
  )
}
