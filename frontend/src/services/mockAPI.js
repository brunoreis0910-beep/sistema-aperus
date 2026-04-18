// Mock de dados para teste do sistema de vendas
const mockData = {
  operacoes: [
    { id: 1, nome: 'Venda à Vista' },
    { id: 2, nome: 'Venda a Prazo' },
    { id: 3, nome: 'Venda Consignada' }
  ],

  clientes: [
    { id: 1, nome: 'Joéo Silva', email: 'joao@email.com', telefone: '(11) 99999-1111' },
    { id: 2, nome: 'Maria Santos', email: 'maria@email.com', telefone: '(11) 99999-2222' },
    { id: 3, nome: 'Pedro Oliveira', email: 'pedro@email.com', telefone: '(11) 99999-3333' },
    { id: 4, nome: 'Ana Costa', email: 'ana@email.com', telefone: '(11) 99999-4444' }
  ],

  vendedores: [
    { id: 1, nome: 'Carlos Vendedor', email: 'carlos@empresa.com' },
    { id: 2, nome: 'Lucia Vendedora', email: 'lucia@empresa.com' },
    { id: 3, nome: 'Roberto Vendas', email: 'roberto@empresa.com' }
  ],

  produtos: [
    {
      id: 1,
      codigo: 'PROD001',
      nome: 'Notebook Dell Inspiron 15',
      preco_venda: 2500.00,
      estoque: 10,
      categoria: 'Informática'
    },
    {
      id: 2,
      codigo: 'PROD002',
      nome: 'Mouse Logitech MX Master',
      preco_venda: 350.00,
      estoque: 25,
      categoria: 'Periféricos'
    },
    {
      id: 3,
      codigo: 'PROD003',
      nome: 'Teclado Mecânico RGB',
      preco_venda: 450.00,
      estoque: 15,
      categoria: 'Periféricos'
    },
    {
      id: 4,
      codigo: 'PROD004',
      nome: 'Monitor LG 24 Polegadas',
      preco_venda: 800.00,
      estoque: 8,
      categoria: 'Monitores'
    },
    {
      id: 5,
      codigo: 'PROD005',
      nome: 'Impressora HP LaserJet',
      preco_venda: 1200.00,
      estoque: 5,
      categoria: 'Impressoras'
    }
  ],

  vendas: [
    {
      id: 1,
      numero_documento: 'VND-001',
      data_venda: '2025-10-28',
      id_operacao: 1,
      nome_operacao: 'Venda à Vista',
      id_cliente: 1,
      nome_cliente: 'Joéo Silva',
      id_vendedor: 1,
      nome_vendedor: 'Carlos Vendedor',
      observacoes: 'Primeira venda de teste',
      desconto: 0.00,
      valor_total: 2850.00,
      status: 'FINALIZADA',
      itens: [
        {
          id: 1,
          id_produto: 1,
          codigo_produto: 'PROD001',
          nome_produto: 'Notebook Dell Inspiron 15',
          quantidade: 1,
          valor_unitario: 2500.00,
          desconto: 0.00,
          subtotal: 2500.00
        },
        {
          id: 2,
          id_produto: 2,
          codigo_produto: 'PROD002',
          nome_produto: 'Mouse Logitech MX Master',
          quantidade: 1,
          valor_unitario: 350.00,
          desconto: 0.00,
          subtotal: 350.00
        }
      ]
    },
    {
      id: 2,
      numero_documento: 'VND-002',
      data_venda: '2025-10-29',
      id_operacao: 2,
      nome_operacao: 'Venda a Prazo',
      id_cliente: 2,
      nome_cliente: 'Maria Santos',
      id_vendedor: 2,
      nome_vendedor: 'Lucia Vendedora',
      observacoes: 'Venda parcelada em 3x',
      desconto: 50.00,
      valor_total: 1150.00,
      status: 'ABERTA',
      itens: [
        {
          id: 3,
          id_produto: 4,
          codigo_produto: 'PROD004',
          nome_produto: 'Monitor LG 24 Polegadas',
          quantidade: 1,
          valor_unitario: 800.00,
          desconto: 0.00,
          subtotal: 800.00
        },
        {
          id: 4,
          id_produto: 3,
          codigo_produto: 'PROD003',
          nome_produto: 'Teclado Mecânico RGB',
          quantidade: 1,
          valor_unitario: 450.00,
          desconto: 50.00,
          subtotal: 400.00
        }
      ]
    }
  ]
};

// Simular delay de rede
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock das APIs
const mockAPI = {
  // Listar operações
  async getOperacoes() {
    await delay();
    return { data: mockData.operacoes };
  },

  // Listar clientes
  async getClientes() {
    await delay();
    return { data: mockData.clientes };
  },

  // Listar vendedores
  async getVendedores() {
    await delay();
    return { data: mockData.vendedores };
  },

  // Listar produtos
  async getProdutos() {
    await delay();
    return { data: mockData.produtos };
  },

  // Listar vendas
  async getVendas() {
    await delay();
    return { data: mockData.vendas };
  },

  // Criar nova venda
  async createVenda(venda) {
    await delay(800);

    const novaVenda = {
      ...venda,
      id: mockData.vendas.length + 1,
      numero_documento: `VND-${String(mockData.vendas.length + 1).padStart(3, '0')}`,
      status: 'ABERTA',
      // Adicionar nomes baseados nos IDs
      nome_operacao: mockData.operacoes.find(op => op.id === parseInt(venda.id_operacao))?.nome || '',
      nome_cliente: mockData.clientes.find(cli => cli.id === parseInt(venda.id_cliente))?.nome || '',
      nome_vendedor: mockData.vendedores.find(vend => vend.id === parseInt(venda.id_vendedor))?.nome || ''
    };

    // Adicionar à lista mock
    mockData.vendas.push(novaVenda);

    return { data: novaVenda };
  },

  // Atualizar venda
  async updateVenda(id, venda) {
    await delay(600);

    const index = mockData.vendas.findIndex(v => v.id === parseInt(id));
    if (index !== -1) {
      mockData.vendas[index] = { ...mockData.vendas[index], ...venda };
      return { data: mockData.vendas[index] };
    }

    throw new Error('Venda não encontrada');
  },

  // Deletar venda
  async deleteVenda(id) {
    await delay(400);

    const index = mockData.vendas.findIndex(v => v.id === parseInt(id));
    if (index !== -1) {
      mockData.vendas.splice(index, 1);
      return { data: { message: 'Venda deletada com sucesso' } };
    }

    throw new Error('Venda não encontrada');
  }
};

export default mockAPI;