import React, { useState, useRef } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  Alert,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import InventoryIcon from '@mui/icons-material/Inventory'
import ClearIcon from '@mui/icons-material/Clear'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import { useAuth } from '../context/AuthContext'

const formatarMoeda = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatarQtd = (v) => {
  const n = Number(v || 0)
  if (Number.isInteger(n)) return n.toLocaleString('pt-BR')
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
}

const statusColor = (qtd, min) => {
  if (qtd <= 0) return 'error'
  if (min > 0 && qtd <= min) return 'warning'
  return 'success'
}

const statusLabel = (qtd, min) => {
  if (qtd <= 0) return 'Sem estoque'
  if (min > 0 && qtd <= min) return 'Estoque baixo'
  return 'Normal'
}

export default function ConsultaEstoquePage() {
  const { axiosInstance } = useAuth()
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(false)
  const [buscaFeita, setBuscaFeita] = useState(false)
  const debounceRef = useRef(null)

  const buscarProdutos = async (termo) => {
    if (!termo || termo.trim().length < 2) {
      setResultados([])
      setBuscaFeita(false)
      return
    }
    setLoading(true)
    setBuscaFeita(false)
    try {
      const response = await axiosInstance.get('/produtos/', {
        params: { search: termo.trim() }
      })
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || [])
      setResultados(data)
    } catch (err) {
      setResultados([])
    } finally {
      setLoading(false)
      setBuscaFeita(true)
    }
  }

  const handleBuscaChange = (e) => {
    const valor = e.target.value
    setBusca(valor)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscarProdutos(valor), 400)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      buscarProdutos(busca)
    }
  }

  const limpar = () => {
    setBusca('')
    setResultados([])
    setBuscaFeita(false)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <InventoryIcon color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Consulta de Estoque
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pesquise produtos para ver saldo em estoque e valor de venda
          </Typography>
        </Box>
      </Box>

      {/* Campo de busca */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          autoFocus
          variant="outlined"
          placeholder="Digite o nome, código ou EAN do produto..."
          value={busca}
          onChange={handleBuscaChange}
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <QrCodeScannerIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading ? (
                  <CircularProgress size={20} />
                ) : busca ? (
                  <Tooltip title="Limpar">
                    <IconButton size="small" onClick={limpar}>
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <SearchIcon color="action" />
                )}
              </InputAdornment>
            ),
          }}
          sx={{ '& .MuiOutlinedInput-root': { fontSize: '1.05rem' } }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          A pesquisa inicia automaticamente após digitar 2 caracteres. Pressione Enter para buscar imediatamente.
        </Typography>
      </Paper>

      {/* Resultados */}
      {!buscaFeita && !loading && resultados.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <SearchIcon sx={{ fontSize: 60, opacity: 0.2, mb: 1 }} />
          <Typography variant="body1">Digite o nome ou código do produto para consultar o estoque</Typography>
        </Box>
      )}

      {buscaFeita && resultados.length === 0 && !loading && (
        <Alert severity="info" icon={<InventoryIcon />}>
          Nenhum produto encontrado para <strong>"{busca}"</strong>.
        </Alert>
      )}

      {resultados.length > 0 && (
        <TableContainer component={Paper} elevation={2}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary">
              {resultados.length} produto{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'grey.50' } }}>
                <TableCell>Código</TableCell>
                <TableCell>Produto</TableCell>
                <TableCell align="center">Unidade</TableCell>
                <TableCell align="right">Estoque Total</TableCell>
                <TableCell align="right">Valor de Venda</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Depósitos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resultados.map((prod) => {
                const estoqueTotal = Number(prod.estoque_total || 0)
                const valorVenda = Number(prod.valor_venda || 0)
                const estoqueMin = Number(
                  (prod.estoque_por_deposito || []).reduce(
                    (acc, d) => acc + Number(d.quantidade_minima || 0), 0
                  )
                )
                const depositos = prod.estoque_por_deposito || []

                return (
                  <TableRow
                    key={prod.id_produto}
                    hover
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                        {prod.codigo_produto}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {prod.nome_produto}
                      </Typography>
                      {prod.gtin && (
                        <Typography variant="caption" color="text.secondary">
                          EAN: {prod.gtin}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {prod.unidade_medida || 'UN'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={estoqueTotal <= 0 ? 'error.main' : 'text.primary'}
                      >
                        {formatarQtd(estoqueTotal)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {valorVenda > 0 ? (
                        <Typography variant="body2" fontWeight={700} color="success.dark">
                          {formatarMoeda(valorVenda)}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          Não definido
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={statusLabel(estoqueTotal, estoqueMin)}
                        color={statusColor(estoqueTotal, estoqueMin)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {depositos.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {depositos.map((dep, i) => (
                            <Tooltip
                              key={i}
                              title={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    Qtd: {formatarQtd(dep.quantidade)}
                                  </Typography>
                                  {dep.valor_venda > 0 && (
                                    <Typography variant="caption" display="block">
                                      Venda: {formatarMoeda(dep.valor_venda)}
                                    </Typography>
                                  )}
                                  {dep.custo_medio > 0 && (
                                    <Typography variant="caption" display="block">
                                      Custo médio: {formatarMoeda(dep.custo_medio)}
                                    </Typography>
                                  )}
                                </Box>
                              }
                              arrow
                            >
                              <Chip
                                label={`${dep.nome_deposito}: ${formatarQtd(dep.quantidade)}`}
                                size="small"
                                variant="filled"
                                color={Number(dep.quantidade) > 0 ? 'default' : 'error'}
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
