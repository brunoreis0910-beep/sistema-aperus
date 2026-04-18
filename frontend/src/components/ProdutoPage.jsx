import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warehouse as WarehouseIcon,
  FilterList as FilterIcon,
  FlashOn as FlashOnIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import FilterDrawer from './common/FilterDrawer';

const ProdutoPage = () => {
  const [produtos, setProdutos] = useState([]);
  const [filteredProdutos, setFilteredProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDepotDialog, setOpenDepotDialog] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    dataInicio: '',
    dataFim: '',
    limit: 100,
    grupo: '',
    estoque_status: 'todos',
  });
  const [savedProductId, setSavedProductId] = useState(null);
  const [depotValues, setDepotValues] = useState([]);
  const [tabValue, setTabValue] = useState(0); // Controle de abas
  const [grupos, setGrupos] = useState([]); // Lista de grupos de produtos
  const [configProduto, setConfigProduto] = useState(null); // Configuração de código
  const [codigoGerado, setCodigoGerado] = useState(''); // Código gerado automaticamente
  const [gradeMode, setGradeMode] = useState(false);
  const [variacoes, setVariacoes] = useState([]); // Array de {tamanho: '', cor: ''}
  const [openCategoriaDialog, setOpenCategoriaDialog] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [openMarcaDialog, setOpenMarcaDialog] = useState(false);
  const [novaMarca, setNovaMarca] = useState('');
  const [categorias, setCategorias] = useState(['Eletrônicos', 'Roupas', 'Casa', 'Esportes', 'Livros', 'Outros']);
  const [marcas, setMarcas] = useState(['Dell', 'Samsung', 'Apple', 'Nike', 'Adidas', 'Phillips', 'LG', 'Sony', 'Outros']);
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    categoria: '',
    unidade_medida: 'UN',
    preco_custo: '',
    id_grupo: '',
    marca: '',
    classificacao: '',
    ncm: '',
    gtin: '',
    tributacao_info: '',
    imagem_url: '',
    metragem_caixa: '',
    rendimento_m2: '',
    peso_unitario: '',
    produto_pai: '',
    variacao: '',
    genero: ''
  });
  const { axiosInstance } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [buscandoTurbo, setBuscandoTurbo] = useState(false);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      setError('');

      // Construir parâmetros de filtro
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.dataInicio) params.append('data_inicio', filters.dataInicio);
      if (filters.dataFim) params.append('data_fim', filters.dataFim);
      if (filters.limit !== 'unlimited') params.append('limit', filters.limit);
      if (filters.grupo) params.append('grupo', filters.grupo);
      if (filters.estoque_status !== 'todos') params.append('estoque_status', filters.estoque_status);

      console.log(' Carregando produtos reais do banco de dados...');
      const response = await axiosInstance.get(`/produtos/?${params.toString()}`);
      console.log(' Resposta da API produtos:', response);
      console.log(' Dados recebidos:', response.data);

      const data = response.data;
      const produtosList = Array.isArray(data) ? data : data.results || [];

      console.log('✅ Produtos processados:', produtosList);
      console.log('✅ Total de produtos:', produtosList.length);

      if (produtosList.length > 0) {
        console.log('✅ Primeiro produto:', produtosList[0]);
      }

      // Garantir que todos os produtos tenham unidade_medida
      const produtosComUnidade = produtosList.map(p => ({
        ...p,
        unidade_medida: p.unidade_medida || 'UN'
      }));

      setProdutos(produtosComUnidade);
      setFilteredProdutos(produtosComUnidade);

      if (produtosList.length === 0) {
        setError('Nenhum produto encontrado no banco de dados. Cadastre alguns produtos primeiro.');
      }

    } catch (err) {
      console.error(' Erro ao carregar produtos:', err);
      console.error(' Detalhes do erro:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });

      if (err.response?.status === 401) {
        setError(' não autorizado. Faça login novamente para acessar seus produtos.');
      } else if (err.response?.status === 404) {
        setError(' Endpoint de produtos não encontrado. Verifique se o backend está rodando corretamente.');
      } else {
        setError(` Erro ao carregar produtos: ${err.message}. Verifique se o backend está funcionando e você está logado.`);
      }

      setProdutos([]);
      setFilteredProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrupos = async () => {
    try {
      const response = await axiosInstance.get('/grupos-produto/');
      const gruposList = Array.isArray(response.data) ? response.data : response.data.results || [];
      console.log('📁 Grupos carregados:', gruposList.length);
      setGrupos(gruposList);
    } catch (err) {
      console.error('❌ Erro ao carregar grupos:', err);
    }
  };

  const getEstoqueStatus = (produto) => {
    const estoque = produto.estoque_total || produto.estoque || 0;
    const minimo = 5;

    if (estoque <= 0) return { color: 'error', label: 'Sem estoque', icon: <WarningIcon /> };
    if (estoque <= minimo) return { color: 'warning', label: 'Estoque baixo', icon: <WarningIcon /> };
    return { color: 'success', label: 'Em estoque', icon: <CheckIcon /> };
  };

  const calculateStats = () => {
    const total = produtos.length;
    const baixoEstoque = produtos.filter(p => (p.estoque_total || p.estoque || 0) <= 5).length;
    const semEstoque = produtos.filter(p => (p.estoque_total || p.estoque || 0) <= 0).length;
    const valorTotal = Array.isArray(produtos) ? produtos.reduce((sum, p) => sum + ((p.valor_venda || p.preco_venda || 0) * (p.estoque_total || p.estoque || 0)), 0) : 0;

    return { total, baixoEstoque, semEstoque, valorTotal };
  };

  const stats = calculateStats();

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredProdutos(produtos);
    } else {
      const filtered = produtos.filter(produto =>
        produto.nome.toLowerCase().includes(term.toLowerCase()) ||
        produto.codigo.toLowerCase().includes(term.toLowerCase()) ||
        produto.categoria.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredProdutos(filtered);
    }
  };

  // Função Cadastro Turbo: Buscar dados do produto por GTIN
  const buscarDadosPorGtin = async () => {
    const gtinBusca = formData.gtin?.trim();
    
    if (!gtinBusca) {
      toast.warning('⚠️ Informe o GTIN/EAN para buscar automaticamente!');
      return;
    }
    
    setBuscandoTurbo(true);
    try {
      toast.info('🔍 Buscando dados do produto...', { autoClose: 2000 });
      
      const response = await api.get(`/api/produtos/cadastro-turbo/?ean=${gtinBusca}`);
      const dados = response.data;
      
      if (dados.ja_existe) {
        toast.info('⚠️ Produto já cadastrado!');
        return;
      }
      
      // Preencher campos automaticamente
      if (dados.nome) {
        setFormData(prev => ({
          ...prev,
          nome: dados.nome,
          descricao: dados.descricao || '',
          ncm: dados.ncm || prev.ncm,
          marca: dados.marca || prev.marca,
          classificacao: dados.categoria || prev.classificacao,
          imagem_url: dados.imagem_url || prev.imagem_url
        }));
        
        toast.success('✅ Dados preenchidos automaticamente!', { autoClose: 2000 });
      } else {
        toast.warning('⚠️ Produto não encontrado nas bases externas. Preencha manualmente.');
      }
      
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      toast.error('❌ Erro ao buscar dados. Preencha manualmente.');
    } finally {
      setBuscandoTurbo(false);
    }
  };

  const handleOpenDialog = async (produto = null) => {
    setEditingProduto(produto);
    setTabValue(0); // Resetar para primeira aba
    
    if (produto) {
      // Editando produto existente — buscar config para controlar visibilidade das abas
      try {
        const configResponse = await axiosInstance.get('/config-produto/');
        setConfigProduto(configResponse.data);
      } catch (err) {
        console.error('Erro ao buscar configuração de produto:', err);
        setConfigProduto(null);
      }

      setOpenDialog(true);
      setFormData({
        codigo: produto.codigo || '',
        nome: produto.nome || '',
        descricao: produto.descricao || '',
        categoria: produto.categoria || '',
        unidade_medida: produto.unidade_medida || 'UN',
        preco_custo: produto.preco_custo || '',
        id_grupo: produto.id_grupo || '',
        marca: produto.marca || '',
        classificacao: produto.classificacao || '',
        ncm: produto.ncm || '',
        gtin: produto.gtin || '',
        tributacao_info: produto.tributacao_info || '',
        imagem_url: produto.imagem_url || '',
        metragem_caixa: produto.metragem_caixa || '',
        rendimento_m2: produto.rendimento_m2 || '',
        peso_unitario: produto.peso_unitario || '',
        produto_pai: produto.produto_pai || produto.id_produto_pai || '',
        variacao: produto.variacao || '',
        genero: produto.genero || ''
      });
      setCodigoGerado('');
    } else {
      // Novo produto - buscar configuração e gerar código se necessário
      try {
        const configResponse = await axiosInstance.get('/config-produto/');
        const config = configResponse.data;
        setConfigProduto(config);
        
        let codigoInicial = '';
        
        if (config.tipo_geracao_codigo === 'automatica' || config.tipo_geracao_codigo === 'semi-automatica') {
          // Gerar código sugerido
          const codigoResponse = await axiosInstance.get('/config-produto/gerar_codigo/');
          codigoInicial = codigoResponse.data.codigo || '';
          setCodigoGerado(codigoInicial);
        }
        
        setFormData({
          codigo: codigoInicial,
          nome: '',
          descricao: '',
          categoria: '',
          unidade_medida: 'UN',
          preco_custo: '',
          id_grupo: '',
          marca: '',
          classificacao: '',
          ncm: '',
          gtin: '',
          tributacao_info: '',
          imagem_url: '',
          metragem_caixa: '',
          rendimento_m2: '',
          peso_unitario: '',
          produto_pai: '',
          variacao: ''
        });
        setGradeMode(false);
        setVariacoes([]);
        setOpenDialog(true);
      } catch (err) {
        console.error('Erro ao buscar configuração de produto:', err);
        // Se falhar, inicializa normalmente sem código
        setConfigProduto(null);
        setCodigoGerado('');
        setGradeMode(false);
        setVariacoes([]);
        setOpenDialog(true);
        setFormData({
          codigo: '',
          nome: '',
          descricao: '',
          categoria: '',
          unidade_medida: 'UN',
          preco_custo: '',
          id_grupo: '',
          marca: '',
          classificacao: '',
          ncm: '',
          gtin: '',
          tributacao_info: '',
          imagem_url: '',
          metragem_caixa: '',
          rendimento_m2: '',
          peso_unitario: '',
          produto_pai: '',
          variacao: ''
        });
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduto(null);
  };

  const handleOpenDepotDialog = async (productId) => {
    try {
      // Buscar informações atualizadas do produto com dados de estoque
      const response = await axiosInstance.get(`/produtos/${productId}/`);
      const produto = response.data;

      console.log(' Produto carregado para configuração de depósitos:', produto);

      if (produto.estoque_por_deposito && produto.estoque_por_deposito.length > 0) {
        setDepotValues(produto.estoque_por_deposito.map(dep => ({
          id_estoque: dep.id_estoque || null,
          id_deposito: dep.id_deposito,
          nome_deposito: dep.nome_deposito,
          quantidade: dep.quantidade_atual || 0,
          quantidade_minima: dep.quantidade_minima || 0,
          valor_venda: dep.valor_venda || 0
        })));
      } else {
        setDepotValues([]);
      }

      setSavedProductId(productId);
      setOpenDepotDialog(true);
    } catch (err) {
      console.error('Erro ao carregar dados de depósito:', err);
      alert('Erro ao carregar dados de depósito. Tente novamente.');
    }
  };

  const handleCloseDepotDialog = () => {
    setOpenDepotDialog(false);
    setSavedProductId(null);
    setDepotValues([]);
  };

  const handleSaveDepotConfig = async () => {
    try {
      console.log(' Salvando configurações de depósito:', depotValues);

      // Atualizar cada depósito via API
      for (const depot of depotValues) {
        if (depot.id_estoque) {
          const updateData = {
            quantidade_minima: parseFloat(depot.quantidade_minima) || 0,
            valor_venda: parseFloat(depot.valor_venda) || 0
          };

          console.log(` Atualizando estoque ${depot.id_estoque}:`, updateData);
          await axiosInstance.patch(`/estoques/${depot.id_estoque}/`, updateData);
        }
      }

      console.log(' Todas as configurações de depósito foram salvas!');
      alert('Configurações de depósito salvas com sucesso!');

      // Recarregar produtos e fechar dialog
      await fetchProdutos();
      handleCloseDepotDialog();

    } catch (err) {
      console.error(' Erro ao salvar configurações de depósito:', err);
      alert('Erro ao salvar configurações de depósito. Verifique o console para mais detalhes.');
    }
  };

  const handleDepotValueChange = (index, field, value) => {
    setDepotValues(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        codigo_produto: formData.codigo,
        nome_produto: formData.nome,
        descricao: formData.descricao,
        classificacao: formData.classificacao || formData.categoria, // Usar classificacao ou fallback para categoria
        unidade_medida: formData.unidade_medida,
        valor_custo: parseFloat(formData.preco_custo) || 0,
        id_grupo: formData.id_grupo || null,
        marca: formData.marca || null,
        ncm: formData.ncm || null,
        gtin: formData.gtin || null,
        tributacao_info: formData.tributacao_info || null,
        imagem_url: formData.imagem_url || null,
        // Campos de materiais de construção
        metragem_caixa: formData.metragem_caixa ? parseFloat(formData.metragem_caixa) : null,
        rendimento_m2: formData.rendimento_m2 ? parseFloat(formData.rendimento_m2) : null,
        peso_unitario: formData.peso_unitario ? parseFloat(formData.peso_unitario) : null,
        produto_pai: formData.produto_pai || null,
        variacao: formData.variacao || null,
        genero: formData.genero || null
      };
      
      // Se estiver em modo grade, enviar dados extras
      if (gradeMode && variacoes.length > 0) {
          dataToSave.variacoes = variacoes;
      }

      let productId;
      const isNewProduct = !editingProduto;

      if (editingProduto) {
        await axiosInstance.put(`/produtos/${editingProduto.id}/`, dataToSave);
        productId = editingProduto.id;
      } else {
        const response = await axiosInstance.post('/produtos/', dataToSave);
        // Se for array (criacao em lote/grade), pegar o ID do primeiro ou usar ids retornados
        if (Array.isArray(response.data)) {
            // Em caso de grade, pegamos o primeiro para configurar deposito ou nao abrimos
            // Por enquanto, se criar varios, nao abriremos config de deposito auto
            // Ou poderiamos pegar response.data[0].id_produto
            if (response.data.length > 0) productId = response.data[0].id_produto;
        } else {
            productId = response.data.id_produto || response.data.id;
        }
        
        // Se for novo produto e código automático, confirmar uso
        if (configProduto && configProduto.tipo_geracao_codigo === 'automatica' && codigoGerado) {
          try {
            await axiosInstance.post('/config-produto/confirmar_uso_codigo/', {
              codigo: codigoGerado
            });
            console.log('✅ Código confirmado e contador incrementado');
          } catch (err) {
            console.error('⚠️ Erro ao confirmar uso do código:', err);
            // Não bloqueia o fluxo se falhar
          }
        }
      }

      await fetchProdutos();
      handleCloseDialog();
      
      // Verificar se veio da tela de compras para retornar automaticamente
      const origem = sessionStorage.getItem('cadastro_produto_origem');
      const itemIndex = sessionStorage.getItem('cadastro_produto_item_index');
      
      if (origem === 'compra_form' && itemIndex !== null && productId) {
        // Salvar informações do produto cadastrado para seleção automática
        const produtoCadastrado = editingProduto 
          ? produtos.find(p => p.id === editingProduto.id) 
          : { ean: formData.gtin, gtin: formData.gtin };
          
        sessionStorage.setItem('cadastro_turbo_produto_cadastrado', formData.gtin || '');
        sessionStorage.setItem('cadastro_turbo_item_index_retorno', itemIndex);
        
        // Limpar sessionStorage de origem
        sessionStorage.removeItem('cadastro_produto_origem');
        sessionStorage.removeItem('cadastro_produto_item_index');
        sessionStorage.removeItem('cadastro_produto_editando_id');
        
        toast.success('✅ Produto salvo! Retornando para compras...', { autoClose: 1500 });
        
        // Aguardar um momento e voltar
        setTimeout(() => {
          navigate('/compras');
        }, 1500);
        
        return; // Não continuar com dialog de depósito
      }
      
      // So abrir deposito se for UM produto criado (não lote) ou se editar
      if (productId && (!gradeMode || editingProduto)) {
        // Abrir dialog de configuração de depósitos
        handleOpenDepotDialog(productId);
      } else if (gradeMode) {
          alert('Produtos em grade criados com sucesso!');
      }

    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      alert('Erro ao salvar produto. Verifique o console para mais detalhes.');
    }
  };

  const handleSaveCategoria = () => {
    if (!novaCategoria.trim()) {
      alert('Nome da categoria é obrigatório');
      return;
    }

    const categoriaCapitalizada = novaCategoria.trim().charAt(0).toUpperCase() + novaCategoria.trim().slice(1);
    
    if (categorias.includes(categoriaCapitalizada)) {
      alert('Esta categoria já existe');
      return;
    }

    setCategorias([...categorias, categoriaCapitalizada]);
    setFormData({ ...formData, categoria: categoriaCapitalizada });
    setOpenCategoriaDialog(false);
    setNovaCategoria('');
    alert('Categoria adicionada com sucesso!');
  };

  const handleSaveMarca = () => {
    if (!novaMarca.trim()) {
      alert('Nome da marca é obrigatório');
      return;
    }

    const marcaCapitalizada = novaMarca.trim().charAt(0).toUpperCase() + novaMarca.trim().slice(1);
    
    if (marcas.includes(marcaCapitalizada)) {
      alert('Esta marca já existe');
      return;
    }

    setMarcas([...marcas, marcaCapitalizada]);
    setFormData({ ...formData, marca: marcaCapitalizada });
    setOpenMarcaDialog(false);
    setNovaMarca('');
    alert('Marca adicionada com sucesso!');
  };

  useEffect(() => {
    fetchProdutos();
    fetchGrupos();
    // Carregar config de produto no mount para que as abas fiquem disponíveis imediatamente
    axiosInstance.get('/config-produto/')
      .then(res => setConfigProduto(res.data))
      .catch(() => {});
  }, [axiosInstance]);

  // Detectar retorno da tela de compras e abrir dialog automaticamente
  useEffect(() => {
    const voltandoDeCompra = sessionStorage.getItem('cadastro_produto_voltando');
    const dadosXMLString = sessionStorage.getItem('cadastro_produto_dados_xml');
    
    if (voltandoDeCompra === 'true' && dadosXMLString) {
      try {
        const dadosXML = JSON.parse(dadosXMLString);
        
        // Abrir dialog de novo produto
        handleOpenDialog().then(() => {
          // Preencher campos com dados do XML após dialog abrir
          setTimeout(() => {
            setFormData(prev => ({
              ...prev,
              gtin: dadosXML.gtin || '',
              nome: dadosXML.nome || '',
              descricao: dadosXML.descricao || '',
              ncm: dadosXML.ncm || '',
              unidade_medida: dadosXML.unidade_medida || 'UN',
              preco_custo: dadosXML.preco_custo || '',
              codigo: dadosXML.codigo || prev.codigo
            }));
            
            toast.success('✅ Dados do XML carregados! Complete as informações necessárias.', {
              autoClose: 3000
            });
          }, 100);
        });
      } catch (error) {
        console.error('Erro ao carregar dados do XML:', error);
      }
      
      // Limpar flags (mas manter origem e index para o retorno)
      sessionStorage.removeItem('cadastro_produto_voltando');
      sessionStorage.removeItem('cadastro_produto_dados_xml');
    }
  }, []);

  if (loading && produtos.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Produtos
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Gerencie seu estoque e catálogo de produtos
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterOpen(true)}
            size="large"
          >
            Filtros
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            Novo Produto
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <InventoryIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Produtos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.baixoEstoque}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estoque Baixo
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.semEstoque}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sem Estoque
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MoneyIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    R$ {stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Valor do Estoque
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Busca */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por código, nome ou categoria..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Gênero</TableCell>
              <TableCell>Preço</TableCell>
              <TableCell>Estoque</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProdutos.map((produto) => {
              const status = getEstoqueStatus(produto);
              return (
                <TableRow key={produto.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {produto.codigo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body1">{produto.nome}</Typography>
                      {produto.descricao && (
                        <Typography variant="body2" color="text.secondary">
                          {produto.descricao}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={produto.categoria}
                      size="small"
                      icon={<CategoryIcon />}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {produto.genero ? (
                      <Chip
                        label={produto.genero.charAt(0).toUpperCase() + produto.genero.slice(1)}
                        size="small"
                        color={produto.genero === 'feminino' ? 'error' : produto.genero === 'masculino' ? 'info' : 'default'}
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      R$ {parseFloat(produto.preco_venda || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Custo: R$ {parseFloat(produto.preco_custo || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {produto.estoque_por_deposito && produto.estoque_por_deposito.length > 0 ? (
                      <Box>
                        <Typography variant="h6" color="primary" gutterBottom>
                          Total: {produto.estoque_total || 0}
                        </Typography>
                        {produto.estoque_por_deposito.map((deposito, index) => (
                          <Typography key={index} variant="body2" color="text.secondary">
                            {deposito.nome_deposito}: {deposito.quantidade_atual}
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="h6" color="text.secondary">
                          {produto.estoque_total || produto.estoque || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Configurar depósitos
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={status.color}
                      label={status.label}
                      icon={status.icon}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(produto)}
                      title="Editar produto"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => handleOpenDepotDialog(produto.id)}
                      title="Configurar depósitos"
                    >
                      <WarehouseIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
                          setProdutos(prev => prev.filter(p => p.id !== produto.id));
                          setFilteredProdutos(prev => prev.filter(p => p.id !== produto.id));
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredProdutos.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {searchTerm
              ? 'Tente buscar por outro termo'
              : 'Clique em "Novo Produto" para começar'
            }
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Novo Produto
            </Button>
          )}
        </Paper>
      )}

      {/* Dialog de Edição/Criação - COM ABAS */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduto ? 'Editar Produto' : 'Novo Produto'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Dados Básicos" />
              <Tab label="Classificação" />
              {configProduto?.material_construcao && (
                <Tab label="Materiais de Construção" />
              )}
            </Tabs>
          </Box>

          {/* ABA 1: Dados Básicos */}
          {tabValue === 0 && (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              
              {/* Toggle Grade Mode */}
              {!editingProduto && configProduto?.produto_em_grade && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, mb: 1, backgroundColor: '#f5f5f5' }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center">
                                <InventoryIcon color={gradeMode ? "primary" : "disabled"} sx={{ mr: 1 }} />
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Cadastrar como Grade de Produtos
                                </Typography>
                            </Box>
                            <Button 
                                variant={gradeMode ? "contained" : "outlined"} 
                                onClick={() => setGradeMode(!gradeMode)}
                                size="small"
                            >
                                {gradeMode ? "ATIVADO" : "DESATIVADO"}
                            </Button>
                        </Box>
                        {gradeMode && (
                            <Box mt={2}>
                                <Typography variant="caption" display="block" mb={1}>
                                    Adicione variações de Tamanho e Cor. Cada variação criará um produto separado.
                                </Typography>
                                {variacoes.map((v, idx) => (
                                    <Grid container spacing={1} key={idx} sx={{ mb: 1 }}>
                                        <Grid item xs={5}>
                                            <TextField 
                                                label="Tamanho" size="small" fullWidth 
                                                value={v.tamanho} 
                                                onChange={e => {
                                                    const newVars = [...variacoes];
                                                    newVars[idx].tamanho = e.target.value;
                                                    setVariacoes(newVars);
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={5}>
                                            <TextField 
                                                label="Cor" size="small" fullWidth 
                                                value={v.cor} 
                                                onChange={e => {
                                                    const newVars = [...variacoes];
                                                    newVars[idx].cor = e.target.value;
                                                    setVariacoes(newVars);
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={2}>
                                            <IconButton color="error" size="small" onClick={() => {
                                                const newVars = variacoes.filter((_, i) => i !== idx);
                                                setVariacoes(newVars);
                                            }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                ))}
                                <Button 
                                    startIcon={<AddIcon />} size="small" sx={{ mt: 1 }}
                                    onClick={() => setVariacoes([...variacoes, {tamanho: '', cor: ''}])}
                                >
                                    Adicionar Variação
                                </Button>
                            </Box>
                        )}
                    </Paper>
                  </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Código"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  margin="normal"
                  required
                  disabled={
                    !editingProduto && 
                    configProduto && 
                    configProduto.tipo_geracao_codigo === 'automatica'
                  }
                  helperText={
                    !editingProduto && configProduto
                      ? configProduto.tipo_geracao_codigo === 'automatica'
                        ? '🤖 Código gerado automaticamente'
                        : configProduto.tipo_geracao_codigo === 'semi-automatica'
                        ? '✏️ Código sugerido - você pode alterar'
                        : '📝 Digite o código manualmente'
                      : ''
                  }
                  InputProps={{
                    sx: {
                      bgcolor: !editingProduto && configProduto && configProduto.tipo_geracao_codigo === 'automatica'
                        ? 'action.disabledBackground'
                        : 'inherit'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL da Imagem"
                  value={formData.imagem_url || ''}
                  onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })}
                  margin="normal"
                  placeholder="https://exemplo.com/imagem.jpg ou /media/produtos/imagem.jpg"
                  helperText="Cole a URL completa da imagem do produto (ex: https://...)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    select
                    label="Categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    margin="normal"
                  >
                    {categorias.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </TextField>
                  <IconButton
                    color="primary"
                    onClick={() => { setNovaCategoria(''); setOpenCategoriaDialog(true); }}
                    sx={{ mb: 1 }}
                    title="Criar nova categoria"
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Unidade de Medida"
                  value={formData.unidade_medida}
                  onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                  margin="normal"
                >
                  <MenuItem value="UN">Unidade (UN)</MenuItem>
                  <MenuItem value="KG">Quilograma (KG)</MenuItem>
                  <MenuItem value="G">Grama (G)</MenuItem>
                  <MenuItem value="L">Litro (L)</MenuItem>
                  <MenuItem value="ML">Mililitro (ML)</MenuItem>
                  <MenuItem value="M">Metro (M)</MenuItem>
                  <MenuItem value="CM">Centímetro (CM)</MenuItem>
                  <MenuItem value="M2">Metro² (M2)</MenuItem>
                  <MenuItem value="M3">Metro³ (M3)</MenuItem>
                  <MenuItem value="CX">Caixa (CX)</MenuItem>
                  <MenuItem value="PCT">Pacote (PCT)</MenuItem>
                  <MenuItem value="PC">Peça (PC)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Gênero"
                  value={formData.genero || ''}
                  onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                  margin="normal"
                  helperText="Público-alvo do produto"
                >
                  <MenuItem value="">Não especificado</MenuItem>
                  <MenuItem value="FEMININO">Feminino</MenuItem>
                  <MenuItem value="MASCULINO">Masculino</MenuItem>
                  <MenuItem value="UNISSEX">Unissex</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    fullWidth
                    label="GTIN / Código de Barras"
                    value={formData.gtin || ''}
                    onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                    margin="normal"
                    helperText="EAN-8, EAN-13 ou SEM GTIN"
                    inputProps={{ maxLength: 14 }}
                  />
                  <Tooltip title="Buscar dados automaticamente pelo GTIN/EAN usando APIs externas">
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={buscarDadosPorGtin}
                      disabled={buscandoTurbo || !formData.gtin}
                      startIcon={<FlashOnIcon />}
                      sx={{ 
                        mt: 1,
                        minWidth: '160px',
                        fontWeight: 'bold',
                        textTransform: 'none'
                      }}
                    >
                      {buscandoTurbo ? 'Buscando...' : 'Cadastro Turbo'}
                    </Button>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Preço de Custo"
                  type="number"
                  value={formData.preco_custo}
                  onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
                  margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          )}

          {/* ABA 2: Classificação */}
          {tabValue === 1 && (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Grupo de Produto"
                  value={formData.id_grupo}
                  onChange={(e) => setFormData({ ...formData, id_grupo: e.target.value })}
                  margin="normal"
                  helperText="Selecione o grupo/categoria principal"
                >
                  <MenuItem value="">
                    <em>Nenhum</em>
                  </MenuItem>
                  {grupos.map((grupo) => (
                    <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                      {grupo.nome_grupo}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    select
                    label="Marca"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    margin="normal"
                    helperText="Ex: Nike, Samsung, etc."
                  >
                    {marcas.map((marca) => (
                      <MenuItem key={marca} value={marca}>{marca}</MenuItem>
                    ))}
                  </TextField>
                  <IconButton
                    color="primary"
                    onClick={() => { setNovaMarca(''); setOpenMarcaDialog(true); }}
                    sx={{ mb: 1 }}
                    title="Criar nova marca"
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Classificação</InputLabel>
                  <Select
                    value={formData.classificacao || ''}
                    onChange={(e) => setFormData({ ...formData, classificacao: e.target.value })}
                    label="Classificação"
                  >
                    <MenuItem value="">Nenhuma</MenuItem>
                    <MenuItem value="REVENDA">Revenda</MenuItem>
                    <MenuItem value="SERVICO">Serviço</MenuItem>
                    <MenuItem value="CONSUMO">Consumo</MenuItem>
                    <MenuItem value="INSUMO">Insumo</MenuItem>
                    <MenuItem value="IMOBILIZADO">Imobilizado</MenuItem>
                    <MenuItem value="MATERIA-PRIMA">Matéria-Prima</MenuItem>
                  </Select>
                  <FormHelperText>Tipo/classificação do produto</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Gênero</InputLabel>
                  <Select
                    value={formData.genero || ''}
                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                    label="Gênero"
                  >
                    <MenuItem value="">Não especificado</MenuItem>
                    <MenuItem value="FEMININO">Feminino</MenuItem>
                    <MenuItem value="MASCULINO">Masculino</MenuItem>
                    <MenuItem value="UNISSEX">Unissex</MenuItem>
                  </Select>
                  <FormHelperText>Público-alvo do produto</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="NCM"
                  value={formData.ncm}
                  onChange={(e) => setFormData({ ...formData, ncm: e.target.value })}
                  margin="normal"
                  helperText="Código NCM (8 dígitos)"
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Informações de Tributação"
                  value={formData.tributacao_info}
                  onChange={(e) => setFormData({ ...formData, tributacao_info: e.target.value })}
                  margin="normal"
                  multiline
                  rows={3}
                  helperText="ICMS, IPI, PIS/COFINS, etc."
                />
              </Grid>
            </Grid>
          )}

          {/* ABA 3: Materiais de Construção */}
          {configProduto?.material_construcao && tabValue === 2 && (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info" icon={<WarehouseIcon />}>
                  Campos específicos para materiais de construção (pisos, revestimentos, tintas, argamassa, etc.)
                </Alert>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Metragem por Caixa (m²)"
                  type="number"
                  value={formData.metragem_caixa || ''}
                  onChange={(e) => setFormData({ ...formData, metragem_caixa: e.target.value })}
                  margin="normal"
                  helperText="Quantos m² cada caixa cobre (ex: pisos, revestimentos)"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">m²</InputAdornment>,
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Rendimento por m²"
                  type="number"
                  value={formData.rendimento_m2 || ''}
                  onChange={(e) => setFormData({ ...formData, rendimento_m2: e.target.value })}
                  margin="normal"
                  helperText="Rendimento em m² por unidade (ex: tintas, argamassa)"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">m²/un</InputAdornment>,
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Peso Unitário (kg)"
                  type="number"
                  value={formData.peso_unitario || ''}
                  onChange={(e) => setFormData({ ...formData, peso_unitario: e.target.value })}
                  margin="normal"
                  helperText="Peso em kg para controle de carga e logística"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                  inputProps={{ step: "0.001", min: "0" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Descrição da Variação"
                  value={formData.variacao || ''}
                  onChange={(e) => setFormData({ ...formData, variacao: e.target.value })}
                  margin="normal"
                  helperText="Ex: 20mm, 25mm, Branco, Cinza, etc."
                  placeholder="Ex: 20mm, Branco, 60x60"
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  fullWidth
                  options={produtos.filter(p => p.id_produto !== editingProduto?.id_produto)}
                  getOptionLabel={(option) => option ? `${option.codigo_produto || option.codigo} - ${option.nome || option.nome_produto}` : ''}
                  value={produtos.find(p => p.id_produto === formData.produto_pai) || null}
                  onChange={(event, newValue) => {
                    setFormData({ ...formData, produto_pai: newValue ? newValue.id_produto : '' });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Produto Pai (Opcional)"
                      margin="normal"
                      helperText="Se este produto é uma variação de outro produto"
                      placeholder="Digite para buscar..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id_produto}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {option.codigo_produto || option.codigo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.nome || option.nome_produto}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  noOptionsText="Nenhum produto encontrado"
                  isOptionEqualToValue={(option, value) => option.id_produto === value?.id_produto}
                />
              </Grid>
            </Grid>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            Após salvar, você poderá configurar o preço de venda e estoque mínimo para cada depósito.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!formData.codigo || !formData.nome}
          >
            {editingProduto ? 'Atualizar e Configurar Depósitos' : 'Salvar e Configurar Depósitos'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Configuração de Depósitos */}
      <Dialog open={openDepotDialog} onClose={handleCloseDepotDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarehouseIcon color="primary" />
            Configuração de Depósitos
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Configure o preço de venda e estoque mínimo para cada depósito. A quantidade atual é apenas para visualização.
          </Alert>

          {depotValues.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Depósito</strong></TableCell>
                    <TableCell align="center"><strong>Quantidade Atual</strong></TableCell>
                    <TableCell><strong>Preço de Venda</strong></TableCell>
                    <TableCell><strong>Estoque Mínimo</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {depotValues.map((depot, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {depot.nome_deposito}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${depot.quantidade} unidades`}
                          color="default"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={depot.valor_venda}
                          onChange={(e) => handleDepotValueChange(index, 'valor_venda', e.target.value)}
                          size="small"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                          }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={depot.quantidade_minima}
                          onChange={(e) => handleDepotValueChange(index, 'quantidade_minima', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="warning">
              Nenhum depósito encontrado para este produto. Verifique se os depósitos foram criados corretamente.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDepotDialog}
            startIcon={<CancelIcon />}
          >
            Fechar
          </Button>
          <Button
            onClick={handleSaveDepotConfig}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={depotValues.length === 0}
          >
            Salvar Configurações
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Criar Nova Categoria */}
      <Dialog
        open={openCategoriaDialog}
        onClose={() => setOpenCategoriaDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nova Categoria</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nome da Categoria"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              variant="outlined"
              required
              placeholder="Ex: Ferramentas, Brinquedos, Alimentos..."
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoriaDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveCategoria} variant="contained">
            Criar Categoria
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Criar Nova Marca */}
      <Dialog
        open={openMarcaDialog}
        onClose={() => setOpenMarcaDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nova Marca</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nome da Marca"
              value={novaMarca}
              onChange={(e) => setNovaMarca(e.target.value)}
              variant="outlined"
              required
              placeholder="Ex: Bosch, Tramontina, Nestlé..."
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMarcaDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveMarca} variant="contained">
            Criar Marca
          </Button>
        </DialogActions>
      </Dialog>

      {/* FilterDrawer */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApplyFilters={() => {
          setFilterOpen(false);
          fetchProdutos();
        }}
        filters={filters}
        onFilterChange={setFilters}
        title="Filtros de Produtos"
      >
        {/* Filtro customizado: Grupo de Produto */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Grupo de Produto</InputLabel>
          <Select
            value={filters.grupo}
            onChange={(e) => setFilters({ ...filters, grupo: e.target.value })}
            label="Grupo de Produto"
          >
            <MenuItem value="">Todos</MenuItem>
            {grupos.map((grupo) => (
              <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                {grupo.nome_grupo}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filtro customizado: Status de Estoque */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Status de Estoque</InputLabel>
          <Select
            value={filters.estoque_status}
            onChange={(e) => setFilters({ ...filters, estoque_status: e.target.value })}
            label="Status de Estoque"
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="disponivel">Disponível (estoque &gt; 0)</MenuItem>
            <MenuItem value="baixo">Estoque Baixo</MenuItem>
            <MenuItem value="zerado">Sem Estoque</MenuItem>
          </Select>
        </FormControl>
      </FilterDrawer>
    </Box>
  );
};

export default ProdutoPage;
