// Em: frontend/src/services/promocaoService.js

import api from './api';

/**
 * Serviço para gerenciar promoções e descontos
 */
const promocaoService = {
  /**
   * Obtém lista de promoções ativas
   */
  obterPromocoes: async () => {
    try {
      const response = await api.get('/api/promocoes/');
      return response.data.results || response.data;
    } catch (error) {
      console.error('Erro ao obter promoções:', error);
      return [];
    }
  },

  /**
   * Obtém apenas promoções ativas
   */
  obterPromocjesAtivas: async () => {
    try {
      console.log('📡 Chamando API: /promocoes/ativas/');
      const response = await api.get('/api/promocoes/ativas/');
      console.log('✅ Resposta da API /promocoes/ativas/:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter promoções ativas:', error);
      console.error('   Status:', error.response?.status);
      console.error('   Detalhes:', error.response?.data);
      console.error('   Mensagem:', error.message);
      return [];
    }
  },

  /**
   * Verifica se há produtos em promoção
   * @param {array} ids - Array de IDs de produtos
   * @returns {object} Produtos em promoção e sem promoção
   */
  verificarProdutosEmPromocao: async (ids) => {
    try {
      const idsString = ids.join(',');
      const response = await api.get(`/promocoes/verificar_produtos/?ids=${idsString}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar produtos em promoção:', error);
      return {
        produtos_em_promocao: [],
        produtos_sem_promocao: ids,
      };
    }
  },

  /**
   * Valida desconto para múltiplos itens de venda
   * @param {array} itens - Array com {id_produto, valor, quantidade}
   * @returns {object} Resultado com itens que têm desconto e sem desconto
   */
  validarDescontoVenda: async (itens) => {
    try {
      const response = await api.post('/api/promocoes/validar_desconto/', {
        itens: itens,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao validar desconto:', error);
      return {
        itens_com_desconto: [],
        itens_sem_desconto: itens,
        valor_total_original: 0,
        valor_total_desconto: 0,
        valor_total_final: 0,
        tem_promocao: false,
      };
    }
  },

  /**
   * Calcula desconto para um item específico
   * @param {number} idPromocao - ID da promoção
   * @param {number} idProduto - ID do produto
   * @param {number} valor - Valor do item
   * @param {number} quantidade - Quantidade do item
   * @returns {object} Resultado com valores de desconto
   */
  calcularDesconto: async (idPromocao, idProduto, valor, quantidade = 1) => {
    try {
      const response = await api.get(
        `/promocoes/${idPromocao}/calcular_desconto/?id_produto=${idProduto}&valor=${valor}&quantidade=${quantidade}`
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao calcular desconto:', error);
      return {
        aplicavel: false,
        error: error.response?.data?.error || 'Erro ao calcular desconto',
      };
    }
  },

  /**
   * Cria uma nova promoção
   * @param {object} dados - Dados da promoção
   */
  criarPromocao: async (dados) => {
    try {
      const response = await api.post('/api/promocoes/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar promoção:', error);
      throw error;
    }
  },

  /**
   * Atualiza uma promoção
   * @param {number} id - ID da promoção
   * @param {object} dados - Dados atualizados
   */
  atualizarPromocao: async (id, dados) => {
    try {
      const response = await api.put(`/promocoes/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar promoção:', error);
      throw error;
    }
  },

  /**
   * Deleta uma promoção
   * @param {number} id - ID da promoção
   */
  deletarPromocao: async (id) => {
    try {
      await api.delete(`/promocoes/${id}/`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar promoção:', error);
      throw error;
    }
  },

  /**
   * Adiciona produtos a uma promoção
   * @param {number} idPromocao - ID da promoção
   * @param {array} produtos - Array de produtos com id e outras informações
   */
  adicionarProdutosPromocao: async (idPromocao, produtos) => {
    try {
      const response = await api.post(
        `/promocoes/${idPromocao}/adicionar_produtos/`,
        { produtos }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar produtos à promoção:', error);
      throw error;
    }
  },

  /**
   * Remove um produto de uma promoção
   * @param {number} idPromocao - ID da promoção
   * @param {number} idProduto - ID do produto
   */
  removerProdutoPromocao: async (idPromocao, idProduto) => {
    try {
      const response = await api.post(
        `/promocoes/${idPromocao}/remover_produto/`,
        { id_produto: idProduto }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao remover produto da promoção:', error);
      throw error;
    }
  },
};

export default promocaoService;
