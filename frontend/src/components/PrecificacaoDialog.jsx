import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Alert,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Tooltip,
  Stack
} from '@mui/material'
import {
  Calculate as CalculateIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material'

const PrecificacaoDialog = ({ open, onClose, itens, onAplicar, axiosInstance }) => {
  const [tipoCalculo, setTipoCalculo] = useState('margem') // 'margem' ou 'markup'
  const [percentualPadrao, setPercentualPadrao] = useState('30')
  const [itensCalculados, setItensCalculados] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(null)

  // Inicializa itens quando o dialog abre
  useEffect(() => {
    if (open && itens && itens.length > 0) {
      const itensIniciais = itens.map(item => ({
        ...item,
        percentual: percentualPadrao,
        valor_venda_sugerido: null,
        margem_percentual: null,
        markup_percentual: null
      }))
      setItensCalculados(itensIniciais)
    }
  }, [open, itens, percentualPadrao])

  const calcularPrecificacao = async () => {
    if (!itensCalculados || itensCalculados.length === 0) {
      setErro('Nenhum item para calcular')
      return
    }

    setLoading(true)
    setErro(null)

    try {
      const payload = {
        itens: itensCalculados.map(item => {
          const isDeb = item.is_nota_debito || (item.custo_origem !== undefined && item.custo_origem !== null && item.custo_origem > 0);
          const cOrig = parseFloat(item.custo_origem || 0);
          const vDeb = parseFloat(item.valor_debito || item.valor_unitario || 0);
          const cTotal = isDeb ? (cOrig + vDeb) : vDeb;
          return {
            id_produto: item.id_produto,
            valor_compra: cTotal || 0,
            tipo_calculo: tipoCalculo,
            percentual: parseFloat(item.percentual) || 0
          };
        })
      }

      const response = await axiosInstance.post('/compras/calcular-precificacao/', payload)

      if (response.data && response.data.itens) {
        // Mescla os resultados com os itens existentes
        const itensAtualizados = itensCalculados.map((item, index) => {
          const resultado = response.data.itens[index]
          if (resultado && !resultado.erro) {
            return {
              ...item,
              valor_venda_sugerido: resultado.valor_venda_sugerido,
              margem_percentual: resultado.margem_percentual,
              markup_percentual: resultado.markup_percentual
            }
          }
          return { ...item, erro: resultado?.erro }
        })
        setItensCalculados(itensAtualizados)
        setSucesso('Precificação calculada com sucesso!')
      }
    } catch (err) {
      console.error('Erro ao calcular precificação:', err)
      setErro(err.response?.data?.error || 'Erro ao calcular precificação')
    } finally {
      setLoading(false)
    }
  }

  const aplicarPrecificacao = async () => {
    if (!itensCalculados || itensCalculados.length === 0) {
      setErro('Nenhum item para aplicar')
      return
    }

    // Verifica se todos os itens têm valor de venda calculado
    const itensSemCalculo = itensCalculados.filter(item => !item.valor_venda_sugerido)
    if (itensSemCalculo.length > 0) {
      setErro('Calcule a precificação antes de aplicar')
      return
    }

    setLoading(true)
    setErro(null)

    try {
      const payload = {
        itens: itensCalculados.map(item => {
          const isDeb = item.is_nota_debito || (item.custo_origem !== undefined && item.custo_origem !== null && item.custo_origem > 0);
          const cOrig = parseFloat(item.custo_origem || 0);
          const vDeb = parseFloat(item.valor_debito || item.valor_unitario || 0);
          const cTotal = isDeb ? (cOrig + vDeb) : vDeb;
          return {
            id_produto: item.id_produto,
            id_deposito: 1, // Depósito padrão
            valor_venda: parseFloat(item.valor_venda_sugerido),
            valor_custo: cTotal
          };
        })
      }

      const response = await axiosInstance.post('/compras/aplicar-precificacao/', payload)

      if (response.data) {
        setSucesso(`Precificação aplicada: ${response.data.total_atualizados} itens atualizados`)

        // Chama callback se fornecido
        if (onAplicar) {
          onAplicar(itensCalculados)
        }

        // Fecha o dialog após 2 segundos
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (err) {
      console.error('Erro ao aplicar precificação:', err)
      setErro(err.response?.data?.error || 'Erro ao aplicar precificação')
    } finally {
      setLoading(false)
    }
  }

  const handlePercentualChange = (index, novoPercentual) => {
    const novosItens = [...itensCalculados]
    novosItens[index].percentual = novoPercentual
    setItensCalculados(novosItens)
  }

  const aplicarPercentualTodos = () => {
    const novosItens = itensCalculados.map(item => ({
      ...item,
      percentual: percentualPadrao
    }))
    setItensCalculados(novosItens)
  }

  const formatarMoeda = (valor) => {
    if (!valor) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(valor))
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h6">Precificação de Compra</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {erro && (
          <Alert severity="error" onClose={() => setErro(null)} sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        {sucesso && (
          <Alert severity="success" onClose={() => setSucesso(null)} sx={{ mb: 2 }}>
            {sucesso}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Tipo de Cálculo</FormLabel>
              <RadioGroup
                row
                value={tipoCalculo}
                onChange={(e) => setTipoCalculo(e.target.value)}
              >
                <FormControlLabel
                  value="margem"
                  control={<Radio />}
                  label={
                    <Tooltip title="Margem: % de lucro sobre o preço de venda. Ex: Margem 30% - Custo R$100 = Venda R$142,86">
                      <span>Margem (%)</span>
                    </Tooltip>
                  }
                />
                <FormControlLabel
                  value="markup"
                  control={<Radio />}
                  label={
                    <Tooltip title="Markup: % adicionada ao custo. Ex: Markup 40% - Custo R$100 = Venda R$140,00">
                      <span>Markup (%)</span>
                    </Tooltip>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Percentual Padrão"
              type="number"
              value={percentualPadrao}
              onChange={(e) => setPercentualPadrao(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={aplicarPercentualTodos}
                      variant="outlined"
                    >
                      Aplicar a Todos
                    </Button>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>

        {(() => {
          const temNotaDebito = itensCalculados.some(i => i.is_nota_debito || (i.custo_origem !== undefined && i.custo_origem !== null && i.custo_origem > 0));
          return (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    {temNotaDebito ? (
                      <>
                        <TableCell align="right">Custo Origem</TableCell>
                        <TableCell align="right">Vlr. Nota Débito</TableCell>
                        <TableCell align="right">Custo Total</TableCell>
                      </>
                    ) : (
                      <TableCell align="right">Custo</TableCell>
                    )}
                    <TableCell align="center">% {tipoCalculo === 'margem' ? 'Margem' : 'Markup'}</TableCell>
                    <TableCell align="right">Venda Sugerida</TableCell>
                    <TableCell align="center">Margem Real</TableCell>
                    <TableCell align="center">Markup Real</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itensCalculados && itensCalculados.map((item, index) => {
                    const isDebito = item.is_nota_debito || (item.custo_origem !== undefined && item.custo_origem !== null && item.custo_origem > 0);
                    const custoOrigem = parseFloat(item.custo_origem || 0);
                    const valorDebito = parseFloat(item.valor_debito || item.valor_unitario || 0);
                    const custoTotalCalculado = isDebito ? (custoOrigem + valorDebito) : valorDebito;

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.nome_produto || `Produto ${item.id_produto}`}
                          </Typography>
                          {isDebito && (
                            <Chip
                              label="📈 Ajuste Complementar (Débito)"
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 18, mt: 0.5 }}
                            />
                          )}
                        </TableCell>

                        {temNotaDebito ? (
                          <>
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                {formatarMoeda(custoOrigem)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                                + {formatarMoeda(valorDebito)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={formatarMoeda(custoTotalCalculado)}
                                size="small"
                                color="success"
                                sx={{ fontWeight: 'bold' }}
                              />
                            </TableCell>
                          </>
                        ) : (
                          <TableCell align="right">
                            <Chip
                              label={formatarMoeda(item.valor_unitario)}
                              size="small"
                              color="default"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                        )}

                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={item.percentual || ''}
                            onChange={(e) => handlePercentualChange(index, e.target.value)}
                            sx={{ width: 110 }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {item.valor_venda_sugerido ? (
                            <Chip
                              label={formatarMoeda(item.valor_venda_sugerido)}
                              size="small"
                              color="success"
                              icon={<AttachMoneyIcon />}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Não calculated
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {item.margem_percentual && (
                            <Chip
                              label={`${item.margem_percentual}%`}
                              size="small"
                              color="info"
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {item.markup_percentual && (
                            <Chip
                              label={`${item.markup_percentual}%`}
                              size="small"
                              color="warning"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          );
        })()}

        <Box sx={{ mt: 2 }}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Dica:</strong> A precificação será aplicada ao estoque dos produtos.
              {tipoCalculo === 'margem'
                ? ' Margem é o lucro sobre o preço de venda final.'
                : ' Markup é o percentual adicionado sobre o custo.'}
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="outlined"
          startIcon={<CalculateIcon />}
          onClick={calcularPrecificacao}
          disabled={loading || !itensCalculados || itensCalculados.length === 0}
        >
          Calcular
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={aplicarPrecificacao}
          disabled={loading || !itensCalculados || itensCalculados.length === 0 || !itensCalculados[0]?.valor_venda_sugerido}
        >
          Aplicar ao Estoque
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PrecificacaoDialog
