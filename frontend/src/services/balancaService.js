/**
 * Serviço para identificação e processamento de códigos de barras de balança
 * Suporta balanças integradas e etiquetas de balança
 */

import api from './api';

/**
 * Formatos comuns de código de barras de balança no Brasil:
 * 
 * Formato 1 (Padrão Toledo/Filizola): 2PPPPPPQQQQQ
 *   - 2: Prefixo fixo que indica produto de balança
 *   - PPPPPP: Código PLU do produto (6 dígitos)
 *   - QQQQQ: Peso ou preço (5 dígitos com 3 casas decimais)
 * 
 * Formato 2 (EAN-13 pesável): 2PPPPPVVVVVC
 *   - 2: Prefixo de produto pesável
 *   - PPPPP: Código do produto (5 dígitos)
 *   - VVVVV: Valor/Peso (5 dígitos)
 *   - C: Dígito verificador
 * 
 * Formato 3 (Etiqueta com preço): 2PPPPPPVVVVV
 *   - 2: Prefixo
 *   - PPPPPP: PLU (6 dígitos)
 *   - VVVVV: Preço em centavos (5 dígitos)
 */

class BalancaService {
  constructor() {
    this.configuracoes = null;
    this.ultimaVerificacao = null;
  }

  /**
   * Carrega configurações de balança do backend
   */
  async carregarConfiguracoes() {
    try {
      const agora = Date.now();
      // Cache de 5 minutos
      if (this.configuracoes && this.ultimaVerificacao && (agora - this.ultimaVerificacao) < 300000) {
        return this.configuracoes;
      }

      const response = await api.get('/api/balancas/configuracoes/');
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      
      // Encontrar configuração ativa
      this.configuracoes = data.find(c => c.ativo) || null;
      this.ultimaVerificacao = agora;
      
      return this.configuracoes;
    } catch (error) {
      console.error('Erro ao carregar configurações de balança:', error);
      return null;
    }
  }

  /**
   * Verifica se um código de barras é de produto de balança
   * @param {string} codigo - Código de barras
   * @returns {boolean}
   */
  isCodigoBalanca(codigo) {
    if (!codigo || typeof codigo !== 'string') return false;
    
    // Remove espaços e converte para string
    codigo = codigo.trim();
    
    // Verifica se começa com 2 (padrão brasileiro para produtos pesáveis)
    if (codigo.startsWith('2') && (codigo.length === 13 || codigo.length === 12)) {
      return true;
    }
    
    return false;
  }

  /**
   * Extrai informações de um código de barras de balança
   * @param {string} codigo - Código de barras completo
   * @returns {Object} - { plu, peso, preco, tipo }
   */
  extrairDadosCodigoBalanca(codigo) {
    if (!this.isCodigoBalanca(codigo)) {
      return null;
    }

    // Remove espaços
    codigo = codigo.trim();
    
    // Formato padrão: 2PPPPPPQQQQQ (13 dígitos)
    if (codigo.length === 13) {
      const plu = codigo.substring(1, 7); // 6 dígitos
      const valor = codigo.substring(7, 12); // 5 dígitos
      
      // Verifica se é peso ou preço baseado no PLU
      // Geralmente PLUs com último dígito 0 são peso, outros são preço
      const ultimoDigitoPLU = parseInt(plu.charAt(5));
      const isPeso = ultimoDigitoPLU === 0;
      
      if (isPeso) {
        // Peso em kg com 3 casas decimais (ex: 01234 = 1.234 kg)
        const peso = parseFloat(valor) / 1000;
        return {
          plu: plu,
          peso: peso,
          preco: null,
          tipo: 'peso',
          codigoOriginal: codigo
        };
      } else {
        // Preço em reais com 2 casas decimais (ex: 01234 = R$ 12.34)
        const preco = parseFloat(valor) / 100;
        return {
          plu: plu,
          peso: null,
          preco: preco,
          tipo: 'preco',
          codigoOriginal: codigo
        };
      }
    }
    
    // Formato alternativo: 2PPPPPVVVVV (12 dígitos)
    if (codigo.length === 12) {
      const plu = codigo.substring(1, 6); // 5 dígitos
      const valor = codigo.substring(6, 11); // 5 dígitos
      
      const peso = parseFloat(valor) / 1000;
      return {
        plu: plu.padStart(6, '0'), // Normalizar para 6 dígitos
        peso: peso,
        preco: null,
        tipo: 'peso',
        codigoOriginal: codigo
      };
    }
    
    return null;
  }

  /**
   * Busca produto por PLU da balança
   * @param {string} plu - Código PLU
   * @returns {Promise<Object>} - Produto encontrado
   */
  async buscarProdutoPorPLU(plu) {
    try {
      // Buscar na tabela produto_balanca
      const response = await api.get(`/api/balancas/produtos/?codigo_plu=${plu}`);
      const produtos = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      
      if (produtos.length > 0) {
        const produtoBalanca = produtos[0];
        
        // Buscar dados completos do produto
        const responseProduto = await api.get(`/api/produtos/${produtoBalanca.id_produto}/`);
        return responseProduto.data;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar produto por PLU:', error);
      return null;
    }
  }

  /**
   * Lê peso de uma balança integrada
   * @param {number} configId - ID da configuração da balança
   * @returns {Promise<Object>} - { sucesso, peso, unidade, mensagem }
   */
  async lerPesoBalancaIntegrada(configId) {
    try {
      const response = await api.post('/api/balancas/leitura/ler_peso/', {
        configuracao_id: configId
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao ler peso da balança:', error);
      return {
        sucesso: false,
        peso: 0,
        unidade: 'kg',
        mensagem: error.response?.data?.mensagem || 'Erro ao conectar com a balança'
      };
    }
  }

  /**
   * Processa código de barras e retorna informações do produto
   * @param {string} codigo - Código de barras lido
   * @returns {Promise<Object>} - { produto, quantidade, usouBalanca, mensagem }
   */
  async processarCodigoBarras(codigo) {
    // Verificar se é código de balança
    const dadosBalanca = this.extrairDadosCodigoBalanca(codigo);
    
    if (!dadosBalanca) {
      // Não é código de balança, retornar null para busca normal
      return null;
    }

    console.log('🏷️ Código de balança detectado:', dadosBalanca);

    // Buscar produto pelo PLU
    const produto = await this.buscarProdutoPorPLU(dadosBalanca.plu);
    
    if (!produto) {
      return {
        sucesso: false,
        mensagem: `Produto com PLU ${dadosBalanca.plu} não encontrado na balança`
      };
    }

    // Carregar configuração da balança
    const config = await this.carregarConfiguracoes();

    let quantidade = 1;
    let metodo = 'etiqueta';

    // Se é tipo peso e tem balança integrada, tentar ler peso direto
    if (dadosBalanca.tipo === 'peso' && config && config.tipo_balanca === 'integrada') {
      console.log('⚖️ Tentando ler peso da balança integrada...');
      const leituraPeso = await this.lerPesoBalancaIntegrada(config.id);
      
      if (leituraPeso.sucesso && leituraPeso.peso > 0) {
        quantidade = leituraPeso.peso;
        metodo = 'balanca_integrada';
        console.log('✅ Peso lido da balança:', quantidade, leituraPeso.unidade);
      } else {
        // Se não conseguiu ler da balança, usar peso da etiqueta
        quantidade = dadosBalanca.peso;
        metodo = 'etiqueta_peso';
        console.log('⚠️ Usando peso da etiqueta:', quantidade);
      }
    } else if (dadosBalanca.tipo === 'peso') {
      // Usar peso da etiqueta
      quantidade = dadosBalanca.peso;
      metodo = 'etiqueta_peso';
    } else if (dadosBalanca.tipo === 'preco') {
      // Calcular quantidade baseado no preço
      if (produto.preco_venda && produto.preco_venda > 0) {
        quantidade = dadosBalanca.preco / produto.preco_venda;
      }
      metodo = 'etiqueta_preco';
    }

    return {
      sucesso: true,
      produto: produto,
      quantidade: quantidade,
      metodo: metodo,
      dadosBalanca: dadosBalanca,
      mensagem: `Produto de balança - ${metodo === 'balanca_integrada' ? 'Peso lido da balança' : 'Dados da etiqueta'}`
    };
  }
}

// Singleton
const balancaService = new BalancaService();

export default balancaService;
