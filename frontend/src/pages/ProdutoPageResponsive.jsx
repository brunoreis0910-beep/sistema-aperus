import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Fab,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Slide,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  InputAdornment,
  Checkbox,
  LinearProgress,
  Tooltip,
  Badge,
  Autocomplete,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Image as ImageIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Warehouse as WarehouseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Calculate as CalculateIcon,
  EventNote as EventNoteIcon,
  GridOn as GridOnIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  PlayArrow as PlayArrowIcon,
  AutoMode as AutoModeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useGruposProduto } from '../context/GruposProdutoContext';
import LotesComponent from '../components/LotesComponent';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ProdutoPageResponsive = () => {
  const { axiosInstance } = useAuth();
  const { gruposAtivos, loading: loadingGrupos, adicionarGrupo } = useGruposProduto();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openGrupoDialog, setOpenGrupoDialog] = useState(false);
  const [openCategoriaDialog, setOpenCategoriaDialog] = useState(false);
  const [novaCategoriaInput, setNovaCategoriaInput] = useState('');
  const [openMarcaDialog, setOpenMarcaDialog] = useState(false);
  const [novaMarcaInput, setNovaMarcaInput] = useState('');
  const [openDepotDialog, setOpenDepotDialog] = useState(false);
  const [openEstoqueDialog, setOpenEstoqueDialog] = useState(false);
  const [openAuditDialog, setOpenAuditDialog] = useState(false); // New Audit Dialog
  const [auditResults, setAuditResults] = useState([]);
  // Auditoria — abas GTIN e Palavra-chave
  const [auditTab, setAuditTab] = useState(0);
  const [gtinInput, setGtinInput] = useState('');
  const [gtinResult, setGtinResult] = useState(null);
  const [gtinLoading, setGtinLoading] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const [keywordResults, setKeywordResults] = useState([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  // Cadastro CST IBS/CBS
  const [openCstDialog, setOpenCstDialog] = useState(false);
  const [cstList, setCstList] = useState([]);
  const [newCstCodigo, setNewCstCodigo] = useState('');
  const [newCstDescricao, setNewCstDescricao] = useState('');
  const [cstSaving, setCstSaving] = useState(false);
  // Cadastro cClassTrib
  const [openClassTribDialog, setOpenClassTribDialog] = useState(false);
  const [classTribList, setClassTribList] = useState([]);
  const [newCtCodigo, setNewCtCodigo] = useState('');
  const [newCtDescricao, setNewCtDescricao] = useState('');
  const [newCtCst, setNewCtCst] = useState('');
  const [ctSaving, setCtSaving] = useState(false);
  // Preview Calcular Tributos
  const [openPreviewTributosDialog, setOpenPreviewTributosDialog] = useState(false);
  const [previewTributosData, setPreviewTributosData] = useState([]);
  const [previewTributosLoading, setPreviewTributosLoading] = useState(false);
  const [selectedPreviewIds, setSelectedPreviewIds] = useState([]);
  const [previewFiltroMudancas, setPreviewFiltroMudancas] = useState(true);
  const [previewFiltroSuspeitos, setPreviewFiltroSuspeitos] = useState(false);
  const [previewStats, setPreviewStats] = useState({ com_mudancas: 0, ncm_suspeitos: 0, api_disponivel: false });
  const [calculoAutoLoading, setCalculoAutoLoading] = useState(false);
  const [calculoAutoMessage, setCalculoAutoMessage] = useState('');
  const [produtoSemEstoque, setProdutoSemEstoque] = useState(null);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [operacao, setOperacao] = useState(null);
  const [savedProductId, setSavedProductId] = useState(null);
  const [depotValues, setDepotValues] = useState([]);
  const [tabValue, setTabValue] = useState(0); // Controle de abas no diálogo
  const [tributacaoData, setTributacaoData] = useState({
    cfop: '5102',
    cst_icms: '',
    csosn: '400',
    icms_aliquota: '0',
    // IPI
    cst_ipi: '99',
    ipi_aliquota: '0',
    cst_ipi_sn: '99',
    ipi_aliquota_sn: '0',
    // PIS
    cst_pis_cofins: '01',
    pis_aliquota: '0',
    cst_pis_sn: '07',
    pis_aliquota_sn: '0',
    // COFINS
    cofins_aliquota: '0',
    cst_cofins_sn: '07',
    cofins_aliquota_sn: '0',
    // IBS/CBS
    cst_ibs_cbs: '000',
    ibs_aliquota: '0',
    cbs_aliquota: '0',
    imposto_seletivo_aliquota: '0',
    classificacao_fiscal: '',
    fonte_info: '',
  });
  const [tributacaoSubTab, setTributacaoSubTab] = useState(0);
  const [tiposTributacaoProd, setTiposTributacaoProd] = useState([]);
  const [perfilTribProd, setPerfilTribProd] = useState('');
  const [ipiSubTab, setIpiSubTab] = useState(0);
  const [pisSubTab, setPisSubTab] = useState(0);
  const [cofinsSubTab, setCofinsSubTab] = useState(0);
  const [configProduto, setConfigProduto] = useState(null);

  // --- ESTADOS DE PRODUTO EM GRADE ---
  const [gradeMode, setGradeMode] = useState(false);
  const [tamanhos, setTamanhos] = useState([]);
  const [cores, setCores] = useState([]);
  const [tamanhoInput, setTamanhoInput] = useState('');
  const [corInput, setCorInput] = useState('');

  useEffect(() => {
    // Carregar configuração de geração de código
    axiosInstance.get('/config-produto/')
      .then(res => setConfigProduto(res.data))
      .catch(err => console.error("Erro ao carregar config produto:", err));
    // Carregar perfis de tributação
    axiosInstance.get('/tipos-tributacao/?ativo=true')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
        setTiposTributacaoProd(data);
      })
      .catch(() => {});
  }, [axiosInstance]);

  // Filtros separados com persistência no localStorage
  const [filtroEstoque, setFiltroEstoque] = useState(() => {
    return localStorage.getItem('filtroEstoque') || 'AMBOS';
  });
  const [filtroPreco, setFiltroPreco] = useState(() => {
    return localStorage.getItem('filtroPreco') || 'AMBOS';
  });

  // Funções para salvar filtros no localStorage
  const handleChangeFiltroEstoque = (novoValor) => {
    setFiltroEstoque(novoValor);
    localStorage.setItem('filtroEstoque', novoValor);
  };

  const handleChangeFiltroPreco = (novoValor) => {
    setFiltroPreco(novoValor);
    localStorage.setItem('filtroPreco', novoValor);
  };

  const aplicarPerfilTribProd = (id) => {
    setPerfilTribProd(id);
    if (!id) return;
    const perfil = tiposTributacaoProd.find(t => t.id === id);
    if (!perfil) return;
    setTributacaoData(prev => ({
      ...prev,
      cfop: perfil.cfop_padrao || prev.cfop,
      cst_icms: perfil.icms_cst_csosn || prev.cst_icms,
      csosn: perfil.icms_cst_csosn || prev.csosn,
    }));
  };

  const handleLaunchCorrection = async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/produtos/launch_correction_tool/');
      alert('Ferramenta de Correção Tributária iniciada no servidor (Janela Separada).');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message;
      alert('Erro ao iniciar ferramenta: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaxes = async () => {
    // Abre o dialog de preview antes de aplicar
    try {
      setPreviewTributosLoading(true);
      setOpenPreviewTributosDialog(true);
      setPreviewTributosData([]);
      setSelectedPreviewIds([]);
      
      // Verificar se API do governo está disponível
      let apiDisponivel = false;
      try {
        const healthCheck = await fetch('http://localhost:8080/actuator/health', { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(2000)
        });
        apiDisponivel = healthCheck.ok;
      } catch {
        apiDisponivel = false;
      }
      
      const resp = await axiosInstance.get('/produtos/preview_tributos/');
      const items = resp.data.preview || [];
      setPreviewTributosData(items);
      setPreviewStats({
        com_mudancas: resp.data.com_mudancas || 0,
        ncm_suspeitos: resp.data.ncm_suspeitos || 0,
        api_disponivel: apiDisponivel
      });
      setPreviewFiltroSuspeitos(false);
      // Pré-seleciona todos que têm mudanças MAS não são suspeitos
      setSelectedPreviewIds(items.filter(x => x.tem_mudancas && !x.ncm_suspeito).map(x => x.id));
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar preview: ' + (err.response?.data?.error || err.message));
      setOpenPreviewTributosDialog(false);
    } finally {
      setPreviewTributosLoading(false);
    }
  };

  const handleAplicarTributosSelecionados = async () => {
    if (selectedPreviewIds.length === 0) {
      alert('Selecione ao menos um produto.');
      return;
    }
    try {
      setLoading(true);
      const response = await axiosInstance.post('/produtos/atualizar_tributos_em_massa/', {
        ids: selectedPreviewIds,
      });
      alert(`${response.data.message || 'Concluído!'} (${response.data.produtos_atualizados} produto(s) atualizados)`);
      setOpenPreviewTributosDialog(false);
      fetchProdutos();
      const pidAberto = selectedProduto?.id_produto || selectedProduto?.id;
      if (openDialog && pidAberto) {
        axiosInstance.get(`/produtos/${pidAberto}/tributacao/`)
          .then(res => setTributacaoData(prev => ({ ...prev, ...res.data })))
          .catch(() => {});
      }
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCalcularTributosAuto = async () => {
    try {
      setCalculoAutoLoading(true);
      setCalculoAutoMessage('🚀 Verificando API do Governo...');
      
      // Simular progresso para dar feedback ao usuário
      const progressInterval = setInterval(() => {
        setCalculoAutoMessage(prev => {
          if (prev.includes('Verificando')) return '⏳ Iniciando API do Governo (15-30s)...';
          if (prev.includes('Iniciando')) return '🔄 Calculando tributos de todos os produtos...';
          if (prev.includes('Calculando')) return '⚙️ Processando resultados...';
          return '⏳ Aguarde, finalizando...';
        });
      }, 10000); // A cada 10 segundos muda a mensagem
      
      try {
        // Chamar endpoint inteligente que faz tudo
        // Timeout de 90 segundos: 30s para iniciar API + 60s para calcular todos os produtos
        const response = await axiosInstance.post('/produtos/calcular-tributos-auto/', {}, {
          timeout: 90000 // 90 segundos
        });
        const data = response.data;
        
        clearInterval(progressInterval);
        
        if (data.status === 'success') {
          const msg = data.api_disponivel 
            ? `✅ Cálculo concluído com API OFICIAL do Governo!\n\n` +
              `📊 Produtos analisados: ${data.produtos_analisados}\n` +
              `✅ Produtos atualizados: ${data.produtos_atualizados}\n` +
              `🔄 Com mudanças: ${data.com_mudancas}\n` +
              `⚠️ NCM suspeitos: ${data.ncm_suspeitos}`
            : `✅ Cálculo concluído (modo offline)!\n\n` +
              `📊 Produtos analisados: ${data.produtos_analisados}\n` +
              `✅ Produtos atualizados: ${data.produtos_atualizados}`;
          
          alert(msg);
          await fetchProdutos();
        } else if (data.status === 'error') {
          alert(`⚠️ ${data.message}\n\nUsando banco de dados local para cálculos.`);
        }
      } finally {
        clearInterval(progressInterval);
      }
      
    } catch (err) {
      console.error('Erro ao calcular tributos automaticamente:', err);
      const errorMsg = err.code === 'ECONNABORTED' 
        ? 'A operação demorou muito tempo. Isso pode acontecer na primeira vez que a API inicia.\n\nTente novamente em alguns instantes.'
        : err.response?.data?.message || err.message;
      alert('Erro ao calcular tributos: ' + errorMsg);
    } finally {
      setCalculoAutoLoading(false);
      setCalculoAutoMessage('');
    }
  };

  // Calcular o número total de colunas da tabela
  const calcularTotalColunas = () => {
      let colunas = 9; // Produto, Categoria, Grupo, Marca, NCM, IBS%, CBS%, CST, cClassTrib
    // Colunas de Preço
    if (filtroPreco === 'AMBOS') colunas += 2;
    else colunas += 1;

    // Colunas de Estoque
    if (filtroEstoque === 'AMBOS') colunas += 2;
    else colunas += 1;

    colunas += 2; // Status e Ações

    return colunas;
  };
  const [novoGrupo, setNovoGrupo] = useState({
    nome: '',
    descricao: ''
  });
  const [formData, setFormData] = useState({
    nome: '',
    codigo_produto: '',
    categoria: '',
    grupo: '',
    marca: '',
    classificacao: '',
    unidade_medida: 'UN',
    ncm: '',
    cest: '',
    gtin: '',
    imagem_url: '',
    descricao: '',
    metragem_caixa: '',
    rendimento_m2: '',
    peso_unitario: '',
    variacao: '',
    id_produto_pai: '',
    produtos_complementares: [],
    produtos_similares: [],
    controla_lote: false,
    genero: ''
  });

  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const classificacoes = ['', 'REVENDA', 'SERVICO', 'CONSUMO', 'INSUMO', 'IMOBILIZADO', 'MATERIA-PRIMA'];

  // Funções auxiliares para mapear valores da API para valores válidos dos selects
  const mapearCategoria = (categoria) => {
    if (!categoria) return '';
    return categoria.toString();
  };

  const mapearMarca = (marca) => {
    if (!marca) return '';
    return marca.toString();
  };

  // Carregar categorias e marcas da API
  const fetchCategoriasEMarcas = async () => {
    try {
      const [resCat, resMarca] = await Promise.all([
        axiosInstance.get('/produtos/categorias/'),
        axiosInstance.get('/produtos/marcas/')
      ]);
      setCategorias(resCat.data || []);
      setMarcas(resMarca.data || []);
    } catch (e) {
      console.warn('Erro ao carregar categorias/marcas:', e);
    }
  };

  const mapearGrupo = (grupo, gruposDisponiveis) => {
    if (!grupo || !gruposDisponiveis || gruposDisponiveis.length === 0) return '';

    // Se for um ID numérico (int ou string numérica), procurar nos grupos disponíveis
    const idNumerico = typeof grupo === 'number' ? grupo : parseInt(grupo, 10);
    if (!isNaN(idNumerico)) {
      const grupoEncontrado = gruposDisponiveis.find(g => Number(g.id) === idNumerico);
      if (grupoEncontrado) {
        return grupoEncontrado.nome;
      }
    }

    // Se for string (nome do grupo), verificar se existe nos grupos disponíveis
    if (typeof grupo === 'string' && grupo.trim()) {
      const grupoEncontrado = gruposDisponiveis.find(g =>
        g.nome && g.nome.toLowerCase() === grupo.toLowerCase()
      );
      if (grupoEncontrado) {
        return grupoEncontrado.nome;
      }
    }

    return '';
  };

  // função auxiliar para determinar status baseado no estoque
  const determinarStatus = (produto) => {
    const estoque = parseFloat(produto.estoque_total || produto.estoque_atual || produto.estoque || 0);
    const minimo = produto.estoque_minimo || 5;

    if (estoque <= 0) return 'Sem Estoque';
    if (estoque <= minimo) return 'Estoque Baixo';
    return 'Em Estoque';
  };

  useEffect(() => {
    // Limpar filtros persistentes ao montar o componente
    setSearchTerm('');
    setCategoryFilter('');
    console.log('🔍 [ProdutoPage] Montagem - limpando filtros');
    
    fetchOperacao();
    fetchProdutos();
    fetchCategoriasEMarcas();
    // Pré-carrega classificações tributárias para o Autocomplete
    axiosInstance.get('/produtos/listar_classificacoes/')
      .then(res => setClassTribList(res.data || []))
      .catch(() => {});
  }, []);

  // 🔄 Atualizar grupos nos produtos quando gruposAtivos ou produtos mudarem
  // Esse effect garante que o nome do grupo sempre seja exibido corretamente
  useEffect(() => {
    if (!loadingGrupos && gruposAtivos.length > 0 && produtos.length > 0) {
      console.log('🔄 [ProdutoPage] Remapeando grupos nos produtos...', {
        totalGrupos: gruposAtivos.length,
        totalProdutos: produtos.length,
        gruposIds: gruposAtivos.map(g => `${g.id}:${g.nome}`).slice(0, 5)
      });
      
      // Verificar se há produtos que precisam de remapeamento
      const produtosSemGrupo = produtos.filter(p => p.id_grupo && !p.grupo);
      if (produtosSemGrupo.length > 0) {
        console.log('🔄 [ProdutoPage] Produtos sem grupo mapeado:', produtosSemGrupo.length);
        setProdutos(prevProdutos => 
          prevProdutos.map(produto => {
            const novoGrupo = mapearGrupo(produto.id_grupo, gruposAtivos);
            if (novoGrupo && novoGrupo !== produto.grupo) {
              return { ...produto, grupo: novoGrupo };
            }
            return produto;
          })
        );
      }
    }
  }, [loadingGrupos, gruposAtivos, produtos.length]); // Reage a mudanças nos grupos E nos produtos

  const fetchOperacao = async () => {
    try {
      // Carregar dados do usuário para pegar a operação padrão
      const resUsuario = await axiosInstance.get('/usuarios/me/');

      if (resUsuario.data.parametros) {
        const idOperacaoVenda = resUsuario.data.parametros.id_operacao_venda || resUsuario.data.parametros.id_operacao_padrao;

        if (idOperacaoVenda) {
          const resOperacao = await axiosInstance.get(`/operacoes/${idOperacaoVenda}/`);
          setOperacao(resOperacao.data);
          console.log('✅ Operação carregada:', resOperacao.data);
          console.log('   📦 validar_estoque:', resOperacao.data.validar_estoque);
          console.log('   📦 acao_estoque:', resOperacao.data.acao_estoque);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar operação:', err);
      // Não bloqueia a página se não conseguir carregar a operação
    }
  };

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      setError(''); // Limpar erro anterior

      console.log('🚀 [ResponsivePage] Carregando produtos reais do banco de dados...');
      const response = await axiosInstance.get('/produtos/');
      console.log('✅ [ResponsivePage] Resposta da API produtos:', response);
      console.log('✅ [ResponsivePage] Dados recebidos:', response.data);

      const data = response.data;
      const produtosList = Array.isArray(data) ? data : data.results || [];
      console.log('📊 [ResponsivePage] Total de produtos retornados pela API:', produtosList.length);

      // Mapear campos da API para o formato esperado pela página responsiva
      const produtosMapeados = produtosList.map(produto => {
        // Buscar dados de cada depósito
        const estoqueDepositos = produto.estoque_por_deposito || [];
        const loja = estoqueDepositos.find(d => d.nome_deposito === 'LOJA') || {};
        const deposito = estoqueDepositos.find(d => d.nome_deposito === 'DEPOSITO') || {};

        return {
          id: produto.id_produto || produto.id,
          id_produto: produto.id_produto || produto.id,
          codigo: produto.codigo_produto || produto.codigo,
          codigo_produto: produto.codigo_produto || produto.codigo,
          nome: produto.nome_produto || produto.nome || '',
          categoria: mapearCategoria(produto.categoria),
          // Mapear grupo: prioriza nome se disponível, senão usa id_grupo (será remapeado depois pelo useEffect)
          grupo: mapearGrupo(produto.id_grupo, gruposAtivos) || '',
          id_grupo: produto.id_grupo, // 🏷️ MANTER ID DO GRUPO ORIGINAL (usado para remapeamento posterior)
          marca: mapearMarca(produto.marca),
          ncm: produto.ncm || '',
          cest: produto.cest || '',
          gtin: produto.gtin || '',
          tributacao_info: produto.tributacao_detalhada || {}, // 🏷️ DADOS FISCAIS DO BACKEND
          classificacao: produto.classificacao || '', // 🏷️ ADICIONAR CLASSIFICAÇÃO
          unidade_medida: produto.unidade_medida || 'UN', // Garantir valor padrão
          genero: produto.genero || '',
          imagem_url: localStorage.getItem(`produto_imagem_${produto.codigo_produto || produto.codigo}`) || produto.imagem_url || '',
          preco: parseFloat(produto.valor_venda ?? produto.preco_venda ?? 0),
          estoque: parseFloat(produto.estoque_total ?? produto.estoque ?? 0),
          estoqueMinimo: produto.estoque_minimo || 5,
          descricao: produto.descricao || `Produto ${produto.nome_produto || produto.nome}`,
          status: determinarStatus(produto),
          // Dados por depósito
          loja: {
            preco: parseFloat(loja.valor_venda ?? 0),
            estoque: parseFloat(loja.quantidade_atual ?? loja.quantidade ?? 0),
            estoqueMinimo: parseFloat(loja.quantidade_minima ?? 0)
          },
          deposito: {
            preco: parseFloat(deposito.valor_venda ?? 0),
            estoque: parseFloat(deposito.quantidade_atual ?? deposito.quantidade ?? 0),
            estoqueMinimo: parseFloat(deposito.quantidade_minima ?? 0)
          },
          // Campos de materiais de construção
          metragem_caixa: produto.metragem_caixa || '',
          rendimento_m2: produto.rendimento_m2 || '',
          peso_unitario: produto.peso_unitario || '',
          variacao: produto.variacao || '',
          id_produto_pai: produto.produto_pai || produto.id_produto_pai || '',
          produtos_complementares: produto.produtos_complementares || [],
          produtos_similares: produto.produtos_similares || [],
          controla_lote: produto.controla_lote || false
        };
      });

      console.log('📦 [ResponsivePage] Produtos mapeados:', produtosMapeados);
      console.log('📊 [ResponsivePage] Total de produtos:', produtosMapeados.length);

      if (produtosMapeados.length > 0) {
        console.log('🔍 [ResponsivePage] Primeiro produto:', produtosMapeados[0]);
      }

      setProdutos(produtosMapeados);

      if (produtosMapeados.length === 0) {
        setError('Nenhum produto encontrado no banco de dados. Cadastre alguns produtos primeiro.');
      }

    } catch (error) {
      console.error('❌ [ResponsivePage] Erro ao carregar produtos:', error);
      console.error('❌ [ResponsivePage] Detalhes do erro:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      // não usar dados mock - mostrar erro real
      if (error.response?.status === 401) {
        setError('🔐 não autorizado. Faça login novamente para acessar seus produtos.');
      } else if (error.response?.status === 404) {
        setError('🔍 Endpoint de produtos não encontrado. Verifique se o backend está rodando corretamente.');
      } else {
        setError(`❌ Erro ao carregar produtos: ${error.message}. Verifique se o backend está funcionando e você está logado.`);
      }

      // Limpar produtos em caso de erro
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductGradeClick = () => {
    handleOpenDialog(null);
    setGradeMode(true);
    // Aba Grade = índice 3 (após Dados Básicos, Classificação, Tributação)
    setTimeout(() => setTabValue(3), 100); 
  };

  const handleOpenDialog = (produto = null) => {
    setSelectedProduto(produto);
    setTabValue(0); // Resetar para primeira aba
    
    // Reset grade
    setGradeMode(false);
    setTamanhos([]);
    setCores([]);

    if (produto) {
      // 🔍 VALIDAR ESTOQUE ANTES DE ABRIR (apenas se a operação exigir)
      const deveValidarEstoque = operacao && operacao.validar_estoque && operacao.acao_estoque !== 'nao_validar';
      console.log('🔍 Validação de estoque:', {
        operacao: operacao?.nome_operacao,
        validar_estoque: operacao?.validar_estoque,
        acao_estoque: operacao?.acao_estoque,
        deveValidar: deveValidarEstoque
      });

      if (deveValidarEstoque) {
        const estoque = parseFloat(produto.estoque || 0);
        if (estoque <= 0) {
          console.log('⚠️ Produto sem estoque detectado:', produto.nome);
          setProdutoSemEstoque(produto);
          setOpenEstoqueDialog(true);
          return; // Não abre o dialog de edição
        }
      }

      // Carregar URL da imagem do localStorage se não estiver no produto
      const imagemUrl = produto.imagem_url || localStorage.getItem(`produto_imagem_${produto.codigo_produto}`) || '';
      console.log('🔍 PRODUTO RECEBIDO PARA EDIÇÃO:', produto);
      console.log('🖼️ Imagem carregada:', imagemUrl ? imagemUrl.substring(0, 50) + '...' : 'NENHUMA');
      console.log('  - produto.classificacao:', produto.classificacao);
      console.log('  - produto.grupo:', produto.grupo);
      console.log('  - produto.id_grupo:', produto.id_grupo);
      console.log('  - produto.genero:', produto.genero); // 🏷️ DEBUG GENERO

      // Se grupo está vazio mas tem id_grupo, buscar o nome do grupo
      let nomeGrupo = produto.grupo;
      if ((!nomeGrupo || !nomeGrupo.trim()) && produto.id_grupo) {
        const grupoEncontrado = gruposAtivos.find(g => Number(g.id) === Number(produto.id_grupo));
        if (grupoEncontrado) {
          nomeGrupo = grupoEncontrado.nome;
          console.log('🔍 Grupo encontrado pelo id_grupo:', nomeGrupo);
        }
      }

      setFormData({
        ...produto,
        grupo: nomeGrupo || '', // Usar nome do grupo encontrado
        unidade_medida: produto.unidade_medida || 'UN', // Garantir valor padrão
        imagem_url: imagemUrl,
        classificacao: produto.classificacao || '', // Garantir que classificacao seja copiada
        genero: produto.genero || '', // 🏷️ Garantir que genero seja copiado
        produtos_complementares: produto.produtos_complementares || [],
        produtos_similares: produto.produtos_similares || [],
        controla_lote: produto.controla_lote || false
      });

      console.log('✅ FormData configurado com classificacao:', produto.classificacao);
      console.log('✅ FormData configurado com grupo:', nomeGrupo);
      console.log('✅ FormData configurado com genero:', produto.genero);
    } else {
      setFormData({
        nome: '',
        categoria: '',
        grupo: '',
        marca: '',
        classificacao: '',
        genero: '', // 🏷️ Reset genero
        codigo_produto: '',
        unidade_medida: 'UN',
        ncm: '',
        cest: '',
        gtin: '',
        tributacao_info: {}, // Resetar tributacao
        imagem_url: '',
        descricao: '',
        metragem_caixa: '',
        rendimento_m2: '',
        peso_unitario: '',
        variacao: '',
        id_produto_pai: '',
        produtos_complementares: [],
        produtos_similares: [],
        controla_lote: false
      });
    }
    setOpenDialog(true);
    // Carregar dados fiscais do produto
    const defaultTrib = {
      cfop: '5102', cst_icms: '', csosn: '400', icms_aliquota: '0',
      cst_ipi: '99', ipi_aliquota: '0', cst_ipi_sn: '99', ipi_aliquota_sn: '0',
      cst_pis_cofins: '01', pis_aliquota: '0', cst_pis_sn: '07', pis_aliquota_sn: '0',
      cofins_aliquota: '0', cst_cofins_sn: '07', cofins_aliquota_sn: '0',
      cst_ibs_cbs: '000', ibs_aliquota: '0',
      cbs_aliquota: '0', imposto_seletivo_aliquota: '0',
      classificacao_fiscal: '', fonte_info: '',
    };
    const pidFiscal = produto?.id_produto || produto?.id;
    if (pidFiscal) {
      axiosInstance.get(`/produtos/${pidFiscal}/tributacao/`)
        .then(res => {
          // Normalizar CSTs de 3 dígitos ('000') para 2 dígitos ('00') usados nos Selects
          const normCst = v => (v === '000' ? '00' : v || '');
          const d = res.data;
          setTributacaoData({ ...defaultTrib, ...d,
            cst_icms: normCst(d.cst_icms),
            cst_pis_cofins: d.cst_pis_cofins === '000' ? '01' : (d.cst_pis_cofins || '01'),
            cst_ipi:  d.cst_ipi  === '000' ? '99' : (d.cst_ipi  || '99'),
          });
        })
        .catch(() => setTributacaoData(defaultTrib));
    } else {
      // Novo produto: pré-preencher com Sugestão de Tributação Padrão do configProduto
      if (configProduto && (
        configProduto.trib_cfop || configProduto.trib_cst_icms || configProduto.trib_csosn ||
        configProduto.trib_cst_ipi || configProduto.trib_cst_pis_cofins
      )) {
        const sugestao = {
          ...defaultTrib,
          cfop: configProduto.trib_cfop || defaultTrib.cfop,
          cst_icms: configProduto.trib_cst_icms || defaultTrib.cst_icms,
          csosn: configProduto.trib_csosn || defaultTrib.csosn,
          icms_aliquota: configProduto.trib_icms_aliquota ?? defaultTrib.icms_aliquota,
          cst_ipi: configProduto.trib_cst_ipi || defaultTrib.cst_ipi,
          ipi_aliquota: configProduto.trib_ipi_aliquota ?? defaultTrib.ipi_aliquota,
          cst_pis_cofins: configProduto.trib_cst_pis_cofins || defaultTrib.cst_pis_cofins,
          pis_aliquota: configProduto.trib_pis_aliquota ?? defaultTrib.pis_aliquota,
          cofins_aliquota: configProduto.trib_cofins_aliquota ?? defaultTrib.cofins_aliquota,
          classificacao_fiscal: configProduto.trib_classificacao_fiscal || defaultTrib.classificacao_fiscal,
          _sugerido_config: true,
        };
        setTributacaoData(sugestao);
        console.log('💡 Tributação padrão aplicada do configProduto:', sugestao);
      } else {
        setTributacaoData(defaultTrib);
      }
    }
    setTributacaoSubTab(0);
    setPerfilTribProd('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduto(null);
    setFormData({
      nome: '',
      categoria: '',
      grupo: '',
      marca: '',
      classificacao: '',
      codigo_produto: '',
      unidade_medida: 'UN',
      ncm: '',
      gtin: '',
      imagem_url: '',
      descricao: '',
      metragem_caixa: '',
      rendimento_m2: '',
      peso_unitario: '',
      variacao: '',
      id_produto_pai: ''
    });
  };

  const handleCloseEstoqueDialog = () => {
    setOpenEstoqueDialog(false);
    setProdutoSemEstoque(null);
  };

  const handleEditarProdutoSemEstoque = () => {
    // Fechar dialog de aviso e abrir dialog de edição
    setOpenEstoqueDialog(false);
    if (produtoSemEstoque) {
      const imagemUrl = produtoSemEstoque.imagem_url || localStorage.getItem(`produto_imagem_${produtoSemEstoque.codigo_produto}`) || '';

      let nomeGrupo = produtoSemEstoque.grupo;
      if ((!nomeGrupo || !nomeGrupo.trim()) && produtoSemEstoque.id_grupo) {
        const grupoEncontrado = gruposAtivos.find(g => Number(g.id) === Number(produtoSemEstoque.id_grupo));
        if (grupoEncontrado) {
          nomeGrupo = grupoEncontrado.nome;
        }
      }

      setFormData({
        ...produtoSemEstoque,
        grupo: nomeGrupo || '',
        unidade_medida: produtoSemEstoque.unidade_medida || 'UN',
        imagem_url: imagemUrl,
        classificacao: produtoSemEstoque.classificacao || ''
      });

      setSelectedProduto(produtoSemEstoque);
      setOpenDialog(true);
    }
    setProdutoSemEstoque(null);
  };

  const handleSave = async () => {
    console.log('💾 HANDLESAVE INICIADO');
    console.log('📋 FormData COMPLETO no início do save:', JSON.stringify(formData, null, 2));
    console.log('🏷️ formData.classificacao especificamente:', formData.classificacao);

    // Validações básicas
    if (!formData.nome.trim()) {
      alert('Nome do produto é obrigatório');
      return;
    }
    if (!formData.grupo) {
      alert('Grupo é obrigatório');
      return;
    }

    // Mapear dados do formulário para formato da API
    let produtoData = {
      nome_produto: String(formData.nome || '').trim(),
      codigo_produto: String(formData.codigo_produto || '').trim() || `AUTO-${Date.now()}`
    };

    // Validação adicional de dados obrigatórios
    if (!produtoData.nome_produto) {
      alert('❌ Nome do produto é obrigatório');
      return;
    }
    if (!produtoData.codigo_produto) {
      alert('❌ Código do produto é obrigatório');
      return;
    }

    // Campos opcionais - só incluir se tiverem valor válido
    if (formData.categoria && String(formData.categoria).trim()) {
      produtoData.categoria = String(formData.categoria).trim();
    }

    // Prioridade: se já tem id_grupo no formData (produto editado), usar ele
    if (formData.id_grupo && Number(formData.id_grupo) > 0) {
      console.log('✅ id_grupo já existe no formData:', formData.id_grupo);
      produtoData.id_grupo = Number(formData.id_grupo);
    } else if (formData.grupo && gruposAtivos.find(g => g.nome === formData.grupo)) {
      const grupo = gruposAtivos.find(g => g.nome === formData.grupo);
      console.log('🔍 Grupo selecionado:', formData.grupo);
      console.log('🔍 Grupo encontrado:', grupo);
      console.log('🔍 Todos os grupos disponíveis:', gruposAtivos);

      // Validação: só adicionar se ID existe e é válido
      if (grupo && grupo.id && Number(grupo.id) > 0 && !isNaN(Number(grupo.id))) {
        console.log('✅ ID do grupo válido, adicionando:', Number(grupo.id));
        produtoData.id_grupo = Number(grupo.id);
      } else {
        console.log('⚠️ Grupo encontrado mas ID inválido, criando produto sem grupo');
        console.log('⚠️ Detalhes do grupo:', grupo);
      }
    } else if (formData.grupo) {
      console.log('⚠️ Grupo não encontrado nos grupos ativos:', formData.grupo);
      console.log('⚠️ Criando produto sem grupo para evitar erro');
    }

    if (formData.marca && String(formData.marca).trim()) {
      produtoData.marca = String(formData.marca).trim();
    }

    if (formData.unidade_medida && String(formData.unidade_medida).trim()) {
      produtoData.unidade_medida = String(formData.unidade_medida).trim();
    }

    produtoData.genero = formData.genero || null;

    if (formData.descricao && String(formData.descricao).trim()) {
      produtoData.descricao = String(formData.descricao).trim();
    }

    if (formData.ncm && String(formData.ncm).trim()) {
      produtoData.ncm = String(formData.ncm).trim();
    }

    if (formData.gtin && String(formData.gtin).trim()) {
      produtoData.gtin = String(formData.gtin).trim();
    }

      // 🏷️ SERIALIZAR TRIBUTAÇÃO
      if (formData.tributacao_info) {
        try {
          produtoData.tributacao_info = JSON.stringify(formData.tributacao_info);
        } catch (e) {
          console.error('❌ Erro ao serializar tributacao_info:', e);
        }
      }
      if (formData.imagem_url && String(formData.imagem_url).trim()) {
        produtoData.imagem_url = String(formData.imagem_url).trim();
        console.log('🖼️ URL da imagem mapeada (apenas para preview local):', produtoData.imagem_url);
      }

    console.log('🔍 CLASSIFICAÇÃO DEBUG:');
    console.log('  - formData.classificacao:', formData.classificacao);
    console.log('  - Tipo:', typeof formData.classificacao);
    console.log('  - Tem valor?', !!formData.classificacao);
    console.log('  - Após trim:', formData.classificacao ? String(formData.classificacao).trim() : 'vazio');

    if (formData.classificacao && String(formData.classificacao).trim()) {
      produtoData.classificacao = String(formData.classificacao).trim();
      console.log('✅ Classificação mapeada para produtoData:', produtoData.classificacao);
    } else {
      console.log('⚠️ Classificação NÃO foi mapeada (campo vazio ou null)');
    }

    // Criar payload limpo apenas com campos obrigatórios + campos opcionais válidos
    let payloadLimpo = {
      nome_produto: produtoData.nome_produto,
      codigo_produto: produtoData.codigo_produto,
      valor_custo: produtoData.valor_custo
    };

    // --- LÓGICA DE GRADE (Novo) ---
    if (gradeMode && !selectedProduto && (tamanhos.length > 0 || cores.length > 0)) {
        payloadLimpo.variacoes = [];
        if (tamanhos.length > 0 && cores.length > 0) {
            tamanhos.forEach(t => {
                cores.forEach(c => {
                    payloadLimpo.variacoes.push({ tamanho: t, cor: c });
                });
            });
        } else if (tamanhos.length > 0) {
             tamanhos.forEach(t => payloadLimpo.variacoes.push({ tamanho: t, cor: null }));
        } else if (cores.length > 0) {
             cores.forEach(c => payloadLimpo.variacoes.push({ tamanho: null, cor: c }));
        }
        console.log('📦 Incluindo variações de grade:', payloadLimpo.variacoes);
    }

    // Adicionar campos opcionais apenas se existirem e forem válidos
    if (produtoData.categoria) {
      payloadLimpo.categoria = produtoData.categoria;
    }
    if (produtoData.marca) {
      payloadLimpo.marca = produtoData.marca;
    }
    if (produtoData.unidade_medida) {
      payloadLimpo.unidade_medida = produtoData.unidade_medida;
    }
    if (produtoData.ncm) {
      payloadLimpo.ncm = produtoData.ncm;
    }
    if (produtoData.gtin) {
      payloadLimpo.gtin = produtoData.gtin;
    }
    if (produtoData.descricao) {
      payloadLimpo.descricao = produtoData.descricao;
    }
    // NOTA: Backend agora suporta imagem_url (campo TEXT no banco de dados)
    if (produtoData.imagem_url) {
      payloadLimpo.imagem_url = produtoData.imagem_url;
      console.log('🖼️ Adicionando imagem_url ao payload:', produtoData.imagem_url);
    }
    if (produtoData.id_grupo) {
      payloadLimpo.id_grupo = produtoData.id_grupo;
      console.log('🏷️ Adicionando id_grupo ao payload:', produtoData.id_grupo);
    }
    if (produtoData.classificacao) {
      payloadLimpo.classificacao = produtoData.classificacao;
      console.log('🏷️ Adicionando classificacao ao payload:', produtoData.classificacao);
    }
    // genero: enviar sempre (pode ser null para limpar)
    payloadLimpo.genero = produtoData.genero || null;

    // Campos de materiais de construção
    console.log('🔍 DEBUG - formData.id_produto_pai:', formData.id_produto_pai, 'tipo:', typeof formData.id_produto_pai);
    if (formData.metragem_caixa) payloadLimpo.metragem_caixa = formData.metragem_caixa;
    if (formData.rendimento_m2) payloadLimpo.rendimento_m2 = formData.rendimento_m2;
    if (formData.peso_unitario) payloadLimpo.peso_unitario = formData.peso_unitario;
    if (formData.variacao) payloadLimpo.variacao = formData.variacao;
    payloadLimpo.controla_lote = formData.controla_lote || false;
    if (formData.id_produto_pai) {
      payloadLimpo.produto_pai = formData.id_produto_pai; // DRF espera nome do campo ForeignKey
      console.log('✅ Adicionando produto_pai ao payload:', formData.id_produto_pai);
    } else {
      payloadLimpo.produto_pai = null;
      console.log('⚠️ formData.id_produto_pai está vazio, enviando null');
    }
    // Produtos complementares (M2M)
    if (formData.produtos_complementares && formData.produtos_complementares.length > 0) {
      payloadLimpo.produtos_complementares = formData.produtos_complementares.map((p, idx) => ({
        id_produto: p.id_produto,
        ordem: idx
      }));
      console.log('✅ Adicionando produtos_complementares ao payload:', payloadLimpo.produtos_complementares);
    } else {
      payloadLimpo.produtos_complementares = [];
    }
    // Produtos similares (M2M)
    if (formData.produtos_similares && formData.produtos_similares.length > 0) {
      payloadLimpo.produtos_similares = formData.produtos_similares.map((p, idx) => ({
        id_produto: p.id_produto,
        ordem: idx
      }));
    } else {
      payloadLimpo.produtos_similares = [];
    }

      // tributacao_info NÃO vai no payload do produto (é enviada separadamente via PATCH /tributacao/)
      // if (produtoData.tributacao_info) { payloadLimpo.tributacao_info = ... }

    try {
      console.log('🔄 Salvando produto na API...', produtoData);
      console.log('📊 FormData original:', formData);
      console.log('🎯 formData.id_produto_pai no momento do save:', formData.id_produto_pai);

      // Validação adicional: se id_grupo está presente, verificar se é válido
      if (payloadLimpo.id_grupo) {
        console.log('🔍 Validando id_grupo antes de enviar:', payloadLimpo.id_grupo);
        console.log('🔍 Grupos disponíveis:', gruposAtivos.map(g => `ID: ${g.id}, Nome: ${g.nome}`));

        // Verificar se o grupo existe nos grupos ativos
        const grupoValido = gruposAtivos.find(g => Number(g.id) === Number(payloadLimpo.id_grupo) && g.ativo !== false);
        console.log('🔍 Grupo válido encontrado:', grupoValido);

        if (!grupoValido) {
          console.log('⚠️ id_grupo não encontrado nos grupos válidos, removendo do payload');
          console.log('⚠️ ID procurado:', payloadLimpo.id_grupo);
          console.log('⚠️ IDs disponíveis:', gruposAtivos.map(g => g.id));
          delete payloadLimpo.id_grupo;
        } else {
          console.log('✅ Grupo válido confirmado, mantendo id_grupo:', payloadLimpo.id_grupo);
        }
      }

      console.log('📦 Payload final sendo enviado:', payloadLimpo);

      let response;
      if (selectedProduto) {
        // Editar produto existente — usar id_produto (PK real) ou id como fallback
        const editId = selectedProduto.id_produto || selectedProduto.id;
        console.log('✏️ Editando produto ID:', editId);
        response = await axiosInstance.put(`/produtos/${editId}/`, payloadLimpo);
        console.log('✅ Produto editado:', response.data);
      } else {
        // Criar novo produto
        console.log('➕ Criando novo produto');
        response = await axiosInstance.post('/produtos/', payloadLimpo);
        console.log('✅ Produto criado:', response.data);
      }

      // Recarregar lista de produtos após salvar
      await fetchProdutos();

      // SOLUÇéO DEFINITIVA: Armazenar URL da imagem localmente com código único
      if (formData.imagem_url && (response.data.codigo_produto || selectedProduto?.codigo_produto)) {
        const codigoProduto = response.data.codigo_produto || selectedProduto.codigo_produto;
        localStorage.setItem(`produto_imagem_${codigoProduto}`, formData.imagem_url);
        console.log('🖼️ URL da imagem salva definitivamente para:', codigoProduto, '=', formData.imagem_url);
      }

      // Pegar o ID do produto salvo — id_produto é a PK real no backend
      const productId = response.data.id_produto || response.data.id ||
                        selectedProduto?.id_produto || selectedProduto?.id;
      console.log('✅ Produto salvo com ID:', productId);

      // Salvar dados fiscais (TributacaoProduto)
      if (productId) {
        try {
          await axiosInstance.patch(`/produtos/${productId}/tributacao/`, {
            cfop: tributacaoData.cfop,
            cst_icms: tributacaoData.cst_icms,
            csosn: tributacaoData.csosn,
            icms_aliquota: tributacaoData.icms_aliquota,
            // IPI
            cst_ipi: tributacaoData.cst_ipi,
            ipi_aliquota: tributacaoData.ipi_aliquota,
            cst_ipi_sn: tributacaoData.cst_ipi_sn,
            ipi_aliquota_sn: tributacaoData.ipi_aliquota_sn,
            // PIS
            cst_pis_cofins: tributacaoData.cst_pis_cofins,
            pis_aliquota: tributacaoData.pis_aliquota,
            cst_pis_sn: tributacaoData.cst_pis_sn,
            pis_aliquota_sn: tributacaoData.pis_aliquota_sn,
            // COFINS
            cofins_aliquota: tributacaoData.cofins_aliquota,
            cst_cofins_sn: tributacaoData.cst_cofins_sn,
            cofins_aliquota_sn: tributacaoData.cofins_aliquota_sn,
            // IBS/CBS
            cst_ibs_cbs: tributacaoData.cst_ibs_cbs,
            ibs_aliquota: tributacaoData.ibs_aliquota,
            cbs_aliquota: tributacaoData.cbs_aliquota,
            imposto_seletivo_aliquota: tributacaoData.imposto_seletivo_aliquota,
            classificacao_fiscal: tributacaoData.classificacao_fiscal,
            fonte_info: tributacaoData.fonte_info,
          });
          console.log('✅ Tributação salva com sucesso para produto:', productId);
        } catch (fiscalErr) {
          console.error('❌ Erro ao salvar tributação:', fiscalErr);
          alert(`⚠️ Produto salvo, mas houve erro ao salvar a tributação:\n${fiscalErr.response?.data ? JSON.stringify(fiscalErr.response.data) : fiscalErr.message}`);
        }
      } else {
        console.warn('⚠️ productId não encontrado, tributação não foi salva');
      }

      // Fechar dialog do produto
      handleCloseDialog();

      // Abrir dialog de configuração de depósitos
      if (productId) {
        console.log('🏢 Abrindo configuração de depósitos...');
        await handleOpenDepotDialog(productId);
      } else {
        alert(selectedProduto ? 'Produto editado com sucesso!' : 'Produto criado com sucesso!');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });

      // Log adicional para erro 400
      if (error.response?.status === 400) {
        console.error('🔍 Payload que causou erro 400:', payloadLimpo || produtoData);
        console.error('🔍 Resposta completa da API:', error.response);
        console.error('🔍 Detalhes específicos do erro:', error.response?.data);
        console.error('🔍 Status da resposta:', error.response?.status);
        console.error('🔍 Headers da resposta:', error.response?.headers);
      }

      if (error.response?.status === 401) {
        alert('🔐 não autorizado. Faça login novamente.');
      } else if (error.response?.status === 400) {
        const errorDetails = error.response?.data;
        let errorMessage = '❌ Dados inválidos:\n';

        if (typeof errorDetails === 'object') {
          Object.keys(errorDetails).forEach(key => {
            errorMessage += `\n• ${key}: ${errorDetails[key]}`;
          });
        } else {
          errorMessage += errorDetails || error.message;
        }

        alert(errorMessage);
      } else {
        alert(`❌ Erro ao salvar produto: ${error.message}`);
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      console.log('🔍 Verificando se pode deletar produto ID:', id);

      // 1. Buscar dados completos do produto com estoque
      const produtoResponse = await axiosInstance.get(`/produtos/${id}/`);
      const produto = produtoResponse.data;

      console.log('📦 Produto encontrado:', produto);
      console.log('📊 Estoque total:', produto.estoque_total);

      // 2. VALIDAÇÃO: Não permitir exclusão se tiver estoque
      if (produto.estoque_total && produto.estoque_total > 0) {
        alert('❌ Não é possível excluir este produto!\n\n' +
          `O produto possui ${produto.estoque_total} unidade(s) em estoque.\n\n` +
          'Primeiro você precisa zerar o estoque antes de excluir o produto.');
        return;
      }

      // 3. VALIDAÇÃO: Verificar movimentações em vendas
      try {
        const vendasResponse = await axiosInstance.get(`/vendas/?produto=${id}`);
        if (vendasResponse.data && vendasResponse.data.length > 0) {
          alert('❌ Não é possível excluir este produto!\n\n' +
            'O produto possui movimentações em VENDAS.\n\n' +
            'Produtos com histórico de vendas não podem ser excluídos.');
          return;
        }
      } catch (error) {
        console.log('⚠️ Erro ao verificar vendas (pode ser que o endpoint não exista):', error.message);
      }

      // 4. VALIDAÇÃO: Verificar movimentações em ordens de serviço
      try {
        const osResponse = await axiosInstance.get(`/ordem-servico/?produto=${id}`);
        if (osResponse.data && osResponse.data.length > 0) {
          alert('❌ Não é possível excluir este produto!\n\n' +
            'O produto possui movimentações em ORDENS DE SERVIÇO.\n\n' +
            'Produtos com histórico não podem ser excluídos.');
          return;
        }
      } catch (error) {
        console.log('⚠️ Erro ao verificar ordens de serviço:', error.message);
      }

      // 5. VALIDAÇÃO: Verificar movimentações em compras
      try {
        const comprasResponse = await axiosInstance.get(`/compras/?produto=${id}`);
        if (comprasResponse.data && comprasResponse.data.length > 0) {
          alert('❌ Não é possível excluir este produto!\n\n' +
            'O produto possui movimentações em COMPRAS.\n\n' +
            'Produtos com histórico de compras não podem ser excluídos.');
          return;
        }
      } catch (error) {
        console.log('⚠️ Erro ao verificar compras:', error.message);
      }

      // 6. Se passou por todas as validações, confirmar exclusão
      if (!confirm('⚠️ Tem certeza que deseja deletar este produto?\n\n' +
        'Esta ação não pode ser desfeita!')) {
        return;
      }

      console.log('🗑️ Deletando produto ID:', id);
      await axiosInstance.delete(`/produtos/${id}/`);
      console.log('✅ Produto deletado com sucesso');

      // Recarregar lista de produtos após deletar
      await fetchProdutos();

      alert('✅ Produto deletado com sucesso!');

    } catch (error) {
      console.error('❌ Erro ao deletar produto:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      if (error.response?.status === 401) {
        alert('🔐 Não autorizado. Faça login novamente.');
      } else if (error.response?.status === 404) {
        alert('❌ Produto não encontrado.');
      } else if (error.response?.status === 400 && error.response?.data?.detail) {
        alert(`❌ ${error.response.data.detail}`);
      } else {
        alert(`❌ Erro ao deletar produto: ${error.message}`);
      }
    }
  };

  const handleOpenGrupoDialog = () => {
    setNovoGrupo({ nome: '', descricao: '' });
    setOpenGrupoDialog(true);
  };

  const handleCloseGrupoDialog = () => {
    setOpenGrupoDialog(false);
    setNovoGrupo({ nome: '', descricao: '' });
  };

  const handleSaveGrupo = async () => {
    try {
      if (!novoGrupo.nome.trim()) {
        alert('Nome do grupo é obrigatório');
        return;
      }

      await adicionarGrupo(novoGrupo);
      handleCloseGrupoDialog();
      alert('Grupo adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar grupo:', error);
      alert('Erro ao adicionar grupo');
    }
  };

  const handleOpenDepotDialog = async (productId) => {
    try {
      console.log('📦 Abrindo configuração de depósitos para produto:', productId);

      // Abrir dialog imediatamente com loading
      setSavedProductId(productId);
      setOpenDepotDialog(true);
      setDepotValues([]);

      // função para tentar buscar dados de estoque
      const tentarBuscarEstoque = async (tentativa = 1, maxTentativas = 5) => {
        console.log(`📡 Tentativa ${tentativa}/${maxTentativas} de buscar dados de estoque...`);

        try {
          const response = await axiosInstance.get(`/produtos/${productId}/`);
          const produto = response.data;

          console.log('📦 Resposta COMPLETA da API:', JSON.stringify(produto, null, 2));
          console.log('📦 estoque_por_deposito:', produto.estoque_por_deposito);

          const estoqueData = produto.estoque_por_deposito || [];

          if (estoqueData && estoqueData.length > 0) {
            console.log('✅ Depósitos encontrados:', estoqueData.length);
            console.log('📋 Dados dos depósitos recebidos da API (JSON):', JSON.stringify(estoqueData, null, 2));

            // Log detalhado de cada depósito recebido
            estoqueData.forEach((dep, idx) => {
              console.log(`  Depósito ${idx + 1}:`, {
                id_estoque: dep.id_estoque,
                nome: dep.nome_deposito,
                quantidade: dep.quantidade,
                valor_venda: dep.valor_venda,
                valor_ultima_compra: dep.valor_ultima_compra
              });
            });

            setDepotValues(estoqueData.map(dep => ({
              id_estoque: dep.id_estoque ?? null,
              id_deposito: dep.id_deposito,
              nome_deposito: dep.nome_deposito,
              quantidade: dep.quantidade ?? 0,
              quantidade_minima: dep.quantidade_minima ?? 0,
              valor_venda: dep.valor_venda ?? 0,
              // suportar ambos nomes: valor_ultima_compra (backend) ou valor_custo (legado)
              valor_custo: dep.valor_ultima_compra ?? dep.valor_custo ?? 0
            })));

            return true; // Sucesso
          } else {
            console.warn(`⚠️ Tentativa ${tentativa}: Estoque ainda não disponível`);

            // Se ainda não é a última tentativa, aguardar e tentar novamente
            if (tentativa < maxTentativas) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              return await tentarBuscarEstoque(tentativa + 1, maxTentativas);
            } else {
              console.error('❌ Máximo de tentativas atingido. Estoque não encontrado.');
              setDepotValues([]);
              return false; // Falhou
            }
          }
        } catch (error) {
          console.error(`❌ Erro na tentativa ${tentativa}:`, error);

          if (tentativa < maxTentativas) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await tentarBuscarEstoque(tentativa + 1, maxTentativas);
          } else {
            throw error;
          }
        }
      };

      // Aguardar 800ms inicialmente para dar tempo ao signal criar os registros
      await new Promise(resolve => setTimeout(resolve, 800));

      // Iniciar tentativas de busca
      await tentarBuscarEstoque();

    } catch (err) {
      console.error('❌ Erro ao carregar dados de depósito:', err);
      console.error('❌ Detalhes:', err.response?.data);
      alert('Erro ao carregar dados de depósito. Verifique o console para mais detalhes.');
    }
  };

  const handleCloseDepotDialog = () => {
    setOpenDepotDialog(false);
    setSavedProductId(null);
    setDepotValues([]);
  };

  const handleSaveDepotConfig = async () => {
    try {
      console.log('💾 Salvando configurações de depósito:', depotValues);
      console.log('📊 Detalhes de cada depósito:');
      depotValues.forEach((dep, idx) => {
        console.log(`  Depósito ${idx + 1} (${dep.nome_deposito}):`, {
          id_estoque: dep.id_estoque,
          quantidade_minima: dep.quantidade_minima,
          valor_venda: dep.valor_venda,
          valor_custo: dep.valor_custo
        });
      });

      // Atualizar ou criar cada depósito via API
      for (const depot of depotValues) {
        const updateData = {
          quantidade_minima: parseFloat(depot.quantidade_minima) || 0,
          valor_venda: parseFloat(depot.valor_venda) || 0,
          valor_ultima_compra: parseFloat(depot.valor_custo) || 0
        };

        try {
          if (depot.id_estoque) {
            // ✅ JÁ EXISTE (id_estoque vem do carregamento inicial) - Fazer PATCH
            console.log(`🔄 Registro de estoque JÁ EXISTE (ID ${depot.id_estoque}), fazendo PATCH...`);
            const response = await axiosInstance.patch(`/estoque/${depot.id_estoque}/`, updateData);
            console.log(`✅ Estoque atualizado para ${depot.nome_deposito}:`, response.data);
          } else {
            // ✨ NÃO EXISTE - Fazer POST (não envia quantidade para não zerar o estoque)
            const createData = {
              id_produto: savedProductId,
              id_deposito: depot.id_deposito,
              ...updateData
            };
            console.log(`✨ Criando novo estoque para ${depot.nome_deposito}:`, createData);
            const response = await axiosInstance.post(`/estoque/`, createData);
            console.log(`✅ Estoque criado para ${depot.nome_deposito}:`, response.data);
          }
        } catch (depotError) {
          console.error(`❌ Erro ao processar ${depot.nome_deposito}:`, depotError);
          console.error(`❌ Detalhes:`, depotError.response?.data);
          throw depotError;
        }
      }

      console.log('✅ Configurações salvas com sucesso!');
      alert('Configurações de depósito salvas com sucesso!');

      // Recarregar produtos e fechar dialog
      await fetchProdutos();
      handleCloseDepotDialog();

    } catch (err) {
      console.error('❌ Erro ao salvar configurações:', err);
      console.error('❌ Detalhes do erro:', err.response?.data);
      alert('Erro ao salvar configurações de depósito. Verifique o console.');
    }
  };

  const handleDepotValueChange = (index, field, value) => {
    setDepotValues(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const buscarImagensGoogle = async () => {
    if (!formData.nome.trim()) {
      alert('Digite o nome do produto primeiro');
      return;
    }

    // Criar URL de busca do Google Imagens
    const termoBusca = formData.nome.trim();
    const googleImageSearchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(termoBusca)}`;

    // Abrir nova aba com a busca do Google Imagens
    window.open(googleImageSearchUrl, '_blank');
  };

  const filteredProdutos = produtos.filter(produto => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      (produto.nome || '').toLowerCase().includes(term) ||
      (produto.codigo_produto || '').toLowerCase().includes(term) ||
      (produto.categoria || '').toLowerCase().includes(term) ||
      (produto.grupo || '').toLowerCase().includes(term) ||
      (produto.marca || '').toLowerCase().includes(term) ||
      (produto.ncm || '').includes(searchTerm) ||
      (produto.descricao || '').toLowerCase().includes(term);
    const matchesCategory = categoryFilter === '' || produto.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Em Estoque': return 'success';
      case 'Estoque Baixo': return 'warning';
      case 'Sem Estoque': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Em Estoque': return <InventoryIcon />;
      case 'Estoque Baixo': return <WarningIcon />;
      case 'Sem Estoque': return <WarningIcon />;
      default: return <InventoryIcon />;
    }
  };

  const ProdutoCard = ({ produto }) => (
    <Card
      sx={{
        mb: 2,
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          boxShadow: theme.shadows[4],
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          {produto.imagem_url ? (
            <Avatar
              src={produto.imagem_url}
              sx={{
                mr: 2,
                width: { xs: 50, sm: 60 },
                height: { xs: 50, sm: 60 },
                bgcolor: theme.palette.grey[200]
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              mr: 2,
              width: { xs: 50, sm: 60 },
              height: { xs: 50, sm: 60 },
              display: produto.imagem_url ? 'none' : 'flex'
            }}
          >
            {getStatusIcon(produto.status)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="caption"
              color="primary"
              sx={{ fontFamily: 'monospace', fontWeight: 'bold', display: 'block', mb: 0.5 }}
            >
              Código: {produto.codigo_produto || 'Sem código'}
            </Typography>
            <Typography
              variant={isSmallScreen ? "subtitle1" : "h6"}
              sx={{ fontWeight: 'bold', mb: 1 }}
            >
              {produto.nome}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                label={produto.status}
                color={getStatusColor(produto.status)}
                size={isSmallScreen ? "small" : "medium"}
              />
              {produto.categoria && (
              <Chip
                label={produto.categoria}
                variant="outlined"
                size={isSmallScreen ? "small" : "medium"}
              />
              )}
              {produto.marca && produto.marca !== 'OUTROS' && (
              <Chip
                label={produto.marca}
                variant="outlined"
                color="primary"
                size={isSmallScreen ? "small" : "medium"}
              />
              )}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              Grupo: {produto.grupo} • NCM: {produto.ncm}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size={isSmallScreen ? "small" : "medium"}
              onClick={() => handleOpenDialog(produto)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size={isSmallScreen ? "small" : "medium"}
              onClick={() => handleDelete(produto.id_produto)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography
              variant={isSmallScreen ? "body2" : "body1"}
              color="text.secondary"
            >
              Preço
            </Typography>
            <Typography
              variant={isSmallScreen ? "body1" : "h6"}
              sx={{ fontWeight: 'bold', color: theme.palette.success.main }}
            >
              R$ {produto.preco.toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography
              variant={isSmallScreen ? "body2" : "body1"}
              color="text.secondary"
            >
              Estoque
            </Typography>
            <Typography
              variant={isSmallScreen ? "body1" : "h6"}
              sx={{
                fontWeight: 'bold',
                color: produto.estoque <= produto.estoqueMinimo ?
                  theme.palette.error.main :
                  theme.palette.text.primary
              }}
            >
              {produto.estoque} un.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography
              variant={isSmallScreen ? "body2" : "body1"}
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {produto.descricao}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Estatísticas
  const totalProdutos = produtos.length;
  const emEstoque = produtos.filter(p => p.status === 'Em Estoque').length;
  const estoqueBaixo = produtos.filter(p => p.status === 'Estoque Baixo').length;
  const semEstoque = produtos.filter(p => p.status === 'Sem Estoque').length;
  const valorTotalEstoque = produtos.reduce((total, p) => total + (p.preco * p.estoque), 0);


  const handleSuggestNCM = async () => {
    if (!formData.nome) {
        alert("Preencha o nome do produto primeiro.");
        return;
    }
    
    setLoading(true);
    try {
        const res = await axiosInstance.post('/produtos/suggest_ncm/', { nome: formData.nome });
        if (res.data.found) {
            const { ncm, info } = res.data;

            // Garantia extra no frontend: aceitar apenas NCMs com 8 dígitos
            if (!ncm || String(ncm).replace('.','').trim().length !== 8) {
                alert("O servidor retornou um NCM inválido (diferente de 8 dígitos). Nenhuma alteração feita.");
                return;
            }

            let tributacao_info_new = { ...(formData.tributacao_info || {}) };
            if (info) {
                 if (info.ibs) tributacao_info_new.IBS_ALIQ = info.ibs;
                 if (info.cbs) tributacao_info_new.CBS_ALIQ = info.cbs;
            }
            
            setFormData(prev => ({
                ...prev,
                ncm: ncm,
                classificacao: info?.classificacao || prev.classificacao,
                tributacao_info: tributacao_info_new
            }));
            
            alert(`NCM Encontrado: ${ncm}\nDescrição: ${info?.descricao_ncm || 'N/A'}\nClassificação: ${info?.classificacao || 'N/A'}`);
        } else {
            alert("Nenhum NCM com 8 dígitos encontrado para este nome.\nTente ser mais específico ou preencha o NCM manualmente.");
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao buscar NCM. Verifique se o servidor está online.");
    } finally {
        setLoading(false);
    }
  };

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      // FIX: usar p.id pois o objeto mapeado em fetchProdutos usa 'id' e não 'id_produto'
      const ids = produtos.map(p => p.id).filter(id => id);
      console.log("Auditing IDs:", ids);
      
      if (ids.length === 0) {
          alert("Nenhum produto com ID válido encontrado na tela para auditar.");
          setLoading(false);
          return;
      }

      const res = await axiosInstance.post('/produtos/audit_ncms_internal/', { ids });
      console.log("Audit Result:", res.data);
      setAuditResults(res.data);
      
      if (res.data.length === 0) {
          alert("A auditoria retornou 0 resultados. Verifique se o banco de NCMs (ncm_local.db) está disponível no servidor.");
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || "Erro desconhecido";
      alert("Erro ao auditar: " + msg);
    } finally {
      setLoading(false);
    }
  };

  
  const handleAutoFixAll = async () => {
      // Apenas NCMs com exatamente 8 dígitos são aplicados automaticamente
      const fixable = auditResults
        .filter(r => r.sugestao && String(r.sugestao).replace('.','').trim().length === 8 && r.status !== 'VALID')
        .map(r => ({
          id: r.id,
          ncm: r.sugestao,
          classificacao: r.info?.classificacao,
          ibs: r.info?.ibs,
          cbs: r.info?.cbs
        }));
      
      if (fixable.length === 0) {
          alert("Nenhuma sugestão com NCM de 8 dígitos disponível para aplicar.");
          return;
      }
      
      if (window.confirm(`Deseja aplicar correção automática para ${fixable.length} produtos?`)) {
          await handleApplyCorrection(fixable);
      }
  };

  const handleApplyCorrection = async (corrections) => {
      try {
          await axiosInstance.post('/produtos/apply_ncm_correction/', { corrections });
          setOpenAuditDialog(false);
          fetchProdutos();
          alert("Correções aplicadas com sucesso!");
      } catch (err) {
          alert("Erro ao aplicar: " + err);
      }
  };

  const handleGtinLookup = async () => {
    const gtin = gtinInput.trim();
    if (!gtin || ![8, 12, 13, 14].includes(gtin.length) || !/^\d+$/.test(gtin)) {
      alert('Informe um GTIN válido (8, 12, 13 ou 14 dígitos numéricos).');
      return;
    }
    setGtinLoading(true);
    setGtinResult(null);
    try {
      const res = await axiosInstance.post('/produtos/lookup_ncm_by_gtin/', { gtin });
      setGtinResult(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erro desconhecido';
      alert('Erro ao consultar GTIN: ' + msg);
    } finally {
      setGtinLoading(false);
    }
  };

  const handleKeywordSearch = async () => {
    const query = keywordInput.trim();
    if (!query || query.length < 3) {
      alert('Informe ao menos 3 caracteres para a busca.');
      return;
    }
    setKeywordLoading(true);
    setKeywordResults([]);
    try {
      const res = await axiosInstance.post('/produtos/search_ncm_keyword/', { query, limit: 10 });
      setKeywordResults(res.data.results || []);
      if (!res.data.found) alert('Nenhum NCM encontrado para este termo.');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erro desconhecido';
      alert('Erro ao buscar NCM: ' + msg);
    } finally {
      setKeywordLoading(false);
    }
  };

  // ── CST IBS/CBS handlers ────────────────────────────────────────────────────
  const handleOpenCstDialog = async () => {
    setOpenCstDialog(true);
    setNewCstCodigo('');
    setNewCstDescricao('');
    try {
      const res = await axiosInstance.get('/produtos/listar_cst/');
      setCstList(res.data || []);
    } catch { setCstList([]); }
  };

  const handleSaveCst = async () => {
    if (!newCstCodigo.trim() || !newCstDescricao.trim()) {
      alert('Informe código e descrição.');
      return;
    }
    setCstSaving(true);
    try {
      await axiosInstance.post('/produtos/criar_cst/', { codigo: newCstCodigo.trim(), descricao: newCstDescricao.trim() });
      alert('CST cadastrado com sucesso!');
      const res = await axiosInstance.get('/produtos/listar_cst/');
      setCstList(res.data || []);
      setNewCstCodigo('');
      setNewCstDescricao('');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar CST.');
    } finally {
      setCstSaving(false);
    }
  };

  // ── cClassTrib handlers ────────────────────────────────────────────────────
  const handleOpenClassTribDialog = async () => {
    setOpenClassTribDialog(true);
    setNewCtCodigo('');
    setNewCtDescricao('');
    setNewCtCst('');
    try {
      const [clRes, cstRes] = await Promise.all([
        axiosInstance.get('/produtos/listar_classificacoes/'),
        axiosInstance.get('/produtos/listar_cst/'),
      ]);
      setClassTribList(clRes.data || []);
      setCstList(cstRes.data || []);
    } catch { setClassTribList([]); }
  };

  const handleSaveClassTrib = async () => {
    if (!newCtCodigo.trim() || !newCtDescricao.trim()) {
      alert('Informe código e descrição.');
      return;
    }
    setCtSaving(true);
    try {
      await axiosInstance.post('/produtos/criar_classificacao/', {
        codigo: newCtCodigo.trim(),
        descricao: newCtDescricao.trim(),
        cst: newCtCst.trim(),
      });
      alert('Classificação tributária cadastrada com sucesso!');
      const res = await axiosInstance.get('/produtos/listar_classificacoes/');
      setClassTribList(res.data || []);
      setNewCtCodigo('');
      setNewCtDescricao('');
      setNewCtCst('');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar classificação.');
    } finally {
      setCtSaving(false);
    }
  };

  const auditStatusLabel = (status) => {
    const map = {
      'VALID':         { label: 'Válido',          color: 'success' },
      'SUGGESTED':     { label: 'Sugestão',         color: 'warning' },
      'INVALID_FORMAT':{ label: 'Formato Inválido', color: 'error'   },
      'NOT_FOUND':     { label: 'Não Encontrado',   color: 'error'   },
    };
    return map[status] || { label: status, color: 'default' };
  };

  const AuditDialog = () => {
    const [somentePendentes, setSomentePendentes] = React.useState(false);
    const [produtoAlvoId, setProdutoAlvoId] = React.useState('');
    const totalValidos   = auditResults.filter(r => r.status === 'VALID').length;
    const totalSugestoes = auditResults.filter(r => r.sugestao && r.status !== 'VALID').length;
    const totalInvalidos = auditResults.filter(r => r.status === 'INVALID_FORMAT').length;
    const totalNaoEncontrados = auditResults.filter(r => r.status === 'NOT_FOUND').length;

    const linhas = somentePendentes
      ? auditResults.filter(r => r.status !== 'VALID')
      : auditResults;

    const applyNcmToProduto = async (ncm, info) => {
      if (!produtoAlvoId) { alert('Selecione um produto para aplicar o NCM.'); return; }
      if (!ncm || String(ncm).replace('.','').trim().length !== 8) { alert('NCM inválido (deve ter 8 dígitos).'); return; }
      await handleApplyCorrection([{
        id: produtoAlvoId,
        ncm,
        classificacao: info?.classificacao,
        ibs: info?.ibs,
        cbs: info?.cbs,
      }]);
    };

    return (
      <Dialog open={openAuditDialog} onClose={() => setOpenAuditDialog(false)} maxWidth="xl" fullWidth>
          <DialogTitle>Auditoria Fiscal Interna — NCM</DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Tabs value={auditTab} onChange={(_, v) => setAuditTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tab label="Auditoria NCM" />
              <Tab label="Consulta por GTIN" />
              <Tab label="Busca por Palavra-chave" />
            </Tabs>

            {/* ── TAB 0: Auditoria NCM ────────────────────────────── */}
            {auditTab === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" sx={{mb: 1}}>
                    Analisa os NCMs dos produtos comparando com o banco de dados oficial tributário.
                    Apenas NCMs com <strong>exatamente 8 dígitos</strong> são aceitos como sugestão.
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button variant="contained" onClick={handleRunAudit} disabled={loading}>
                      {loading ? "Auditando..." : "Iniciar Análise"}
                  </Button>
                  {auditResults.length > 0 && (
                    <>
                      <Chip label={`✔ Válidos: ${totalValidos}`} color="success" size="small" />
                      <Chip label={`⚠ Sugestões: ${totalSugestoes}`} color="warning" size="small" />
                      <Chip label={`✖ Inválidos: ${totalInvalidos}`} color="error" size="small" />
                      <Chip label={`? Não Encontrado: ${totalNaoEncontrados}`} color="default" size="small" />
                      <Button
                        size="small"
                        variant={somentePendentes ? 'contained' : 'outlined'}
                        onClick={() => setSomentePendentes(v => !v)}
                      >
                        {somentePendentes ? 'Mostrar Todos' : 'Mostrar Apenas Pendentes'}
                      </Button>
                    </>
                  )}
                </Box>

                {linhas.length > 0 && (
                    <TableContainer component={Paper} sx={{maxHeight: 420}}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Produto</TableCell>
                                    <TableCell>NCM Atual</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>NCM Sugerido</TableCell>
                                    <TableCell>Descrição NCM</TableCell>
                                    <TableCell>Ação</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {linhas.map((row) => {
                                  const st = auditStatusLabel(row.status);
                                  const sugestaoValida = row.sugestao && String(row.sugestao).replace('.','').trim().length === 8
                                    ? row.sugestao : null;
                                  const descricaoNcm = row.info?.descricao_ncm || '-';
                                  return (
                                    <TableRow key={row.id} sx={{ bgcolor: row.status !== 'VALID' ? 'rgba(255,200,50,0.05)' : undefined }}>
                                        <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {row.nome}
                                        </TableCell>
                                        <TableCell>
                                          <code>{row.ncm_atual || '—'}</code>
                                          {row.ncm_atual && String(row.ncm_atual).replace('.','').trim().length !== 8 && (
                                            <Typography variant="caption" color="error" sx={{ ml: 0.5 }}>
                                              ({String(row.ncm_atual).replace('.','').trim().length} dígitos)
                                            </Typography>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={st.label} color={st.color} size="small" />
                                        </TableCell>
                                        <TableCell>
                                          {sugestaoValida
                                            ? <strong><code>{sugestaoValida}</code></strong>
                                            : <Typography variant="caption" color="text.secondary">sem sugestão</Typography>
                                          }
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 250, fontSize: '0.75rem' }}>
                                          {descricaoNcm}
                                        </TableCell>
                                        <TableCell>
                                             {sugestaoValida && (
                                                 <Button size="small" variant="contained" color="primary"
                                                   onClick={() => handleApplyCorrection([{
                                                     id: row.id,
                                                     ncm: sugestaoValida,
                                                     classificacao: row.info?.classificacao,
                                                     ibs: row.info?.ibs,
                                                     cbs: row.info?.cbs
                                                   }])}>
                                                     Aplicar {sugestaoValida}
                                                 </Button>
                                             )}
                                        </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
              </Box>
            )}

            {/* ── TAB 1: Consulta por GTIN ────────────────────────── */}
            {auditTab === 1 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Bipe ou digite o código de barras (EAN/GTIN) do produto.
                  O sistema consultará bases públicas e sugerirá o NCM correspondente.
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TextField
                    label="GTIN / EAN"
                    value={gtinInput}
                    onChange={e => setGtinInput(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && handleGtinLookup()}
                    placeholder="Ex: 7891000315507"
                    size="small"
                    sx={{ minWidth: 220 }}
                    inputProps={{ maxLength: 14 }}
                    autoFocus
                  />
                  <Button
                    variant="contained"
                    onClick={handleGtinLookup}
                    disabled={gtinLoading}
                  >
                    {gtinLoading ? <CircularProgress size={20} /> : 'Consultar'}
                  </Button>
                </Box>

                {gtinResult && (
                  gtinResult.found ? (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Produto encontrado via {gtinResult.source}
                      </Typography>
                      <Stack spacing={0.5}>
                        <Typography variant="body2"><strong>Nome:</strong> {gtinResult.nome_produto}</Typography>
                        <Typography variant="body2">
                          <strong>NCM sugerido:</strong>{' '}
                          {gtinResult.ncm
                            ? <code style={{ fontWeight: 'bold', fontSize: '1rem' }}>{gtinResult.ncm}</code>
                            : <em>Não encontrado na base local</em>}
                        </Typography>
                        {gtinResult.ncm_info?.descricao_ncm && (
                          <Typography variant="body2" color="text.secondary">
                            {gtinResult.ncm_info.descricao_ncm}
                          </Typography>
                        )}
                      </Stack>

                      {gtinResult.ncm && String(gtinResult.ncm).replace('.','').trim().length === 8 && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                          <FormControl size="small" sx={{ minWidth: 260 }}>
                            <InputLabel>Aplicar NCM ao produto</InputLabel>
                            <Select
                              value={produtoAlvoId}
                              onChange={e => setProdutoAlvoId(e.target.value)}
                              label="Aplicar NCM ao produto"
                            >
                              <MenuItem value=""><em>Selecionar...</em></MenuItem>
                              {produtos.map(p => (
                                <MenuItem key={p.id} value={p.id}>{p.nome_produto || p.codigo_produto}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Button
                            variant="contained"
                            color="success"
                            disabled={!produtoAlvoId}
                            onClick={() => applyNcmToProduto(gtinResult.ncm, gtinResult.ncm_info)}
                          >
                            Aplicar {gtinResult.ncm}
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  ) : (
                    <Alert severity="warning">
                      {gtinResult.message || `Produto com GTIN ${gtinInput} não encontrado nas bases públicas.`}
                    </Alert>
                  )
                )}
              </Box>
            )}

            {/* ── TAB 2: Busca por Palavra-chave ───────────────────── */}
            {auditTab === 2 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Digite a descrição ou nome do produto para buscar os NCMs mais prováveis na base tributária local.
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TextField
                    label="Descrição do produto"
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleKeywordSearch()}
                    placeholder="Ex: Refrigerante Coca-Cola 350ml"
                    size="small"
                    sx={{ minWidth: 320 }}
                    autoFocus
                  />
                  <Button
                    variant="contained"
                    onClick={handleKeywordSearch}
                    disabled={keywordLoading}
                  >
                    {keywordLoading ? <CircularProgress size={20} /> : 'Buscar NCM'}
                  </Button>
                </Box>

                {keywordResults.length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary">
                        Selecione um produto para aplicar o NCM:
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 260 }}>
                        <InputLabel>Produto alvo</InputLabel>
                        <Select
                          value={produtoAlvoId}
                          onChange={e => setProdutoAlvoId(e.target.value)}
                          label="Produto alvo"
                        >
                          <MenuItem value=""><em>Selecionar...</em></MenuItem>
                          {produtos.map(p => (
                            <MenuItem key={p.id} value={p.id}>{p.nome_produto || p.codigo_produto}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <TableContainer component={Paper} sx={{ maxHeight: 380 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ width: 100 }}>NCM</TableCell>
                            <TableCell>Descrição</TableCell>
                            <TableCell sx={{ width: 80 }}>Score</TableCell>
                            <TableCell sx={{ width: 120 }}>Ação</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {keywordResults.map((r, i) => (
                            <TableRow key={r.ncm} sx={{ bgcolor: i === 0 ? 'rgba(33,150,243,0.06)' : undefined }}>
                              <TableCell>
                                <strong><code>{r.ncm}</code></strong>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.78rem' }}>
                                {r.descricao}
                                {r.info?.descricao_ncm && r.info.descricao_ncm !== r.descricao && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {r.info.descricao_ncm}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={r.score}
                                  size="small"
                                  color={r.score >= 40 ? 'success' : r.score >= 20 ? 'warning' : 'default'}
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  disabled={!produtoAlvoId}
                                  onClick={() => applyNcmToProduto(r.ncm, r.info)}
                                >
                                  Aplicar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {!keywordLoading && keywordResults.length === 0 && keywordInput.length >= 3 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Nenhum resultado encontrado. Tente outros termos.
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
          {auditTab === 0 && (
            <Button onClick={handleAutoFixAll} color="secondary" variant="contained" sx={{mr: 1}}>
                Corrigir Automaticamente ({auditResults.filter(r => r.sugestao && String(r.sugestao).replace('.','').trim().length === 8 && r.status !== 'VALID').length})
            </Button>
          )}
          <Button onClick={() => setOpenAuditDialog(false)}>Fechar</Button>
          </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ 
      width: '100%',
      p: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
      '@media (min-width: 3440px)': {
        p: 6
      },
      '@media (min-width: 5120px)': {
        p: 8
      }
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
        mb: { xs: 2, sm: 3 }
      }}>
        <Typography
          variant={isSmallScreen ? "h5" : "h4"}
          sx={{ fontWeight: 'bold' }}
        >
          Produtos
        </Typography>

        {/* Search and Filter - Mobile */}
        {isMobile && (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Categoria</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Categoria"
              >
                <MenuItem value="">Todas</MenuItem>
                {categorias.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              variant="outlined"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              size="small"
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Categoria"
              >
                <MenuItem value="">Todas</MenuItem>
                {categorias.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              color="info"
              startIcon={<MoneyIcon />}
              onClick={() => setOpenAuditDialog(true)}
              sx={{ mr: 1 }}
              size={isSmallScreen ? "small" : "medium"}
            >
              Auditoria (Interna)
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={calculoAutoLoading ? <CircularProgress size={20} color="inherit" /> : <AutoModeIcon />}
              onClick={handleCalcularTributosAuto}
              disabled={calculoAutoLoading}
              sx={{ 
                mr: 1,
                background: 'linear-gradient(45deg, #2e7d32 30%, #66bb6a 90%)',
                boxShadow: '0 3px 5px 2px rgba(46, 125, 50, .3)',
                fontWeight: 'bold',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1b5e20 30%, #4caf50 90%)',
                }
              }}
              size={isSmallScreen ? "small" : "medium"}
            >
              {calculoAutoLoading ? calculoAutoMessage : '🧠 Calcular Automático'}
            </Button>

            <Button
              variant="contained"
              color="info"
              startIcon={<CalculateIcon />}
              onClick={handleUpdateTaxes}
              sx={{ mr: 1 }}
              size={isSmallScreen ? "small" : "medium"}
            >
              Preview Tributos
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              size={isSmallScreen ? "small" : "medium"}
            >
              Novo Produto
            </Button>

            {configProduto?.produto_em_grade && (
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<GridOnIcon />}
                    onClick={handleAddProductGradeClick}
                    size={isSmallScreen ? "small" : "medium"}
                    sx={{
                        ml: 1,
                        background: 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
                        boxShadow: '0 3px 5px 2px rgba(156, 39, 176, .3)',
                        fontWeight: 'bold',
                        border: '1px solid white'
                     }}
                >
                    📦 Produto em Grade
                </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Mensagem de Erro do Sistema */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Progresso do Cálculo Automático de Tributos */}
      {calculoAutoLoading && (
        <Alert 
          severity="info" 
          icon={<CircularProgress size={20} />}
          sx={{ 
            mb: 2,
            '& .MuiAlert-message': {
              fontSize: '1rem',
              fontWeight: 'bold'
            }
          }}
        >
          {calculoAutoMessage}
        </Alert>
      )}

      {/* Alerta de estoque baixo */}
      {estoqueBaixo > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: { xs: 2, sm: 3 } }}
          icon={<WarningIcon />}
        >
          <Typography variant="body2">
            {estoqueBaixo} produto{estoqueBaixo > 1 ? 's' : ''} com estoque baixo
          </Typography>
        </Alert>
      )}

      {/* Estatísticas - Cards responsivos */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={6} sm={3} lg={2} xl={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography
                variant={isSmallScreen ? "h5" : "h4"}
                color="primary"
                sx={{ fontWeight: 'bold' }}
              >
                {totalProdutos}
              </Typography>
              <Typography
                variant={isSmallScreen ? "body2" : "body1"}
                color="text.secondary"
              >
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} lg={2} xl={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography
                variant={isSmallScreen ? "h5" : "h4"}
                color="success.main"
                sx={{ fontWeight: 'bold' }}
              >
                {emEstoque}
              </Typography>
              <Typography
                variant={isSmallScreen ? "body2" : "body1"}
                color="text.secondary"
              >
                Em Estoque
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography
                variant={isSmallScreen ? "h5" : "h4"}
                color="warning.main"
                sx={{ fontWeight: 'bold' }}
              >
                {estoqueBaixo}
              </Typography>
              <Typography
                variant={isSmallScreen ? "body2" : "body1"}
                color="text.secondary"
              >
                Estoque Baixo
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography
                variant={isSmallScreen ? "h5" : "h4"}
                color="info.main"
                sx={{ fontWeight: 'bold' }}
              >
                R$ {valorTotalEstoque.toFixed(0)}
              </Typography>
              <Typography
                variant={isSmallScreen ? "body2" : "body1"}
                color="text.secondary"
              >
                Valor Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Produtos */}
      {isMobile ? (
        // Mobile: Cards
        <Box>
          {loading ? (
            <Typography>Carregando...</Typography>
          ) : filteredProdutos.length > 0 ? (
            filteredProdutos.map((produto) => (
              <ProdutoCard key={produto.id_produto} produto={produto} />
            ))
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  Nenhum produto encontrado
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      ) : (
        // Desktop: Tabela
        <>
          {/* Filtros de Estoque e Preço */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Visualizar Estoque</InputLabel>
              <Select
                value={filtroEstoque}
                label="Visualizar Estoque"
                onChange={(e) => handleChangeFiltroEstoque(e.target.value)}
              >
                <MenuItem value="AMBOS">Ambos</MenuItem>
                <MenuItem value="LOJA">Apenas LOJA</MenuItem>
                <MenuItem value="DEPOSITO">Apenas DEPOSITO</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Visualizar Preço</InputLabel>
              <Select
                value={filtroPreco}
                label="Visualizar Preço"
                onChange={(e) => handleChangeFiltroPreco(e.target.value)}
              >
                <MenuItem value="AMBOS">Ambos</MenuItem>
                <MenuItem value="LOJA">Apenas LOJA</MenuItem>
                <MenuItem value="DEPOSITO">Apenas DEPOSITO</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Produto</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Grupo</TableCell>
                  <TableCell>Marca</TableCell>
                  <TableCell>NCM</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#e3f2fd' }}>IBS %</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f3e5f5' }}>CBS %</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#fff3e0' }}>CST IBS/CBS</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#fff3e0' }}>cClassTrib</TableCell>

                  {/* Colunas de Preço baseadas no filtroPreco */}
                  {filtroPreco === 'AMBOS' ? (
                    <>
                      <TableCell align="right">Preço (LOJA)</TableCell>
                      <TableCell align="right">Preço (DEPOSITO)</TableCell>
                    </>
                  ) : filtroPreco === 'LOJA' ? (
                    <TableCell align="right">Preço (LOJA)</TableCell>
                  ) : (
                    <TableCell align="right">Preço (DEPOSITO)</TableCell>
                  )}

                  {/* Colunas de Estoque baseadas no filtroEstoque */}
                  {filtroEstoque === 'AMBOS' ? (
                    <>
                      <TableCell align="center">Estoque (LOJA)</TableCell>
                      <TableCell align="center">Estoque (DEPOSITO)</TableCell>
                    </>
                  ) : filtroEstoque === 'LOJA' ? (
                    <TableCell align="center">Estoque (LOJA)</TableCell>
                  ) : (
                    <TableCell align="center">Estoque (DEPOSITO)</TableCell>
                  )}
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={calcularTotalColunas()} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredProdutos.length > 0 ? (
                  filteredProdutos.map((produto) => (
                    <TableRow key={produto.id_produto} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {produto.imagem_url ? (
                            <Avatar
                              src={produto.imagem_url}
                              sx={{
                                mr: 2,
                                width: 48,
                                height: 48,
                                bgcolor: theme.palette.grey[200]
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <Avatar
                            sx={{
                              mr: 2,
                              bgcolor: theme.palette.primary.main,
                              width: 48,
                              height: 48,
                              display: produto.imagem_url ? 'none' : 'flex'
                            }}
                          >
                            <InventoryIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" color="primary" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                              {produto.codigo_produto || 'Sem código'}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {produto.nome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {produto.descricao}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{produto.categoria || '—'}</TableCell>
                      <TableCell>{produto.grupo}</TableCell>
                      <TableCell>{produto.marca && produto.marca !== 'OUTROS' ? produto.marca : '—'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {produto.ncm}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ bgcolor: '#e3f2fd' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            color: produto.tributacao_info?.ibs_aliquota ? 'primary.main' : 'text.disabled'
                          }}
                        >
                          {produto.tributacao_info?.ibs_aliquota 
                            ? `${parseFloat(produto.tributacao_info.ibs_aliquota).toFixed(2)}%` 
                            : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ bgcolor: '#f3e5f5' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            color: produto.tributacao_info?.cbs_aliquota ? 'secondary.main' : 'text.disabled'
                          }}
                        >
                          {produto.tributacao_info?.cbs_aliquota 
                            ? `${parseFloat(produto.tributacao_info.cbs_aliquota).toFixed(2)}%` 
                            : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ bgcolor: '#fff8e1' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {produto.tributacao_info?.cst_ibs_cbs || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ bgcolor: '#fff8e1' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {produto.tributacao_info?.classificacao_fiscal || '-'}
                        </Typography>
                      </TableCell>

                      {/* Colunas de Preço baseadas no filtroPreco */}
                      {filtroPreco === 'AMBOS' ? (
                        <>
                          <TableCell align="right">
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              R$ {produto.loja.preco.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              R$ {produto.deposito.preco.toFixed(2)}
                            </Typography>
                          </TableCell>
                        </>
                      ) : filtroPreco === 'LOJA' ? (
                        <TableCell align="right">
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            R$ {produto.loja.preco.toFixed(2)}
                          </Typography>
                        </TableCell>
                      ) : (
                        <TableCell align="right">
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            R$ {produto.deposito.preco.toFixed(2)}
                          </Typography>
                        </TableCell>
                      )}

                      {/* Colunas de Estoque baseadas no filtroEstoque */}
                      {filtroEstoque === 'AMBOS' ? (
                        <>
                          <TableCell align="center">
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 'bold',
                                color: produto.loja.estoque <= produto.loja.estoqueMinimo ?
                                  theme.palette.error.main :
                                  theme.palette.text.primary
                              }}
                            >
                              {produto.loja.estoque}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 'bold',
                                color: produto.deposito.estoque <= produto.deposito.estoqueMinimo ?
                                  theme.palette.error.main :
                                  theme.palette.text.primary
                              }}
                            >
                              {produto.deposito.estoque}
                            </Typography>
                          </TableCell>
                        </>
                      ) : filtroEstoque === 'LOJA' ? (
                        <TableCell align="center">
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 'bold',
                              color: produto.loja.estoque <= produto.loja.estoqueMinimo ?
                                theme.palette.error.main :
                                theme.palette.text.primary
                            }}
                          >
                            {produto.loja.estoque}
                          </Typography>
                        </TableCell>
                      ) : (
                        <TableCell align="center">
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 'bold',
                              color: produto.deposito.estoque <= produto.deposito.estoqueMinimo ?
                                theme.palette.error.main :
                                theme.palette.text.primary
                            }}
                          >
                            {produto.deposito.estoque}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Chip
                          label={produto.status}
                          color={getStatusColor(produto.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleOpenDialog(produto)}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(produto.id_produto)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={calcularTotalColunas()} align="center">
                      <Typography variant="h6" color="text.secondary">
                        Nenhum produto encontrado
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* FAB para Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => handleOpenDialog()}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialog de Adicionar/Editar Produto */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullScreen={isMobile}
        TransitionComponent={isMobile ? Transition : undefined}
        maxWidth="md"
        fullWidth
      >
        {isMobile && (
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleCloseDialog}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                {selectedProduto ? 'Editar Produto' : 'Novo Produto'}
              </Typography>
              <Button autoFocus color="inherit" onClick={handleSave}>
                Salvar
              </Button>
            </Toolbar>
          </AppBar>
        )}

        {!isMobile && (
          <DialogTitle>
            {selectedProduto ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        )}

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Sistema de Abas */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} variant="scrollable" scrollButtons="auto">
              <Tab label="Dados Básicos" />
              <Tab label="Classificação" />
              <Tab label="Tributação" />
              <Tab label="Relacionados" />
              {configProduto?.material_construcao && (
                <Tab label="Materiais de Construção" icon={<WarehouseIcon />} iconPosition="start" />
              )}
              {gradeMode && !selectedProduto && (
                 <Tab label="Variações (Grade)" icon={<GridOnIcon />} iconPosition="start" />
              )}
              {configProduto?.controlar_lote_validade && (
                <Tab label="Lotes e Validade" icon={<EventNoteIcon />} iconPosition="start" disabled={!selectedProduto} />
              )}
            </Tabs>
          </Box>

          {/* ABA 1: Dados Básicos */}
          {tabValue === 0 && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label={configProduto?.tipo_geracao_codigo === 'automatica' && !selectedProduto ? "Código (Automático)" : "Código do Produto"}
                value={formData.codigo_produto}
                onChange={(e) => {
                  setFormData({ ...formData, codigo_produto: e.target.value });
                }}
                variant="outlined"
                disabled={!selectedProduto && configProduto?.tipo_geracao_codigo === 'automatica'}
                placeholder={configProduto?.tipo_geracao_codigo === 'automatica' && !selectedProduto ? "Será gerado ao salvar" : "Ex: PROD001"}
                helperText={
                  configProduto?.tipo_geracao_codigo === 'automatica' && !selectedProduto
                    ? "O código será gerado automaticamente pelo sistema"
                    : "Código único do produto"
                }
              />

              <TextField
                fullWidth
                label="Nome do Produto"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                variant="outlined"
                required
              />

              <TextField
                fullWidth
                label="GTIN / Código de Barras (EAN)"
                value={formData.gtin || ''}
                onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                variant="outlined"
                placeholder="Ex: 7891234567890"
                helperText="Código de barras EAN-8, EAN-13 ou deixe vazio para SEM GTIN"
                inputProps={{ maxLength: 14 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl fullWidth>
                      <InputLabel>Categoria</InputLabel>
                      <Select
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                        label="Categoria"
                      >
                        {[...new Set([...categorias, ...(formData.categoria ? [formData.categoria] : [])])].sort().map((cat) => (
                          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      onClick={() => { setNovaCategoriaInput(''); setOpenCategoriaDialog(true); }}
                      sx={{ minWidth: 'auto', px: 2 }}
                      title="Criar nova categoria"
                    >
                      <AddIcon />
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Unidade de Medida</InputLabel>
                    <Select
                      value={formData.unidade_medida}
                      onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                      label="Unidade de Medida"
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
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Gênero</InputLabel>
                    <Select
                      value={formData.genero || ''}
                      onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                      label="Gênero"
                    >
                      <MenuItem value="">Não especificado</MenuItem>
                      <MenuItem value="feminino">Feminino</MenuItem>
                      <MenuItem value="masculino">Masculino</MenuItem>
                      <MenuItem value="unissex">Unissex</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="URL da Imagem"
                      value={formData.imagem_url}
                      onChange={(e) => {
                        const novaUrl = e.target.value;
                        setFormData({ ...formData, imagem_url: novaUrl });
                        // Salvar imediatamente no localStorage
                        const codigoProduto = formData.codigo_produto || selectedProduto?.codigo_produto;
                        if (codigoProduto && novaUrl.trim()) {
                          localStorage.setItem(`produto_imagem_${codigoProduto}`, novaUrl);
                          console.log('🖼️ URL atualizada para:', codigoProduto, '=', novaUrl);
                        }
                      }}
                      variant="outlined"
                      placeholder="https://exemplo.com/imagem.jpg"
                      helperText="URL da imagem do produto"
                      InputProps={{
                        startAdornment: <ImageIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={buscarImagensGoogle}
                      disabled={!formData.nome.trim()}
                      sx={{ minWidth: 'auto', px: 2 }}
                      title="Buscar imagens no Google"
                    >
                      <PhotoLibraryIcon />
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  {formData.imagem_url && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Preview:
                      </Typography>
                      <Avatar
                        src={formData.imagem_url}
                        sx={{ width: 100, height: 100, bgcolor: theme.palette.grey[200] }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      >
                        <ImageIcon />
                      </Avatar>
                    </Box>
                  )}
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={3}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                variant="outlined"
              />

              <Alert severity="info" sx={{ mt: 2 }}>
                Após salvar o produto, você poderá configurar o preço de custo, preço de venda e estoque mínimo para cada depósito na próxima tela.
              </Alert>
            </Stack>
          )}

          {/* ABA 2: Classificação */}
          {tabValue === 1 && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl fullWidth>
                      <InputLabel>Grupo</InputLabel>
                      <Select
                        value={formData.grupo}
                        onChange={(e) => {
                          const nomeGrupo = e.target.value;
                          const grupoSel = gruposAtivos.find(g => g.nome === nomeGrupo);
                          setFormData({ ...formData, grupo: nomeGrupo, id_grupo: grupoSel ? grupoSel.id : '' });
                        }}
                        label="Grupo"
                        required
                        disabled={loadingGrupos}
                      >
                        {gruposAtivos.map((grupo) => (
                          <MenuItem key={grupo.id} value={grupo.nome}>
                            {grupo.nome}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      onClick={handleOpenGrupoDialog}
                      sx={{ minWidth: 'auto', px: 2 }}
                      title="Criar novo grupo"
                    >
                      <AddIcon />
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl fullWidth>
                      <InputLabel>Marca</InputLabel>
                      <Select
                        value={formData.marca}
                        onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                        label="Marca"
                      >
                        {[...new Set([...marcas, ...(formData.marca ? [formData.marca] : [])])].sort().map((marca) => (
                          <MenuItem key={marca} value={marca}>{marca}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      onClick={() => { setNovaMarcaInput(''); setOpenMarcaDialog(true); }}
                      sx={{ minWidth: 'auto', px: 2 }}
                      title="Criar nova marca"
                    >
                      <AddIcon />
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Classificação</InputLabel>
                    <Select
                      value={formData.classificacao || ''}
                      onChange={(e) => {
                        console.log('🔄 SELECT CLASSIFICAÇÃO ALTERADO:', e.target.value);
                        setFormData({ ...formData, classificacao: e.target.value });
                        console.log('📝 FormData atualizado, nova classificacao:', e.target.value);
                      }}
                      label="Classificação"
                    >
                      <MenuItem value="">Nenhuma</MenuItem>
                      {classificacoes.filter(c => c !== '').map((classif) => (
                        <MenuItem key={classif} value={classif}>
                          {classif === 'SERVICO' ? 'SERVIÇO' : classif === 'MATERIA-PRIMA' ? 'MATÉRIA-PRIMA' : classif}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="NCM (Código Fiscal)"
                    value={formData.ncm}
                    onChange={(e) => {
                      // Permitir apenas números e limitar a 8 dígitos
                      const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setFormData({ ...formData, ncm: value });
                    }}
                    variant="outlined"
                    placeholder="Ex: 84713000"
                    helperText="Nomenclatura Comum do Mercosul - 8 dígitos"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleSuggestNCM} edge="end" title="Buscar NCM pelo nome (Auto)">
                            <SearchIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    inputProps={{
                      maxLength: 8,
                      inputMode: 'numeric'
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="CEST"
                    value={formData.cest || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 7);
                      setFormData({ ...formData, cest: value });
                    }}
                    variant="outlined"
                    placeholder="Ex: 1000100"
                    helperText="Código Especificador da Substituição Tributária — 7 dígitos"
                    inputProps={{ maxLength: 7, inputMode: 'numeric' }}
                  />
                </Grid>
              </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Controla Lote */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!formData.controla_lote}
                      onChange={(e) => setFormData({ ...formData, controla_lote: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="bold">Controla Lote</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Exige seleção de lote ao incluir este produto em uma venda
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />

                <Divider sx={{ my: 2 }} />
                <Alert severity="info">
                  <Typography variant="body2">
                    Para configurar <strong>CFOP, CST/CSOSN, alíquotas</strong> e outros detalhes fiscais, acesse a aba <strong>Tributação</strong>.
                  </Typography>
                </Alert>
            </Stack>
          )}

          {/* ABA 3: Tributação */}
          {tabValue === 2 && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h6">Tributação do Produto</Typography>
                  {tributacaoData._sugerido_config && !selectedProduto && (
                    <Chip
                      label="💡 Tributação sugerida da configuração padrão"
                      color="primary"
                      size="small"
                      variant="outlined"
                      onDelete={() => setTributacaoData(prev => ({ ...prev, _sugerido_config: false }))}
                    />
                  )}
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const pid = selectedProduto?.id_produto || selectedProduto?.id;
                    if (!pid) { alert('Salve o produto primeiro para usar auto-detecção.'); return; }
                    if (!formData.ncm) { alert('Informe o NCM na aba Classificação primeiro.'); return; }
                    axiosInstance.post(`/produtos/${pid}/tributacao-auto/`, { ncm: formData.ncm })
                      .then(res => {
                        setTributacaoData(prev => ({ ...prev, ...res.data }));
                        alert('Tributação detectada pelo NCM com sucesso!');
                      })
                      .catch(() => alert('Não foi possível detectar a tributação pelo NCM.'));
                  }}
                  disabled={!selectedProduto || !formData.ncm}
                >
                  Auto-detectar pelo NCM
                </Button>
              </Box>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tributacaoSubTab} onChange={(e, v) => setTributacaoSubTab(v)} variant="scrollable" scrollButtons="auto">
                  <Tab label="ICMS" />
                  <Tab label="IPI" />
                  <Tab label="PIS" />
                  <Tab label="COFINS" />
                  <Tab label="IBS / CBS" />
                </Tabs>
              </Box>

              {tributacaoSubTab === 0 && (
                <>
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: '#e8eaf6', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body2" fontWeight="bold" color="#283593" sx={{ whiteSpace: 'nowrap' }}>
                      Perfil de Tributação:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                      <InputLabel>Importar da aba Tributação</InputLabel>
                      <Select
                        value={perfilTribProd}
                        onChange={e => aplicarPerfilTribProd(e.target.value)}
                        label="Importar da aba Tributação"
                      >
                        <MenuItem value=""><em>{tiposTributacaoProd.length === 0 ? 'Nenhum perfil cadastrado' : 'Selecione para importar…'}</em></MenuItem>
                        {tiposTributacaoProd.map(t => (
                          <MenuItem key={t.id} value={t.id}>{t.nome}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Typography variant="caption" color="text.secondary">Preenche CFOP e CST/CSOSN automaticamente</Typography>
                  </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="CFOP"
                      value={tributacaoData.cfop}
                      onChange={e => setTributacaoData({ ...tributacaoData, cfop: e.target.value })}
                      helperText="Ex: 5102 (dentro estado) / 6102 (fora estado)"
                      placeholder="5102"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Alíquota ICMS (%)"
                      type="number"
                      value={tributacaoData.icms_aliquota}
                      onChange={e => setTributacaoData({ ...tributacaoData, icms_aliquota: e.target.value })}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>CSOSN (Simples Nacional)</InputLabel>
                      <Select
                        value={tributacaoData.csosn || ''}
                        onChange={e => setTributacaoData({ ...tributacaoData, csosn: e.target.value })}
                        label="CSOSN (Simples Nacional)"
                      >
                        <MenuItem value=""><em>Selecione</em></MenuItem>
                        <MenuItem value="101">101 – Tributada com crédito</MenuItem>
                        <MenuItem value="102">102 – Tributada sem crédito</MenuItem>
                        <MenuItem value="103">103 – Isenção faixa de receita</MenuItem>
                        <MenuItem value="201">201 – ST com crédito</MenuItem>
                        <MenuItem value="202">202 – ST sem crédito</MenuItem>
                        <MenuItem value="203">203 – ST sem crédito p/ isenção</MenuItem>
                        <MenuItem value="300">300 – Imune</MenuItem>
                        <MenuItem value="400">400 – Não tributada (SN)</MenuItem>
                        <MenuItem value="500">500 – ICMS cobrado por ST anterior</MenuItem>
                        <MenuItem value="900">900 – Outros</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>CST ICMS (Lucro Presumido/Real)</InputLabel>
                      <Select
                        value={tributacaoData.cst_icms || ''}
                        onChange={e => setTributacaoData({ ...tributacaoData, cst_icms: e.target.value })}
                        label="CST ICMS (Lucro Presumido/Real)"
                      >
                        <MenuItem value=""><em>Selecione</em></MenuItem>
                        <MenuItem value="00">00 – Tributada integralmente</MenuItem>
                        <MenuItem value="10">10 – Tributada com ST</MenuItem>
                        <MenuItem value="20">20 – Com redução de BC</MenuItem>
                        <MenuItem value="30">30 – Isenta com ST</MenuItem>
                        <MenuItem value="40">40 – Isenta</MenuItem>
                        <MenuItem value="41">41 – Não tributada</MenuItem>
                        <MenuItem value="50">50 – Suspensão</MenuItem>
                        <MenuItem value="51">51 – Diferimento</MenuItem>
                        <MenuItem value="60">60 – ICMS cobrado por ST anterior</MenuItem>
                        <MenuItem value="70">70 – Redução BC com ST</MenuItem>
                        <MenuItem value="90">90 – Outros</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ py: 0.5 }}>
                      <Typography variant="body2">
                        Use <strong>CSOSN</strong> para Simples Nacional · <strong>CST</strong> para Lucro Presumido/Real.
                        O sistema seleciona automaticamente na emissão da NF-e conforme o regime da empresa.
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </>)}

              {tributacaoSubTab === 1 && (
                <Box>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={ipiSubTab} onChange={(e, v) => setIpiSubTab(v)} textColor="secondary" indicatorColor="secondary">
                      <Tab label="Simples Nacional" />
                      <Tab label="Regime Normal" />
                    </Tabs>
                  </Box>
                  {/* IPI — Simples Nacional */}
                  {ipiSubTab === 0 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>CST IPI (Simples Nacional)</InputLabel>
                          <Select
                            value={tributacaoData.cst_ipi_sn}
                            onChange={e => setTributacaoData({ ...tributacaoData, cst_ipi_sn: e.target.value })}
                            label="CST IPI (Simples Nacional)"
                          >
                            <MenuItem value="52">52 – Saída isenta</MenuItem>
                            <MenuItem value="53">53 – Saída não tributada</MenuItem>
                            <MenuItem value="54">54 – Saída imune</MenuItem>
                            <MenuItem value="55">55 – Saída com suspensão</MenuItem>
                            <MenuItem value="99">99 – Outras saídas</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Alíquota IPI — SN (%)"
                          type="number"
                          value={tributacaoData.ipi_aliquota_sn}
                          onChange={e => setTributacaoData({ ...tributacaoData, ipi_aliquota_sn: e.target.value })}
                          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ py: 0.5 }}>
                          <Typography variant="body2">No Simples Nacional, IPI ainda se aplica para produtos industrializados. Geralmente CST 52, 53 ou 99.</Typography>
                        </Alert>
                      </Grid>
                    </Grid>
                  )}
                  {/* IPI — Regime Normal */}
                  {ipiSubTab === 1 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>CST IPI (Regime Normal)</InputLabel>
                          <Select
                            value={tributacaoData.cst_ipi}
                            onChange={e => setTributacaoData({ ...tributacaoData, cst_ipi: e.target.value })}
                            label="CST IPI (Regime Normal)"
                          >
                            <MenuItem value="00">00 – Entrada com recuperação de crédito</MenuItem>
                            <MenuItem value="01">01 – Entrada tributada alíquota zero</MenuItem>
                            <MenuItem value="02">02 – Entrada isenta</MenuItem>
                            <MenuItem value="03">03 – Entrada não tributada</MenuItem>
                            <MenuItem value="04">04 – Entrada imune</MenuItem>
                            <MenuItem value="05">05 – Entrada com suspensão</MenuItem>
                            <MenuItem value="49">49 – Outras entradas</MenuItem>
                            <MenuItem value="50">50 – Saída tributada</MenuItem>
                            <MenuItem value="51">51 – Saída tributada alíquota zero</MenuItem>
                            <MenuItem value="52">52 – Saída isenta</MenuItem>
                            <MenuItem value="53">53 – Saída não tributada</MenuItem>
                            <MenuItem value="54">54 – Saída imune</MenuItem>
                            <MenuItem value="55">55 – Saída com suspensão</MenuItem>
                            <MenuItem value="99">99 – Outras saídas</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Alíquota IPI (%)"
                          type="number"
                          value={tributacaoData.ipi_aliquota}
                          onChange={e => setTributacaoData({ ...tributacaoData, ipi_aliquota: e.target.value })}
                          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Box>
              )}

              {tributacaoSubTab === 2 && (
                <Box>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={pisSubTab} onChange={(e, v) => setPisSubTab(v)} textColor="secondary" indicatorColor="secondary">
                      <Tab label="Simples Nacional" />
                      <Tab label="Regime Normal" />
                    </Tabs>
                  </Box>
                  {/* PIS — Simples Nacional */}
                  {pisSubTab === 0 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>CST PIS (Simples Nacional)</InputLabel>
                          <Select
                            value={tributacaoData.cst_pis_sn}
                            onChange={e => setTributacaoData({ ...tributacaoData, cst_pis_sn: e.target.value })}
                            label="CST PIS (Simples Nacional)"
                          >
                            <MenuItem value="07">07 – Isenta da contribuição</MenuItem>
                            <MenuItem value="08">08 – Sem incidência</MenuItem>
                            <MenuItem value="09">09 – Com suspensão</MenuItem>
                            <MenuItem value="49">49 – Outras saídas</MenuItem>
                            <MenuItem value="99">99 – Outras operações</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Alíquota PIS — SN (%)"
                          type="number"
                          value={tributacaoData.pis_aliquota_sn}
                          onChange={e => setTributacaoData({ ...tributacaoData, pis_aliquota_sn: e.target.value })}
                          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ py: 0.5 }}>
                          <Typography variant="body2">No Simples Nacional, PIS é recolhido via DAS — CST normalmente <strong>07 (isenta)</strong> na NF-e.</Typography>
                        </Alert>
                      </Grid>
                    </Grid>
                  )}
                  {/* PIS — Regime Normal */}
                  {pisSubTab === 1 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>CST PIS (Regime Normal)</InputLabel>
                          <Select
                            value={tributacaoData.cst_pis_cofins}
                            onChange={e => setTributacaoData({ ...tributacaoData, cst_pis_cofins: e.target.value })}
                            label="CST PIS (Regime Normal)"
                          >
                            <MenuItem value="01">01 – Tributada à alíquota básica</MenuItem>
                            <MenuItem value="02">02 – Tributada à alíquota diferenciada</MenuItem>
                            <MenuItem value="03">03 – Tributada por unidade de medida</MenuItem>
                            <MenuItem value="04">04 – Monofásica – revenda alíquota zero</MenuItem>
                            <MenuItem value="05">05 – Monofásica – revenda com alíquota</MenuItem>
                            <MenuItem value="06">06 – Tributada por ST</MenuItem>
                            <MenuItem value="07">07 – Isenta da contribuição</MenuItem>
                            <MenuItem value="08">08 – Sem incidência</MenuItem>
                            <MenuItem value="09">09 – Com suspensão</MenuItem>
                            <MenuItem value="49">49 – Outras saídas</MenuItem>
                            <MenuItem value="50">50 – Crédito vinculado à exc. tributada</MenuItem>
                            <MenuItem value="99">99 – Outras operações</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Alíquota PIS (%)"
                          type="number"
                          value={tributacaoData.pis_aliquota}
                          onChange={e => setTributacaoData({ ...tributacaoData, pis_aliquota: e.target.value })}
                          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Box>
              )}

              {tributacaoSubTab === 3 && (
                <Box>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={cofinsSubTab} onChange={(e, v) => setCofinsSubTab(v)} textColor="secondary" indicatorColor="secondary">
                      <Tab label="Simples Nacional" />
                      <Tab label="Regime Normal" />
                    </Tabs>
                  </Box>
                  {/* COFINS — Simples Nacional */}
                  {cofinsSubTab === 0 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>CST COFINS (Simples Nacional)</InputLabel>
                          <Select
                            value={tributacaoData.cst_cofins_sn}
                            onChange={e => setTributacaoData({ ...tributacaoData, cst_cofins_sn: e.target.value })}
                            label="CST COFINS (Simples Nacional)"
                          >
                            <MenuItem value="07">07 – Isenta da contribuição</MenuItem>
                            <MenuItem value="08">08 – Sem incidência</MenuItem>
                            <MenuItem value="09">09 – Com suspensão</MenuItem>
                            <MenuItem value="49">49 – Outras saídas</MenuItem>
                            <MenuItem value="99">99 – Outras operações</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Alíquota COFINS — SN (%)"
                          type="number"
                          value={tributacaoData.cofins_aliquota_sn}
                          onChange={e => setTributacaoData({ ...tributacaoData, cofins_aliquota_sn: e.target.value })}
                          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ py: 0.5 }}>
                          <Typography variant="body2">No Simples Nacional, COFINS é recolhida via DAS — CST normalmente <strong>07 (isenta)</strong> na NF-e.</Typography>
                        </Alert>
                      </Grid>
                    </Grid>
                  )}
                  {/* COFINS — Regime Normal */}
                  {cofinsSubTab === 1 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>CST COFINS (Regime Normal)</InputLabel>
                          <Select
                            value={tributacaoData.cst_pis_cofins}
                            onChange={e => setTributacaoData({ ...tributacaoData, cst_pis_cofins: e.target.value })}
                            label="CST COFINS (Regime Normal)"
                          >
                            <MenuItem value="01">01 – Tributada à alíquota básica</MenuItem>
                            <MenuItem value="02">02 – Tributada à alíquota diferenciada</MenuItem>
                            <MenuItem value="03">03 – Tributada por unidade de medida</MenuItem>
                            <MenuItem value="04">04 – Monofásica – revenda alíquota zero</MenuItem>
                            <MenuItem value="05">05 – Monofásica – revenda com alíquota</MenuItem>
                            <MenuItem value="06">06 – Tributada por ST</MenuItem>
                            <MenuItem value="07">07 – Isenta da contribuição</MenuItem>
                            <MenuItem value="08">08 – Sem incidência</MenuItem>
                            <MenuItem value="09">09 – Com suspensão</MenuItem>
                            <MenuItem value="49">49 – Outras saídas</MenuItem>
                            <MenuItem value="50">50 – Crédito vinculado à exc. tributada</MenuItem>
                            <MenuItem value="99">99 – Outras operações</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Alíquota COFINS (%)"
                          type="number"
                          value={tributacaoData.cofins_aliquota}
                          onChange={e => setTributacaoData({ ...tributacaoData, cofins_aliquota: e.target.value })}
                          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Box>
              )}

              {tributacaoSubTab === 4 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormControl sx={{ flexGrow: 1 }}>
                        <InputLabel>CST (Código de Situação Tributária)</InputLabel>
                        <Select
                          value={tributacaoData.cst_ibs_cbs}
                          onChange={e => setTributacaoData({ ...tributacaoData, cst_ibs_cbs: e.target.value })}
                          label="CST (Código de Situação Tributária)"
                        >
                          <MenuItem value="000">000 - Tributação integral</MenuItem>
                          <MenuItem value="200">200 - Alíquota reduzida</MenuItem>
                          <MenuItem value="410">410 - Imunidade e não incidência</MenuItem>
                          <MenuItem value="510">510 - Diferimento</MenuItem>
                          <MenuItem value="515">515 - Diferimento com redução de alíquota</MenuItem>
                          <MenuItem value="550">550 - Suspensão</MenuItem>
                          <MenuItem value="620">620 - Tributação Monofásica</MenuItem>
                          <MenuItem value="800">800 - Transferência de crédito</MenuItem>
                          <MenuItem value="810">810 - Ajuste de IBS na ZFM</MenuItem>
                          <MenuItem value="811">811 - Ajustes</MenuItem>
                          <MenuItem value="830">830 - Exclusão da Base de Cálculo</MenuItem>
                        </Select>
                      </FormControl>
                      <Tooltip title="Cadastrar novo CST">
                        <IconButton onClick={handleOpenCstDialog} color="primary" size="small" sx={{ mt: 0.5 }}>
                          <AddCircleOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {(() => {
                        const staticOptions = [
                          { value: '000001', label: '000001 - Situações tributadas integralmente pelo IBS e CBS.' },
                          { value: '000002', label: '000002 - Situações com alíquota reduzida por benefício fiscal.' },
                          { value: '000003', label: '000003 - Regime automotivo - projetos incentivados, art. 311 LC 214/2025.' },
                          { value: '000004', label: '000004 - Regime automotivo - projetos incentivados, art. 312 LC 214/2025.' },
                          { value: '000005', label: '000005 - Imunidade religiosa, educacional e assistencial.' },
                          { value: '000006', label: '000006 - Imunidade de livros, jornais e periódicos.' },
                          { value: '000007', label: '000007 - Imunidade de partidos políticos e entidades sindicais.' },
                          { value: '000008', label: '000008 - Não incidência por operação não sujeita a IBS e CBS.' },
                          { value: '000009', label: '000009 - Diferimento integral do IBS e CBS.' },
                          { value: '000010', label: '000010 - Diferimento parcial com redução de alíquota.' },
                          { value: '000011', label: '000011 - Suspensão do IBS e CBS.' },
                          { value: '000012', label: '000012 - Tributação Monofásica – produtor/importador.' },
                          { value: '000013', label: '000013 - Tributação Monofásica – distribuidor/varejista.' },
                          { value: '000014', label: '000014 - Transferência de crédito de IBS/CBS.' },
                          { value: '000015', label: '000015 - Ajuste de IBS na Zona Franca de Manaus (ZFM).' },
                          { value: '000016', label: '000016 - Ajuste de CBS na Zona Franca de Manaus (ZFM).' },
                          { value: '000017', label: '000017 - Exclusão da Base de Cálculo.' },
                        ];
                        const dynamicOptions = classTribList
                          .filter(d => !staticOptions.find(s => s.value === d.codigo))
                          .map(d => ({ value: d.codigo, label: `${d.codigo} - ${d.descricao}` }));
                        const allOptions = [...staticOptions, ...dynamicOptions];
                        const selectedOption = allOptions.find(o => o.value === tributacaoData.classificacao_fiscal) || null;
                        return (
                          <Autocomplete
                            sx={{ flexGrow: 1 }}
                            options={allOptions}
                            getOptionLabel={o => o.label}
                            value={selectedOption}
                            onChange={(_, newVal) => setTributacaoData({ ...tributacaoData, classificacao_fiscal: newVal ? newVal.value : '' })}
                            isOptionEqualToValue={(o, v) => o.value === v.value}
                            ListboxProps={{ style: { maxHeight: 280, overflowY: 'auto' } }}
                            renderInput={params => (
                              <TextField {...params} label="cClassTrib (Código de Classificação Tributária)" placeholder="Digite para pesquisar..." />
                            )}
                            noOptionsText="Nenhuma classificação encontrada"
                            clearOnEscape
                          />
                        );
                      })()}
                      <Tooltip title="Cadastrar nova Classificação Tributária">
                        <IconButton onClick={handleOpenClassTribDialog} color="primary" size="small" sx={{ mt: 0.5 }}>
                          <AddCircleOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Alíquota IBS (%)"
                      type="number"
                      value={tributacaoData.ibs_aliquota}
                      onChange={e => setTributacaoData({ ...tributacaoData, ibs_aliquota: e.target.value })}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Alíquota CBS (%)"
                      type="number"
                      value={tributacaoData.cbs_aliquota}
                      onChange={e => setTributacaoData({ ...tributacaoData, cbs_aliquota: e.target.value })}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Imposto Seletivo (%)"
                      type="number"
                      value={tributacaoData.imposto_seletivo_aliquota}
                      onChange={e => setTributacaoData({ ...tributacaoData, imposto_seletivo_aliquota: e.target.value })}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                      helperText="Produtos seletivos – Reforma Tributária"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Alert severity="warning" sx={{ py: 0.5 }}>
                      <Typography variant="body2">
                        IBS/CBS fazem parte da <strong>Reforma Tributária</strong> (LC 214/2024).
                        Campos salvos para uso futuro — NF-e atual utiliza ICMS/PIS/COFINS.
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}

          {/* ABA RELACIONADOS */}
          {tabValue === 3 && (
            <Grid container spacing={2} sx={{ pt: 1, mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Produtos Complementares (Opcional)</Typography>
                {formData.produtos_complementares && formData.produtos_complementares.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                    {formData.produtos_complementares.map((pc) => (
                      <Chip
                        key={pc.id_produto}
                        label={`${pc.codigo_produto || ''} - ${pc.nome_produto || ''}`}
                        onDelete={() => {
                          setFormData({
                            ...formData,
                            produtos_complementares: formData.produtos_complementares.filter(p => p.id_produto !== pc.id_produto)
                          });
                        }}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                )}
                <Autocomplete
                  fullWidth
                  options={produtos.filter(p =>
                    p.id_produto !== selectedProduto?.id_produto &&
                    !(formData.produtos_complementares || []).some(pc => pc.id_produto === p.id_produto)
                  )}
                  getOptionLabel={(option) => option ? `${option.codigo_produto || option.codigo} - ${option.nome || option.nome_produto}` : ''}
                  value={null}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      const novoComplementar = {
                        id_produto: newValue.id_produto,
                        codigo_produto: newValue.codigo_produto || newValue.codigo,
                        nome_produto: newValue.nome || newValue.nome_produto
                      };
                      setFormData({
                        ...formData,
                        produtos_complementares: [...(formData.produtos_complementares || []), novoComplementar]
                      });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Adicionar produto complementar"
                      helperText="Selecione produtos que complementam este produto (ex: argamassa para porcelanato)"
                      placeholder="Digite para buscar..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id_produto}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{option.codigo_produto || option.codigo}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.nome || option.nome_produto}</Typography>
                      </Box>
                    </li>
                  )}
                  noOptionsText="Nenhum produto encontrado"
                  isOptionEqualToValue={(option, value) => option.id_produto === value?.id_produto}
                  blurOnSelect
                  clearOnBlur
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Produtos Similares (Opcional)</Typography>
                {formData.produtos_similares && formData.produtos_similares.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                    {formData.produtos_similares.map((ps) => (
                      <Chip
                        key={ps.id_produto}
                        label={`${ps.codigo_produto || ''} - ${ps.nome_produto || ''}`}
                        onDelete={() => {
                          setFormData({
                            ...formData,
                            produtos_similares: formData.produtos_similares.filter(p => p.id_produto !== ps.id_produto)
                          });
                        }}
                        color="secondary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                )}
                <Autocomplete
                  fullWidth
                  options={produtos.filter(p =>
                    p.id_produto !== selectedProduto?.id_produto &&
                    !(formData.produtos_similares || []).some(ps => ps.id_produto === p.id_produto)
                  )}
                  getOptionLabel={(option) => option ? `${option.codigo_produto || option.codigo} - ${option.nome || option.nome_produto}` : ''}
                  value={null}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      const novoSimilar = {
                        id_produto: newValue.id_produto,
                        codigo_produto: newValue.codigo_produto || newValue.codigo,
                        nome_produto: newValue.nome || newValue.nome_produto
                      };
                      setFormData({
                        ...formData,
                        produtos_similares: [...(formData.produtos_similares || []), novoSimilar]
                      });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Adicionar produto similar"
                      helperText="Selecione produtos alternativos equivalentes a este (ex: mesma linha de outra marca)"
                      placeholder="Digite para buscar..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id_produto}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{option.codigo_produto || option.codigo}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.nome || option.nome_produto}</Typography>
                      </Box>
                    </li>
                  )}
                  noOptionsText="Nenhum produto encontrado"
                  isOptionEqualToValue={(option, value) => option.id_produto === value?.id_produto}
                  blurOnSelect
                  clearOnBlur
                />
              </Grid>
            </Grid>
          )}

          {/* ABA MATERIAIS DE CONSTRUÇÃO */}
          {configProduto?.material_construcao && tabValue === 4 && (
            <Grid container spacing={2} sx={{ pt: 1, mt: 1 }}>
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
                  helperText="Ex: 20mm, 25mm, Branco, Cinza, etc."
                  placeholder="Ex: 20mm, Branco, 60x60"
                />
              </Grid>
            </Grid>
          )}

          {/* ABA GRADE */}
          {tabValue === (configProduto?.material_construcao ? 5 : 4) && gradeMode && !selectedProduto && (
            <Stack spacing={3} sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    🎯 Defina tamanhos e cores para criar variações automaticamente.
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Tamanhos (Ex: P, M, G)</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField size="small" value={tamanhoInput} onChange={e => setTamanhoInput(e.target.value)} placeholder="Novo tamanho" />
                        <Button variant="contained" size="small" onClick={() => {
                            if(tamanhoInput && !tamanhos.includes(tamanhoInput)) { setTamanhos([...tamanhos, tamanhoInput]); setTamanhoInput(''); }
                        }}>Add</Button>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {tamanhos.map(t => (
                            <Chip key={t} label={t} onDelete={() => setTamanhos(tamanhos.filter(item => item !== t))} />
                        ))}
                    </Box>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Cores (Ex: Azul, Vermelho)</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField size="small" value={corInput} onChange={e => setCorInput(e.target.value)} placeholder="Nova cor" />
                        <Button variant="contained" size="small" onClick={() => {
                            if(corInput && !cores.includes(corInput)) { setCores([...cores, corInput]); setCorInput(''); }
                        }}>Add</Button>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {cores.map(c => (
                            <Chip key={c} label={c} onDelete={() => setCores(cores.filter(item => item !== c))} />
                        ))}
                    </Box>
                </Paper>
            </Stack>
          )}

          {/* ABA CONFIG: LOTES E VALIDADE */}
          {((!gradeMode && tabValue === (configProduto?.material_construcao ? 5 : 4)) || (gradeMode && tabValue === (configProduto?.material_construcao ? 6 : 5))) && configProduto?.controlar_lote_validade && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              {selectedProduto ? (
                <LotesComponent
                  produtoId={selectedProduto?.id_produto}
                  produtoNome={selectedProduto?.nome_produto}
                />
              ) : (
                 <Alert severity="warning">
                    Por favor, salve o produto antes de gerenciar lotes.
                 </Alert>
              )}
            </Stack>
          )}

        </DialogContent>

        {!isMobile && (
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSave} variant="contained">
              Salvar
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Dialog para Criar Novo Grupo */}
      <Dialog
        open={openGrupoDialog}
        onClose={handleCloseGrupoDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Novo Grupo de Produto
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nome do Grupo"
              value={novoGrupo.nome}
              onChange={(e) => setNovoGrupo({ ...novoGrupo, nome: e.target.value })}
              variant="outlined"
              required
              placeholder="Ex: Eletrônicos, Móveis, etc."
            />

            <TextField
              fullWidth
              label="Descriçéo"
              multiline
              rows={3}
              value={novoGrupo.descricao}
              onChange={(e) => setNovoGrupo({ ...novoGrupo, descricao: e.target.value })}
              variant="outlined"
              placeholder="Descreva o tipo de produtos deste grupo..."
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseGrupoDialog}>Cancelar</Button>
          <Button onClick={handleSaveGrupo} variant="contained">
            Criar Grupo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Criar Nova Categoria */}
      <Dialog
        open={openCategoriaDialog}
        onClose={() => setOpenCategoriaDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Nova Categoria</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome da Categoria"
            value={novaCategoriaInput}
            onChange={(e) => setNovaCategoriaInput(e.target.value)}
            variant="outlined"
            required
            placeholder="Ex: Construção, Ferramentas, etc."
            sx={{ mt: 1 }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const nome = novaCategoriaInput.trim();
                if (!nome) return;
                if (!categorias.includes(nome)) {
                  setCategorias(prev => [...prev, nome].sort());
                }
                setFormData(prev => ({ ...prev, categoria: nome }));
                setOpenCategoriaDialog(false);
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoriaDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              const nome = novaCategoriaInput.trim();
              if (!nome) { alert('Nome da categoria é obrigatório'); return; }
              if (!categorias.includes(nome)) {
                setCategorias(prev => [...prev, nome].sort());
              }
              setFormData(prev => ({ ...prev, categoria: nome }));
              setOpenCategoriaDialog(false);
            }}
          >
            Criar Categoria
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Criar Nova Marca */}
      <Dialog
        open={openMarcaDialog}
        onClose={() => setOpenMarcaDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Nova Marca</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome da Marca"
            value={novaMarcaInput}
            onChange={(e) => setNovaMarcaInput(e.target.value)}
            variant="outlined"
            required
            placeholder="Ex: Quartzolit, Portobello, etc."
            sx={{ mt: 1 }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const nome = novaMarcaInput.trim();
                if (!nome) return;
                if (!marcas.includes(nome)) {
                  setMarcas(prev => [...prev, nome].sort());
                }
                setFormData(prev => ({ ...prev, marca: nome }));
                setOpenMarcaDialog(false);
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMarcaDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              const nome = novaMarcaInput.trim();
              if (!nome) { alert('Nome da marca é obrigatório'); return; }
              if (!marcas.includes(nome)) {
                setMarcas(prev => [...prev, nome].sort());
              }
              setFormData(prev => ({ ...prev, marca: nome }));
              setOpenMarcaDialog(false);
            }}
          >
            Criar Marca
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Configuração de Depósitos */}
      <Dialog
        open={openDepotDialog}
        onClose={handleCloseDepotDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={isMobile ? Transition : undefined}
      >
        {isMobile && (
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleCloseDepotDialog}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                Configuração de Depósitos
              </Typography>
              <Button autoFocus color="inherit" onClick={handleSaveDepotConfig}>
                Salvar
              </Button>
            </Toolbar>
          </AppBar>
        )}

        {!isMobile && (
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <WarehouseIcon color="primary" />
              Configuração de Depósitos
            </Box>
          </DialogTitle>
        )}

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Configure o preço de custo, preço de venda e estoque mínimo para cada depósito. A quantidade atual é apenas para visualização.
          </Alert>

          {!savedProductId ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Carregando depósitos...</Typography>
            </Box>
          ) : depotValues.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Depósito</strong></TableCell>
                    <TableCell align="center"><strong>Qtd. Atual</strong></TableCell>
                    <TableCell><strong>Preço Custo</strong></TableCell>
                    <TableCell><strong>Preço Venda</strong></TableCell>
                    <TableCell><strong>Estoque Mín.</strong></TableCell>
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
                          label={`${depot.quantidade}`}
                          color="default"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={depot.valor_custo ?? 0}
                          onChange={(e) => handleDepotValueChange(index, 'valor_custo', e.target.value)}
                          size="small"
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
                          }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={depot.valor_venda ?? 0}
                          onChange={(e) => handleDepotValueChange(index, 'valor_venda', e.target.value)}
                          size="small"
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
                          }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={depot.quantidade_minima ?? 0}
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
              Nenhum depósito encontrado para este produto. Aguarde enquanto os depósitos são criados automaticamente.
            </Alert>
          )}
        </DialogContent>

        {!isMobile && (
          <DialogActions sx={{ p: 3 }}>
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
        )}
      </Dialog>

      {/* Dialog de Aviso - Produto Sem Estoque */}
      <Dialog
        open={openEstoqueDialog}
        onClose={handleCloseEstoqueDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          bgcolor: 'warning.main',
          color: 'warning.contrastText',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <WarningIcon />
          Produto Sem Estoque
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {produtoSemEstoque && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Este produto não possui estoque disponível!
              </Alert>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {produtoSemEstoque.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Código: {produtoSemEstoque.codigo_produto}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Categoria: {produtoSemEstoque.categoria}
                </Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
                  <Typography variant="h5" color="error" sx={{ fontWeight: 'bold' }}>
                    Estoque: {produtoSemEstoque.estoque || 0} un.
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                Deseja editar este produto para atualizar as informações?
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseEstoqueDialog}
            color="inherit"
          >
            Fechar
          </Button>
          <Button
            onClick={handleEditarProdutoSemEstoque}
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
          >
            Editar Produto
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Audit Dialog Render */}
      <AuditDialog />

      {/* ===== PREVIEW CALCULAR TRIBUTOS ===== */}
      <Dialog
        open={openPreviewTributosDialog}
        onClose={() => setOpenPreviewTributosDialog(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: { minHeight: '80vh' } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalculateIcon />
            <Typography variant="h6" fontWeight="bold">
              Calcular Tributos — Preview de Alterações
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {!previewTributosLoading && (
              <Badge badgeContent={selectedPreviewIds.length} color="warning" showZero>
                <Chip
                  label={`${previewStats.com_mudancas} com mudanças | ${previewStats.ncm_suspeitos} NCM suspeitos`}
                  size="small"
                  sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 'bold' }}
                />
              </Badge>
            )}
            <IconButton onClick={() => setOpenPreviewTributosDialog(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {previewTributosLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={48} />
              <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                Analisando produtos pelo NCM... aguarde.
              </Typography>
              <LinearProgress sx={{ mt: 2 }} />
            </Box>
          ) : (
            <>
              {/* Status da API do Governo */}
              <Alert 
                severity={previewStats.api_disponivel ? "success" : "info"}
                sx={{ m: 2, borderRadius: 2 }}
                icon={previewStats.api_disponivel ? <CheckCircleIcon /> : <InfoIcon />}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    {previewStats.api_disponivel 
                      ? "🎯 API do Governo ATIVA - Dados Oficiais da Receita Federal"
                      : "📊 Modo Offline - Usando Banco de Dados Local"}
                  </Typography>
                  <Typography variant="body2">
                    {previewStats.api_disponivel
                      ? "As alíquotas de IBS/CBS serão calculadas pela API oficial do governo quando você clicar em 'Aplicar'."
                      : "Para usar dados oficiais da Receita Federal, inicie a API do governo:"}
                  </Typography>
                  {!previewStats.api_disponivel && (
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: 'grey.100', borderRadius: 1, fontFamily: 'monospace' }}>
                      <Typography variant="caption" component="div">
                        <strong>1.</strong> Abra o PowerShell na pasta:<br/>
                        <code>C:\Projetos\SistemaGerencial\4_Calculadora_Fiscal\Calculadora_Gov_Oficial\calculadora</code>
                      </Typography>
                      <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                        <strong>2.</strong> Execute: <code style={{ bgcolor: 'white', px: 0.5, py: 0.25, borderRadius: '3px' }}>java -jar api-regime-geral.jar</code>
                      </Typography>
                      <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                        <strong>3.</strong> Aguarde até ver "Started Application" e clique em "Calcular Tributos" novamente
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Alert>
              {/* Barra de ações */}
              <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const comMudancas = previewTributosData.filter(x => x.tem_mudancas).map(x => x.id);
                    setSelectedPreviewIds(comMudancas);
                  }}
                >
                  Selecionar com mudanças ({previewTributosData.filter(x => x.tem_mudancas).length})
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setSelectedPreviewIds(previewTributosData.map(x => x.id))}
                >
                  Selecionar todos ({previewTributosData.length})
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={() => setSelectedPreviewIds([])}
                >
                  Desmarcar todos
                </Button>
                <Divider orientation="vertical" flexItem />
                <Tooltip title="Quando ativo, mostra apenas produtos que terão algum campo alterado">
                  <Button
                    size="small"
                    variant={previewFiltroMudancas && !previewFiltroSuspeitos ? 'contained' : 'outlined'}
                    color="secondary"
                    onClick={() => { setPreviewFiltroMudancas(true); setPreviewFiltroSuspeitos(false); }}
                  >
                    🔍 Apenas com mudanças
                  </Button>
                </Tooltip>
                <Tooltip title="Mostra produtos cujo NCM pode estar incorreto (descrição NCM diferente do produto)">
                  <Button
                    size="small"
                    variant={previewFiltroSuspeitos ? 'contained' : 'outlined'}
                    color="error"
                    onClick={() => { setPreviewFiltroSuspeitos(true); setPreviewFiltroMudancas(false); }}
                    startIcon={<WarningIcon />}
                  >
                    NCM Suspeito ({previewStats.ncm_suspeitos})
                  </Button>
                </Tooltip>
                <Tooltip title="Mostra todos os produtos com NCM">
                  <Button
                    size="small"
                    variant={!previewFiltroMudancas && !previewFiltroSuspeitos ? 'contained' : 'outlined'}
                    color="inherit"
                    onClick={() => { setPreviewFiltroMudancas(false); setPreviewFiltroSuspeitos(false); }}
                  >
                    📋 Todos os produtos
                  </Button>
                </Tooltip>
                <Box sx={{ ml: 'auto' }}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPreviewIds.length} selecionado(s)
                  </Typography>
                </Box>
              </Box>
              <Alert severity="info" sx={{ mx: 2, mt: 1, mb: 0 }} icon={false}>
                <Typography variant="caption">
                  <strong>O que será atualizado:</strong> CST IBS/CBS, Classificação Fiscal (cClassTrib), alíquotas IBS e CBS — com base na tabela NCM/LC 214.
                  CFOP, CST ICMS, PIS, COFINS e IPI <strong>não são alterados</strong> pois dependem do regime tributário da empresa.
                </Typography>
              </Alert>

              {/* Tabela de preview */}
              {(() => {
                const visibleItems = previewFiltroSuspeitos
                  ? previewTributosData.filter(x => x.ncm_suspeito)
                  : previewFiltroMudancas
                    ? previewTributosData.filter(x => x.tem_mudancas)
                    : previewTributosData;
                return (
              <TableContainer sx={{ maxHeight: '55vh' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: previewFiltroSuspeitos ? 'error.dark' : 'primary.dark', color: 'white', fontWeight: 'bold', fontSize: '0.75rem' } }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          sx={{ color: 'white' }}
                          indeterminate={selectedPreviewIds.length > 0 && selectedPreviewIds.length < visibleItems.length}
                          checked={visibleItems.length > 0 && visibleItems.every(x => selectedPreviewIds.includes(x.id))}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedPreviewIds(visibleItems.map(x => x.id));
                            else setSelectedPreviewIds([]);
                          }}
                        />
                      </TableCell>
                      <TableCell>Produto</TableCell>
                      <TableCell>NCM / Descrição</TableCell>
                      <TableCell align="center">CST IBS/CBS<br/>atual → novo</TableCell>
                      <TableCell align="center">Classificação Fiscal<br/>atual → nova</TableCell>
                      <TableCell align="center">Alíq. IBS (%)<br/>atual → nova</TableCell>
                      <TableCell align="center">Alíq. CBS (%)<br/>atual → nova</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleItems.map(item => {
                      const selected = selectedPreviewIds.includes(item.id);
                      const hasMudanca = item.tem_mudancas;
                      const isSuspeito = item.ncm_suspeito;
                      return (
                        <TableRow
                          key={item.id}
                          hover
                          selected={selected}
                          sx={{
                            bgcolor: selected ? 'action.selected' : isSuspeito ? '#fff3e0' : hasMudanca ? 'warning.lighter' : 'inherit',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                          onClick={() => {
                            setSelectedPreviewIds(prev =>
                              prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]
                            );
                          }}
                        >
                          <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                            <Checkbox
                              size="small"
                              checked={selected}
                              onChange={() => {
                                setSelectedPreviewIds(prev =>
                                  prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]
                                );
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                              {isSuspeito && (
                                <Tooltip title="NCM suspeito: a descrição do NCM parece não corresponder ao produto. Verifique antes de aplicar.">
                                  <WarningIcon color="warning" sx={{ fontSize: 16, mt: 0.3, flexShrink: 0 }} />
                                </Tooltip>
                              )}
                              <Typography variant="body2" fontWeight={hasMudanca || isSuspeito ? 'bold' : 'normal'} noWrap sx={{ maxWidth: 200, color: isSuspeito ? 'warning.dark' : 'inherit' }}>
                                {item.nome}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.ncm} size="small" variant="outlined" sx={{ mb: 0.5, borderColor: isSuspeito ? 'error.main' : undefined, color: isSuspeito ? 'error.main' : undefined }} />
                            {item.descricao_ncm && (
                              <Typography variant="caption" color={isSuspeito ? 'error.main' : 'text.secondary'} noWrap sx={{ display: 'block', maxWidth: 200, fontStyle: isSuspeito ? 'italic' : 'normal' }}>
                                {isSuspeito && '⚠️ '}{item.descricao_ncm}
                              </Typography>
                            )}
                          </TableCell>
                          {/* CST IBS/CBS */}
                          <TableCell align="center">
                            {item.mudancas?.cst_ibs_cbs ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <Chip label={item.mudancas.cst_ibs_cbs.atual || '—'} size="small" />
                                <Typography variant="caption">→</Typography>
                                <Chip label={item.mudancas.cst_ibs_cbs.novo} size="small" color="info" />
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">{item.valores_atuais.cst_ibs_cbs || '—'}</Typography>
                            )}
                          </TableCell>
                          {/* Classificação Fiscal */}
                          <TableCell align="center">
                            {item.mudancas?.classificacao_fiscal ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                <Chip label={item.mudancas.classificacao_fiscal.atual || '—'} size="small" />
                                <Typography variant="caption">→</Typography>
                                <Chip label={item.mudancas.classificacao_fiscal.novo} size="small" color="success" />
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">{item.valores_atuais.classificacao_fiscal || '—'}</Typography>
                            )}
                          </TableCell>
                          {/* IBS alíquota */}
                          <TableCell align="center">
                            {item.mudancas?.ibs_aliquota ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <Chip label={`${item.mudancas.ibs_aliquota.atual}%`} size="small" />
                                <Typography variant="caption">→</Typography>
                                <Chip label={`${item.mudancas.ibs_aliquota.novo}%`} size="small" color="warning" />
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">{item.valores_atuais.ibs_aliquota ?? '—'}%</Typography>
                            )}
                          </TableCell>
                          {/* CBS alíquota */}
                          <TableCell align="center">
                            {item.mudancas?.cbs_aliquota ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <Chip label={`${item.mudancas.cbs_aliquota.atual}%`} size="small" />
                                <Typography variant="caption">→</Typography>
                                <Chip label={`${item.mudancas.cbs_aliquota.novo}%`} size="small" color="warning" />
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">{item.valores_atuais.cbs_aliquota ?? '—'}%</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {visibleItems.length === 0 && !previewTributosLoading && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            {previewFiltroSuspeitos ? 'Nenhum produto com NCM suspeito detectado.' : previewFiltroMudancas ? 'Nenhum produto com mudanças identificadas.' : 'Nenhum produto encontrado.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
                );
              })()}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {selectedPreviewIds.length > 0
              ? `${selectedPreviewIds.length} produto(s) selecionado(s) para atualização`
              : 'Nenhum produto selecionado'}
          </Typography>
          <Button
            onClick={() => setOpenPreviewTributosDialog(false)}
            color="inherit"
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAplicarTributosSelecionados}
            variant="contained"
            color="primary"
            disabled={selectedPreviewIds.length === 0 || loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CalculateIcon />}
          >
            Aplicar em {selectedPreviewIds.length} produto(s)
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Cadastrar novo CST IBS/CBS ──────────────────────────────── */}
      <Dialog open={openCstDialog} onClose={() => setOpenCstDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cadastrar CST — Código de Situação Tributária</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Código CST (ex: 900)"
              value={newCstCodigo}
              onChange={e => setNewCstCodigo(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 10 }}
            />
            <TextField
              label="Descrição"
              value={newCstDescricao}
              onChange={e => setNewCstDescricao(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            {cstList.length > 0 && (
              <>
                <Typography variant="subtitle2" color="text.secondary">CST cadastrados:</Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  {cstList.map(c => (
                    <Typography key={c.id} variant="body2">{c.codigo} — {c.descricao}</Typography>
                  ))}
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCstDialog(false)} color="inherit">Fechar</Button>
          <Button
            onClick={handleSaveCst}
            variant="contained"
            color="primary"
            disabled={cstSaving}
            startIcon={cstSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          >
            Salvar CST
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Cadastrar nova cClassTrib ───────────────────────────────── */}
      <Dialog open={openClassTribDialog} onClose={() => setOpenClassTribDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cadastrar cClassTrib — Classificação Tributária</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Código cClassTrib (ex: 000018)"
              value={newCtCodigo}
              onChange={e => setNewCtCodigo(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 10 }}
            />
            <TextField
              label="Descrição"
              value={newCtDescricao}
              onChange={e => setNewCtDescricao(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <FormControl fullWidth>
              <InputLabel>CST vinculado (opcional)</InputLabel>
              <Select
                value={newCtCst}
                onChange={e => setNewCtCst(e.target.value)}
                label="CST vinculado (opcional)"
              >
                <MenuItem value="">— Nenhum —</MenuItem>
                {cstList.map(c => (
                  <MenuItem key={c.id} value={c.codigo}>{c.codigo} — {c.descricao}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {classTribList.length > 0 && (
              <>
                <Typography variant="subtitle2" color="text.secondary">Classificações cadastradas:</Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  {classTribList.map(c => (
                    <Typography key={c.id} variant="body2">{c.codigo} — {c.descricao}{c.cst ? ` [CST: ${c.cst}]` : ''}</Typography>
                  ))}
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClassTribDialog(false)} color="inherit">Fechar</Button>
          <Button
            onClick={handleSaveClassTrib}
            variant="contained"
            color="primary"
            disabled={ctSaving}
            startIcon={ctSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          >
            Salvar cClassTrib
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ProdutoPageResponsive;