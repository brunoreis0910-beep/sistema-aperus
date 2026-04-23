import React, { useState, useCallback, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Button, TextField, MenuItem,
  Stack, CircularProgress, Alert, Paper, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Divider, LinearProgress, Grid, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import {
  Refresh as RefreshIcon, Search as SearchIcon,
  CheckCircle as LiquidadoIcon, Schedule as PendenteIcon,
  CreditCard as CartaoIcon, AccountBalance as BancoIcon,
  GetApp as BaixarIcon, TrendingUp as AnteciparIcon,
  FilterList as FiltroIcon, Check as CheckIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

const fmtDate = (d) => d ? new Date(d + (d.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('pt-BR') : '—'
const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CartoesPage() {
  const { axiosInstance } = useAuth()
  
  // Estados
  const [recebimentos, setRecebimentos] = useState([])
  const [contasBancarias, setContasBancarias] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [selecionados, setSelecionados] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('PENDENTE')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  
  // Dialog de Baixa
  const [dialogBaixa, setDialogBaixa] = useState(false)
  const [contaBaixaSelecionada, setContaBaixaSelecionada] = useState('')
  const [dataBaixa, setDataBaixa] = useState(new Date().toISOString().split('T')[0])
  const [processandoBaixa, setProcessandoBaixa] = useState(false)

  // Carregar dados
  const buscar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const params = {}
      if (filtroStatus) params.status = filtroStatus
      if (dataInicial && dataFinal) {
        params.data_inicial = dataInicial
        params.data_final = dataFinal
      }
      
      const r = await axiosInstance.get('/financeiro/cartoes/', { params })
      // Garantir que sempre seja um array
      // DRF pode retornar {results: []} se houver paginação
      let dados = []
      if (Array.isArray(r.data)) {
        dados = r.data
      } else if (r.data && Array.isArray(r.data.results)) {
        dados = r.data.results
      } else {
        console.warn('Formato de resposta inesperado:', r.data)
      }
      setRecebimentos(dados)
    } catch (error) {
      console.error('Erro ao buscar recebimentos de cartão:', error)
      setErro('Erro ao carregar dados. Verifique se o backend está rodando.')
      setRecebimentos([])
    } finally {
      setLoading(false)
    }
  }, [filtroStatus, dataInicial, dataFinal, axiosInstance])

  const buscarContas = useCallback(async () => {
    try {
      const r = await axiosInstance.get('/contas-bancarias/')
      // Handle both array and paginated response formats
      let dados = []
      if (Array.isArray(r.data)) {
        dados = r.data
      } else if (r.data && Array.isArray(r.data.results)) {
        dados = r.data.results
      }
      setContasBancarias(dados)
    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error)
    }
  }, [axiosInstance])

  useEffect(() => {
    buscar()
    buscarContas()
  }, [buscar, buscarContas])

  // Seleção
  const toggleSelecao = (id) => {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleTodos = () => {
    const recebimentosArray = Array.isArray(recebimentos) ? recebimentos : []
    if (selecionados.length === recebimentosArray.length) {
      setSelecionados([])
    } else {
      setSelecionados(recebimentosArray.map(r => r.id_recebimento))
    }
  }

  // Ação de Baixa em Lote
  const handleBaixaLote = async () => {
    if (!contaBaixaSelecionada) {
      alert('Selecione uma conta bancária de destino')
      return
    }
    
    setProcessandoBaixa(true)
    try {
      const payload = {
        ids: selecionados,
        id_conta_bancaria: contaBaixaSelecionada,
        data_pagamento: dataBaixa
      }
      
      const r = await axiosInstance.post('/financeiro/cartoes/baixar_lote/', payload)

      const taxa = r.data.total_taxa ? ` (Taxa descontada: ${fmt(r.data.total_taxa)})` : ''
      alert((r.data.message || 'Baixa realizada com sucesso!') + taxa)
      
      // Limpar seleção e atualizar lista
      setSelecionados([])
      setDialogBaixa(false)
      buscar()
    } catch (error) {
      console.error('Erro na baixa:', error)
      alert(error.response?.data?.error || 'Erro ao processar baixa.')
    } finally {
      setProcessandoBaixa(false)
    }
  }

  // Calcular totais (com validação de array)
  const recebimentosArray = Array.isArray(recebimentos) ? recebimentos : []
  const totalBruto = recebimentosArray.reduce((s, r) => s + Number(r.valor_bruto || 0), 0)
  const totalTaxas = recebimentosArray.reduce((s, r) => s + Number(r.valor_taxa || 0), 0)
  const totalLiquido = recebimentosArray.reduce((s, r) => s + Number(r.valor_liquido || 0), 0)
  
  const totalSelecionadosLiq = recebimentosArray
    .filter(r => selecionados.includes(r.id_recebimento))
    .reduce((s, r) => s + Number(r.valor_liquido || 0), 0)

  const totalSelecionadosBruto = recebimentosArray
    .filter(r => selecionados.includes(r.id_recebimento))
    .reduce((s, r) => s + Number(r.valor_bruto || 0), 0)

  const totalSelecionadosTaxa = recebimentosArray
    .filter(r => selecionados.includes(r.id_recebimento))
    .reduce((s, r) => s + Number(r.valor_taxa || 0), 0)

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CartaoIcon sx={{ color: '#1565c0', fontSize: 32 }} />
            <Typography variant="h4" fontWeight={600}>Recebimentos de Cartão</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Conciliação e Baixa de Cartões de Crédito/Débito
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<BaixarIcon />}
            disabled={selecionados.length === 0}
            onClick={() => setDialogBaixa(true)}
            color="success"
          >
            Baixar Selecionados ({selecionados.length})
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={buscar}
          >
            Atualizar
          </Button>
        </Stack>
      </Stack>

      {/* Resumo */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Valor Bruto</Typography>
              <Typography variant="h5" fontWeight={600} color="primary">{fmt(totalBruto)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total em Taxas</Typography>
              <Typography variant="h5" fontWeight={600} color="error">{fmt(totalTaxas)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Valor Líquido</Typography>
              <Typography variant="h5" fontWeight={600} color="success.main">{fmt(totalLiquido)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'info.light' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Selecionados (Líquido)</Typography>
              <Typography variant="h5" fontWeight={600}>{fmt(totalSelecionadosLiq)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
            <TextField
              select
              label="Status"
              value={filtroStatus || ''}
              onChange={(e) => setFiltroStatus(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem key="todos" value="">Todos</MenuItem>
              <MenuItem key="PENDENTE" value="PENDENTE">Pendente</MenuItem>
              <MenuItem key="CONCILIADO" value="CONCILIADO">Conciliado</MenuItem>
              <MenuItem key="LIQUIDADO" value="LIQUIDADO">Liquidado</MenuItem>
              <MenuItem key="CANCELADO" value="CANCELADO">Cancelado</MenuItem>
            </TextField>
            
            <TextField
              label="Data Inicial"
              type="date"
              value={dataInicial || ''}
              onChange={(e) => setDataInicial(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            
            <TextField
              label="Data Final"
              type="date"
              value={dataFinal || ''}
              onChange={(e) => setDataFinal(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={buscar}
            >
              Filtrar
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Erro */}
      {erro && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {erro}
        </Alert>
      )}

      {/* Tabela */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : recebimentosArray.length === 0 ? (
            <Alert severity="info">Nenhum recebimento encontrado no período/filtro selecionado.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selecionados.length === recebimentosArray.length && recebimentosArray.length > 0}
                        indeterminate={selecionados.length > 0 && selecionados.length < recebimentosArray.length}
                        onChange={toggleTodos}
                      />
                    </TableCell>
                    <TableCell><strong>Data Venda</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Bandeira</strong></TableCell>
                    <TableCell align="right"><strong>Valor Bruto</strong></TableCell>
                    <TableCell align="right"><strong>Taxa (%)</strong></TableCell>
                    <TableCell align="right"><strong>Taxa (R$)</strong></TableCell>
                    <TableCell align="right"><strong>Valor Líquido</strong></TableCell>
                    <TableCell><strong>Previsão</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recebimentosArray.map((rec) => (
                    <TableRow 
                      key={rec.id_recebimento}
                      hover
                      sx={{ 
                        bgcolor: selecionados.includes(rec.id_recebimento) ? '#e3f2fd' : 'inherit',
                        opacity: rec.status === 'LIQUIDADO' ? 0.6 : 1
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selecionados.includes(rec.id_recebimento)}
                          onChange={() => toggleSelecao(rec.id_recebimento)}
                          disabled={rec.status === 'LIQUIDADO'}
                        />
                      </TableCell>
                      <TableCell>{fmtDate(rec.data_venda)}</TableCell>
                      <TableCell>{rec.nome_cliente || 'Consumidor'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${rec.bandeira || '—'} ${rec.tipo_cartao === 'DEBITO' ? '(D)' : '(C)'}`} 
                          size="small"
                          color={rec.tipo_cartao === 'DEBITO' ? 'info' : 'warning'}
                        />
                      </TableCell>
                      <TableCell align="right">{fmt(rec.valor_bruto)}</TableCell>
                      <TableCell align="right">{Number(rec.taxa_percentual || 0).toFixed(2)}%</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>{fmt(rec.valor_taxa)}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                        {fmt(rec.valor_liquido)}
                      </TableCell>
                      <TableCell>{fmtDate(rec.data_previsao)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={rec.status} 
                          size="small"
                          color={
                            rec.status === 'LIQUIDADO' ? 'success' :
                            rec.status === 'CONCILIADO' ? 'info' :
                            rec.status === 'CANCELADO' ? 'error' : 'default'
                          }
                          icon={rec.status === 'LIQUIDADO' ? <LiquidadoIcon /> : <PendenteIcon />}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Baixa */}
      <Dialog open={dialogBaixa} onClose={() => setDialogBaixa(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <BancoIcon color="primary" />
            <span>Baixar Recebimentos de Cartão</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Alert severity="info">
              <Typography variant="body2"><strong>{selecionados.length} recebimento(s) selecionado(s)</strong></Typography>
              <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                <li>Valor bruto: <strong>{fmt(totalSelecionadosBruto)}</strong></li>
                <li style={{ color: '#d32f2f' }}>Taxa cartão: <strong>−{fmt(totalSelecionadosTaxa)}</strong></li>
                <li>Valor líquido: <strong>{fmt(totalSelecionadosLiq)}</strong></li>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Serão gerados 2 lançamentos no extrato: crédito (bruto) e débito (taxa).
              </Typography>
            </Alert>
            
            <TextField
              select
              label="Conta Bancária de Destino"
              value={contaBaixaSelecionada || ''}
              onChange={(e) => setContaBaixaSelecionada(e.target.value)}
              fullWidth
              required
              helperText="Selecione a conta onde o dinheiro será creditado"
            >
              {(Array.isArray(contasBancarias) ? contasBancarias : []).map(c => (
                <MenuItem key={c.id_conta_bancaria} value={c.id_conta_bancaria}>
                  {c.nome_conta} - {c.banco} ({c.agencia}/{c.conta})
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              label="Data da Liquidação"
              type="date"
              value={dataBaixa || ''}
              onChange={(e) => setDataBaixa(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Data em que o valor caiu na conta"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogBaixa(false)} disabled={processandoBaixa}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleBaixaLote}
            disabled={processandoBaixa || !contaBaixaSelecionada}
            startIcon={processandoBaixa ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {processandoBaixa ? 'Processando...' : 'Confirmar Baixa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
