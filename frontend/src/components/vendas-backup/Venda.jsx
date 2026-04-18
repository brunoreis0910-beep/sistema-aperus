import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import Dialog from '@mui/material/Dialog'
import VendaImpressao from './VendaImpressao'
import useVendaImpressao from '../hooks/useVendaImpressao'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Slide from '@mui/material/Slide'
import AddIcon from '@mui/icons-material/Add'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useMenuState } from '../context/MenuStateContext'
import Box from '@mui/material/Box'
import { DataGrid } from '@mui/x-data-grid'
import BotaoVoltarInicio from './BotaoVoltarInicio'

const emptyItem = () => ({ 
  id_produto: '', 
  codigo_produto: '', 
  quantidade: '1', 
  valor_unitario: '0.00',
  estoque_disponivel: null 
})

export default function Venda() {
  const { axiosInstance } = useAuth()
  const { menusDesabilitados, desabilitarMenus, habilitarMenus } = useMenuState()
  
  // Hook para funcionalidades de impressão e PDF
  const { 
    componentRef, 
    handlePrint, 
    baixarPDF, 
    compartilharWhatsApp,
    compartilharPDFWhatsApp 
  } = useVendaImpressao()
  
  // helper para mensagens legíveis a partir de erros axios
  function axiosErrorMessage(err) {
    if (!err) return 'Erro desconhecido.'
    const msg = (err && err.message) || ''
    if (err.code === 'ECONNABORTED' || (typeof msg === 'string' && msg.toLowerCase().includes('timeout'))) {
      return 'Tempo de resposta esgotou. Verifique se o servidor está rodando e se o backend responde.'
    }
    try {
      const detail = err.response?.data?.detail || (err.response?.data && typeof err.response.data === 'string' ? err.response.data : (err.response?.data ? JSON.stringify(err.response.data) : null))
      
      // tratamento específico para erros de estoque
      if (detail && typeof detail === 'string') {
        if (detail.includes('sem estoque suficiente')) {
          // extrai o nome do produto do erro
          const match = detail.match(/Produto (.+) sem estoque suficiente/)
          const produto = match ? match[1] : 'produto selecionado'
          return `❌ ESTOQUE INSUFICIENTE!\n\nO produto "${produto}" não tem estoque suficiente para essa venda.\n\n💡 Sugestões:\n• Verifique o estoque atual do produto\n• Reduza a quantidade\n• Atualize o estoque antes da venda`
        }
      }
      
      return detail || err.message || String(err)
    } catch (ex) {
      return err.message || String(err)
    }
  }
  const [operacaoId, setOperacaoId] = useState('')
  const [operacoes, setOperacoes] = useState([])
  const [operacaoGeraFinanceiro, setOperacaoGeraFinanceiro] = useState(false)
  const [operacaoEstoqueNormalizado, setOperacaoEstoqueNormalizado] = useState('')

  const [clienteId, setClienteId] = useState('')
  const [clientes, setClientes] = useState([])
  const [vendedorId, setVendedorId] = useState('')
  const [vendedores, setVendedores] = useState([])

  const [items, setItems] = useState([emptyItem()])
  const [productOptions, setProductOptions] = useState([])
  const [ultimaAtualizacaoEstoque, setUltimaAtualizacaoEstoque] = useState(null)
  const [debugProdutoId, setDebugProdutoId] = useState('')
  const productFetchTimer = useRef(null)

  const [depositos, setDepositos] = useState([])
  const [depositoBaixa, setDepositoBaixa] = useState('')
  const [depositoIncremento, setDepositoIncremento] = useState('')
  const [formasPagamento, setFormasPagamento] = useState([])

  // Estado para controlar impressão de venda específica da listagem
  const [vendaSelecionadaImpressao, setVendaSelecionadaImpressao] = useState(null)
  
  // Estado para controlar ediçéo de venda
  const [editingVendaId, setEditingVendaId] = useState(null)

  // função para converter dados da venda da listagem para formato de impressão
  // função para converter dados da venda da listagem para formato de impressão
  const prepararDadosVendaParaImpressao = useCallback((vendaRow) => {
    if (!vendaRow) {
      console.warn('prepararDadosVendaParaImpressao: vendaRow é null/undefined')
      return null
    }

    console.log('Debug - Dados da venda para impressão:', vendaRow)

    // Detectar se é dados da API ou dados de teste
    const isTestData = !vendaRow.id_cliente && !vendaRow.id_vendedor1 && !vendaRow.id_operacao

    // Buscar dados completos baseados nos IDs ou usar campos diretos da venda
    let clienteNome, vendedorNome, operacaoNome

    if (isTestData) {
      // Para dados de teste da imagem, usar valores específicos
      clienteNome = vendaRow.cliente || 'CLIENTE TESTE'
      vendedorNome = vendaRow.vendedor || 'VENDEDOR TESTE'  
      operacaoNome = vendaRow.operacao || 'VENDA A VISTA'
    } else {
      // Para dados reais da API
      clienteNome = vendaRow.cliente_nome || vendaRow.cliente || 'Cliente não informado'
      vendedorNome = vendaRow.vendedor_nome || vendaRow.vendedor || vendaRow.vendedor1 || 'Vendedor não informado'
      operacaoNome = vendaRow.operacao_nome || vendaRow.operacao || vendaRow.nome_operacao || 'Operação não informada'
    }
    
    // Buscar dados completos se disponíveis
    const clienteCompleto = clientes.find(c => 
      (c.id || c.id_cliente || c.pk) == vendaRow.id_cliente ||
      (c.nome || c.razao_social) === clienteNome
    ) || { 
      nome: isTestData ? 'CLIENTE EXEMPLO LTDA' : clienteNome,
      razao_social: isTestData ? 'CLIENTE EXEMPLO LTDA' : clienteNome,
      cpf_cnpj: isTestData ? '12.345.678/0001-90' : (vendaRow.cliente_documento || vendaRow.cliente_cpf_cnpj || ''),
      telefone: isTestData ? '(11) 99999-9999' : (vendaRow.cliente_telefone || ''),
      email: isTestData ? 'cliente@exemplo.com' : (vendaRow.cliente_email || ''),
      endereco: isTestData ? 'Rua Exemplo, 123' : (vendaRow.cliente_endereco || ''),
      cidade: isTestData ? 'são Paulo' : (vendaRow.cliente_cidade || ''),
      estado: isTestData ? 'SP' : (vendaRow.cliente_estado || vendaRow.cliente_uf || ''),
      cep: isTestData ? '01234-567' : (vendaRow.cliente_cep || '')
    }
    
    const vendedorCompleto = vendedores.find(v => 
      (v.id || v.id_vendedor || v.pk) == vendaRow.id_vendedor1 ||
      (v.nome) === vendedorNome
    ) || { 
      nome: isTestData ? 'Joéo Silva' : vendedorNome,
      codigo: isTestData ? 'VEND001' : (vendaRow.vendedor_codigo || ''),
      telefone: isTestData ? '(11) 88888-8888' : (vendaRow.vendedor_telefone || ''),
      email: isTestData ? 'joao@empresa.com' : (vendaRow.vendedor_email || '')
    }
    
    const operacaoCompleta = operacoes.find(op => 
      (op.id || op.id_operacao || op.pk) == vendaRow.id_operacao ||
      (op.nome_operacao || op.nome) === operacaoNome
    ) || { 
      nome_operacao: isTestData ? 'VENDA A VISTA' : operacaoNome,
      nome: isTestData ? 'VENDA A VISTA' : operacaoNome,
      tipo_estoque_baixa: vendaRow.tipo_estoque || 'Gerencial'
    }

    // Produtos com fallbacks para dados não disponíveis
    const produtosFormatados = (vendaRow.itens || vendaRow.produtos || []).map((item, index) => ({
      id_produto: item.id_produto || item.produto_id || `item_${index}`,
      codigo_produto: item.codigo_produto || item.produto_codigo || item.codigo || `PROD${index + 1}`,
      nome_produto: item.nome_produto || item.produto_nome || item.produto || item.nome || `Produto ${index + 1}`,
      quantidade: parseFloat(item.quantidade || item.qtd || 1),
      valor_unitario: parseFloat(item.valor_unitario || item.preco || item.valor || 0),
      desconto_valor: parseFloat(item.desconto_valor || item.desconto || 0)
    }))

    // Se não há produtos na venda, criar um produto placeholder baseado no valor total
    if (produtosFormatados.length === 0) {
      produtosFormatados.push({
        id_produto: 'placeholder',
        codigo_produto: vendaRow.codigo_produto || 'PROD1',
        nome_produto: vendaRow.produto_nome || vendaRow.produto || 'Produto 1',
        quantidade: 1,
        valor_unitario: parseFloat(vendaRow.valor_total || 0),
        desconto_valor: 0
      })
    }

    const valorTotal = parseFloat(vendaRow.valor_total || 0)
    const desconto = parseFloat(vendaRow.desconto || 0)
    const valorFinal = valorTotal - desconto

    return {
      numero_venda: vendaRow.numero_documento || vendaRow.numero || vendaRow.id || '56',
      data_venda: vendaRow.data || vendaRow.data_venda || new Date().toISOString(),
      cliente: clienteCompleto,
      vendedor: vendedorCompleto,
      operacao: operacaoCompleta,
      empresa: {
        nome: isTestData ? 'MINHA EMPRESA LTDA' : (operacaoCompleta?.empresa?.nome || vendaRow.empresa_nome || 'EMPRESA'),
        cnpj: isTestData ? '00.123.456/0001-78' : (operacaoCompleta?.empresa?.cnpj || vendaRow.empresa_cnpj || ''),
        endereco: isTestData ? 'Av. Principal, 456 - Centro' : (operacaoCompleta?.empresa?.endereco || vendaRow.empresa_endereco || ''),
        telefone: isTestData ? '(11) 1234-5678' : (operacaoCompleta?.empresa?.telefone || vendaRow.empresa_telefone || '')
      },
      produtos: produtosFormatados,
      valor_total: valorTotal,
      desconto: desconto,
      valor_final: valorFinal,
      forma_pagamento: isTestData ? 'Dinheiro' : (vendaRow.forma_pagamento || vendaRow.forma_pagamento_nome || 'À vista'),
      condicao_pagamento: isTestData ? 'À vista' : (vendaRow.condicao_pagamento || vendaRow.forma_pagamento || 'À vista'),
      financeiro: {
        conta: vendaRow.conta || vendaRow.conta_nome || '',
        departamento: vendaRow.departamento || vendaRow.departamento_nome || '',
        vencimento: vendaRow.vencimento_parcela || vendaRow.vencimento || '',
        valor_parcela: parseFloat(vendaRow.valor_parcela || valorFinal),
        gera_financeiro: vendaRow.gera_financeiro || false
      },
      observacoes: vendaRow.observacoes || ''
    }
  }, [clientes, vendedores, operacoes])

  // Estados para impressão e compartilhamento
  const [mostrarImpressao, setMostrarImpressao] = useState(false)
  const [dadosUltimaVenda, setDadosUltimaVenda] = useState(null)
  const [carregandoPDF, setCarregandoPDF] = useState(false)
  const [carregandoWhatsApp, setCarregandoWhatsApp] = useState(false)

  const [geraFinanceiro, setGeraFinanceiro] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState('')
  const [desconto, setDesconto] = useState('0.00')
  const [contas, setContas] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [contaId, setContaId] = useState('')
  const [departamentoId, setDepartamentoId] = useState('')
  const [vencimentoParcela, setVencimentoParcela] = useState('')
  const [parcelaValor, setParcelaValor] = useState('0.00')
  const [observacoes, setObservacoes] = useState('')

  const [token, setToken] = useState('') // optional token override
  const [message, setMessage] = useState(null)
  const [showList, setShowList] = useState(false)
  const [vendasList, setVendasList] = useState([])
  const [vendasPage, setVendasPage] = useState(1)
  const [vendasPageSize, setVendasPageSize] = useState(20)
  const [vendasTotal, setVendasTotal] = useState(0)
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterNumero, setFilterNumero] = useState('')
  const [filterValorMin, setFilterValorMin] = useState('')
  const [filterValorMax, setFilterValorMax] = useState('')
  const [filterText, setFilterText] = useState('')

  // helpers
  function updateItem(index, patch) {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, ...patch } : it))
  }
  function addItem() { setItems(prev => [...prev, emptyItem()]) }
  function removeItem(index) { setItems(prev => prev.filter((_, i) => i !== index)) }

  function detectSaidaFromOp(op) {
    if (!op) return ''
    const tipo = (op.tipo_estoque_baixa || op.tipo_estoque || op.estoque || '')
    const t = String(tipo).toLowerCase()
    if (t.includes('saida') || t.includes('saída') || t.includes('baixa') || t.includes('debito')) return 'saida'
    if (t.includes('entrada') || t.includes('inc') || t.includes('incremento')) return 'entrada'
    // fallback: inspect other flags
    if (op.gera_financeiro === true || op.geraFinanceiro === true) {
      // doesn't determine entrada/saida
    }
    return ''
  }

  // compute due date adding business days (skipping weekends)
  function addBusinessDays(startDate, days) {
    if (!Number.isFinite(Number(days)) || days === null) return startDate
    let d = new Date(startDate)
    let remaining = Number(days)
    // if days is 0, return today
    while (remaining > 0) {
      d.setDate(d.getDate() + 1)
      const day = d.getDay()
      if (day === 0 || day === 6) {
        // sunday=0 saturday=6 skip
        continue
      }
      remaining -= 1
    }
    return d
  }

  // compute due date adding calendar days (incl. weekends)
  function addCalendarDays(startDate, days) {
    if (!Number.isFinite(Number(days)) || days === null) return startDate
    const d = new Date(startDate)
    d.setDate(d.getDate() + Number(days))
    return d
  }

  function formatDateISO(date) {
    const d = new Date(date)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  function handleFormaChange(value) {
    setFormaPagamento(value)
    if (!value) return
    const f = formasPagamento.find(x => x.id === value)
    if (!f) return
    // suggest account and department if present
    if (f.id_conta_padrao) setContaId(f.id_conta_padrao)
    if (f.id_departamento) setDepartamentoId(f.id_departamento)
    // suggest vencimento based on quantidade_dias
    const dias = Number(f.quantidade_dias)
    if (!isNaN(dias)) {
      const today = new Date()
      // Use calendar days for vencimento (expectation: 28/10 + 30 => 27/11)
      const due = addCalendarDays(today, dias)
      setVencimentoParcela(formatDateISO(due))
    }
  }

  // função auxiliar para extrair estoque correto do produto
  function obterEstoqueProduto(produto, depositoId = null) {
    console.debug('📊 Calculando estoque para produto:', {
      id: produto?.id,
      nome: produto?.nome,
      depositoId: depositoId,
      estoque_deposito: produto?.estoque_deposito,
      estoques_array: produto?.estoques,
      estoque_object: produto?.estoque,
      estoque_atual: produto?.estoque_atual
    })
    
    // Prioridades para obter estoque:
    // 1. estoque_deposito (se API suporta consulta por depósito)
    // 2. estoque do depósito específico se existe array de estoques
    // 3. estoque_atual como fallback
    
    if (produto.estoque_deposito != null) {
      console.debug('✅ Usando estoque_deposito:', produto.estoque_deposito)
      return produto.estoque_deposito
    }
    
    if (depositoId && produto.estoques && Array.isArray(produto.estoques)) {
      console.debug('🔍 Procurando no array de estoques:', produto.estoques)
      const estoqueDoDeposito = produto.estoques.find(est => 
        est.id_deposito == depositoId || est.deposito_id == depositoId || est.deposito == depositoId
      )
      if (estoqueDoDeposito && estoqueDoDeposito.quantidade != null) {
        console.debug('✅ Usando estoque do array de estoques:', estoqueDoDeposito.quantidade)
        return estoqueDoDeposito.quantidade
      }
      console.debug('⚠️ não encontrado no array de estoques para depósito:', depositoId)
    }
    
    if (depositoId && produto.estoque && typeof produto.estoque === 'object') {
      console.debug('🔍 Procurando no objeto estoque:', produto.estoque)
      // Se estoque é um objeto com chaves de depósito
      if (produto.estoque[depositoId] != null) {
        console.debug('✅ Usando estoque do objeto por depositoId:', produto.estoque[depositoId])
        return produto.estoque[depositoId]
      }
      console.debug('⚠️ não encontrado no objeto estoque para depósito:', depositoId)
    }
    
    // Fallback para estoque geral
    const estoqueGeral = produto.estoque_atual != null ? produto.estoque_atual : 
                        (typeof produto.estoque === 'number' ? produto.estoque : 0)
    console.debug('⚠️ Usando estoque geral como fallback:', estoqueGeral)
    return estoqueGeral
  }

  // Estado para controlar se API suporta consulta por depósito
  const [apiSuportaDeposito, setApiSuportaDeposito] = useState(null) // null = não testado, true/false = resultado

  async function fetchProducts(q) {
    console.debug('🔄 Carregando produtos com filtro:', q)
    console.debug('🏭 Estado atual da API:', { 
      apiSuportaDeposito, 
      operacaoId: operacaoId,
      depositoBaixa: depositoBaixa 
    })
    
    try {
      let resp
      const opts = { timeout: 20000 }
      
      // Determinar o depósito correto para consultar estoque
      const operacaoSelecionada = operacoes.find(op => (op.id || op.id_operacao || op.pk) == operacaoId)
      const depositoConsulta = operacaoSelecionada?.id_deposito_baixa || depositoBaixa || null
      
      console.debug('🏭 Depósito determinado para consulta:', {
        operacaoId: operacaoId,
        operacaoNome: operacaoSelecionada?.nome_operacao || operacaoSelecionada?.nome,
        depositoOperacao: operacaoSelecionada?.id_deposito_baixa,
        depositoBaixa: depositoBaixa,
        depositoFinal: depositoConsulta
      })
      
      // Preparar parâmetros da consulta
      const params = {}
      if (q && q.length >= 1) {
        params.search = q
      }
      
      // Só incluir parâmetro de depósito se sabemos que API suporta OU se ainda não testamos
      if (depositoConsulta && (apiSuportaDeposito !== false)) {
        params.deposito = depositoConsulta
        // Tentar também outros nomes comuns para o parâmetro
        params.id_deposito = depositoConsulta
        params.deposito_id = depositoConsulta
      }
      
      console.debug('🌐 Parâmetros da consulta API:', params)
      
      // Fazer a consulta
      if (Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString()
        resp = await axiosInstance.get(`/produtos/?${queryString}`, opts)
      } else {
        resp = await axiosInstance.get('/produtos/', opts)
      }
      
      const list = Array.isArray(resp.data) ? resp.data : resp.data.results || []
      
      // Detectar se API retorna dados de depósito específico
      if (depositoConsulta && apiSuportaDeposito === null) {
        const temEstoqueDeposito = list.some(p => p.estoque_deposito != null)
        setApiSuportaDeposito(temEstoqueDeposito)
        console.debug('🔍 Detecçéo de suporte da API:', {
          suporta_deposito: temEstoqueDeposito,
          tem_produtos: list.length > 0,
          amostra_produto: list[0]
        })
      }
      
      // Log detalhado da resposta da API para debug
      console.debug('📦 API /produtos/ resposta:', {
        query: q || '(vazio)',
        deposito_consulta: depositoConsulta,
        parametros_enviados: params,
        url: resp.config?.url,
        total_produtos: list.length,
        amostra_produtos: list.slice(0, 3).map(p => ({
          id: p.id || p.id_produto || p.pk,
          codigo: p.codigo_produto,
          nome: p.nome_produto || p.nome,
          estoque_atual: p.estoque_atual,
          estoque_deposito: p.estoque_deposito,
          dados_estoque: p.estoque || p.estoques
        }))
      })
      
      console.debug('✅ Produtos carregados com sucesso:', {
        quantidade: list.length,
        depositoConsulta: depositoConsulta,
        amostra: list.slice(0, 3).map(p => ({ 
          id: p.id, 
          nome: p.nome, 
          estoque_raw: p.estoque,
          estoque_deposito: p.estoque_deposito,
          estoques_array: p.estoques,
          estoque_calculado: obterEstoqueProduto(p, depositoConsulta) 
        }))
      })
      setProductOptions(list)
    } catch (err) {
      console.warn('❌ Erro ao buscar produtos:', err?.message || err)
      // Se houver erro com parâmetros, tentar consulta simples
      if (err?.response?.status === 400 && depositoConsulta) {
        console.debug('🔄 Erro 400 - API pode não suportar parâmetro deposito. Tentando consulta simples...')
        setApiSuportaDeposito(false) // Marcar que API não suporta
        try {
          const simpleParams = q && q.length >= 1 ? { search: q } : {}
          const queryString = Object.keys(simpleParams).length > 0 ? 
            `?${new URLSearchParams(simpleParams).toString()}` : ''
          const fallbackResp = await axiosInstance.get(`/produtos/${queryString}`, { timeout: 20000 })
          const fallbackList = Array.isArray(fallbackResp.data) ? fallbackResp.data : fallbackResp.data.results || []
          console.debug('✅ Consulta simples funcionou, produtos carregados:', {
            quantidade: fallbackList.length,
            amostra: fallbackList.slice(0, 3).map(p => ({ 
              id: p.id, 
              nome: p.nome, 
              estoque: obterEstoqueProduto(p, depositoConsulta) 
            }))
          })
          setProductOptions(fallbackList)
          return
        } catch (fallbackErr) {
          console.warn('❌ Consulta simples também falhou:', fallbackErr?.message || fallbackErr)
        }
      }
      
      setMessage({ type: 'error', text: `Erro ao carregar produtos: ${err?.message || err}` })
      setProductOptions([])
    }
  }

  // initial loads: depositos, operacoes, clientes, vendedores
  useEffect(() => {
    async function load() {
      console.debug('Venda.load() axiosInstance:', axiosInstance)
      try {
        const opts = { timeout: 20000 }
        const [depsRes, opsRes, clientsRes, vendsRes] = await Promise.all([
          axiosInstance.get('/depositos/', opts),
          axiosInstance.get('/operacoes/', opts),
          axiosInstance.get('/clientes/', opts),
          axiosInstance.get('/vendedores/', opts)
        ])
  const deps = Array.isArray(depsRes.data) ? depsRes.data : depsRes.data.results || []
  const ops = Array.isArray(opsRes.data) ? opsRes.data : opsRes.data.results || []
  const clients = Array.isArray(clientsRes.data) ? clientsRes.data : clientsRes.data.results || []
  const vends = Array.isArray(vendsRes.data) ? vendsRes.data : vendsRes.data.results || []

  console.debug('Venda.load() results sizes:', { depositos: deps.length, operacoes: ops.length, clientes: clients.length, vendedores: vends.length })

  setDepositos(deps)
  setOperacoes(ops)
  setClientes(clients)
  setVendedores(vends)
        // fetch formas-pagamento separately to avoid index confusion
        try {
          const formasResp = await axiosInstance.get('/formas-pagamento/')
          const normalizeForma = (it) => ({
            id: it.id_forma_pagamento || it.id || it.pk || null,
            nome: it.nome_forma_pagamento || it.nome_forma || it.nome || it.descricao || '—',
            quantidade_dias: it.quantidade_dias ?? (it.dias ?? it.qtd_dias ?? it.dias_vencimento ?? null),
            id_conta_padrao: (it.id_conta_padrao !== undefined && it.id_conta_padrao !== null) ? it.id_conta_padrao : (it.id_conta ?? it.id_conta_bancaria ?? null),
            id_departamento: (it.id_departamento !== undefined && it.id_departamento !== null) ? it.id_departamento : (it.id_departamento ?? null),
            raw: it,
          })
          setFormasPagamento(Array.isArray(formasResp.data) ? formasResp.data.map(normalizeForma) : [])
        } catch (e) {
          console.warn('Erro ao buscar formas-pagamento', e)
          setFormasPagamento([])
        }
      } catch (e) {
        console.warn('Could not load select data', e?.message || e)
        // Mensagem amigável ao usuário
        setMessage({ type: 'error', text: axiosErrorMessage(e) })
      }
    }
    if (axiosInstance) load()
  }, [axiosInstance])

  // contas e departamentos para financeiro
  useEffect(() => {
    async function loadApoio() {
      try {
        // SettingsPage fetches '/api/departamentos/' for department list; use the same endpoint here
          const opts = { timeout: 20000 }
          const [contasRes, depsRes] = await Promise.all([
            axiosInstance.get('/contas-bancarias/', opts),
            axiosInstance.get('/departamentos/', opts)
          ])
        setContas(Array.isArray(contasRes.data) ? contasRes.data : contasRes.data.results || [])
        setDepartamentos(Array.isArray(depsRes.data) ? depsRes.data : depsRes.data.results || [])
      } catch (e) {
        // non-blocking
      }
    }
    if (axiosInstance) loadApoio()
  }, [axiosInstance])

  // when operation changes, apply defaults
  useEffect(() => {
    const op = operacoes.find(o => (o.id || o.id_operacao || o.pk) == operacaoId)
    if (!op) return
    // default depósitos if present
    const baixa = op.id_deposito_baixa || op.id_deposito || op.deposito_baixa || op.id_deposito_baixa_default || ''
    const inc = op.id_deposito_incremento || op.deposito_incremento || op.id_deposito_incremento_default || ''
    if (baixa) setDepositoBaixa(baixa)
    if (inc) setDepositoIncremento(inc)
    // defaults client/vendedor
    const defaultCliente = op.id_cliente || op.id_cliente_padrao || op.cliente_default || op.id_cliente_default || ''
    const defaultVendedor = op.id_vendedor || op.id_vendedor_padrao || op.vendedor_default || op.id_vendedor_default || ''
    if (defaultCliente) setClienteId(defaultCliente)
    if (defaultVendedor) setVendedorId(defaultVendedor)
    const opGera = Boolean(op.gera_financeiro || op.geraFinanceiro || op.gera_financeiro === true)
    setOperacaoGeraFinanceiro(opGera)
    if (opGera) setGeraFinanceiro(true)
    const norm = detectSaidaFromOp(op)
    setOperacaoEstoqueNormalizado(norm)
  }, [operacaoId, operacoes])

  // Recarregar produtos quando operação ou depósito mudar para mostrar estoque correto
  useEffect(() => {
    // Só recarregar se uma operação foi realmente selecionada
    if (operacaoId && operacoes.length > 0) {
      console.debug('🔄 Operação mudou, recarregando produtos para estoque atualizado...', {
        operacaoId,
        depositoBaixa
      })
      fetchProducts('')
    }
  }, [operacaoId]) // Removido depositoBaixa para evitar loop, pois ele muda automaticamente com operação

  // totals
  const totalProdutos = items.reduce((sum, it) => {
    const q = parseFloat(String(it.quantidade || '0').replace(',', '.')) || 0
    const v = parseFloat(String(it.valor_unitario || '0').replace(',', '.')) || 0
    return sum + q * v
  }, 0)
  const descontoNum = parseFloat(String(desconto || '0').replace(',', '.')) || 0
  const totalDocumento = Math.max(0, totalProdutos - descontoNum)

  useEffect(() => {
    if (operacaoGeraFinanceiro) setParcelaValor(totalDocumento.toFixed(2))
  }, [operacaoGeraFinanceiro, totalDocumento])

  // Auto-preenche depósitos quando operação é selecionada
  useEffect(() => {
    const operacao = operacoes.find(op => (op.id || op.id_operacao || op.pk) == operacaoId)
    if (operacao) {
      // Se a operação tem depósito de baixa configurado, usa ele
      if (operacao.id_deposito_baixa && !depositoBaixa) {
        console.debug('🏭 Auto-preenchendo depósito de baixa da operação:', operacao.id_deposito_baixa)
        setDepositoBaixa(operacao.id_deposito_baixa)
      }
      
      // Se a operação tem depósito de incremento configurado, usa ele
      if (operacao.id_deposito_incremento && !depositoIncremento) {
        console.debug('🏭 Auto-preenchendo depósito de incremento da operação:', operacao.id_deposito_incremento)
        setDepositoIncremento(operacao.id_deposito_incremento)
      }
      
      // Log da configuração da operação
      console.debug('🔄 Operação selecionada:', {
        id: operacaoId,
        nome: operacao.nome_operacao || operacao.nome,
        tipo_estoque: operacao.tipo_estoque_baixa,
        deposito_baixa: operacao.id_deposito_baixa,
        deposito_incremento: operacao.id_deposito_incremento,
        controla_estoque: operacao.tipo_estoque_baixa !== 'Nenhum'
      })
    }
  }, [operacaoId, operacoes, depositoBaixa, depositoIncremento])

  // função para incrementar o próximo número da operação
  async function incrementarProximoNumeroOperacao() {
    if (!operacaoId) {
      console.debug('não incrementa próximo número: nenhuma operação selecionada')
      return // se não tem operação selecionada, não faz nada
    }

    try {
      const operacao = operacoes.find(op => (op.id || op.id_operacao || op.pk) == operacaoId)
      if (!operacao) {
        console.debug('não incrementa próximo número: operação não encontrada')
        return
      }

      // só incrementa se a operação usa auto-numeração
      if (!operacao.usa_auto_numeracao) {
        console.debug('não incrementa próximo número: operação não usa auto-numeração')
        return
      }

      const novoProximoNumero = (operacao.proximo_numero_nf || 1) + 1
      
      console.debug(`Incrementando próximo número da operação "${operacao.nome_operacao}" de ${operacao.proximo_numero_nf} para ${novoProximoNumero}`)
      
      const payload = {
        proximo_numero_nf: novoProximoNumero
      }

      const client = token
        ? axios.create({ baseURL: axiosInstance.defaults.baseURL, headers: { Authorization: `Bearer ${token}` } })
        : axiosInstance

      await client.patch(`/operacoes/${operacao.id || operacao.id_operacao || operacao.pk}/`, payload, { timeout: 10000 })
      
      // atualiza o estado local da operação
      setOperacoes(prev => prev.map(op => 
        (op.id || op.id_operacao || op.pk) == operacaoId 
          ? { ...op, proximo_numero_nf: novoProximoNumero }
          : op
      ))
      
      console.debug(`✅ Próximo número da operação incrementado com sucesso para: ${novoProximoNumero}`)
    } catch (err) {
      console.warn('❌ Erro ao incrementar próximo número da operação:', err?.message || err)
      // não exibe erro ao usuário pois a venda já foi criada com sucesso
    }
  }

  // função para verificar estoque de um produto específico na API
  async function verificarEstoqueProduto(produtoId) {
    try {
      console.debug(`🔍 Verificando estoque do produto ${produtoId} diretamente na API...`)
      
      const client = token
        ? axios.create({ baseURL: axiosInstance.defaults.baseURL, headers: { Authorization: `Bearer ${token}` } })
        : axiosInstance
        
      const resp = await client.get(`/produtos/${produtoId}/`, { timeout: 10000 })
      const produto = resp.data
      
      console.debug(`📦 Produto ${produto.codigo_produto || produto.nome}: Estoque = ${produto.estoque_atual || 0}`)
      
      return produto.estoque_atual || 0
    } catch (err) {
      console.warn(`❌ Erro ao verificar estoque do produto ${produtoId}:`, err?.message || err)
      return null
    }
  }

  // função para verificar estoque de um produto específico diretamente na API
  async function verificarEstoqueProduto(produtoId) {
    try {
      console.debug(`🔍 Verificando estoque do produto ${produtoId} diretamente na API...`)
      
      const resp = await axiosInstance.get(`/produtos/${produtoId}/`, { timeout: 10000 })
      const produto = resp.data
      
      console.debug('📦 Dados COMPLETOS do produto da API:', {
        url: resp.config?.url,
        status: resp.status,
        id: produto.id || produto.id_produto || produto.pk,
        codigo: produto.codigo_produto,
        nome: produto.nome_produto || produto.nome,
        estoque_atual: produto.estoque_atual,
        dados_completos: produto,
        timestamp: new Date().toLocaleString()
      })
      
      // Compara com o produto na lista local
      const produtoLocal = productOptions.find(p => (p.id || p.id_produto || p.pk) == produtoId)
      if (produtoLocal) {
        console.debug('🔄 Comparação Local x API:', {
          local_estoque: produtoLocal.estoque_atual,
          api_estoque: produto.estoque_atual,
          diferenca: (produtoLocal.estoque_atual || 0) - (produto.estoque_atual || 0),
          em_sincronia: (produtoLocal.estoque_atual || 0) === (produto.estoque_atual || 0)
        })
      } else {
        console.debug('⚠️ Produto não encontrado na lista local')
      }
      
      return produto
    } catch (err) {
      console.warn(`❌ Erro ao verificar produto ${produtoId}:`, err?.message || err)
      if (err.response) {
        console.debug('📄 Resposta do erro:', {
          status: err.response.status,
          data: err.response.data
        })
      }
      return null
    }
  }

  // função de teste para verificar se a API está processando vendas corretamente
  async function testarProcessamentoVenda() {
    try {
      console.debug('🧪 TESTE: Iniciando teste de processamento de venda...')
      
      if (!operacaoId) {
        console.warn('❌ Selecione uma operação primeiro')
        setMessage({ type: 'error', text: 'Selecione uma operação primeiro para testar' })
        return
      }
      
      if (items.length === 0 || !items[0].id_produto) {
        console.warn('❌ Adicione pelo menos um produto primeiro')
        setMessage({ type: 'error', text: 'Adicione pelo menos um produto para testar' })
        return
      }
      
      const produto = productOptions.find(p => (p.id || p.id_produto || p.pk) == items[0].id_produto)
      if (!produto) {
        console.warn('❌ Produto não encontrado')
        return
      }
      
      console.debug('🧪 Estoque ANTES do teste:', {
        produto_id: items[0].id_produto,
        produto_codigo: produto.codigo_produto,
        estoque_local: produto.estoque_atual
      })
      
      // Verifica estoque direto da API antes
      const produtoAntesAPI = await verificarEstoqueProduto(items[0].id_produto)
      
      console.debug('🧪 Dados completos do teste:', {
        operacao_id: operacaoId,
        produto_id: items[0].id_produto,
        quantidade_teste: 0.001, // quantidade mínima para não afetar estoque real
        estoque_antes_local: produto.estoque_atual,
        estoque_antes_api: produtoAntesAPI?.estoque_atual
      })
      
      setMessage({ type: 'success', text: 'Teste de API concluído - verifique o console para detalhes' })
      
    } catch (err) {
      console.warn('❌ Erro no teste:', err?.message || err)
      setMessage({ type: 'error', text: 'Erro no teste: ' + (err?.message || err) })
    }
  }
  async function atualizarEstoqueProdutos() {
    try {
      console.debug('🔄 Recarregando produtos para verificar atualização de estoque...')
      
      // armazena estoque atual antes de recarregar
      const estoqueAntes = {}
      const produtosVendidos = []
      const operacaoSelecionada = operacoes.find(op => (op.id || op.id_operacao || op.pk) == operacaoId)
      const depositoId = operacaoSelecionada?.id_deposito_baixa || depositoBaixa
      
      // coleta informações dos produtos vendidos
      items.forEach(item => {
        if (item.id_produto) {
          const produto = productOptions.find(p => (p.id || p.id_produto || p.pk) == item.id_produto)
          if (produto) {
            const id = produto.id || produto.id_produto || produto.pk
            const codigo = produto.codigo_produto || produto.nome || `ID_${id}`
            
            // Usar função auxiliar para obter estoque correto
            const estoqueAtual = obterEstoqueProduto(produto, depositoId)
            
            estoqueAntes[id] = {
              codigo,
              estoque: estoqueAtual,
              quantidade_vendida: parseFloat(String(item.quantidade).replace(',', '.')) || 0
            }
            produtosVendidos.push(codigo)
          }
        }
      })
      
      console.debug('📦 Produtos vendidos que seréo verificados:', produtosVendidos)
      
      // recarrega a lista completa de produtos para pegar estoque atualizado
      await fetchProducts('')
      
      // aguarda um tempo maior para o backend processar a transação
      setTimeout(async () => {
        console.debug('📊 Comparando estoque antes x depois da venda:')
        
        let alteracaoDetectada = false
        
        // compara estoque antes e depois para produtos vendidos
        Object.keys(estoqueAntes).forEach(id => {
          const produtoAntes = estoqueAntes[id]
          const produtoDepois = productOptions.find(p => (p.id || p.id_produto || p.pk) == id)
          
          if (produtoDepois) {
            const estoqueDepois = produtoDepois.estoque_atual || 0
            const diferenca = produtoAntes.estoque - estoqueDepois
            const quantidadeVendida = produtoAntes.quantidade_vendida
            
            if (diferenca === quantidadeVendida) {
              console.debug(`  ✅ ${produtoAntes.codigo}: ${produtoAntes.estoque} → ${estoqueDepois} (baixa correta: -${quantidadeVendida})`)
              alteracaoDetectada = true
            } else if (diferenca > 0) {
              console.debug(`  ⚠️ ${produtoAntes.codigo}: ${produtoAntes.estoque} → ${estoqueDepois} (baixa parcial: -${diferenca}, esperado: -${quantidadeVendida})`)
              alteracaoDetectada = true
            } else if (diferenca === 0) {
              console.debug(`  ❌ ${produtoAntes.codigo}: ${produtoAntes.estoque} → ${estoqueDepois} (SEM ALTERação! Esperado: -${quantidadeVendida})`)
            } else {
              console.debug(`  🔄 ${produtoAntes.codigo}: ${produtoAntes.estoque} → ${estoqueDepois} (incremento inesperado: +${Math.abs(diferenca)})`)
              alteracaoDetectada = true
            }
          } else {
            console.debug(`  ❌ ${produtoAntes.codigo}: produto não encontrado após recarregamento`)
          }
        })
        
        if (!alteracaoDetectada) {
          console.warn('🚨 ATENÇéO: Nenhuma alteração de estoque foi detectada após a venda!')
          console.warn('🔍 Isso pode indicar que:')
          console.warn('   • A operação não está configurada para controlar estoque')
          console.warn('   • O backend não está processando a baixa de estoque')
          console.warn('   • A API de produtos não está retornando dados atualizados')
          
          // tenta recarregar os produtos novamente com um delay maior
          console.debug('🔄 Tentando segundo recarregamento com delay maior...')
          setTimeout(async () => {
            await fetchProducts('')
            console.debug('🔄 Segundo recarregamento concluído')
          }, 2000)
        } else {
          console.debug('✅ Alterações de estoque detectadas com sucesso')
        }
        
        console.debug('✅ Verificação de estoque concluída')
      }, 2000) // aguarda 2 segundos para dar mais tempo do backend processar
      
    } catch (err) {
      console.warn('❌ Erro ao recarregar produtos:', err?.message || err)
      // não bloqueia o fluxo principal
    }
  }

  // submit
  async function submit() {
    setMessage(null)
    try {
      // basic item validation
      for (const it of items) {
        if (!it.id_produto) { setMessage({ type: 'error', text: 'Cada item precisa ter um produto selecionado.' }); return }
        const q = parseFloat(String(it.quantidade).replace(',', '.'))
        if (isNaN(q) || q <= 0) { setMessage({ type: 'error', text: 'Quantidade inválida em um dos itens.' }); return }
        const v = parseFloat(String(it.valor_unitario).replace(',', '.'))
        if (isNaN(v) || v < 0) { setMessage({ type: 'error', text: 'Valor unitário inválido em um dos itens.' }); return }
      }

      // validação obrigatória de cliente
      if (!clienteId) {
        setMessage({ type: 'error', text: 'Cliente é obrigatório para criar uma venda.' })
        return
      }

      // validação obrigatória de vendedor
      if (!vendedorId) {
        setMessage({ type: 'error', text: 'Vendedor é obrigatório para criar uma venda.' })
        return
      }

      // verificar se operação está selecionada (boa prática)
      if (!operacaoId) {
        setMessage({ type: 'error', text: 'Operação é obrigatória para criar uma venda.' })
        return
      }

      // validação de estoque se a operação controla estoque
      const operacao = operacoes.find(op => (op.id || op.id_operacao || op.pk) == operacaoId)
      if (operacao && operacao.tipo_estoque_baixa && operacao.tipo_estoque_baixa !== 'Nenhum') {
        
        // Validação obrigatória: operação que controla estoque deve ter depósito de baixa
        if (!operacao.id_deposito_baixa && !depositoBaixa) {
          setMessage({ 
            type: 'error', 
            text: `Operação "${operacao.nome_operacao || operacao.nome}" controla estoque mas não tem depósito de baixa configurado! Configure um depósito de baixa na operação ou selecione um depósito manual.` 
          })
          return
        }
        
        console.debug('🔍 DEBUG - Validando estoque antes da venda:')
        console.debug('📦 Depósito de baixa:', {
          da_operacao: operacao.id_deposito_baixa,
          manual: depositoBaixa,
          final: operacao.id_deposito_baixa || depositoBaixa
        })
        
        for (const it of items) {
          const produto = productOptions.find(p => (p.id || p.id_produto || p.pk) == it.id_produto)
          if (produto && produto.estoque_atual != null) {
            const q = parseFloat(String(it.quantidade).replace(',', '.'))
            const estoque = parseFloat(produto.estoque_atual) || 0
            
            console.debug(`  • Produto: ${produto.codigo_produto || produto.nome} - Estoque atual: ${estoque} - Quantidade venda: ${q}`)
            
            if (estoque < q) {
              const nomeProduto = produto.codigo_produto || produto.nome_produto || produto.nome || 'produto selecionado'
              setMessage({ 
                type: 'error', 
                text: `Estoque insuficiente! Produto "${nomeProduto}" tem apenas ${estoque} unidades disponíveis, mas você está tentando vender ${q} unidades.` 
              })
              return
            }
          }
        }
      }

      // financeiro validation if required
      if (operacaoGeraFinanceiro || geraFinanceiro) {
        if (!formaPagamento) { setMessage({ type: 'error', text: 'Forma de pagamento obrigatória para esta operação.' }); return }
        if (!contaId) { setMessage({ type: 'error', text: 'Conta bancária obrigatória para esta operação.' }); return }
        if (!departamentoId) { setMessage({ type: 'error', text: 'Departamento obrigatório para esta operação.' }); return }
        if (!vencimentoParcela) { setMessage({ type: 'error', text: 'Vencimento da parcela obrigatório para esta operação.' }); return }
        const parcelaNum = parseFloat(String(parcelaValor || '0').replace(',', '.')) || 0
        if (Math.abs(parcelaNum - totalDocumento) > 0.009) { setMessage({ type: 'error', text: 'O valor da parcela deve ser igual ao total do documento.' }); return }
      }

      // prepare payload
      const operacaoSelecionada = operacoes.find(op => (op.id || op.id_operacao || op.pk) == operacaoId)
      
      // Usa o depósito da operação se disponível, senão usa o selecionado manualmente
      const depositoBaixaFinal = operacaoSelecionada?.id_deposito_baixa || depositoBaixa || null
      const depositoIncrementoFinal = operacaoSelecionada?.id_deposito_incremento || depositoIncremento || null
      
      console.debug('🏭 DEBUG - Depósitos para venda:', {
        operacao_id: operacaoId,
        operacao_deposito_baixa: operacaoSelecionada?.id_deposito_baixa,
        deposito_baixa_manual: depositoBaixa,
        deposito_baixa_final: depositoBaixaFinal,
        operacao_deposito_incremento: operacaoSelecionada?.id_deposito_incremento,
        deposito_incremento_manual: depositoIncremento,
        deposito_incremento_final: depositoIncrementoFinal
      })
      
      const payload = {
        id_operacao: operacaoId || null,
        id_cliente: clienteId, // obrigatório - não pode ser null
        id_vendedor1: vendedorId, // obrigatório - não pode ser null
        id_deposito_baixa: depositoBaixaFinal,
        id_deposito_incremento: depositoIncrementoFinal,
        itens: items.map(it => ({ id_produto: it.id_produto || null, quantidade: it.quantidade, valor_unitario: it.valor_unitario })),
        desconto: desconto || '0.00',
        observacoes: observacoes || '', // Incluir observações na venda
        // explicit flags for backend: prefer booleans so backend can detect presence reliably
        gerar_financeiro: (operacaoGeraFinanceiro || geraFinanceiro) ? true : false,
        // keep original keys
        forma_pagamento: formaPagamento || null,
        id_conta_bancaria: contaId || null,
        id_departamento: departamentoId || null,
        vencimento_parcela: vencimentoParcela || null,
        valor_parcela: parcelaValor || null,
        // add alternative keys to improve compatibility with backend naming
        id_forma_pagamento: formaPagamento || null,
        id_conta: contaId || null,
        // older backends might expect these alternative names; send booleans for clarity
        gera_financeiro: (operacaoGeraFinanceiro || geraFinanceiro) ? true : false,
        criar_financeiro: (operacaoGeraFinanceiro || geraFinanceiro) ? true : false,
        parcela_valor_num: parcelaValor ? Number(String(parcelaValor).replace(',', '.')) : null,
        desconto_num: desconto ? Number(String(desconto).replace(',', '.')) : 0
      }

      // debug: informações da operação para diagnóstico de estoque
      const operacaoDebug = operacoes.find(op => (op.id || op.id_operacao || op.pk) == operacaoId)
      console.debug('🔍 DEBUG - Informações da operação:', {
        operacao_id: operacaoId,
        operacao_nome: operacaoDebug?.nome_operacao,
        tipo_estoque_baixa: operacaoDebug?.tipo_estoque_baixa,
        id_deposito_baixa_operacao: operacaoDebug?.id_deposito_baixa,
        id_deposito_incremento_operacao: operacaoDebug?.id_deposito_incremento,
        controla_estoque: operacaoDebug?.tipo_estoque_baixa !== 'Nenhum',
        deposito_baixa_enviado: payload.id_deposito_baixa,
        deposito_incremento_enviado: payload.id_deposito_incremento,
        operacao_completa: operacaoDebug
      })
      
      // Verifica se a operação está configurada para controlar estoque
      if (!operacaoDebug || !operacaoDebug.tipo_estoque_baixa || operacaoDebug.tipo_estoque_baixa === 'Nenhum') {
        console.warn('⚠️ ATENÇéO: Operação não está configurada para controlar estoque!')
        console.warn('   Para o estoque ser decrementado, a operação precisa ter "Tipo de Estoque" diferente de "Nenhum"')
      } else {
        console.debug('✅ Operação configurada para controlar estoque:', operacaoDebug.tipo_estoque_baixa)
        
        // Verifica se tem depósito de baixa configurado
        if (!payload.id_deposito_baixa) {
          console.warn('⚠️ ATENÇéO: Nenhum depósito de baixa configurado!')
          console.warn('   O estoque pode não ser decrementado sem um depósito de baixa válido')
        } else {
          const depositoBaixa = depositos.find(d => (d.id || d.id_deposito || d.pk) == payload.id_deposito_baixa)
          console.debug('✅ Depósito de baixa configurado:', {
            id: payload.id_deposito_baixa,
            nome: depositoBaixa?.nome_deposito || depositoBaixa?.nome || 'Nome não encontrado'
          })
        }
      }

      // debug log to inspect what we're sending (open DevTools Network to confirm)
      const isEditing = editingVendaId !== null
      console.debug(isEditing ? 'Atualizando venda - payload:' : 'Criando venda - payload:', payload)
      
      // log dos produtos sendo vendidos para facilitar debug
      console.debug('📦 Produtos sendo vendidos (IDs para debug):')
      items.forEach((item, idx) => {
        if (item.id_produto) {
          const produto = productOptions.find(p => (p.id || p.id_produto || p.pk) == item.id_produto)
          const codigo = produto ? (produto.codigo_produto || produto.nome) : 'não encontrado'
          console.debug(`  ${idx + 1}. ID: ${item.id_produto} | Código: ${codigo} | Qtd: ${item.quantidade}`)
        }
      })

      const client = token
        ? axios.create({ baseURL: axiosInstance.defaults.baseURL, headers: { Authorization: `Bearer ${token}` } })
        : axiosInstance
      
      let resp
      if (isEditing) {
        // Atualizar venda existente
        resp = await client.put(`/vendas/${editingVendaId}/`, payload, { timeout: 20000 })
        console.debug('✅ Venda atualizada com sucesso!', {
          venda_id: editingVendaId,
          status: resp.status,
          url: resp.config?.url,
          resposta_completa: resp.data
        })
        setMessage({ type: 'success', text: 'Venda atualizada com sucesso. ID: ' + editingVendaId })
      } else {
        // Criar nova venda
        resp = await client.post('/api/vendas/', payload, { timeout: 20000 })
        console.debug('✅ Venda criada com sucesso!', {
          venda_id: resp.data.id_venda || resp.data.id,
          status: resp.status,
          url: resp.config?.url,
          resposta_completa: resp.data
        })
        setMessage({ type: 'success', text: 'Venda criada. ID: ' + (resp.data.id_venda || resp.data.id || '') })
      }
      
      // Capturar dados da venda para impressão
      const vendaId = isEditing ? editingVendaId : (resp.data.id_venda || resp.data.id || 'S/N')
      const clienteSelecionado = clientes.find(c => (c.id || c.id_cliente || c.pk) == clienteId)
      const vendedorSelecionado = vendedores.find(v => (v.id || v.id_vendedor || v.pk) == vendedorId)
      const operacaoParaImpressao = operacoes.find(op => (op.id || op.id_operacao || op.pk) == operacaoId)
      
      const dadosVenda = {
        numero_venda: vendaId,
        data_venda: new Date().toISOString(),
        cliente: clienteSelecionado || { nome: 'Cliente não encontrado' },
        vendedor: vendedorSelecionado || { nome: 'Vendedor não encontrado' },
        operacao: operacaoParaImpressao || { nome: 'Operação não encontrada' },
        empresa: {
          nome: operacaoParaImpressao?.empresa?.nome || 'EMPRESA',
          cnpj: operacaoParaImpressao?.empresa?.cnpj,
          endereco: operacaoParaImpressao?.empresa?.endereco,
          telefone: operacaoParaImpressao?.empresa?.telefone
        },
        produtos: items.map(item => {
          const produto = productOptions.find(p => (p.id || p.id_produto || p.pk) == item.id_produto)
          return {
            id_produto: item.id_produto,
            codigo_produto: produto?.codigo_produto || produto?.codigo || item.codigo_produto || '',
            nome_produto: produto?.nome_produto || produto?.nome || 'Produto não encontrado',
            quantidade: parseFloat(item.quantidade) || 0,
            valor_unitario: parseFloat(String(item.valor_unitario).replace(',', '.')) || 0,
            desconto_valor: parseFloat(String(item.desconto || '0').replace(',', '.')) || 0
          }
        }),
        valor_total: totalDocumento,
        desconto: parseFloat(String(desconto).replace(',', '.')) || 0,
        valor_final: totalDocumento - (parseFloat(String(desconto).replace(',', '.')) || 0),
        forma_pagamento: formaPagamento,
        condicao_pagamento: formasPagamento.find(fp => fp.id == formaPagamento)?.nome || formaPagamento,
        financeiro: {
          conta: contas.find(c => c.id == contaId)?.nome || contaId,
          departamento: departamentos.find(d => d.id == departamentoId)?.nome || departamentoId,
          vencimento: vencimentoParcela,
          valor_parcela: parseFloat(String(parcelaValor || '0').replace(',', '.')) || 0,
          gera_financeiro: operacaoGeraFinanceiro || geraFinanceiro
        },
        observacoes: '',
        ...resp.data // Incluir outros dados retornados pela API
      }
      
      // Armazenar dados para impressão
      setDadosUltimaVenda(dadosVenda)
      
      console.debug('📄 Dados da venda capturados para impressão:', dadosVenda)
      
      // Incrementar o próximo número da operação após criação bem-sucedida
      await incrementarProximoNumeroOperacao()
      
      // Recarregar produtos para atualizar estoque após venda
      await atualizarEstoqueProdutos()
      
      // Forçar recarga imediata da lista de produtos para mostrar estoque atualizado
      console.debug('🔄 Forçando recarga dos produtos para estoque atualizado...')
      await fetchProducts('')
      
      // Limpar itens da venda após sucesso
      setItems([emptyItem()])
      
      // Limpar dados de ediçéo
      if (isEditing) {
        setEditingVendaId(null)
      }
    } catch (err) {
      const text = axiosErrorMessage(err)
      setMessage({ type: 'error', text })
    }
  }

  // Fetch vendas with filters
  async function fetchVendas(page = vendasPage) {
    try {
      const params = {
        page: page,
        page_size: vendasPageSize,
      }
      if (filterDateFrom) params.date_from = filterDateFrom
      if (filterDateTo) params.date_to = filterDateTo
      if (clienteId) params.id_cliente = clienteId
      if (vendedorId) params.id_vendedor = vendedorId
      if (filterNumero) params.numero = filterNumero
      if (filterValorMin) params.valor_min = filterValorMin
      if (filterValorMax) params.valor_max = filterValorMax
      if (filterText) params.q = filterText

      const resp = await axiosInstance.get('/vendas/', { params, timeout: 20000 })
      setVendasList(resp.data.results || [])
      setVendasTotal(resp.data.count || 0)
      setVendasPage(page)
    } catch (err) {
      console.warn('fetch vendas error', err?.message || err)
      setVendasList([])
      setVendasTotal(0)
    }
  }

  // auto-fetch when list opened
  useEffect(() => {
    if (showList) fetchVendas(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showList])

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'numero_documento', headerName: 'Número', width: 140 },
    { field: 'data', headerName: 'Data', width: 200, valueGetter: (params) => params.row.data ? new Date(params.row.data).toLocaleString() : '' },
    { field: 'cliente', headerName: 'Cliente', width: 220, valueGetter: (params) => params.row.cliente || '' },
    { field: 'valor_total', headerName: 'Valor', width: 140, type: 'number', valueGetter: (params) => Number(params.row.valor_total || 0), valueFormatter: (params) => `R$ ${Number(params.value).toFixed(2)}` },
    {
      field: 'acoes',
      headerName: 'Ações',
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton size="small" aria-label="editar" onClick={() => handleEditClick(params.row)} title="Editar venda">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="excluir" onClick={() => handleDeleteClick(params.row)} title="Excluir venda">
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            aria-label="imprimir" 
            onClick={() => {
              const dadosVenda = prepararDadosVendaParaImpressao(params.row)
              setVendaSelecionadaImpressao(dadosVenda)
              setMostrarImpressao(true)
            }}
            title="Visualizar e imprimir"
            color="primary"
          >
            <PrintIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            aria-label="pdf" 
            onClick={async () => {
              const dadosVenda = prepararDadosVendaParaImpressao(params.row)
              setVendaSelecionadaImpressao(dadosVenda)
              setCarregandoPDF(true)
              try {
                const resultado = await baixarPDF(dadosVenda)
                if (!resultado.success) {
                  alert('Erro ao gerar PDF: ' + resultado.error)
                }
              } finally {
                setCarregandoPDF(false)
              }
            }}
            title="Baixar PDF"
            color="error"
            disabled={carregandoPDF}
          >
            <PictureAsPdfIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            aria-label="whatsapp" 
            onClick={async () => {
              const dadosVenda = prepararDadosVendaParaImpressao(params.row)
              setCarregandoWhatsApp(true)
              try {
                const numero = dadosVenda.cliente?.telefone || ''
                const resultado = await compartilharWhatsApp(dadosVenda, numero)
                if (!resultado.success) {
                  alert('Erro ao compartilhar: ' + resultado.error)
                }
              } finally {
                setCarregandoWhatsApp(false)
              }
            }}
            title="Enviar WhatsApp"
            color="success"
            disabled={carregandoWhatsApp}
          >
            <WhatsAppIcon fontSize="small" />
          </IconButton>
        </div>
      )
    }
  ]

  // handlers for actions
  async function buscarDadosCompletosVenda(vendaId) {
    try {
      const resp = await axiosInstance.get(`/vendas/${vendaId}/`, { timeout: 10000 })
      return resp.data
    } catch (err) {
      console.warn('Erro ao buscar dados completos da venda:', err)
      return null
    }
  }

  async function recarregarDadosBasicos() {
    try {
      const opts = { timeout: 10000 }
      const [opsRes, clientsRes, vendsRes] = await Promise.all([
        axiosInstance.get('/operacoes/', opts),
        axiosInstance.get('/clientes/', opts),
        axiosInstance.get('/vendedores/', opts)
      ])
      
      const ops = Array.isArray(opsRes.data) ? opsRes.data : opsRes.data.results || []
      const clients = Array.isArray(clientsRes.data) ? clientsRes.data : clientsRes.data.results || []
      const vends = Array.isArray(vendsRes.data) ? vendsRes.data : vendsRes.data.results || []
      
      setOperacoes(ops)
      setClientes(clients)
      setVendedores(vends)
      
      console.log('✅ Dados básicos recarregados:', { operacoes: ops.length, clientes: clients.length, vendedores: vends.length })
    } catch (err) {
      console.warn('Erro ao recarregar dados básicos:', err)
    }
  }

  async function handleEditClick(row) {
    try {
      console.log('Editando venda - dados recebidos:', row)
      
      // Sempre recarregar dados básicos antes de editar para garantir que estéo atualizados
      setMessage({ type: 'info', text: 'Carregando dados para ediçéo...' })
      await recarregarDadosBasicos()
      
      const vendaId = row.id || row.id_venda || row.pk
      let dadosCompletos = row
      
      // Tentar buscar dados completos da API se temos um ID válido
      if (vendaId) {
        const dadosDetalhados = await buscarDadosCompletosVenda(vendaId)
        if (dadosDetalhados) {
          dadosCompletos = dadosDetalhados
          console.log('Dados completos da venda carregados:', dadosCompletos)
        } else {
          console.log('Usando dados da listagem (não foi possível carregar detalhes)')
        }
      }
      
      // Debug dos IDs que estamos tentando definir
      console.log('Debug - IDs para definir:', {
        operacao: dadosCompletos.id_operacao || dadosCompletos.id_operacao_padrao,
        cliente: dadosCompletos.id_cliente,
        vendedor: dadosCompletos.id_vendedor1 || dadosCompletos.id_vendedor
      })
      
      // Debug das listas disponíveis
      console.log('Debug - Listas disponíveis:', {
        operacoes: operacoes.map(op => ({ id: op.id || op.id_operacao || op.pk, nome: op.nome_operacao || op.nome })),
        clientes: clientes.map(cl => ({ id: cl.id || cl.id_cliente || cl.pk, nome: cl.nome || cl.razao_social })),
        vendedores: vendedores.map(vd => ({ id: vd.id || vd.id_vendedor || vd.pk, nome: vd.nome }))
      })
      
      // Dados básicos da venda - convertendo IDs para string para compatibilidade
      const operacaoIdParaDefinir = String(dadosCompletos.id_operacao || dadosCompletos.id_operacao_padrao || '')
      const clienteIdParaDefinir = String(dadosCompletos.id_cliente || '')
      const vendedorIdParaDefinir = String(dadosCompletos.id_vendedor1 || dadosCompletos.id_vendedor || '')
      
      console.log('Debug - IDs convertidos para string:', {
        operacao: operacaoIdParaDefinir,
        cliente: clienteIdParaDefinir,
        vendedor: vendedorIdParaDefinir
      })
      
      // Verificar se os IDs existem nas listas - com busca mais robusta
      const operacaoEncontrada = operacoes.find(op => {
        const opId = op.id || op.id_operacao || op.pk
        return String(opId) === operacaoIdParaDefinir || Number(opId) === Number(operacaoIdParaDefinir)
      })
      
      const clienteEncontrado = clientes.find(cl => {
        const clId = cl.id || cl.id_cliente || cl.pk
        return String(clId) === clienteIdParaDefinir || Number(clId) === Number(clienteIdParaDefinir)
      })
      
      const vendedorEncontrado = vendedores.find(vd => {
        const vdId = vd.id || vd.id_vendedor || vd.pk
        return String(vdId) === vendedorIdParaDefinir || Number(vdId) === Number(vendedorIdParaDefinir)
      })
      
      console.log('Debug - Dados encontrados:', {
        operacao: operacaoEncontrada,
        cliente: clienteEncontrado,
        vendedor: vendedorEncontrado
      })
      
      // Se não encontrou pelos IDs, tentar buscar pelos nomes
      if (!operacaoEncontrada && dadosCompletos.operacao) {
        const operacaoPorNome = operacoes.find(op => 
          (op.nome_operacao || op.nome || '').toLowerCase().includes(dadosCompletos.operacao.toLowerCase())
        )
        if (operacaoPorNome) {
          console.log('✅ Operação encontrada por nome:', operacaoPorNome)
          setOperacaoId(String(operacaoPorNome.id || operacaoPorNome.id_operacao || operacaoPorNome.pk))
        }
      } else {
        setOperacaoId(operacaoIdParaDefinir)
      }
      
      if (!clienteEncontrado && dadosCompletos.cliente) {
        const clientePorNome = clientes.find(cl => 
          (cl.nome || cl.razao_social || '').toLowerCase().includes(dadosCompletos.cliente.toLowerCase())
        )
        if (clientePorNome) {
          console.log('✅ Cliente encontrado por nome:', clientePorNome)
          setClienteId(String(clientePorNome.id || clientePorNome.id_cliente || clientePorNome.pk))
        }
      } else {
        setClienteId(clienteIdParaDefinir)
      }
      
      if (!vendedorEncontrado && (dadosCompletos.vendedor || dadosCompletos.vendedor1)) {
        const vendedorNome = dadosCompletos.vendedor || dadosCompletos.vendedor1
        const vendedorPorNome = vendedores.find(vd => 
          (vd.nome || '').toLowerCase().includes(vendedorNome.toLowerCase())
        )
        if (vendedorPorNome) {
          console.log('✅ Vendedor encontrado por nome:', vendedorPorNome)
          setVendedorId(String(vendedorPorNome.id || vendedorPorNome.id_vendedor || vendedorPorNome.pk))
        }
      } else {
        setVendedorId(vendedorIdParaDefinir)
      }
      setDesconto(dadosCompletos.desconto != null ? String(dadosCompletos.desconto) : '0.00')
      
      // Aguardar um pouco mais para garantir que os states e listas sejam atualizados
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Verificar quais foram definidos após aguardar
      const operacaoAtual = operacaoId
      const clienteAtual = clienteId
      const vendedorAtual = vendedorId
      
      console.log('Debug - Estados após aguardar:', {
        operacaoId: operacaoAtual,
        clienteId: clienteAtual, 
        vendedorId: vendedorAtual,
        operacoesCount: operacoes.length,
        clientesCount: clientes.length,
        vendedoresCount: vendedores.length
      })
      
      // Dados financeiros
      setFormaPagamento(dadosCompletos.forma_pagamento || dadosCompletos.id_forma_pagamento || '')
      setGeraFinanceiro(dadosCompletos.gera_financeiro || false)
      setContaId(dadosCompletos.id_conta || dadosCompletos.conta_id || '')
      setDepartamentoId(dadosCompletos.id_departamento || dadosCompletos.departamento_id || '')
      setVencimentoParcela(dadosCompletos.vencimento_parcela || dadosCompletos.vencimento || '')
      setParcelaValor(dadosCompletos.valor_parcela || dadosCompletos.valor_total || '0.00')
      
      // Observações
      setObservacoes(dadosCompletos.observacoes || '')
      
      // Produtos/Itens da venda
      if (Array.isArray(dadosCompletos.itens) && dadosCompletos.itens.length > 0) {
        const itensFormatados = dadosCompletos.itens.map(it => ({
          id_produto: it.id_produto || it.produto_id || null,
          codigo_produto: it.codigo_produto || it.produto_codigo || '',
          quantidade: String(it.quantidade || it.qtd || 1),
          valor_unitario: String(it.valor_unitario || it.preco || '0.00'),
          desconto: String(it.desconto || it.desconto_valor || '0.00')
        }))
        setItems(itensFormatados)
        console.log('Itens carregados para ediçéo:', itensFormatados)
      } else {
        // Se não há itens detalhados, criar um item baseado no valor total
        const itemPlaceholder = {
          id_produto: null,
          codigo_produto: '',
          quantidade: '1',
          valor_unitario: String(dadosCompletos.valor_total || '0.00'),
          desconto: '0.00'
        }
        setItems([itemPlaceholder])
        console.log('Criado item placeholder para ediçéo:', itemPlaceholder)
      }
      
      // Dados para ediçéo
      setEditingVendaId(vendaId)
      
      // Fechar listagem e abrir formulário
      setShowList(false)
      
      // Verificar novamente quais foram encontrados para a mensagem final
      const operacaoFinal = operacoes.find(op => {
        const opId = op.id || op.id_operacao || op.pk
        return String(opId) === operacaoAtual
      })
      const clienteFinal = clientes.find(cl => {
        const clId = cl.id || cl.id_cliente || cl.pk
        return String(clId) === clienteAtual
      })
      const vendedorFinal = vendedores.find(vd => {
        const vdId = vd.id || vd.id_vendedor || vd.pk
        return String(vdId) === vendedorAtual
      })
      
      // Mensagem detalhada de sucesso
      const statusMsg = [
        `Venda #${vendaId} carregada para ediçéo.`,
        operacaoFinal ? `✅ Operação: ${operacaoFinal.nome_operacao || operacaoFinal.nome}` : '❌ Operação não encontrada',
        clienteFinal ? `✅ Cliente: ${clienteFinal.nome || clienteFinal.razao_social}` : '❌ Cliente não encontrado', 
        vendedorFinal ? `✅ Vendedor: ${vendedorFinal.nome}` : '❌ Vendedor não encontrado'
      ].join(' | ')
      
      setMessage({ type: 'success', text: statusMsg })
      
    } catch (e) {
      console.error('Erro ao carregar venda para ediçéo:', e)
      setMessage({ type: 'error', text: 'Erro ao carregar venda para ediçéo: ' + (e.message || 'Erro desconhecido') })
    }
  }

  async function handleDeleteClick(row) {
    const id = row.id || row.id_venda || row.pk
    if (!id) { setMessage({ type: 'error', text: 'ID da venda não encontrado.' }); return }
    if (!window.confirm('Confirma excluir venda #' + id + '?')) return
    // Permanent behavior: always use POST with X-HTTP-Method-Override: DELETE.
    // This avoids multiple attempts and matches servers that accept method override.
    try {
      console.debug('Excluindo venda via override POST', `/vendas/${id}/`)
      const resp = await axiosInstance.request({ method: 'post', url: `/vendas/${id}/`, headers: { 'X-HTTP-Method-Override': 'DELETE' }, data: null, timeout: 20000 })
      console.debug('Exclusão bem-sucedida via override', resp.status)
      setMessage({ type: 'success', text: 'Venda excluída.' })
      fetchVendas(1)
      return
    } catch (e) {
      // Log detalhado para debugging do erro 500
      console.error('Exclusão via override falhou - status:', e.response?.status)
      console.error('Response data:', e.response?.data)
      console.error('Response headers:', e.response?.headers)
      console.error('Axios error object:', e)
      const status = e.response?.status
      if (status === 401 || status === 403) { setMessage({ type: 'error', text: `Sem permissão para excluir (status ${status}). Verifique autenticação/CSRF.` }); return }
      // Tente extrair informação útil do body
      const msg = axiosErrorMessage(e)
      setMessage({ type: 'error', text: `Erro ao excluir venda via override POST (status ${status || 'N/A'}). Detalhe: ${msg}` })
      return
    }
  }

  // Gerenciar estado dos menus quando modal abre/fecha
  useEffect(() => {
    if (showList) {
      desabilitarMenus();
    } else {
      habilitarMenus();
    }
    
    // Cleanup: reabilitar menus quando componente desmonta
    return () => {
      habilitarMenus();
    };
  }, [showList, desabilitarMenus, habilitarMenus]);

  const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  return (
    <>
      {/* botão para voltar ao início */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Vendas
        </Typography>
        <BotaoVoltarInicio variant="buttons" />
      </Box>

      {/* Alerta de ediçéo */}
      {editingVendaId && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
            ⚠️ Editando Venda #{editingVendaId}
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.dark' }}>
            Você está modificando uma venda existente. Altere os dados necessários e clique em "Atualizar Venda".
          </Typography>
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper style={{ padding: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <TextField
              select
              label="Operação*"
              value={operacaoId}
              onChange={e => setOperacaoId(e.target.value)}
              size="small"
              style={{ minWidth: 220 }}
              required
              error={!operacaoId}
              helperText={!operacaoId ? "Operação é obrigatória" : ""}
            >
              <MenuItem value="">-- Selecionar operação --</MenuItem>
              {operacoes.map(o => (
                <MenuItem key={o.id || o.id_operacao || o.pk} value={o.id || o.id_operacao || o.pk}>{o.nome_operacao || o.nome || o.descricao}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Cliente*"
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              size="small"
              style={{ minWidth: 220 }}
              required
              error={!clienteId}
              helperText={!clienteId ? "Cliente é obrigatório" : ""}
            >
              <MenuItem value="">-- Selecionar cliente --</MenuItem>
              {clientes.map(c => (
                <MenuItem key={c.id_cliente || c.id || c.pk} value={c.id_cliente || c.id || c.pk}>{c.nome_razao_social || c.nome || c.razao_social || c.nome_cliente}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Vendedor*"
              value={vendedorId}
              onChange={e => setVendedorId(e.target.value)}
              size="small"
              style={{ minWidth: 200 }}
              required
              error={!vendedorId}
              helperText={!vendedorId ? "Vendedor é obrigatório" : ""}
            >
              <MenuItem value="">-- Selecionar vendedor --</MenuItem>
              {vendedores.map(v => (
                <MenuItem key={v.id_vendedor || v.id || v.pk} value={v.id_vendedor || v.id || v.pk}>{v.nome || v.nome_vendedor || v.username}</MenuItem>
              ))}
            </TextField>

            <TextField label="Token (JWT)" value={token} onChange={e => setToken(e.target.value)} size="small" style={{ width: 300 }} helperText="Opcional: cole apenas o token JWT" />
            {/* controle explícito para gerar financeiro */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(geraFinanceiro)}
                  onChange={(e) => setGeraFinanceiro(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label={operacaoGeraFinanceiro ? 'Gerar financeiro (definido pela operação)' : 'Gerar financeiro'}
            />
            {/* botão de listar vendas removido daqui e colocado como botão fixo inferior */}
          </div>

          {/* Aviso sobre controle de estoque da operação */}
          {operacaoId && (() => {
            const operacao = operacoes.find(op => (op.id || op.id_operacao || op.pk) == operacaoId)
            if (!operacao) return null
            
            const controlaEstoque = operacao.tipo_estoque_baixa && operacao.tipo_estoque_baixa !== 'Nenhum'
            const depositoId = operacao.id_deposito_baixa || operacao.id_deposito || depositoBaixa
            
            // Busca o nome do depósito
            let nomeDeposito = ''
            if (depositoId) {
              const deposito = depositos.find(d => (d.id || d.id_deposito || d.pk) == depositoId)
              nomeDeposito = deposito ? (deposito.nome_deposito || deposito.nome || `ID: ${depositoId}`) : `ID: ${depositoId}`
            }
            
            if (controlaEstoque) {
              return (
                <div style={{ margin: '12px 0', padding: 8, backgroundColor: '#e8f5e8', border: '1px solid #4caf50', borderRadius: 4 }}>
                  <Typography variant="body2" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                    ✅ Controle de Estoque: ATIVO
                  </Typography>
                  <Typography variant="caption" style={{ color: '#388e3c' }}>
                    Esta operação irá dar baixa no estoque ({operacao.tipo_estoque_baixa})
                    {depositoId && ` - Depósito de Baixa: ${nomeDeposito}`}
                  </Typography>
                  {!depositoId && (
                    <Typography variant="caption" style={{ color: '#f57c00', display: 'block', marginTop: 4 }}>
                      ⚠️ Atençéo: Nenhum depósito de baixa configurado na operação
                    </Typography>
                  )}
                </div>
              )
            } else {
              return (
                <div style={{ margin: '12px 0', padding: 8, backgroundColor: '#fff3e0', border: '1px solid #ff9800', borderRadius: 4 }}>
                  <Typography variant="body2" style={{ color: '#e65100', fontWeight: 'bold' }}>
                    ⚠️ Controle de Estoque: DESATIVADO
                  </Typography>
                  <Typography variant="caption" style={{ color: '#ef6c00' }}>
                    Esta operação não irá dar baixa no estoque. Para ativar, configure o "Tipo de Estoque" na operação.
                  </Typography>
                </div>
              )
            }
          })()}

          {items.map((it, idx) => (
            <Grid container spacing={1} alignItems="center" key={idx} style={{ marginBottom: 8 }}>
              <Grid item xs={6}>
                <Autocomplete
                  freeSolo
                  options={productOptions}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option
                    const nome = option.nome_produto || option.nome || option.codigo_produto || ''
                    const operacaoSelecionada = operacoes.find(op => (op.id || op.id_operacao || op.pk) == operacaoId)
                    const depositoId = operacaoSelecionada?.id_deposito_baixa || depositoBaixa
                    const estoque = obterEstoqueProduto(option, depositoId)
                    
                    // Detectar se é estoque específico do depósito
                    const temEstoqueEspecifico = option.estoque_deposito != null || 
                      (depositoId && option.estoques && Array.isArray(option.estoques) && option.estoques.find(e => e.id_deposito == depositoId || e.deposito_id == depositoId)) ||
                      (depositoId && option.estoque && typeof option.estoque === 'object' && option.estoque[depositoId] != null)
                    
                    const tipoEstoque = temEstoqueEspecifico ? '(Dep.)' : '(Geral)'
                    return `${nome} - Est: ${estoque} ${tipoEstoque}`
                  }}
                  onInputChange={(e, value, reason) => {
                    if (reason === 'input') {
                      if (productFetchTimer.current) clearTimeout(productFetchTimer.current)
                      productFetchTimer.current = setTimeout(() => fetchProducts(value), 300)
                    }
                  }}
                  onFocus={() => { if (!productOptions || productOptions.length === 0) fetchProducts('') }}
                  onChange={(e, value) => {
                    if (!value) return
                    if (typeof value === 'string') { updateItem(idx, { codigo_produto: value }); return }
                    const operacaoSelecionada = operacoes.find(op => (op.id || op.id_operacao || op.pk) == operacaoId)
                    const depositoId = operacaoSelecionada?.id_deposito_baixa || depositoBaixa
                    const estoque = obterEstoqueProduto(value, depositoId)
                    
                    updateItem(idx, {
                      id_produto: value.id || value.id_produto || value.pk || null,
                      codigo_produto: value.codigo_produto || value.codigo || '',
                      valor_unitario: (value.valor_venda != null ? String(value.valor_venda) : (value.preco || '0.00')),
                      estoque_disponivel: estoque
                    })
                  }}
                  renderOption={(props, option) => {
                    const nome = option.nome_produto || option.nome || option.codigo_produto || ''
                    const operacaoSelecionada = operacoes.find(op => (op.id || op.id_operacao || op.pk) == operacaoId)
                    const depositoId = operacaoSelecionada?.id_deposito_baixa || depositoBaixa
                    const estoque = obterEstoqueProduto(option, depositoId)
                    const estoqueColor = estoque > 0 ? 'green' : 'red'
                    
                    // Detectar se é estoque específico do depósito
                    const temEstoqueEspecifico = option.estoque_deposito != null || 
                      (depositoId && option.estoques && Array.isArray(option.estoques) && option.estoques.find(e => e.id_deposito == depositoId || e.deposito_id == depositoId)) ||
                      (depositoId && option.estoque && typeof option.estoque === 'object' && option.estoque[depositoId] != null)
                    
                    const tipoEstoque = temEstoqueEspecifico ? '(Dep.)' : '(Geral)'
                    
                    // Log detalhado do produto para debug
                    console.debug('🔍 Produto no autocomplete:', {
                      id: option.id || option.id_produto || option.pk,
                      nome: nome,
                      codigo: option.codigo_produto,
                      estoque_atual: option.estoque_atual,
                      estoque_deposito: option.estoque_deposito,
                      dados_completos: option
                    })
                    
                    return (
                      <li {...props} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{nome}</span>
                        <span style={{ color: estoqueColor, fontWeight: 'bold' }}>Est: {estoque} {tipoEstoque}</span>
                      </li>
                    )
                  }}
                  renderInput={(params) => <TextField {...params} label="Produto (autocomplete)" size="small" />}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField 
                  label="Quantidade" 
                  value={it.quantidade} 
                  onChange={e => updateItem(idx, { quantidade: e.target.value })} 
                  size="small" 
                  fullWidth 
                  helperText={
                    it.estoque_disponivel != null 
                      ? `Disponível: ${it.estoque_disponivel}` 
                      : ''
                  }
                  error={
                    it.estoque_disponivel != null && 
                    parseFloat(it.quantidade || 0) > it.estoque_disponivel
                  }
                />
              </Grid>
              <Grid item xs={3}><TextField label="Valor Unit." value={it.valor_unitario} onChange={e => updateItem(idx, { valor_unitario: e.target.value })} size="small" fullWidth /></Grid>
              <Grid item xs={1}><IconButton onClick={() => removeItem(idx)} aria-label="remove"><DeleteIcon /></IconButton></Grid>
            </Grid>
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <Button startIcon={<AddIcon />} onClick={addItem} variant="outlined">Adicionar item</Button>
            <Button 
              size="small" 
              variant="outlined" 
              color="secondary"
              onClick={() => {
                console.debug('🔄 Recarregando produtos manualmente...')
                fetchProducts('')
              }}
              title="Recarregar estoque dos produtos"
            >
              🔄 Atualizar Estoque
            </Button>
            <Button 
              variant="outlined"
              size="small"
              color="info"
              onClick={() => {
                console.debug('🐛 DEBUG - Estado atual:', {
                  operacaoId,
                  operacaoSelecionada: operacoes.find(op => (op.id || op.id_operacao || op.pk) == operacaoId),
                  depositoBaixa,
                  productOptions: productOptions.slice(0, 2).map(p => ({
                    id: p.id,
                    nome: p.nome,
                    estoque_deposito: p.estoque_deposito,
                    estoques: p.estoques,
                    estoque: p.estoque,
                    estoque_atual: p.estoque_atual
                  })),
                  apiSuportaDeposito
                })
                alert('Debug info enviado para o console (F12)')
              }}
              title="Debug - Ver dados no console"
              style={{ marginLeft: '8px' }}
            >
              🐛 Debug
            </Button>
          </div>
          
          {/* Avisos de estoque */}
          {items.some(it => it.estoque_disponivel != null && it.estoque_disponivel <= 0) && (
            <div style={{ marginTop: 12, padding: 8, backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: 4 }}>
              <Typography variant="body2" style={{ color: '#856404', fontWeight: 'bold' }}>
                ⚠️ Atençéo: Alguns produtos têm estoque baixo ou zerado!
              </Typography>
            </div>
          )}
          
          {items.some(it => it.estoque_disponivel != null && parseFloat(it.quantidade || 0) > it.estoque_disponivel) && (
            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: 4 }}>
              <Typography variant="body2" style={{ color: '#721c24', fontWeight: 'bold' }}>
                ❌ Erro: Quantidade solicitada excede estoque disponível!
              </Typography>
            </div>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={5}>
        <Paper style={{ padding: 12 }}>

          {(operacaoGeraFinanceiro || geraFinanceiro) && (
            <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Financeiro (definido pela operação)</div>
              <div style={{ marginBottom: 8 }}>
                <Select fullWidth value={formaPagamento} onChange={e => handleFormaChange(e.target.value)} displayEmpty>
                  <MenuItem value="">-- Selecionar forma --</MenuItem>
                  {formasPagamento.map(f => (
                    <MenuItem key={f.id || f.raw?.id_forma_pagamento || f.nome} value={f.id}>{f.nome}</MenuItem>
                  ))}
                </Select>
              </div>

              <div style={{ marginBottom: 8 }}>
                <Select fullWidth value={contaId} onChange={e => setContaId(e.target.value)} displayEmpty>
                  <MenuItem value="">-- Selecionar conta --</MenuItem>
                  {contas.map(c => (
                    <MenuItem key={c.id_conta_bancaria || c.id || c.pk} value={c.id_conta_bancaria || c.id || c.pk}>{c.nome_conta || c.nome}</MenuItem>
                  ))}
                </Select>
              </div>

              <div style={{ marginBottom: 8 }}>
                <Select fullWidth value={departamentoId} onChange={e => setDepartamentoId(e.target.value)} displayEmpty>
                  <MenuItem value="">-- Selecionar departamento --</MenuItem>
                  {departamentos.map(d => (
                    <MenuItem key={d.id_departamento || d.id || d.pk} value={d.id_departamento || d.id || d.pk}>{d.nome_departamento || d.nome}</MenuItem>
                  ))}
                </Select>
              </div>

              <div style={{ marginBottom: 8 }}>
                <TextField label="Vencimento da parcela" type="date" value={vencimentoParcela} onChange={e => setVencimentoParcela(e.target.value)} size="small" fullWidth InputLabelProps={{ shrink: true }} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <TextField label="Valor da parcela" value={parcelaValor} onChange={e => setParcelaValor(e.target.value)} size="small" fullWidth />
              </div>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#666' }}>Total produtos</div>
              <div>R$ {totalProdutos.toFixed(2)}</div>
            </div>

            <div style={{ marginTop: 8 }}>
              <TextField label="Desconto" value={desconto} onChange={e => setDesconto(e.target.value)} size="small" fullWidth />
            </div>

            <div style={{ marginTop: 8 }}>
              <TextField 
                label="Observações" 
                value={observacoes} 
                onChange={e => setObservacoes(e.target.value)} 
                size="small" 
                fullWidth 
                multiline 
                rows={2}
                placeholder="Observações sobre a venda..."
              />
            </div>

            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Total do documento</div>
              <div style={{ fontWeight: 600 }}>R$ {totalDocumento.toFixed(2)}</div>
            </div>

            {operacaoEstoqueNormalizado === 'saida' && (
              <div style={{ marginTop: 8, color: '#9a1f2b', fontSize: 13 }}>Em baixa: R$ {totalProdutos.toFixed(2)}</div>
            )}

            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary" onClick={submit}>
                {editingVendaId ? 'Atualizar Venda' : 'Criar Venda'}
              </Button>
              
              {editingVendaId && (
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setEditingVendaId(null)
                    setItems([emptyItem()])
                    setOperacaoId('')
                    setClienteId('')
                    setVendedorId('')
                    setDesconto('0.00')
                    setFormaPagamento('')
                    setObservacoes('')
                    setMessage({ type: 'info', text: 'Ediçéo cancelada. Novo formulário de venda iniciado.' })
                  }}
                >
                  Cancelar Ediçéo
                </Button>
              )}
              
              {/* Botões de impressão - só aparecem quando há uma venda criada */}
              {dadosUltimaVenda && (
                <>
                  <Button 
                    variant="outlined" 
                    size="small"
                    color="secondary"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    title="Imprimir nota de venda"
                  >
                    Imprimir
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    size="small"
                    color="error"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={async () => {
                      setCarregandoPDF(true)
                      try {
                        const resultado = await baixarPDF(dadosUltimaVenda)
                        if (!resultado.success) {
                          alert('Erro ao gerar PDF: ' + resultado.error)
                        }
                      } finally {
                        setCarregandoPDF(false)
                      }
                    }}
                    disabled={carregandoPDF}
                    title="Baixar PDF da venda"
                  >
                    {carregandoPDF ? 'Gerando...' : 'Salvar PDF'}
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    size="small"
                    color="success"
                    startIcon={<WhatsAppIcon />}
                    onClick={async () => {
                      setCarregandoWhatsApp(true)
                      try {
                        const numero = dadosUltimaVenda.cliente?.telefone || ''
                        const resultado = await compartilharPDFWhatsApp(dadosUltimaVenda, numero)
                        if (!resultado.success) {
                          alert('Erro ao compartilhar: ' + resultado.error)
                        }
                      } finally {
                        setCarregandoWhatsApp(false)
                      }
                    }}
                    disabled={carregandoWhatsApp}
                    title="Enviar para WhatsApp"
                  >
                    {carregandoWhatsApp ? 'Enviando...' : 'WhatsApp'}
                  </Button>
                  
                  <Button 
                    variant="text" 
                    size="small"
                    onClick={() => setMostrarImpressao(true)}
                    title="Visualizar nota de venda"
                  >
                    👁️ Visualizar
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    size="small"
                    color="warning"
                    onClick={() => {
                      // Criar dados de teste para impressão
                      const dadosTeste = {
                        numero_venda: 'TESTE-001',
                        data_venda: new Date().toISOString(),
                        cliente: { 
                          nome: 'Cliente Teste', 
                          cpf_cnpj: '123.456.789-10',
                          telefone: '(11) 99999-9999',
                          email: 'cliente@teste.com'
                        },
                        vendedor: { nome: 'Vendedor Teste', codigo: 'V001' },
                        operacao: { nome_operacao: 'VENDA TESTE' },
                        empresa: {
                          nome: 'EMPRESA TESTE LTDA',
                          cnpj: '12.345.678/0001-90',
                          endereco: 'Rua Teste, 123 - Centro',
                          telefone: '(11) 3333-4444'
                        },
                        produtos: [
                          {
                            codigo_produto: 'PROD001',
                            nome_produto: 'Produto Teste 1',
                            quantidade: 2,
                            valor_unitario: 100.50,
                            desconto_valor: 0
                          },
                          {
                            codigo_produto: 'PROD002', 
                            nome_produto: 'Produto Teste 2',
                            quantidade: 1,
                            valor_unitario: 250.00,
                            desconto_valor: 25.00
                          }
                        ],
                        valor_total: 451.00,
                        desconto: 25.00,
                        valor_final: 426.00,
                        forma_pagamento: 'Dinheiro',
                        financeiro: {
                          conta: 'Conta Corrente',
                          departamento: 'Vendas',
                          gera_financeiro: true
                        }
                      }
                      setDadosUltimaVenda(dadosTeste)
                      setMostrarImpressao(true)
                    }}
                    title="Testar impressão com dados fictícios"
                  >
                    🧪 Teste Impressão
                  </Button>
                </>
              )}
              <Button 
                variant="outlined" 
                size="small" 
                onClick={atualizarEstoqueProdutos}
                title="Clique para recarregar o estoque dos produtos"
              >
                🔄 Atualizar Estoque
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                color="secondary"
                onClick={async () => {
                  // testa estoque dos produtos selecionados
                  for (const item of items) {
                    if (item.id_produto) {
                      await verificarEstoqueProduto(item.id_produto)
                    }
                  }
                }}
                title="Verifica estoque diretamente na API"
              >
                🔬 Testar API
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                color="warning"
                onClick={testarProcessamentoVenda}
                title="Testa o processamento completo de venda"
              >
                🧪 Teste Completo
              </Button>
              
              {/* Campo para testar produto específico por ID */}
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="ID do produto"
                  style={{ width: 120 }}
                  value={debugProdutoId || ''}
                  onChange={(e) => setDebugProdutoId(e.target.value)}
                />
                <Button 
                  variant="outlined" 
                  size="small" 
                  color="info"
                  onClick={async () => {
                    if (debugProdutoId) {
                      await verificarEstoqueProduto(debugProdutoId)
                    }
                  }}
                  title="Verifica estoque de um produto específico por ID"
                >
                  🔍 Verificar
                </Button>
              </div>
            </div>
          </div>

          {message && (
            <div style={{ marginTop: 12, color: message.type === 'error' ? '#b00020' : '#166534' }}>
              {message.text}
            </div>
          )}
        </Paper>

        <Dialog fullScreen open={showList} onClose={() => setShowList(false)} TransitionComponent={Transition}>
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => setShowList(false)} aria-label="close">
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">Listagem de Vendas</Typography>
              <Button 
                color="inherit" 
                startIcon={<PrintIcon />}
                onClick={() => {
                  if (vendasList.length > 0) {
                    // Imprimir primeiro resultado como exemplo
                    const dadosVenda = prepararDadosVendaParaImpressao(vendasList[0])
                    setVendaSelecionadaImpressao(dadosVenda)
                    setMostrarImpressao(true)
                  } else {
                    alert('Nenhuma venda encontrada para imprimir')
                  }
                }}
                style={{ marginRight: 8 }}
                title="Imprimir primeira venda da lista"
              >
                Imprimir
              </Button>
              <Button autoFocus color="inherit" onClick={() => fetchVendas(1)}>
                Atualizar
              </Button>
            </Toolbar>
          </AppBar>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <TextField label="Data de" type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
              <TextField label="Data até" type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
              <TextField label="Número" value={filterNumero} onChange={e => setFilterNumero(e.target.value)} size="small" />
              <TextField label="Valor min" value={filterValorMin} onChange={e => setFilterValorMin(e.target.value)} size="small" />
              <TextField label="Valor max" value={filterValorMax} onChange={e => setFilterValorMax(e.target.value)} size="small" />
              <TextField label="Busca" value={filterText} onChange={e => setFilterText(e.target.value)} size="small" style={{ minWidth: 220 }} />
              <Button variant="contained" onClick={() => fetchVendas(1)}>Buscar</Button>
              
              {/* Indicadores de carregamento */}
              {(carregandoPDF || carregandoWhatsApp) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
                  {carregandoPDF && <span style={{ fontSize: '12px', color: '#ff5722' }}>📄 Gerando PDF...</span>}
                  {carregandoWhatsApp && <span style={{ fontSize: '12px', color: '#4caf50' }}>💬 Enviando WhatsApp...</span>}
                </div>
              )}
            </div>

            <Box sx={{ height: '70vh', width: '100%' }}>
              <DataGrid
                rows={vendasList}
                columns={columns}
                getRowId={(row) => row.id || row.id_venda || row.numero_documento}
                pagination
                pageSize={vendasPageSize}
                rowsPerPageOptions={[10, 20, 50]}
                paginationMode="server"
                rowCount={vendasTotal}
                page={Math.max(0, vendasPage - 1)}
                onPageChange={(newPage) => fetchVendas(newPage + 1)}
                onPageSizeChange={(newSize) => { setVendasPageSize(newSize); fetchVendas(1) }}
                getDetailPanelContent={({ row }) => (
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Itens da venda</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>Produto</th>
                          <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 6 }}>Quantidade</th>
                          <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 6 }}>Valor Unit.</th>
                          <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 6 }}>Desconto</th>
                          <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 6 }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(row.itens || []).map(it => (
                          <tr key={it.id}>
                            <td style={{ padding: 6 }}>{it.produto_nome || ''}</td>
                            <td style={{ padding: 6, textAlign: 'right' }}>{it.quantidade}</td>
                            <td style={{ padding: 6, textAlign: 'right' }}>R$ {Number(it.valor_unitario || 0).toFixed(2)}</td>
                            <td style={{ padding: 6, textAlign: 'right' }}>R$ {Number(it.desconto_valor || 0).toFixed(2)}</td>
                            <td style={{ padding: 6, textAlign: 'right' }}>R$ {Number(it.valor_total || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                getDetailPanelHeight={({ row }) => Math.max(120, ((row.itens || []).length + 1) * 40)}
                disableSelectionOnClick
              />
            </Box>
          </div>
        </Dialog>
      </Grid>
    </Grid>
    {/* botão fixo inferior para mostrar/ocultar vendas */}
    {typeof document !== 'undefined' ? createPortal(
      <Box sx={{ position: 'fixed', left: 16, bottom: 16, zIndex: 2147483647 }}>
        <Button
          id="mostrar-vendas-button"
          variant={showList ? 'contained' : 'outlined'}
          color="primary"
          onClick={() => setShowList(s => !s)}
          sx={{ minWidth: 140, boxShadow: 3, color: '#fff', '&.MuiButton-outlined': { color: '#fff', borderColor: 'rgba(255,255,255,0.2)' } }}
        >
          {showList ? 'Ocultar vendas' : 'Mostrar vendas'}
        </Button>
      </Box>,
      document.body
    ) : null}

    {/* Dialog de Visualização e Impressão */}
    {(dadosUltimaVenda || vendaSelecionadaImpressao) && (
      <Dialog 
        open={mostrarImpressao} 
        onClose={() => {
          setMostrarImpressao(false)
          setVendaSelecionadaImpressao(null)
        }}
        maxWidth="md"
        fullWidth
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            {vendaSelecionadaImpressao ? 'Nota de Venda da Listagem' : 'Visualizar Nota de Venda'}
          </span>
          <div>
            <Button 
              size="small" 
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              style={{ marginRight: 8 }}
            >
              Imprimir
            </Button>
            <Button 
              size="small" 
              startIcon={<PictureAsPdfIcon />}
              onClick={async () => {
                setCarregandoPDF(true)
                try {
                  const dadosParaUsar = vendaSelecionadaImpressao || dadosUltimaVenda
                  const resultado = await baixarPDF(dadosParaUsar)
                  if (!resultado.success) {
                    alert('Erro ao gerar PDF: ' + resultado.error)
                  }
                } finally {
                  setCarregandoPDF(false)
                }
              }}
              disabled={carregandoPDF}
              style={{ marginRight: 8 }}
            >
              {carregandoPDF ? 'Gerando...' : 'PDF'}
            </Button>
            <Button 
              size="small" 
              startIcon={<WhatsAppIcon />}
              onClick={async () => {
                setCarregandoWhatsApp(true)
                try {
                  const dadosParaUsar = vendaSelecionadaImpressao || dadosUltimaVenda
                  const numero = dadosParaUsar.cliente?.telefone || ''
                  const resultado = await compartilharWhatsApp(dadosParaUsar, numero)
                  if (!resultado.success) {
                    alert('Erro ao compartilhar: ' + resultado.error)
                  }
                } finally {
                  setCarregandoWhatsApp(false)
                }
              }}
              disabled={carregandoWhatsApp}
              style={{ marginRight: 8 }}
            >
              {carregandoWhatsApp ? 'Enviando...' : 'WhatsApp'}
            </Button>
            <IconButton onClick={() => {
              setMostrarImpressao(false)
              setVendaSelecionadaImpressao(null)
            }}>
              <CloseIcon />
            </IconButton>
          </div>
        </div>
        <div style={{ padding: 0 }}>
          <VendaImpressao ref={componentRef} dadosVenda={vendaSelecionadaImpressao || dadosUltimaVenda} />
        </div>
      </Dialog>
    )}

    </>
  )
}
