import React, { useState, useEffect } from 'react'
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
  Alert,
  Divider,
  Card,
  CardContent,
  Tooltip,
  Chip,
  LinearProgress
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
import BotaoVoltarInicio from './BotaoVoltarInicio'
import VendaImpressao from './VendaImpressao'
import useVendaImpressao from '../hooks/useVendaImpressao'
import { useVendaManager } from '../hooks/useVendaManager'

// Modelo base para nova venda
const novaVenda = () => ({
  id: null,
  numero_documento: '',
  data_venda: new Date().toISOString().split('T')[0],
  id_operacao: '',
  id_cliente: '',
  id_vendedor: '',
  observacoes: '',
  desconto: 0,
  valor_total: 0,
  status: 'ABERTA'
})

// Modelo base para novo item
const novoItem = () => ({
  id: null,
  id_produto: '',
  codigo_produto: '',
  nome_produto: '',
  quantidade: 1,
  valor_unitario: 0,
  desconto: 0,
  subtotal: 0
})

export default function VendaSystem() {
  // Hooks
  const vendaManager = useVendaManager()
  const { componentRef, handlePrint, baixarPDF, compartilharWhatsApp } = useVendaImpressao()

  // Estados principais
  const [venda, setVenda] = useState(novaVenda())
  const [itens, setItens] = useState([novoItem()])
  const [editMode, setEditMode] = useState(false)

  // Estados de dados
  const [operacoes, setOperacoes] = useState([])
  const [clientes, setClientes] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [produtos, setProdutos] = useState([])
  const [vendas, setVendas] = useState([])

  // Estados de interface
  const [showList, setShowList] = useState(false)
  const [showImpressao, setShowImpressao] = useState(false)
  const [vendaSelecionada, setVendaSelecionada] = useState(null)

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: '',
    id_cliente: '',
    id_vendedor: '',
    numero: ''
  })

  // Carregamento inicial
  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const dados = await vendaManager.carregarDadosBasicos()
      setOperacoes(dados.operacoes)
      setClientes(dados.clientes)
      setVendedores(dados.vendedores)
      setProdutos(dados.produtos)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const carregarListaVendas = async () => {
    try {
      const vendasData = await vendaManager.carregarVendas(filtros)
      setVendas(vendasData)
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
    }
  }

  // função para adicionar item
  const adicionarItem = () => {
    setItens([...itens, novoItem()])
  }

  // função para remover item
  const removerItem = (index) => {
    if (itens.length > 1) {
      const novosItens = itens.filter((_, i) => i !== index)
      setItens(novosItens)
      atualizarTotais(novosItens)
    }
  }

  // função para atualizar item
  const atualizarItem = (index, campo, valor) => {
    const novosItens = [...itens]
    novosItens[index] = { ...novosItens[index], [campo]: valor }
    
    // Calcular subtotal automaticamente
    if (['quantidade', 'valor_unitario', 'desconto'].includes(campo)) {
      const item = novosItens[index]
      const quantidade = parseFloat(item.quantidade) || 0
      const valorUnitario = parseFloat(item.valor_unitario) || 0
      const desconto = parseFloat(item.desconto) || 0
      
      item.subtotal = Math.max(0, (quantidade * valorUnitario) - desconto)
    }
    
    setItens(novosItens)
    atualizarTotais(novosItens)
  }

  // função para atualizar totais
  const atualizarTotais = (itensParaCalcular = itens) => {
    const { valorTotal } = vendaManager.calcularTotais(itensParaCalcular, venda.desconto)
    setVenda(prev => ({ ...prev, valor_total: valorTotal }))
  }

  // função para salvar venda
  const salvarVenda = async () => {
    try {
      const dadosVenda = {
        ...venda,
        itens: itens.filter(item => item.id_produto)
      }

      await vendaManager.salvarVenda(dadosVenda, editMode)
      
      // Limpar formulário
      setVenda(novaVenda())
      setItens([novoItem()])
      setEditMode(false)
      
      // Recarregar lista se estiver aberta
      if (showList) {
        carregarListaVendas()
      }
    } catch (error) {
      console.error('Erro ao salvar venda:', error)
    }
  }

  // função para editar venda
  const editarVenda = async (vendaData) => {
    try {
      const vendaCompleta = await vendaManager.carregarVenda(vendaData.id)
      
      setVenda(vendaCompleta)
      setItens(vendaCompleta.itens && vendaCompleta.itens.length > 0 ? vendaCompleta.itens : [novoItem()])
      setEditMode(true)
      setShowList(false)
      
      vendaManager.setMessage({ type: 'success', text: `Editando venda #${vendaCompleta.id}` })
    } catch (error) {
      console.error('Erro ao carregar venda para ediçéo:', error)
    }
  }

  // função para excluir venda
  const excluirVenda = async (id) => {
    if (!window.confirm('Confirma a exclusão desta venda?')) return

    try {
      await vendaManager.excluirVenda(id)
      carregarListaVendas()
    } catch (error) {
      console.error('Erro ao excluir venda:', error)
    }
  }

  // função para cancelar ediçéo
  const cancelarEdicao = () => {
    setVenda(novaVenda())
    setItens([novoItem()])
    setEditMode(false)
    vendaManager.setMessage({ type: 'info', text: 'Ediçéo cancelada' })
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
      valor_final: vendaData.valor_total,
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
      valueFormatter: (params) => {
        try {
          return new Date(params.value).toLocaleDateString('pt-BR')
        } catch {
          return params.value
        }
      }
    },
    { 
      field: 'cliente', 
      headerName: 'Cliente', 
      width: 200,
      valueGetter: (params) => {
        const cliente = clientes.find(cl => cl.id === params.row.id_cliente)
        return cliente?.nome || cliente?.razao_social || 'N/A'
      }
    },
    { 
      field: 'vendedor', 
      headerName: 'Vendedor', 
      width: 150,
      valueGetter: (params) => {
        const vendedor = vendedores.find(vd => vd.id === params.row.id_vendedor)
        return vendedor?.nome || 'N/A'
      }
    },
    { 
      field: 'valor_total', 
      headerName: 'Valor Total', 
      width: 120,
      valueFormatter: (params) => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(params.value || 0)
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'ABERTA'} 
          color={params.value === 'FINALIZADA' ? 'success' : 'warning'}
          size="small"
        />
      )
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

  return (
    <Container maxWidth="xl">
      {/* Barra de progresso */}
      {vendaManager.loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Sistema de Vendas
        </Typography>
        <BotaoVoltarInicio variant="buttons" />
      </Box>

      {/* Formulário Principal */}
      <Paper sx={{ p: 3, mb: 2 }}>
        {/* cabeçalho do formulário */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            {editMode ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon color="warning" />
                Editando Venda #{venda.id}
              </Box>
            ) : (
              'Nova Venda'
            )}
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<SearchIcon />}
              onClick={() => {
                setShowList(true)
                carregarListaVendas()
              }}
              sx={{ mr: 1 }}
            >
              Ver Vendas
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              onClick={carregarDados}
              disabled={vendaManager.loading}
            >
              Atualizar
            </Button>
          </Box>
        </Box>

        {/* Mensagens */}
        {vendaManager.message && (
          <Alert 
            severity={vendaManager.message.type} 
            sx={{ mb: 2 }} 
            onClose={() => vendaManager.clearMessages()}
          >
            {vendaManager.message.text}
          </Alert>
        )}

        {/* Dados principais da venda */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth required>
              <InputLabel>Operação</InputLabel>
              <Select
                value={venda.id_operacao}
                onChange={(e) => setVenda(prev => ({ ...prev, id_operacao: e.target.value }))}
                label="Operação"
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

        {/* Seçéo de Produtos */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Produtos</Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            onClick={adicionarItem}
            size="small"
          >
            Adicionar Item
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Produto</TableCell>
                <TableCell width={100}>Qtd</TableCell>
                <TableCell width={120}>Valor Unit.</TableCell>
                <TableCell width={100}>Desconto</TableCell>
                <TableCell width={120}>Subtotal</TableCell>
                <TableCell width={60}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itens.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Autocomplete
                      options={produtos}
                      getOptionLabel={(produto) => 
                        `${produto.codigo_produto || ''} - ${produto.nome_produto || produto.nome || ''}`
                      }
                      value={produtos.find(p => p.id === item.id_produto) || null}
                      onChange={(event, newValue) => {
                        if (newValue) {
                          atualizarItem(index, 'id_produto', newValue.id)
                          atualizarItem(index, 'codigo_produto', newValue.codigo_produto || '')
                          atualizarItem(index, 'nome_produto', newValue.nome_produto || newValue.nome || '')
                          atualizarItem(index, 'valor_unitario', newValue.preco_venda || newValue.valor_unitario || 0)
                        } else {
                          atualizarItem(index, 'id_produto', '')
                          atualizarItem(index, 'codigo_produto', '')
                          atualizarItem(index, 'nome_produto', '')
                          atualizarItem(index, 'valor_unitario', 0)
                        }
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
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Card sx={{ minWidth: 350 }}>
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
                      atualizarTotais()
                    }}
                    inputProps={{ min: 0, step: 0.01 }}
                    fullWidth
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
              onClick={cancelarEdicao}
            >
              Cancelar Ediçéo
            </Button>
          )}
          
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={salvarVenda}
            disabled={vendaManager.loading}
          >
            {editMode ? 'Atualizar Venda' : 'Salvar Venda'}
          </Button>
        </Box>
      </Paper>

      {/* Modal de Listagem */}
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
                  value={filtros.data_inicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Data Fim"
                  type="date"
                  value={filtros.data_fim}
                  onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  options={clientes}
                  getOptionLabel={(cliente) => cliente.nome || cliente.razao_social || ''}
                  value={clientes.find(cl => cl.id === filtros.id_cliente) || null}
                  onChange={(event, newValue) => {
                    setFiltros(prev => ({ ...prev, id_cliente: newValue?.id || '' }))
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
                  onClick={() => carregarListaVendas()}
                  disabled={vendaManager.loading}
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
              loading={vendaManager.loading}
              localeText={{
                noRowsLabel: 'Nenhuma venda encontrada',
                footerRowSelected: (count) => `${count} linha(s) selecionada(s)`
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal de Impressão */}
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