import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  List as ListIcon,
  Clear as ClearIcon,
  PictureAsPdf as PdfIcon,
  WhatsApp as WhatsAppIcon,
  Edit as EditIcon,
  AttachMoney as MoneyIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import mockAPI from '../services/mockAPI';
import useImpressaoVenda from '../hooks/useImpressaoVenda';
import { useAuth } from '../context/AuthContext';
import { useOfflineSync } from '../context/OfflineSyncContext';
import { 
  salvarEstadoVendas,
  carregarEstadoVendas,
  limparEstadoVendas,
  salvarVendaOffline,
  buscarParametrosCache,
  cachearParametros,
  cachearOperacoes,
  cachearClientes,
  cachearVendedores,
  cachearProdutos,
  cachearFormasPagamento,
  buscarOperacoesCache,
  buscarClientesCacheAll,
  buscarVendedoresCache,
  buscarProdutosCacheAll,
  buscarFormasPagamentoCache
} from '../utils/terminalCacheDB';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import promocaoService from '../services/promocaoService';
import WhatsAppQuickSend, { useWhatsAppTemplates } from './WhatsAppQuickSend';
import { CalculadoraRevestimento, CalculadoraTinta, BotoesCalculadora } from './CalculadorasConstrucao';

console.log('📦 [Vendas.jsx] INÍCIO DO CARREGAMENTO DO MÓDULO');
console.log('📦 [Vendas.jsx] Versão: v3.0 - Com logs de depuração detalhados');

// Função auxiliar para formatar data sem conversão de timezone
const formatarDataLocal = (dataString) => {
  if (!dataString) return '-';
  // Adiciona 'T00:00:00' para forçar interpretação como local, não UTC
  const data = new Date(dataString + 'T00:00:00');
  return data.toLocaleDateString('pt-BR');
};

// Configura??o de baseURL removida - usar axiosInstance do AuthContext

// Configurar interceptor do axios para incluir token
axios.interceptors.request.use(
  (config) => {
    // Debug completo do localStorage
    console.log('🔍 DEBUG COMPLETO DO LOCALSTORAGE:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      console.log(`   ${key}:`, value ? value.substring(0, 50) + '...' : 'null');
    }

    // Tentar várias chaves de token possíveis (accessToken PRIMEIRO!)
    const possibleTokenKeys = [
      'accessToken', 'access_token', 'token', 'authToken', 'access', 'jwt', 'user_token',
      'auth_token', 'sessionToken', 'bearer_token', 'apiToken', 'refreshToken'
    ];

    let token = null;
    let tokenKey = null;

    for (const key of possibleTokenKeys) {
      const foundToken = localStorage.getItem(key);
      if (foundToken && foundToken !== 'null' && foundToken !== 'undefined') {
        token = foundToken;
        tokenKey = key;
        console.log(`🔑 TOKEN ENCONTRADO na chave '${key}':`, token.substring(0, 30) + '...');
        break;
      }
    }

    // Verificar também se há um objeto user com token dentro
    const userStr = localStorage.getItem('user');
    if (!token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) {
          token = user.token;
          tokenKey = 'user.token';
          console.log('🔑 TOKEN ENCONTRADO no objeto user:', token.substring(0, 30) + '...');
        }
      } catch (e) {
        console.log('❌ Erro ao parsear user do localStorage:', e);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`✅ Header Authorization adicionado (fonte: ${tokenKey})`);
    } else {
      console.log('❌ NENHUM TOKEN VÁLIDO ENCONTRADO em nenhuma chave!');
      console.log('🔍 Chaves testadas:', possibleTokenKeys.join(', '));
    }

    // Mostra URL completa (axios já concatena baseURL + url automaticamente)
    const fullUrl = config.url?.startsWith('http') ? config.url : (config.baseURL || '') + config.url;
    console.log('📡 Requisição para:', fullUrl);
    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor:', error);
    return Promise.reject(error);
  }
);

const Vendas = ({ embedded = false, initialMode, initialModel, onClose, onSaveSuccess }) => {
  console.log('🚀 [Vendas.jsx] COMPONENTE INICIANDO - Props:', { embedded, initialMode, initialModel });
  
  const location = useLocation();
  console.log('📍 [Vendas.jsx] Location:', location.pathname);
  
  // Hook de autenticação (DEVE VIR PRIMEIRO!)
  console.log('🔐 [Vendas.jsx] Chamando useAuth...');
  const { axiosInstance, user } = useAuth();
  console.log('✅ [Vendas.jsx] useAuth retornou:', { hasAxios: !!axiosInstance, hasUser: !!user });
  
  console.log('🌐 [Vendas.jsx] Chamando useOfflineSync...');
  const { servidorOk, isOnline } = useOfflineSync();
  console.log('✅ [Vendas.jsx] useOfflineSync retornou:', { servidorOk, isOnline });

  // Hook de impressão (precisa do axiosInstance)
  console.log('🖨️  [Vendas.jsx] Chamando useImpressaoVenda...');
  const {
    loading: loadingImpressao,
    gerarPDF,
    imprimirDireto,
    compartilharWhatsApp
  } = useImpressaoVenda(axiosInstance);

  // Hook de templates WhatsApp
  const templates = useWhatsAppTemplates();

  // Estados principais
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modo atual: 'lista' ou 'nova'
  const [modo, setModo] = useState((initialMode || location.state?.modo) === 'nova' ? 'nova' : 'lista');
  
  // Estado para controlar modal de nova venda
  const [openModalNovaVenda, setOpenModalNovaVenda] = useState(initialMode === 'nova');
  const [showLucratividade, setShowLucratividade] = useState(false);

  // Dados para formulário (declarados antes dos useEffects para evitar TDZ)
  const [venda, setVenda] = useState({
    numero_documento: '',
    data_venda: new Date().toISOString().split('T')[0],
    id_operacao: '',
    id_cliente: '',
    id_vendedor: '',
    observacoes: '',
    desconto: 0,
    tipo_desconto_geral: 'valor',
    taxa_entrega: 0,
    valor_total: 0,
    itens: [],
    venda_futura_origem: null // ID da venda de origem quando for entrega
  });

  // Item sendo adicionado (declarado antes dos useEffects para evitar TDZ)
  const [novoItem, setNovoItem] = useState({
    id_produto: '',
    quantidade: 1,
    valor_unitario: 0,
    desconto: 0,
    tipo_desconto: 'valor',
    cfop: '',
    cst_csosn: ''
  });

  useEffect(() => {
    if (initialMode) {
      setModo(initialMode);
    } else if (location.state?.modo === 'nova') {
      setModo('nova');
    }
  }, [location, initialMode]);

  // 🔹 RESTAURAR ESTADO SALVO DO INDEXEDDB (Persistência entre navegações)
  useEffect(() => {
    const restaurarEstadoSalvo = async () => {
      try {
        const estadoSalvo = await carregarEstadoVendas();
        if (estadoSalvo && modo === 'nova') {
          console.log('✅ Restaurando estado salvo de Vendas');
          
          // Restaurar dados da venda
          if (estadoSalvo.venda) setVenda(estadoSalvo.venda);
          if (estadoSalvo.novoItem) setNovoItem(estadoSalvo.novoItem);
          
          // Mostrar mensagem de sucesso
          setSuccess('✅ Venda restaurada! Você pode continuar de onde parou.');
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (err) {
        console.error('Erro ao restaurar estado de Vendas:', err);
      }
    };
    
    restaurarEstadoSalvo();
  }, [modo]); // Executa quando o modo muda

  // 🔹 AUTO-SAVE: Salva automaticamente o estado quando houver mudanças
  useEffect(() => {
    // Não salvar se não estiver no modo 'nova' ou se não houver dados
    if (modo !== 'nova' || !venda.id_operacao) return;
    
    // Debounce: aguarda 1 segundo após a última mudança para salvar
    const timeoutId = setTimeout(async () => {
      try {
        const estadoSerializavel = JSON.parse(JSON.stringify({
          venda,
          novoItem
        }));
        
        await salvarEstadoVendas(estadoSerializavel);
        console.log('💾 [AUTO-SAVE] Estado de Vendas salvo automaticamente');
      } catch (err) {
        console.error('❌ [AUTO-SAVE] Erro ao salvar estado de Vendas:', err);
      }
    }, 1000); // Aguarda 1 segundo de "silêncio" antes de salvar

    return () => clearTimeout(timeoutId);
  }, [venda, novoItem, modo]);

  // Dados das listas
  const [operacoes, setOperacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [vendasFuturasPendentes, setVendasFuturasPendentes] = useState([]);
  // Regime tributário da empresa: 'simples_nacional' | 'lucro_presumido' | 'lucro_real'
  const [regimeTributario, setRegimeTributario] = useState('lucro_presumido');

  // Efeito para selecionar operação baseada no modelo inicial
  useEffect(() => {
    if (initialModel && operacoes.length > 0 && modo === 'nova' && !venda.id_operacao) {
      console.log(`🔄 Pre-selecionando operação para modelo ${initialModel}`);
      const opCompativel = operacoes.find(op => String(op.modelo_documento) === String(initialModel));
      
      if (opCompativel) {
        console.log(`✅ Operação encontrada: ${opCompativel.nome_operacao}`);
        // Atualiza a venda com a operação
        setVenda(prev => ({ 
          ...prev, 
          id_operacao: opCompativel.id_operacao 
        }));
        
        // Dispara carga do próximo número se usar auto numeração
        if (opCompativel.usa_auto_numeracao) {
           const proximo = opCompativel.proximo_numero_nf || 1;
           setVenda(prev => ({ ...prev, numero_documento: String(proximo) }));
        }
      } else {
        console.warn(`⚠️ Nenhuma operação encontrada com modelo_documento = ${initialModel}`);
      }
    }
  }, [initialModel, operacoes, modo]);

  // Estados para limite de crédito
  const [limiteCliente, setLimiteCliente] = useState(null);
  const [showLimiteInfo, setShowLimiteInfo] = useState(false);

  // Estados para crédito do cliente
  const [creditoCliente, setCreditoCliente] = useState(0);
  const [showCreditoModal, setShowCreditoModal] = useState(false);
  const [usarCredito, setUsarCredito] = useState(false);
  const [decisaoCreditoTomada, setDecisaoCreditoTomada] = useState(false);

  // Estados para cashback do cliente
  const [showCashbackModal, setShowCashbackModal] = useState(false);
  const [decisaoCashbackTomada, setDecisaoCashbackTomada] = useState(false);

  // Estados para promoções
  const [promocoesAtivas, setPromocoes] = useState([]);

  // Refs para navegação por teclado
  const quantidadeRef = useRef(null);
  const valorUnitarioRef = useRef(null);
  const descontoRef = useRef(null);
  const btnAdicionarRef = useRef(null);

  // Estados para calculadoras de construção
  const [calcRevestimentoAberto, setCalcRevestimentoAberto] = useState(false);
  const [calcTintaAberto, setCalcTintaAberto] = useState(false);
  const [produtoParaCalculadora, setProdutoParaCalculadora] = useState(null);
  const [parametrosConstrucao, setParametrosConstrucao] = useState(null);

  // Estados para sugestão de variações (produto pai)
  const [variacoesModal, setVariacoesModal] = useState(false);
  const [variacoesDisponiveis, setVariacoesDisponiveis] = useState([]);
  const [produtoPaiSelecionado, setProdutoPaiSelecionado] = useState(null);

  // Estado para sugestão de produto pai opcional (complementar) — suporta múltiplos
  const [produtoPaiOpcionalModal, setProdutoPaiOpcionalModal] = useState(false);
  const [produtoPaiOpcionalData, setProdutoPaiOpcionalData] = useState([]); // array de produtos
  const [produtoFilhoOrigem, setProdutoFilhoOrigem] = useState(null);
  const [areaProdutoFilho, setAreaProdutoFilho] = useState(0);
  const [qtdSugeridaPai, setQtdSugeridaPai] = useState({}); // mapa { id_produto: quantidade }

  // Estados para modal de exclusão
  const [openExcluirModal, setOpenExcluirModal] = useState(false);
  const [vendaParaExcluir, setVendaParaExcluir] = useState(null);
  const [contasPendentesParaExcluir, setContasPendentesParaExcluir] = useState([]);

  // Estados para controle de limite de crédito
  const [openLimiteModal, setOpenLimiteModal] = useState(false);
  const [limiteInfo, setLimiteInfo] = useState(null);
  const [senhaSupervisor, setSenhaSupervisor] = useState({ username: '', password: '' });
  const [verificandoSenha, setVerificandoSenha] = useState(false);
  const [autorizacaoSupervisor, setAutorizacaoSupervisor] = useState(false); // Flag para pular validação após autorização

  // Estado para modal de bloqueio de venda
  const [openBloqueioModal, setOpenBloqueioModal] = useState(false);
  const [mensagemBloqueio, setMensagemBloqueio] = useState('');

  // === Estados para modal de aprovação de desconto via WhatsApp ===
  const [openDescontoModal, setOpenDescontoModal] = useState(false);
  const [infoDesconto, setInfoDesconto] = useState(null);
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState(false);
  const [aguardandoAprovacaoWhatsApp, setAguardandoAprovacaoWhatsApp] = useState(false);
  const [solicitacaoDesconto, setSolicitacaoDesconto] = useState(null);
  const [aprovacaoDescontoViaWhatsApp, setAprovacaoDescontoViaWhatsApp] = useState(false);
  const [senhaSupervisorDesconto, setSenhaSupervisorDesconto] = useState({ username: '', password: '' });
  const [verificandoSenhaDesconto, setVerificandoSenhaDesconto] = useState(false);
  const [whatsappDisponivelDesconto, setWhatsappDisponivelDesconto] = useState(null);

  // Estados para modal de financeiro
  const [openFinanceiroModal, setOpenFinanceiroModal] = useState(false);
  const [vendaParaFinanceiro, setVendaParaFinanceiro] = useState(null);
  const [dadosVendaOffline, setDadosVendaOffline] = useState(null); // venda aguardando financeiro offline
  const [formaPagamento, setFormaPagamento] = useState('');
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split('T')[0]);
  const [contaBancaria, setContaBancaria] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [centroCusto, setCentroCusto] = useState('');
  const [diasVencimentoFormaPagamento, setDiasVencimentoFormaPagamento] = useState(0);
  const [alertaLimiteFinanceiro, setAlertaLimiteFinanceiro] = useState(null);
  const [valorPago, setValorPago] = useState(0);
  const [troco, setTroco] = useState(0);

  // Estados para modal de cadastro de cliente
  const [openClienteModal, setOpenClienteModal] = useState(false);
  const [clienteForm, setClienteForm] = useState({
    nome_razao_social: '',
    nome_fantasia: '',
    cpf_cnpj: '',
    rg_ie: '',
    telefone: '',
    celular: '',
    whatsapp: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    limite_credito: '0.00',
    data_nascimento: '',
    sexo: ''
  });

  // Estado para status financeiro das vendas
  const [statusFinanceiro, setStatusFinanceiro] = useState({});

  // Estados para modal de atraso
  const [openAtrasoModal, setOpenAtrasoModal] = useState(false);
  const [atrasoInfo, setAtrasoInfo] = useState(null);
  const [acaoAtrasoAtual, setAcaoAtrasoAtual] = useState('alertar');

  // Estados para modal de estoque
  const [openEstoqueModal, setOpenEstoqueModal] = useState(false);
  const [estoqueInfo, setEstoqueInfo] = useState(null);
  const [acaoEstoqueAtual, setAcaoEstoqueAtual] = useState('nao_validar');
  const [itemPendenteEstoque, setItemPendenteEstoque] = useState(null);
  const [filaValidacoes, setFilaValidacoes] = useState([]);

  // Estados para seleção de lote
  const [openSelecionarLote, setOpenSelecionarLote] = useState(false);
  const [lotesDisponiveis, setLotesDisponiveis] = useState([]);
  const [lotePreSelecionado, setLotePreSelecionado] = useState(null);
  const [controlaProdutoLote, setControlaProdutoLote] = useState(false);

  // Função para processar a próxima validação da fila
  const processarProximaValidacao = () => {
    console.log('🔄 Processando próxima validação da fila (Vendas) - entrando');

    setFilaValidacoes(prevFila => {
      console.log('📋 Fila atual (dentro do setter):', prevFila);
      if (!prevFila || prevFila.length === 0) {
        console.log('✅ Fila vazia - Todas as validações processadas (Vendas)');
        return prevFila || [];
      }

      const proximaValidacao = prevFila[0];
      console.log('🎯 Abrindo modal (Vendas) para:', proximaValidacao.tipo, proximaValidacao.dados);

      // Preparar e abrir modal para a validação atual
      if (proximaValidacao.tipo === 'estoque') {
        setEstoqueInfo(proximaValidacao.dados);
        setItemPendenteEstoque({ ...proximaValidacao.item, finalizacao: true });
        setAcaoEstoqueAtual(proximaValidacao.acao);
        setOpenEstoqueModal(true);
      }

      // Retornar a fila restante (remove o primeiro)
      const restante = prevFila.slice(1);
      console.log('📋 Fila após remoção (restante):', restante);
      return restante;
    });
  };

  // Estados para listas de apoio (financeiro)
  const [contasBancarias, setContasBancarias] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [centrosCusto, setCentrosCusto] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);

  // Estados para filtros de orçamento/venda/condicional
  const [filtroTipoOperacao, setFiltroTipoOperacao] = useState('todos'); // todos, orcamento, venda, condicional
  const [filtroPeriodo, setFiltroPeriodo] = useState('30'); // 10, 30, 60, 90, todos
  const [filtroTexto, setFiltroTexto] = useState(''); // pesquisa por cliente, doc, id
  const [carregandoVendas, setCarregandoVendas] = useState(false);
  const [openConverterModal, setOpenConverterModal] = useState(false);

  // Estado para bloquear edição de venda paga
  const [vendaBloqueadaParaEdicao, setVendaBloqueadaParaEdicao] = useState(false);
  const [vendaParaConverter, setVendaParaConverter] = useState(null);
  const [operacaoConverterSelecionada, setOperacaoConverterSelecionada] = useState('');

  // Estado para modal de confirmação de imagens no PDF
  const [openImagemPDFModal, setOpenImagemPDFModal] = useState(false);
  const [vendaParaPDF, setVendaParaPDF] = useState(null);

  // Estados para modal de dados do Veículo Novo
  const [openVeiculoModal, setOpenVeiculoModal] = useState(false);
  const [veiculoItemId, setVeiculoItemId] = useState(null);
  const veiculoDadosVazios = {
    tp_op: '0', chassi: '', c_cor: '', x_cor: '', pot: '', cilin: '',
    peso_l: '', peso_b: '', n_serie: '', tp_comb: '16', n_motor: '',
    cmt: '', dist: '', ano_mod: new Date().getFullYear(), ano_fab: new Date().getFullYear(),
    tp_pint: 'S', tp_veic: '02', esp_veic: '07', vin: 'R',
    cond_veic: '1', c_mod: '', c_cor_denatran: '01', lota: '', tp_rest: '0'
  };
  const [veiculoDadosForm, setVeiculoDadosForm] = useState({ ...veiculoDadosVazios });

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
    gerarNumeroDocumento();
    carregarPromocoes();
  }, []);

  // Carregar promoções a cada 10 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      carregarPromocoes();
    }, 10000);
    return () => clearInterval(intervalo);
  }, []);

  // Recalcular totais quando itens, desconto ou taxa_entrega mudam
  useEffect(() => {
    calcularTotais();
  }, [venda.itens, venda.desconto, venda.taxa_entrega]);

  // Buscar limite de crédito quando cliente mudar
  useEffect(() => {
    console.log('🔄 useEffect limite disparado!');
    console.log('  - Cliente ID:', venda.id_cliente, 'Tipo:', typeof venda.id_cliente);
    console.log('  - Modo atual:', modo);
    console.log('  - Cliente existe?', !!venda.id_cliente);
    console.log('  - Modo é nova?', modo === 'nova');

    if (venda.id_cliente && modo === 'nova' && !vendaBloqueadaParaEdicao) {
      console.log('✅ Condições atendidas! Buscando limite, crédito e cashback do cliente...');
      setDecisaoCashbackTomada(false); // Resetar decisão de cashback ao trocar cliente
      buscarLimiteCliente(venda.id_cliente);
      verificarCashbackCliente(venda.id_cliente); // 💰 Verificar cashback disponível
    } else {
      console.log('❌ Condições NÃO atendidas para buscar limite');
      if (!venda.id_cliente) console.log('  ⚠️ Motivo: Cliente não selecionado');
      if (modo !== 'nova') console.log('  ⚠️ Motivo: Modo não é "nova" (atual: "' + modo + '")');
      setShowLimiteInfo(false);
      setLimiteCliente(null);
      setCreditoCliente(0);
    }
  }, [venda.id_cliente, modo]);

  // Recalcular data de vencimento quando forma de pagamento mudar
  useEffect(() => {
    if (formaPagamento && vendaParaFinanceiro) {
      const formaSelecionada = formasPagamento.find(fp => fp.nome_forma === formaPagamento);
      if (formaSelecionada) {
        const diasVenc = formaSelecionada.dias_vencimento || 0;
        setDiasVencimentoFormaPagamento(diasVenc);

        // Calcular nova data de vencimento
        const dataBase = new Date(vendaParaFinanceiro.data_venda || new Date());
        dataBase.setDate(dataBase.getDate() + diasVenc);

        const novaDataVencimento = dataBase.toISOString().split('T')[0];
        setDataVencimento(novaDataVencimento);

        console.log('📅 Data de vencimento calculada:', {
          formaPagamento: formaSelecionada.nome_forma,
          diasVencimento: diasVenc,
          dataVenda: vendaParaFinanceiro.data_venda,
          novaDataVencimento: novaDataVencimento
        });
      }
    }
  }, [formaPagamento, vendaParaFinanceiro, formasPagamento]);

  // Preencher conta, departamento e centro de custo quando forma de pagamento mudar
  useEffect(() => {
    if (formaPagamento && formasPagamento.length > 0) {
      const formaSelecionada = formasPagamento.find(fp => fp.nome_forma === formaPagamento);
      if (formaSelecionada) {
        // Preencher os campos padrão da forma de pagamento
        if (formaSelecionada.id_conta_padrao) {
          setContaBancaria(formaSelecionada.id_conta_padrao);
          console.log('💳 Conta bancária preenchida automaticamente:', formaSelecionada.id_conta_padrao);
        }
        if (formaSelecionada.id_departamento) {
          setDepartamento(formaSelecionada.id_departamento);
          console.log('🏢 Departamento preenchido automaticamente:', formaSelecionada.id_departamento);
        }
        if (formaSelecionada.id_centro_custo) {
          setCentroCusto(formaSelecionada.id_centro_custo);
          console.log('📊 Centro de custo preenchido automaticamente:', formaSelecionada.id_centro_custo);
        }
      }
    }
  }, [formaPagamento, formasPagamento]);

  // Verificar limite em tempo real quando forma de pagamento ou data mudar
  useEffect(() => {
    const verificarLimiteTempoReal = async () => {
      if (!vendaParaFinanceiro || !formaPagamento || !dataVencimento) {
        setAlertaLimiteFinanceiro(null);
        return;
      }

      const operacaoSelecionada = operacoes.find(op => op.id_operacao === vendaParaFinanceiro.id_operacao);
      const validacaoLimite = operacaoSelecionada?.validacao_limite_credito || 'nao_validar';

      if (validacaoLimite === 'nao_validar') {
        setAlertaLimiteFinanceiro(null);
        return;
      }

      // Verificar se data de vencimento é maior que data do documento
      const dataDocumento = new Date(vendaParaFinanceiro.data_venda);
      const dataVenc = new Date(dataVencimento);

      if (dataVenc > dataDocumento) {
        try {
          const valorTotal = parseFloat(vendaParaFinanceiro.valor_total || 0);
          const limiteResponse = await axiosInstance.post('/verificar-limite-cliente/', {
            id_cliente: vendaParaFinanceiro.id_cliente,
            valor_venda: valorTotal
          });

          if (limiteResponse.data.ultrapassa_limite) {
            setAlertaLimiteFinanceiro({
              nomeCliente: limiteResponse.data.cliente.nome,
              limiteCredito: limiteResponse.data.cliente.limite_credito,
              saldoDevedor: limiteResponse.data.cliente.saldo_devedor,
              creditoDisponivel: limiteResponse.data.cliente.credito_disponivel,
              valorExcedente: limiteResponse.data.valor_excedente,
              modoValidacao: validacaoLimite
            });
          } else {
            setAlertaLimiteFinanceiro(null);
          }
        } catch (err) {
          console.error('Erro ao verificar limite:', err);
          setAlertaLimiteFinanceiro(null);
        }
      } else {
        setAlertaLimiteFinanceiro(null);
      }
    };

    verificarLimiteTempoReal();
  }, [formaPagamento, dataVencimento, vendaParaFinanceiro, operacoes]);

  // Buscar vendas futuras pendentes quando operação mudar para tipo destino
  useEffect(() => {
    const operacaoSelecionada = operacoes.find(op => String(op.id_operacao) === String(venda.id_operacao));
    console.log('🔍 [ENTREGA FUTURA] Verificando operação:', {
      id_operacao: venda.id_operacao,
      operacaoSelecionada,
      entrega_futura: operacaoSelecionada?.entrega_futura,
      tipo_entrega_futura: operacaoSelecionada?.tipo_entrega_futura
    });
    if (operacaoSelecionada && operacaoSelecionada.entrega_futura && operacaoSelecionada.tipo_entrega_futura === 'destino') {
      console.log('✅ [ENTREGA FUTURA] Operação destino detectada! Buscando vendas pendentes...');
      buscarVendasFuturasPendentes();
    } else {
      setVendasFuturasPendentes([]);
      setVenda(prev => ({ ...prev, venda_futura_origem: null }));
    }
  }, [venda.id_operacao, operacoes]);

  // 💰 Recalcular valor_total quando desconto ou taxa_entrega mudar
  useEffect(() => {
    if (venda.itens && venda.itens.length > 0) {
      const total = venda.itens.reduce((acc, item) => {
        const quantidade = parseFloat(item.quantidade) || 0;
        const valorUnitario = parseFloat(item.valor_unitario) || 0;
        const descontoItem = parseFloat(item.desconto) || 0;
        const subtotal = (quantidade * valorUnitario) - descontoItem;
        return acc + subtotal;
      }, 0);

      const descontoInput = parseFloat(venda.desconto) || 0;
      const descontoValor = venda.tipo_desconto_geral === 'percentual' ? (total * descontoInput) / 100 : descontoInput;
      const taxaEntrega = parseFloat(venda.taxa_entrega) || 0;
      const valorTotal = total - descontoValor + taxaEntrega;

      // Só atualizar se o valor_total for diferente (evitar loop infinito)
      if (Math.abs(valorTotal - (parseFloat(venda.valor_total) || 0)) > 0.01) {
        console.log('💰 Recalculando valor_total:');
        console.log(`  - Subtotal itens: R$ ${total.toFixed(2)}`);
        console.log(`  - Desconto: R$ ${descontoValor.toFixed(2)} (${venda.tipo_desconto_geral === 'percentual' ? descontoInput + '%' : 'R$'})`);
        console.log(`  - Taxa entrega: R$ ${taxaEntrega.toFixed(2)}`);
        console.log(`  - Valor Total: R$ ${valorTotal.toFixed(2)}`);

        setVenda(prev => ({
          ...prev,
          valor_total: valorTotal
        }));
      }
    }
  }, [venda.desconto, venda.tipo_desconto_geral, venda.taxa_entrega, venda.itens]);

  // Função para buscar limite de crédito do cliente
  const buscarLimiteCliente = async (idCliente) => {
    try {
      console.log('💳 Buscando limite de crédito do cliente:', idCliente);

      const clienteResponse = await axiosInstance.get(`/clientes/${idCliente}/`);
      const cliente = clienteResponse.data;
      console.log('✅ Cliente encontrado:', cliente);

      // VALIDAR LIMITE AO SELECIONAR CLIENTE
      const operacaoSelecionada = operacoes.find(op => op.id_operacao === venda.id_operacao);
      const validacaoLimite = operacaoSelecionada?.validacao_limite_credito || 'nao_validar';

      if (validacaoLimite !== 'nao_validar' && venda.id_operacao) {
        try {
          const limiteResponse = await axiosInstance.post('/verificar-limite-cliente/', {
            id_cliente: idCliente,
            valor_venda: 0 // Verificar limite atual sem adicionar nova venda
          });

          if (limiteResponse.data.ultrapassa_limite) {
            console.log('⚠️ CLIENTE JÁ ESTÁ COM LIMITE EXCEDIDO!');
            setError(
              `⚠️ ATENÇÃO! Cliente já possui limite de crédito excedido!\n` +
              `Limite: R$ ${limiteResponse.data.cliente.limite_credito.toFixed(2)} | ` +
              `Saldo Devedor: R$ ${limiteResponse.data.cliente.saldo_devedor.toFixed(2)} | ` +
              `Disponível: R$ ${limiteResponse.data.cliente.credito_disponivel.toFixed(2)}`
            );
            setTimeout(() => setError(''), 8000);
          }
        } catch (err) {
          console.error('Erro ao verificar limite:', err);
        }
      }

      // VALIDAR ATRASO DO CLIENTE
      const validarAtraso = operacaoSelecionada?.validar_atraso || false;
      const diasTolerancia = operacaoSelecionada?.dias_atraso_tolerancia || 0;
      const acaoAtraso = operacaoSelecionada?.acao_atraso || 'alertar';

      if (validarAtraso && venda.id_operacao) {
        try {
          console.log('⏰ Verificando atraso do cliente...', { diasTolerancia, acaoAtraso });
          const atrasoResponse = await axiosInstance.post('/validar-cliente-atraso/', {
            id_cliente: idCliente,
            dias_tolerancia: diasTolerancia
          });

          if (atrasoResponse.data.em_atraso &&
            atrasoResponse.data.valor_total_atraso > 0 &&
            atrasoResponse.data.qtd_titulos > 0) {
            // Armazenar informações do atraso
            setAtrasoInfo(atrasoResponse.data);
            setAcaoAtrasoAtual(acaoAtraso);
            setOpenAtrasoModal(true);

            // Se for bloquear, limpar cliente
            if (acaoAtraso === 'bloquear') {
              setVenda(prev => ({ ...prev, id_cliente: '' }));
              return;
            }
          }
        } catch (err) {
          console.error('Erro ao verificar atraso:', err);
        }
      }

      // Buscar contas a receber pendentes do cliente
      let contasPendentes = [];
      try {
        console.log('💸 Buscando contas pendentes do cliente:', idCliente);
        // Usar parâmetros: tipo=Receber (contas a receber) e status=Pendente
        const contasResponse = await axiosInstance.get(`/contas/?tipo=Receber&status=Pendente`);
        console.log('📡 Resposta da API:', contasResponse.data);

        const todasContas = Array.isArray(contasResponse.data)
          ? contasResponse.data
          : (contasResponse.data.results || []);

        console.log('📊 Total de contas a receber pendentes:', todasContas.length);
        console.log('📊 Tipo de todasContas:', typeof todasContas, Array.isArray(todasContas));

        // Log da primeira conta para ver a estrutura
        if (todasContas.length > 0) {
          console.log('📋 Exemplo de conta (primeira):', todasContas[0]);
          console.log('📋 Campos da conta:', Object.keys(todasContas[0]));
        }

        // Buscar o nome do cliente pelo ID
        const nomeCliente = cliente.nome_razao_social || cliente.razao_social || cliente.nome;
        console.log('🔍 Procurando contas do cliente:', {
          id: idCliente,
          nome: nomeCliente
        });

        // Filtrar apenas contas do cliente específico
        contasPendentes = todasContas.filter(conta => {
          // Tentar múltiplos campos para o ID do cliente
          const clienteId = conta.id_cliente || conta.cliente_id || conta.id_pessoa;
          const clienteNome = conta.cliente || conta.nome_cliente || conta.pessoa;

          // Comparar por ID (numérico) ou por nome (texto)
          const matchPorId = clienteId && String(clienteId) === String(idCliente);
          const matchPorNome = clienteNome && String(clienteNome) === String(nomeCliente);
          const matchCliente = matchPorId || matchPorNome;

          // Verificar se a parcela NÃO foi paga (data_pagamento deve ser null/vazio)
          const isPendente = !conta.data_pagamento ||
            conta.data_pagamento === null ||
            conta.data_pagamento === '' ||
            conta.data_pagamento === 'null';

          console.log(`  Conta ${conta.id_conta || conta.id}:`, {
            clienteId,
            clienteNome,
            matchPorId,
            matchPorNome,
            matchCliente,
            data_pagamento: conta.data_pagamento,
            isPendente,
            incluir: matchCliente && isPendente
          });

          if (matchCliente && isPendente) {
            console.log(`    ✅ Conta PENDENTE do cliente ${idCliente} (${nomeCliente})`, {
              valor_parcela: conta.valor_parcela,
              valor_original: conta.valor_original,
              saldo_devedor: conta.saldo_devedor,
              data_pagamento: conta.data_pagamento
            });
          }

          return matchCliente && isPendente;
        });

        console.log('📊 Contas pendentes do cliente após filtro:', contasPendentes.length);
        console.log('📋 Detalhes das contas pendentes:', contasPendentes);
      } catch (contasErr) {
        console.warn('⚠️ Erro ao buscar contas pendentes (continuando sem contas):', contasErr);
        console.error('Detalhes do erro:', contasErr.response?.data);
        // Continuar mesmo sem conseguir buscar contas
        contasPendentes = [];
      }

      // Calcular limite utilizado somando o saldo devedor de todas as contas pendentes
      const limiteUtilizado = contasPendentes.reduce((acc, conta) => {
        // Tentar múltiplos campos para o saldo devedor
        let saldoDevedor = 0;

        if (conta.saldo_devedor !== undefined && conta.saldo_devedor !== null) {
          saldoDevedor = parseFloat(conta.saldo_devedor);
        } else if (conta.valor_original !== undefined && conta.valor_pago !== undefined) {
          saldoDevedor = parseFloat(conta.valor_original || 0) - parseFloat(conta.valor_pago || 0);
        } else if (conta.valor !== undefined) {
          saldoDevedor = parseFloat(conta.valor || 0) - parseFloat(conta.valor_pago || 0);
        } else if (conta.valor_parcela !== undefined) {
          saldoDevedor = parseFloat(conta.valor_parcela || 0);
        }

        console.log(`  Conta ${conta.id_conta || conta.id}: Saldo devedor = R$ ${saldoDevedor.toFixed(2)}`);
        console.log(`    Campos disponíveis:`, {
          saldo_devedor: conta.saldo_devedor,
          valor_original: conta.valor_original,
          valor_pago: conta.valor_pago,
          valor: conta.valor,
          valor_parcela: conta.valor_parcela
        });

        return acc + saldoDevedor;
      }, 0);

      const limiteTotal = parseFloat(cliente.limite_credito || 0);
      const limiteDisponivel = limiteTotal - limiteUtilizado;

      // Buscar crédito do cliente usando a rota específica
      let creditoDisponivel = 0;
      try {
        console.log('💳 Buscando créditos do cliente...');
        const creditosResponse = await axiosInstance.get(`/creditos/cliente/${idCliente}/saldo`);

        // Verifica se a resposta é HTML (erro 404 redirecionando para index)
        if (typeof creditosResponse.data === 'string' && creditosResponse.data.includes('<!doctype html>')) {
          console.warn('⚠️ Rota de créditos não implementada no backend (retornou HTML)');
          creditoDisponivel = 0;
        } else {
          const dadosCredito = creditosResponse.data;
          console.log('📋 Dados de crédito:', dadosCredito);
          creditoDisponivel = parseFloat(dadosCredito.saldo_total || 0);
          console.log('💰 Total de crédito disponível: R$', creditoDisponivel.toFixed(2));
        }
      } catch (creditoErr) {
        console.warn('⚠️ Erro ao buscar créditos (continuando sem crédito):', creditoErr.message);
        creditoDisponivel = 0;
      }

      console.log('💰 Resumo do limite:');
      console.log(`  - Limite total: R$ ${limiteTotal.toFixed(2)}`);
      console.log(`  - Limite utilizado: R$ ${limiteUtilizado.toFixed(2)}`);
      console.log(`  - Limite disponível: R$ ${limiteDisponivel.toFixed(2)}`);
      console.log(`  - Crédito disponível: R$ ${creditoDisponivel.toFixed(2)}`);

      setLimiteCliente({
        cliente: cliente.nome_razao_social || cliente.razao_social || cliente.nome || `Cliente ${idCliente}`,
        limiteTotal,
        limiteUtilizado,
        limiteDisponivel
      });
      setCreditoCliente(creditoDisponivel);
      setShowLimiteInfo(true);
    } catch (err) {
      console.error('❌ Erro ao buscar limite do cliente:', err);
      console.error('❌ Detalhes:', err.response?.data);
    }
  };

  // 💰 Função para verificar cashback disponível do cliente
  const verificarCashbackCliente = async (idCliente) => {
    if (!idCliente) return;

    try {
      console.log('💰 Verificando cashback do cliente:', idCliente);

      const response = await axiosInstance.get(`/cashback/saldo/${idCliente}/`);
      const dados = response.data;

      console.log('✅ Dados de cashback:', dados);

      if (parseFloat(dados.saldo_total) > 0) {
        const saldo = parseFloat(dados.saldo_total);
        console.log('💰 Cliente possui cashback de R$', saldo.toFixed(2), '- será perguntado ao finalizar a venda');

        // Apenas armazenar os dados; a decisão será feita ao finalizar a venda via modal
        setVenda(prev => ({
          ...prev,
          cashback_disponivel: saldo,
          cashback_detalhes: dados.cashbacks,
          aplicar_cashback: false
        }));
        setDecisaoCashbackTomada(false);
      } else {
        console.log('ℹ️ Cliente não possui cashback disponível');
        setVenda(prev => ({
          ...prev,
          cashback_disponivel: 0,
          cashback_detalhes: null,
          aplicar_cashback: false
        }));
        setDecisaoCashbackTomada(true); // Sem cashback, não precisa perguntar
      }
    } catch (err) {
      console.error('❌ Erro ao verificar cashback:', err);
      // Não mostrar erro ao usuário, apenas logar
    }
  };

  // Função auxiliar para buscar nome do cliente pelo ID
  const buscarNomeCliente = (idCliente) => {
    if (!idCliente || !clientes.length) return 'Cliente não encontrado';

    const cliente = clientes.find(cli => {
      const id = String(cli.id || cli.pk || cli.ID || cli.id_cliente);
      return id === String(idCliente);
    });

    if (cliente) {
      return cliente.nome_razao_social || cliente.razao_social || cliente.nome_fantasia || cliente.empresa ||
        cliente.nome || cliente.name || cliente.cliente || cliente.title || cliente.nome_cliente || `Cliente ${idCliente}`;
    }

    return `Cliente ${idCliente}`;
  };

  // Função auxiliar para buscar nome do vendedor pelo ID
  const buscarNomeVendedor = (idVendedor) => {
    if (!idVendedor || !vendedores.length) return 'Vendedor não encontrado';

    const vendedor = vendedores.find(vend => {
      const id = String(vend.id || vend.pk || vend.ID || vend.id_vendedor);
      return id === String(idVendedor);
    });

    if (vendedor) {
      return vendedor.nome || vendedor.name || vendedor.first_name || vendedor.username || `Vendedor ${idVendedor}`;
    }

    return `Vendedor ${idVendedor}`;
  };

  // Função para filtrar produtos disponíveis (evitar duplicação)
  const getProdutosDisponiveis = () => {
    if (!produtos.length) return [];

    // IDs dos produtos já adicionados na venda
    const produtosJaAdicionados = venda.itens.map(item => String(item.id_produto));

    // Filtrar produtos que ainda não foram adicionados
    return produtos.filter(prod => {
      const id = String(prod.id_produto || prod.id || prod.pk || prod.ID);
      return !produtosJaAdicionados.includes(id);
    });
  };

  // Função auxiliar para formatar data de forma segura
  const formatarDataSegura = (data) => {
    if (!data) return 'Data não informada';

    try {
      const date = new Date(data);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Função auxiliar melhorada para buscar nome do cliente
  const buscarNomeClienteSeguro = (venda) => {
    // Se já tem o nome na venda, usar ele
    if (venda.nome_cliente && typeof venda.nome_cliente === 'string') {
      return venda.nome_cliente;
    }

    // Senão, buscar pelo ID
    const idCliente = venda.id_cliente;
    if (!idCliente) return 'Cliente não informado';
    if (!clientes.length) return 'Carregando clientes...';

    const cliente = clientes.find(cli => {
      const id = String(cli.id || cli.pk || cli.ID || cli.id_cliente);
      return id === String(idCliente);
    });

    if (cliente) {
      const nome = cliente.razao_social || cliente.nome_fantasia || cliente.empresa ||
        cliente.nome || cliente.name || cliente.cliente || cliente.title || cliente.nome_cliente;
      return nome || `Cliente ${idCliente}`;
    }

    return `Cliente não encontrado (ID: ${idCliente})`;
  };

  // Função auxiliar melhorada para buscar nome do vendedor
  const buscarNomeVendedorSeguro = (venda) => {
    // Se já tem o nome na venda, usar ele
    if (venda.nome_vendedor && typeof venda.nome_vendedor === 'string') {
      return venda.nome_vendedor;
    }

    // Senão, buscar pelo ID
    const idVendedor = venda.id_vendedor;
    if (!idVendedor) return 'Vendedor não informado';
    if (!vendedores.length) return 'Carregando vendedores...';

    const vendedor = vendedores.find(vend => {
      const id = String(vend.id || vend.pk || vend.ID || vend.id_vendedor);
      return id === String(idVendedor);
    });

    if (vendedor) {
      const nome = vendedor.nome || vendedor.name || vendedor.first_name || vendedor.username;
      return nome || `Vendedor ${idVendedor}`;
    }

    return `Vendedor não encontrado (ID: ${idVendedor})`;
  };

  // Gerar número de documento automático
  const gerarNumeroDocumento = async () => {
    try {
      const response = await axios.get('/api/vendas/proximo-numero/');
      setVenda(prev => ({
        ...prev,
        numero_documento: response.data.proximo_numero
      }));
    } catch (err) {
      // Se não conseguir gerar via API, usar número baseado em vendas existentes
      const numeroSequencial = vendas.length + 1;
      const numero = `VND-${String(numeroSequencial).padStart(3, '0')}`;
      setVenda(prev => ({
        ...prev,
        numero_documento: numero
      }));
      console.log('Usando numeração automática local:', numero);
    }
  };

  // Função para carregar vendas com filtro de período via API
  const carregarVendas = async (periodo) => {
    try {
      setCarregandoVendas(true);
      let url = '/vendas/?page_size=5000';
      if (periodo && periodo !== 'todos') {
        const dias = parseInt(periodo);
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - dias);
        const dateFrom = dataLimite.toISOString().split('T')[0];
        url += `&date_from=${dateFrom}`;
      } else if (periodo === 'todos') {
        url += '&sem_limite=1';
      }
      console.log('📡 Carregando vendas:', url);
      const vendasRes = await axiosInstance.get(url);
      const vendasData = vendasRes.data?.results || vendasRes.data;
      const vendasCarregadas = Array.isArray(vendasData) ? vendasData : [];
      console.log('📦 Total de vendas carregadas:', vendasCarregadas.length);
      setVendas(vendasCarregadas);
      await carregarStatusFinanceiro(vendasCarregadas);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
    } finally {
      setCarregandoVendas(false);
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      console.log('🚀 Carregando dados usando AuthContext...');

      try {
        // Usar axiosInstance do AuthContext (já cuida da autenticação automaticamente)
        console.log('📡 Carregando dados reais...');

        const [opRes, cliRes, vendRes, prodRes, vendasRes, contasRes, deptosRes, ccRes, fpRes, empresaRes, paramRes] = await Promise.all([
          axiosInstance.get('/operacoes/'),
          axiosInstance.get('/clientes/'),
          axiosInstance.get('/vendedores/'),
          axiosInstance.get('/produtos/'),
          axiosInstance.get(`/vendas/?page_size=5000&date_from=${(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; })()}`),
          axiosInstance.get('/contas-bancarias/'),
          axiosInstance.get('/departamentos/'),
          axiosInstance.get('/centro-custo/'),
          axiosInstance.get('/formas-pagamento/'),
          axiosInstance.get('/empresa/').catch(() => ({ data: [] })),
          axiosInstance.get('/calculadoras/parametros/').catch(() => ({ data: {} })) // Parâmetros de calculadora
        ]);
        // Carregar regime tributário da empresa
        const empresaData = empresaRes.data.results || empresaRes.data;
        const empresaConfig = Array.isArray(empresaData) ? empresaData[0] : empresaData;
        if (empresaConfig?.regime_tributario) {
          setRegimeTributario(empresaConfig.regime_tributario);
          console.log('📋 Regime tributário:', empresaConfig.regime_tributario);
        }

        // Extrair dados (considerando paginação) e validar arrays
        const operacoesData = opRes.data.results || opRes.data;
        const clientesData = cliRes.data.results || cliRes.data;
        const vendedoresData = vendRes.data.results || vendRes.data;
        const produtosData = prodRes.data.results || prodRes.data;
        const contasData = contasRes.data.results || contasRes.data;
        const deptosData = deptosRes.data.results || deptosRes.data;
        const ccData = ccRes.data.results || ccRes.data;
        const fpData = fpRes.data.results || fpRes.data;
        const parametrosData = paramRes.data;
        
        // Armazenar parâmetros de calculadora
        setParametrosConstrucao(parametrosData);
        console.log('🧮 Parâmetros de calculadora carregados:', parametrosData);

        // FILTRAR operações: ignorar modelo 55 exceto quando usado a partir da tela de NF-e
        const operacoesFiltradas = Array.isArray(operacoesData) ? 
          (initialModel === '55' ? operacoesData : operacoesData.filter(op => String(op.modelo_documento) !== '55')) : [];
        setOperacoes(operacoesFiltradas);
        setClientes(Array.isArray(clientesData) ? clientesData : []);
        setVendedores(Array.isArray(vendedoresData) ? vendedoresData : []);
        setProdutos(Array.isArray(produtosData) ? produtosData : []);
        setContasBancarias(Array.isArray(contasData) ? contasData : []);
        setDepartamentos(Array.isArray(deptosData) ? deptosData : []);
        setCentrosCusto(Array.isArray(ccData) ? ccData : []);
        setFormasPagamento(Array.isArray(fpData) ? fpData : []);

        // ── Salvar no IndexedDB para uso offline ──────────────────────────────
        try {
          await Promise.all([
            cachearOperacoes(Array.isArray(operacoesData) ? operacoesData : []),
            cachearClientes(Array.isArray(clientesData) ? clientesData : []),
            cachearVendedores(Array.isArray(vendedoresData) ? vendedoresData : []),
            cachearProdutos(Array.isArray(produtosData) ? produtosData : []),
            cachearFormasPagamento(Array.isArray(fpData) ? fpData : []),
          ]);
          console.log('💾 [CACHE] Dados salvos no IndexedDB para uso offline');
          // Ao salvar no cache com sucesso (online), limpar contadores offline locais
          for (const op of (Array.isArray(operacoesData) ? operacoesData : [])) {
            if (op.id_operacao) localStorage.removeItem(`aperus_offline_num_${op.id_operacao}`);
          }
        } catch (cacheErr) {
          console.warn('⚠️ [CACHE] Erro ao salvar dados no IndexedDB:', cacheErr);
        }
        // ─────────────────────────────────────────────────────────────────────

        // Garante que vendas seja sempre um array
        const vendasData = vendasRes.data?.results || vendasRes.data;
        const vendasCarregadas = Array.isArray(vendasData) ? vendasData : [];
        console.log('📦 Total de vendas carregadas:', vendasCarregadas.length);
        setVendas(vendasCarregadas);

        // Carregar status financeiro das vendas
        console.log('🔄 Iniciando carregamento de status financeiro...');
        await carregarStatusFinanceiro(vendasCarregadas);
        console.log('✅ Status financeiro carregado com sucesso!');

        console.log('🎉 Dados reais carregados com sucesso!');
        console.log('  Operações:', opRes.data.results || opRes.data);
        console.log('  Clientes:', cliRes.data.results || cliRes.data);
        console.log('  Vendedores:', vendRes.data.results || vendRes.data);
        console.log('  Produtos:', prodRes.data.results || prodRes.data);
        console.log('  Formas de Pagamento:', fpRes.data.results || fpRes.data);
        console.log('  Contas Bancárias:', contasRes.data.results || contasRes.data);
        console.log('  Departamentos:', deptosRes.data.results || deptosRes.data);
        console.log('  Centros de Custo:', ccRes.data.results || ccRes.data);


      } catch (apiError) {
        console.error('❌ Erro nas APIs:', apiError);

        if (apiError.response?.status === 401) {
          setError('🔐 Token expirado! Faça login novamente para acessar seus dados.');
          return;
        }

        console.log('🔄 [OFFLINE] Carregando dados do cache local (IndexedDB)...');

        try {
          const [opCache, cliCache, vendCache, prodCache, fpCache] = await Promise.all([
            buscarOperacoesCache(),
            buscarClientesCacheAll(),
            buscarVendedoresCache(),
            buscarProdutosCacheAll(),
            buscarFormasPagamentoCache(),
          ]);

          if (opCache.length > 0 || cliCache.length > 0) {
            const operacoesFiltradas = initialModel === '55'
              ? opCache
              : opCache.filter(op => String(op.modelo_documento) !== '55');
            setOperacoes(operacoesFiltradas);
            setClientes(cliCache);
            setVendedores(vendCache);
            setProdutos(prodCache);
            setFormasPagamento(fpCache);
            console.log('✅ [OFFLINE] Dados carregados do cache:', {
              operacoes: operacoesFiltradas.length,
              clientes: cliCache.length,
              vendedores: vendCache.length,
              produtos: prodCache.length,
            });
          } else {
            setError('⚠️ Servidor indisponível e cache vazio. Conecte-se à internet para carregar os dados.');
          }
        } catch (cacheErr) {
          console.error('❌ [OFFLINE] Falha ao carregar cache:', cacheErr);
          setError('⚠️ Servidor indisponível. Não foi possível carregar os dados.');
        }
      }

    } catch (err) {
      console.error('💥 Erro geral:', err);
      setError(`Erro geral: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Carregar status financeiro das vendas
  const carregarStatusFinanceiro = async (listaVendas) => {
    try {
      console.log('💰 Carregando status financeiro de', listaVendas.length, 'vendas...');
      const statusMap = {};

      // Buscar contas a receber para cada venda
      for (const venda of listaVendas) {
        const idVenda = venda.id || venda.id_venda;
        try {
          const response = await axiosInstance.get(`/contas/?id_venda_origem=${idVenda}`);
          const contas = response.data.results || response.data;

          console.log(`📊 Venda ${idVenda}:`, contas.length, 'conta(s) encontrada(s)');

          if (contas.length > 0) {
            const totalContas = contas.length;
            const contasPagas = contas.filter(c => c.status_conta === 'Paga').length;
            const valorTotal = contas.reduce((acc, c) => acc + parseFloat(c.valor_parcela || 0), 0);
            const valorPago = contas.filter(c => c.status_conta === 'Paga')
              .reduce((acc, c) => acc + parseFloat(c.valor_liquidado || 0), 0);

            statusMap[idVenda] = {
              temFinanceiro: true,
              totalContas,
              contasPagas,
              valorTotal,
              valorPago,
              totalPago: valorPago,
              totalPendente: valorTotal - valorPago,
              status: contasPagas === totalContas ? 'Pago' : contasPagas > 0 ? 'Parcial' : 'Pendente'
            };
          } else {
            statusMap[idVenda] = { temFinanceiro: false };
          }
        } catch (err) {
          console.error(`Erro ao buscar financeiro da venda ${idVenda}:`, err);
          statusMap[idVenda] = { temFinanceiro: false };
        }
      }

      console.log('✅ Status financeiro carregado:', statusMap);
      console.log('🔍 Total de vendas com status:', Object.keys(statusMap).length);
      setStatusFinanceiro(statusMap);
      console.log('💾 setStatusFinanceiro chamado com statusMap');
    } catch (err) {
      console.error('Erro ao carregar status financeiro:', err);
    }
  };

  // Calcular totais
  const calcularTotais = () => {
    const total = venda.itens.reduce((acc, item) => {
      const subtotal = (item.quantidade * item.valor_unitario) - (item.desconto || 0);
      return acc + subtotal;
    }, 0);

    const descontoInput = parseFloat(venda.desconto) || 0;
    const descontoValor = venda.tipo_desconto_geral === 'percentual' ? (total * descontoInput) / 100 : descontoInput;
    const taxaEntrega = parseFloat(venda.taxa_entrega) || 0;
    const valorTotal = total - descontoValor + taxaEntrega;

    setVenda(prev => ({
      ...prev,
      valor_total: valorTotal
    }));
  };

  // Calcular total dos itens (sem desconto geral)
  const calcularTotal = () => {
    if (!venda.itens || venda.itens.length === 0) return 0;

    return venda.itens.reduce((acc, item) => {
      const quantidade = parseFloat(item.quantidade) || 0;
      const valorUnitario = parseFloat(item.valor_unitario) || 0;
      const desconto = parseFloat(item.desconto) || 0;
      const subtotal = (quantidade * valorUnitario) - desconto;
      return acc + subtotal;
    }, 0);
  };

  const calcularCustoTotalVenda = () =>
    (venda.itens || []).reduce((acc, item) =>
      acc + ((item.custo_unitario || 0) * (parseFloat(item.quantidade) || 0)), 0);

  const calcularLucroVenda = () =>
    (parseFloat(venda.valor_total) || 0) - calcularCustoTotalVenda();

  const calcularMargemVenda = () => {
    const total = parseFloat(venda.valor_total) || 0;
    if (total <= 0) return 0;
    return (calcularLucroVenda() / total) * 100;
  };

  const temCustoVenda = () =>
    (venda.itens || []).some(item => (item.custo_unitario || 0) > 0);

  // Carregar promoções ativas
  const carregarPromocoes = async () => {
    try {
      const response = await promocaoService.obterPromocjesAtivas();
      setPromocoes(response);
      console.log('[PROMOCAO] Promocoes carregadas:', response);
    } catch (err) {
      console.error('[PROMOCAO] Erro ao carregar promocoes:', err);
    }
  };

  // Buscar vendas futuras pendentes (sem venda de entrega vinculada)
  const buscarVendasFuturasPendentes = async () => {
    try {
      const response = await axiosInstance.get('/vendas/?page_size=2000');
      const todasVendas = response.data.results || response.data;
      
      console.log('📦 [DEBUG] Total de vendas carregadas:', todasVendas.length);
      
      // Filtrar vendas que são futuras (têm operação com entrega_futura=true e tipo_entrega_futura=origem)
      // e que ainda têm itens pendentes de entrega
      const vendasPendentes = todasVendas.filter(v => {
        const operacao = operacoes.find(op => String(op.id_operacao) === String(v.id_operacao));
        if (!operacao || !operacao.entrega_futura || operacao.tipo_entrega_futura !== 'origem') {
          return false;
        }
        
        console.log(`📦 [DEBUG] Verificando venda #${v.id}:`);
        
        // Verificar se tem itens com saldo pendente
        if (!v.itens || v.itens.length === 0) {
          console.log(`  ⚠️ Sem itens`);
          return false;
        }
        
        // Verificar se algum item ainda tem saldo pendente
        const temSaldoPendente = v.itens.some(item => {
          const quantidadeTotal = parseFloat(item.quantidade || 0);
          const quantidadeEntregue = parseFloat(item.quantidade_entregue || 0);
          const saldoPendente = quantidadeTotal - quantidadeEntregue;
          
          console.log(`  - Item: Total=${quantidadeTotal}, Entregue=${quantidadeEntregue}, Pendente=${saldoPendente}`);
          
          return saldoPendente > 0.001; // Tolerância para erros de arredondamento
        });
        
        console.log(`  ${temSaldoPendente ? '✅ TEM saldo pendente' : '❌ SEM saldo pendente'}`);
        
        return temSaldoPendente;
      });
      
      console.log('📦 [ENTREGA FUTURA] Vendas pendentes encontradas:', vendasPendentes.length);
      setVendasFuturasPendentes(vendasPendentes);
    } catch (error) {
      console.error('Erro ao buscar vendas futuras pendentes:', error);
      setError('Erro ao buscar vendas futuras pendentes');
    }
  };

  // Carregar dados da venda de origem
  const carregarDadosVendaOrigem = async (idVendaOrigem) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/vendas/${idVendaOrigem}/`);
      const vendaOrigem = response.data;
      
      console.log('📦 Carregando dados da venda origem:', vendaOrigem);
      console.log('📦 Primeiro item:', vendaOrigem.itens[0]);
      
      // Calcular saldo pendente de cada item (quantidade - quantidade_entregue)
      const itensPendentes = vendaOrigem.itens
        .map(item => {
          const quantidadeTotal = parseFloat(item.quantidade);
          const quantidadeEntregue = parseFloat(item.quantidade_entregue || 0);
          const saldoPendente = quantidadeTotal - quantidadeEntregue;
          
          return {
            id_produto: item.produto_id || item.id_produto,
            quantidade: saldoPendente, // ✅ PRÉ-PREENCHER com saldo pendente (usuário pode alterar)
            quantidade_total: quantidadeTotal,
            quantidade_entregue: quantidadeEntregue,
            quantidade_maxima: saldoPendente, // Máximo que pode entregar
            valor_unitario: parseFloat(item.valor_unitario),
            desconto: parseFloat(item.desconto_valor || item.desconto || 0),
            // Nome do produto - tentar vários campos
            nome_produto: item.produto_nome || item.nome_produto || item.produto || item.name || 'Produto',
            produto_nome: item.produto_nome || item.nome_produto || item.produto || item.name || 'Produto',
            produto: item.produto_nome || item.nome_produto || item.produto || item.name || 'Produto',
            // Código do produto
            codigo_produto: item.codigo_produto || item.codigo || item.code || '',
            codigo: item.codigo_produto || item.codigo || item.code || '',
            id_item_origem: item.id // ID do item na venda origem
          };
        })
        .filter(item => item.quantidade_maxima > 0); // Apenas itens com saldo pendente
      
      if (itensPendentes.length === 0) {
        setError('❌ Esta venda já foi totalmente entregue!');
        setVenda(prev => ({ ...prev, venda_futura_origem: null }));
        setLoading(false);
        return;
      }
      
      // Copiar dados da venda origem para a nova venda
      setVenda(prev => ({
        ...prev,
        id_cliente: vendaOrigem.id_cliente,
        id_vendedor: vendaOrigem.id_vendedor || vendaOrigem.id_vendedor1,
        venda_futura_origem: idVendaOrigem,
        observacoes: `Entrega da venda #${idVendaOrigem} - Saldo pendente`,
        itens: itensPendentes
      }));
      
      setSuccess(`✅ Carregado saldo pendente da venda #${idVendaOrigem} (${itensPendentes.length} itens)`);
    } catch (error) {
      console.error('Erro ao carregar venda origem:', error);
      setError('Erro ao carregar dados da venda origem');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se produto tem promoção e quantidade atende ao mínimo
  const verificarPromocao = (idProduto, quantidade) => {
    console.log('[PROMOCAO] Verificando promocao para produto:', idProduto, 'Qtd:', quantidade);

    // Procurar promoção para este produto
    for (const promo of promocoesAtivas) {
      const produtoNaPromo = promo.promocao_produtos?.find(p => p.id_produto == idProduto);

      if (produtoNaPromo) {
        console.log('[DEBUG] Produto encontrado em promocao! Verificando quantidade minima:', produtoNaPromo.quantidade_minima);
        console.log('[DEBUG] Tipos - qtd:', typeof quantidade, 'valor:', quantidade, 'quantidade_minima:', typeof produtoNaPromo.quantidade_minima, 'valor:', produtoNaPromo.quantidade_minima);

        // Converter ambos para numero para comparacao correta
        const qtdNum = parseFloat(quantidade);
        const qtdMinNum = parseFloat(produtoNaPromo.quantidade_minima);

        console.log('[DEBUG] Comparando - qtd numerica:', qtdNum, '>= qtd minima:', qtdMinNum, '?', qtdNum >= qtdMinNum);

        // Verificar se a quantidade eh >= quantidade_minima
        if (qtdNum >= qtdMinNum) {
          console.log('[DEBUG] Quantidade OK! Aplicando desconto');

          // Usar desconto individual do produto se disponível
          let descontoFinal = parseFloat(promo.valor_desconto);
          if (produtoNaPromo.valor_desconto_produto) {
            descontoFinal = parseFloat(produtoNaPromo.valor_desconto_produto);
            console.log('[DEBUG] Usando desconto individual do produto:', descontoFinal);
          }

          return {
            desconto_percentual: promo.tipo_desconto === 'percentual' ? descontoFinal : 0,
            desconto_valor: promo.tipo_desconto === 'valor' ? descontoFinal : 0,
            promocao_nome: promo.nome_promocao,
            tipo_desconto: promo.tipo_desconto,
            valor_desconto: descontoFinal,
            quantidade_minima: produtoNaPromo.quantidade_minima,
            valor_desconto_produto: produtoNaPromo.valor_desconto_produto
          };
        } else {
          console.log('[DEBUG] Quantidade insuficiente. Minima:', qtdMinNum, 'Informada:', qtdNum);
        }
      }
    }

    console.log('[PROMOCAO] Nenhuma promocao encontrada para este produto');
    return null;
  };

  // Confirmar seleção de lote (pré-seleção antes de adicionar item)
  const confirmarLoteSelecionado = (lote) => {
    setLotePreSelecionado(lote);
    setOpenSelecionarLote(false);
    setLotesDisponiveis([]);
    setSuccess(`Lote ${lote.numero_lote} selecionado!`);
    setTimeout(() => setSuccess(''), 2000);
    // Focar no campo quantidade
    setTimeout(() => {
      if (quantidadeRef.current) {
        quantidadeRef.current.focus();
        quantidadeRef.current.select();
      }
    }, 100);
  };

  // Adicionar item
  // Função auxiliar para efetivamente adicionar o item (sem validação)
  const efetivarAdicaoItem = (itemData, produtoData) => {
    const { quantidade, valor_unitario, desconto, id_produto } = itemData;
    const tipoDesconto = itemData.tipo_desconto || 'valor';
    const produto = produtoData;

    // Verificar promocao
    let promocao = null;
    let descontoPerc = 0;
    let descontoVal = 0;
    let descricaoPromocao = '';

    const valorItem = parseFloat(quantidade) * parseFloat(valor_unitario || produto.valor_venda || produto.preco_venda || produto.preco || 0);

    const promoDB = verificarPromocao(id_produto, quantidade);
    if (promoDB) {
      promocao = promoDB;
      if (promocao.tipo_desconto === 'percentual') {
        descontoPerc = parseFloat(promocao.valor_desconto);
        descontoVal = (valorItem * descontoPerc) / 100;
      } else {
        descontoVal = parseFloat(promocao.valor_desconto);
        descontoPerc = valorItem > 0 ? (descontoVal / valorItem) * 100 : 0;
      }
      descricaoPromocao = ` (${promocao.promocao_nome})`;
    } else {
      const desc = parseFloat(desconto || 0);
      if (tipoDesconto === 'percentual') {
        descontoPerc = desc;
        descontoVal = (valorItem * desc) / 100;
      } else {
        descontoVal = desc;
        descontoPerc = valorItem > 0 ? (desc / valorItem) * 100 : 0;
      }
    }

    const valorTotalItem = valorItem - descontoVal;

    const item = {
      id: Date.now(),
      id_produto: id_produto,
      codigo_produto: produto.codigo_produto || produto.codigo || produto.code || produto.sku || `P${produto.id_produto || produto.id}`,
      nome_produto: produto.nome_produto || produto.nome || produto.name || produto.title,
      quantidade: parseFloat(quantidade),
      valor_unitario: parseFloat(valor_unitario || produto.valor_venda || produto.preco_venda || produto.preco || 0),
      desconto: descontoVal,
      desconto_valor: descontoVal,
      desconto_percentual: descontoPerc,
      subtotal: valorTotalItem,
      tem_promocao: !!promocao,
      nome_promocao: promocao?.promocao_nome || '',
      cfop: itemData.cfop || (() => {
        const trib = produto.tributacao_detalhada || null;
        return trib?.cfop || '5102';
      })(),
      cst_csosn: itemData.cst_csosn || (() => {
        const trib = produto.tributacao_detalhada || null;
        const isSimples = regimeTributario === 'SIMPLES';
        return isSimples ? (trib?.csosn || '400') : (trib?.cst_icms || '000');
      })(),
      custo_unitario: parseFloat(
        produto.estoque_por_deposito?.[0]?.custo_medio ||
        produto.custo_medio ||
        produto.estoque_por_deposito?.[0]?.valor_ultima_compra ||
        0
      ) || 0,
      qtd_caixas: itemData.qtd_caixas || null,
      area_m2: itemData.area_m2 || null,
      metragem_caixa: itemData.metragem_caixa || null,
      obs_calculadora: itemData.obs || null,
      id_lote: lotePreSelecionado?.id_lote || null,
      numero_lote: lotePreSelecionado?.numero_lote || '',
    };

    setVenda(prev => {
      const novosItens = [...prev.itens, item];
      const total = novosItens.reduce((acc, it) => {
        const qtd = parseFloat(it.quantidade) || 0;
        const valorUn = parseFloat(it.valor_unitario) || 0;
        const desc = parseFloat(it.desconto) || 0;
        const subtotal = (qtd * valorUn) - desc;
        return acc + subtotal;
      }, 0);

      const desconto = parseFloat(prev.desconto) || 0;
      const taxaEntrega = parseFloat(prev.taxa_entrega) || 0;
      const valorTotal = total - desconto + taxaEntrega;

      return {
        ...prev,
        itens: novosItens,
        valor_total: valorTotal
      };
    });

    setNovoItem({
      id_produto: '',
      quantidade: 1,
      valor_unitario: 0,
      desconto: 0,
      cfop: '',
      cst_csosn: ''
    });

    setLotePreSelecionado(null);
    setControlaProdutoLote(false);

    setError('');

    if (promocao) {
      setSuccess(`Item adicionado! Promocao: ${promocao.promocao_nome}`);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setSuccess('Item adicionado!');
      setTimeout(() => setSuccess(''), 2000);
    }

    // Se operação é de venda de veículo novo, abrir modal de dados do veículo
    const opAtual = operacoes.find(op => String(op.id_operacao) === String(venda.id_operacao));
    if (opAtual?.venda_veiculo_novo) {
      setVeiculoItemId(item.id);
      setVeiculoDadosForm({ ...veiculoDadosVazios });
      setOpenVeiculoModal(true);
    }
  };

  // Buscar variações de produto (outros produtos com mesmo produto_pai)
  // ========== SUGERIR PRODUTOS COMPLEMENTARES ==========
  const sugerirProdutoPai = async (produtoFilho, areaM2 = 0) => {
    try {
      // 1) Buscar produto filho completo para pegar produtos_complementares da M2M
      const filhoId = produtoFilho.id_produto || produtoFilho.id;
      console.log(`🔗 Buscando complementares do produto ${filhoId}... (área: ${areaM2}m²)`);
      
      let complementares = [];
      
      // Verificar se o produto já tem a lista de complementares carregada
      if (produtoFilho.produtos_complementares && produtoFilho.produtos_complementares.length > 0) {
        complementares = produtoFilho.produtos_complementares;
      } else {
        // Buscar do endpoint para garantir dados atualizados
        try {
          const respFilho = await axiosInstance.get(`/produtos/${filhoId}/`);
          if (respFilho.data.produtos_complementares && respFilho.data.produtos_complementares.length > 0) {
            complementares = respFilho.data.produtos_complementares;
          }
        } catch (e) {
          console.warn('Não conseguiu buscar complementares via M2M:', e);
        }
      }
      
      // 2) Fallback: se não tem complementares M2M, usar produto_pai antigo
      if (complementares.length === 0) {
        const produtoPaiId = produtoFilho.id_produto_pai || produtoFilho.produto_pai;
        if (!produtoPaiId) return;
        complementares = [{ id_produto: produtoPaiId }];
      }
      
      // 3) Buscar dados completos de cada complementar
      const produtosCompletos = [];
      for (const comp of complementares) {
        try {
          const resp = await axiosInstance.get(`/produtos/${comp.id_produto}/`);
          if (resp.data) produtosCompletos.push(resp.data);
        } catch (e) {
          console.warn(`Erro ao buscar produto complementar ${comp.id_produto}:`, e);
        }
      }
      
      if (produtosCompletos.length === 0) return;
      
      console.log(`✅ ${produtosCompletos.length} produto(s) complementar(es) encontrado(s)`);
      setProdutoPaiOpcionalData(produtosCompletos);
      setProdutoFilhoOrigem(produtoFilho);
      setAreaProdutoFilho(areaM2 || 0);

      // Calcular quantidade sugerida para cada complementar
      const qtdMap = {};
      for (const prodComp of produtosCompletos) {
        const consumoArgamassa = parseFloat(prodComp.consumo_argamassa_m2 || 0);
        const pesoSaco = parseFloat(prodComp.peso_saco_argamassa || 0);
        const rendimento = parseFloat(prodComp.rendimento_m2 || 0);

        if (consumoArgamassa > 0 && pesoSaco > 0 && areaM2 > 0) {
          qtdMap[prodComp.id_produto] = Math.ceil(areaM2 * consumoArgamassa / pesoSaco);
        } else if (rendimento > 0 && areaM2 > 0) {
          qtdMap[prodComp.id_produto] = Math.ceil(areaM2 / rendimento);
        } else {
          qtdMap[prodComp.id_produto] = 1;
        }
      }
      setQtdSugeridaPai(qtdMap);

      setProdutoPaiOpcionalModal(true);
    } catch (error) {
      console.error('❌ Erro ao buscar produtos complementares:', error);
    }
  };

  const buscarVariacoesProduto = async (produto) => {
    try {
      const produtoPaiId = produto.id_produto_pai || produto.produto_pai;
      
      if (!produtoPaiId) {
        console.log('⚠️ Produto não tem produto_pai definido');
        return;
      }

      console.log(`🔍 Buscando variações do produto pai ID ${produtoPaiId}...`);
      
      // Buscar todas as variações (produtos com mesmo produto_pai)
      const response = await axiosInstance.get(`/produtos/?produto_pai=${produtoPaiId}`);
      const variacoes = response.data.results || response.data || [];
      
      // Filtrar para remover o produto atual
      const outrasVariacoes = variacoes.filter(v => 
        String(v.id_produto) !== String(produto.id_produto)
      );
      
      if (outrasVariacoes.length > 0) {
        console.log(`✅ Encontradas ${outrasVariacoes.length} variações`);
        setVariacoesDisponiveis(outrasVariacoes);
        setProdutoPaiSelecionado(produto);
        setVariacoesModal(true);
      } else {
        console.log('ℹ️ Nenhuma outra variação encontrada');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar variações:', error);
    }
  };

  const adicionarItem = async () => {
    // Se o modal de estoque estiver aberto e existir item pendente, tratar Enter/ação como confirmação
    if (typeof openEstoqueModal !== 'undefined' && openEstoqueModal && typeof itemPendenteEstoque !== 'undefined' && itemPendenteEstoque && acaoEstoqueAtual === 'alertar') {
      console.log('⏎ Confirmando adição via Enter enquanto modal de estoque está aberto (Vendas)');
      // marcar autorização e efetivar adição
      try {
        setAutorizacaoSupervisor(true);
      } catch (e) {
        // ignore se não existir essa flag
      }
      try {
        setOpenEstoqueModal(false);
        efetivarAdicaoItem(itemPendenteEstoque, itemPendenteEstoque.produto);
        setItemPendenteEstoque(null);
      } catch (e) {
        console.warn('Não foi possível efetivar adição via Enter:', e);
      }
      return;
    }

    if (!novoItem.id_produto) {
      setError('Selecione um produto');
      return;
    }

    const produto = produtos.find(p => {
      const id = String(p.id_produto || p.id || p.pk || p.ID);
      return id === String(novoItem.id_produto);
    });

    if (!produto) {
      setError('Produto não encontrado');
      return;
    }

    // VALIDAR ESTOQUE CONFIGURÁVEL
    const operacaoSelecionada = operacoes.find(op =>
      String(op.id_operacao) === String(venda.id_operacao)
    );

    const validarEstoque = operacaoSelecionada?.validar_estoque || false;
    const acaoEstoque = operacaoSelecionada?.acao_estoque || 'nao_validar';

    // 🔧 CORREÇÃO: Buscar estoque correto do depósito da operação
    let estoque = 0;
    if (operacaoSelecionada?.id_deposito_baixa && produto.estoque_por_deposito) {
      console.log('📍 Operação configurada para depósito:', operacaoSelecionada.id_deposito_baixa, '(tipo:', typeof operacaoSelecionada.id_deposito_baixa + ')');
      console.log('📦 DETALHES COMPLETOS dos estoques:', JSON.stringify(produto.estoque_por_deposito, null, 2));

      // Tentar encontrar com conversão explícita
      const estoqueDeposito = produto.estoque_por_deposito.find(
        est => {
          const match = Number(est.id_deposito) === Number(operacaoSelecionada.id_deposito_baixa);
          console.log(`  Comparando depósito ${est.id_deposito} (${typeof est.id_deposito}) com ${operacaoSelecionada.id_deposito_baixa} (${typeof operacaoSelecionada.id_deposito_baixa}) = ${match}`);
          return match;
        }
      );

      estoque = estoqueDeposito ? parseFloat(estoqueDeposito.quantidade_atual || estoqueDeposito.quantidade || 0) : 0;
      console.log(`📦 Estoque encontrado do depósito ${operacaoSelecionada.id_deposito_baixa}:`, estoque);
      if (estoqueDeposito) {
        console.log('📦 Objeto completo do estoque encontrado:', estoqueDeposito);
      } else {
        console.warn('❌ Nenhum estoque encontrado para o depósito:', operacaoSelecionada.id_deposito_baixa);
      }

      // Se não tem estoque no depósito configurado, verificar se tem em outros
      if (estoque === 0) {
        const depositosComEstoque = produto.estoque_por_deposito.filter(est => parseFloat(est.quantidade || 0) > 0);
        if (depositosComEstoque.length > 0) {
          console.warn('⚠️ Produto sem estoque no depósito configurado da operação!');
          console.warn('📦 Mas há estoque disponível em outros depósitos:', depositosComEstoque.map(e => ({
            deposito: e.id_deposito,
            nome: e.nome_deposito,
            quantidade: e.quantidade
          })));
          console.warn('💡 Solução: Configure a operação para usar um depósito com estoque disponível ou transfira o estoque para o depósito 6');
        }
      }
    } else {
      estoque = parseFloat(produto.estoque_total || produto.estoque_atual || produto.estoque || produto.stock || produto.quantidade || 0);
      console.log('📦 Estoque total do produto:', estoque);
    }

    const quantidadeSolicitada = parseFloat(novoItem.quantidade);
    console.log(`🔍 Validação de estoque - Produto: ${produto.nome_produto}, Disponível: ${estoque}, Solicitado: ${quantidadeSolicitada}`);

    if (validarEstoque && acaoEstoque !== 'nao_validar' && estoque < quantidadeSolicitada) {
      console.log('⚠️ ESTOQUE INSUFICIENTE - Abrindo modal');
      const info = {
        produto: {
          codigo: produto.codigo_produto || produto.codigo || `P${produto.id_produto}`,
          nome: produto.nome_produto || produto.nome,
          estoque_disponivel: estoque,
          quantidade_solicitada: quantidadeSolicitada,
          faltam: quantidadeSolicitada - estoque
        }
      };

      setEstoqueInfo(info);
      setAcaoEstoqueAtual(acaoEstoque);
      setItemPendenteEstoque({ ...novoItem, produto });
      setOpenEstoqueModal(true);

      if (acaoEstoque === 'bloquear') {
        return;
      } else if (acaoEstoque === 'solicitar_senha') {
        return;
      } else if (acaoEstoque === 'alertar') {
        // ALERTAR: abrir modal e NÃO adicionar automaticamente
        console.log('🚨 Alerta de estoque - modal aberto e aguardando confirmação do usuário');
        // O item será adicionado somente quando o usuário clicar em 'Continuar Mesmo Assim' no modal
        return;
      }

      return;
    } else {
      console.log('✅ Estoque OK - Adicionando item normalmente');
    }

    // Verificar se produto exige seleção de lote
    if (controlaProdutoLote && !lotePreSelecionado) {
      setError('Este produto exige seleção de lote. Selecione um lote antes de adicionar.');
      return;
    }

    // Se passou pela validação ou não precisa validar, adiciona o item
    efetivarAdicaoItem(novoItem, produto);

    // Sugerir produto pai complementar se existir (para materiais de construção)
    const temPai = produto.id_produto_pai || produto.produto_pai;
    if (temPai) {
      // Tentar obter a área do novoItem (se veio da calculadora)
      const areaItem = parseFloat(novoItem.area_m2 || 0);
      sugerirProdutoPai(produto, areaItem);
    }
  };

  // Remover item
  const removerItem = (index) => {
    console.log('[DEBUG] Removendo item no indice:', index);
    setVenda(prev => {
      const novosItens = prev.itens.filter((_, i) => i !== index);

      // Calcular novo total
      const total = novosItens.reduce((acc, it) => {
        const quantidade = parseFloat(it.quantidade) || 0;
        const valorUnitario = parseFloat(it.valor_unitario) || 0;
        const desconto = parseFloat(it.desconto) || 0;
        const subtotal = (quantidade * valorUnitario) - desconto;
        return acc + subtotal;
      }, 0);

      const desconto = parseFloat(prev.desconto) || 0;
      const taxaEntrega = parseFloat(prev.taxa_entrega) || 0;
      const valorTotal = total - desconto + taxaEntrega;

      return {
        ...prev,
        itens: novosItens,
        valor_total: valorTotal
      };
    });
  };

  // Alterar quantidade de um item
  // Alterar desconto de um item na tabela
  const alterarDescontoItem = (index, novoDesconto, tipo) => {
    const desc = parseFloat(novoDesconto) || 0;
    setVenda(prev => {
      const novosItens = [...prev.itens];
      const item = novosItens[index];
      const valorItem = parseFloat(item.quantidade) * parseFloat(item.valor_unitario);
      let descontoVal, descontoPerc;
      if (tipo === 'percentual') {
        descontoPerc = desc;
        descontoVal = (valorItem * desc) / 100;
      } else {
        descontoVal = desc;
        descontoPerc = valorItem > 0 ? (desc / valorItem) * 100 : 0;
      }
      novosItens[index] = {
        ...item,
        desconto: descontoVal,
        desconto_valor: descontoVal,
        desconto_percentual: descontoPerc,
        desconto_tipo_edicao: tipo,
        subtotal: valorItem - descontoVal
      };

      const total = novosItens.reduce((acc, it) => {
        const quantidade = parseFloat(it.quantidade) || 0;
        const valorUnitario = parseFloat(it.valor_unitario) || 0;
        const desconto = parseFloat(it.desconto) || 0;
        const subtotal = (quantidade * valorUnitario) - desconto;
        return acc + subtotal;
      }, 0);

      const descontoGeral = parseFloat(prev.desconto) || 0;
      const taxaEntrega = parseFloat(prev.taxa_entrega) || 0;
      const valorTotal = total - descontoGeral + taxaEntrega;

      return { ...prev, itens: novosItens, valor_total: valorTotal };
    });
  };

  const alterarQuantidadeItem = (index, novaQuantidade) => {
    const qtd = parseFloat(novaQuantidade) || 0;
    if (qtd <= 0) return;

    setVenda(prev => {
      const novosItens = [...prev.itens];
      novosItens[index] = {
        ...novosItens[index],
        quantidade: qtd,
        subtotal: (qtd * parseFloat(novosItens[index].valor_unitario)) - parseFloat(novosItens[index].desconto || 0)
      };

      // Calcular novo total
      const total = novosItens.reduce((acc, it) => {
        const quantidade = parseFloat(it.quantidade) || 0;
        const valorUnitario = parseFloat(it.valor_unitario) || 0;
        const desconto = parseFloat(it.desconto) || 0;
        const subtotal = (quantidade * valorUnitario) - desconto;
        return acc + subtotal;
      }, 0);

      const desconto = parseFloat(prev.desconto) || 0;
      const taxaEntrega = parseFloat(prev.taxa_entrega) || 0;
      const valorTotal = total - desconto + taxaEntrega;

      return {
        ...prev,
        itens: novosItens,
        valor_total: valorTotal
      };
    });
  };

  // Recalcular quando itens, desconto ou taxa_entrega mudarem
  useEffect(() => {
    if (venda.itens && venda.itens.length > 0) {
      calcularTotais();
    }
  }, [venda.itens.length, venda.desconto, venda.taxa_entrega]);

  // Salvar venda
  const salvarVenda = async () => {
    let dadosVenda = null; // declarado fora do try para ficar acessível no fallback offline
    try {
      setLoading(true);
      setError('');

      // Validações básicas
      if (!venda.id_operacao || !venda.id_cliente || !venda.id_vendedor) {
        setError('Preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }

      // Filtrar itens com quantidade > 0 (para entrega futura, permite deixar itens zerados)
      const itensComQuantidade = venda.itens.filter(item => parseFloat(item.quantidade || 0) > 0);
      
      // Validar se há produtos com quantidade
      if (!itensComQuantidade || itensComQuantidade.length === 0) {
        setError('❌ Adicione pelo menos um produto com quantidade maior que zero');
        setLoading(false);
        return;
      }

      // Validar valor total
      const valorTotal = parseFloat(venda.valor_total) || 0;
      if (valorTotal <= 0) {
        setError('❌ O valor total da venda deve ser maior que zero');
        setLoading(false);
        return;
      }

      if (venda.itens.length === 0) {
        setError('Adicione pelo menos um item à venda');
        setLoading(false);
        return;
      }

      // ===== VERIFICAÇÃO DE LIMITE DE CRÉDITO =====
      // Verificar configuração da operação
      const operacaoSelecionada = operacoes.find(op => op.id_operacao === venda.id_operacao);

      // ===== VERIFICAÇÃO DE LIMITE DE DESCONTO =====
      const limiteDesconto = parseFloat(operacaoSelecionada?.limite_desconto_percentual) || 0;
      if (limiteDesconto > 0 && !autorizacaoSupervisor && !aprovacaoDescontoViaWhatsApp) {
        const subtotalItens = venda.itens.reduce((acc, item) => {
          return acc + parseFloat(item.quantidade || 0) * parseFloat(item.valor_unitario || 0);
        }, 0);
        const descontoInput = parseFloat(venda.desconto) || 0;
        const valorDesconto = venda.tipo_desconto_geral === 'percentual' ? (subtotalItens * descontoInput) / 100 : descontoInput;
        const percentualDesconto = subtotalItens > 0 ? (valorDesconto / subtotalItens * 100) : 0;
        if (percentualDesconto > limiteDesconto) {
          setInfoDesconto({
            percentual_solicitado: percentualDesconto,
            limite_desconto: limiteDesconto,
            valor_desconto: valorDesconto,
            valor_total: valorTotal
          });
          setSolicitacaoDesconto(null);
          setOpenDescontoModal(true);
          setLoading(false);
          return;
        }
      }

      const validacaoLimite = operacaoSelecionada?.validacao_limite_credito || 'nao_validar';

      console.log('🔍🔍🔍 VERIFICANDO LIMITE DE CRÉDITO DO CLIENTE...');
      console.log('   Operação selecionada:', operacaoSelecionada);
      console.log('   Modo de validação da operação:', validacaoLimite);
      console.log('   ID Cliente:', venda.id_cliente);
      console.log('   Valor total:', valorTotal);

      if (validacaoLimite !== 'nao_validar') {
        try {
          const limiteResponse = await axiosInstance.post('/verificar-limite-cliente/', {
            id_cliente: venda.id_cliente,
            valor_venda: valorTotal
          });

          console.log('💳 Resposta da verificação de limite:', limiteResponse.data);

          if (limiteResponse.data.ultrapassa_limite) {
            console.log('⚠️ LIMITE DE CRÉDITO ULTRAPASSADO!');
            console.log(`   Limite: R$ ${limiteResponse.data.cliente.limite_credito}`);
            console.log(`   Saldo devedor: R$ ${limiteResponse.data.cliente.saldo_devedor}`);
            console.log(`   Disponível: R$ ${limiteResponse.data.cliente.credito_disponivel}`);
            console.log(`   Excedente: R$ ${limiteResponse.data.valor_excedente}`);

            if (validacaoLimite === 'alertar') {
              // Apenas mostra alerta mas permite continuar
              console.log('⚠️ Modo ALERTAR: mostrando aviso mas continuando');
              setError(
                `⚠️ ATENÇÃO: Limite de crédito será excedido!\n` +
                `Limite: R$ ${limiteResponse.data.cliente.limite_credito.toFixed(2)}\n` +
                `Disponível: R$ ${limiteResponse.data.cliente.credito_disponivel.toFixed(2)}\n` +
                `Excedente: R$ ${limiteResponse.data.valor_excedente.toFixed(2)}`
              );
              setTimeout(() => setError(''), 8000);
              // Continua com a venda normalmente
            } else if (validacaoLimite === 'bloquear') {
              // Bloqueia completamente a venda
              console.log('🚫 Modo BLOQUEAR: bloqueando venda');
              setMensagemBloqueio(
                `LIMITE DE CRÉDITO EXCEDIDO!\n\n` +
                `Cliente ultrapassou o limite de crédito disponível.\n\n` +
                `💳 Limite Total: R$ ${limiteResponse.data.cliente.limite_credito.toFixed(2)}\n` +
                `💰 Crédito Disponível: R$ ${limiteResponse.data.cliente.credito_disponivel.toFixed(2)}\n` +
                `📊 Saldo Devedor: R$ ${limiteResponse.data.cliente.saldo_devedor.toFixed(2)}\n` +
                `⚠️ Valor Excedente: R$ ${limiteResponse.data.valor_excedente.toFixed(2)}\n\n` +
                `Esta venda não pode ser finalizada.\n` +
                `Entre em contato com o financeiro para aumentar o limite.`
              );
              setOpenBloqueioModal(true);
              setLoading(false);
              return; // Bloqueia definitivamente
            } else if (validacaoLimite === 'solicitar_senha') {
              // Solicita senha do supervisor
              console.log('🔐 Modo SOLICITAR_SENHA: solicitando autorização');
              setLimiteInfo({
                ...limiteResponse.data,
                motivo: 'limite_credito',
                mensagem: 'Limite de crédito ultrapassado'
              });
              setOpenLimiteModal(true);
              setLoading(false);
              return; // Bloqueia até autorização do supervisor
            }
          }

          console.log('✅ Limite de crédito OK - prosseguindo com a venda');
        } catch (limiteErr) {
          console.error('❌ Erro ao verificar limite de crédito:', limiteErr);
          // Não bloqueia a venda se houver erro na verificação
        }
      } else {
        console.log('ℹ️ Validação de limite desabilitada para esta operação - prosseguindo sem verificação');
      }

      // ===== VERIFICAÇÃO DE ESTOQUE PARA TODOS OS ITENS =====
      // Enfileirar validações de estoque por item insuficiente (alertar / solicitar_senha)
      // `operacaoSelecionada` já foi definida anteriormente para a verificação de limite
      const validarEstoque = operacaoSelecionada?.validar_estoque || false;
      const acaoEstoque = operacaoSelecionada?.acao_estoque || 'nao_validar';

      if (validarEstoque && acaoEstoque !== 'nao_validar') {
        try {
          const validacoesPendentes = [];

          for (let i = 0; i < venda.itens.length; i++) {
            const item = venda.itens[i];
            // Buscar produto atual para checar estoque real
            const produtoResp = await axiosInstance.get(`/produtos/${item.id_produto}/`);
            const produto = produtoResp.data;

            let estoqueDisponivel = 0;
            if (operacaoSelecionada?.id_deposito_baixa && produto.estoque_por_deposito) {
              const estoqueDeposito = produto.estoque_por_deposito.find(
                est => Number(est.id_deposito) === Number(operacaoSelecionada.id_deposito_baixa)
              );
              estoqueDisponivel = estoqueDeposito ? parseFloat(estoqueDeposito.quantidade) : 0;
            } else {
              estoqueDisponivel = parseFloat(produto.estoque_atual || 0);
            }

            const quantidadeSolicitada = parseFloat(item.quantidade || 0);
            if (estoqueDisponivel < quantidadeSolicitada) {
              const faltam = quantidadeSolicitada - estoqueDisponivel;

              if (acaoEstoque === 'bloquear') {
                setEstoqueInfo({ produto: produto.nome_produto || item.nome, disponivel: estoqueDisponivel, solicitado: quantidadeSolicitada, faltam });
                setAcaoEstoqueAtual(acaoEstoque);
                setError(`❌ Estoque insuficiente para "${produto.nome_produto}". Disponível: ${estoqueDisponivel.toFixed(3)}, Solicitado: ${quantidadeSolicitada.toFixed(3)}`);
                setLoading(false);
                return;
              }

              validacoesPendentes.push({
                tipo: 'estoque',
                dados: { produto: produto.nome_produto || item.nome, disponivel: estoqueDisponivel, solicitado: quantidadeSolicitada, faltam },
                item: { index: i, ...item },
                acao: acaoEstoque
              });
            }
          }

          if (validacoesPendentes.length > 0) {
            console.log('📝 Enfileirando validações de estoque para vários itens (Vendas):', validacoesPendentes.length, validacoesPendentes);
            // Armazenar fila completa e iniciar processamento pela função que já usa o setter funcional
            setFilaValidacoes(validacoesPendentes.slice(1));

            const primeira = validacoesPendentes[0];
            setEstoqueInfo(primeira.dados);
            setItemPendenteEstoque({ ...primeira.item, finalizacao: true });
            setAcaoEstoqueAtual(primeira.acao);
            setOpenEstoqueModal(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Erro ao validar estoque (Vendas):', err);
        }
      }

      // ===== VALIDAÇÃO DE DATA DE VENCIMENTO vs DATA DO DOCUMENTO =====
      // Se for venda a prazo E validação estiver habilitada, verificar prazo
      if (operacaoSelecionada && operacaoSelecionada.gera_financeiro === 1 && validacaoLimite !== 'nao_validar') {
        console.log('📅 Validando datas para venda a prazo...');

        const dataDocumento = new Date(venda.data_venda);
        const dataVencimentoPrevista = new Date(venda.data_venda);
        dataVencimentoPrevista.setDate(dataVencimentoPrevista.getDate() + 30); // Assumindo 30 dias padrão

        // Se houver uma data de vencimento específica configurada, usar ela
        const dataVencConfig = venda.data_vencimento ? new Date(venda.data_vencimento) : dataVencimentoPrevista;

        console.log(`   Data do documento: ${dataDocumento.toLocaleDateString('pt-BR')}`);
        console.log(`   Data de vencimento: ${dataVencConfig.toLocaleDateString('pt-BR')}`);

        // Se data de vencimento for maior que data do documento + prazo permitido (ex: 60 dias)
        const prazoMaximoDias = 60; // Configurável
        const dataLimite = new Date(dataDocumento);
        dataLimite.setDate(dataLimite.getDate() + prazoMaximoDias);

        if (dataVencConfig > dataLimite) {
          console.log('⚠️ DATA DE VENCIMENTO EXCEDE O PRAZO PERMITIDO!');
          console.log(`   Prazo máximo: ${prazoMaximoDias} dias`);
          console.log(`   Data limite: ${dataLimite.toLocaleDateString('pt-BR')}`);

          const diasExcedentes = Math.ceil((dataVencConfig - dataLimite) / (1000 * 60 * 60 * 24));

          setLimiteInfo({
            cliente: {
              nome: clientes.find(c => c.id_cliente === venda.id_cliente)?.nome_razao_social || 'Cliente',
              limite_credito: 0,
              saldo_devedor: 0,
              credito_disponivel: 0
            },
            valor_venda: valorTotal,
            ultrapassa_limite: false,
            valor_excedente: 0,
            motivo: 'prazo_vencimento',
            mensagem: 'Data de vencimento excede o prazo permitido',
            data_documento: dataDocumento.toLocaleDateString('pt-BR'),
            data_vencimento: dataVencConfig.toLocaleDateString('pt-BR'),
            prazo_maximo: prazoMaximoDias,
            dias_excedentes: diasExcedentes
          });

          setOpenLimiteModal(true);
          setLoading(false);
          return; // Bloqueia a venda até autorização do supervisor
        }

        console.log('✅ Data de vencimento dentro do prazo permitido');
      }

      // Verificar se cliente tem crédito disponível E ainda não foi decidido usar ou não
      if (creditoCliente > 0 && !decisaoCreditoTomada) {
        console.log('💰 Cliente possui crédito de R$', creditoCliente.toFixed(2));
        console.log('❓ Perguntando ao usuário se deseja usar o crédito...');
        setShowCreditoModal(true);
        setLoading(false);
        return;
      }

      // 💰 Verificar se cliente tem cashback disponível E ainda não foi decidido usar ou não
      if (venda.cashback_disponivel > 0 && !decisaoCashbackTomada) {
        console.log('💰 Cliente possui cashback de R$', parseFloat(venda.cashback_disponivel).toFixed(2));
        console.log('❓ Perguntando ao usuário se deseja usar o cashback...');
        setShowCashbackModal(true);
        setLoading(false);
        return;
      }

      // Preparar dados da venda
      dadosVenda = { ...venda };
      let creditoAplicado = 0;

      // Converter desconto percentual para valor antes de enviar
      if (venda.tipo_desconto_geral === 'percentual') {
        const subtotalItens = itensComQuantidade.reduce((acc, item) => {
          const valorItem = parseFloat(item.quantidade || 0) * parseFloat(item.valor_unitario || 0);
          const descontoItem = parseFloat(item.desconto_valor || item.desconto || 0);
          return acc + (valorItem - descontoItem);
        }, 0);
        dadosVenda.desconto = (subtotalItens * (parseFloat(venda.desconto) || 0)) / 100;
      }

      // Preparar itens para envio (filtrar apenas itens com quantidade > 0 e garantir desconto_valor em cada item)
      dadosVenda.itens = itensComQuantidade.map(item => ({
        id_produto: item.id_produto,
        quantidade: item.quantidade.toString(),
        valor_unitario: item.valor_unitario.toString(),
        desconto_valor: (item.desconto_valor || item.desconto || 0).toString()
      }));

      console.log('[ENVIO] Itens para API:', dadosVenda.itens);
      
      // Log específico para entrega futura
      if (venda.venda_futura_origem) {
        console.log('📦 [ENTREGA FUTURA] venda_futura_origem detectado:', venda.venda_futura_origem);
        console.log('📦 [ENTREGA FUTURA] dadosVenda.venda_futura_origem:', dadosVenda.venda_futura_origem);
      }

      // Aplicar crédito se foi escolhido usar
      if (usarCredito && creditoCliente > 0) {
        const valorVenda = calcularTotal() - (dadosVenda.desconto || 0);
        creditoAplicado = Math.min(creditoCliente, valorVenda);

        console.log('✨ Aplicando crédito:');
        console.log(`  - Crédito disponível: R$ ${creditoCliente.toFixed(2)}`);
        console.log(`  - Valor da venda: R$ ${valorVenda.toFixed(2)}`);
        console.log(`  - Crédito a usar: R$ ${creditoAplicado.toFixed(2)}`);
        console.log(`  - Desconto anterior: R$ ${(dadosVenda.desconto || 0).toFixed(2)}`);

        // Adicionar o crédito ao desconto na cópia que será salva
        dadosVenda.desconto = (dadosVenda.desconto || 0) + creditoAplicado;

        console.log(`  - Desconto total (com crédito): R$ ${dadosVenda.desconto.toFixed(2)}`);
      }

      // 💰 Aplicar cashback se foi escolhido usar
      let cashbackAplicado = 0;
      if (venda.aplicar_cashback && venda.cashback_disponivel > 0) {
        const valorVenda = calcularTotal() - (dadosVenda.desconto || 0) - creditoAplicado;
        cashbackAplicado = Math.min(venda.cashback_disponivel, valorVenda);

        console.log('💰 Aplicando cashback:');
        console.log(`  - Cashback disponível: R$ ${venda.cashback_disponivel.toFixed(2)}`);
        console.log(`  - Valor da venda: R$ ${valorVenda.toFixed(2)}`);
        console.log(`  - Cashback a usar: R$ ${cashbackAplicado.toFixed(2)}`);
        console.log(`  - Desconto anterior: R$ ${dadosVenda.desconto.toFixed(2)}`);

        // Adicionar o cashback ao desconto na cópia que será salva
        dadosVenda.desconto = (dadosVenda.desconto || 0) + cashbackAplicado;

        console.log(`  - Desconto total (com crédito + cashback): R$ ${dadosVenda.desconto.toFixed(2)}`);
      }

      // Calcular valor total final manualmente (usando apenas itens com quantidade > 0)
      const subtotal = itensComQuantidade.reduce((acc, item) => {
        const valorItem = parseFloat(item.quantidade || 0) * parseFloat(item.valor_unitario || 0);
        const descontoItem = parseFloat(item.desconto_valor || item.desconto || 0);
        return acc + (valorItem - descontoItem);
      }, 0);

      const descontoGeral = parseFloat(dadosVenda.desconto || 0);
      const taxaEntrega = parseFloat(dadosVenda.taxa_entrega || 0);
      dadosVenda.valor_total = subtotal - descontoGeral + taxaEntrega;

      console.log('💰 Cálculo final:');
      console.log('📤 PAYLOAD COMPLETO que será enviado:', JSON.stringify(dadosVenda, null, 2));
      console.log(`  - Subtotal: R$ ${subtotal.toFixed(2)}`);
      console.log(`  - Desconto geral: R$ ${descontoGeral.toFixed(2)}`);
      console.log(`  - Taxa de entrega: R$ ${taxaEntrega.toFixed(2)}`);
      console.log(`  - Valor total: R$ ${dadosVenda.valor_total.toFixed(2)}`);

      // Validar limite de crédito (após aplicar o crédito)
      // Só validar se o limite for maior que zero
      if (limiteCliente && limiteCliente.limiteDisponivel > 0) {
        const valorVenda = dadosVenda.valor_total;
        const limiteAposVenda = limiteCliente.limiteDisponivel - valorVenda;

        console.log('[CREDITO] Validando limite de credito:');
        console.log(`  - Valor da venda (final): R$ ${valorVenda.toFixed(2)}`);
        console.log(`  - Limite disponível: R$ ${limiteCliente.limiteDisponivel.toFixed(2)}`);
        console.log(`  - Limite após venda: R$ ${limiteAposVenda.toFixed(2)}`);

        if (limiteAposVenda < 0) {
          const excedente = Math.abs(limiteAposVenda);
          setError(
            `Limite de crédito insuficiente!\n\n` +
            `• Limite disponível: R$ ${limiteCliente.limiteDisponivel.toFixed(2)}\n` +
            `• Valor da venda: R$ ${valorVenda.toFixed(2)}\n` +
            `• Excedente: R$ ${excedente.toFixed(2)}\n\n` +
            `Entre em contato com o financeiro para aumentar o limite.`
          );
          setLoading(false);
          return;
        }
      } else if (limiteCliente && limiteCliente.limiteDisponivel === 0) {
        console.log('[CREDITO] Limite zerado - validacao ignorada');
      }

      console.log('[VENDA] Salvando venda:', dadosVenda);

      // ── OFFLINE: salvar localmente se servidor indisponível ───────────────────
      if (!servidorOk) {
        const operacaoOffline = operacoes.find(op => op.id_operacao === parseInt(dadosVenda.id_operacao));
        if (operacaoOffline?.gera_financeiro) {
          // Precisa de financeiro: guardar dados e abrir modal para coletar forma de pagamento
          console.log('[OFFLINE] Operação gera financeiro — abrindo modal para coletar pagamento');
          setDadosVendaOffline(dadosVenda);
          abrirModalFinanceiro({
            ...dadosVenda,
            id: null,
            id_venda: null,
            gerou_financeiro: false,
          });
          setLoading(false);
          return;
        }
        // Sem financeiro: salvar direto no IndexedDB
        const tempId = await salvarVendaOffline(dadosVenda, []);
        console.log('[OFFLINE] Venda salva localmente:', tempId);

        // Incrementar número do documento localmente para a próxima venda offline
        if (operacaoOffline?.usa_auto_numeracao && operacaoOffline?.id_operacao) {
          const novoNumero = parseInt(dadosVenda.numero_documento || 0) + 1;
          localStorage.setItem(`aperus_offline_num_${operacaoOffline.id_operacao}`, String(novoNumero));
          setOperacoes(prev => prev.map(op =>
            op.id_operacao === operacaoOffline.id_operacao
              ? { ...op, proximo_numero_nf: novoNumero }
              : op
          ));
          console.log('[OFFLINE] Próximo número do documento:', novoNumero);
        }

        setSuccess('✅ Venda salva localmente! Será sincronizada automaticamente quando o servidor estiver disponível.');
        limparFormulario();
        if (!embedded) {
          setModo('lista');
          carregarDados();
        }
        if (onSaveSuccess) onSaveSuccess();
        if (onClose) onClose();
        setLoading(false);
        return;
      }
      // ── FIM OFFLINE ──────────────────────────────────────────────────────────

      // Usar axiosInstance do AuthContext (já cuida da autenticação)
      // Se venda tem ID, é uma atualização (conversão), senão é nova venda
      let response;
      if (venda.id || dadosVenda.id) {
        const vendaId = venda.id || dadosVenda.id;
        console.log(`[VENDA] Atualizando venda existente ID: ${vendaId}`);
        response = await axiosInstance.patch(`/vendas/${vendaId}/`, dadosVenda);
        console.log('[VENDA] Venda atualizada:', response.data);
      } else {
        console.log('[VENDA] Criando nova venda');
        response = await axiosInstance.post('/vendas/', dadosVenda);
        console.log('[VENDA] Venda criada:', response.data);
      }

      // Se foi usado crédito, registrar a utilização
      if (usarCredito && creditoAplicado > 0) {
        try {
          console.log('[CREDITO] Registrando utilizacao de credito...');
          console.log(`  - Cliente: ${dadosVenda.id_cliente}`);
          console.log(`  - Venda: ${response.data.id}`);
          console.log(`  - Valor: R$ ${creditoAplicado.toFixed(2)}`);

          const utilizacaoResponse = await axiosInstance.post('/creditos/utilizar/', {
            id_cliente: dadosVenda.id_cliente,
            id_venda: response.data.id,
            valor: creditoAplicado
          });

          console.log('[CREDITO] Credito registrado com sucesso:', utilizacaoResponse.data);

          // Atualizar saldo de crédito do cliente
          const novoSaldo = creditoCliente - creditoAplicado;
          setCreditoCliente(novoSaldo);
          console.log(`[CREDITO] Novo saldo de credito do cliente: R$ ${novoSaldo.toFixed(2)}`);
        } catch (creditoErr) {
          console.error('⚠️ Erro ao registrar utilização de crédito:', creditoErr);
          console.error('Detalhes:', creditoErr.response?.data);
          // Não bloquear o fluxo se falhar o registro do crédito
          // A venda já foi salva com sucesso
        }
      }

      // 💰 Se foi usado cashback, registrar a utilização
      if (venda.aplicar_cashback && venda.cashback_disponivel > 0) {
        try {
          console.log('💰 [CASHBACK] Registrando utilização de cashback...');
          console.log(`  - Cliente: ${dadosVenda.id_cliente}`);
          console.log(`  - Venda: ${response.data.id}`);
          console.log(`  - Valor: R$ ${venda.cashback_disponivel.toFixed(2)}`);

          const cashbackResponse = await axiosInstance.post('/cashback/utilizar/', {
            id_cliente: dadosVenda.id_cliente,
            id_venda: response.data.id,
            valor_utilizar: venda.cashback_disponivel
          });

          console.log('💰 [CASHBACK] Cashback registrado com sucesso:', cashbackResponse.data);

          // Mostrar mensagem de sucesso
          alert(
            `✅ Cashback aplicado com sucesso!\n\n` +
            `💰 Valor utilizado: R$ ${venda.cashback_disponivel.toFixed(2)}`
          );
        } catch (cashbackErr) {
          console.error('⚠️ Erro ao registrar utilização de cashback:', cashbackErr);
          console.error('Detalhes:', cashbackErr.response?.data);
          // Mostrar erro ao usuário mas não bloquear o fluxo
          alert(
            `⚠️ Erro ao aplicar cashback:\n${cashbackErr.response?.data?.detail || 'Erro desconhecido'}\n\n` +
            `A venda foi salva, mas o cashback não foi aplicado.`
          );
        }
      }

      // Verificar se cashback foi gerado pelo backend
      if (response.data.cashback_gerado) {
        console.log('💰 [CASHBACK] Cashback gerado automaticamente:', response.data.cashback_gerado);
        alert(
          `🎉 Cashback Gerado!\n\n` +
          `💰 Valor: R$ ${parseFloat(response.data.cashback_gerado.valor).toFixed(2)}\n` +
          `📅 Válido até: ${new Date(response.data.cashback_gerado.validade).toLocaleDateString('pt-BR')}`
        );
      }

      // Incrementar próximo número da operação após salvar com sucesso
      try {
        await axiosInstance.patch(`/operacoes/${dadosVenda.id_operacao}/`, {
          proximo_numero_nf: parseInt(dadosVenda.numero_documento) + 1
        });
        console.log('✅ Próximo número da operação incrementado para:', parseInt(dadosVenda.numero_documento) + 1);
      } catch (numErr) {
        console.error('⚠️ Erro ao incrementar próximo número:', numErr);
      }

      setSuccess('✅ Venda salva com sucesso!');
      
      // Limpar cache persistente após salvar com sucesso
      try {
        await limparEstadoVendas();
        console.log('🧹 Cache de Vendas limpo após salvamento bem-sucedido');
      } catch (cacheErr) {
        console.error('⚠️ Erro ao limpar cache de Vendas:', cacheErr);
      }

      // Calcular valor total dos itens (usando os dados que foram salvos)
      const totalItens = dadosVenda.itens.reduce((acc, item) => {
        const subtotal = (item.quantidade * item.valor_unitario) - item.desconto;
        return acc + subtotal;
      }, 0);
      const valorTotalFinal = totalItens - (dadosVenda.desconto || 0) + (dadosVenda.taxa_entrega || 0);

      console.log('💰 Resumo pós-salvamento:');
      console.log(`  - Total itens: R$ ${totalItens.toFixed(2)}`);
      console.log(`  - Desconto total (incluindo crédito): R$ ${(dadosVenda.desconto || 0).toFixed(2)}`);
      console.log(`  - Taxa de entrega: R$ ${(dadosVenda.taxa_entrega || 0).toFixed(2)}`);
      console.log(`  - Valor final: R$ ${valorTotalFinal.toFixed(2)}`);

      // Buscar venda completa do backend para garantir dados corretos
      const idVendaSalva = response.data.id || response.data.id_venda;
      console.log('📊 Buscando venda completa do backend, ID:', idVendaSalva);

      const vendaCompleta = await axiosInstance.get(`/vendas/${idVendaSalva}/`);
      console.log('📊 Venda completa retornada:', vendaCompleta.data);

      // Usar valorTotalFinal calculado se o backend não retornar
      const vendaSalva = {
        ...vendaCompleta.data,
        valor_total: vendaCompleta.data.valor_total || valorTotalFinal
      };

      console.log('📊 ========== SALVAMENTO CONCLUÍDO ==========');
      console.log('📊 vendaSalva objeto final:', vendaSalva);
      console.log('💰 valor_total:', vendaSalva.valor_total, '(tipo:', typeof vendaSalva.valor_total, ')');
      console.log('📊 ==========================================');

      // Buscar a operação para verificar se gera financeiro
      const operacaoUsada = operacoes.find(op => op.id_operacao === parseInt(dadosVenda.id_operacao));
      console.log('🔍 Operação usada na venda:', operacaoUsada);
      console.log('💰 Gera financeiro?', operacaoUsada?.gera_financeiro);

      // Salvar dados de veículo novo para cada item, se operação exigir
      if (operacaoUsada?.venda_veiculo_novo) {
        const itensSalvos = vendaCompleta.data.itens || [];
        const itensLocais = itensComQuantidade;
        for (let i = 0; i < itensLocais.length; i++) {
          const itemLocal = itensLocais[i];
          const itemSalvo = itensSalvos[i];
          if (itemLocal.veiculo_dados && itemSalvo) {
            const idItemSalvo = itemSalvo.id_venda_item || itemSalvo.id;
            try {
              await axiosInstance.post(`/venda-item/${idItemSalvo}/veiculo-novo/`, itemLocal.veiculo_dados);
              console.log('🚗 Dados de veículo salvos para item:', idItemSalvo);
            } catch (veicErr) {
              console.error('⚠️ Erro ao salvar dados do veículo:', veicErr.response?.data || veicErr.message);
            }
          }
        }
      }

      // Verificar se a operação gera financeiro antes de abrir o modal
      if (operacaoUsada && operacaoUsada.gera_financeiro) {
        console.log('💰 Operação gera financeiro - abrindo modal financeiro');
        // Abrir modal financeiro usando a função existente
        abrirModalFinanceiro(vendaSalva);
        // Mudar para lista SOMENTE após fechar o modal (não aqui)
        // setModo('lista');
        // carregarDados(); // Será chamado após fechar modal
      } else {
        console.log('ℹ️ Operação NÃO gera financeiro - finalizando venda');
        
        // Se for uma entrega futura (destino), recarregar vendas pendentes
        if (venda.venda_futura_origem) {
          console.log('🔄 Recarregando vendas pendentes após entrega...');
          await buscarVendasFuturasPendentes();
        }
        
        // Se não gera financeiro, finalizar e voltar para lista
        limparFormulario();
        
        if (onSaveSuccess) onSaveSuccess();
        if (onClose) onClose();
        
        if (!embedded) {
          setModo('lista');
          carregarDados();
        }
      }

    } catch (err) {
      console.error('❌ Erro ao salvar:', err);

      // ── FALLBACK OFFLINE: servidor caiu durante o processo ──────────────────
      const httpStatus = err?.response?.status;
      const isServerError = !err.response || httpStatus >= 500;
      if (isServerError && dadosVenda) {
        try {
          const tempId = await salvarVendaOffline(dadosVenda, []);
          console.log('[OFFLINE] Venda salva offline como fallback:', tempId);
          setSuccess('✅ Servidor indisponível — venda salva offline! Será sincronizada automaticamente.');
          limparFormulario();
          if (!embedded) {
            setModo('lista');
            carregarDados();
          }
          if (onSaveSuccess) onSaveSuccess();
          if (onClose) onClose();
          setLoading(false);
          return;
        } catch (offlineErr) {
          console.error('[OFFLINE] Falha ao salvar offline:', offlineErr);
        }
      }
      // ─────────────────────────────────────────────────────────────────────────

      if (err.response?.status === 401) {
        setError('🔐 Token expirado! Faça login novamente.');
      } else {
        setError(`Erro ao salvar venda: ${err.response?.data?.detail || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de financeiro
  const abrirModalFinanceiro = (venda) => {
    console.log('💰 ========== ABRINDO MODAL FINANCEIRO ==========');
    console.log('💰 Venda recebida:', venda);
    console.log('💰 venda.valor_total:', venda?.valor_total, '(tipo:', typeof venda?.valor_total, ')');
    console.log('💰 ===============================================');

    // Verificar se a venda já gerou financeiro
    if (venda.gerou_financeiro) {
      setError('❌ Esta venda já possui financeiro gerado!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Buscar a operação para verificar se gera financeiro
    const operacao = operacoes.find(op => op.id_operacao === parseInt(venda.id_operacao));

    if (!operacao) {
      setError('❌ Operação não encontrada!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!operacao.gera_financeiro) {
      setError('❌ Esta operação não gera financeiro!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Garantir que valor_total é um número
    const vendaComValor = {
      ...venda,
      valor_total: parseFloat(venda.valor_total) || 0
    };

    console.log('💰 Venda processada para modal:', vendaComValor);
    console.log('💰 vendaComValor.valor_total:', vendaComValor.valor_total, '(tipo:', typeof vendaComValor.valor_total, ')');

    setVendaParaFinanceiro(vendaComValor);
    setFormaPagamento('');
    setNumeroParcelas(1);
    setDataVencimento(new Date().toISOString().split('T')[0]);
    setContaBancaria('');
    setDepartamento('');
    setCentroCusto('');
    setValorPago(0);
    setTroco(0);
    setOpenFinanceiroModal(true);
  };

  // Cancelar e EXCLUIR a venda
  const cancelarModalFinanceiro = async () => {
    // Modo offline: venda ainda não foi salva, apenas limpar estado
    if (dadosVendaOffline) {
      setDadosVendaOffline(null);
      setOpenFinanceiroModal(false);
      setVendaParaFinanceiro(null);
      setFormaPagamento('');
      setNumeroParcelas(1);
      setDataVencimento(new Date().toISOString().split('T')[0]);
      setContaBancaria('');
      setDepartamento('');
      setCentroCusto('');
      setAlertaLimiteFinanceiro(null);
      return;
    }
    // Se tem venda para financeiro, significa que foi salva mas não gerou financeiro
    if (vendaParaFinanceiro && vendaParaFinanceiro.id) {
      try {
        console.log('🗑️ CANCELAR CLICADO - Excluindo venda ID:', vendaParaFinanceiro.id);
        await axiosInstance.delete(`/vendas/${vendaParaFinanceiro.id}/`);
        console.log('✅ Venda excluída com sucesso');
        setSuccess('❌ Venda cancelada e excluída com sucesso');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('❌ Erro ao excluir venda:', err);
        setError('Erro ao excluir venda: ' + (err.response?.data?.detail || err.message));
      }
    }

    setOpenFinanceiroModal(false);
    setVendaParaFinanceiro(null);
    setFormaPagamento('');
    setNumeroParcelas(1);
    setDataVencimento(new Date().toISOString().split('T')[0]);
    setContaBancaria('');
    setDepartamento('');
    setCentroCusto('');
    setAlertaLimiteFinanceiro(null);

    // Voltar para lista e recarregar dados
    setModo('lista');
    carregarDados();
  };

  // Fechar modal após sucesso (NÃO exclui a venda)
  const fecharModalFinanceiro = () => {
    console.log('✅ Fechando modal após sucesso - NÃO exclui venda');
    setOpenFinanceiroModal(false);
    setVendaParaFinanceiro(null);
    setFormaPagamento('');
    setNumeroParcelas(1);
    setDataVencimento(new Date().toISOString().split('T')[0]);
    setContaBancaria('');
    setDepartamento('');
    setCentroCusto('');
    setAlertaLimiteFinanceiro(null);

    // Fechar modal de Nova Venda
    setOpenModalNovaVenda(false);
    
    // Limpar formulário
    limparFormulario();

    // Voltar para lista e recarregar dados
    if (onSaveSuccess) onSaveSuccess();
    if (onClose) onClose();

    if (!embedded) {
      setModo('lista');
      carregarDados();
    }
  };

  // ===== FUNÇÕES DE LIMITE DE CRÉDITO E AUTORIZAÇÃO =====

  // Verificar senha do supervisor
  const verificarSenhaSupervisor = async () => {
    try {
      console.log('🔐 [INICIO] verificarSenhaSupervisor chamada');
      setVerificandoSenha(true);
      setError('');

      if (!senhaSupervisor.username || !senhaSupervisor.password) {
        console.log('❌ Usuário ou senha vazios');
        setError('❌ Preencha usuário e senha do supervisor');
        setVerificandoSenha(false);
        return;
      }

      console.log('🔐 Verificando senha do supervisor:', senhaSupervisor.username);
      console.log('📡 Enviando requisição para /verificar-senha-supervisor/');

      const response = await axiosInstance.post('/verificar-senha-supervisor/', {
        username: senhaSupervisor.username,
        password: senhaSupervisor.password
      });

      console.log('📥 Resposta recebida:', response.data);
      console.log('✅ Success?', response.data.success);

      if (response.data.success) {
        console.log('✅ Senha validada! Supervisor:', response.data.supervisor.nome);
        setSuccess(`✅ Venda autorizada por ${response.data.supervisor.nome}`);

        // Fechar modal
        console.log('🚪 Fechando modal de autorização');
        setOpenLimiteModal(false);
        setSenhaSupervisor({ username: '', password: '' });
        setLimiteInfo(null);

        // Chamar gerarFinanceiro direto, pulando a validação
        console.log('🔓 Gerando financeiro com autorização do supervisor (modo direto)...');
        console.log('📦 vendaParaFinanceiro atual:', vendaParaFinanceiro);

        // Chamar a geração direta sem validação
        await gerarFinanceiroSemValidacao();

        console.log('✅ [FIM] Processo de autorização concluído');
      } else {
        console.log('❌ Success = false:', response.data.message);
        setError(`❌ ${response.data.message}`);
      }
    } catch (err) {
      console.error('❌ Erro ao verificar senha:', err);
      console.error('📄 Detalhes do erro:', err.response?.data);
      const mensagem = err.response?.data?.message || 'Senha inválida ou usuário sem permissão de supervisor';
      setError(`❌ ${mensagem}`);
    } finally {
      console.log('🏁 Finally: setVerificandoSenha(false)');
      setVerificandoSenha(false);
    }
  };

  // ===== FUNÇÕES DE APROVAÇÃO DE DESCONTO VIA WHATSAPP =====

  const fecharModalDesconto = () => {
    setOpenDescontoModal(false);
    setInfoDesconto(null);
    setSolicitacaoDesconto(null);
    setEnviandoWhatsApp(false);
    setAguardandoAprovacaoWhatsApp(false);
    setSenhaSupervisorDesconto({ username: '', password: '' });
    setVerificandoSenhaDesconto(false);
  };

  const solicitarAprovacaoDescontoWhatsApp = async (percentualSolicitado, limiteDesconto) => {
    try {
      setEnviandoWhatsApp(true);
      const nomeCliente = clientes.find(c => String(c.id_cliente) === String(venda.id_cliente))?.nome_razao_social || '';
      const nomeVendedor = vendedores.find(v => String(v.id_vendedor) === String(venda.id_vendedor))?.nome_vendedor || '';
      const response = await axiosInstance.post('/aprovacao/desconto/', {
        id_venda: venda.id_venda || 0,
        id_cliente: venda.id_cliente || null,
        nome_vendedor: nomeVendedor,
        nome_cliente: nomeCliente,
        valor_total: parseFloat(venda.valor_total) || 0,
        percentual_solicitado: percentualSolicitado,
        limite_desconto: limiteDesconto,
      }, { timeout: 90000 });

      const solicitacao = {
        id_solicitacao: response.data.id_solicitacao,
        token: response.data.token,
        status: 'Pendente',
        whatsapp_enviado: response.data.whatsapp_enviado,
        mensagem: response.data.mensagem_whatsapp,
      };
      setSolicitacaoDesconto(solicitacao);

      if (response.data.whatsapp_enviado) {
        setAguardandoAprovacaoWhatsApp(true);
        const pollingInterval = setInterval(async () => {
          try {
            const statusResp = await axiosInstance.get(`/aprovacao/${solicitacao.id_solicitacao}/status/`);
            const { status: statusAtual, percentual_aprovado } = statusResp.data;
            setSolicitacaoDesconto(prev => prev && { ...prev, status: statusAtual, percentual_aprovado });
            if (statusAtual === 'Aprovada' || statusAtual === 'Rejeitada') {
              clearInterval(pollingInterval);
              setAguardandoAprovacaoWhatsApp(false);
              if (statusAtual === 'Aprovada') {
                setAprovacaoDescontoViaWhatsApp(true);
                setOpenDescontoModal(false);
                setTimeout(() => salvarVenda(), 100);
              }
            }
          } catch (e) { /* ignore polling errors */ }
        }, 5000);
      }
    } catch (err) {
      setError(`❌ Erro ao solicitar aprovação: ${err.response?.data?.detail || err.message}`);
    } finally {
      setEnviandoWhatsApp(false);
    }
  };

  const verificarSenhaSupervisorDesconto = async () => {
    try {
      setVerificandoSenhaDesconto(true);
      setError('');
      if (!senhaSupervisorDesconto.username || !senhaSupervisorDesconto.password) {
        setError('❌ Preencha usuário e senha do supervisor');
        setVerificandoSenhaDesconto(false);
        return;
      }
      const response = await axiosInstance.post('/verificar-senha-supervisor/', {
        username: senhaSupervisorDesconto.username,
        password: senhaSupervisorDesconto.password,
      });
      if (response.data.success) {
        setSuccess(`✅ Desconto autorizado por ${response.data.supervisor.nome}`);
        setAutorizacaoSupervisor(true);
        setOpenDescontoModal(false);
        setSenhaSupervisorDesconto({ username: '', password: '' });
        setTimeout(() => salvarVenda(), 100);
      } else {
        setError('❌ Senha inválida ou usuário sem permissão de supervisor');
      }
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'Senha inválida ou usuário sem permissão'}`);
    } finally {
      setVerificandoSenhaDesconto(false);
    }
  };

  // Gerar financeiro SEM validação (após autorização do supervisor)
  const gerarFinanceiroSemValidacao = async () => {
    try {
      console.log('💰 [DIRETO] Gerando financeiro SEM validação...');
      setLoading(true);

      const valorTotal = parseFloat(vendaParaFinanceiro.valor_total);
      const valorParcela = valorTotal / numeroParcelas;

      console.log(`💰 Criando ${numeroParcelas} parcela(s) de R$ ${valorParcela.toFixed(2)}`);

      // Buscar configuração da operação para verificar baixa automática
      let baixaAutomatica = false;
      try {
        const operacaoResponse = await axiosInstance.get(`/operacoes/${vendaParaFinanceiro.id_operacao}/`);
        baixaAutomatica = operacaoResponse.data.baixa_automatica || false;
        console.log(`📋 Operação ${vendaParaFinanceiro.id_operacao} - Baixa Automática: ${baixaAutomatica}`);
      } catch (error) {
        console.warn('⚠️ Não foi possível buscar dados da operação:', error);
      }

      // Criar todas as parcelas
      for (let i = 0; i < numeroParcelas; i++) {
        const dataVenc = new Date(dataVencimento);
        dataVenc.setMonth(dataVenc.getMonth() + i);

        const valorParcelaFormatado = parseFloat(valorParcela.toFixed(2));

        // Lógica de baixa automática: se data_venda == data_vencimento E baixa_automatica = true
        const dataEmissao = new Date(vendaParaFinanceiro.data_venda).toISOString().split('T')[0];
        const dataVencimentoStr = dataVenc.toISOString().split('T')[0];
        const deveBaixarAutomaticamente = baixaAutomatica && (dataEmissao === dataVencimentoStr);

        console.log(`🔍 [PARCELA ${i + 1}] Verificando baixa automática:`, {
          baixaAutomatica,
          dataVenda: vendaParaFinanceiro.data_venda,
          dataEmissao,
          dataVencimentoStr,
          saoIguais: dataEmissao === dataVencimentoStr,
          deveBaixar: deveBaixarAutomaticamente
        });

        const contaReceber = {
          tipo_conta: 'Receber',
          id_cliente_fornecedor: vendaParaFinanceiro.id_cliente,
          descricao: `Venda ${vendaParaFinanceiro.numero_documento} - Parcela ${i + 1}/${numeroParcelas}`,
          valor_parcela: valorParcelaFormatado,
          valor_original: valorParcelaFormatado,
          saldo_devedor: valorParcelaFormatado,
          data_vencimento: dataVencimentoStr,
          data_emissao: dataEmissao,
          forma_pagamento: formaPagamento,
          id_venda_origem: vendaParaFinanceiro.id || vendaParaFinanceiro.id_venda,
          id_operacao: vendaParaFinanceiro.id_operacao,
          parcela_numero: i + 1,
          parcela_total: numeroParcelas,
          documento_numero: vendaParaFinanceiro.numero_documento,
          status_conta: deveBaixarAutomaticamente ? 'Paga' : 'Pendente',
          valor_liquidado: deveBaixarAutomaticamente ? valorParcelaFormatado : 0,
          data_pagamento: deveBaixarAutomaticamente ? dataEmissao : null,
          gerencial: 0,
          id_conta_cobranca: contaBancaria || null,
          id_conta_baixa: deveBaixarAutomaticamente ? (contaBancaria || null) : null,
          id_departamento: departamento || null,
          id_centro_custo: centroCusto || null
        };

        console.log(`📝 Criando parcela ${i + 1} (Baixa Auto: ${deveBaixarAutomaticamente}):`, contaReceber);

        const respostaParcela = await axiosInstance.post('/contas/', contaReceber);
        console.log(`✅ Parcela ${i + 1} criada:`, respostaParcela.data);
      }

      // Marcar venda como gerando financeiro
      await axiosInstance.patch(`/vendas/${vendaParaFinanceiro.id}/`, {
        gerou_financeiro: 1
      });

      console.log('✅ Financeiro gerado com sucesso!');
      setSuccess('✅ Financeiro gerado com sucesso!');
      setOpenFinanceiroModal(false);

      // Limpar formulário e voltar para lista
      limparFormulario();
      setModo('lista');

      // Recarregar a lista de vendas
      carregarDados();

    } catch (error) {
      console.error('❌ Erro ao gerar financeiro:', error);
      setError('Erro ao gerar financeiro: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Salvar venda após autorização do supervisor
  const salvarVendaAutorizada = async () => {
    try {
      setLoading(true);
      console.log('🔓 Salvando venda com autorização do supervisor...');

      // Preparar dados da venda (mesma lógica do salvarVenda)
      let dadosVenda = { ...venda };
      let creditoAplicado = 0;

      // Converter desconto percentual para valor antes de enviar
      if (venda.tipo_desconto_geral === 'percentual') {
        const subtotalItens = venda.itens.reduce((acc, item) => {
          const valorItem = parseFloat(item.quantidade || 0) * parseFloat(item.valor_unitario || 0);
          const descontoItem = parseFloat(item.desconto_valor || item.desconto || 0);
          return acc + (valorItem - descontoItem);
        }, 0);
        dadosVenda.desconto = (subtotalItens * (parseFloat(venda.desconto) || 0)) / 100;
      }

      // Se está usando crédito, aplicar desconto
      if (usarCredito && creditoCliente > 0) {
        const valorTotal = parseFloat(venda.valor_total) || 0;
        creditoAplicado = Math.min(creditoCliente, valorTotal);

        const descontoAtual = parseFloat(dadosVenda.desconto) || 0;
        dadosVenda.desconto = descontoAtual + creditoAplicado;

        console.log(`[CREDITO] Aplicando R$ ${creditoAplicado.toFixed(2)} de crédito`);
      }

      // Preparar itens para envio
      dadosVenda.itens = venda.itens.map(item => ({
        id_produto: item.id_produto,
        quantidade: parseFloat(item.quantidade) || 0,
        valor_unitario: parseFloat(item.valor_unitario) || 0,
        desconto: parseFloat(item.desconto) || 0,
        desconto_valor: parseFloat(item.desconto) || 0
      }));

      // Garantir tipos corretos
      dadosVenda.desconto = parseFloat(dadosVenda.desconto) || 0;
      dadosVenda.taxa_entrega = parseFloat(dadosVenda.taxa_entrega) || 0;
      dadosVenda.valor_total = parseFloat(dadosVenda.valor_total) || 0;

      console.log('📤 Enviando venda autorizada:', dadosVenda);

      const response = await axiosInstance.post('/vendas/', dadosVenda);
      console.log('✅ Venda salva com sucesso:', response.data);

      // Registrar uso de crédito se aplicável
      if (usarCredito && creditoAplicado > 0) {
        try {
          await axiosInstance.post('/creditos/utilizar/', {
            id_cliente: dadosVenda.id_cliente,
            id_venda: response.data.id,
            valor: creditoAplicado
          });
          setCreditoCliente(creditoCliente - creditoAplicado);
        } catch (creditoErr) {
          console.error('⚠️ Erro ao registrar crédito:', creditoErr);
        }
      }

      // Atualizar próximo número da operação
      try {
        await axiosInstance.patch(`/operacoes/${dadosVenda.id_operacao}/`, {
          proximo_numero_nf: parseInt(dadosVenda.numero_documento) + 1
        });
      } catch (err) {
        console.error('Erro ao atualizar próximo número:', err);
      }

      setSuccess('✅ Venda salva com sucesso com autorização do supervisor!');
      
      // Limpar cache persistente após salvar com sucesso
      try {
        await limparEstadoVendas();
        console.log('🧹 Cache de Vendas limpo após salvamento autorizado');
      } catch (cacheErr) {
        console.error('⚠️ Erro ao limpar cache de Vendas:', cacheErr);
      }

      // Buscar venda completa e abrir modal financeiro
      const idVendaSalva = response.data.id || response.data.id_venda;
      const vendaCompleta = await axiosInstance.get(`/vendas/${idVendaSalva}/`);

      const vendaSalva = {
        ...vendaCompleta.data,
        valor_total: vendaCompleta.data.valor_total || dadosVenda.valor_total
      };

      abrirModalFinanceiro(vendaSalva);

    } catch (err) {
      console.error('❌ Erro ao salvar venda autorizada:', err);
      setError(`Erro ao salvar venda: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Bloquear venda sem autorização
  const bloquearVenda = () => {
    setOpenLimiteModal(false);
    setSenhaSupervisor({ username: '', password: '' });
    setLimiteInfo(null);
    setError('❌ Venda bloqueada - limite de crédito ultrapassado');
  };

  // Obter tipo de operação (Orçamento, Venda, Condicional)
  const getTipoOperacao = (vendaObj) => {
    const operacao = operacoes.find(op => op.id_operacao === vendaObj.id_operacao);
    if (!operacao) return { tipo: 'venda', label: 'Venda', color: 'primary' };

    const modeloDoc = (operacao.modelo_documento || '').toLowerCase();

    if (modeloDoc === 'orçamento' || modeloDoc === 'orcamento') {
      return { tipo: 'orcamento', label: 'Orçamento', color: 'info' };
    } else if (modeloDoc === 'condicional') {
      return { tipo: 'condicional', label: 'Condicional', color: 'warning' };
    } else {
      // Para qualquer outro modelo (55, 65, 99, etc), considera como venda
      return { tipo: 'venda', label: 'Venda', color: 'success' };
    }
  };



  // Abrir modal de conversão - agora abre em modo de edição
  const abrirModalConverter = async (vendaOriginal) => {
    console.log('📝 Abrindo venda para conversão:', vendaOriginal);

    // Buscar primeira operação de venda como padrão
    const operacaoVendaPadrao = operacoes.find(op =>
      op.gera_financeiro === 1 &&
      !['orçamento', 'orcamento', 'condicional'].includes((op.modelo_documento || '').toLowerCase())
    );

    // Carregar a venda completa para edição
    try {
      const idVenda = vendaOriginal.id || vendaOriginal.id_venda;
      const response = await axiosInstance.get(`/vendas/${idVenda}/`);
      const vendaCompleta = response.data;

      // Setar venda em modo de edição, mas com operação de venda
      const novaOperacaoId = operacaoVendaPadrao?.id_operacao || vendaCompleta.id_operacao;

      // Buscar próximo número da nova operação
      let proximoNumero = vendaCompleta.numero_documento || '';
      if (operacaoVendaPadrao) {
        try {
          const responseOp = await axiosInstance.get(`/operacoes/${novaOperacaoId}/`);
          console.log('📋 Dados completos da operação de venda:', responseOp.data);
          console.log('📄 proximo_numero_nf da operação:', responseOp.data.proximo_numero_nf);
          proximoNumero = (responseOp.data.proximo_numero_nf || 1).toString();
          console.log('📄 Número que será usado na conversão:', proximoNumero);
        } catch (err) {
          console.error('Erro ao buscar próximo número da operação:', err);
        }
      }

      setVenda({
        id: vendaCompleta.id || vendaCompleta.id_venda,
        id_operacao: novaOperacaoId,
        id_cliente: vendaCompleta.id_cliente,
        id_vendedor: vendaCompleta.id_vendedor || '',
        data_venda: vendaCompleta.data_venda || new Date().toISOString().split('T')[0],
        numero_documento: proximoNumero,
        observacoes: vendaCompleta.observacoes || '',
        desconto: parseFloat(vendaCompleta.desconto) || 0,
        taxa_entrega: parseFloat(vendaCompleta.taxa_entrega) || 0,
        valor_total: parseFloat(vendaCompleta.valor_total) || 0,
        itens: vendaCompleta.itens || []
      });

      console.log('🔄 Operação atualizada para conversão:', operacaoVendaPadrao);

      // Mudar para modo de edição
      setModo('nova');

      // Scroll para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Erro ao carregar venda:', err);
      setError('Erro ao carregar venda para conversão');
    }
  };

  // Abrir modal de cliente
  const abrirModalCliente = () => {
    setClienteForm({
      nome_razao_social: '',
      nome_fantasia: '',
      cpf_cnpj: '',
      rg_ie: '',
      telefone: '',
      celular: '',
      whatsapp: '',
      email: '',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      limite_credito: '0.00',
      data_nascimento: '',
      sexo: ''
    });
    setOpenClienteModal(true);
  };

  // Fechar modal de cliente
  const fecharModalCliente = () => {
    setOpenClienteModal(false);
  };

  // Buscar dados por CNPJ (API ReceitaWS)
  const buscarPorCNPJ = async (cnpj) => {
    try {
      const cnpjLimpo = cnpj.replace(/\D/g, '');

      if (cnpjLimpo.length !== 14) {
        setError('CNPJ deve ter 14 dígitos');
        return;
      }

      setLoading(true);
      console.log('🔍 Buscando CNPJ:', cnpjLimpo);

      const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      const dados = response.data;

      console.log('✅ Dados do CNPJ:', dados);

      setClienteForm(prev => ({
        ...prev,
        nome_razao_social: dados.razao_social || prev.nome_razao_social,
        nome_fantasia: dados.nome_fantasia || prev.nome_fantasia,
        cpf_cnpj: cnpj,
        telefone: dados.ddd_telefone_1 ? `(${dados.ddd_telefone_1.substring(0, 2)}) ${dados.ddd_telefone_1.substring(2)}` : prev.telefone,
        email: dados.email || prev.email,
        cep: dados.cep || prev.cep,
        endereco: dados.logradouro || prev.endereco,
        numero: dados.numero || prev.numero,
        complemento: dados.complemento || prev.complemento,
        bairro: dados.bairro || prev.bairro,
        cidade: dados.municipio || prev.cidade,
        estado: dados.uf || prev.estado
      }));

      setSuccess('✅ Dados do CNPJ carregados com sucesso!');

    } catch (err) {
      console.error('❌ Erro ao buscar CNPJ:', err);
      setError('Erro ao buscar CNPJ. Verifique o número digitado.');
    } finally {
      setLoading(false);
    }
  };

  // Buscar endereço por CEP (API ViaCEP)
  const buscarPorCEP = async (cep) => {
    try {
      const cepLimpo = cep.replace(/\D/g, '');

      if (cepLimpo.length !== 8) {
        setError('CEP deve ter 8 dígitos');
        return;
      }

      setLoading(true);
      console.log('🔍 Buscando CEP:', cepLimpo);

      const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = response.data;

      if (dados.erro) {
        setError('CEP não encontrado');
        setLoading(false);
        return;
      }

      console.log('✅ Dados do CEP:', dados);

      setClienteForm(prev => ({
        ...prev,
        cep: cep,
        endereco: dados.logradouro || prev.endereco,
        complemento: dados.complemento || prev.complemento,
        bairro: dados.bairro || prev.bairro,
        cidade: dados.localidade || prev.cidade,
        estado: dados.uf || prev.estado
      }));

      setSuccess('✅ Endereço carregado com sucesso!');

    } catch (err) {
      console.error('❌ Erro ao buscar CEP:', err);
      setError('Erro ao buscar CEP. Verifique o número digitado.');
    } finally {
      setLoading(false);
    }
  };

  // Salvar novo cliente
  const salvarNovoCliente = async () => {
    try {
      setLoading(true);
      setError('');

      if (!clienteForm.nome_razao_social) {
        setError('Nome/Razão Social é obrigatório');
        setLoading(false);
        return;
      }

      console.log('💾 Salvando novo cliente:', clienteForm);

      const response = await axiosInstance.post('/clientes/', clienteForm);

      console.log('✅ Cliente salvo:', response.data);

      // Recarregar lista de clientes
      const clientesResponse = await axiosInstance.get('/clientes/');
      setClientes(clientesResponse.data.results || clientesResponse.data);

      // Selecionar o cliente recém-criado
      const novoClienteId = response.data.id || response.data.id_cliente;
      setVenda(prev => ({ ...prev, id_cliente: novoClienteId }));
      setDecisaoCashbackTomada(false);
      buscarLimiteCliente(novoClienteId);
      verificarCashbackCliente(novoClienteId);

      setSuccess('✅ Cliente cadastrado com sucesso!');
      fecharModalCliente();

    } catch (err) {
      console.error('❌ Erro ao salvar cliente:', err);
      setError(`Erro ao salvar cliente: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Gerar financeiro (criar operações a receber)
  const gerarFinanceiro = async () => {
    console.log('🔥🔥🔥 FUNÇÃO GERAR FINANCEIRO INICIADA! 🔥🔥🔥');
    console.log('  vendaParaFinanceiro:', vendaParaFinanceiro);
    console.log('  formaPagamento:', formaPagamento);
    console.log('  dataVencimento:', dataVencimento);
    console.log('  numeroParcelas:', numeroParcelas);

    try {
      setLoading(true);
      setError('');

      if (!formaPagamento) {
        console.log('❌ Forma de pagamento não selecionada!');
        setError('Selecione a forma de pagamento');
        setLoading(false);
        return;
      }

      const valorTotal = parseFloat(vendaParaFinanceiro.valor_total || 0);
      const valorParcela = valorTotal / numeroParcelas;

      if (!valorTotal || valorTotal <= 0) {
        setError('Valor total da venda inválido');
        setLoading(false);
        return;
      }

      // ── MODO OFFLINE: coletar parcelas e salvar tudo no IndexedDB ─────────────
      if (dadosVendaOffline) {
        const operacaoLocal = operacoes.find(
          op => op.id_operacao === parseInt(dadosVendaOffline.id_operacao)
        );
        const baixaAutomatica = operacaoLocal?.baixa_automatica || false;
        const financeirosOffline = [];
        for (let i = 0; i < numeroParcelas; i++) {
          const dataVencOff = new Date(dataVencimento);
          dataVencOff.setMonth(dataVencOff.getMonth() + i);
          const vpf = parseFloat(valorParcela.toFixed(2));
          const dataEmissao = new Date().toISOString().split('T')[0];
          const dataVencStr = dataVencOff.toISOString().split('T')[0];
          const deveBaixar = baixaAutomatica && (dataEmissao === dataVencStr);
          financeirosOffline.push({
            tipo_conta: 'receber',
            id_cliente_fornecedor: dadosVendaOffline.id_cliente,
            descricao: `Venda ${dadosVendaOffline.numero_documento} - Parcela ${i + 1}/${numeroParcelas}`,
            valor_parcela: vpf,
            valor_original: vpf,
            saldo_devedor: vpf,
            data_vencimento: dataVencStr,
            data_emissao: dataEmissao,
            forma_pagamento: formaPagamento,
            id_venda_origem: null, // preenchido na sincronização
            id_operacao: dadosVendaOffline.id_operacao,
            parcela_numero: i + 1,
            parcela_total: numeroParcelas,
            documento_numero: dadosVendaOffline.numero_documento,
            status_conta: deveBaixar ? 'Paga' : 'Pendente',
            valor_liquidado: deveBaixar ? vpf : 0,
            data_pagamento: deveBaixar ? dataEmissao : null,
            gerencial: 0,
            id_conta_cobranca: contaBancaria || null,
            id_conta_baixa: deveBaixar ? (contaBancaria || null) : null,
            id_departamento: departamento || null,
            id_centro_custo: centroCusto || null,
          });
        }
        const tempId = await salvarVendaOffline(dadosVendaOffline, financeirosOffline);
        console.log('[OFFLINE] Venda + financeiro salvos localmente:', tempId);

        // Incrementar número do documento localmente para a próxima venda offline
        const opFinOff = operacoes.find(op => op.id_operacao === parseInt(dadosVendaOffline.id_operacao));
        if (opFinOff?.usa_auto_numeracao && opFinOff?.id_operacao) {
          const novoNumeroFin = parseInt(dadosVendaOffline.numero_documento || 0) + 1;
          localStorage.setItem(`aperus_offline_num_${opFinOff.id_operacao}`, String(novoNumeroFin));
          setOperacoes(prev => prev.map(op =>
            op.id_operacao === opFinOff.id_operacao
              ? { ...op, proximo_numero_nf: novoNumeroFin }
              : op
          ));
          console.log('[OFFLINE] Próximo número do documento (com financeiro):', novoNumeroFin);
        }

        setDadosVendaOffline(null);
        setSuccess(`✅ Venda e ${numeroParcelas} parcela(s) salvas offline! Serão sincronizadas automaticamente.`);
        setOpenFinanceiroModal(false);
        setVendaParaFinanceiro(null);
        limparFormulario();
        if (!embedded) { setModo('lista'); carregarDados(); }
        if (onSaveSuccess) onSaveSuccess();
        if (onClose) onClose();
        setLoading(false);
        return;
      }
      // ── FIM MODO OFFLINE ──────────────────────────────────────────────────────

      console.log('📊 Gerando financeiro:', {
        vendaParaFinanceiro,
        formaPagamento,
        numeroParcelas,
        valorTotal,
        valorParcela,
        dataVencimento
      });

      // ===== VALIDAÇÃO DE LIMITE DE CRÉDITO COM DATA DE VENCIMENTO =====
      const operacaoSelecionada = operacoes.find(op => op.id_operacao === vendaParaFinanceiro.id_operacao);
      const validacaoLimite = operacaoSelecionada?.validacao_limite_credito || 'nao_validar';

      console.log('🔍 ===== INICIANDO VALIDAÇÃO DE LIMITE =====');
      console.log('  Operação:', operacaoSelecionada?.nome_operacao);
      console.log('  Validação configurada:', validacaoLimite);
      console.log('  Cliente ID:', vendaParaFinanceiro.id_cliente);
      console.log('  Valor Total:', valorTotal);

      // ===== NOVA VALIDAÇÃO: BLOQUEAR SE DATA VENCIMENTO > DATA DOCUMENTO =====
      const dataDocumento = new Date(vendaParaFinanceiro.data_venda);
      const dataVenc = new Date(dataVencimento);

      console.log('📅 Validando datas:', {
        dataDocumento: dataDocumento.toLocaleDateString('pt-BR'),
        dataVencimento: dataVenc.toLocaleDateString('pt-BR'),
        documentoTimestamp: dataDocumento.getTime(),
        vencimentoTimestamp: dataVenc.getTime(),
        vencimentoMaior: dataVenc > dataDocumento,
        validacaoLimite: validacaoLimite
      });

      // ===== VALIDAÇÃO DE VENDAS A PRAZO E LIMITE DE CRÉDITO =====
      if (validacaoLimite !== 'nao_validar' && dataVenc > dataDocumento && !autorizacaoSupervisor) {
        // É uma venda a prazo (data vencimento > data documento) e NÃO tem autorização
        console.log('⚠️ Venda a prazo detectada - aplicando validação:', validacaoLimite);

        if (validacaoLimite === 'alertar') {
          // ALERTAR: NÃO mostra nada, apenas DEIXA GERAR
          console.log('⚠️ Modo ALERTAR: permitindo venda a prazo sem bloqueio');
          // Não faz nada, apenas deixa continuar

        } else if (validacaoLimite === 'bloquear') {
          // BLOQUEAR: Bloqueia completamente
          console.log('🚫 Modo BLOQUEAR: bloqueando venda a prazo!');
          setMensagemBloqueio(
            `A data de vencimento (${dataVenc.toLocaleDateString('pt-BR')}) é maior que ` +
            `a data do documento (${dataDocumento.toLocaleDateString('pt-BR')}).\n\n` +
            `Esta operação está configurada para BLOQUEAR vendas a prazo.\n\n` +
            `Vendas a prazo não são permitidas.`
          );
          setOpenBloqueioModal(true);
          setLoading(false);
          return; // BLOQUEIA

        } else if (validacaoLimite === 'solicitar_senha') {
          // SOLICITAR_SENHA: Pede autorização do supervisor
          console.log('🔐 Modo SOLICITAR_SENHA: solicitando autorização para venda a prazo');

          // Calcular dias entre as datas
          const diffTime = Math.abs(dataVenc - dataDocumento);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          const infoModal = {
            cliente: { nome: clientes.find(c => c.id_cliente === vendaParaFinanceiro.id_cliente)?.nome_razao_social || 'Cliente' },
            valor_venda: valorTotal,
            motivo: 'prazo_vencimento',
            mensagem: 'Venda a prazo requer autorização do supervisor',
            data_documento: dataDocumento.toLocaleDateString('pt-BR'),
            data_vencimento: dataVenc.toLocaleDateString('pt-BR'),
            prazo_maximo: 0, // Operação não permite prazo
            dias_excedentes: diffDays
          };
          console.log('📋 Configurando limiteInfo:', infoModal);
          setLimiteInfo(infoModal);
          console.log('🔓 Abrindo modal de autorização...');
          setOpenLimiteModal(true);
          console.log('✅ Modal deve estar aberto agora - openLimiteModal=true');
          setLoading(false);
          return; // PEDE SENHA
        }
      }

      // ===== VALIDAÇÃO DE LIMITE DE CRÉDITO (se ainda não validou acima) =====
      if (validacaoLimite !== 'nao_validar') {
        if (dataVenc > dataDocumento) {
          console.log('⚠️ Data de vencimento é MAIOR que data do documento - validando limite...');

          try {
            console.log('📡 Chamando API verificar-limite-cliente...');
            const limiteResponse = await axiosInstance.post('/verificar-limite-cliente/', {
              id_cliente: vendaParaFinanceiro.id_cliente,
              valor_venda: valorTotal
            });

            console.log('📊 Resposta da API:', limiteResponse.data);
            console.log('  - ultrapassa_limite:', limiteResponse.data.ultrapassa_limite);
            console.log('  - limite_credito:', limiteResponse.data.cliente?.limite_credito);
            console.log('  - saldo_devedor:', limiteResponse.data.cliente?.saldo_devedor);
            console.log('  - credito_disponivel:', limiteResponse.data.cliente?.credito_disponivel);

            if (limiteResponse.data.ultrapassa_limite) {
              console.log('🚨 LIMITE DE CRÉDITO EXCEDIDO!');

              // Se for modo "alertar", apenas loga mas NÃO bloqueia
              if (validacaoLimite === 'alertar') {
                console.log('⚠️ Modo ALERTAR: mostrando aviso mas continuando com geração do financeiro');
                setError(
                  `⚠️ ATENÇÃO: Limite de crédito será excedido!\n` +
                  `Limite: R$ ${limiteResponse.data.cliente.limite_credito.toFixed(2)}\n` +
                  `Disponível: R$ ${limiteResponse.data.cliente.credito_disponivel.toFixed(2)}\n` +
                  `Excedente: R$ ${limiteResponse.data.valor_excedente.toFixed(2)}`
                );
                // NÃO retorna - continua com a geração do financeiro
              }
              // Se for modo "bloquear", bloqueia definitivamente
              else if (validacaoLimite === 'bloquear') {
                console.log('🚫 Modo BLOQUEAR: impedindo geração do financeiro por limite de crédito');
                setMensagemBloqueio(
                  `LIMITE DE CRÉDITO EXCEDIDO!\n\n` +
                  `Cliente ultrapassou o limite de crédito disponível.\n\n` +
                  `Limite Total: R$ ${limiteResponse.data.cliente.limite_credito.toFixed(2)}\n` +
                  `Crédito Disponível: R$ ${limiteResponse.data.cliente.credito_disponivel.toFixed(2)}\n` +
                  `Excedente: R$ ${limiteResponse.data.valor_excedente.toFixed(2)}\n\n` +
                  `Esta operação está configurada para BLOQUEAR vendas que excedem o limite.`
                );
                setOpenBloqueioModal(true);
                setLoading(false);
                return; // BLOQUEIA
              }
              // Se for modo "solicitar_senha", abre modal de autorização
              else if (validacaoLimite === 'solicitar_senha') {
                console.log('🔐 Modo SOLICITAR_SENHA: abrindo modal de autorização');
                setLimiteInfo({
                  ...limiteResponse.data,
                  motivo: 'limite_credito',
                  mensagem: 'Limite de crédito ultrapassado'
                });
                setOpenLimiteModal(true);
                setLoading(false);
                return; // AGUARDA AUTORIZAÇÃO
              }
            } else {
              console.log('✅ Limite de crédito OK - prosseguindo...');
            }
          } catch (limiteErr) {
            console.error('❌ Erro ao verificar limite:', limiteErr);
            console.error('   Response:', limiteErr.response?.data);
            console.error('   Status:', limiteErr.response?.status);
            // Não bloqueia se houver erro na verificação
          }
        } else {
          console.log('✅ Data de vencimento não é futura - não precisa validar limite');
        }
      } else {
        console.log('ℹ️ Validação desabilitada ou modo diferente:', validacaoLimite);
      }

      console.log('🔍 ===== FIM DA VALIDAÇÃO DE LIMITE =====');

      // Buscar configuração da operação para verificar baixa automática
      let baixaAutomatica = false;
      try {
        const operacaoResponse = await axiosInstance.get(`/operacoes/${vendaParaFinanceiro.id_operacao}/`);
        baixaAutomatica = operacaoResponse.data.baixa_automatica || false;
        console.log(`📋 Operação ${vendaParaFinanceiro.id_operacao} - Baixa Automática: ${baixaAutomatica}`);
      } catch (error) {
        console.warn('⚠️ Não foi possível buscar dados da operação:', error);
      }

      // Criar todas as parcelas
      for (let i = 0; i < numeroParcelas; i++) {
        const dataVenc = new Date(dataVencimento);
        dataVenc.setMonth(dataVenc.getMonth() + i);

        // Payload correto para FinanceiroConta
        const valorParcelaFormatado = parseFloat(valorParcela.toFixed(2));

        // Lógica de baixa automática: se data_venda == data_vencimento E baixa_automatica = true
        const dataEmissao = new Date(vendaParaFinanceiro.data_venda).toISOString().split('T')[0];
        const dataVencimentoStr = dataVenc.toISOString().split('T')[0];
        const deveBaixarAutomaticamente = baixaAutomatica && (dataEmissao === dataVencimentoStr);

        console.log(`🔍 [PARCELA ${i + 1}] Verificando baixa automática:`, {
          baixaAutomatica,
          dataVenda: vendaParaFinanceiro.data_venda,
          dataEmissao,
          dataVencimentoStr,
          saoIguais: dataEmissao === dataVencimentoStr,
          deveBaixar: deveBaixarAutomaticamente
        });

        const contaReceber = {
          tipo_conta: 'Receber',
          id_cliente_fornecedor: vendaParaFinanceiro.id_cliente,
          descricao: `Venda ${vendaParaFinanceiro.numero_documento} - Parcela ${i + 1}/${numeroParcelas}`,
          valor_parcela: valorParcelaFormatado,
          valor_original: valorParcelaFormatado,
          saldo_devedor: valorParcelaFormatado,
          data_vencimento: dataVencimentoStr,
          data_emissao: dataEmissao,
          forma_pagamento: formaPagamento,
          id_venda_origem: vendaParaFinanceiro.id || vendaParaFinanceiro.id_venda,
          id_operacao: vendaParaFinanceiro.id_operacao,
          parcela_numero: i + 1,
          parcela_total: numeroParcelas,
          documento_numero: vendaParaFinanceiro.numero_documento,
          status_conta: deveBaixarAutomaticamente ? 'Paga' : 'Pendente',
          valor_liquidado: deveBaixarAutomaticamente ? valorParcelaFormatado : 0,
          data_pagamento: deveBaixarAutomaticamente ? dataEmissao : null,
          gerencial: 0, // 0 = Não gerencial, 1 = Gerencial
          // Campos adicionais
          id_conta_cobranca: contaBancaria || null,
          id_conta_baixa: deveBaixarAutomaticamente ? (contaBancaria || null) : null,
          id_departamento: departamento || null,
          id_centro_custo: centroCusto || null
        };

        console.log(`📝 Criando parcela ${i + 1} (Baixa Auto: ${deveBaixarAutomaticamente}):`, contaReceber);

        try {
          const response = await axiosInstance.post('/contas/', contaReceber);
          console.log(`✅ Parcela ${i + 1} criada com sucesso!`);
          console.log(`📄 Dados retornados:`, response.data);
          console.log(`📍 ID da conta criada:`, response.data.id_conta);
        } catch (opError) {
          console.error(`❌ Erro ao criar parcela ${i + 1}:`, {
            status: opError.response?.status,
            statusText: opError.response?.statusText,
            data: opError.response?.data,
            payload: contaReceber
          });
          throw new Error(`Parcela ${i + 1}: ${JSON.stringify(opError.response?.data)}`);
        }
      }

      console.log(`🎉 Todas as ${numeroParcelas} parcelas foram criadas com sucesso!`);
      console.log(`💾 Verifique a tabela 'financeiro_contas' no banco de dados`);
      console.log(`🔍 Filtro: id_venda_origem = ${vendaParaFinanceiro.id || vendaParaFinanceiro.id_venda}`);

      // Marcar venda como gerando financeiro
      await axiosInstance.patch(`/vendas/${vendaParaFinanceiro.id || vendaParaFinanceiro.id_venda}/`, {
        gerou_financeiro: 1
      });

      setSuccess(`✅ Financeiro gerado com sucesso! ${numeroParcelas} parcela(s) criada(s).`);
      fecharModalFinanceiro();

    } catch (err) {
      console.error('Erro ao gerar financeiro:', err);

      // Erro de rede / servidor offline
      const httpStatus = err?.response?.status;
      const isServerError = !err.response || httpStatus >= 500;
      if (isServerError) {
        setError('❌ Servidor indisponível ao gerar financeiro. Tente novamente quando a conexão for restabelecida.');
      } else {
        setError(`Erro ao gerar financeiro: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Limpar formulário
  const limparFormulario = async () => {
    console.log('🧹 Limpando formulário e carregando parâmetros do usuário...');
    setShowLucratividade(false);

    // Buscar parâmetros do usuário logado
    let idVendedorPadrao = '';
    let idOperacaoPadrao = '';

    try {
      const resUsuario = await axiosInstance.get('/usuarios/me/');
      console.log('✅ Dados do usuário:', resUsuario.data);
      console.log('📦 Parâmetros do usuário:', resUsuario.data.parametros);

      if (resUsuario.data.parametros) {
        // Prioriza id_vendedor_venda, senão usa id_vendedor_padrao
        idVendedorPadrao = resUsuario.data.parametros.id_vendedor_venda ||
          resUsuario.data.parametros.id_vendedor_padrao || '';

        // Prioriza id_operacao_venda, senão usa id_operacao_padrao
        idOperacaoPadrao = resUsuario.data.parametros.id_operacao_venda ||
          resUsuario.data.parametros.id_operacao_padrao || '';

        console.log('👤 Vendedor padrão (Venda):', idVendedorPadrao);
        console.log('⚙️ Operação padrão (Venda):', idOperacaoPadrao);

        // Salvar no cache para uso offline
        try {
          await cachearParametros(resUsuario.data.parametros);
          console.log('📦 [CACHE] Parâmetros salvos no IndexedDB para uso offline');
        } catch (cacheErr) {
          console.warn('⚠️ [CACHE] Erro ao salvar parâmetros:', cacheErr);
        }
      }
    } catch (err) {
      console.error('⚠️ Erro ao buscar parâmetros do usuário:', err);
      // Fallback: usar cache gravado pela VendaRapidaPage quando estava online
      try {
        const cache = await buscarParametrosCache();
        if (cache) {
          idVendedorPadrao = cache.id_vendedor_venda || cache.id_vendedor_padrao || '';
          idOperacaoPadrao = cache.id_operacao_venda || cache.id_operacao_padrao || '';
          console.log('📦 [OFFLINE] Parâmetros carregados do cache:', { idVendedorPadrao, idOperacaoPadrao });
        }
      } catch (cacheErr) {
        console.error('⚠️ Erro ao buscar cache de parâmetros:', cacheErr);
      }
    }

    setVenda({
      numero_documento: '',
      data_venda: new Date().toISOString().split('T')[0],
      id_operacao: idOperacaoPadrao,
      id_cliente: '',
      id_vendedor: idVendedorPadrao,
      observacoes: '',
      desconto: 0,
      tipo_desconto_geral: 'valor',
      taxa_entrega: 0,
      valor_total: 0,
      itens: []
    });
    setNovoItem({
      id_produto: '',
      quantidade: 1,
      valor_unitario: 0,
      desconto: 0,
      tipo_desconto: 'valor',
      cfop: '',
      cst_csosn: ''
    });
    setError('');
    setSuccess('');

    // Limpar informações de limite e crédito
    setShowLimiteInfo(false);
    setLimiteCliente(null);
    setCreditoCliente(0);
    setShowCreditoModal(false);
    setUsarCredito(false);
    setDecisaoCreditoTomada(false);
    setShowCashbackModal(false);
    setDecisaoCashbackTomada(false);

    // Limpar autorizações de desconto
    setAprovacaoDescontoViaWhatsApp(false);
    setAutorizacaoSupervisor(false);
    setOpenDescontoModal(false);
    setInfoDesconto(null);
    setSolicitacaoDesconto(null);

    console.log('✅ Formulário limpo com parâmetros aplicados!');

    // Se houver operação padrão, buscar o próximo número baseado nela
    if (idOperacaoPadrao) {
      // Primeiro tenta do estado local (funciona offline)
      const operacaoPadrao = operacoes.find(op => op.id_operacao === parseInt(idOperacaoPadrao));
      if (operacaoPadrao) {
        if (operacaoPadrao.usa_auto_numeracao) {
          // Usar contador local (offline) se disponível, senão usar do estado
          const numLocalKey = `aperus_offline_num_${operacaoPadrao.id_operacao}`;
          const numLocal = localStorage.getItem(numLocalKey);
          const proximoNumero = numLocal ? parseInt(numLocal) : (operacaoPadrao.proximo_numero_nf || 1);
          setVenda(prev => ({ ...prev, numero_documento: String(proximoNumero) }));
          console.log('✅ Próximo número da operação (estado local):', proximoNumero);
        } else {
          await gerarNumeroDocumento();
        }
      } else {
        // Fallback: buscar na API
        try {
          console.log('🔢 Buscando próximo número para operação:', idOperacaoPadrao);
          const resOp = await axiosInstance.get(`/operacoes/${idOperacaoPadrao}/`);
          if (resOp.data.usa_auto_numeracao) {
            const proximoNumero = resOp.data.proximo_numero_nf || 1;
            setVenda(prev => ({
              ...prev,
              numero_documento: String(proximoNumero)
            }));
            console.log('✅ Próximo número da operação:', proximoNumero);
          } else {
            await gerarNumeroDocumento();
          }
        } catch (err) {
          console.error('❌ Erro ao buscar próximo número da operação:', err);
          await gerarNumeroDocumento();
        }
      }
    } else {
      // Gerar novo número de documento padrão
      await gerarNumeroDocumento();
    }
  };

  // Editar venda
  const editarVenda = async (vendaParaEditar) => {
    console.log('✏️ Editando venda:', vendaParaEditar);

    // Verificar se a venda já foi paga (financeiro baixado)
    const idVenda = vendaParaEditar.id || vendaParaEditar.id_venda;
    const status = statusFinanceiro[idVenda];

    if (status && status.temFinanceiro && status.valorPago > 0) {
      setVendaBloqueadaParaEdicao(true);
      console.log('🔒 Venda bloqueada para edição - possui pagamentos:', {
        valorPago: status.valorPago,
        valorTotal: status.valorTotal,
        status: status.status
      });
    } else {
      setVendaBloqueadaParaEdicao(false);
    }

    setVenda({
      id: vendaParaEditar.id || vendaParaEditar.id_venda,
      id_operacao: vendaParaEditar.id_operacao,
      id_cliente: vendaParaEditar.id_cliente,
      id_vendedor: vendaParaEditar.id_vendedor || '',
      observacoes: vendaParaEditar.observacoes || '',
      desconto: parseFloat(vendaParaEditar.desconto) || 0,
      taxa_entrega: parseFloat(vendaParaEditar.taxa_entrega) || 0,
      valor_total: parseFloat(vendaParaEditar.valor_total) || 0,
      itens: vendaParaEditar.itens || []
    });
    setModo('nova');
  };

  // Excluir venda
  const excluirVenda = async (venda) => {
    console.log('🗑️ Abrindo modal de confirmação para:', venda);
    setVendaParaExcluir(venda);
    setContasPendentesParaExcluir([]);
    setOpenExcluirModal(true);
  };

  // Confirmar exclusão de contas pendentes e venda
  const confirmarExclusaoComContas = async () => {
    console.log('🗑️ Confirmando exclusão de venda com contas pendentes');

    try {
      setLoading(true);
      const idVenda = vendaParaExcluir.id || vendaParaExcluir.id_venda;

      console.log('🗑️ Excluindo contas pendentes...');
      for (const conta of contasPendentesParaExcluir) {
        console.log(`  → Excluindo conta ${conta.id_conta} (${conta.status_conta})...`);
        await axiosInstance.delete(`/contas/${conta.id_conta}/`);
        console.log(`  ✅ Conta ${conta.id_conta} excluída`);
      }
      console.log('✅ Todas as contas pendentes foram excluídas');

      // Excluir a venda
      console.log(`🗑️ Excluindo venda ${idVenda}...`);
      await axiosInstance.delete(`/vendas/${idVenda}/`);
      console.log('✅ Venda excluída com sucesso!');

      setOpenExcluirModal(false);
      setVendaParaExcluir(null);
      setContasPendentesParaExcluir([]);
      setSuccess('✅ Venda e contas pendentes excluídas com sucesso!');
      await carregarDados();

    } catch (err) {
      console.error('Erro ao excluir:', err);
      setError(`Erro ao excluir: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmarExclusaoVenda = async () => {
    console.log('🗑️ INICIO confirmarExclusaoVenda:', vendaParaExcluir);
    setOpenExcluirModal(false);

    try {
      setLoading(true);
      console.log('🔄 Loading = true');

      // Verificar se há contas a receber vinculadas
      const idVenda = vendaParaExcluir.id || vendaParaExcluir.id_venda;
      console.log('🔍 Buscando contas para venda ID:', idVenda);

      const contasResponse = await axiosInstance.get(`/contas/?id_venda_origem=${idVenda}`);
      const contasVinculadas = Array.isArray(contasResponse.data.results)
        ? contasResponse.data.results
        : Array.isArray(contasResponse.data)
          ? contasResponse.data
          : [];
      console.log('📋 Contas encontradas:', contasVinculadas.length);

      // Verificar status de cada conta
      const contasPagas = [];
      const contasPendentes = [];

      contasVinculadas.forEach(conta => {
        const status = (conta.status_conta || conta.status || '').toLowerCase();
        console.log(`  → Conta ${conta.id_conta}: status = "${conta.status_conta}" | status2 = "${conta.status}"`);

        // Considerar como paga se: status_conta = 'Paga' ou 'paga' ou 'Liquidada' ou data_pagamento existe
        if (status === 'paga' || status === 'liquidada' || status === 'baixada' || conta.data_pagamento) {
          contasPagas.push(conta);
        } else {
          contasPendentes.push(conta);
        }
      });

      console.log('💰 Análise de contas:', {
        total: contasVinculadas.length,
        pagas: contasPagas.length,
        pendentes: contasPendentes.length
      });

      // BLOQUEAR se há contas pagas/baixadas
      if (contasPagas.length > 0) {
        console.error('❌ BLOQUEIO: existem contas com baixa!');
        console.error('  Contas pagas:', contasPagas.map(c => ({ id: c.id_conta, status: c.status_conta, data: c.data_pagamento })));

        setError(
          `❌ Não é possível excluir esta venda!\n\n` +
          `Existem ${contasPagas.length} conta(s) a receber que já tiveram BAIXA (pagamento).\n\n` +
          `Para excluir esta venda, é necessário primeiro fazer o ESTORNO dos recebimentos no módulo Financeiro.`
        );
        setLoading(false);
        return;
      }

      // PERMITIR exclusão se só há contas pendentes (a prazo)
      if (contasPendentes.length > 0) {
        console.log('⚠️ Contas pendentes encontradas, atualizando modal...');
        console.log('  Contas pendentes:', contasPendentes.map(c => ({ id: c.id_conta, status: c.status_conta })));

        // Armazenar contas pendentes e forçar atualização do modal
        setContasPendentesParaExcluir(contasPendentes);
        setLoading(false);

        // Forçar re-render do modal (fechar e reabrir)
        setOpenExcluirModal(false);
        setTimeout(() => {
          setOpenExcluirModal(true);
        }, 10);
        return; // Aguarda confirmação do usuário no modal atualizado
      }

      // Excluir a venda
      console.log(`🗑️ Excluindo venda ${idVenda}...`);
      await axiosInstance.delete(`/vendas/${idVenda}/`);
      console.log('✅ Venda excluída com sucesso!');

      setSuccess('✅ Venda excluída com sucesso!');
      await carregarDados();

    } catch (err) {
      console.error('Erro ao excluir venda:', err);
      setError(`Erro ao excluir venda: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Imprimir venda
  const imprimirVenda = async (venda) => {
    try {
      setLoading(true);

      console.log('🖨️ Iniciando impressão da venda:', venda);

      // Buscar dados completos da venda
      const idVenda = venda.id || venda.id_venda;
      console.log('🔍 ID da venda para buscar:', idVenda);

      const response = await axiosInstance.get(`/vendas/${idVenda}/`);
      const vendaCompleta = response.data;
      console.log('✅ ===== DADOS COMPLETOS DA VENDA RECEBIDOS =====');
      console.log(JSON.stringify(vendaCompleta, null, 2));
      console.log('🔍 vendaCompleta.operacao:', vendaCompleta.operacao);
      console.log('🔍 Tipo de vendaCompleta.operacao:', typeof vendaCompleta.operacao);
      console.log('🔍 vendaCompleta.itens:', vendaCompleta.itens);

      // ⚠️ VERIFICAÇÃO CRÍTICA: Se operacao está undefined mas id_operacao existe
      if (!vendaCompleta.operacao && vendaCompleta.id_operacao) {
        console.error('❌❌❌ PROBLEMA CRÍTICO: Backend não retornou campo operacao! ❌❌❌');
        console.error('   id_operacao existe:', vendaCompleta.id_operacao);
        console.error('   operacao está:', vendaCompleta.operacao);
        console.error('   BACKEND PRECISA RETORNAR CAMPO operacao COM nome_operacao!');
      }

      if (vendaCompleta.operacao && typeof vendaCompleta.operacao === 'object') {
        console.log('✅ Operação é objeto com nome_operacao:', vendaCompleta.operacao.nome_operacao);
        console.log('✅ Operação tem empresa?', vendaCompleta.operacao.empresa ? 'SIM' : 'NÃO');
      }

      // Transformar dados da venda para o formato esperado
      const dadosImpressao = {
        numero_documento: vendaCompleta.numero_documento,
        data_venda: vendaCompleta.data_venda,
        valor_total: vendaCompleta.valor_total,
        nome_cliente: buscarNomeClienteSeguro(vendaCompleta),
        nome_vendedor: buscarNomeVendedorSeguro(vendaCompleta),
        forma_pagamento: vendaCompleta.forma_pagamento,
        num_parcelas: vendaCompleta.num_parcelas,
        itens: vendaCompleta.itens || [],
        id_operacao: vendaCompleta.id_operacao,
        id_cliente: vendaCompleta.id_cliente,
        desconto: vendaCompleta.desconto,
        taxa_entrega: vendaCompleta.taxa_entrega,
        observacoes: vendaCompleta.observacoes,
        operacao: vendaCompleta.operacao  // Passa o objeto completo da operação
      };

      console.log('📄 Dados formatados para impressão:', dadosImpressao);
      console.log('📄 dadosImpressao.operacao:', dadosImpressao.operacao);

      const resultado = await imprimirDireto(dadosImpressao);
      console.log('🖨️ Resultado da impressão:', resultado);

      if (resultado.success) {
        setSuccess(resultado.message);
      } else {
        setError(resultado.message);
      }
    } catch (error) {
      console.error('❌ Erro ao imprimir venda:', error);
      console.error('📋 Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(`Erro ao imprimir venda: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Gerar PDF
  const gerarPDFVenda = async (venda, incluirImagens = false) => {
    try {
      setLoading(true);

      console.log('📄 Gerando PDF da venda:', venda);

      // Buscar dados completos da venda com itens detalhados
      let vendaCompleta = venda;
      if (venda.id || venda.id_venda) {
        const idVenda = venda.id || venda.id_venda;
        console.log('📡 Buscando dados completos da venda ID:', idVenda);
        try {
          const response = await axiosInstance.get(`/vendas/${idVenda}/`);
          vendaCompleta = response.data;
          console.log('✅ Dados completos da venda:', vendaCompleta);

          // Se for ORÇAMENTO e não passou incluirImagens, abrir modal de confirmação
          const nomeOperacao = vendaCompleta.operacao?.nome_operacao || '';
          if (nomeOperacao.toUpperCase().includes('ORÇAMENTO') && incluirImagens === false && !vendaParaPDF) {
            console.log('🖼️ É um ORÇAMENTO! Perguntando sobre imagens...');
            setVendaParaPDF(vendaCompleta);
            setOpenImagemPDFModal(true);
            setLoading(false);
            return; // Interrompe aqui e espera a resposta do modal
          }
        } catch (err) {
          console.error('❌ Erro ao buscar dados completos da venda:', err);
          console.log('⚠️ Usando dados da lista (podem estar incompletos)');
        }
      }

      // Transformar dados da venda para o formato esperado
      const dadosImpressao = {
        numero_documento: vendaCompleta.numero_documento,
        data_venda: vendaCompleta.data_venda || vendaCompleta.data_documento,
        valor_total: vendaCompleta.valor_total,
        nome_cliente: vendaCompleta.cliente || buscarNomeClienteSeguro(vendaCompleta),
        nome_vendedor: vendaCompleta.vendedor || buscarNomeVendedorSeguro(vendaCompleta),
        id_operacao: vendaCompleta.id_operacao,
        operacao: vendaCompleta.operacao,  // ✅ ADICIONADO - Passa o objeto completo da operação
        id_cliente: vendaCompleta.id_cliente,
        forma_pagamento: vendaCompleta.forma_pagamento, // ✅ ADICIONADO
        num_parcelas: vendaCompleta.num_parcelas,       // ✅ ADICIONADO
        desconto: vendaCompleta.desconto,
        taxa_entrega: vendaCompleta.taxa_entrega,
        observacoes: vendaCompleta.observacoes,
        itens: vendaCompleta.itens || [], // Itens com dados completos
        incluirImagens: incluirImagens // ✅ Parâmetro para incluir imagens dos produtos
      };

      console.log('📋 Dados para impressão:', dadosImpressao);
      console.log('🖼️ Incluir imagens?', incluirImagens);
      console.log('📦 Itens detalhados:');
      dadosImpressao.itens.forEach((item, i) => {
        console.log(`  Item ${i + 1}:`, {
          codigo_produto: item.codigo_produto,
          produto_nome: item.produto_nome,
          produto: item.produto,
          marca_produto: item.marca_produto,
          marca: item.marca,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario
        });
      });

      const resultado = await gerarPDF(dadosImpressao);
      if (resultado.success) {
        setSuccess(resultado.message);
      } else {
        setError(resultado.message);
      }
    } catch (err) {
      console.error('❌ Erro ao gerar PDF:', err);
      setError('Erro ao gerar PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirmar geração de PDF com ou sem imagens
  const confirmarGerarPDFComImagens = async (comImagens) => {
    setOpenImagemPDFModal(false);
    if (vendaParaPDF) {
      await gerarPDFVenda(vendaParaPDF, comImagens);
      setVendaParaPDF(null);
    }
  };

  // Compartilhar WhatsApp
  const compartilharVenda = async (venda) => {
    try {
      setLoading(true);

      console.log('📱 Compartilhando venda via WhatsApp:', venda);

      // Buscar dados completos da venda com itens detalhados (igual ao PDF)
      let vendaCompleta = venda;
      let clienteCompleto = null;

      if (venda.id || venda.id_venda) {
        const idVenda = venda.id || venda.id_venda;
        console.log('📡 Buscando dados completos da venda ID:', idVenda);
        try {
          const response = await axiosInstance.get(`/vendas/${idVenda}/`);
          vendaCompleta = response.data;
          console.log('✅ Dados completos da venda:', vendaCompleta);

          // Buscar dados completos do cliente (incluindo WhatsApp)
          if (vendaCompleta.id_cliente) {
            try {
              const clienteResponse = await axiosInstance.get(`/clientes/${vendaCompleta.id_cliente}/`);
              clienteCompleto = clienteResponse.data;
              console.log('✅ Cliente completo:', clienteCompleto);
            } catch (err) {
              console.warn('⚠️ Erro ao buscar cliente:', err);
            }
          }
        } catch (err) {
          console.error('❌ Erro ao buscar dados completos da venda:', err);
          console.log('⚠️ Usando dados da lista (podem estar incompletos)');
        }
      }

      // Transformar dados da venda para o formato esperado
      const dadosImpressao = {
        numero_documento: vendaCompleta.numero_documento,
        data_venda: vendaCompleta.data_venda || vendaCompleta.data_documento,
        valor_total: vendaCompleta.valor_total,
        nome_cliente: vendaCompleta.cliente || buscarNomeClienteSeguro(vendaCompleta),
        nome_vendedor: vendaCompleta.vendedor || buscarNomeVendedorSeguro(vendaCompleta),
        id_operacao: vendaCompleta.id_operacao,
        operacao: vendaCompleta.operacao,  // ✅ ADICIONADO - Passa o objeto completo da operação
        id_cliente: vendaCompleta.id_cliente,
        forma_pagamento: vendaCompleta.forma_pagamento,
        num_parcelas: vendaCompleta.num_parcelas,
        itens: vendaCompleta.itens || [] // Itens com dados completos
      };

      console.log('📤 Dados enviados para WhatsApp:', dadosImpressao);

      // Passar cliente completo para pegar o WhatsApp e gerar PDF junto
      const resultado = await compartilharWhatsApp(dadosImpressao, clienteCompleto, true);

      if (resultado.success) {
        setSuccess(resultado.message + ' (PDF gerado na pasta Downloads)');
      } else {
        setError(resultado.message);
      }

      setLoading(false);

    } catch (error) {
      console.error('❌ Erro ao compartilhar venda:', error);
      setError('Erro ao compartilhar venda: ' + error.message);
      setLoading(false);
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
    <Box sx={{ p: embedded ? 0 : 3 }}>
      {/* Banner offline */}
      {(!servidorOk || !isOnline) && (
        <Alert
          severity="warning"
          icon={<WifiOffIcon />}
          sx={{
            mb: 2,
            fontWeight: 600,
            backgroundColor: '#fff3e0',
            border: '1px solid #ff9800',
            '& .MuiAlert-icon': { color: '#e65100' },
          }}
        >
          <strong>Modo Offline</strong> — Servidor indisponível. Alterações serão sincronizadas quando a conexão voltar.
        </Alert>
      )}
      {/* Header */}
      {!embedded && (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Sistema de Vendas
          </Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { limparFormulario(); setOpenModalNovaVenda(true); }}
              sx={{ mr: 1 }}
            >
              + Nova Venda
            </Button>
            <Button
              variant="outlined"
              onClick={carregarDados}
              disabled={loading}
              color="primary"
            >
              {loading ? '⏳ Carregando...' : '🔄 Recarregar Dados'}
            </Button>
          </Box>
        </Box>
      </Paper>
      )}

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

      {/* Conteúdo principal */}
      {/* Sempre mostrar lista - formulário agora é modal */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Typography variant="h6">
            Lista de Vendas ({vendas.filter(v => {
              if (filtroTipoOperacao !== 'todos') {
                const tipo = getTipoOperacao(v).tipo;
                if (tipo !== filtroTipoOperacao) return false;
              }
              if (filtroTexto) {
                const txt = filtroTexto.toLowerCase();
                const cliente = (v.nome_cliente || v.cliente || '').toLowerCase();
                const doc = String(v.numero_venda || v.numero_documento || v.documento || '').toLowerCase();
                const id = String(v.id || v.id_venda || '').toLowerCase();
                if (!cliente.includes(txt) && !doc.includes(txt) && !id.includes(txt)) return false;
              }
              return true;
            }).length})
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Pesquisar cliente, doc, ID..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              sx={{ minWidth: 220 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Período</InputLabel>
              <Select
                value={filtroPeriodo}
                onChange={(e) => {
                  const novoPeriodo = e.target.value;
                  setFiltroPeriodo(novoPeriodo);
                  carregarVendas(novoPeriodo);
                }}
                label="Período"
                disabled={carregandoVendas}
              >
                <MenuItem value="10">🗓️ Últimos 10 dias</MenuItem>
                <MenuItem value="30">🗓️ Últimos 30 dias</MenuItem>
                <MenuItem value="60">🗓️ Últimos 60 dias</MenuItem>
                <MenuItem value="90">🗓️ Últimos 90 dias</MenuItem>
                <MenuItem value="todos">📋 Todas</MenuItem>
              </Select>
            </FormControl>
            {carregandoVendas && <CircularProgress size={20} />}

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filtroTipoOperacao}
                onChange={(e) => setFiltroTipoOperacao(e.target.value)}
                label="Tipo"
              >
                <MenuItem value="todos">📋 Todos os tipos</MenuItem>
                <MenuItem value="orcamento">💼 Orçamentos</MenuItem>
                <MenuItem value="venda">✅ Vendas</MenuItem>
                <MenuItem value="condicional">⚠️ Condicionais</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Operação</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Documento</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Vendedor</TableCell>
                  <TableCell align="right">Valor Total</TableCell>
                  <TableCell align="center">Entrega</TableCell>
                  <TableCell align="center">Financeiro</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendas.filter(v => {
                  if (filtroTipoOperacao !== 'todos') {
                    const tipo = getTipoOperacao(v).tipo;
                    if (tipo !== filtroTipoOperacao) return false;
                  }
                  if (filtroTexto) {
                    const txt = filtroTexto.toLowerCase();
                    const cliente = (v.nome_cliente || v.cliente || '').toLowerCase();
                    const doc = String(v.numero_venda || v.numero_documento || v.documento || '').toLowerCase();
                    const id = String(v.id || v.id_venda || '').toLowerCase();
                    if (!cliente.includes(txt) && !doc.includes(txt) && !id.includes(txt)) return false;
                  }
                  return true;
                }).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      <Typography color="textSecondary">
                        Nenhuma venda encontrada
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  vendas.filter(v => {
                    if (filtroTipoOperacao !== 'todos') {
                      const tipo = getTipoOperacao(v).tipo;
                      if (tipo !== filtroTipoOperacao) return false;
                    }
                    if (filtroTexto) {
                      const txt = filtroTexto.toLowerCase();
                      const cliente = (v.nome_cliente || v.cliente || '').toLowerCase();
                      const doc = String(v.numero_venda || v.numero_documento || v.documento || '').toLowerCase();
                      const id = String(v.id || v.id_venda || '').toLowerCase();
                      if (!cliente.includes(txt) && !doc.includes(txt) && !id.includes(txt)) return false;
                    }
                    return true;
                  }).map((v) => {
                    const tipoOp = getTipoOperacao(v);
                    return (
                      <TableRow key={v.id}>
                        <TableCell>{v.id || v.id_venda}</TableCell>
                        <TableCell>
                          <Chip
                            label={(() => {
                              const operacao = operacoes.find(op => op.id_operacao === v.id_operacao);
                              return operacao?.abreviacao || '-';
                            })()}
                            size="small"
                            sx={{
                              fontWeight: 'bold',
                              minWidth: '50px',
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tipoOp.label}
                            size="small"
                            color={tipoOp.color}
                            variant={tipoOp.tipo === 'venda' ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>{v.numero_documento || 'N/A'}</TableCell>
                        <TableCell>{formatarDataSegura(v.data_venda)}</TableCell>
                        <TableCell>{buscarNomeClienteSeguro(v)}</TableCell>
                        <TableCell>{v.nome_vendedor || buscarNomeVendedorSeguro(v)}</TableCell>
                        <TableCell align="right">
                          R$ {parseFloat(v.valor_total || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          {v.venda_futura_origem ? (
                            <Tooltip title={`Esta é uma venda de entrega da venda futura #${v.venda_futura_origem}`}>
                              <Chip 
                                label="📦 Entrega" 
                                size="small" 
                                color="info"
                                variant="outlined"
                              />
                            </Tooltip>
                          ) : v.venda_futura_destino ? (
                            <Tooltip title={`Pedido já entregue na venda #${v.venda_futura_destino}`}>
                              <Chip 
                                label="✅ Entregue" 
                                size="small" 
                                color="success"
                              />
                            </Tooltip>
                          ) : (
                            <Chip 
                              label="-" 
                              size="small" 
                              variant="outlined"
                              sx={{ opacity: 0.3 }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {(() => {
                            const idVenda = v.id || v.id_venda;
                            const status = statusFinanceiro[idVenda];

                            // Log para debug (comentar depois de resolver)
                            if (idVenda === 225 || idVenda === 224 || idVenda === 223) {
                              console.log(`🔍 Debug Venda ${idVenda}:`, {
                                statusFinanceiro: statusFinanceiro,
                                status: status,
                                temStatusFinanceiro: !!status,
                                totalStatusCarregados: Object.keys(statusFinanceiro).length
                              });
                            }

                            if (!status || !status.temFinanceiro) {
                              return (
                                <Chip
                                  label="Sem financeiro"
                                  size="small"
                                  variant="outlined"
                                  color="default"
                                />
                              );
                            }

                            const { status: statusLabel, contasPagas, totalContas } = status;
                            const cores = {
                              'Pago': 'success',
                              'Parcial': 'warning',
                              'Pendente': 'error'
                            };

                            return (
                              <Chip
                                label={`${statusLabel} (${contasPagas}/${totalContas})`}
                                size="small"
                                color={cores[statusLabel] || 'default'}
                                title={`R$ ${status.valorPago?.toFixed(2) || '0.00'} / R$ ${status.valorTotal?.toFixed(2) || '0.00'}`}
                              />
                            );
                          })()}
                        </TableCell>
                        <TableCell align="center">
                          {tipoOp.tipo !== 'venda' && (
                            <Tooltip title="Converter para Venda">
                              <IconButton
                                size="small"
                                onClick={() => abrirModalConverter(v)}
                                color="success"
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => editarVenda(v)}
                            title="Editar"
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => abrirModalFinanceiro(v)}
                            title="Gerar Financeiro"
                            sx={{ color: '#1976d2' }}
                          >
                            <MoneyIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => excluirVenda(v)}
                            title="Excluir"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => imprimirVenda(v)}
                            title="Imprimir"
                            disabled={loadingImpressao}
                            sx={{ color: '#424242' }}
                          >
                            <PrintIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => gerarPDFVenda(v)}
                            title="Gerar PDF"
                            disabled={loadingImpressao}
                            sx={{ color: '#d32f2f' }}
                          >
                            <PdfIcon />
                          </IconButton>
                          <WhatsAppQuickSend
                            telefone={v.whatsapp_cliente || v.telefone_cliente || v.telefone_celular || v.telefone}
                            nome={v.cliente || v.nome_cliente}
                            mensagemPadrao={templates.venda_concluida(
                              v.cliente || v.nome_cliente || 'Cliente',
                              v.numero_documento || v.id,
                              parseFloat(v.valor_total || 0).toFixed(2)
                            )}
                            tipoEnvio="vendas"
                            idRelacionado={v.id || v.id_venda}
                            onSuccess={() => console.log('WhatsApp venda enviado!')}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

      {/* MODAL DE NOVA VENDA - Compacto */}
      <Dialog
        open={openModalNovaVenda}
        onClose={() => { setOpenModalNovaVenda(false); if (embedded) onClose?.(); }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '85vh'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
          <Typography variant="h6" component="span">
            📝 Nova Venda
          </Typography>
          <IconButton 
            size="small"
            onClick={() => { setOpenModalNovaVenda(false); if (embedded) onClose?.(); }} 
            sx={{ color: 'white' }}
          >
            <ClearIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, overflow: 'auto' }}>
        <Grid container spacing={1.5}>
          {/* Mensagem de erro visível dentro do modal */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError('')} sx={{ mb: 1 }}>
                {error}
              </Alert>
            </Grid>
          )}

          {/* Alerta de venda bloqueada */}
          {vendaBloqueadaParaEdicao && (
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>⚠️ Venda com pagamentos realizados</strong>
                <br />
                Esta venda já possui pagamentos no financeiro e não pode ser editada.
              </Alert>
            </Grid>
          )}

          {/* Dados da venda - Compacto */}
          <Grid item xs={12}>
            <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Grid container spacing={1.5}>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Nº Doc"
                      value={venda.numero_documento}
                      onChange={(e) => setVenda(prev => ({ ...prev, numero_documento: e.target.value }))}
                      disabled={vendaBloqueadaParaEdicao}
                    />
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Data"
                      value={venda.data_venda}
                      onChange={(e) => setVenda(prev => ({ ...prev, data_venda: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      disabled={vendaBloqueadaParaEdicao}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Operação *</InputLabel>
                      <Select
                        value={venda.id_operacao || ''}
                        disabled={vendaBloqueadaParaEdicao}
                        onChange={async (e) => {
                          console.log('🔧 Operação selecionada:', e.target.value);
                          const operacaoSelecionada = operacoes.find(op =>
                            String(op.id || op.pk || op.ID || op.id_operacao) === String(e.target.value)
                          );
                          console.log('🔧 Dados da operação selecionada:', operacaoSelecionada);
                          setVenda(prev => ({ ...prev, id_operacao: e.target.value }));

                          // Buscar próximo número (apenas exibir - NÃO incrementa até salvar)
                          try {
                            const response = await axiosInstance.get(`/operacoes/${e.target.value}/`);
                            const numeroAtual = response.data.proximo_numero_nf || 1;
                            console.log('📄 Número atual da operação:', numeroAtual);

                            // Apenas exibir o número atual na tela
                            setVenda(prev => ({ ...prev, numero_documento: numeroAtual.toString() }));
                          } catch (err) {
                            console.error('❌ Erro ao buscar próximo número:', err);
                          }
                        }}
                        error={!venda.id_operacao}
                      >
                        <MenuItem value="" disabled>
                          {operacoes.length === 0 ? 'Carregando operações...' : 'Selecione uma operação'}
                        </MenuItem>
                        {operacoes.length > 0 ? operacoes
                          .filter(op => {
                            // Se initialModel foi fornecido (ex: NF-e = '55'), mostrar só operações desse modelo
                            if (initialModel) return String(op.modelo_documento) === String(initialModel);
                            // Sem initialModel: ignorar modelo 55 (NF-e usa tela própria)
                            if (String(op.modelo_documento) === '55') return false;
                            // Filtrar apenas operações de Saída quando não há initialModel específico
                            const transacao = op.transacao || op.tipo_transacao || '';
                            const isSaida = transacao === '' || transacao.toLowerCase() === 'saída' || transacao.toLowerCase() === 'saida';
                            return isSaida;
                          })
                          .map(op => {
                            // Flexibilidade para diferentes nomes de propriedades
                            const id = String(op.id || op.pk || op.ID || op.id_operacao);
                            const nome = op.nome || op.name || op.description || op.descricao || op.title || op.nome_operacao;
                            const tipo = op.tipo || op.type || op.categoria || '';
                            const status = op.status || op.ativo || op.active;

                            return (
                              <MenuItem key={`operacao-${id}`} value={id}>
                                {nome || `Operação ${id}`}
                                {op.modelo_documento && (
                                  <span style={{ marginLeft: 4, fontSize: '0.72rem', color: '#1976d2', fontWeight: 'bold', background: '#e3f2fd', borderRadius: 4, padding: '1px 5px' }}>
                                    Mod.{op.modelo_documento}
                                  </span>
                                )}
                                {tipo && ` (${tipo})`}
                                {status === false && ' - INATIVO'}
                              </MenuItem>
                            );
                          }) : (
                          <MenuItem disabled>
                            {loading ? 'Carregando...' : `Nenhuma operação${initialModel ? ` Mod.${initialModel}` : ''} de saída encontrada`}
                          </MenuItem>
                        )}
                      </Select>
                      {!venda.id_operacao && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          Campo obrigatório
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Campo de Venda de Origem (quando operação é do tipo destino) */}
                  {(() => {
                    const operacaoSelecionada = operacoes.find(op => String(op.id_operacao) === String(venda.id_operacao));
                    const mostrarCampo = operacaoSelecionada && operacaoSelecionada.entrega_futura === true && operacaoSelecionada.tipo_entrega_futura === 'destino';
                    
                    console.log('🔍 [RENDER] Verificando campo Venda Origem:', {
                      id_operacao: venda.id_operacao,
                      operacaoSelecionada,
                      entrega_futura: operacaoSelecionada?.entrega_futura,
                      tipo_entrega_futura: operacaoSelecionada?.tipo_entrega_futura,
                      mostrarCampo,
                      vendasPendentes: vendasFuturasPendentes.length
                    });
                    
                    return mostrarCampo;
                  })() && (
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Venda de Origem (Pedido) *</InputLabel>
                        <Select
                          value={venda.venda_futura_origem || ''}
                          onChange={(e) => {
                            setVenda(prev => ({ ...prev, venda_futura_origem: e.target.value }));
                            carregarDadosVendaOrigem(e.target.value);
                          }}
                          error={!venda.venda_futura_origem}
                        >
                          <MenuItem value="" disabled>
                            Selecione a venda de origem
                          </MenuItem>
                          {vendasFuturasPendentes.map(v => (
                            <MenuItem key={v.id} value={v.id}>
                              Venda #{v.id} - {v.nome_cliente || v.cliente} - R$ {parseFloat(v.valor_total || 0).toFixed(2)}
                            </MenuItem>
                          ))}
                        </Select>
                        {!venda.venda_futura_origem && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                            Selecione o pedido que será entregue
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                  )}

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Cliente *</InputLabel>
                        <Select
                          value={venda.id_cliente || ''}
                          disabled={vendaBloqueadaParaEdicao}
                          onChange={(e) => {
                            const clienteId = e.target.value;
                            setVenda(prev => ({ ...prev, id_cliente: clienteId }));
                            // Buscar limite de crédito e cashback do cliente
                            if (clienteId) {
                              setDecisaoCashbackTomada(false);
                              buscarLimiteCliente(clienteId);
                              verificarCashbackCliente(clienteId);
                            } else {
                              setShowLimiteInfo(false);
                              setLimiteCliente(null);
                            }
                          }}
                        >
                          <MenuItem value="" disabled>Selecione um cliente</MenuItem>
                          {clientes.length > 0 ? clientes.map(cli => {
                            // Flexibilidade para diferentes nomes de propriedades
                            const id = String(cli.id || cli.pk || cli.ID || cli.id_cliente);
                            const nome = cli.nome_razao_social || cli.razao_social || cli.nome_fantasia || cli.nome || cli.name || cli.cliente || cli.title || cli.nome_cliente;
                            return (
                              <MenuItem key={`cliente-${id}`} value={id}>
                                {nome || `Cliente ${id}`}
                              </MenuItem>
                            );
                          }) : <MenuItem disabled>Nenhum cliente encontrado</MenuItem>}
                        </Select>
                      </FormControl>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={abrirModalCliente}
                        title="Cadastrar novo cliente"
                        disabled={vendaBloqueadaParaEdicao}
                      >
                        <PersonAddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Vendedor *</InputLabel>
                      <Select
                        value={venda.id_vendedor || ''}
                        disabled={vendaBloqueadaParaEdicao}
                        onChange={(e) => {
                          setVenda(prev => ({ ...prev, id_vendedor: e.target.value }));
                        }}
                      >
                        <MenuItem value="" disabled>Selecione um vendedor</MenuItem>
                        {Array.isArray(vendedores) && vendedores.length > 0 ? vendedores.map(vend => {
                          // Flexibilidade para diferentes nomes de propriedades
                          const id = String(vend.id || vend.pk || vend.ID || vend.id_vendedor);
                          const nome = vend.nome || vend.name || vend.vendedor || vend.title || vend.nome_vendedor;
                          return (
                            <MenuItem key={`vendedor-${id}`} value={id}>
                              {nome || `Vendedor ${id}`}
                            </MenuItem>
                          );
                        }) : <MenuItem disabled>Nenhum vendedor encontrado</MenuItem>}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Observações"
                      multiline
                      rows={1}
                      value={venda.observacoes}
                      onChange={(e) => setVenda(prev => ({ ...prev, observacoes: e.target.value }))}
                      disabled={vendaBloqueadaParaEdicao}
                    />
                  </Grid>
                </Grid>
              </Box>
          </Grid>

          {/* Card de Limite do Cliente - Compacto */}
          {showLimiteInfo && limiteCliente && (
            <Grid item xs={12}>
              <Alert 
                severity={limiteCliente.limiteDisponivel > 0 ? 'success' : 'error'}
                onClose={() => setShowLimiteInfo(false)}
                sx={{ py: 0.5 }}
              >
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    💳 {limiteCliente.cliente}
                  </Typography>
                  <Typography variant="body2">
                    Limite: <strong>R$ {limiteCliente.limiteTotal.toFixed(2)}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Usado: <strong>R$ {limiteCliente.limiteUtilizado.toFixed(2)}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: limiteCliente.limiteDisponivel > 0 ? 'success.main' : 'error.main',
                    fontWeight: 'bold'
                  }}>
                    Disponível: R$ {limiteCliente.limiteDisponivel.toFixed(2)}
                  </Typography>
                </Box>
              </Alert>
            </Grid>
          )}

          {/* Adicionar item */}
          {(() => {
            const operacaoSelecionada = operacoes.find(op => String(op.id_operacao) === String(venda.id_operacao));
            const isOperacaoDestino = operacaoSelecionada && operacaoSelecionada.entrega_futura === true && operacaoSelecionada.tipo_entrega_futura === 'destino';
            
            // Se for operação destino, não mostrar o card de adicionar produtos
            if (isOperacaoDestino && venda.venda_futura_origem) {
              return (
                <Grid item xs={12}>
                  <Card elevation={3} sx={{ bgcolor: '#e3f2fd' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="body1" sx={{ color: 'info.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        ℹ️ <strong>Modo Entrega Futura:</strong> Os produtos foram carregados automaticamente da venda de origem #{venda.venda_futura_origem}. Ajuste as quantidades na tabela abaixo.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            }
            
            // Caso contrário, mostrar o card normal de adicionar produtos - Compacto
            return (
              <Grid item xs={12}>
                <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                    🛒 Adicionar Produtos
                  </Typography>

                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} md={5}>
                    <Autocomplete
                      fullWidth
                      size="small"
                      disabled={vendaBloqueadaParaEdicao}
                      options={getProdutosDisponiveis()}
                      getOptionLabel={(option) => {
                        if (!option) return '';
                        const codigo = option.codigo_produto || option.codigo || option.code || option.sku || '';
                        const nome = option.nome_produto || option.nome || option.name || option.produto || option.title || '';
                        return `${codigo} - ${nome}`;
                      }}
                      value={produtos.find(p => String(p.id_produto || p.id || p.pk || p.ID) === String(novoItem.id_produto)) || null}
                      onChange={(event, newValue) => {
                        if (!newValue) {
                          setNovoItem(prev => ({ ...prev, id_produto: '', valor_unitario: 0 }));
                          setLotePreSelecionado(null);
                          setControlaProdutoLote(false);
                          return;
                        }

                        const produtoId = String(newValue.id_produto || newValue.id || newValue.pk || newValue.ID);
                        const produto = newValue;

                        // Buscar operação selecionada para saber qual depósito usar
                        const operacaoSelecionada = operacoes.find(op =>
                          String(op.id_operacao || op.id) === String(venda.id_operacao)
                        );
                        const depositoBaixaId = operacaoSelecionada?.id_deposito_baixa;

                        // Buscar valor_venda do estoque no depósito correto
                        let preco = 0;
                        if (produto && depositoBaixaId && produto.estoque_por_deposito && Array.isArray(produto.estoque_por_deposito)) {
                          const estoqueDeposito = produto.estoque_por_deposito.find(est =>
                            Number(est.id_deposito) === Number(depositoBaixaId)
                          );
                          preco = estoqueDeposito ? parseFloat(estoqueDeposito.valor_venda || 0) : 0;
                        }

                        // Fallback: se não encontrou no estoque, tentar outros campos do produto
                        if (preco === 0 && produto) {
                          preco = parseFloat(produto.valor_venda || produto.preco_venda || produto.preco || produto.price || produto.valor || 0);
                        }

                        console.log('🔧 Produto selecionado:', produtoId, produto, 'Preço:', preco);
                        // Auto-sugerir CFOP e CST/CSOSN da tabela tributacao do produto
                        const trib = produto.tributacao_detalhada || null;
                        // CFOP: usa do produto → fallback 5102 (venda mercadoria intraestadual)
                        const cfopSugerido = trib?.cfop || '5102';
                        // CST/CSOSN: escolhe campo correto baseado no regime tributário da empresa
                        //   Simples Nacional (SIMPLES) → csosn (ex: 102, 400, 500)
                        //   Regime Normal / Lucro Presumido / Lucro Real → cst_icms (ex: 000, 040, 060)
                        const isSimples = regimeTributario === 'SIMPLES';
                        const cstSugerido = isSimples
                          ? (trib?.csosn || '400')   // CSOSN padrão: tributado sem permissão de crédito
                          : (trib?.cst_icms || '000'); // CST padrão: tributado integralmente
                        setNovoItem(prev => ({
                          ...prev,
                          id_produto: produtoId,
                          valor_unitario: preco,
                          cfop: cfopSugerido || prev.cfop || '',
                          cst_csosn: cstSugerido || prev.cst_csosn || ''
                        }));

                        // 🔄 VERIFICAR SE PRODUTO CONTROLA LOTE
                        setLotePreSelecionado(null);
                        if (produto.controla_lote) {
                          setControlaProdutoLote(true);
                          // Buscar lotes disponíveis e abrir dialog imediatamente
                          axiosInstance.get(`/lote-produto/por_produto/?id_produto=${produtoId}`)
                            .then(res => {
                              const lotes = res.data;
                              if (lotes && lotes.length > 0) {
                                setLotesDisponiveis(lotes);
                                setOpenSelecionarLote(true);
                              } else {
                                setError('Este produto controla lote, mas não há lotes disponíveis. Cadastre um lote primeiro.');
                                setNovoItem(prev => ({ ...prev, id_produto: '', valor_unitario: 0 }));
                                setControlaProdutoLote(false);
                              }
                            })
                            .catch(err => {
                              console.error('[LOTE] Erro ao buscar lotes:', err);
                              setControlaProdutoLote(false);
                            });
                        } else {
                          setControlaProdutoLote(false);
                        }

                        // 🏗️ VERIFICAR SE É MATERIAL DE CONSTRUÇÃO (tem metragem_caixa ou rendimento_m2)
                        const isMaterialRevestimento = produto.metragem_caixa && parseFloat(produto.metragem_caixa) > 0;
                        const isMaterialTinta = produto.rendimento_m2 && parseFloat(produto.rendimento_m2) > 0;
                        
                        // 🔗 VERIFICAR SE TEM PRODUTO PAI (é uma variação)
                        const temProdutoPai = produto.id_produto_pai || produto.produto_pai;
                        
                        if (isMaterialRevestimento) {
                          // Produto de revestimento - oferecer calculadora
                          setProdutoParaCalculadora(produto);
                          setCalcRevestimentoAberto(true);
                        } else if (isMaterialTinta) {
                          // Produto de tinta - oferecer calculadora
                          setProdutoParaCalculadora(produto);
                          setCalcTintaAberto(true);
                        } else if (temProdutoPai) {
                          // Produto com pai - buscar e sugerir outras variações
                          buscarVariacoesProduto(produto);
                        }

                        // Focar no campo quantidade após selecionar produto
                        setTimeout(() => {
                          if (quantidadeRef.current) {
                            quantidadeRef.current.focus();
                            quantidadeRef.current.select();
                          }
                        }, 100);
                      }}
                      renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        const id = String(option.id_produto || option.id || option.pk || option.ID);
                        const nome = option.nome_produto || option.nome || option.name || option.produto || option.title;
                        const codigo = option.codigo_produto || option.codigo || option.code || option.sku || id;

                        // Buscar operação selecionada para saber qual depósito usar
                        const operacaoSelecionada = operacoes.find(op =>
                          String(op.id_operacao || op.id) === String(venda.id_operacao)
                        );
                        const depositoBaixaId = operacaoSelecionada?.id_deposito_baixa;

                        // Buscar estoque e preço do depósito correto
                        let estoqueInfo = null;
                        let quantidadeDisponivel = 0;
                        let valorVenda = 0;

                        if (depositoBaixaId && option.estoque_por_deposito && Array.isArray(option.estoque_por_deposito)) {
                          estoqueInfo = option.estoque_por_deposito.find(est =>
                            Number(est.id_deposito) === Number(depositoBaixaId)
                          );

                          if (estoqueInfo) {
                            quantidadeDisponivel = parseFloat(estoqueInfo.quantidade_atual ?? estoqueInfo.quantidade ?? 0);
                            valorVenda = parseFloat(estoqueInfo.valor_venda ?? 0);
                          }
                        }

                        // Fallback para campos diretos do produto
                        if (valorVenda === 0) {
                          valorVenda = parseFloat(option.valor_venda || option.preco_venda || option.preco || option.price || option.valor || 0);
                        }
                        if (quantidadeDisponivel === 0) {
                          quantidadeDisponivel = parseFloat(option.estoque_atual || option.estoque || option.stock || option.quantidade || 0);
                        }

                        // Buscar imagem do produto
                        const imagemUrl = option.imagem_url || localStorage.getItem(`produto_imagem_${codigo}`);

                        // Verificar se tem promoção ativa
                        const promoAtiva = verificarPromocao(id, 1);

                        return (
                          <Box
                            component="li"
                            {...optionProps}
                            key={key}
                            sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 1.5, p: 1.5 }}
                          >
                            {/* Imagem do produto */}
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f5f5f5',
                                borderRadius: 1,
                                overflow: 'hidden'
                              }}
                            >
                              {imagemUrl ? (
                                <img
                                  src={imagemUrl}
                                  alt={nome}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Box sx={{ fontSize: 20, color: '#bdbdbd' }}>📦</Box>
                              )}
                            </Box>

                            {/* Informações do produto */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ fontWeight: 'bold' }}>{codigo}</Box>
                              <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {nome || `Produto ${id}`}
                              </Box>
                              {promoAtiva && (
                                <Box sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  mt: 0.3,
                                  px: 0.8,
                                  py: 0.15,
                                  borderRadius: '10px',
                                  backgroundColor: '#fff3e0',
                                  border: '1px solid #ff9800',
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold',
                                  color: '#e65100'
                                }}>
                                  🏷️ {promoAtiva.promocao_nome}
                                  {promoAtiva.tipo_desconto === 'percentual'
                                    ? ` (-${promoAtiva.valor_desconto}%)`
                                    : ` (-R$ ${parseFloat(promoAtiva.valor_desconto).toFixed(2)})`
                                  }
                                </Box>
                              )}
                            </Box>

                            {/* Estoque e Preço */}
                            <Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                              <span style={{
                                color: quantidadeDisponivel > 0 ? 'green' : 'red',
                                fontWeight: 'bold',
                                minWidth: '80px',
                                fontSize: '0.875rem'
                              }}>
                                Estoque: {quantidadeDisponivel.toFixed(3)}
                              </span>
                              <span style={{
                                color: 'blue',
                                fontWeight: 'bold',
                                minWidth: '100px',
                                fontSize: '0.875rem'
                              }}>
                                R$ {valorVenda.toFixed(2)}
                              </span>
                            </Box>
                          </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Produto"
                          placeholder="Digite código ou descrição..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">🔍</InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                      noOptionsText={loading ? 'Carregando...' : 'Nenhum produto encontrado'}
                      loadingText="Carregando produtos..."
                      loading={loading}
                    />
                    {/* Botões de calculadora para produto selecionado */}
                    {novoItem.id_produto && (() => {
                      const prodSelecionado = produtos.find(p => String(p.id_produto) === String(novoItem.id_produto));
                      if (!prodSelecionado) return null;
                      
                      const hasCalcRevestimento = prodSelecionado.metragem_caixa && parseFloat(prodSelecionado.metragem_caixa) > 0;
                      const hasCalcTinta = prodSelecionado.rendimento_m2 && parseFloat(prodSelecionado.rendimento_m2) > 0;
                      const temVariacoes = prodSelecionado.id_produto_pai || prodSelecionado.produto_pai;
                      
                      if (!hasCalcRevestimento && !hasCalcTinta && !temVariacoes) return null;
                      
                      return (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                          {hasCalcRevestimento && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => {
                                setProdutoParaCalculadora(prodSelecionado);
                                setCalcRevestimentoAberto(true);
                              }}
                              sx={{ fontSize: '0.7rem', py: 0.3 }}
                            >
                              🧮 Calcular m²
                            </Button>
                          )}
                          {hasCalcTinta && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => {
                                setProdutoParaCalculadora(prodSelecionado);
                                setCalcTintaAberto(true);
                              }}
                              sx={{ fontSize: '0.7rem', py: 0.3 }}
                            >
                              🎨 Calcular Tinta
                            </Button>
                          )}
                          {temVariacoes && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              onClick={() => buscarVariacoesProduto(prodSelecionado)}
                              sx={{ fontSize: '0.7rem', py: 0.3 }}
                            >
                              🔗 Ver Variações
                            </Button>
                          )}
                        </Box>
                      );
                    })()}
                  </Grid>

                  {/* Indicador de Lote Selecionado */}
                  {lotePreSelecionado && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 1, borderRadius: 1, backgroundColor: '#E8F5E9', border: '1px solid #4CAF50', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ color: '#2E7D32', fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                          Lote: {lotePreSelecionado.numero_lote}
                          {lotePreSelecionado.data_validade && ` — Val: ${new Date(lotePreSelecionado.data_validade + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                          {` — Disp: ${parseFloat(lotePreSelecionado.quantidade).toFixed(3)}`}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={6} md={2.5}>
                    <TextField
                      fullWidth
                      size="medium"
                      type="number"
                      label="QUANTIDADE"
                      value={novoItem.quantidade}
                      disabled={vendaBloqueadaParaEdicao}
                      onChange={(e) => setNovoItem(prev => ({ ...prev, quantidade: e.target.value }))}
                      onBlur={(e) => setNovoItem(prev => ({ ...prev, quantidade: parseFloat(e.target.value) || 1 }))}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          valorUnitarioRef.current?.focus();
                          valorUnitarioRef.current?.select();
                        }
                      }}
                      inputRef={quantidadeRef}
                      inputProps={{ min: 0.001, step: 0.001 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">📦</InputAdornment>,
                      }}
                      sx={{
                        '& .MuiInputLabel-root': {
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          color: '#1976d2'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#1565c0',
                          fontWeight: 'bold'
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f0f7ff',
                          fontWeight: 'bold',
                          fontSize: '1.2rem',
                          '& input': {
                            textAlign: 'center',
                            fontSize: '1.3rem',
                            fontWeight: 'bold',
                            color: '#1565c0'
                          },
                          '&:hover': {
                            backgroundColor: '#e3f2fd'
                          },
                          '&.Mui-focused': {
                            backgroundColor: '#e3f2fd',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1976d2',
                              borderWidth: '2px'
                            }
                          }
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={3} md={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Preço"
                      value={novoItem.valor_unitario}
                      disabled={vendaBloqueadaParaEdicao}
                      onChange={(e) => setNovoItem(prev => ({ ...prev, valor_unitario: e.target.value }))}
                      onBlur={(e) => setNovoItem(prev => ({ ...prev, valor_unitario: parseFloat(e.target.value) || 0 }))}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          descontoRef.current?.focus();
                          descontoRef.current?.select();
                        }
                      }}
                      inputRef={valorUnitarioRef}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid item xs={3} md={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Desc"
                      value={novoItem.desconto}
                      disabled={vendaBloqueadaParaEdicao}
                      onChange={(e) => setNovoItem(prev => ({ ...prev, desconto: e.target.value }))}
                      onBlur={(e) => setNovoItem(prev => ({ ...prev, desconto: parseFloat(e.target.value) || 0 }))}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          btnAdicionarRef.current?.click();
                        }
                      }}
                      inputRef={descontoRef}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box
                              onClick={() => !vendaBloqueadaParaEdicao && setNovoItem(prev => ({ ...prev, tipo_desconto: prev.tipo_desconto === 'valor' ? 'percentual' : 'valor' }))}
                              sx={{ cursor: 'pointer', fontWeight: 'bold', color: 'primary.main', userSelect: 'none', minWidth: 20, textAlign: 'center' }}
                              title="Clique para alternar entre R$ e %"
                            >
                              {novoItem.tipo_desconto === 'valor' ? 'R$' : '%'}
                            </Box>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={3} md={1}>
                    <TextField
                      fullWidth
                      size="small"
                      label="CFOP"
                      placeholder="5102"
                      value={novoItem.cfop}
                      disabled={vendaBloqueadaParaEdicao}
                      onChange={(e) => setNovoItem(prev => ({ ...prev, cfop: e.target.value }))}
                      inputProps={{ maxLength: 5 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">📋</InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid item xs={3} md={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="CST"
                      placeholder="000"
                      value={novoItem.cst_csosn}
                      disabled={vendaBloqueadaParaEdicao}
                      onChange={(e) => setNovoItem(prev => ({ ...prev, cst_csosn: e.target.value }))}
                      inputProps={{ maxLength: 5 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">🏷️</InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid item xs={3} md={1.5}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={adicionarItem}
                      ref={btnAdicionarRef}
                      disabled={vendaBloqueadaParaEdicao}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            );
          })()}

          {/* Itens da venda */}
          <Grid item xs={12}>
            <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  🛍️ Itens
                  <Chip label={venda.itens.length} color="primary" size="small" />
                </Typography>
                {venda.itens.length > 0 && (
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    R$ {calcularTotal().toFixed(2)}
                  </Typography>
                )}
              </Box>

              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.5, px: 1 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 60 }}>Imagem</TableCell>
                        <TableCell>Produto</TableCell>
                        {venda.venda_futura_origem ? (
                          <>
                            <TableCell align="center">Qtd Vendida</TableCell>
                            <TableCell align="center">Qtd Entregue</TableCell>
                            <TableCell align="center">Qtd a Entregar</TableCell>
                          </>
                        ) : (
                          <TableCell align="center">Qtd</TableCell>
                        )}
                        <TableCell align="right">Valor Unit.</TableCell>
                        <TableCell align="right">Desconto</TableCell>
                        <TableCell align="center">CFOP</TableCell>
                        <TableCell align="center">CST/CSOSN</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                        <TableCell align="center">Ação</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {venda.itens.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={venda.venda_futura_origem ? 11 : 9} align="center">
                            <Typography color="textSecondary">
                              Nenhum item adicionado
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        venda.itens.map((item, index) => {
                          const imagemUrl = item.imagem_url || localStorage.getItem(`produto_imagem_${item.codigo_produto}`);

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Box
                                  sx={{
                                    width: 50,
                                    height: 50,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: 1,
                                    overflow: 'hidden'
                                  }}
                                >
                                  {imagemUrl ? (
                                    <img
                                      src={imagemUrl}
                                      alt={item.nome_produto}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                      }}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <Box sx={{ fontSize: 24, color: '#bdbdbd' }}>📦</Box>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ fontWeight: 'bold' }}>{item.codigo_produto}</Box>
                                <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{item.nome_produto}</Box>
                                {item.tem_promocao && (
                                  <Box sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mt: 0.5,
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: '12px',
                                    backgroundColor: '#fff3e0',
                                    border: '1px solid #ff9800',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    color: '#e65100'
                                  }}>
                                    🏷️ {item.nome_promocao || 'Promoção'}
                                  </Box>
                                )}
                                {item.obs_calculadora && (
                                  <Box sx={{ fontSize: '0.75rem', color: 'success.main', mt: 0.3 }}>
                                    🧮 {item.obs_calculadora}
                                  </Box>
                                )}
                              </TableCell>
                              {venda.venda_futura_origem ? (
                                <>
                                  {/* Quantidade Vendida (total) - Somente Leitura */}
                                  <TableCell align="center">
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={item.quantidade_total || item.quantidade}
                                      disabled
                                      sx={{ 
                                        width: 80,
                                        '& .MuiInputBase-input.Mui-disabled': {
                                          WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                                          fontWeight: 'bold',
                                          backgroundColor: '#f5f5f5'
                                        }
                                      }}
                                    />
                                  </TableCell>
                                  {/* Quantidade Já Entregue - Somente Leitura */}
                                  <TableCell align="center">
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={item.quantidade_entregue || 0}
                                      disabled
                                      sx={{ 
                                        width: 80,
                                        '& .MuiInputBase-input.Mui-disabled': {
                                          WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)',
                                          backgroundColor: '#e3f2fd'
                                        }
                                      }}
                                    />
                                  </TableCell>
                                  {/* Quantidade a Entregar AGORA - Editável */}
                                  <TableCell align="center">
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={item.quantidade}
                                      onChange={(e) => {
                                        const novaQtd = parseFloat(e.target.value) || 0;
                                        const qtdMaxima = parseFloat(item.quantidade_maxima) || 0;
                                        
                                        if (novaQtd > qtdMaxima) {
                                          alert(`Quantidade não pode ser maior que o saldo pendente: ${qtdMaxima}`);
                                          return;
                                        }
                                        
                                        alterarQuantidadeItem(index, e.target.value);
                                      }}
                                      inputProps={{ 
                                        min: 0.001, 
                                        step: 0.001,
                                        max: item.quantidade_maxima || 999999
                                      }}
                                      sx={{ 
                                        width: 80,
                                        '& .MuiOutlinedInput-root': {
                                          backgroundColor: '#fff3e0'
                                        }
                                      }}
                                      helperText={`Máx: ${parseFloat(item.quantidade_maxima || 0).toFixed(3)}`}
                                    />
                                  </TableCell>
                                </>
                              ) : (
                                <TableCell align="center">
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={item.quantidade}
                                    onChange={(e) => alterarQuantidadeItem(index, e.target.value)}
                                    inputProps={{ min: 0.01, step: 0.01 }}
                                    sx={{ width: 80 }}
                                  />
                                  {item.qtd_caixas && (
                                    <Box sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.3 }}>
                                      📦 {item.qtd_caixas} cx
                                    </Box>
                                  )}
                                </TableCell>
                              )}
                              <TableCell align="right">R$ {parseFloat(item.valor_unitario || 0).toFixed(2)}</TableCell>
                              <TableCell align="right">
                                {vendaBloqueadaParaEdicao ? (
                                  <>R$ {parseFloat(item.desconto || 0).toFixed(2)}</>
                                ) : (
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={item.desconto_tipo_edicao === 'percentual' ? (parseFloat(item.desconto_percentual) || 0) : (parseFloat(item.desconto) || 0)}
                                      onChange={(e) => alterarDescontoItem(index, e.target.value, item.desconto_tipo_edicao || 'valor')}
                                      inputProps={{ min: 0, step: 0.01 }}
                                      sx={{ width: 75 }}
                                      InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start">
                                            <Box
                                              onClick={() => {
                                                const novoTipo = (item.desconto_tipo_edicao || 'valor') === 'valor' ? 'percentual' : 'valor';
                                                setVenda(prev => ({
                                                  ...prev,
                                                  itens: prev.itens.map((it, i) => i === index ? { ...it, desconto_tipo_edicao: novoTipo } : it)
                                                }));
                                              }}
                                              sx={{ cursor: 'pointer', fontWeight: 'bold', color: 'primary.main', userSelect: 'none', fontSize: '0.75rem', minWidth: 16 }}
                                              title="Clique para alternar entre R$ e %"
                                            >
                                              {(item.desconto_tipo_edicao || 'valor') === 'valor' ? 'R$' : '%'}
                                            </Box>
                                          </InputAdornment>
                                        ),
                                      }}
                                    />
                                  </Box>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  size="small"
                                  placeholder="CFOP"
                                  value={item.cfop || ''}
                                  onChange={(e) => {
                                    setVenda(prev => ({
                                      ...prev,
                                      itens: prev.itens.map((it, i) =>
                                        i === index ? { ...it, cfop: e.target.value } : it
                                      )
                                    }));
                                  }}
                                  inputProps={{ maxLength: 5, style: { textAlign: 'center' } }}
                                  sx={{ width: 80 }}
                                  disabled={vendaBloqueadaParaEdicao}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  size="small"
                                  placeholder="CST"
                                  value={item.cst_csosn || ''}
                                  onChange={(e) => {
                                    setVenda(prev => ({
                                      ...prev,
                                      itens: prev.itens.map((it, i) =>
                                        i === index ? { ...it, cst_csosn: e.target.value } : it
                                      )
                                    }));
                                  }}
                                  inputProps={{ maxLength: 5, style: { textAlign: 'center' } }}
                                  sx={{ width: 80 }}
                                  disabled={vendaBloqueadaParaEdicao}
                                />
                              </TableCell>
                              <TableCell align="right">R$ {parseFloat(item.subtotal || 0).toFixed(2)}</TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removerItem(index)}
                                  title="Remover item"
                                  disabled={vendaBloqueadaParaEdicao}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid>

            {/* Totais e ações */}
            <Grid item xs={12}>
              <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  💰 Finalização
                </Typography>

                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Desc Geral"
                      value={venda.desconto}
                      onChange={(e) => setVenda(prev => ({ ...prev, desconto: e.target.value }))}
                      onBlur={(e) => setVenda(prev => ({ ...prev, desconto: parseFloat(e.target.value) || 0 }))}
                      onFocus={(e) => e.target.select()}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box
                              onClick={() => !vendaBloqueadaParaEdicao && setVenda(prev => ({ ...prev, tipo_desconto_geral: prev.tipo_desconto_geral === 'valor' ? 'percentual' : 'valor' }))}
                              sx={{ cursor: 'pointer', fontWeight: 'bold', color: 'primary.main', userSelect: 'none', minWidth: 20, textAlign: 'center' }}
                              title="Clique para alternar entre R$ e %"
                            >
                              {venda.tipo_desconto_geral === 'valor' ? 'R$' : '%'}
                            </Box>
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{ shrink: true }}
                      disabled={vendaBloqueadaParaEdicao}
                    />
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Taxa Entrega"
                      value={venda.taxa_entrega}
                      onChange={(e) => setVenda(prev => ({ ...prev, taxa_entrega: e.target.value }))}
                      onBlur={(e) => setVenda(prev => ({ ...prev, taxa_entrega: parseFloat(e.target.value) || 0 }))}
                      onFocus={(e) => e.target.select()}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                      InputLabelProps={{ shrink: true }}
                      disabled={vendaBloqueadaParaEdicao}
                    />
                  </Grid>

                  {/* 💰 Alerta de Cashback Aplicado */}
                  {venda.aplicar_cashback && venda.cashback_disponivel > 0 && (
                    <Grid item xs={12}>
                      <Alert
                        severity="success"
                        icon={<CheckCircleIcon />}
                        sx={{
                          bgcolor: '#e8f5e9',
                          '& .MuiAlert-icon': {
                            color: '#2e7d32'
                          }
                        }}
                      >
                        <strong>💰 Cashback Aplicado!</strong>
                        <br />
                        Desconto de <strong>R$ {venda.cashback_disponivel.toFixed(2)}</strong> será aplicado nesta venda.
                      </Alert>
                    </Grid>
                  )}

                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Subtotal"
                      value={Number(calcularTotal()).toFixed(2)}
                      InputProps={{
                        readOnly: true,
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiInputBase-input': {
                          bgcolor: '#f5f5f5',
                          cursor: 'default'
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Desc %"
                      value={(() => {
                        const subtotal = calcularTotal();
                        if (!subtotal || subtotal <= 0) return '0.00';
                        const descontoInput = parseFloat(venda.desconto) || 0;
                        const descontoValor = venda.tipo_desconto_geral === 'percentual'
                          ? (subtotal * descontoInput) / 100
                          : descontoInput;
                        return ((descontoValor / subtotal) * 100).toFixed(2);
                      })()}
                      InputProps={{
                        readOnly: true,
                        startAdornment: <InputAdornment position="start">%</InputAdornment>,
                      }}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiInputBase-input': {
                          bgcolor: '#fff3e0',
                          color: '#e65100',
                          fontWeight: 'bold',
                          cursor: 'default'
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Valor Total"
                      value={parseFloat(venda.valor_total || 0).toFixed(2)}
                      InputProps={{
                        readOnly: true,
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          bgcolor: '#e8f5e9',
                          color: '#2e7d32',
                          cursor: 'default'
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 1.5, bgcolor: 'grey.50', gap: 1 }}>
          {!!user?.parametros?.mostrar_lucratividade && (venda.itens || []).length > 0 && (
            <Button
              variant={showLucratividade ? 'contained' : 'outlined'}
              color="info"
              size="small"
              onClick={() => setShowLucratividade(v => !v)}
            >
              📊 Lucratividade
            </Button>
          )}
          {!!user?.parametros?.mostrar_lucratividade && showLucratividade && (venda.itens || []).length > 0 && (
            <Box sx={{
              flex: 1, p: 1.5, borderRadius: 2, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center',
              backgroundColor: (() => { const m = calcularMargemVenda(); return m >= 30 ? '#e8f5e9' : m >= 15 ? '#fff8e1' : '#fce4ec'; })(),
              border: (() => { const m = calcularMargemVenda(); return m >= 30 ? '1.5px solid #4caf50' : m >= 15 ? '1.5px solid #ffc107' : '1.5px solid #e91e63'; })()
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">Custo Total</Typography>
                <Typography variant="body2" fontWeight="bold" color="error.main">R$ {calcularCustoTotalVenda().toFixed(2)}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">Lucro Bruto</Typography>
                <Typography variant="body2" fontWeight="bold" color={calcularLucroVenda() >= 0 ? 'success.main' : 'error.main'}>R$ {calcularLucroVenda().toFixed(2)}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">Margem</Typography>
                <Typography variant="body2" fontWeight="bold" color={(() => { const m = calcularMargemVenda(); return m >= 30 ? '#2e7d32' : m >= 15 ? '#f57f17' : '#c62828'; })()}>{calcularMargemVenda().toFixed(1)}%</Typography>
              </Box>
            </Box>
          )}
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => {
              limparFormulario();
              setOpenModalNovaVenda(false);
              if (embedded) onClose?.();
            }}
            startIcon={<ClearIcon />}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={salvarVenda}
            disabled={loading || vendaBloqueadaParaEdicao}
            startIcon={<SaveIcon />}
          >
            {loading ? '⏳ Salvando...' : 'Salvar Venda'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Cliente em Atraso */}
      <Dialog
        open={openAtrasoModal}
        onClose={() => {
          setOpenAtrasoModal(false);
          // Se foi bloquear, já limpou o cliente antes
        }}
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: 'warning.lighter',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(237, 108, 2, 0.3)'
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: 'warning.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          ⚠️ Cliente com Títulos em Atraso
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {atrasoInfo && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'warning.dark' }}>
                🚨 Cliente possui {atrasoInfo.qtd_titulos || 0} título(s) em atraso!
              </Typography>

              {atrasoInfo.titulo_mais_antigo && (
                <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    📄 <strong>Título mais antigo:</strong> {atrasoInfo.titulo_mais_antigo.documento_numero || 'N/A'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    📅 <strong>Vencimento:</strong> {atrasoInfo.titulo_mais_antigo.data_vencimento || 'N/A'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    ⏱️ <strong>Dias em atraso:</strong> {atrasoInfo.titulo_mais_antigo.dias_atraso || 0} dias
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    💵 <strong>Valor:</strong> R$ {(atrasoInfo.titulo_mais_antigo.valor || 0).toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ bgcolor: 'error.lighter', p: 2, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: 'error.dark' }}>
                  💰 Total em atraso: R$ {(atrasoInfo.valor_total_atraso || 0).toFixed(2)}
                </Typography>
              </Box>

              {acaoAtrasoAtual === 'bloquear' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  🚫 <strong>VENDA BLOQUEADA!</strong> Cliente não pode realizar compras com títulos em atraso.
                </Alert>
              )}

              {acaoAtrasoAtual === 'solicitar_senha' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  🔐 Necessária autorização de supervisor para continuar.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'white' }}>
          {acaoAtrasoAtual === 'solicitar_senha' ? (
            <>
              <Button onClick={() => {
                setOpenAtrasoModal(false);
                setVenda(prev => ({ ...prev, id_cliente: '' }));
              }} color="error">
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  const senha = prompt('Digite a senha de supervisor para continuar:');
                  if (!senha) {
                    setOpenAtrasoModal(false);
                    setVenda(prev => ({ ...prev, id_cliente: '' }));
                    return;
                  }

                  try {
                    const senhaResponse = await axiosInstance.post('/verificar-senha-supervisor/', { senha });
                    if (!senhaResponse.data.valida) {
                      alert('❌ Senha incorreta! Venda cancelada.');
                      setOpenAtrasoModal(false);
                      setVenda(prev => ({ ...prev, id_cliente: '' }));
                      return;
                    }
                    setSuccess('✅ Senha autorizada. Cliente em atraso aceito.');
                    setTimeout(() => setSuccess(''), 3000);
                    setOpenAtrasoModal(false);
                  } catch (err) {
                    alert('❌ Senha incorreta! Venda cancelada.');
                    setOpenAtrasoModal(false);
                    setVenda(prev => ({ ...prev, id_cliente: '' }));
                  }
                }}
                variant="contained"
                color="warning"
              >
                🔐 Autorizar
              </Button>
            </>
          ) : (
            <Button onClick={() => setOpenAtrasoModal(false)} variant="contained" color="warning">
              {acaoAtrasoAtual === 'bloquear' ? 'Fechar' : 'OK, Entendi'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal de Estoque Insuficiente */}
      <Dialog
        open={openEstoqueModal}
        onClose={() => {
          setOpenEstoqueModal(false);
          setItemPendenteEstoque(null);
        }}
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: 'info.lighter',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(2, 136, 209, 0.3)'
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: 'info.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          📦 Estoque Insuficiente
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {estoqueInfo && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'info.dark' }}>
                🚨 Produto sem estoque disponível!
              </Typography>

              <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  📦 <strong>Produto:</strong> {estoqueInfo.produto.codigo} - {estoqueInfo.produto.nome}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  ✅ <strong>Disponível:</strong> {estoqueInfo.produto.estoque_disponivel}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  🛒 <strong>Solicitado:</strong> {estoqueInfo.produto.quantidade_solicitada}
                </Typography>
                <Typography variant="body1" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                  ❌ <strong>Faltam:</strong> {estoqueInfo.produto.faltam} unidade(s)
                </Typography>
              </Box>

              {acaoEstoqueAtual === 'bloquear' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  🚫 <strong>VENDA BLOQUEADA!</strong> Não é possível vender sem estoque.
                </Alert>
              )}

              {acaoEstoqueAtual === 'solicitar_senha' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  🔐 Necessária autorização de supervisor para continuar.
                </Alert>
              )}

              {acaoEstoqueAtual === 'alertar' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  ⚠️ Produto será vendido mesmo sem estoque disponível.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'white' }}>
          {acaoEstoqueAtual === 'solicitar_senha' ? (
            <>
              <Button onClick={() => {
                setOpenEstoqueModal(false);
                setItemPendenteEstoque(null);
              }} color="error">
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  const senha = prompt('Digite a senha de supervisor para continuar:');
                  if (!senha) {
                    setOpenEstoqueModal(false);
                    setItemPendenteEstoque(null);
                    return;
                  }

                  try {
                    const senhaResponse = await axiosInstance.post('/verificar-senha-supervisor/', { senha });
                    if (!senhaResponse.data.valida) {
                      alert('❌ Senha incorreta! Item não adicionado.');
                      setOpenEstoqueModal(false);
                      setItemPendenteEstoque(null);
                      return;
                    }
                    setSuccess('✅ Senha autorizada. Item adicionado mesmo sem estoque.');
                    setTimeout(() => setSuccess(''), 3000);
                    setOpenEstoqueModal(false);

                    // Adicionar o item pendente
                    if (itemPendenteEstoque) {
                      efetivarAdicaoItem(itemPendenteEstoque, itemPendenteEstoque.produto);
                      setItemPendenteEstoque(null);
                    }
                  } catch (err) {
                    alert('❌ Senha incorreta! Item não adicionado.');
                    setOpenEstoqueModal(false);
                    setItemPendenteEstoque(null);
                  }
                }}
                variant="contained"
                color="info"
              >
                🔐 Autorizar
              </Button>
            </>
          ) : acaoEstoqueAtual === 'alertar' ? (
            <>
              <Button onClick={() => {
                setOpenEstoqueModal(false);
                setItemPendenteEstoque(null);
              }} color="error">
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setOpenEstoqueModal(false);
                  if (itemPendenteEstoque) {
                    if (itemPendenteEstoque.finalizacao) {
                      // Fluxo de finalização: apenas processar próxima validação
                      setItemPendenteEstoque(null);
                      console.log('🔄 Finalização: autorização confirmada para item, processando próxima validação (Vendas)');
                      setTimeout(() => processarProximaValidacao(), 100);
                    } else {
                      // Fluxo normal de adicionar item
                      efetivarAdicaoItem(itemPendenteEstoque, itemPendenteEstoque.produto);
                      setItemPendenteEstoque(null);
                    }
                  }
                }}
                variant="contained"
                color="info"
              >
                Continuar Mesmo Assim
              </Button>
            </>
          ) : (
            <Button onClick={() => {
              setOpenEstoqueModal(false);
              setItemPendenteEstoque(null);
            }} variant="contained" color="info">
              Fechar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal de Cadastro de Cliente */}
      <Dialog
        open={openClienteModal}
        onClose={fecharModalCliente}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          👤 Cadastrar Novo Cliente
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Dados Principais */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 'bold' }}>
                  📋 Dados Principais
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Nome / Razão Social"
                  value={clienteForm.nome_razao_social}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, nome_razao_social: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome Fantasia"
                  value={clienteForm.nome_fantasia}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, nome_fantasia: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="CPF / CNPJ"
                  value={clienteForm.cpf_cnpj}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, cpf_cnpj: e.target.value }))}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          color="primary"
                          onClick={() => buscarPorCNPJ(clienteForm.cpf_cnpj)}
                          disabled={loading || !clienteForm.cpf_cnpj}
                          title="Buscar dados por CNPJ"
                          size="small"
                        >
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="RG / IE"
                  value={clienteForm.rg_ie}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, rg_ie: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data de Nascimento"
                  value={clienteForm.data_nascimento}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, data_nascimento: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sexo</InputLabel>
                  <Select
                    value={clienteForm.sexo}
                    onChange={(e) => setClienteForm(prev => ({ ...prev, sexo: e.target.value }))}
                    label="Sexo"
                  >
                    <MenuItem value="">Não informado</MenuItem>
                    <MenuItem value="M">Masculino</MenuItem>
                    <MenuItem value="F">Feminino</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Contatos */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2, fontWeight: 'bold' }}>
                  📞 Contatos
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={clienteForm.telefone}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(00) 0000-0000"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Celular"
                  value={clienteForm.celular}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, celular: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="WhatsApp"
                  value={clienteForm.whatsapp}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WhatsAppIcon fontSize="small" color="success" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={clienteForm.email}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </Grid>

              {/* Endereço */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2, fontWeight: 'bold' }}>
                  📍 Endereço
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="CEP"
                  value={clienteForm.cep}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, cep: e.target.value }))}
                  placeholder="00000-000"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          color="primary"
                          onClick={() => buscarPorCEP(clienteForm.cep)}
                          disabled={loading || !clienteForm.cep}
                          title="Buscar endereço por CEP"
                          size="small"
                        >
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} md={7}>
                <TextField
                  fullWidth
                  label="Endereço"
                  value={clienteForm.endereco}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Rua, Avenida, etc."
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Número"
                  value={clienteForm.numero}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, numero: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Complemento"
                  value={clienteForm.complemento}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, complemento: e.target.value }))}
                  placeholder="Apto, Sala, Bloco, etc."
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Bairro"
                  value={clienteForm.bairro}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, bairro: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={clienteForm.cidade}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, cidade: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} md={1}>
                <TextField
                  fullWidth
                  label="UF"
                  value={clienteForm.estado}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, estado: e.target.value.toUpperCase() }))}
                  inputProps={{ maxLength: 2 }}
                  placeholder="SP"
                />
              </Grid>

              {/* Dados Financeiros */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2, fontWeight: 'bold' }}>
                  💰 Dados Financeiros
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Limite de Crédito"
                  value={clienteForm.limite_credito}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, limite_credito: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharModalCliente} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={salvarNovoCliente}
            variant="contained"
            disabled={loading || !clienteForm.nome_razao_social}
            startIcon={<SaveIcon />}
          >
            {loading ? 'Salvando...' : 'Salvar Cliente'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Financeiro */}
      <Dialog
        open={openFinanceiroModal}
        onClose={fecharModalFinanceiro}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          💰 Gerar Financeiro
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              ✅ Venda <strong>#{vendaParaFinanceiro?.numero_documento}</strong> salva com sucesso!
              Configure o financeiro abaixo.
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Valor Total"
                  value={parseFloat(vendaParaFinanceiro?.valor_total || 0).toFixed(2)}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputBase-input': {
                      bgcolor: '#f5f5f5',
                      cursor: 'default',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Forma de Pagamento</InputLabel>
                  <Select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                  >
                    {formasPagamento.length === 0 ? (
                      <MenuItem value="">
                        <em>Carregando...</em>
                      </MenuItem>
                    ) : (
                      formasPagamento.map((fp) => (
                        <MenuItem key={fp.id_forma_pagamento} value={fp.nome_forma}>
                          {fp.nome_forma}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Número de Parcelas"
                  value={numeroParcelas}
                  onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1, max: 48 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data do Primeiro Vencimento"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Campos de Valor Pago e Troco */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Chip label="Cálculo de Troco" size="small" />
                </Divider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Valor Pago pelo Cliente"
                  value={valorPago || ''}
                  onChange={(e) => {
                    const pago = parseFloat(e.target.value) || 0;
                    setValorPago(pago);
                    const valorTotal = parseFloat(vendaParaFinanceiro?.valor_total || 0);
                    const calculoTroco = pago - valorTotal;
                    setTroco(calculoTroco > 0 ? calculoTroco : 0);
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  InputLabelProps={{ shrink: true }}
                  placeholder="Digite o valor recebido"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Troco"
                  value={troco.toFixed(2)}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInputBase-input': {
                      bgcolor: troco > 0 ? '#e8f5e9' : '#f5f5f5',
                      cursor: 'default',
                      fontWeight: 'bold',
                      color: troco > 0 ? '#2e7d32' : 'text.secondary'
                    }
                  }}
                />
              </Grid>

              {/* Alerta de limite de crédito em tempo real */}
              {alertaLimiteFinanceiro && (
                <Grid item xs={12}>
                  <Alert
                    severity={alertaLimiteFinanceiro.modoValidacao === 'alertar' ? 'warning' : 'error'}
                    icon="🚨"
                    sx={{
                      fontSize: '1rem',
                      '& .MuiAlert-message': { width: '100%' }
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                        ⚠️ LIMITE DE CRÉDITO EXCEDIDO!
                      </Typography>

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 1 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            👤 <strong>Cliente:</strong>
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {alertaLimiteFinanceiro.nomeCliente}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            💳 <strong>Limite de Crédito:</strong>
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            R$ {alertaLimiteFinanceiro.limiteCredito.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            📊 <strong>Limite Utilizado (Saldo Devedor):</strong>
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            R$ {alertaLimiteFinanceiro.saldoDevedor.toFixed(2)}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            ✅ <strong>Limite Disponível:</strong>
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: alertaLimiteFinanceiro.creditoDisponivel >= 0 ? 'success.main' : 'error.main' }}>
                            R$ {alertaLimiteFinanceiro.creditoDisponivel.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>

                      {alertaLimiteFinanceiro.modoValidacao === 'alertar' && (
                        <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                          ℹ️ Você pode prosseguir com a geração do financeiro, mas o cliente está acima do limite.
                        </Typography>
                      )}
                    </Box>
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Conta Bancária (Cobrança)</InputLabel>
                  <Select
                    value={contaBancaria}
                    onChange={(e) => setContaBancaria(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Nenhuma</em>
                    </MenuItem>
                    {contasBancarias.map((conta) => (
                      <MenuItem key={conta.id_conta_bancaria} value={conta.id_conta_bancaria}>
                        {conta.nome_conta}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Departamento</InputLabel>
                  <Select
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Nenhum</em>
                    </MenuItem>
                    {departamentos.map((depto) => (
                      <MenuItem key={depto.id_departamento} value={depto.id_departamento}>
                        {depto.nome_departamento}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Centro de Custo</InputLabel>
                  <Select
                    value={centroCusto}
                    onChange={(e) => setCentroCusto(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Nenhum</em>
                    </MenuItem>
                    {centrosCusto.map((cc) => (
                      <MenuItem key={cc.id_centro_custo} value={cc.id_centro_custo}>
                        {cc.nome_centro_custo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  <strong>Resumo:</strong> {numeroParcelas} parcela(s) de R$ {(parseFloat(vendaParaFinanceiro?.valor_total || 0) / numeroParcelas).toFixed(2)}
                </Alert>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelarModalFinanceiro} color="error">
            ❌ Cancelar e Excluir Venda
          </Button>
          <Button
            onClick={gerarFinanceiro}
            variant="contained"
            color="success"
            disabled={loading}
          >
            {loading ? 'Gerando...' : '✓ Gerar Financeiro'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Crédito do Cliente */}
      {/* Modal de confirmação de imagens no PDF de ORÇAMENTO */}
      <Dialog
        open={openImagemPDFModal}
        onClose={() => {
          setOpenImagemPDFModal(false);
          setVendaParaPDF(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'info.main', color: 'white' }}>
          🖼️ Incluir Imagens dos Produtos?
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Este é um <strong>ORÇAMENTO</strong>. Deseja incluir as imagens dos produtos no PDF?
          </Alert>
          <Typography variant="body2" color="text.secondary">
            • <strong>Com imagens:</strong> PDF mais visual e atraente para o cliente<br />
            • <strong>Sem imagens:</strong> PDF mais compacto e rápido de gerar
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => confirmarGerarPDFComImagens(false)}
            variant="outlined"
            color="inherit"
          >
            Sem Imagens
          </Button>
          <Button
            onClick={() => confirmarGerarPDFComImagens(true)}
            variant="contained"
            color="primary"
            startIcon={<span>🖼️</span>}
          >
            Com Imagens
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showCreditoModal}
        onClose={() => {
          console.log('🚫 Modal de crédito fechado pelo onClose');
          setShowCreditoModal(false);
          setUsarCredito(false);
          setLoading(false);
        }}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={false}
      >
        <DialogTitle>
          💰 Crédito Disponível
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>Cliente possui crédito disponível!</strong>
            </Alert>

            <Typography variant="h5" align="center" sx={{ mb: 3, color: 'success.main', fontWeight: 'bold' }}>
              R$ {creditoCliente.toFixed(2)}
            </Typography>

            <Typography variant="body1" align="center" sx={{ mb: 2 }}>
              Deseja utilizar o crédito como desconto nesta venda?
            </Typography>

            <Typography variant="body2" color="text.secondary" align="center">
              O crédito será aplicado automaticamente como desconto e deduzido do saldo do cliente.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('❌ CLIQUE: Usuário optou por NÃO usar o crédito');
              setShowCreditoModal(false);
              setUsarCredito(false);
              setDecisaoCreditoTomada(true);
              setTimeout(() => salvarVenda(), 100);
            }}
            color="inherit"
            variant="outlined"
            size="large"
            sx={{ minWidth: 150 }}
          >
            Não usar crédito
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('✅ CLIQUE: Usuário optou por USAR o crédito');
              setShowCreditoModal(false);
              setUsarCredito(true);
              setDecisaoCreditoTomada(true);
              setTimeout(() => salvarVenda(), 100);
            }}
            variant="contained"
            color="success"
            size="large"
            sx={{ minWidth: 150 }}
          >
            Usar crédito
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Cashback */}
      <Dialog
        open={showCashbackModal}
        onClose={() => {
          setShowCashbackModal(false);
          setVenda(prev => ({ ...prev, aplicar_cashback: false }));
          setDecisaoCashbackTomada(true);
          setLoading(false);
        }}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={false}
      >
        <DialogTitle>
          🎉 Cashback Disponível
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              <strong>Cliente possui cashback disponível!</strong>
            </Alert>

            <Typography variant="h5" align="center" sx={{ mb: 3, color: 'success.main', fontWeight: 'bold' }}>
              R$ {parseFloat(venda.cashback_disponivel || 0).toFixed(2)}
            </Typography>

            <Typography variant="body1" align="center" sx={{ mb: 2 }}>
              Deseja utilizar o cashback como desconto nesta venda?
            </Typography>

            <Typography variant="body2" color="text.secondary" align="center">
              O cashback será aplicado automaticamente como desconto e deduzido do saldo do cliente.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('❌ CLIQUE: Usuário optou por NÃO usar o cashback');
              setShowCashbackModal(false);
              setVenda(prev => ({ ...prev, aplicar_cashback: false }));
              setDecisaoCashbackTomada(true);
              setTimeout(() => salvarVenda(), 100);
            }}
            color="inherit"
            variant="outlined"
            size="large"
            sx={{ minWidth: 150 }}
          >
            Não usar cashback
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('✅ CLIQUE: Usuário optou por USAR o cashback');
              setShowCashbackModal(false);
              setVenda(prev => ({ ...prev, aplicar_cashback: true }));
              setDecisaoCashbackTomada(true);
              setTimeout(() => salvarVenda(), 100);
            }}
            variant="contained"
            color="success"
            size="large"
            sx={{ minWidth: 150 }}
          >
            Usar cashback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog
        open={openExcluirModal}
        onClose={() => {
          setOpenExcluirModal(false);
          setVendaParaExcluir(null);
          setContasPendentesParaExcluir([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          🗑️ Confirmar Exclusão
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Atenção!</strong> Esta ação não pode ser desfeita.
          </Alert>

          {contasPendentesParaExcluir.length > 0 ? (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Financeiro Pendente!</strong> Esta venda possui {contasPendentesParaExcluir.length} conta(s) a receber pendente(s).
              </Alert>

              <Typography variant="body1" sx={{ mb: 2 }}>
                Ao excluir a venda <strong>{vendaParaExcluir?.numero_documento}</strong>, as seguintes contas a receber também serão excluídas:
              </Typography>

              <Box sx={{ mt: 2, mb: 2, maxHeight: 200, overflow: 'auto' }}>
                {contasPendentesParaExcluir.map((conta, index) => (
                  <Box key={conta.id_conta} sx={{ p: 1.5, mb: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>Parcela {index + 1}:</strong> R$ {parseFloat(conta.valor_parcela || 0).toFixed(2)} -
                      Venc: {formatarDataLocal(conta.data_vencimento)} -
                      Status: {conta.status_conta}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
                ⚠️ Deseja realmente excluir a venda e todas as contas pendentes?
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Deseja realmente excluir a venda <strong>{vendaParaExcluir?.numero_documento}</strong>?
              </Typography>

              {vendaParaExcluir && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2"><strong>Cliente:</strong> {vendaParaExcluir.nome_cliente}</Typography>
                  <Typography variant="body2"><strong>Data:</strong> {formatarDataLocal(vendaParaExcluir.data_venda)}</Typography>
                  <Typography variant="body2"><strong>Valor:</strong> R$ {Number(vendaParaExcluir.valor_total || 0).toFixed(2)}</Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => {
              console.log('❌ Usuário cancelou a exclusão');
              setOpenExcluirModal(false);
              setVendaParaExcluir(null);
              setContasPendentesParaExcluir([]);
            }}
            variant="outlined"
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={contasPendentesParaExcluir.length > 0 ? confirmarExclusaoComContas : confirmarExclusaoVenda}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={loading}
          >
            {loading ? 'Excluindo...' : 'Sim, excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Autorização - Limite de Crédito */}
      <Dialog
        open={openLimiteModal}
        onClose={() => { }}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>
          ⚠️ Autorização Necessária - {limiteInfo?.motivo === 'prazo_vencimento' ? 'Prazo de Vencimento' : 'Limite de Crédito'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {limiteInfo && (
            <>
              <Alert severity="error" sx={{ mb: 3 }}>
                <strong>{limiteInfo.mensagem?.toUpperCase() || 'AUTORIZAÇÃO NECESSÁRIA'}!</strong>
              </Alert>

              <Grid container spacing={2}>
                {limiteInfo.motivo === 'prazo_vencimento' ? (
                  /* Modal para validação de prazo de vencimento */
                  <>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                        <Typography variant="h6" gutterBottom>
                          📅 Informações de Prazo
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Cliente:</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {limiteInfo.cliente.nome}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Valor da Venda:</Typography>
                            <Typography variant="h6" fontWeight="bold" color="info.main">
                              R$ {limiteInfo.valor_venda.toFixed(2)}
                            </Typography>
                          </Grid>

                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">Data do Documento:</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {limiteInfo.data_documento}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">Data de Vencimento:</Typography>
                            <Typography variant="body1" fontWeight="bold" color="error.main">
                              {limiteInfo.data_vencimento}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">Prazo Máximo Permitido:</Typography>
                            <Typography variant="body1" fontWeight="bold" color="warning.main">
                              {limiteInfo.prazo_maximo} dias
                            </Typography>
                          </Grid>

                          <Grid item xs={12}>
                            <Alert severity="warning">
                              <strong>Excedente:</strong> {limiteInfo.dias_excedentes} dia(s) além do prazo permitido
                            </Alert>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </>
                ) : (
                  /* Modal para validação de limite de crédito */
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                      <Typography variant="h6" gutterBottom>
                        📊 Informações do Cliente
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">Cliente:</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {limiteInfo.cliente.nome}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">Limite de Crédito:</Typography>
                          <Typography variant="body1" fontWeight="bold" color="primary.main">
                            R$ {limiteInfo.cliente.limite_credito.toFixed(2)}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">Saldo Devedor Atual:</Typography>
                          <Typography variant="body1" fontWeight="bold" color="error.main">
                            R$ {limiteInfo.cliente.saldo_devedor.toFixed(2)}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">Crédito Disponível:</Typography>
                          <Typography variant="body1" fontWeight="bold" color="success.main">
                            R$ {limiteInfo.cliente.credito_disponivel.toFixed(2)}
                          </Typography>
                        </Grid>

                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">Valor desta Venda:</Typography>
                          <Typography variant="h6" fontWeight="bold" color="info.main">
                            R$ {limiteInfo.valor_venda.toFixed(2)}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">Valor Excedente:</Typography>
                          <Typography variant="h6" fontWeight="bold" color="error.main">
                            R$ {limiteInfo.valor_excedente.toFixed(2)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Alert severity="warning">
                    <strong>Para prosseguir com esta venda, é necessária autorização de um supervisor.</strong>
                  </Alert>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    🔐 Autorização do Supervisor
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Usuário do Supervisor"
                    value={senhaSupervisor.username}
                    onChange={(e) => setSenhaSupervisor(prev => ({ ...prev, username: e.target.value }))}
                    disabled={verificandoSenha}
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        document.getElementById('senha-supervisor-input')?.focus();
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    id="senha-supervisor-input"
                    fullWidth
                    type="password"
                    label="Senha do Supervisor"
                    value={senhaSupervisor.password}
                    onChange={(e) => setSenhaSupervisor(prev => ({ ...prev, password: e.target.value }))}
                    disabled={verificandoSenha}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        verificarSenhaSupervisor();
                      }
                    }}
                  />
                </Grid>

                {error && (
                  <Grid item xs={12}>
                    <Alert severity="error">{error}</Alert>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={bloquearVenda}
            variant="outlined"
            color="error"
            disabled={verificandoSenha}
            startIcon={<ClearIcon />}
          >
            Bloquear Venda
          </Button>
          <Button
            onClick={verificarSenhaSupervisor}
            variant="contained"
            color="success"
            disabled={verificandoSenha || !senhaSupervisor.username || !senhaSupervisor.password}
            startIcon={verificandoSenha ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {verificandoSenha ? 'Verificando...' : 'Autorizar Venda'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Bloqueio de Venda */}
      <Dialog
        open={openBloqueioModal}
        onClose={() => setOpenBloqueioModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'error.dark',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{
          textAlign: 'center',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          py: 3
        }}>
          🚫 VENDA BLOQUEADA!
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: '4rem',
                mb: 3,
                animation: 'pulse 1.5s infinite'
              }}
            >
              ⛔
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                lineHeight: 1.8,
                whiteSpace: 'pre-line'
              }}
            >
              {mensagemBloqueio}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => setOpenBloqueioModal(false)}
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: 'error.dark',
              '&:hover': {
                bgcolor: 'grey.200'
              },
              fontWeight: 'bold',
              px: 4
            }}
          >
            ENTENDI
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Aprovação de Desconto */}
      <Dialog open={openDescontoModal} onClose={() => {}} maxWidth="sm" fullWidth disableEscapeKeyDown>
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>
          💸 Aprovação de Desconto Necessária
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {infoDesconto && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                O desconto informado (<strong>{infoDesconto.percentual_solicitado.toFixed(1)}%</strong>) excede
                o limite configurado de <strong>{infoDesconto.limite_desconto.toFixed(1)}%</strong>.
                <br />É necessária autorização de um supervisor para prosseguir.
              </Alert>

              <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Desconto solicitado:</Typography>
                    <Typography variant="body1" fontWeight="bold" color="error.main">
                      R$ {infoDesconto.valor_desconto.toFixed(2)} ({infoDesconto.percentual_solicitado.toFixed(1)}%)
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Limite permitido:</Typography>
                    <Typography variant="body1" fontWeight="bold" color="warning.main">
                      {infoDesconto.limite_desconto.toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Valor total da venda:</Typography>
                    <Typography variant="body1" fontWeight="bold">R$ {infoDesconto.valor_total.toFixed(2)}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="h6" gutterBottom>🔐 Autorização do Supervisor</Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth label="Usuário do Supervisor"
                    value={senhaSupervisorDesconto.username}
                    onChange={e => setSenhaSupervisorDesconto(prev => ({ ...prev, username: e.target.value }))}
                    disabled={verificandoSenhaDesconto || aguardandoAprovacaoWhatsApp}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth label="Senha" type="password"
                    value={senhaSupervisorDesconto.password}
                    onChange={e => setSenhaSupervisorDesconto(prev => ({ ...prev, password: e.target.value }))}
                    disabled={verificandoSenhaDesconto || aguardandoAprovacaoWhatsApp}
                    onKeyDown={e => { if (e.key === 'Enter') verificarSenhaSupervisorDesconto(); }}
                  />
                </Grid>
              </Grid>

              {solicitacaoDesconto && (
                <Alert severity={
                  solicitacaoDesconto.status === 'Aprovada' ? 'success' :
                  solicitacaoDesconto.status === 'Rejeitada' ? 'error' :
                  (solicitacaoDesconto.status === 'Pendente' && !solicitacaoDesconto.whatsapp_enviado) ? 'warning' : 'info'
                } sx={{ mt: 2 }}>
                  {solicitacaoDesconto.status === 'Pendente' && aguardandoAprovacaoWhatsApp
                    ? `⏳ Aguardando resposta do supervisor no WhatsApp... (Token: ${solicitacaoDesconto.token})`
                    : solicitacaoDesconto.status === 'Aprovada'
                    ? '✅ Desconto aprovado via WhatsApp!'
                    : solicitacaoDesconto.status === 'Rejeitada'
                    ? '❌ Desconto recusado pelo supervisor.'
                    : solicitacaoDesconto.whatsapp_enviado
                    ? `📱 WhatsApp enviado. Token: ${solicitacaoDesconto.token}`
                    : `⚠️ WhatsApp não conectado — mensagem não enviada. Use a senha do supervisor abaixo ou conecte o WhatsApp na aba WhatsApp. (Token: ${solicitacaoDesconto.token})`
                  }
                </Alert>
              )}

              {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={fecharModalDesconto}
            variant="outlined" color="error"
            disabled={verificandoSenhaDesconto || enviandoWhatsApp}
          >
            Cancelar
          </Button>
          <Tooltip title={whatsappDisponivelDesconto === false ? 'WhatsApp não configurado. Use a senha.' : ''}>
            <span>
              <Button
                variant="outlined" color="warning"
                disabled={enviandoWhatsApp || aguardandoAprovacaoWhatsApp}
                startIcon={enviandoWhatsApp ? <CircularProgress size={18} /> : <WhatsAppIcon />}
                onClick={() => solicitarAprovacaoDescontoWhatsApp(
                  infoDesconto?.percentual_solicitado || 0,
                  infoDesconto?.limite_desconto || 0
                )}
              >
                {enviandoWhatsApp ? 'Enviando...' : aguardandoAprovacaoWhatsApp ? '⏳ Aguardando WhatsApp...' : 'Pedir via WhatsApp'}
              </Button>
            </span>
          </Tooltip>
          <Button
            onClick={verificarSenhaSupervisorDesconto}
            variant="contained" color="success"
            disabled={verificandoSenhaDesconto || !senhaSupervisorDesconto.username || !senhaSupervisorDesconto.password}
            startIcon={verificandoSenhaDesconto ? <CircularProgress size={20} /> : null}
          >
            {verificandoSenhaDesconto ? 'Verificando...' : 'Autorizar Desconto'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Dados do Veículo Novo */}
      <Dialog open={openVeiculoModal} onClose={() => {}} maxWidth="md" fullWidth disableEscapeKeyDown>
        <DialogTitle>🚗 Dados do Veículo Novo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo Operação</InputLabel>
                <Select value={veiculoDadosForm.tp_op} label="Tipo Operação" onChange={e => setVeiculoDadosForm(p => ({...p, tp_op: e.target.value}))}>
                  <MenuItem value="0">0 - Outros</MenuItem>
                  <MenuItem value="1">1 - Venda Concessionária</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField fullWidth label="Chassi (17 caracteres)" value={veiculoDadosForm.chassi}
                onChange={e => setVeiculoDadosForm(p => ({...p, chassi: e.target.value.toUpperCase().slice(0,17)}))}
                inputProps={{ maxLength: 17 }} helperText={`${veiculoDadosForm.chassi.length}/17`} required />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Código Cor (DENATRAN)" value={veiculoDadosForm.c_cor}
                onChange={e => setVeiculoDadosForm(p => ({...p, c_cor: e.target.value.slice(0,4)}))} inputProps={{ maxLength: 4 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Descrição Cor" value={veiculoDadosForm.x_cor}
                onChange={e => setVeiculoDadosForm(p => ({...p, x_cor: e.target.value.slice(0,40)}))} inputProps={{ maxLength: 40 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo Pintura</InputLabel>
                <Select value={veiculoDadosForm.tp_pint} label="Tipo Pintura" onChange={e => setVeiculoDadosForm(p => ({...p, tp_pint: e.target.value}))}>
                  <MenuItem value="S">S - Sólida</MenuItem>
                  <MenuItem value="M">M - Metálica</MenuItem>
                  <MenuItem value="P">P - Perolizada</MenuItem>
                  <MenuItem value="F">F - Fosca</MenuItem>
                  <MenuItem value="A">A - Acetinada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Número Motor" value={veiculoDadosForm.n_motor}
                onChange={e => setVeiculoDadosForm(p => ({...p, n_motor: e.target.value.slice(0,21)}))} inputProps={{ maxLength: 21 }} required />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Número Série" value={veiculoDadosForm.n_serie}
                onChange={e => setVeiculoDadosForm(p => ({...p, n_serie: e.target.value.slice(0,9)}))} inputProps={{ maxLength: 9 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Potência (CV)" value={veiculoDadosForm.pot}
                onChange={e => setVeiculoDadosForm(p => ({...p, pot: e.target.value.slice(0,4)}))} inputProps={{ maxLength: 4 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Cilindradas (cm³)" value={veiculoDadosForm.cilin}
                onChange={e => setVeiculoDadosForm(p => ({...p, cilin: e.target.value.slice(0,4)}))} inputProps={{ maxLength: 4 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Peso Líquido (kg)" value={veiculoDadosForm.peso_l}
                onChange={e => setVeiculoDadosForm(p => ({...p, peso_l: e.target.value.slice(0,9)}))} inputProps={{ maxLength: 9 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Peso Bruto (kg)" value={veiculoDadosForm.peso_b}
                onChange={e => setVeiculoDadosForm(p => ({...p, peso_b: e.target.value.slice(0,9)}))} inputProps={{ maxLength: 9 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo Combustível</InputLabel>
                <Select value={veiculoDadosForm.tp_comb} label="Tipo Combustível" onChange={e => setVeiculoDadosForm(p => ({...p, tp_comb: e.target.value}))}>
                  <MenuItem value="01">01 - Álcool</MenuItem>
                  <MenuItem value="02">02 - Gasolina</MenuItem>
                  <MenuItem value="03">03 - Gasolina/Álcool</MenuItem>
                  <MenuItem value="16">16 - Álcool/Gasolina</MenuItem>
                  <MenuItem value="17">17 - Gas./Álc./GNV</MenuItem>
                  <MenuItem value="18">18 - Gasolina/GNV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="CMT (kg)" value={veiculoDadosForm.cmt}
                onChange={e => setVeiculoDadosForm(p => ({...p, cmt: e.target.value.slice(0,9)}))} inputProps={{ maxLength: 9 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Dist. Eixos (mm)" value={veiculoDadosForm.dist}
                onChange={e => setVeiculoDadosForm(p => ({...p, dist: e.target.value.slice(0,4)}))} inputProps={{ maxLength: 4 }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Ano Modelo" type="number" value={veiculoDadosForm.ano_mod}
                onChange={e => setVeiculoDadosForm(p => ({...p, ano_mod: e.target.value}))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Ano Fabricação" type="number" value={veiculoDadosForm.ano_fab}
                onChange={e => setVeiculoDadosForm(p => ({...p, ano_fab: e.target.value}))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo Veículo</InputLabel>
                <Select value={veiculoDadosForm.tp_veic} label="Tipo Veículo" onChange={e => setVeiculoDadosForm(p => ({...p, tp_veic: e.target.value}))}>
                  <MenuItem value="02">02 - Automóvel</MenuItem>
                  <MenuItem value="03">03 - Camioneta</MenuItem>
                  <MenuItem value="04">04 - Caminhonete</MenuItem>
                  <MenuItem value="05">05 - Moto</MenuItem>
                  <MenuItem value="06">06 - Motoneta</MenuItem>
                  <MenuItem value="07">07 - Caminhão</MenuItem>
                  <MenuItem value="10">10 - Microônibus</MenuItem>
                  <MenuItem value="12">12 - Ônibus</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Espécie</InputLabel>
                <Select value={veiculoDadosForm.esp_veic} label="Espécie" onChange={e => setVeiculoDadosForm(p => ({...p, esp_veic: e.target.value}))}>
                  <MenuItem value="01">01 - Passageiro</MenuItem>
                  <MenuItem value="02">02 - Carga</MenuItem>
                  <MenuItem value="03">03 - Misto</MenuItem>
                  <MenuItem value="04">04 - Corrida</MenuItem>
                  <MenuItem value="05">05 - Tração</MenuItem>
                  <MenuItem value="06">06 - Especial</MenuItem>
                  <MenuItem value="07">07 - Coleção</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>VIN</InputLabel>
                <Select value={veiculoDadosForm.vin} label="VIN" onChange={e => setVeiculoDadosForm(p => ({...p, vin: e.target.value}))}>
                  <MenuItem value="R">R - Normal</MenuItem>
                  <MenuItem value="N">N - Remarcado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Cond. Veículo</InputLabel>
                <Select value={veiculoDadosForm.cond_veic} label="Cond. Veículo" onChange={e => setVeiculoDadosForm(p => ({...p, cond_veic: e.target.value}))}>
                  <MenuItem value="1">1 - Acabado</MenuItem>
                  <MenuItem value="2">2 - Inacabado</MenuItem>
                  <MenuItem value="3">3 - Semi-Acabado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Código Modelo DENATRAN" value={veiculoDadosForm.c_mod}
                onChange={e => setVeiculoDadosForm(p => ({...p, c_mod: e.target.value.slice(0,6)}))} inputProps={{ maxLength: 6 }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Cor DENATRAN" value={veiculoDadosForm.c_cor_denatran}
                onChange={e => setVeiculoDadosForm(p => ({...p, c_cor_denatran: e.target.value.slice(0,2)}))} inputProps={{ maxLength: 2 }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Lotação" type="number" value={veiculoDadosForm.lota}
                onChange={e => setVeiculoDadosForm(p => ({...p, lota: e.target.value}))} />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Restrição</InputLabel>
                <Select value={veiculoDadosForm.tp_rest} label="Restrição" onChange={e => setVeiculoDadosForm(p => ({...p, tp_rest: e.target.value}))}>
                  <MenuItem value="0">0 - Não há</MenuItem>
                  <MenuItem value="1">1 - Alienação Fiduciária</MenuItem>
                  <MenuItem value="2">2 - Arrendamento Mercantil</MenuItem>
                  <MenuItem value="3">3 - Reserva de Domínio</MenuItem>
                  <MenuItem value="4">4 - Penhor de Veículos</MenuItem>
                  <MenuItem value="9">9 - Outras</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVeiculoModal(false)} color="inherit">Fechar</Button>
          <Button
            variant="contained"
            onClick={() => {
              // Salvar dados no item correspondente
              setVenda(prev => ({
                ...prev,
                itens: prev.itens.map(it =>
                  it.id === veiculoItemId ? { ...it, veiculo_dados: { ...veiculoDadosForm } } : it
                )
              }));
              setOpenVeiculoModal(false);
            }}
          >
            Confirmar Dados do Veículo
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====== CALCULADORA DE REVESTIMENTO ====== */}
      {produtoParaCalculadora && (
        <CalculadoraRevestimento
          open={calcRevestimentoAberto}
          produto={produtoParaCalculadora}
          onClose={() => {
            setCalcRevestimentoAberto(false);
            setProdutoParaCalculadora(null);
          }}
          onCalculado={({ produto: prod, quantidade, qtd_caixas, area_m2, metragem_caixa, obs }) => {
            const operacaoSelecionada = operacoes.find(op =>
              String(op.id_operacao) === String(venda.id_operacao)
            );
            const depositoBaixaId = operacaoSelecionada?.id_deposito_baixa;
            let preco = 0;
            if (depositoBaixaId && prod.estoque_por_deposito) {
              const est = prod.estoque_por_deposito.find(e => Number(e.id_deposito) === Number(depositoBaixaId));
              preco = est ? parseFloat(est.valor_venda || 0) : 0;
            }
            if (!preco) preco = parseFloat(prod.valor_venda || prod.preco_venda || 0);

            efetivarAdicaoItem({
              id_produto: String(prod.id_produto),
              quantidade,
              valor_unitario: preco,
              desconto: 0,
              qtd_caixas,
              area_m2,
              metragem_caixa,
              obs
            }, prod);

            setCalcRevestimentoAberto(false);
            setProdutoParaCalculadora(null);

            // Sugerir produto pai se existir (passando a área calculada)
            const temPai = prod.id_produto_pai || prod.produto_pai;
            if (temPai) {
              sugerirProdutoPai(prod, area_m2);
            }
          }}
        />
      )}

      {/* ====== CALCULADORA DE TINTA ====== */}
      {produtoParaCalculadora && (
        <CalculadoraTinta
          open={calcTintaAberto}
          produto={produtoParaCalculadora}
          onClose={() => {
            setCalcTintaAberto(false);
            setProdutoParaCalculadora(null);
          }}
          onCalculado={({ produto: prod, quantidade, obs }) => {
            const operacaoSelecionada = operacoes.find(op =>
              String(op.id_operacao) === String(venda.id_operacao)
            );
            const depositoBaixaId = operacaoSelecionada?.id_deposito_baixa;
            let preco = 0;
            if (depositoBaixaId && prod.estoque_por_deposito) {
              const est = prod.estoque_por_deposito.find(e => Number(e.id_deposito) === Number(depositoBaixaId));
              preco = est ? parseFloat(est.valor_venda || 0) : 0;
            }
            if (!preco) preco = parseFloat(prod.valor_venda || prod.preco_venda || 0);

            efetivarAdicaoItem({
              id_produto: String(prod.id_produto),
              quantidade,
              valor_unitario: preco,
              desconto: 0,
              obs
            }, prod);

            setCalcTintaAberto(false);
            setProdutoParaCalculadora(null);

            // Sugerir produto pai se existir
            const temPai = prod.id_produto_pai || prod.produto_pai;
            if (temPai) {
              sugerirProdutoPai(prod);
            }
          }}
        />
      )}

      {/* ====== MODAL SUGESTÃO PRODUTOS COMPLEMENTARES ====== */}
      <Dialog
        open={produtoPaiOpcionalModal}
        onClose={() => setProdutoPaiOpcionalModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          🔗 {produtoPaiOpcionalData.length > 1 ? 'Produtos Complementares Disponíveis' : 'Produto Complementar Disponível'}
        </DialogTitle>
        <DialogContent>
          {produtoPaiOpcionalData.length > 0 && (() => {
            const operacaoSelecionada = operacoes.find(op =>
              String(op.id_operacao) === String(venda.id_operacao)
            );
            const depositoBaixaId = operacaoSelecionada?.id_deposito_baixa;
            const nomeFilho = produtoFilhoOrigem?.nome_produto || produtoFilhoOrigem?.nome || '';

            const getPreco = (prod) => {
              let preco = 0;
              if (depositoBaixaId && prod.estoque_por_deposito) {
                const est = prod.estoque_por_deposito.find(e => Number(e.id_deposito) === Number(depositoBaixaId));
                preco = est ? parseFloat(est.valor_venda || 0) : 0;
              }
              if (!preco) preco = parseFloat(prod.valor_venda || prod.preco_venda || 0);
              return preco;
            };

            const fecharModal = () => {
              setProdutoPaiOpcionalModal(false);
              setProdutoPaiOpcionalData([]);
              setProdutoFilhoOrigem(null);
              setAreaProdutoFilho(0);
              setQtdSugeridaPai({});
            };

            return (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  O produto <strong>{nomeFilho}</strong> possui {produtoPaiOpcionalData.length > 1 ? `${produtoPaiOpcionalData.length} produtos complementares vinculados` : 'um produto complementar vinculado'}. Deseja adicioná-{produtoPaiOpcionalData.length > 1 ? 'los' : 'lo'}?
                </Alert>

                {produtoPaiOpcionalData.map((prodComp, idx) => {
                  const preco = getPreco(prodComp);
                  const estoque = prodComp.estoque_total || 0;
                  const nome = prodComp.nome_produto || prodComp.nome;
                  const codigo = prodComp.codigo_produto || prodComp.codigo || '';
                  const rendimento = parseFloat(prodComp.rendimento_m2 || 0);
                  const unidade = prodComp.unidade_medida || 'un';
                  const qtd = qtdSugeridaPai[prodComp.id_produto] || 1;

                  return (
                    <Box
                      key={prodComp.id_produto}
                      sx={{
                        p: 2,
                        mb: idx < produtoPaiOpcionalData.length - 1 ? 2 : 0,
                        border: '2px solid',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        backgroundColor: 'primary.50'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {codigo ? `${codigo} — ` : ''}{nome}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Estoque: {estoque} {unidade} · R$ {preco.toFixed(2)}
                          </Typography>
                          {prodComp.marca && (
                            <Typography variant="caption" color="text.secondary">
                              Marca: {prodComp.marca}
                            </Typography>
                          )}
                          {rendimento > 0 && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Rendimento: {rendimento} m²/{unidade}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Cálculo automático baseado na área */}
                      {areaProdutoFilho > 0 && (() => {
                        const consumoArg = parseFloat(prodComp.consumo_argamassa_m2 || 0);
                        const pesoSacoArg = parseFloat(prodComp.peso_saco_argamassa || 0);
                        if (consumoArg > 0 && pesoSacoArg > 0) {
                          const sacos = Math.ceil(areaProdutoFilho * consumoArg / pesoSacoArg);
                          return (
                            <Alert severity="success" sx={{ mb: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                🧮 {areaProdutoFilho.toFixed(2)} m² × {consumoArg} kg/m² ÷ {pesoSacoArg} kg/saco = {sacos} saco(s)
                              </Typography>
                            </Alert>
                          );
                        } else if (rendimento > 0) {
                          return (
                            <Alert severity="success" sx={{ mb: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                🧮 {areaProdutoFilho.toFixed(2)} m² ÷ {rendimento} m²/{unidade} = {Math.ceil(areaProdutoFilho / rendimento)} {unidade}
                              </Typography>
                            </Alert>
                          );
                        }
                        return null;
                      })()}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                        <TextField
                          label="Qtd"
                          type="number"
                          size="small"
                          value={qtd}
                          onChange={(e) => setQtdSugeridaPai(prev => ({
                            ...prev,
                            [prodComp.id_produto]: Math.max(1, parseInt(e.target.value) || 1)
                          }))}
                          inputProps={{ min: 1, step: 1 }}
                          sx={{ width: 100 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Total: R$ {(preco * qtd).toFixed(2)}
                        </Typography>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => {
                            efetivarAdicaoItem({
                              id_produto: String(prodComp.id_produto),
                              quantidade: qtd,
                              valor_unitario: preco,
                              desconto: 0
                            }, prodComp);
                            // Remove o produto adicionado da lista; fecha modal se não restar nenhum
                            const restantes = produtoPaiOpcionalData.filter(p => p.id_produto !== prodComp.id_produto);
                            if (restantes.length === 0) {
                              fecharModal();
                            } else {
                              setProdutoPaiOpcionalData(restantes);
                            }
                          }}
                        >
                          + Adicionar
                        </Button>
                      </Box>
                    </Box>
                  );
                })}

                {/* Botão Adicionar Todos (quando mais de 1 produto) */}
                {produtoPaiOpcionalData.length > 1 && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        produtoPaiOpcionalData.forEach((prodComp) => {
                          const preco = getPreco(prodComp);
                          const qtd = qtdSugeridaPai[prodComp.id_produto] || 1;
                          efetivarAdicaoItem({
                            id_produto: String(prodComp.id_produto),
                            quantidade: qtd,
                            valor_unitario: preco,
                            desconto: 0
                          }, prodComp);
                        });
                        fecharModal();
                      }}
                    >
                      + Adicionar Todos ({produtoPaiOpcionalData.length})
                    </Button>
                  </Box>
                )}
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setProdutoPaiOpcionalModal(false);
            setProdutoPaiOpcionalData([]);
            setProdutoFilhoOrigem(null);
            setAreaProdutoFilho(0);
            setQtdSugeridaPai({});
          }}>
            Não, obrigado
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====== MODAL SUGESTÃO DE VARIAÇÕES ====== */}
      <Dialog
        open={variacoesModal}
        onClose={() => setVariacoesModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          🔗 Variações Disponíveis
          <Typography variant="body2" color="text.secondary">
            {produtoPaiSelecionado?.nome_produto || produtoPaiSelecionado?.nome} — outras variações disponíveis
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Você selecionou uma variação de produto. Deseja também adicionar outras variações?
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {variacoesDisponiveis.map(v => {
              const operacaoSelecionada = operacoes.find(op =>
                String(op.id_operacao) === String(venda.id_operacao)
              );
              const depositoBaixaId = operacaoSelecionada?.id_deposito_baixa;
              let preco = 0;
              if (depositoBaixaId && v.estoque_por_deposito) {
                const est = v.estoque_por_deposito.find(e => Number(e.id_deposito) === Number(depositoBaixaId));
                preco = est ? parseFloat(est.valor_venda || 0) : 0;
              }
              if (!preco) preco = parseFloat(v.valor_venda || v.preco_venda || 0);

              const estoque = v.estoque_total || 0;

              return (
                <Box
                  key={v.id_produto}
                  sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {v.codigo_produto} — {v.variacao || v.nome_produto || v.nome}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Estoque: {estoque} {v.unidade_medida || 'un'} · R$ {preco.toFixed(2)}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      efetivarAdicaoItem({
                        id_produto: String(v.id_produto),
                        quantidade: 1,
                        valor_unitario: preco,
                        desconto: 0
                      }, v);
                    }}
                  >
                    + Adicionar
                  </Button>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVariacoesModal(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Seleção de Lote */}
      <Dialog
        open={openSelecionarLote}
        onClose={() => {
          setOpenSelecionarLote(false);
          setLotesDisponiveis([]);
          // Cancelar limpa produto selecionado pois não pode adicionar sem lote
          setNovoItem(prev => ({ ...prev, id_produto: '', valor_unitario: 0 }));
          setControlaProdutoLote(false);
          setLotePreSelecionado(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Selecionar Lote</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Escolha o lote para este produto:
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nº Lote</TableCell>
                <TableCell>Fabricação</TableCell>
                <TableCell>Validade</TableCell>
                <TableCell align="right">Qtd Disponível</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {lotesDisponiveis.map((lote) => (
                <TableRow key={lote.id_lote} hover>
                  <TableCell>{lote.numero_lote}</TableCell>
                  <TableCell>{lote.data_fabricacao ? new Date(lote.data_fabricacao + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</TableCell>
                  <TableCell>{lote.data_validade ? new Date(lote.data_validade + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</TableCell>
                  <TableCell align="right">{parseFloat(lote.quantidade).toFixed(3)}</TableCell>
                  <TableCell>
                    <Button size="small" variant="contained" onClick={() => confirmarLoteSelecionado(lote)}>
                      Selecionar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenSelecionarLote(false);
            setLotesDisponiveis([]);
            setNovoItem(prev => ({ ...prev, id_produto: '', valor_unitario: 0 }));
            setControlaProdutoLote(false);
            setLotePreSelecionado(null);
          }}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Vendas;