import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Divider,
  Card,
  CardContent,
  Tooltip
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  WhatsApp as WhatsAppIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { DataGrid } from '@mui/x-data-grid'
import { useAuth } from '../context/AuthContext'
import { useMenuState } from '../context/MenuStateContext'
import BotaoVoltarInicio from './BotaoVoltarInicio'
import VendaImpressao from './VendaImpressao'
import useVendaImpressao from '../hooks/useVendaImpressao'

// Interfaces/Types para TypeScript-like structure
const VendaModel = {
  id: null,
  numero_documento: '',
  data_venda: new Date().toISOString().split('T')[0],
  id_operacao: '',
  id_cliente: '',
  id_vendedor: '',
  observacoes: '',
  desconto: 0,
  taxa_entrega: 0,
  valor_total: 0,
  status: 'ABERTA', // ABERTA, FINALIZADA, CANCELADA
  itens: []
}

const ItemVendaModel = {
  id: null,
  id_produto: '',
  codigo_produto: '',
  nome_produto: '',
  quantidade: 1,
  valor_unitario: 0,
  desconto: 0,
  subtotal: 0
}

export default function VendaNova() {
  const { axiosInstance } = useAuth()
  const { desabilitarMenus, habilitarMenus } = useMenuState()

  // Estados principais
  const [venda, setVenda] = useState({ ...VendaModel })
  const [itens, setItens] = useState([{ ...ItemVendaModel }])
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showList, setShowList] = useState(false)
  const [message, setMessage] = useState(null)

  // Estados para listas de referência
  const [operacoes, setOperacoes] = useState([])
  const [clientes, setClientes] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [produtos, setProdutos] = useState([])
  const [vendas, setVendas] = useState([])

  // Estados para filtros da listagem
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    cliente: '',
    vendedor: '',
    numero: '',
    valorMin: '',
    valorMax: ''
  })

  // Hook para impressão
  const { 
    componentRef, 
    handlePrint, 
    baixarPDF, 
    compartilharWhatsApp 
  } = useVendaImpressao()

  // Estados para controle de diálogos
  const [showImpressao, setShowImpressao] = useState(false)
  const [vendaSelecionada, setVendaSelecionada] = useState(null)

  // Carregamento inicial dos dados
  useEffect(() => {
    carregarDadosIniciais()
  }, [])

  // Recalcular total quando itens, desconto ou taxa mudam
  useEffect(() => {
    calcularTotais()
  }, [calcularTotais])

  const carregarDadosIniciais = async () => {
    setLoading(true)
    try {
      const [operacoesRes, clientesRes, vendedoresRes, produtosRes] = await Promise.all([
        axiosInstance.get('/operacoes/'),
        axiosInstance.get('/clientes/'),
        axiosInstance.get('/vendedores/'),
        axiosInstance.get('/produtos/')
      ])

      setOperacoes(operacoesRes.data.results || operacoesRes.data || [])
      setClientes(clientesRes.data.results || clientesRes.data || [])
      setVendedores(vendedoresRes.data.results || vendedoresRes.data || [])
      setProdutos(produtosRes.data.results || produtosRes.data || [])

      console.log('✅ Dados carregados:', {
        operacoes: operacoesRes.data.length || 0,
        clientes: clientesRes.data.length || 0,
        vendedores: vendedoresRes.data.length || 0,
        produtos: produtosRes.data.length || 0
      })
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar dados iniciais' })
    } finally {
      setLoading(false)
    }
  }

  const carregarVendas = async (filtros = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (filtros.dataInicio) params.append('data_inicio', filtros.dataInicio)
      if (filtros.dataFim) params.append('data_fim', filtros.dataFim)
      if (filtros.cliente) params.append('id_cliente', filtros.cliente)
      if (filtros.vendedor) params.append('id_vendedor', filtros.vendedor)
      if (filtros.numero) params.append('numero', filtros.numero)
      if (filtros.valorMin) params.append('valor_min', filtros.valorMin)
      if (filtros.valorMax) params.append('valor_max', filtros.valorMax)

      const response = await axiosInstance.get(`/vendas/?${params.toString()}`)
      setVendas(response.data.results || response.data || [])
    } catch (error) {
      console.error('❌ Erro ao carregar vendas:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar vendas' })
    } finally {
      setLoading(false)
    }
  }

  // função para adicionar item
  const adicionarItem = () => {
    setItens([...itens, { ...ItemVendaModel }])
  }

  // função para remover item
  const removerItem = (index) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index))
    }
  }

  // função para atualizar item
  const atualizarItem = (index, campo, valor) => {
    const novosItens = [...itens]
    novosItens[index] = { ...novosItens[index], [campo]: valor }
    
    // Recalcular subtotal
    if (campo === 'quantidade' || campo === 'valor_unitario' || campo === 'desconto') {
      const item = novosItens[index]
      const quantidade = parseFloat(item.quantidade) || 0
      const valorUnitario = parseFloat(item.valor_unitario) || 0
      const desconto = parseFloat(item.desconto) || 0
      
      item.subtotal = (quantidade * valorUnitario) - desconto
    }
    
    setItens(novosItens)
    calcularTotais(novosItens)
  }

  // função para calcular totais
  const calcularTotais = useCallback((itensCalcular, descontoCalcular, taxaCalcular) => {
    const itensUsar = itensCalcular !== undefined ? itensCalcular : itens
    const descontoUsar = descontoCalcular !== undefined ? descontoCalcular : venda.desconto
    const taxaUsar = taxaCalcular !== undefined ? taxaCalcular : venda.taxa_entrega
    
    const subtotal = itensUsar.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0)
    const descontoGeral = parseFloat(descontoUsar) || 0
    const taxaEntrega = parseFloat(taxaUsar) || 0
    const valorTotal = subtotal - descontoGeral + taxaEntrega
    
    console.log('📊 Cálculo de Total:', { subtotal, descontoGeral, taxaEntrega, valorTotal })
    
    setVenda(prev => ({ ...prev, valor_total: valorTotal }))
  }, [venda.desconto, venda.taxa_entrega, itens])

  // função para salvar venda
  const salvarVenda = async () => {
    try {
      // Validações
      if (!venda.id_operacao) {
        setMessage({ type: 'error', text: 'Operação é obrigatória' })
        return
      }
      if (!venda.id_cliente) {
        setMessage({ type: 'error', text: 'Cliente é obrigatório' })
        return
      }
      if (!venda.id_vendedor) {
        setMessage({ type: 'error', text: 'Vendedor é obrigatório' })
        return
      }
      if (itens.length === 0 || !itens.some(item => item.id_produto)) {
        setMessage({ type: 'error', text: 'Pelo menos um produto é obrigatório' })
        return
      }

      setLoading(true)

      const dadosVenda = {
        ...venda,
        itens: itens.filter(item => item.id_produto)
      }

      let response
      if (editMode && venda.id) {
        response = await axiosInstance.put(`/vendas/${venda.id}/`, dadosVenda)
        setMessage({ type: 'success', text: 'Venda atualizada com sucesso!' })
      } else {
        response = await axiosInstance.post('/vendas/', dadosVenda)
        setMessage({ type: 'success', text: 'Venda criada com sucesso!' })
      }

      // Limpar formulário
      setVenda({ ...VendaModel })
      setItens([{ ...ItemVendaModel }])
      setEditMode(false)

      // Recarregar lista se estiver aberta
      if (showList) {
        carregarVendas(filtros)
      }

    } catch (error) {
      console.error('❌ Erro ao salvar venda:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Erro ao salvar venda' 
      })
    } finally {
      setLoading(false)
    }
  }

  // função para editar venda
  const editarVenda = async (vendaData) => {
    try {
      // Buscar dados completos da venda
      const response = await axiosInstance.get(`/vendas/${vendaData.id}/`)
      const vendaCompleta = response.data

      setVenda(vendaCompleta)
      setItens(vendaCompleta.itens || [{ ...ItemVendaModel }])
      // Recalcular totais com os itens carregados (usar timeout para garantir setState aplicado)
      setTimeout(() => calcularTotais(vendaCompleta.itens || [{ ...ItemVendaModel }]), 0)
      setEditMode(true)
      setShowList(false)
      
      setMessage({ type: 'success', text: `Editando venda #${vendaCompleta.id}` })
    } catch (error) {
      console.error('❌ Erro ao carregar venda para ediçéo:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar venda para ediçéo' })
    }
  }

  // função para excluir venda
  const excluirVenda = async (id) => {
    if (!window.confirm('Confirma a exclusão desta venda?')) return

    try {
      await axiosInstance.delete(`/vendas/${id}/`)
      setMessage({ type: 'success', text: 'Venda excluída com sucesso!' })
      carregarVendas(filtros)
    } catch (error) {
      console.error('❌ Erro ao excluir venda:', error)
      setMessage({ type: 'error', text: 'Erro ao excluir venda' })
    }
  }

  // função para preparar dados para impressão
  const prepararDadosImpressao = (vendaData) => {
    const operacao = operacoes.find(op => op.id === vendaData.id_operacao)
    const cliente = clientes.find(cl => cl.id === vendaData.id_cliente)
    const vendedor = vendedores.find(vd => vd.id === vendaData.id_vendedor)

    return {
      numero_venda: vendaData.numero_documento || vendaData.id,
      data_venda: vendaData.data_venda,
      cliente: cliente || { nome: 'Cliente não encontrado' },
      vendedor: vendedor || { nome: 'Vendedor não encontrado' },
      operacao: operacao || { nome_operacao: 'Operação não encontrada' },
      empresa: {
        nome: 'MINHA EMPRESA LTDA',
        cnpj: '00.123.456/0001-78',
        endereco: 'Av. Principal, 456 - Centro',
        telefone: '(11) 1234-5678'
      },
      produtos: vendaData.itens || [],
      valor_total: vendaData.valor_total,
      desconto: vendaData.desconto,
      taxa_entrega: vendaData.taxa_entrega || 0,
      valor_final: (vendaData.valor_total !== undefined && vendaData.valor_total !== null) ? vendaData.valor_total : ((vendaData.itens || []).reduce((s, i) => s + (parseFloat(i.subtotal || 0)), 0) - (parseFloat(vendaData.desconto || 0)) + (parseFloat(vendaData.taxa_entrega || 0))),
      observacoes: vendaData.observacoes || ''
    }
  }

  // Colunas da DataGrid
  const colunas = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'numero_documento', headerName: 'Número', width: 120 },
    { 
      field: 'data_venda', 
      headerName: 'Data', 
      width: 120,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('pt-BR')
    },
    { 
      field: 'cliente', 
      headerName: 'Cliente', 
      width: 200,
      valueGetter: (params) => {
        const cliente = clientes.find(cl => cl.id === params.row.id_cliente)
        return cliente?.nome || cliente?.razao_social || 'Cliente não encontrado'
      }
    },
    { 
      field: 'vendedor', 
      headerName: 'Vendedor', 
      width: 150,
      valueGetter: (params) => {
        const vendedor = vendedores.find(vd => vd.id === params.row.id_vendedor)
        return vendedor?.nome || 'Vendedor não encontrado'
      }
    },
    { 
      field: 'valor_total', 
      headerName: 'Valor Total', 
      width: 120,
      valueFormatter: (params) => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format((params.value || 0) + (params.row.taxa_entrega || 0))
    },
    {
      field: 'acoes',
      headerName: 'Ações',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => editarVenda(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton size="small" onClick={() => excluirVenda(params.row.id)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Imprimir">
            <IconButton 
              size="small" 
              onClick={() => {
                const dados = prepararDadosImpressao(params.row)
                setVendaSelecionada(dados)
                setShowImpressao(true)
              }}
            >
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  // Render do formulário de venda
  const renderFormularioVenda = () => (
    <Paper sx={{ p: 3, mb: 2 }}>
      {/* cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          {editMode ? `Editando Venda #${venda.id}` : 'Nova Venda'}
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<SearchIcon />}
            onClick={() => {
              setShowList(true)
              carregarVendas(filtros)
            }}
            sx={{ mr: 1 }}
          >
            Ver Vendas
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={carregarDadosIniciais}
          >
            Atualizar
          </Button>
        </Box>
      </Box>

      {/* Alerta de ediçéo */}
      {editMode && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Você está editando a venda #{venda.id}. Altere os dados necessários e clique em "Salvar".
        </Alert>
      )}

      {/* Mensagens */}
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Primeira linha - Dados principais */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Operação *</InputLabel>
            <Select
              value={venda.id_operacao}
              onChange={(e) => setVenda(prev => ({ ...prev, id_operacao: e.target.value }))}
              required
            >
              {operacoes.map(op => (
                <MenuItem key={op.id} value={op.id}>
                  {op.nome_operacao || op.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <Autocomplete
            options={clientes}
            getOptionLabel={(cliente) => cliente.nome || cliente.razao_social || ''}
            value={clientes.find(cl => cl.id === venda.id_cliente) || null}
            onChange={(event, newValue) => {
              setVenda(prev => ({ ...prev, id_cliente: newValue?.id || '' }))
            }}
            renderInput={(params) => (
              <TextField {...params} label="Cliente *" required />
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Autocomplete
            options={vendedores}
            getOptionLabel={(vendedor) => vendedor.nome || ''}
            value={vendedores.find(vd => vd.id === venda.id_vendedor) || null}
            onChange={(event, newValue) => {
              setVenda(prev => ({ ...prev, id_vendedor: newValue?.id || '' }))
            }}
            renderInput={(params) => (
              <TextField {...params} label="Vendedor *" required />
            )}
          />
        </Grid>

        {/* Segunda linha - Data e observações */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Data da Venda"
            value={venda.data_venda}
            onChange={(e) => setVenda(prev => ({ ...prev, data_venda: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Observações"
            value={venda.observacoes}
            onChange={(e) => setVenda(prev => ({ ...prev, observacoes: e.target.value }))}
            multiline
            rows={2}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Produtos */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Produtos
        <Button 
          size="small" 
          startIcon={<AddIcon />} 
          onClick={adicionarItem}
          sx={{ ml: 2 }}
        >
          Adicionar Item
        </Button>
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Produto</TableCell>
              <TableCell width={100}>Quantidade</TableCell>
              <TableCell width={120}>Valor Unit.</TableCell>
              <TableCell width={100}>Desconto</TableCell>
              <TableCell width={120}>Subtotal</TableCell>
              <TableCell width={60}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {itens.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Autocomplete
                    options={produtos}
                    getOptionLabel={(produto) => `${produto.codigo_produto || ''} - ${produto.nome_produto || produto.nome || ''}`}
                    value={produtos.find(p => p.id === item.id_produto) || null}
                    onChange={(event, newValue) => {
                      atualizarItem(index, 'id_produto', newValue?.id || '')
                      atualizarItem(index, 'codigo_produto', newValue?.codigo_produto || '')
                      atualizarItem(index, 'nome_produto', newValue?.nome_produto || newValue?.nome || '')
                      atualizarItem(index, 'valor_unitario', newValue?.preco_venda || newValue?.valor_unitario || 0)
                    }}
                    renderInput={(params) => (
                      <TextField {...params} size="small" placeholder="Selecione um produto" />
                    )}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={item.valor_unitario}
                    onChange={(e) => atualizarItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={item.desconto}
                    onChange={(e) => atualizarItem(index, 'desconto', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(item.subtotal || 0)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    onClick={() => removerItem(index)}
                    disabled={itens.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totais */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Card sx={{ minWidth: 300 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Subtotal:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography align="right">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(itens.reduce((acc, item) => acc + (item.subtotal || 0), 0))}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="Desconto Geral"
                  type="number"
                  size="small"
                  value={venda.desconto}
                  onChange={(e) => {
                    const desconto = parseFloat(e.target.value) || 0
                    setVenda(prev => ({ ...prev, desconto }))
                    calcularTotais()
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography align="right" color="error">
                  -{new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(venda.desconto || 0)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  label="Taxa de Entrega"
                  type="number"
                  size="small"
                  value={venda.taxa_entrega}
                  onChange={(e) => {
                    const taxaEntrega = parseFloat(e.target.value) || 0
                    setVenda(prev => ({ ...prev, taxa_entrega: taxaEntrega }))
                    calcularTotais()
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography align="right" color="success.main">
                  +{new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(venda.taxa_entrega || 0)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="h6">Total:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" align="right" color="primary">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(venda.valor_total || 0)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Botões de ação */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {editMode && (
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => {
              setVenda({ ...VendaModel })
              setItens([{ ...ItemVendaModel }])
              setEditMode(false)
              setMessage({ type: 'info', text: 'Ediçéo cancelada' })
            }}
          >
            Cancelar Ediçéo
          </Button>
        )}
        
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={salvarVenda}
          disabled={loading}
        >
          {editMode ? 'Atualizar Venda' : 'Salvar Venda'}
        </Button>
      </Box>
    </Paper>
  )

  // Render da listagem de vendas
  const renderListagemVendas = () => (
    <Dialog
      open={showList}
      onClose={() => setShowList(false)}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Listagem de Vendas</Typography>
          <IconButton onClick={() => setShowList(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Filtros</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Data Início"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Data Fim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={clientes}
                getOptionLabel={(cliente) => cliente.nome || cliente.razao_social || ''}
                value={clientes.find(cl => cl.id === filtros.cliente) || null}
                onChange={(event, newValue) => {
                  setFiltros(prev => ({ ...prev, cliente: newValue?.id || '' }))
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Cliente" size="small" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => carregarVendas(filtros)}
                disabled={loading}
              >
                Filtrar
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* DataGrid */}
        <Box sx={{ height: 400 }}>
          <DataGrid
            rows={vendas}
            columns={colunas}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            loading={loading}
            localeText={{
              noRowsLabel: 'Nenhuma venda encontrada',
              footerRowSelected: (count) => `${count} linha(s) selecionada(s)`
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  )

  // Render principal
  return (
    <Container maxWidth="xl">
      {/* cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Sistema de Vendas
        </Typography>
        <BotaoVoltarInicio variant="buttons" />
      </Box>

      {/* Formulário de venda */}
      {renderFormularioVenda()}

      {/* Listagem de vendas */}
      {renderListagemVendas()}

      {/* Modal de impressão */}
      <Dialog
        open={showImpressao}
        onClose={() => setShowImpressao(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Prévia de Impressão</Typography>
            <Box>
              <IconButton onClick={() => handlePrint()}>
                <PrintIcon />
              </IconButton>
              <IconButton onClick={() => baixarPDF()}>
                <PdfIcon />
              </IconButton>
              <IconButton onClick={() => compartilharWhatsApp()}>
                <WhatsAppIcon />
              </IconButton>
              <IconButton onClick={() => setShowImpressao(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <div ref={componentRef}>
            {vendaSelecionada && <VendaImpressao dadosVenda={vendaSelecionada} />}
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  )
}