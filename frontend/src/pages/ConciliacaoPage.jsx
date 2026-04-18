import React, { useState, useCallback, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Button, TextField, MenuItem,
  Stack, CircularProgress, Alert, Paper, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Divider, LinearProgress, Grid,
} from '@mui/material'
import {
  Refresh as RefreshIcon, Search as SearchIcon,
  Link as VincularIcon, LinkOff as DesvincularIcon,
  CheckCircle as ConcilidadoIcon, RadioButtonUnchecked as PendenteIcon,
  Upload as ImportIcon, SyncAlt as ConciliacaoIcon,
  AccountBalance as BancoIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

const hoje = new Date()
const fmtDate = (d) => d ? new Date(d + (d.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('pt-BR') : '—'
const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const MESES = [
  {v:1,l:'Janeiro'},{v:2,l:'Fevereiro'},{v:3,l:'Março'},{v:4,l:'Abril'},
  {v:5,l:'Maio'},{v:6,l:'Junho'},{v:7,l:'Julho'},{v:8,l:'Agosto'},
  {v:9,l:'Setembro'},{v:10,l:'Outubro'},{v:11,l:'Novembro'},{v:12,l:'Dezembro'},
]

export default function ConciliacaoPage() {
  const { axiosInstance } = useAuth()
  const fileInputRef = React.useRef(null)
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [loading, setLoading] = useState(false)
  const [extrato, setExtrato] = useState([])
  const [filtroConciliado, setFiltroConciliado] = useState('')
  const [erro, setErro] = useState(null)
  const [periodoSugerido, setPeriodoSugerido] = useState(null)
  const [contasBancarias, setContasBancarias] = useState([])
  const [contaSelecionadaId, setContaSelecionadaId] = useState('')

  const buscar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    setPeriodoSugerido(null)
    try {
      const params = { mes, ano }
      if (contaSelecionadaId) params.conta_bancaria = contaSelecionadaId
      const r = await axiosInstance.get('/financeiro/conciliacao/', { params })
      setExtrato(r.data.lancamentos || [])
      
      // Se não houver dados, sugerir períodos anteriores
      if (!r.data.lancamentos || r.data.lancamentos.length === 0) {
        // Tentar meses anteriores para sugestão
        const mesAtual = new Date().getMonth() + 1
        const anoAtual = new Date().getFullYear()
        if (mes === mesAtual && ano === anoAtual) {
          setPeriodoSugerido({ mes: 12, ano: 2025 }) // Sugerir dezembro/2025
        }
      }
    } catch (error) {
      console.error('Erro ao buscar conciliação:', error)
      
      let mensagemErro = 'Erro ao buscar dados da conciliação.'
      if (error.response) {
        mensagemErro = `Erro ${error.response.status}: ${error.response.statusText}`
      } else if (error.request) {
        mensagemErro = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
      } else {
        mensagemErro = error.message || 'Erro desconhecido'
      }
      
      setErro(mensagemErro)
      setExtrato([])
    } finally {
      setLoading(false)
    }
  }, [mes, ano, contaSelecionadaId, axiosInstance])

  // Carregar contas bancárias uma vez
  useEffect(() => {
    axiosInstance.get('/contas-bancarias/').then(r => {
      const lista = r.data?.results || r.data || []
      setContasBancarias(lista)
      if (lista.length === 1) setContaSelecionadaId(lista[0].id_conta_bancaria)
    }).catch(() => {})
  }, [axiosInstance])

  // Buscar dados ao montar o componente
  useEffect(() => {
    buscar()
  }, [buscar])

  const aplicarPeriodoSugerido = () => {
    if (periodoSugerido) {
      setMes(periodoSugerido.mes)
      setAno(periodoSugerido.ano)
    }
  }

  const handleImportClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click()
    }
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.ofx')) {
        setErro('Apenas arquivos .ofx são suportados.')
        return
    }

    // Validar seleção de conta quando há múltiplas
    if (contasBancarias.length > 1 && !contaSelecionadaId) {
      setErro('Selecione a conta bancária de destino antes de importar o extrato.')
      event.target.value = null
      return
    }

    const formData = new FormData()
    formData.append('extrato', file)
    if (contaSelecionadaId) formData.append('conta_bancaria', contaSelecionadaId)
    
    setLoading(true)
    setErro(null)
    
    try {
        const response = await axiosInstance.post('/financeiro/conciliacao/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        const dets = response.data.detalhes
        const msgConciliados = dets.conciliados_automaticamente > 0 
          ? `\n✓ Conciliados automaticamente: ${dets.conciliados_automaticamente}`
          : ''
        alert(`Importação concluída!\nConta: ${dets.conta}\n✅ Importados: ${dets.importados}\n⚠️ Duplicados: ${dets.duplicados}${msgConciliados}`)
        
        // Atualiza a visualização
        buscar()
    } catch (error) {
        console.error('Erro na importação:', error)
        const msg = error.response?.data?.error || 'Erro ao processar importação.'
        setErro(msg)
    } finally {
        setLoading(false)
        event.target.value = null // Reset do input
    }
  }

  const toggleConciliado = async (id) => {
    const lancamento = extrato.find(l => l.id === id)
    if (!lancamento || lancamento.origem !== 'BANCO' || !lancamento.id_movimento) return
    const novoConciliado = !lancamento.conciliado
    // Atualiza localmente para feedback imediato
    setExtrato(prev => prev.map(l => l.id === id ? { ...l, conciliado: novoConciliado } : l))
    try {
      await axiosInstance.patch('/financeiro/conciliacao/', {
        id_movimento: lancamento.id_movimento,
        conciliado: novoConciliado
      })
    } catch (e) {
      // Reverte em caso de erro
      setExtrato(prev => prev.map(l => l.id === id ? { ...l, conciliado: !novoConciliado } : l))
      setErro('Erro ao salvar conciliação. Tente novamente.')
    }
  }

  const listaFiltrada = filtroConciliado === 'conciliado'
    ? extrato.filter(l => l.conciliado)
    : filtroConciliado === 'pendente'
      ? extrato.filter(l => !l.conciliado)
      : extrato

  const totalCreditos = extrato.filter(l => l.valor > 0).reduce((s, l) => s + l.valor, 0)
  const totalDebitos = extrato.filter(l => l.valor < 0).reduce((s, l) => s + l.valor, 0)
  const totalConciliado = extrato.filter(l => l.conciliado).length
  const percConciliado = extrato.length > 0 ? (totalConciliado / extrato.length) * 100 : 0

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ConciliacaoIcon sx={{ color: '#1565c0', fontSize: 32 }} />
            <Typography variant="h5" fontWeight={700} color="primary">Conciliação Bancária</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Compare lançamentos do banco com o sistema. Use "Importar Extrato" para carregar o OFX - o sistema conciliará automaticamente quando encontrar valor e cliente iguais.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {contasBancarias.length > 1 && (
            <TextField
              select
              size="small"
              label="Conta Bancária"
              value={contaSelecionadaId}
              onChange={e => setContaSelecionadaId(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Selecione...</MenuItem>
              {contasBancarias.map(c => (
                <MenuItem key={c.id_conta_bancaria} value={c.id_conta_bancaria}>
                  {c.nome_banco || c.nome_conta} — {c.conta}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Tooltip title="Importar OFX/CSV">
            <Button variant="outlined" startIcon={<ImportIcon />} size="small" onClick={handleImportClick}>
              Importar Extrato
            </Button>
          </Tooltip>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".ofx" 
            style={{ display: 'none' }} 
          />
          <Tooltip title="Atualizar">
            <IconButton onClick={buscar} disabled={loading}><RefreshIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Cards resumo */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card elevation={2} sx={{ borderLeft: '4px solid #2e7d32' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Total Créditos</Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">{fmt(totalCreditos)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={2} sx={{ borderLeft: '4px solid #c62828' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Total Débitos</Typography>
              <Typography variant="h6" fontWeight={700} color="error.main">{fmt(totalDebitos)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={2} sx={{ borderLeft: '4px solid #1565c0' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Saldo do Período</Typography>
              <Typography variant="h6" fontWeight={700} color={totalCreditos + totalDebitos >= 0 ? 'success.main' : 'error.main'}>
                {fmt(totalCreditos + totalDebitos)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={2} sx={{ borderLeft: '4px solid #e65100' }}>
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">Conciliados</Typography>
                <Typography variant="caption" fontWeight={700}>{totalConciliado}/{extrato.length}</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={percConciliado} sx={{ height: 8, borderRadius: 4 }} color={percConciliado === 100 ? 'success' : 'warning'} />
              <Typography variant="caption" color="text.secondary">{percConciliado.toFixed(0)}% conciliado</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }} elevation={1}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField select size="small" label="Mês" value={mes} onChange={e => setMes(e.target.value)} sx={{ minWidth: 140 }}>
              {MESES.map(m => <MenuItem key={m.v} value={m.v}>{m.l}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Ano" type="number" value={ano} onChange={e => setAno(e.target.value)} sx={{ width: 100 }} />
            <TextField select size="small" label="Situação" value={filtroConciliado} onChange={e => setFiltroConciliado(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="conciliado">Conciliados</MenuItem>
              <MenuItem value="pendente">Pendentes</MenuItem>
            </TextField>
            <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={buscar} disabled={loading}>Buscar</Button>
          </Stack>
        </CardContent>
      </Card>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {erro && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {erro}
        </Alert>
      )}

      {!loading && extrato.length === 0 && !erro && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600} mb={1}>
            Nenhuma movimentação bancária encontrada para {MESES.find(m => m.v === mes)?.l}/{ano}.
          </Typography>
          <Typography variant="body2" mb={1}>
            Para ver a conciliação bancária, você pode:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 1 }}>
            <li>Cadastrar movimentações bancárias através do menu <strong>Financeiro &gt; Bancário</strong></li>
            <li>Selecionar um período diferente nos filtros acima</li>
            {periodoSugerido && (
              <li>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={aplicarPeriodoSugerido}
                  sx={{ mt: 0.5 }}
                >
                  Ver {MESES.find(m => m.v === periodoSugerido.mes)?.l}/{periodoSugerido.ano} (período com dados)
                </Button>
              </li>
            )}
          </Typography>
        </Alert>
      )}

      {/* Tabela */}
      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#1565c0' }}>
              {['Data', 'Descrição', 'Valor', 'Tipo', 'Origem', 'Situação', 'Ação'].map(h => (
                <TableCell key={h} sx={{ color: '#fff', fontWeight: 700, py: 1 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {listaFiltrada.map((l) => (
              <TableRow key={l.id} hover sx={{ bgcolor: l.conciliado ? '#f1f8e9' : l.origem === 'SISTEMA' ? '#fff8e1' : 'inherit' }}>
                <TableCell><Typography variant="body2">{fmtDate(l.data)}</Typography></TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BancoIcon fontSize="small" sx={{ color: '#90a4ae' }} />
                    <Typography variant="body2">{l.descricao}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700} color={l.valor >= 0 ? 'success.main' : 'error.main'}>
                    {fmt(l.valor)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip size="small" label={l.valor >= 0 ? 'Crédito' : 'Débito'} color={l.valor >= 0 ? 'success' : 'error'} variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={l.origem === 'BANCO' ? 'Extrato' : 'Sistema'} color={l.origem === 'BANCO' ? 'primary' : 'default'} variant="outlined" />
                </TableCell>
                <TableCell>
                  {l.conciliado
                    ? <Chip size="small" icon={<ConcilidadoIcon />} label="Conciliado" color="success" />
                    : <Chip size="small" icon={<PendenteIcon />} label="Pendente" color="warning" variant="outlined" />}
                </TableCell>
                <TableCell>
                  {l.origem === 'BANCO' ? (
                    <Tooltip title={l.conciliado ? 'Desfazer conciliação' : 'Conciliar manualmente'}>
                      <Button 
                        size="small" 
                        variant={l.conciliado ? "outlined" : "contained"}
                        onClick={() => toggleConciliado(l.id)} 
                        color={l.conciliado ? 'error' : 'success'}
                        startIcon={l.conciliado ? <DesvincularIcon fontSize="small" /> : <VincularIcon fontSize="small" />}
                        sx={{ minWidth: 120 }}
                      >
                        {l.conciliado ? 'Desfazer' : 'Conciliar'}
                      </Button>
                    </Tooltip>
                  ) : (
                    <Chip size="small" label="Sistema" variant="outlined" sx={{ fontSize: 10 }} />
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
