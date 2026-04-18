import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
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
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  List as ListIcon,
  Clear as ClearIcon,
  PictureAsPdf as PdfIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import axios from 'axios';
import mockAPI from '../services/mockAPI';
import useImpressaoVenda from '../hooks/useImpressaoVenda';

// Configurar base URL do axios para apontar para o backend Django
axios.defaults.baseURL = 'http://localhost:8000';

// Configurar interceptor do axios para incluir token
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    console.log('🔍 Token encontrado no sessionStorage:', token ? 'SIM' : 'NÃO');
    console.log('🔍 Token valor:', token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Header Authorization adicionado:', config.headers.Authorization);
    } else {
      console.log('❌ Nenhum token encontrado - requisiçéo sem autenticação');
    }
    
    console.log('📡 Fazendo requisiçéo para:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor de requisiçéo:', error);
    return Promise.reject(error);
  }
);

const Vendas = () => {
  // Hook de impressão
  const { 
    loading: loadingImpressao, 
    gerarPDF, 
    imprimirDireto, 
    compartilharWhatsApp 
  } = useImpressaoVenda();

  // Estados principais
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modo atual: 'lista' ou 'nova'
  const [modo, setModo] = useState('lista');
  
  // Dados para formulário
  const [venda, setVenda] = useState({
    numero_documento: '',
    data_venda: new Date().toISOString().split('T')[0],
    id_operacao: '',
    id_cliente: '',
    id_vendedor: '',
    observacoes: '',
    desconto: 0,
    valor_total: 0,
    itens: []
  });
  
  // Dados das listas
  const [operacoes, setOperacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);
  
  // Item sendo adicionado
  const [novoItem, setNovoItem] = useState({
    id_produto: '',
    quantidade: 1,
    valor_unitario: 0,
    desconto: 0
  });

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
    gerarNumeroDocumento();
  }, []);

  // Gerar número de documento automático
  const gerarNumeroDocumento = async () => {
    try {
      const response = await axios.get('/api/vendas/proximo-numero/');
      setVenda(prev => ({
        ...prev,
        numero_documento: response.data.proximo_numero
      }));
    } catch (err) {
      // Se não conseguir gerar via API, usar número baseado em timestamp + vendas existentes
      const numeroSequencial = vendas.length + 1;
      const numero = `VND-${String(numeroSequencial).padStart(3, '0')}`;
      setVenda(prev => ({
        ...prev,
        numero_documento: numero
      }));
      console.log('Usando numeração automática local:', numero);
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🚀 Iniciando carregamento de dados...');
      console.log('🔍 Verificando localStorage...');
      
      // Verificar todos os itens do localStorage
      const storageItems = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        storageItems[key] = localStorage.getItem(key);
      }
      console.log('📦 Todos os itens do localStorage:', storageItems);
      
      // Verificar especificamente alguns tokens comuns
      const possibleTokenKeys = ['token', 'authToken', 'access_token', 'jwt', 'user_token', 'access', 'refresh'];
      possibleTokenKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`🔑 ${key}:`, value ? `PRESENTE (${value.substring(0, 20)}...)` : 'AUSENTE');
      });
      
      // Verificar se existe usuário logado
      const user = localStorage.getItem('user');
      console.log('👤 Usuário logado:', user ? JSON.parse(user) : 'NENHUM');
      
      // Se não há token, tentar fazer login automático ou mostrar aviso
      const hasValidToken = possibleTokenKeys.some(key => localStorage.getItem(key));
      if (!hasValidToken) {
        console.log('⚠️ NENHUM TOKEN ENCONTRADO - Usuario precisa fazer login!');
        setError('🔐 Você precisa fazer LOGIN primeiro para acessar seus dados! Redirecionando...');
        
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
        
        // Usar dados mock enquanto isso
        console.log('🔄 Usando dados mock enquanto não há login...');
        [opRes, cliRes, vendRes, prodRes, vendasRes] = await Promise.all([
          mockAPI.getOperacoes(),
          mockAPI.getClientes(),
          mockAPI.getVendedores(),
          mockAPI.getProdutos(),
          mockAPI.getVendas()
        ]);
        usarMock = true;
      } else {
      
      let usarMock = false;
      let opRes, cliRes, vendRes, prodRes, vendasRes;
      
      try {
        console.log('📡 Tentando conectar às APIs reais...');
        
        // Tentar APIs reais uma por vez para ver qual falha
        console.log('📡 Carregando operações...');
        opRes = await axios.get('/api/operacoes/');
        console.log('✅ Operações carregadas:', opRes.data?.length || 0, 'itens');
        
        console.log('📡 Carregando clientes...');
        cliRes = await axios.get('/api/clientes/');
        console.log('✅ Clientes carregados:', cliRes.data?.length || 0, 'itens');
        
        console.log('📡 Carregando vendedores...');
        vendRes = await axios.get('/api/vendedores/');
        console.log('✅ Vendedores carregados:', vendRes.data?.length || 0, 'itens');
        
        console.log('📡 Carregando produtos...');
        prodRes = await axios.get('/api/produtos/');
        console.log('✅ Produtos carregados:', prodRes.data?.length || 0, 'itens');
        
        console.log('📡 Carregando vendas...');
        vendasRes = await axios.get('/api/vendas/');
        console.log('✅ Vendas carregadas:', vendasRes.data?.length || 0, 'itens');
        
        console.log('🎉 Todas as APIs reais funcionaram!');
        
      } catch (apiError) {
        console.error('❌ Erro nas APIs reais:', apiError);
        console.error('📊 Status do erro:', apiError.response?.status);
        console.error('📄 Dados do erro:', apiError.response?.data);
        console.error('🔗 URL que falhou:', apiError.config?.url);
        
        if (apiError.response?.status === 401) {
          setError('🔐 Erro de autenticação: Token inválido ou expirado. Usando dados de teste.');
          console.log('❌ Problema de autenticação detectado');
        } else {
          setError(`❌ Erro nas APIs (${apiError.response?.status}): ${apiError.response?.data?.detail || apiError.message}`);
        }
        
        console.log('🔄 Carregando dados mock como fallback...');
        
        // Usar dados mock como fallback
        [opRes, cliRes, vendRes, prodRes, vendasRes] = await Promise.all([
          mockAPI.getOperacoes(),
          mockAPI.getClientes(),
          mockAPI.getVendedores(),
          mockAPI.getProdutos(),
          mockAPI.getVendas()
        ]);
        
        usarMock = true;
      }
      
      console.log('📊 Dados finais carregados:');
      console.log('  - Operações:', opRes.data);
      console.log('  - Clientes:', cliRes.data);
      console.log('  - Vendedores:', vendRes.data);
      console.log('  - Produtos:', prodRes.data);
      console.log('  - Vendas:', vendasRes.data);
      
      setOperacoes(opRes.data);
      setClientes(cliRes.data);
      setVendedores(vendRes.data);
      setProdutos(prodRes.data);
      setVendas(vendasRes.data);
      
      if (usarMock) {
        setSuccess('🧪 Usando dados de teste. Para dados reais: 1) Faça login, 2) Clique em Recarregar');
      } else {
        setSuccess('✅ Dados reais carregados com sucesso!');
      }
      
    } catch (err) {
      console.error('💥 Erro geral:', err);
      setError(`Erro geral: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calcular totais
  const calcularTotais = () => {
    const total = venda.itens.reduce((acc, item) => {
      const subtotal = (item.quantidade * item.valor_unitario) - item.desconto;
      return acc + subtotal;
    }, 0);
    
    setVenda(prev => ({
      ...prev,
      valor_total: total - prev.desconto
    }));
  };

  // Adicionar item
  const adicionarItem = () => {
    if (!novoItem.id_produto) {
      setError('Selecione um produto');
      return;
    }
    
    const produto = produtos.find(p => p.id === parseInt(novoItem.id_produto));
    if (!produto) {
      setError('Produto não encontrado');
      return;
    }
    
    // Validar estoque se disponível
    if (produto.estoque !== undefined && produto.estoque < parseFloat(novoItem.quantidade)) {
      setError(`Estoque insuficiente. Disponível: ${produto.estoque}`);
      return;
    }
    
    const item = {
      id: Date.now(), // ID temporário
      id_produto: novoItem.id_produto,
      codigo_produto: produto.codigo,
      nome_produto: produto.nome,
      quantidade: parseFloat(novoItem.quantidade),
      valor_unitario: parseFloat(novoItem.valor_unitario || produto.preco_venda),
      desconto: parseFloat(novoItem.desconto),
      subtotal: (parseFloat(novoItem.quantidade) * parseFloat(novoItem.valor_unitario || produto.preco_venda)) - parseFloat(novoItem.desconto)
    };
    
    setVenda(prev => ({
      ...prev,
      itens: [...prev.itens, item]
    }));
    
    // Limpar formulário do item
    setNovoItem({
      id_produto: '',
      quantidade: 1,
      valor_unitario: 0,
      desconto: 0
    });
    
    setError('');
  };

  // Remover item
  const removerItem = (index) => {
    setVenda(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };

  // Recalcular quando itens mudarem
  useEffect(() => {
    calcularTotais();
  }, [venda.itens, venda.desconto]);

  // Salvar venda
  const salvarVenda = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validações básicas
      if (!venda.id_operacao || !venda.id_cliente || !venda.id_vendedor) {
        setError('Preencha todos os campos obrigatórios');
        return;
      }
      
      if (venda.itens.length === 0) {
        setError('Adicione pelo menos um item à venda');
        return;
      }
      
      console.log('Salvando venda:', venda);
      
      let response;
      let usouMock = false;
      
      try {
        // Tentar API real primeiro
        response = await axios.post('/api/vendas/', venda);
        console.log('Venda salva na API real:', response.data);
        
      } catch (apiError) {
        console.log('API real falhou, usando mock:', apiError.message);
        
        if (apiError.response?.status === 401) {
          setError('⚠️ não foi possível salvar na API real (autenticação). Salvando em dados de teste.');
        }
        
        // Usar mock como fallback
        response = await mockAPI.createVenda(venda);
        usouMock = true;
      }
      
      setSuccess(usouMock ? 
        '✅ Venda salva nos dados de teste!' : 
        '✅ Venda salva com sucesso na API!'
      );
      
      setModo('lista');
      limparFormulario();
      carregarDados(); // Recarregar lista
      
    } catch (err) {
      console.error('Erro ao salvar venda:', err);
      setError(`Erro ao salvar venda: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Limpar formulário
  const limparFormulario = () => {
    setVenda({
      numero_documento: '',
      data_venda: new Date().toISOString().split('T')[0],
      id_operacao: '',
      id_cliente: '',
      id_vendedor: '',
      observacoes: '',
      desconto: 0,
      valor_total: 0,
      itens: []
    });
    setNovoItem({
      id_produto: '',
      quantidade: 1,
      valor_unitario: 0,
      desconto: 0
    });
    setError('');
    setSuccess('');
    
    // Gerar novo número de documento
    gerarNumeroDocumento();
  };

  // Imprimir venda
  const imprimirVenda = async (venda) => {
    const resultado = await imprimirDireto(venda);
    if (resultado.success) {
      setSuccess(resultado.message);
    } else {
      setError(resultado.message);
    }
  };

  // Gerar PDF
  const gerarPDFVenda = async (venda) => {
    const resultado = await gerarPDF(venda);
    if (resultado.success) {
      setSuccess(resultado.message);
    } else {
      setError(resultado.message);
    }
  };

  // Compartilhar WhatsApp
  const compartilharVenda = async (venda) => {
    const resultado = await compartilharWhatsApp(venda);
    if (resultado.success) {
      setSuccess(resultado.message);
    } else {
      setError(resultado.message);
    }
  };

  if (loading && modo === 'lista') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Sistema de Vendas
          </Typography>
          <Box>
            <Button
              variant={modo === 'lista' ? 'contained' : 'outlined'}
              startIcon={<ListIcon />}
              onClick={() => setModo('lista')}
              sx={{ mr: 1 }}
            >
              Listar
            </Button>
            <Button
              variant={modo === 'nova' ? 'contained' : 'outlined'}
              startIcon={<AddIcon />}
              onClick={() => { setModo('nova'); limparFormulario(); }}
              sx={{ mr: 1 }}
            >
              Nova Venda
            </Button>
            <Button
              variant="outlined"
              onClick={carregarDados}
              disabled={loading}
              color="primary"
              sx={{ mr: 1 }}
            >
              {loading ? '⏳ Carregando...' : '🔄 Recarregar Dados'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                console.log('🔍 DEBUG - Estado atual:');
                console.log('Operações:', operacoes);
                console.log('Clientes:', clientes);
                console.log('Vendedores:', vendedores);
                console.log('Produtos:', produtos);
                console.log('Vendas:', vendas);
                console.log('LocalStorage completo:', {...localStorage});
              }}
              size="small"
              color="secondary"
            >
              🐛 Debug
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Mensagens */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

                {/* Debug - informações de carregamento */}
          {loading && (
            <Alert severity="info" sx={{ mb: 2 }}>
              ⏳ Carregando dados... Verifique o console (F12) para detalhes de autenticação.
            </Alert>
          )}
          
          {/* Informações de debug quando não há dados */}
          {!loading && (
            <Alert 
              severity={operacoes.length > 0 && clientes.length > 0 ? "success" : "warning"} 
              sx={{ mb: 2 }}
            >
              <strong>Status:</strong> {operacoes.length} operações, {clientes.length} clientes, 
              {vendedores.length} vendedores, {produtos.length} produtos, {vendas.length} vendas
              {operacoes.length === 0 && (
                <div style={{marginTop: '8px'}}>
                  <strong>⚠️ Sem dados reais detectados.</strong> Possíveis causas:
                  <br />• não está logado no sistema
                  <br />• Token expirado 
                  <br />• Backend não está rodando
                  <br />• APIs não configuradas corretamente
                </div>
              )}
            </Alert>
          )}

          {/* Conteúdo principal */}
      {modo === 'lista' ? (
        // MODO LISTA
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Lista de Vendas ({vendas.length})
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Documento</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Vendedor</TableCell>
                  <TableCell align="right">Valor Total</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary">
                        Nenhuma venda encontrada
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  vendas.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.numero_documento}</TableCell>
                      <TableCell>{new Date(v.data_venda).toLocaleDateString()}</TableCell>
                      <TableCell>{v.nome_cliente}</TableCell>
                      <TableCell>{v.nome_vendedor}</TableCell>
                      <TableCell align="right">
                        R$ {v.valor_total.toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => imprimirVenda(v)}
                          title="Imprimir"
                          disabled={loadingImpressao}
                        >
                          <PrintIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => gerarPDFVenda(v)}
                          title="Gerar PDF"
                          disabled={loadingImpressao}
                        >
                          <PdfIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => compartilharVenda(v)}
                          title="WhatsApp"
                          disabled={loadingImpressao}
                        >
                          <WhatsAppIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        // MODO NOVA VENDA
        <Grid container spacing={3}>
          {/* Dados da venda */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Dados da Venda
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Número do Documento"
                      value={venda.numero_documento}
                      onChange={(e) => setVenda(prev => ({ ...prev, numero_documento: e.target.value }))}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Data da Venda"
                      value={venda.data_venda}
                      onChange={(e) => setVenda(prev => ({ ...prev, data_venda: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Operação *</InputLabel>
                      <Select
                        value={venda.id_operacao}
                        onChange={(e) => setVenda(prev => ({ ...prev, id_operacao: e.target.value }))}
                      >
                        {operacoes.map(op => (
                          <MenuItem key={op.id} value={op.id}>
                            {op.nome}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Cliente *</InputLabel>
                      <Select
                        value={venda.id_cliente}
                        onChange={(e) => setVenda(prev => ({ ...prev, id_cliente: e.target.value }))}
                      >
                        {clientes.map(cli => (
                          <MenuItem key={cli.id} value={cli.id}>
                            {cli.nome}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Vendedor *</InputLabel>
                      <Select
                        value={venda.id_vendedor}
                        onChange={(e) => setVenda(prev => ({ ...prev, id_vendedor: e.target.value }))}
                      >
                        {vendedores.map(vend => (
                          <MenuItem key={vend.id} value={vend.id}>
                            {vend.nome}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Observações"
                      multiline
                      rows={2}
                      value={venda.observacoes}
                      onChange={(e) => setVenda(prev => ({ ...prev, observacoes: e.target.value }))}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Adicionar item */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Adicionar Item
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Produto</InputLabel>
                      <Select
                        value={novoItem.id_produto}
                        onChange={(e) => {
                          const produto = produtos.find(p => p.id === parseInt(e.target.value));
                          setNovoItem(prev => ({
                            ...prev,
                            id_produto: e.target.value,
                            valor_unitario: produto ? produto.preco_venda : 0
                          }));
                        }}
                      >
                        {produtos.map(prod => (
                          <MenuItem key={prod.id} value={prod.id}>
                            {prod.codigo} - {prod.nome} 
                            {prod.estoque !== undefined && (
                              <span style={{ color: prod.estoque > 0 ? 'green' : 'red', marginLeft: '8px' }}>
                                (Estoque: {prod.estoque})
                              </span>
                            )}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantidade"
                      value={novoItem.quantidade}
                      onChange={(e) => setNovoItem(prev => ({ ...prev, quantidade: e.target.value }))}
                      inputProps={{ min: 0.01, step: 0.01 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Valor Unitário"
                      value={novoItem.valor_unitario}
                      onChange={(e) => setNovoItem(prev => ({ ...prev, valor_unitario: e.target.value }))}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Desconto"
                      value={novoItem.desconto}
                      onChange={(e) => setNovoItem(prev => ({ ...prev, desconto: e.target.value }))}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={adicionarItem}
                    >
                      Adicionar
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Itens da venda */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Itens da Venda ({venda.itens.length})
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Produto</TableCell>
                        <TableCell align="center">Qtd</TableCell>
                        <TableCell align="right">Valor Unit.</TableCell>
                        <TableCell align="right">Desconto</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                        <TableCell align="center">ação</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {venda.itens.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography color="textSecondary">
                              Nenhum item adicionado
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        venda.itens.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.codigo_produto} - {item.nome_produto}
                            </TableCell>
                            <TableCell align="center">{item.quantidade}</TableCell>
                            <TableCell align="right">R$ {item.valor_unitario.toFixed(2)}</TableCell>
                            <TableCell align="right">R$ {item.desconto.toFixed(2)}</TableCell>
                            <TableCell align="right">R$ {item.subtotal.toFixed(2)}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removerItem(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Totais e ações */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Desconto Geral"
                      value={venda.desconto}
                      onChange={(e) => setVenda(prev => ({ ...prev, desconto: parseFloat(e.target.value) || 0 }))}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Valor Total"
                      value={`R$ ${venda.valor_total.toFixed(2)}`}
                      InputProps={{ readOnly: true }}
                      variant="filled"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <Button
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={limparFormulario}
                      >
                        Limpar
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={salvarVenda}
                        disabled={loading}
                      >
                        {loading ? 'Salvando...' : 'Salvar Venda'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Vendas;