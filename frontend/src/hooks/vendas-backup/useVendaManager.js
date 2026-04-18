import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export const useVendaManager = () => {
  const { axiosInstance } = useAuth()
  
  // Estados
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // função para lidar com erros
  const handleError = useCallback((error, defaultMessage = 'Erro inesperado') => {
    console.error('❌ Erro:', error)
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.detail || 
                        error.message || 
                        defaultMessage
    setError(errorMessage)
    setMessage({ type: 'error', text: errorMessage })
  }, [])

  // função para limpar mensagens
  const clearMessages = useCallback(() => {
    setError(null)
    setMessage(null)
  }, [])

  // função para carregar dados básicos
  const carregarDadosBasicos = useCallback(async () => {
    setLoading(true)
    clearMessages()
    
    try {
      const [operacoesRes, clientesRes, vendedoresRes, produtosRes, formasPagamentoRes] = await Promise.all([
        axiosInstance.get('/operacoes/'),
        axiosInstance.get('/clientes/'),
        axiosInstance.get('/vendedores/'),
        axiosInstance.get('/produtos/'),
        axiosInstance.get('/formas-pagamento/')
      ])

      const dados = {
        operacoes: operacoesRes.data.results || operacoesRes.data || [],
        clientes: clientesRes.data.results || clientesRes.data || [],
        vendedores: vendedoresRes.data.results || vendedoresRes.data || [],
        produtos: produtosRes.data.results || produtosRes.data || [],
        formasPagamento: formasPagamentoRes.data.results || formasPagamentoRes.data || []
      }

      console.log('✅ Dados carregados:', {
        operacoes: dados.operacoes.length,
        clientes: dados.clientes.length,
        vendedores: dados.vendedores.length,
        produtos: dados.produtos.length,
        formasPagamento: dados.formasPagamento.length
      })

      return dados
    } catch (error) {
      handleError(error, 'Erro ao carregar dados básicos')
      throw error
    } finally {
      setLoading(false)
    }
  }, [axiosInstance, handleError, clearMessages])

  // função para carregar vendas com filtros
  const carregarVendas = useCallback(async (filtros = {}) => {
    setLoading(true)
    clearMessages()
    
    try {
      const params = new URLSearchParams()
      
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value)
        }
      })

      const response = await axiosInstance.get(`/vendas/?${params.toString()}`)
      const vendas = response.data.results || response.data || []
      
      console.log('✅ Vendas carregadas:', vendas.length)
      return vendas
    } catch (error) {
      handleError(error, 'Erro ao carregar vendas')
      throw error
    } finally {
      setLoading(false)
    }
  }, [axiosInstance, handleError, clearMessages])

  // função para carregar venda específica
  const carregarVenda = useCallback(async (id) => {
    setLoading(true)
    clearMessages()
    
    try {
      const response = await axiosInstance.get(`/vendas/${id}/`)
      console.log('✅ Venda carregada:', response.data)
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao carregar venda')
      throw error
    } finally {
      setLoading(false)
    }
  }, [axiosInstance, handleError, clearMessages])

  // função para salvar venda (criar ou atualizar)
  const salvarVenda = useCallback(async (dadosVenda, isEdicao = false) => {
    setLoading(true)
    clearMessages()
    
    try {
      // Validações básicas
      if (!dadosVenda.id_operacao) {
        throw new Error('Operação é obrigatória')
      }
      if (!dadosVenda.id_cliente) {
        throw new Error('Cliente é obrigatório')
      }
      if (!dadosVenda.id_vendedor) {
        throw new Error('Vendedor é obrigatório')
      }
      if (!dadosVenda.itens || dadosVenda.itens.length === 0) {
        throw new Error('Pelo menos um item é obrigatório')
      }

      // Filtrar itens válidos
      const itensValidos = dadosVenda.itens.filter(item => 
        item.id_produto && 
        item.quantidade > 0 && 
        item.valor_unitario >= 0
      )

      if (itensValidos.length === 0) {
        throw new Error('Pelo menos um item válido é obrigatório')
      }

      const payload = {
        ...dadosVenda,
        itens: itensValidos
      }

      let response
      if (isEdicao && dadosVenda.id) {
        response = await axiosInstance.put(`/vendas/${dadosVenda.id}/`, payload)
        setMessage({ type: 'success', text: `Venda #${dadosVenda.id} atualizada com sucesso!` })
      } else {
        response = await axiosInstance.post('/vendas/', payload)
        setMessage({ type: 'success', text: 'Venda criada com sucesso!' })
      }

      console.log('✅ Venda salva:', response.data)
      return response.data
    } catch (error) {
      handleError(error, 'Erro ao salvar venda')
      throw error
    } finally {
      setLoading(false)
    }
  }, [axiosInstance, handleError, clearMessages])

  // função para excluir venda
  const excluirVenda = useCallback(async (id) => {
    setLoading(true)
    clearMessages()
    
    try {
      await axiosInstance.delete(`/vendas/${id}/`)
      setMessage({ type: 'success', text: 'Venda excluída com sucesso!' })
      console.log('✅ Venda excluída:', id)
      return true
    } catch (error) {
      handleError(error, 'Erro ao excluir venda')
      throw error
    } finally {
      setLoading(false)
    }
  }, [axiosInstance, handleError, clearMessages])

  // função para calcular totais da venda
  const calcularTotais = useCallback((itens, descontoGeral = 0) => {
    const subtotal = itens.reduce((acc, item) => {
      const quantidade = parseFloat(item.quantidade) || 0
      const valorUnitario = parseFloat(item.valor_unitario) || 0
      const descontoItem = parseFloat(item.desconto) || 0
      
      return acc + ((quantidade * valorUnitario) - descontoItem)
    }, 0)
    
    const valorTotal = subtotal - (parseFloat(descontoGeral) || 0)
    
    return {
      subtotal,
      descontoGeral: parseFloat(descontoGeral) || 0,
      valorTotal: Math.max(0, valorTotal) // não permitir valor negativo
    }
  }, [])

  // função para validar item
  const validarItem = useCallback((item) => {
    const erros = []
    
    if (!item.id_produto) {
      erros.push('Produto é obrigatório')
    }
    
    const quantidade = parseFloat(item.quantidade)
    if (isNaN(quantidade) || quantidade <= 0) {
      erros.push('Quantidade deve ser maior que zero')
    }
    
    const valorUnitario = parseFloat(item.valor_unitario)
    if (isNaN(valorUnitario) || valorUnitario < 0) {
      erros.push('Valor unitário deve ser maior ou igual a zero')
    }
    
    const desconto = parseFloat(item.desconto) || 0
    if (desconto < 0) {
      erros.push('Desconto não pode ser negativo')
    }
    
    const subtotal = (quantidade * valorUnitario) - desconto
    if (subtotal < 0) {
      erros.push('Subtotal não pode ser negativo')
    }
    
    return {
      valido: erros.length === 0,
      erros
    }
  }, [])

  return {
    // Estados
    loading,
    error,
    message,
    
    // Funções de dados
    carregarDadosBasicos,
    carregarVendas,
    carregarVenda,
    salvarVenda,
    excluirVenda,
    
    // Funções utilitárias
    calcularTotais,
    validarItem,
    clearMessages,
    setMessage
  }
}