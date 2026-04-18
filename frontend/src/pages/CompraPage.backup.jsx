import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  IconButton,
  Paper,
  Divider,
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
  InputAdornment
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import SearchIcon from '@mui/icons-material/Search'
import { useAuth } from '../context/AuthContext'

function CompraPage() {
  const { axiosInstance, user, permissions, isLoading: authLoading } = useAuth()

  // Estados principais
  const [fornecedores, setFornecedores] = useState([])
  const [produtos, setProdutos] = useState([])
  const [operacoes, setOperacoes] = useState([])
  const [compras, setCompras] = useState([])
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(null)

  // Estado do formulário
  const [form, setForm] = useState({
    id_fornecedor: '',
    id_operacao: '',
    numero_documento: '',
    data_entrada: new Date().toISOString().split('T')[0],
    itens: [{ id_produto: '', quantidade: 1, valor_unitario: 0 }]
  })

  // Estado do modal financeiro
  const [modalFinanceiro, setModalFinanceiro] = useState(false)
  const [dadosFinanceiro, setDadosFinanceiro] = useState({
    id_compra: null,
    valor_total: 0,
    numero_parcelas: 1,
    data_vencimento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'Dinheiro'
  })

  // Modal de cadastro de fornecedor
  const [modalFornecedor, setModalFornecedor] = useState(false)
  const [novoFornecedor, setNovoFornecedor] = useState({
    nome_razao_social: '',
    nome_fantasia: '',
    cpf_cnpj: '',
    inscricao_estadual: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    email: '',
    limite_credito: '',
    whatsapp: '',
    data_nascimento: ''
  })

  // Modal de cadastro de produto
  const [modalProduto, setModalProduto] = useState(false)
  const [novoProduto, setNovoProduto] = useState({
    codigo_produto: '',
    nome_produto: '',
    descricao: '',
    unidade_medida: 'UN',
    id_grupo: '',
    marca: '',
    classificacao: '',
    ncm: '',
    tributacao_info: '',
    observacoes: '',
    imagem_url: ''
  })

  // Carrega dados iniciais
  useEffect(() => {
    if (authLoading) return
    carregarDados()
  }, [authLoading])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [fornRes, prodRes, operRes, comprasRes, gruposRes] = await Promise.all([
        axiosInstance.get('/fornecedores/'),
        axiosInstance.get('/produtos/'),
        axiosInstance.get('/operacoes/'),
        axiosInstance.get('/compras/'),
        axiosInstance.get('/grupos-produto/')
      ])

      setFornecedores(fornRes.data || [])
      setProdutos(prodRes.data || [])
      setOperacoes(operRes.data || [])
      setCompras(comprasRes.data?.results || comprasRes.data || [])
      setGrupos(gruposRes.data || [])
      
      console.log('📦 Grupos carregados:', gruposRes.data)
      console.log('📦 Total de grupos:', gruposRes.data?.length || 0)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setErro('Erro ao carregar dados. Tente recarregar a página.')
    } finally {
      setLoading(false)
    }
  }

  // Atualiza campo do item
  const atualizarItem = (index, campo, valor) => {
    const novosItens = [...form.itens]
    novosItens[index] = { ...novosItens[index], [campo]: valor }
    setForm({ ...form, itens: novosItens })
  }

  // Adiciona novo item
  const adicionarItem = () => {
    setForm({
      ...form,
      itens: [...form.itens, { id_produto: '', quantidade: 1, valor_unitario: 0 }]
    })
  }

  // Remove item
  const removerItem = (index) => {
    if (form.itens.length > 1) {
      const novosItens = form.itens.filter((_, i) => i !== index)
      setForm({ ...form, itens: novosItens })
    }
  }

  // Calcula totais
  const calcularTotais = () => {
    let total = 0
    const itensCalculados = form.itens.map(item => {
      const qtd = parseFloat(item.quantidade) || 0
      const valorUnit = parseFloat(item.valor_unitario) || 0
      const subtotal = qtd * valorUnit
      total += subtotal
      return { ...item, subtotal }
    })
    return { itens: itensCalculados, total }
  }

  // Limpa formulário
  const limparFormulario = () => {
    setForm({
      id_fornecedor: '',
      id_operacao: '',
      numero_documento: '',
      data_entrada: new Date().toISOString().split('T')[0],
      itens: [{ id_produto: '', quantidade: 1, valor_unitario: 0 }]
    })
  }

  // Buscar CEP
  const buscarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) {
      alert('CEP inválido. Digite 8 dígitos.')
      return
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (data.erro) {
        alert('CEP não encontrado.')
        return
      }

      setNovoFornecedor(prev => ({
        ...prev,
        endereco: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
        cep: cep
      }))
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      alert('Erro ao buscar CEP. Tente novamente.')
    }
  }

  // Buscar CNPJ
  const buscarCNPJ = async (cnpj) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '')
    if (cnpjLimpo.length !== 14) {
      alert('CNPJ inválido. Digite 14 dígitos.')
      return
    }

    try {
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`)
      const data = await response.json()

      if (data.status === 'ERROR') {
        alert(data.message || 'CNPJ não encontrado.')
        return
      }

      setNovoFornecedor(prev => ({
        ...prev,
        nome_razao_social: data.nome || '',
        nome_fantasia: data.fantasia || '',
        endereco: data.logradouro || '',
        numero: data.numero || '',
        bairro: data.bairro || '',
        cidade: data.municipio || '',
        estado: data.uf || '',
        cep: data.cep?.replace(/\D/g, '') || '',
        telefone: data.telefone || '',
        email: data.email || ''
      }))
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error)
      alert('Erro ao buscar CNPJ. Tente novamente.')
    }
  }

  // Salvar novo fornecedor
  const salvarNovoFornecedor = async () => {
    if (!novoFornecedor.nome_razao_social || !novoFornecedor.cpf_cnpj) {
      alert('Nome/Razão Social e CPF/CNPJ são obrigatórios!')
      return
    }

    try {
      const response = await axiosInstance.post('/fornecedores/', novoFornecedor)
      await carregarDados()
      setForm(prev => ({ ...prev, id_fornecedor: response.data.id_fornecedor }))
      setModalFornecedor(false)
      setNovoFornecedor({
        nome_razao_social: '',
        nome_fantasia: '',
        cpf_cnpj: '',
        inscricao_estadual: '',
        endereco: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        telefone: '',
        email: '',
        limite_credito: '',
        whatsapp: '',
        data_nascimento: ''
      })
      setSucesso('Fornecedor cadastrado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error)
      setErro(error.response?.data?.message || 'Erro ao cadastrar fornecedor')
    }
  }

  // Salvar novo produto
  const salvarNovoProduto = async () => {
    if (!novoProduto.codigo_produto || !novoProduto.nome_produto) {
      alert('Código e Nome do produto são obrigatórios!')
      return
    }

    try {
      const response = await axiosInstance.post('/produtos/', novoProduto)
      await carregarDados()
      setModalProduto(false)
      setNovoProduto({
        codigo_produto: '',
        nome_produto: '',
        descricao: '',
        unidade_medida: 'UN',
        id_grupo: '',
        marca: '',
        classificacao: '',
        ncm: '',
        tributacao_info: '',
        observacoes: '',
        imagem_url: ''
      })
      setSucesso('Produto cadastrado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      setErro(error.response?.data?.message || 'Erro ao cadastrar produto')
    }
  }

  // Salva compra
  const salvarCompra = async (e) => {
    e.preventDefault()
    setErro(null)
    setSucesso(null)

    // Validações
    if (!form.id_operacao) {
      setErro('Selecione uma operação')
      return
    }

    if (form.itens.some(item => !item.id_produto)) {
      setErro('Selecione o produto em todos os itens')
      return
    }

    try {
      const { itens, total } = calcularTotais()

      const payload = {
        id_fornecedor: form.id_fornecedor || null,
        id_operacao: parseInt(form.id_operacao),
        numero_documento: form.numero_documento || '',
        data_entrada: form.data_entrada,
        valor_total: total.toFixed(2),
        itens: itens.map(item => ({
          id_produto: parseInt(item.id_produto),
          quantidade: parseFloat(item.quantidade),
          valor_unitario: parseFloat(item.valor_unitario),
          valor_total: item.subtotal.toFixed(2)
        }))
      }

      const response = await axiosInstance.post('/compras/', payload)

      // Verifica se deve gerar financeiro
      const operacaoSelecionada = operacoes.find(o => o.id_operacao === parseInt(form.id_operacao))
      const geraFinanceiro = operacaoSelecionada?.gera_financeiro || response.data?.gerou_financeiro

      if (geraFinanceiro) {
        // Abre modal para gerar financeiro
        setDadosFinanceiro({
          id_compra: response.data.id_compra,
          valor_total: total,
          numero_parcelas: 1,
          data_vencimento: form.data_entrada,
          forma_pagamento: 'Dinheiro'
        })
        setModalFinanceiro(true)
        setSucesso(`✅ Compra cadastrada! Configure o financeiro.`)
      } else {
        setSucesso(`✅ Compra cadastrada com sucesso! Valor total: R$ ${total.toFixed(2)}`)
      }

      limparFormulario()
      carregarDados()

      setTimeout(() => setSucesso(null), 5000)
    } catch (error) {
      console.error('Erro ao salvar compra:', error)
      setErro('❌ Erro ao salvar compra. Verifique os dados e tente novamente.')
    }
  }

  // Gera contas a pagar
  const gerarFinanceiro = async () => {
    try {
      const valorParcela = (dadosFinanceiro.valor_total / dadosFinanceiro.numero_parcelas).toFixed(2)
      const parcelas = []

      for (let i = 0; i < dadosFinanceiro.numero_parcelas; i++) {
        const dataVencimento = new Date(dadosFinanceiro.data_vencimento)
        dataVencimento.setMonth(dataVencimento.getMonth() + i)

        parcelas.push({
          id_compra_origem: dadosFinanceiro.id_compra,
          tipo_conta: 'Pagar',
          descricao: `Compra #${dadosFinanceiro.id_compra} - Parcela ${i + 1}/${dadosFinanceiro.numero_parcelas}`,
          valor: parseFloat(valorParcela),
          valor_parcela: parseFloat(valorParcela), // Campo adicional
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          data_emissao: new Date().toISOString().split('T')[0],
          status_conta: 'Pendente',
          forma_pagamento: dadosFinanceiro.forma_pagamento,
          gerencial: true // Campo adicional obrigatório
        })
      }

      try {
        for (const parcela of parcelas) {
          await axiosInstance.post('/contas/', parcela)
        }
        setModalFinanceiro(false)
        setSucesso(`✅ ${parcelas.length} conta(s) a pagar gerada(s) com sucesso!`)
        setTimeout(() => setSucesso(null), 5000)
      } catch (error) {
        console.error('Erro detalhado:', error.response?.data)
        setErro(`❌ Erro: ${JSON.stringify(error.response?.data || 'Erro desconhecido')}`)
      }
    } catch (error) {
      console.error('Erro ao gerar financeiro:', error)
      setErro('❌ Erro ao gerar contas a pagar.')
    }
  }

  // Exclui compra
  const excluirCompra = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta compra?')) return

    try {
      await axiosInstance.delete(`/compras/${id}/`)
      setSucesso('✅ Compra excluída com sucesso!')
      carregarDados()
      setTimeout(() => setSucesso(null), 3000)
    } catch (error) {
      console.error('Erro ao excluir:', error)
      setErro('❌ Erro ao excluir compra')
    }
  }

  // Verifica permissões
  if (authLoading || loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  if (!user?.is_staff && !permissions?.clientes_acessar) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Você não tem permissão para acessar esta página.</Alert>
      </Box>
    )
  }

  const { total: totalCompra } = calcularTotais()

  return (
    <Box sx={{ p: 3 }}>
      {/* Mensagens de feedback */}
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

      {/* Formulário de Nova Compra */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
          📦 Nova Compra
        </Typography>

        <form onSubmit={salvarCompra}>
          {/* Dados principais */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  select
                  fullWidth
                  label="Fornecedor"
                  value={form.id_fornecedor}
                  onChange={(e) => setForm({ ...form, id_fornecedor: e.target.value })}
                  size="small"
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  {fornecedores.map((f) => (
                    <MenuItem key={f.id_fornecedor} value={f.id_fornecedor}>
                      {f.nome_razao_social}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="outlined"
                  onClick={() => setModalFornecedor(true)}
                  sx={{ minWidth: '40px' }}
                  title="Cadastrar novo fornecedor"
                >
                  <AddIcon />
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                required
                label="Operação *"
                value={form.id_operacao}
                onChange={(e) => setForm({ ...form, id_operacao: e.target.value })}
                size="small"
              >
                <MenuItem value="">Selecione...</MenuItem>
                {operacoes.map((o) => (
                  <MenuItem key={o.id_operacao} value={o.id_operacao}>
                    {o.nome_operacao || o.id_operacao}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Número do Documento"
                value={form.numero_documento}
                onChange={(e) => setForm({ ...form, numero_documento: e.target.value })}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                required
                type="date"
                label="Data de Entrada *"
                value={form.data_entrada}
                onChange={(e) => setForm({ ...form, data_entrada: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Itens da compra */}
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Itens da Compra
          </Typography>

          {form.itens.map((item, index) => {
            const subtotal = (parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0)

            return (
              <Card key={index} sx={{ mb: 2, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          select
                          fullWidth
                          required
                          label="Produto *"
                          value={item.id_produto}
                          onChange={(e) => atualizarItem(index, 'id_produto', e.target.value)}
                          size="small"
                        >
                          <MenuItem value="">Selecione...</MenuItem>
                          {produtos.map((p) => (
                            <MenuItem key={p.id_produto} value={p.id_produto}>
                              {p.codigo_produto} - {p.nome_produto || p.id_produto}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            console.log('🔍 Abrindo modal produto. Grupos disponíveis:', grupos);
                            console.log('🔍 Total de grupos:', grupos.length);
                            console.log('🔍 Primeiro grupo:', grupos[0]);
                            console.log('🔍 Campos do primeiro grupo:', Object.keys(grupos[0] || {}));
                            setModalProduto(true);
                          }}
                          sx={{ minWidth: '40px' }}
                          title="Cadastrar novo produto"
                        >
                          <AddIcon />
                        </Button>
                      </Box>
                    </Grid>

                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Quantidade *"
                        value={item.quantidade}
                        onChange={(e) => atualizarItem(index, 'quantidade', e.target.value)}
                        inputProps={{ min: 0.01, step: 0.01 }}
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={6} md={2}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Valor Unitário *"
                        value={item.valor_unitario}
                        onChange={(e) => atualizarItem(index, 'valor_unitario', e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={10} md={2}>
                      <TextField
                        fullWidth
                        label="Subtotal"
                        value={`R$ ${subtotal.toFixed(2)}`}
                        InputProps={{ readOnly: true }}
                        size="small"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>

                    <Grid item xs={2} md={1}>
                      <IconButton
                        color="error"
                        onClick={() => removerItem(index)}
                        disabled={form.itens.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )
          })}

          <Button
            startIcon={<AddIcon />}
            onClick={adicionarItem}
            variant="outlined"
            sx={{ mb: 3 }}
          >
            Adicionar Item
          </Button>

          {/* Total */}
          <Box sx={{ bgcolor: 'success.light', p: 2, borderRadius: 1, mb: 3 }}>
            <Typography variant="h5" align="right" sx={{ color: 'success.contrastText', fontWeight: 'bold' }}>
              Valor Total: R$ {totalCompra.toFixed(2)}
            </Typography>
          </Box>

          {/* Botões */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Button
                type="button"
                fullWidth
                variant="outlined"
                onClick={limparFormulario}
                size="large"
              >
                Limpar
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                startIcon={<SaveIcon />}
                size="large"
              >
                Salvar Compra
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Lista de Compras */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          📋 Compras Cadastradas
        </Typography>

        {compras.length === 0 ? (
          <Alert severity="info">Nenhuma compra cadastrada ainda.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fornecedor</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Operação</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Número</TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Valor Total
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data Entrada</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {compras.map((compra) => (
                  <TableRow key={compra.id_compra || compra.id} hover>
                    <TableCell>{compra.id_compra || compra.id}</TableCell>
                    <TableCell>{compra.fornecedor_nome || compra.id_fornecedor || '-'}</TableCell>
                    <TableCell>{compra.operacao_nome || compra.id_operacao || '-'}</TableCell>
                    <TableCell>{compra.numero_documento || '-'}</TableCell>
                    <TableCell align="right">R$ {compra.valor_total}</TableCell>
                    <TableCell>
                      {compra.data_entrada
                        ? new Date(compra.data_entrada).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        color="error"
                        size="small"
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        onClick={() => excluirCompra(compra.id_compra || compra.id)}
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Modal para Gerar Financeiro */}
      <Dialog open={modalFinanceiro} onClose={() => setModalFinanceiro(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          💰 Gerar Contas a Pagar
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Configure as parcelas para a compra #{dadosFinanceiro.id_compra}
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Valor Total"
                value={`R$ ${dadosFinanceiro.valor_total.toFixed(2)}`}
                InputProps={{ readOnly: true }}
                sx={{ bgcolor: 'grey.100' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Número de Parcelas"
                value={dadosFinanceiro.numero_parcelas}
                onChange={(e) => setDadosFinanceiro({ ...dadosFinanceiro, numero_parcelas: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: 48 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor por Parcela"
                value={`R$ ${(dadosFinanceiro.valor_total / dadosFinanceiro.numero_parcelas).toFixed(2)}`}
                InputProps={{ readOnly: true }}
                sx={{ bgcolor: 'grey.100' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Primeiro Vencimento"
                value={dadosFinanceiro.data_vencimento}
                onChange={(e) => setDadosFinanceiro({ ...dadosFinanceiro, data_vencimento: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Forma de Pagamento"
                value={dadosFinanceiro.forma_pagamento}
                onChange={(e) => setDadosFinanceiro({ ...dadosFinanceiro, forma_pagamento: e.target.value })}
              >
                <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                <MenuItem value="PIX">PIX</MenuItem>
                <MenuItem value="Cartéo de Crédito">Cartéo de Crédito</MenuItem>
                <MenuItem value="Cartéo de Débito">Cartéo de Débito</MenuItem>
                <MenuItem value="Boleto">Boleto</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
                <MenuItem value="Transferência">Transferência</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="warning">
                Seréo geradas {dadosFinanceiro.numero_parcelas} conta(s) a pagar com vencimento mensal.
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalFinanceiro(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={gerarFinanceiro}
            startIcon={<AttachMoneyIcon />}
          >
            Gerar Contas a Pagar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Cadastro de Fornecedor */}
      <Dialog open={modalFornecedor} onClose={() => setModalFornecedor(false)} maxWidth="md" fullWidth>
        <DialogTitle>Cadastrar Novo Fornecedor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Nome / Razão Social"
                value={novoFornecedor.nome_razao_social}
                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, nome_razao_social: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome Fantasia"
                value={novoFornecedor.nome_fantasia}
                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, nome_fantasia: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  required
                  label="CPF / CNPJ"
                  value={novoFornecedor.cpf_cnpj}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, cpf_cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
                <Button
                  variant="outlined"
                  onClick={() => buscarCNPJ(novoFornecedor.cpf_cnpj)}
                  disabled={!novoFornecedor.cpf_cnpj || novoFornecedor.cpf_cnpj.replace(/\D/g, '').length !== 14}
                  sx={{ minWidth: '40px' }}
                  title="Buscar CNPJ"
                >
                  <SearchIcon />
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Inscrição Estadual"
                value={novoFornecedor.inscricao_estadual}
                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, inscricao_estadual: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="CEP"
                  value={novoFornecedor.cep}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, cep: e.target.value })}
                  placeholder="00000-000"
                />
                <Button
                  variant="outlined"
                  onClick={() => buscarCEP(novoFornecedor.cep)}
                  disabled={!novoFornecedor.cep || novoFornecedor.cep.replace(/\D/g, '').length !== 8}
                  sx={{ minWidth: '40px' }}
                  title="Buscar CEP"
                >
                  <SearchIcon />
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Endereço"
                value={novoFornecedor.endereco}
                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, endereco: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Número"
                value={novoFornecedor.numero}
                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, numero: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Bairro"
                value={novoFornecedor.bairro}
                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, bairro: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Cidade"
                value={novoFornecedor.cidade}
                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, cidade: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Estado"
                value={novoFornecedor.estado}
                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, estado: e.target.value })}
                inputProps={{ maxLength: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Telefone"
                value={novoFornecedor.telefone}
                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, telefone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="WhatsApp"
                value={novoFornecedor.whatsapp}
                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, whatsapp: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={novoFornecedor.email}
                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Limite de Crédito"
                type="number"
                value={novoFornecedor.limite_credito}
                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, limite_credito: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Data de Nascimento"
                type="date"
                value={novoFornecedor.data_nascimento}
                onChange={(e) => setNovoFornecedor({ ...novoFornecedor, data_nascimento: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalFornecedor(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvarNovoFornecedor} startIcon={<SaveIcon />}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Cadastro de Produto */}
      <Dialog open={modalProduto} onClose={() => setModalProduto(false)} maxWidth="md" fullWidth>
        <DialogTitle>Cadastrar Novo Produto</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Código do Produto"
                value={novoProduto.codigo_produto}
                onChange={(e) => setNovoProduto({ ...novoProduto, codigo_produto: e.target.value })}
                placeholder="Ex: PROD001"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Nome do Produto"
                value={novoProduto.nome_produto}
                onChange={(e) => setNovoProduto({ ...novoProduto, nome_produto: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={2}
                value={novoProduto.descricao}
                onChange={(e) => setNovoProduto({ ...novoProduto, descricao: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Unidade de Medida"
                value={novoProduto.unidade_medida}
                onChange={(e) => setNovoProduto({ ...novoProduto, unidade_medida: e.target.value })}
              >
                <MenuItem value="UN">Unidade (UN)</MenuItem>
                <MenuItem value="KG">Quilograma (KG)</MenuItem>
                <MenuItem value="G">Grama (G)</MenuItem>
                <MenuItem value="L">Litro (L)</MenuItem>
                <MenuItem value="ML">Mililitro (ML)</MenuItem>
                <MenuItem value="M">Metro (M)</MenuItem>
                <MenuItem value="CM">Centímetro (CM)</MenuItem>
                <MenuItem value="M2">Metro Quadrado (M²)</MenuItem>
                <MenuItem value="M3">Metro Cúbico (M³)</MenuItem>
                <MenuItem value="CX">Caixa (CX)</MenuItem>
                <MenuItem value="PCT">Pacote (PCT)</MenuItem>
                <MenuItem value="FD">Fardo (FD)</MenuItem>
                <MenuItem value="PC">Peça (PC)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Grupo do Produto"
                value={novoProduto.id_grupo}
                onChange={(e) => setNovoProduto({ ...novoProduto, id_grupo: e.target.value })}
              >
                <MenuItem value="">Nenhum</MenuItem>
                {grupos && grupos.length > 0 ? (
                  grupos.map((grupo) => (
                    <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                      {grupo.nome_grupo}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>Nenhum grupo cadastrado</MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Marca"
                value={novoProduto.marca}
                onChange={(e) => setNovoProduto({ ...novoProduto, marca: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Classificação"
                value={novoProduto.classificacao}
                onChange={(e) => setNovoProduto({ ...novoProduto, classificacao: e.target.value })}
              >
                <MenuItem value="">Nenhuma</MenuItem>
                <MenuItem value="A">A - Alta</MenuItem>
                <MenuItem value="B">B - Média</MenuItem>
                <MenuItem value="C">C - Baixa</MenuItem>
                <MenuItem value="Revenda">Revenda</MenuItem>
                <MenuItem value="Consumo">Consumo</MenuItem>
                <MenuItem value="Industrializacao">Industrialização</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="NCM (Código Fiscal)"
                value={novoProduto.ncm}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setNovoProduto({ ...novoProduto, ncm: value });
                }}
                placeholder="Ex: 84713000"
                inputProps={{ maxLength: 8 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Informações de Tributação"
                multiline
                rows={2}
                value={novoProduto.tributacao_info}
                onChange={(e) => setNovoProduto({ ...novoProduto, tributacao_info: e.target.value })}
                placeholder="ICMS, IPI, PIS, COFINS, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={2}
                value={novoProduto.observacoes}
                onChange={(e) => setNovoProduto({ ...novoProduto, observacoes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL da Imagem"
                value={novoProduto.imagem_url}
                onChange={(e) => setNovoProduto({ ...novoProduto, imagem_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalProduto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvarNovoProduto} startIcon={<SaveIcon />}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CompraPage

