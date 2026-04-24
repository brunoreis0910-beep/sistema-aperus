import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Build as BuildIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  ReceiptLong as ReceiptLongIcon,
  Receipt as ReceiptIcon,
  CameraAlt as CameraAltIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Share as ShareIcon,
  WhatsApp as WhatsAppIcon,
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
  DeleteForever as DeleteForeverIcon,
  Gesture as GestureIcon,
  PersonPin as PersonPinIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINT } from '../config/api';
import { getAPIAtiva } from '../config/apiVeiculos';
import {
  salvarFotoOS, listarFotosOS, removerFotoOS,
  migrarFotosOS, salvarOSPendente, listarOSPendentes,
  removerOSPendente, contarOSPendentes
} from '../utils/osOfflineDB';
import DashboardBIOS from './DashboardBIOS';

const OrdemServicoPage = () => {
  const { user, permissions, isLoading: authLoading, axiosInstance } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [abaPrincipal, setAbaPrincipal] = useState(0);

  // Lista de Ordens de Serviço
  const [ordens, setOrdens] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [ordemAtual, setOrdemAtual] = useState(null);

  // Dados da Ordem de Serviço
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [dataDocumento, setDataDocumento] = useState(new Date().toISOString().split('T')[0]);
  const [operacao, setOperacao] = useState('');
  const [cliente, setCliente] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [ocorrencia, setOcorrencia] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [descontoProdutos, setDescontoProdutos] = useState(0);
  const [tipoDescontoProdutos, setTipoDescontoProdutos] = useState('valor'); // 'valor' ou 'porcentagem'
  const [descontoServicos, setDescontoServicos] = useState(0);
  const [tipoDescontoServicos, setTipoDescontoServicos] = useState('valor'); // 'valor' ou 'porcentagem'
  const [tipoAtendimento, setTipoAtendimento] = useState(() => {
    // Carrega o último tipo de atendimento usado do localStorage
    const tipoSalvo = localStorage.getItem('ultimo_tipo_atendimento');
    return tipoSalvo || 'equipamento';
  });
  const [status, setStatus] = useState(''); // ID do status da ordem de serviço
  const [statusAnterior, setStatusAnterior] = useState(''); // Para guardar o status antes da mudança
  const [openFinanceiroDialog, setOpenFinanceiroDialog] = useState(false); // Dialog de confirmação de financeiro

  // Dados do Veículo/Animal/Equipamento
  const [veiculoAnimalEquipamento, setVeiculoAnimalEquipamento] = useState(null);
  const [openCadastroModal, setOpenCadastroModal] = useState(false);
  const [tipoCadastro, setTipoCadastro] = useState('');

  // Lista de veículos/animais/equipamentos do cliente
  const [listaVeiculosCliente, setListaVeiculosCliente] = useState([]);
  const [openListaModal, setOpenListaModal] = useState(false);

  // Busca de veículo por placa
  const [buscandoPlaca, setBuscandoPlaca] = useState(false);

  // Modal de Emissão de NFe
  const [openNFeDialog, setOpenNFeDialog] = useState(false);
  const [selectedNFeOperation, setSelectedNFeOperation] = useState('');
  const [currentOrderForNFe, setCurrentOrderForNFe] = useState(null);

  // Dados do cadastro
  const [dadosCadastro, setDadosCadastro] = useState({
    id_cliente: '', // Adicionar cliente ao cadastro
    // Veículo
    placa: '',
    marca: '',
    modelo: '',
    ano: '',
    cor: '',
    // Campos extras para oficina
    tipo_veiculo: '',
    combustivel: '',
    km_entrada: '',
    km_saida: '',
    chassi: '',
    motor: '',
    // Animal
    nome: '',
    especie: '',
    raca: '',
    idade: '',
    // Equipamento
    descricao: '',
    fabricante: '',
    numeroSerie: '',
    patrimonio: ''
  });

  // Checklist de inspeção visual para oficina (quando tipoAtendimento === 'veiculo')
  const checklistItens = [
    { key: 'nivel_combustivel', label: 'Nível de Combustível' },
    { key: 'nivel_oleo', label: 'Nível do Óleo do Motor' },
    { key: 'nivel_agua', label: 'Nível da Água / Radiador' },
    { key: 'freios', label: 'Freios' },
    { key: 'pneus', label: 'Pneus' },
    { key: 'lataria', label: 'Lataria / Pintura' },
    { key: 'vidros', label: 'Vidros / Para-brisa' },
    { key: 'luzes', label: 'Luzes (Faróis / Lanternas)' },
    { key: 'ar_condicionado', label: 'Ar Condicionado' },
    { key: 'estepe', label: 'Estepe / Macaco / Chave' },
    { key: 'extintor', label: 'Extintor / Triângulo' },
    { key: 'documentos', label: 'Documentos no Veículo' },
  ];
  const checklistVazio = () => Object.fromEntries(checklistItens.map(i => [i.key, 'NA']));
  const [checklistVeiculo, setChecklistVeiculo] = useState(checklistVazio);
  const [observacoesEntrada, setObservacoesEntrada] = useState('');

  // Itens (Produtos/Serviços)
  const [itens, setItens] = useState([]);
  const [itemAtual, setItemAtual] = useState({
    tipo_item: 'produto', // produto ou servico
    id_produto: null,
    descricao: '',
    quantidade: 1,
    valorUnitario: 0,
    desconto: 0,
    valorTotal: 0
  });

  // Dados para dropdowns
  const [operacoes, setOperacoes] = useState([]);
  const [todasOperacoes, setTodasOperacoes] = useState([]); // Todas as operações (para NFe)
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);

  // Dados de pagamento - suporte a múltiplas formas
  const [formasPagamentoSelecionadas, setFormasPagamentoSelecionadas] = useState([]);
  const [formaPagamentoTemp, setFormaPagamentoTemp] = useState('');
  const [valorPagamentoTemp, setValorPagamentoTemp] = useState('');
  const [parcelasTemp, setParcelasTemp] = useState(1);
  const [openPagamentoDialog, setOpenPagamentoDialog] = useState(false);

  // Controle de bloqueio de edição
  const [osBloqueadaParaEdicao, setOsBloqueadaParaEdicao] = useState(false);

  // Tab atual
  const [tabAtual, setTabAtual] = useState(0);

  // ── Fotos da OS ──────────────────────────────────────────────────────────────
  const [fotosOS, setFotosOS] = useState([]);          // { fotoId, base64, nomeArquivo, dataCriacao }
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const inputFotoRef = useRef(null);
  // Chave usada no IndexedDB: id_os real ou temporária
  const [chaveOSFotos, setChaveOSFotos] = useState('');

  // ── Assinatura Digital ────────────────────────────────────────────────────────
  const [assinaturaBase64, setAssinaturaBase64] = useState('');
  const [nomeAssinante, setNomeAssinante] = useState('');
  const assinaturaCanvasRef = useRef(null);
  const desenhando = useRef(false);

  // ── Offline ───────────────────────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [osPendentes, setOsPendentes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState('abertas'); // 'todos', 'abertas', 'fechadas'
  const [filtroPeriodo, setFiltroPeriodo] = useState(10); // dias (10 ou 12)
  const [pesquisa, setPesquisa] = useState('');

  // Estados para modal de atraso
  const [openAtrasoModal, setOpenAtrasoModal] = useState(false);
  const [atrasoInfo, setAtrasoInfo] = useState(null);
  const [acaoAtrasoAtual, setAcaoAtrasoAtual] = useState('alertar');

  // Estados para modal de limite de crédito
  const [openLimiteModal, setOpenLimiteModal] = useState(false);
  const [limiteInfo, setLimiteInfo] = useState(null);
  const [acaoLimiteAtual, setAcaoLimiteAtual] = useState('nao_validar');

  // Estados para modal de estoque
  const [openEstoqueModal, setOpenEstoqueModal] = useState(false);
  const [estoqueInfo, setEstoqueInfo] = useState(null);
  const [acaoEstoqueAtual, setAcaoEstoqueAtual] = useState('nao_validar');
  const [itemPendenteEstoque, setItemPendenteEstoque] = useState(null);
  const [configImpressao, setConfigImpressao] = useState({ tipo_impressora: 'a4', largura_termica: '80mm', observacao_rodape: '', copias: 1 });

  // ── Listeners de rede e contagem de pendentes ───────────────────────────────
  useEffect(() => {
    const aoFicarOnline = () => {
      setIsOnline(true);
      sincronizarOSPendentes();
    };
    const aoFicarOffline = () => setIsOnline(false);
    window.addEventListener('online', aoFicarOnline);
    window.addEventListener('offline', aoFicarOffline);
    contarOSPendentes().then(setOsPendentes);
    return () => {
      window.removeEventListener('online', aoFicarOnline);
      window.removeEventListener('offline', aoFicarOffline);
    };
  }, []);

  // Desenha assinatura salva no canvas quando a aba de assinatura é aberta
  useEffect(() => {
    if (tabAtual === 4 && assinaturaBase64 && assinaturaCanvasRef.current) {
      const canvas = assinaturaCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = assinaturaBase64;
    }
  }, [tabAtual, assinaturaBase64]);

  useEffect(() => {
    carregarOrdens();
    carregarDadosIniciais();
    carregarStatus();
    carregarFormasPagamento();
    // Carregar configuração de impressão do módulo ordem_servico
    if (axiosInstance) {
      axiosInstance.get('/configuracao-impressao/modulo/ordem_servico/')
        .then(res => setConfigImpressao(res.data))
        .catch(() => {});
    }
  }, []);

  // Salva o tipo de atendimento no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('ultimo_tipo_atendimento', tipoAtendimento);
  }, [tipoAtendimento]);

  useEffect(() => {
    console.log('📊 Estado do modal de cadastro:', { openCadastroModal, tipoCadastro });
  }, [openCadastroModal, tipoCadastro]);

  const getToken = () => {
    return sessionStorage.getItem('accessToken') || sessionStorage.getItem('token');
  };

  const listarTodosVeiculos = () => {
    console.log('📋 === LISTANDO TODOS OS VEÍCULOS ===');
    const todosVeiculos = [];

    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);
      if (chave && chave.startsWith('veiculos_cliente_')) {
        const dados = localStorage.getItem(chave);
        if (dados) {
          try {
            const lista = JSON.parse(dados);
            const veiculos = lista.filter(v => v.tipo === 'veiculo');
            todosVeiculos.push(...veiculos);
            console.log(`📦 ${chave}:`, veiculos);
          } catch (err) {
            console.error('❌ Erro ao ler:', chave, err);
          }
        }
      }
    }

    console.log('🚗 TOTAL:', todosVeiculos.length, 'veículos');
    console.table(todosVeiculos);

    setSuccess(`📋 ${todosVeiculos.length} veículo(s) encontrado(s). Veja o console!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const carregarDadosIniciais = async () => {
    try {
      // Carregar operações (apenas com modelo_documento = 'Servico')
      const resOp = await axiosInstance.get('/operacoes/');
      const dadosOperacoes = Array.isArray(resOp.data) ? resOp.data : resOp.data.results || [];
      console.log('📦 Todas as Operações carregadas:', dadosOperacoes.length, dadosOperacoes);
      setTodasOperacoes(dadosOperacoes);

      const operacoesServico = dadosOperacoes.filter(op => op.modelo_documento === 'Servico');
      console.log('🔧 Operações filtradas (Servico):', operacoesServico.length, operacoesServico);
      setOperacoes(operacoesServico);

      // Carregar clientes
      const resCli = await axiosInstance.get('/clientes/');
      setClientes(Array.isArray(resCli.data) ? resCli.data : resCli.data.results || []);

      // Carregar técnicos (para o campo vendedor/técnico)
      const resTec = await axiosInstance.get('/tecnicos/');
      const tecnicosCarregados = Array.isArray(resTec.data) ? resTec.data : resTec.data.results || [];
      console.log('👷 Técnicos carregados:', tecnicosCarregados.length, tecnicosCarregados);
      setVendedores(tecnicosCarregados);

      // Carregar produtos
      const resProd = await axiosInstance.get('/produtos/');
      const produtosCarregados = Array.isArray(resProd.data) ? resProd.data : resProd.data.results || [];
      console.log('📦 Produtos carregados:', produtosCarregados.length, produtosCarregados);
      setProdutos(produtosCarregados);

    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err);
    }
  };

  const buscarProximoNumero = async (idOperacao) => {
    try {
      const resOp = await axiosInstance.get(`/operacoes/${idOperacao}/`);

      if (resOp.data.usa_auto_numeracao) {
        const proximoNumero = resOp.data.proximo_numero_nf || 1;
        setNumeroDocumento(String(proximoNumero));
        console.log('✅ Próximo número da operação:', proximoNumero);
      }
    } catch (err) {
      console.error('Erro ao buscar próximo número:', err);
    }
  };

  const handleOperacaoChange = (idOp) => {
    setOperacao(idOp);
    if (idOp) {
      buscarProximoNumero(idOp);
    }
  };

  const handleClienteChange = async (idCliente) => {
    setCliente(idCliente);

    if (idCliente) {
      // Buscar veículos/animais/equipamentos do cliente
      await buscarVeiculosCliente(idCliente);

      const operacaoSelecionada = operacoes.find(op => op.id_operacao === operacao);

      // VALIDAR LIMITE DE CRÉDITO
      const validacaoLimite = operacaoSelecionada?.validacao_limite_credito || 'nao_validar';
      if (validacaoLimite !== 'nao_validar' && operacaoSelecionada?.gera_financeiro && operacao) {
        try {
          const limiteResponse = await axiosInstance.get(`/clientes/${idCliente}/limite_credito/`);
          const limiteData = limiteResponse.data;

          if (limiteData.limiteDisponivel < 0) {
            setLimiteInfo(limiteData);
            setAcaoLimiteAtual(validacaoLimite);

            if (validacaoLimite === 'bloquear') {
              setError('❌ Cliente sem limite de crédito disponível. Operação bloqueada.');
              setCliente('');
              setListaVeiculosCliente([]);
              return;
            } else if (validacaoLimite === 'alertar' || validacaoLimite === 'solicitar_senha') {
              setOpenLimiteModal(true);
              if (validacaoLimite === 'bloquear') {
                setCliente('');
                setListaVeiculosCliente([]);
                return;
              }
            }
          }
        } catch (err) {
          console.error('Erro ao validar limite:', err);
        }
      }

      // VALIDAR ATRASO DO CLIENTE
      const validarAtraso = operacaoSelecionada?.validar_atraso || false;
      const diasTolerancia = operacaoSelecionada?.dias_atraso_tolerancia || 0;
      const acaoAtraso = operacaoSelecionada?.acao_atraso || 'alertar';

      if (validarAtraso && operacao) {
        try {
          console.log('⏰ Verificando atraso do cliente na OS...', { diasTolerancia, acaoAtraso });
          const atrasoResponse = await axiosInstance.post('/validar-cliente-atraso/', {
            id_cliente: idCliente,
            dias_tolerancia: diasTolerancia
          });

          if (atrasoResponse.data.em_atraso &&
            atrasoResponse.data.valor_total_atraso > 0 &&
            atrasoResponse.data.qtd_titulos > 0) {
            setAtrasoInfo(atrasoResponse.data);
            setAcaoAtrasoAtual(acaoAtraso);
            setOpenAtrasoModal(true);

            if (acaoAtraso === 'bloquear') {
              setCliente('');
              setListaVeiculosCliente([]);
              return;
            }
          }
        } catch (err) {
          console.error('Erro ao verificar atraso:', err);
        }
      }
    } else {
      setListaVeiculosCliente([]);
    }
  };

  const handleStatusChange = async (e) => {
    const novoStatusId = e.target.value;

    // Buscar informações do status selecionado
    const statusSelecionado = statusList.find(s => s.id_status === novoStatusId);

    if (!statusSelecionado) {
      setStatus(novoStatusId);
      return;
    }

    console.log('📊 Status selecionado:', statusSelecionado);

    // Verificar se status gera financeiro
    if (statusSelecionado.gera_financeiro) {
      // Verificar se operação também está configurada para gerar financeiro
      const operacaoAtual = operacoes.find(op => op.id_operacao === operacao);

      console.log('💰 Status gera financeiro!', {
        statusGeraFinanceiro: statusSelecionado.gera_financeiro,
        operacaoGeraFinanceiro: operacaoAtual?.gera_financeiro,
        operacaoAtual
      });

      if (operacaoAtual && operacaoAtual.gera_financeiro) {
        // Guardar status anterior e novo status
        setStatusAnterior(status);
        setStatus(novoStatusId);

        // Abrir dialog de seleção de forma de pagamento
        setOpenPagamentoDialog(true);
        return;
      }
    }

    // Se não gera financeiro, apenas atualizar o status
    setStatus(novoStatusId);

    // Se estiver editando, atualizar no servidor
    if (modoEdicao && ordemAtual) {
      await atualizarStatusOS(ordemAtual.id_os, novoStatusId);
    }
  };

  const atualizarStatusOS = async (idOS, idStatus) => {
    try {
      await axiosInstance.patch(`/ordem-servico/${idOS}/`, { id_status: idStatus });

      console.log('✅ Status atualizado');
      setSuccess('Status atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      await carregarOrdens(); // Recarregar lista
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      setError('Erro ao atualizar status da OS');
    }
  };

  const buscarVeiculosCliente = async (idCliente) => {
    try {
      // Buscar no localStorage
      const chave = `veiculos_cliente_${idCliente}`;
      const dadosArmazenados = localStorage.getItem(chave);
      let lista = dadosArmazenados ? JSON.parse(dadosArmazenados) : [];
      console.log('✅ Carregados', lista.length, 'itens do localStorage');

      // Buscar também no banco de dados
      try {
        const response = await axiosInstance.get('/veiculos/', { params: { id_cliente: idCliente } });
        const veiculosBackend = (Array.isArray(response.data) ? response.data : response.data.results || [])
          .map(v => ({
            id: v.id_veiculo,
            id_veiculo: v.id_veiculo,
            tipo: 'veiculo',
            id_cliente: idCliente,
            placa: v.placa || '',
            marca: v.marca || '',
            modelo: v.modelo || '',
            ano: v.ano ? String(v.ano) : '',
            cor: v.cor || '',
            chassi: v.chassi || '',
          }));

        // Adicionar veículos do banco que não estão no localStorage
        const placasLocal = new Set(lista.map(v => v.placa?.toUpperCase().replace(/[^A-Z0-9]/g, '')));
        const novosDoBackend = veiculosBackend.filter(
          v => !placasLocal.has(v.placa?.toUpperCase().replace(/[^A-Z0-9]/g, ''))
        );
        lista = [...lista, ...novosDoBackend];
        console.log('✅ Veículos do banco:', veiculosBackend.length, '| Novos adicionados:', novosDoBackend.length);
      } catch (apiErr) {
        console.error('⚠️ Erro ao buscar veículos do banco:', apiErr.message);
      }

      setListaVeiculosCliente(lista);

      // Se houver itens, mostrar modal automaticamente
      if (lista.length > 0) {
        setOpenListaModal(true);
      }
    } catch (err) {
      console.error('Erro ao buscar veículos do cliente:', err);
    }
  };

  const buscarDadosPlaca = async (placa) => {
    console.log('🔍 === INÍCIO DA BUSCA ===');
    console.log('🔍 Placa recebida:', placa);
    console.log('🔍 Tipo da placa:', typeof placa);
    console.log('🔍 Tamanho da placa:', placa?.length);

    if (!placa || placa.length < 7) {
      setError('Informe uma placa válida (mínimo 7 caracteres)');
      setTimeout(() => setError(''), 3000);
      console.log('❌ Placa inválida (muito curta)');
      return;
    }

    setBuscandoPlaca(true);
    setError('');
    setSuccess('');

    try {
      // PASSO 1: Buscar em cadastros locais e no banco de dados
      console.log('📦 PASSO 1: Buscando nos cadastros locais e no banco...');
      const todosVeiculos = [];

      // 1a) Buscar no localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);

        if (chave && chave.startsWith('veiculos_cliente_')) {
          const dados = localStorage.getItem(chave);

          if (dados) {
            try {
              const lista = JSON.parse(dados);
              const veiculos = lista.filter(v => v.tipo === 'veiculo');
              todosVeiculos.push(...veiculos);
            } catch (parseErr) {
              console.error('❌ Erro ao parsear dados:', chave, parseErr);
            }
          }
        }
      }

      // 1b) Incluir veículos já carregados do banco (listaVeiculosCliente)
      if (listaVeiculosCliente && listaVeiculosCliente.length > 0) {
        const placasJaAdicionadas = new Set(todosVeiculos.map(v => v.placa?.toUpperCase().replace(/[^A-Z0-9]/g, '')));
        const veiculosBanco = listaVeiculosCliente.filter(v =>
          v.tipo === 'veiculo' && !placasJaAdicionadas.has(v.placa?.toUpperCase().replace(/[^A-Z0-9]/g, ''))
        );
        todosVeiculos.push(...veiculosBanco);
      }

      // 1c) Buscar diretamente no banco pela placa (independente do cliente)
      try {
        const respBanco = await axiosInstance.get('/veiculos/', { params: { search: placa.trim() } });
        const veiculosBancoDireto = (Array.isArray(respBanco.data) ? respBanco.data : respBanco.data.results || []);
        const placasJa = new Set(todosVeiculos.map(v => v.placa?.toUpperCase().replace(/[^A-Z0-9]/g, '')));
        veiculosBancoDireto.forEach(v => {
          const p = v.placa?.toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (p && !placasJa.has(p)) {
            todosVeiculos.push({ tipo: 'veiculo', id_veiculo: v.id_veiculo, placa: v.placa, marca: v.marca || '', modelo: v.modelo || '', ano: v.ano ? String(v.ano) : '', cor: v.cor || '', chassi: v.chassi || '' });
          }
        });
      } catch (bancoBuscaErr) {
        console.warn('⚠️ Erro ao buscar no banco por placa:', bancoBuscaErr.message);
      }

      console.log(`📦 Total de veículos (local + banco): ${todosVeiculos.length}`);

      // Buscar nos cadastros locais/banco
      const placaBusca = placa.toUpperCase().trim();
      const veiculoLocal = todosVeiculos.find(v =>
        v.placa && v.placa.toUpperCase().replace(/[^A-Z0-9]/g, '') === placaBusca.replace(/[^A-Z0-9]/g, '')
      );

      if (veiculoLocal) {
        console.log('✅ VEÍCULO ENCONTRADO NOS CADASTROS LOCAIS/BANCO!', veiculoLocal);

        setDadosCadastro(prev => ({
          ...prev,
          ...(veiculoLocal.id_veiculo ? { id_veiculo: veiculoLocal.id_veiculo } : {}),
          placa: veiculoLocal.placa || '',
          marca: veiculoLocal.marca || '',
          modelo: veiculoLocal.modelo || '',
          ano: veiculoLocal.ano ? String(veiculoLocal.ano) : '',
          cor: veiculoLocal.cor || '',
          chassi: veiculoLocal.chassi || '',
          combustivel: veiculoLocal.combustivel || '',
          tipo_veiculo: veiculoLocal.tipo_veiculo || '',
          motor: veiculoLocal.motor || '',
        }));

        // Se encontrou no banco (tem id_veiculo), selecionar diretamente como veículo da OS
        if (veiculoLocal.id_veiculo) {
          setVeiculoAnimalEquipamento({ ...veiculoLocal, tipo: 'veiculo' });
        }

        const descricao = [veiculoLocal.marca, veiculoLocal.modelo].filter(Boolean).join(' ') || 'sem dados adicionais';
        setSuccess(`✅ Veículo encontrado! ${descricao}`);
        setTimeout(() => setSuccess(''), 4000);
        setBuscandoPlaca(false);
        return;
      }

      // PASSO 2: Buscar na API externa (Internet)
      console.log('🌐 PASSO 2: Buscando na API externa...');
      setSuccess('🌐 Buscando dados do veículo na internet...');

      try {
        // API de consulta de placas - Usando API pública brasileira
        const placaLimpa = placa.replace(/[^A-Z0-9]/g, '');
        console.log('� Placa formatada para API:', placaLimpa);

        // Tentar API 1: Placa Fipe (exemplo - você pode usar outra API)
        let dadosVeiculo = null;

        try {
          // Consultar através do backend Django (evita problemas de CORS)
          const response = await axiosInstance.get(`/veiculos/consultar-placa/${placaLimpa}/`);

          console.log('📥 Resposta do backend:', response.data);

          if (response.data) {
            dadosVeiculo = {
              marca: response.data.marca || '',
              modelo: response.data.modelo || '',
              ano: response.data.ano || response.data.ano_modelo || '',
              cor: response.data.cor || '',
              combustivel: response.data.combustivel || '',
              tipo_veiculo: response.data.tipo_veiculo || '',
              chassi: response.data.chassi || '',
              motor: response.data.motor || '',
              nao_encontrado: response.data.nao_encontrado || false,
              fonte: response.data.fonte || 'Backend',
            };
          }
        } catch (apiErr) {
          console.log('⚠️ Erro ao consultar backend:', apiErr.response?.data || apiErr.message);
        }

        if (dadosVeiculo) {
          // Preencher dados do veículo encontrado na API
          setDadosCadastro(prev => ({
            ...prev,
            placa: placaLimpa,
            marca: dadosVeiculo.marca || '',
            modelo: dadosVeiculo.modelo || '',
            ano: dadosVeiculo.ano || '',
            cor: dadosVeiculo.cor || '',
            combustivel: dadosVeiculo.combustivel || '',
            tipo_veiculo: dadosVeiculo.tipo_veiculo || '',
            chassi: dadosVeiculo.chassi || '',
            motor: dadosVeiculo.motor || '',
          }));

          if (dadosVeiculo.nao_encontrado) {
            setError('⚠️ Placa não encontrada nas bases públicas. Complete os dados manualmente.');
            setTimeout(() => setError(''), 5000);
          } else {
            setSuccess(`✅ Veículo encontrado! ${dadosVeiculo.marca} ${dadosVeiculo.modelo} — ${dadosVeiculo.fonte}`);
            setTimeout(() => setSuccess(''), 4000);
          }
        } else {
          setError('⚠️ Não foi possível consultar a placa. Preencha os dados manualmente.');
          setTimeout(() => setError(''), 5000);
        }

      } catch (step2Err) {
        console.error('❌ Erro no passo 2 (API externa):', step2Err);
        setError('Erro ao consultar API externa. Preencha os dados manualmente.');
        setTimeout(() => setError(''), 5000);
      }

    } catch (err) {
      console.error('❌ Erro ao buscar dados da placa:', err);
      setError('Erro ao buscar dados da placa');
      setTimeout(() => setError(''), 3000);
    } finally {
      setBuscandoPlaca(false);
      console.log('🔍 === FIM DA BUSCA ===');
    }
  };

  const abrirCadastro = (tipo) => {
    console.log('🔍 abrirCadastro chamado:', { tipo, cliente });

    if (!cliente) {
      setError('⚠️ Selecione um cliente primeiro para cadastrar veículo/animal/equipamento');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!tipo) {
      setError('⚠️ Selecione o tipo de atendimento');
      setTimeout(() => setError(''), 3000);
      return;
    }

    console.log('✅ Abrindo modal de cadastro:', tipo);

    setTipoCadastro(tipo);
    setDadosCadastro({
      id_cliente: cliente,
      placa: '',
      marca: '',
      modelo: '',
      ano: '',
      cor: '',
      tipo_veiculo: '',
      combustivel: '',
      km_entrada: '',
      km_saida: '',
      chassi: '',
      motor: '',
      nome: '',
      especie: '',
      raca: '',
      idade: '',
      descricao: '',
      fabricante: '',
      numeroSerie: '',
      patrimonio: ''
    });
    setOpenCadastroModal(true);
  };

  const salvarCadastro = async () => {
    // Validações básicas
    if (!dadosCadastro.id_cliente) {
      setError('Cliente não selecionado');
      return;
    }

    if (tipoCadastro === 'veiculo' && !dadosCadastro.placa) {
      setError('Informe a placa do veículo');
      return;
    }
    if (tipoCadastro === 'animais' && !dadosCadastro.nome) {
      setError('Informe o nome do animal');
      return;
    }
    if (tipoCadastro === 'equipamento' && !dadosCadastro.descricao) {
      setError('Informe a descrição do equipamento');
      return;
    }

    let novoItem = {
      id: Date.now(),
      tipo: tipoCadastro,
      id_cliente: dadosCadastro.id_cliente,
      ...dadosCadastro
    };

    // Se for veículo, salvar no banco de dados
    if (tipoCadastro === 'veiculo') {
      try {
        const placaLimpa = dadosCadastro.placa.replace(/[^A-Z0-9]/gi, '').toUpperCase();

        // Verificar se a placa já existe no banco
        const searchResp = await axiosInstance.get('/veiculos/', { params: { search: placaLimpa } });
        const existentes = Array.isArray(searchResp.data) ? searchResp.data : searchResp.data.results || [];
        const jaExiste = existentes.find(v => v.placa?.toUpperCase().replace(/[^A-Z0-9]/g, '') === placaLimpa);

        if (jaExiste) {
          // Reaproveitar o registro existente
          novoItem = { ...novoItem, id_veiculo: jaExiste.id_veiculo, placa: jaExiste.placa };
          console.log('✅ Veículo já cadastrado no banco, reutilizando id_veiculo:', jaExiste.id_veiculo);
        } else {
          // Criar novo registro no banco
          const postData = {
            id_cliente: dadosCadastro.id_cliente,
            placa: placaLimpa,
            marca: dadosCadastro.marca || null,
            modelo: dadosCadastro.modelo || null,
            ano: dadosCadastro.ano ? parseInt(dadosCadastro.ano) : null,
            cor: dadosCadastro.cor || null,
            chassi: dadosCadastro.chassi || null,
          };
          const resp = await axiosInstance.post('/veiculos/', postData);
          novoItem = { ...novoItem, id_veiculo: resp.data.id_veiculo, placa: placaLimpa };
          console.log('✅ Veículo salvo no banco com id_veiculo:', resp.data.id_veiculo);
        }
      } catch (apiErr) {
        console.error('⚠️ Erro ao salvar veículo no banco:', apiErr.response?.data || apiErr.message);
        // Continua salvando localmente mesmo se o backend falhar
      }
    }

    // Salvar no localStorage
    const chave = `veiculos_cliente_${dadosCadastro.id_cliente}`;
    const dadosExistentes = localStorage.getItem(chave);
    const lista = dadosExistentes ? JSON.parse(dadosExistentes) : [];
    lista.push(novoItem);
    localStorage.setItem(chave, JSON.stringify(lista));

    setVeiculoAnimalEquipamento(novoItem);
    setListaVeiculosCliente(lista);

    setOpenCadastroModal(false);
    setSuccess(`${tipoCadastro === 'veiculo' ? 'Veículo' : tipoCadastro === 'animais' ? 'Animal' : 'Equipamento'} cadastrado!`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const selecionarVeiculoDaLista = (item) => {
    setVeiculoAnimalEquipamento(item);
    setTipoAtendimento(item.tipo);
    setOpenListaModal(false);
    setSuccess('Item selecionado!');
    setTimeout(() => setSuccess(''), 1500);
  };

  const carregarStatus = async () => {
    try {
      const response = await axiosInstance.get('/status-ordem-servico/', {
        params: { apenas_ativos: true }
      });

      const statusCarregados = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      console.log('✅ Status carregados:', statusCarregados.length, statusCarregados);
      setStatusList(statusCarregados);
    } catch (err) {
      console.error('❌ Erro ao carregar status:', err);
    }
  };

  const carregarFormasPagamento = async () => {
    try {
      const response = await axiosInstance.get('/formas-pagamento/');

      const formasCarregadas = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      console.log('💳 Formas de pagamento carregadas:', formasCarregadas.length, formasCarregadas);
      setFormasPagamento(formasCarregadas);
    } catch (err) {
      console.error('❌ Erro ao carregar formas de pagamento:', err);
    }
  };

  const carregarOrdens = async () => {
    try {
      setLoading(true);

      // Buscar ordens de serviço da API
      const response = await axiosInstance.get('/ordem-servico/');

      const ordensCarregadas = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      console.log('📋 Ordens de serviço carregadas:', ordensCarregadas.length, ordensCarregadas);
      setOrdens(ordensCarregadas);
    } catch (err) {
      console.error('Erro ao carregar ordens:', err);
      setError('Erro ao carregar ordens de serviço');
    } finally {
      setLoading(false);
    }
  };

  // ─── CÂMERA / FOTOS ──────────────────────────────────────────────────────────

  const carregarFotosOS = async (chave) => {
    try {
      let fotos = [];
      // Se for id real (não temp), buscar do servidor primeiro
      if (chave && !String(chave).startsWith('temp_')) {
        try {
          const resp = await axiosInstance.get(`/os-fotos/?id_os=${chave}`);
          fotos = (resp.data?.results || resp.data || []).map(f => ({
            fotoId: `srv_${f.id_os_foto}`,
            id_os_foto: f.id_os_foto,
            base64: f.imagem_base64,
            nomeArquivo: f.nome_arquivo,
            dataCriacao: f.data_criacao,
            servidor: true,
          }));
        } catch (e) {
          console.warn('Fotos do servidor indisponíveis, usando IndexedDB:', e);
        }
      }
      // Adicionar fotos pendentes do IndexedDB (ainda não enviadas)
      const fotasLocal = await listarFotosOS(chave);
      const pendentes = fotasLocal.filter(f => !f.servidor);
      setFotosOS([...fotos, ...pendentes]);
    } catch (e) {
      console.warn('Erro ao carregar fotos:', e);
    }
  };

  const tirarFoto = async () => {
    setCarregandoFoto(true);
    try {
      // Tenta usar Capacitor Camera (Android nativo)
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const foto = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        saveToGallery: false,
      });
      const base64 = `data:image/jpeg;base64,${foto.base64String}`;
      const chave = chaveOSFotos || `temp_${Date.now()}`;
      if (!chaveOSFotos) setChaveOSFotos(chave);
      await salvarFotoOS(chave, base64, `foto_${Date.now()}.jpg`);
      await carregarFotosOS(chave);
    } catch (capacitorErr) {
      // Fallback: input file HTML (web / desktop)
      inputFotoRef.current?.click();
    } finally {
      setCarregandoFoto(false);
    }
  };

  const selecionarDaGaleria = async () => {
    setCarregandoFoto(true);
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const foto = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      const base64 = `data:image/jpeg;base64,${foto.base64String}`;
      const chave = chaveOSFotos || `temp_${Date.now()}`;
      if (!chaveOSFotos) setChaveOSFotos(chave);
      await salvarFotoOS(chave, base64, `galeria_${Date.now()}.jpg`);
      await carregarFotosOS(chave);
    } catch {
      inputFotoRef.current?.click();
    } finally {
      setCarregandoFoto(false);
    }
  };

  const aoSelecionarArquivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCarregandoFoto(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      const chave = chaveOSFotos || `temp_${Date.now()}`;
      if (!chaveOSFotos) setChaveOSFotos(chave);
      await salvarFotoOS(chave, base64, file.name);
      await carregarFotosOS(chave);
      setCarregandoFoto(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const excluirFoto = async (fotoId) => {
    if (!window.confirm('Remover esta foto?')) return;
    // Se é foto do servidor
    if (String(fotoId).startsWith('srv_')) {
      const id = String(fotoId).replace('srv_', '');
      try {
        await axiosInstance.delete(`/os-fotos/${id}/`);
      } catch (e) {
        console.warn('Erro ao excluir foto do servidor:', e);
      }
    } else {
      await removerFotoOS(fotoId);
    }
    await carregarFotosOS(chaveOSFotos);
  };

  const uploadFotosParaServidor = async (idOS) => {
    try {
      const fotasLocal = await listarFotosOS(String(idOS));
      for (const foto of fotasLocal) {
        try {
          await axiosInstance.post('/os-fotos/', {
            id_os: idOS,
            nome_arquivo: foto.nomeArquivo,
            imagem_base64: foto.base64,
          });
          await removerFotoOS(foto.fotoId);
        } catch (e) {
          console.warn('Erro ao enviar foto:', e);
        }
      }
      await carregarFotosOS(String(idOS));
    } catch (e) {
      console.warn('uploadFotosParaServidor falhou:', e);
    }
  };

  const uploadAssinaturaServidor = async (idOS) => {
    if (!assinaturaBase64) return;
    try {
      await axiosInstance.post('/os-assinaturas/', {
        id_os: idOS,
        nome_assinante: nomeAssinante,
        assinatura_base64: assinaturaBase64,
      });
    } catch (e) {
      console.warn('Erro ao salvar assinatura:', e);
    }
  };

  const carregarAssinaturaServidor = async (idOS) => {
    try {
      const resp = await axiosInstance.get(`/os-assinaturas/?id_os=${idOS}`);
      const lista = resp.data?.results || resp.data || [];
      if (lista.length > 0) {
        setAssinaturaBase64(lista[0].assinatura_base64);
        setNomeAssinante(lista[0].nome_assinante || '');
      }
    } catch (e) {
      console.warn('Assinatura indisponível:', e);
    }
  };

  // ─── COMPARTILHAR VIA WHATSAPP ────────────────────────────────────────────────

  const gerarTextoOS = () => {
    const nomeCliente = clientes.find(c => c.id_cliente === cliente)?.nome_razao_social || 'Cliente';
    const nomeStatus = statusList.find(s => s.id_status === status)?.nome_status || 'Em andamento';
    const totalProdutos = itens.filter(i => i.tipo_item === 'produto')
      .reduce((acc, i) => acc + (parseFloat(i.valorTotal ?? i.valor_total) || 0), 0);
    const totalServicos = itens.filter(i => i.tipo_item === 'servico' || i.tipo_item === 'serviço')
      .reduce((acc, i) => acc + (parseFloat(i.valorTotal ?? i.valor_total) || 0), 0);
    // Fallback: usa valor_total_os do servidor se os itens ainda não foram carregados
    const total = (totalProdutos + totalServicos) || parseFloat(ordemAtual?.valor_total_os) || 0;

    let texto = `*🔧 ORDEM DE SERVIÇO*\n`;
    if (ordemAtual?.id_os) texto += `OS-${ordemAtual.id_os}\n`;
    texto += `📅 ${new Date().toLocaleDateString('pt-BR')}\n`;
    texto += `👤 Cliente: ${nomeCliente}\n`;
    texto += `📊 Status: ${nomeStatus}\n`;
    if (observacao) texto += `📝 Problema: ${observacao}\n`;
    if (ocorrencia) texto += `🔍 Laudo: ${ocorrencia}\n`;
    if (itens.length > 0) {
      texto += `\n*Itens:*\n`;
      itens.slice(0, 10).forEach(i => {
        texto += `• ${i.descricao} (${i.quantidade}x) — R$ ${parseFloat(i.valorTotal ?? i.valor_total ?? 0).toFixed(2)}\n`;
      });
      if (itens.length > 10) texto += `_(e mais ${itens.length - 10} itens)_\n`;
    }
    texto += `\n💰 *Total: R$ ${total.toFixed(2)}*`;
    return texto;
  };

  const compartilharWhatsApp = async () => {
    const texto = gerarTextoOS();
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: `OS ${ordemAtual?.id_os ? `OS-${ordemAtual.id_os}` : 'Nova OS'}`,
        text: texto,
        dialogTitle: 'Compartilhar Ordem de Serviço',
      });
    } catch {
      // Fallback: abrir WhatsApp Web
      const encoded = encodeURIComponent(texto);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  // ─── SINCRONIZAÇÃO OFFLINE ───────────────────────────────────────────────────

  const sincronizarOSPendentes = async () => {
    if (!axiosInstance) return;
    setSincronizando(true);
    try {
      const pendentes = await listarOSPendentes();
      for (const p of pendentes) {
        try {
          if (p.dadosOrdem.id_os) {
            await axiosInstance.put(`/ordem-servico/${p.dadosOrdem.id_os}/`, p.dadosOrdem);
          } else {
            const resp = await axiosInstance.post('/ordem-servico/', p.dadosOrdem);
            if (resp.data?.id_os && p.chaveOS !== String(resp.data.id_os)) {
              await migrarFotosOS(p.chaveOS, resp.data.id_os);
            }
          }
          await removerOSPendente(p.chaveOS);
        } catch (e) {
          console.warn('Falha ao sincronizar OS pendente:', p.chaveOS, e);
        }
      }
      const restantes = await contarOSPendentes();
      setOsPendentes(restantes);
      if (pendentes.length > 0) {
        setSuccess(`✅ ${pendentes.length - restantes} OS(s) sincronizada(s) com sucesso!`);
        setTimeout(() => setSuccess(''), 4000);
        carregarOrdens();
      }
    } finally {
      setSincronizando(false);
    }
  };

  // ─── NOVA ORDEM ──────────────────────────────────────────────────────────────

  const novaOrdem = () => {
    setModoEdicao(false);
    setOrdemAtual(null);
    const novaChave = `temp_${Date.now()}`;
    setChaveOSFotos(novaChave);
    setFotosOS([]);
    limparFormulario();
    setOpenDialog(true);
  };

  const editarOrdem = (ordem) => {
    console.log('📝 Editando ordem:', ordem);

    setModoEdicao(true);
    setOrdemAtual(ordem);

    // Carregar fotos desta OS
    const chave = String(ordem.id_os);
    setChaveOSFotos(chave);
    carregarFotosOS(chave);

    // Carregar assinatura desta OS
    carregarAssinaturaServidor(ordem.id_os);

    // Verificar se a OS está com status que não permite edição
    let statusAtual = null;
    if (ordem.id_status) {
      statusAtual = statusList.find(s => s.id_status === ordem.id_status);
    } else if (ordem.status_os) {
      statusAtual = statusList.find(s => s.nome_status === ordem.status_os);
    }

    // Bloquear edição se o status gera financeiro (OS finalizada)
    const bloqueada = statusAtual && statusAtual.gera_financeiro;
    setOsBloqueadaParaEdicao(bloqueada);

    if (bloqueada) {
      console.log('🔒 OS bloqueada para edição - Status gera financeiro:', statusAtual.nome_status);
    }

    // Carregar dados da ordem de serviço
    setNumeroDocumento(ordem.id_os ? `OS-${ordem.id_os}` : '');

    // Converter data_abertura para formato YYYY-MM-DD para o input
    if (ordem.data_abertura) {
      const data = new Date(ordem.data_abertura);
      const dataFormatada = data.toISOString().split('T')[0];
      setDataDocumento(dataFormatada);
      console.log('📅 Data formatada:', dataFormatada);
    }

    setOperacao(ordem.id_operacao || '');
    setCliente(ordem.id_cliente || '');
    setVendedor(ordem.id_tecnico || '');
    setObservacao(ordem.descricao_problema || '');
    setOcorrencia(ordem.laudo_tecnico || '');
    setSolicitante(ordem.solicitante || '');

    // Usar id_status se disponível, senão buscar pelo nome do status
    if (ordem.id_status) {
      console.log('✅ Usando id_status:', ordem.id_status);
      setStatus(ordem.id_status);
    } else if (ordem.status_os && statusList.length > 0) {
      // Buscar status pelo nome
      const statusEncontrado = statusList.find(s => s.nome_status === ordem.status_os);
      if (statusEncontrado) {
        console.log(`🔄 Status "${ordem.status_os}" → ID ${statusEncontrado.id_status}`);
        setStatus(statusEncontrado.id_status);
      } else {
        console.warn(`⚠️ Status "${ordem.status_os}" não encontrado na lista`);
        setStatus(statusList[0]?.id_status || 1); // Default para ID 1 (Aberta)
      }
    } else {
      // Se statusList ainda não carregou, usar um valor temporário
      console.log('⏳ Status list ainda não carregada, usando valor padrão');
      setStatus(1); // ID 1 geralmente é "Aberta"
    }

    console.log('📋 Campos carregados:', {
      numero: ordem.id_os,
      operacao: ordem.id_operacao,
      cliente: ordem.id_cliente,
      vendedor: ordem.id_tecnico,
      observacao: ordem.descricao_problema,
      id_status: ordem.id_status,
      status_os: ordem.status_os
    });

    // Carregar itens produtos e serviços
    const itensCarregados = [];
    let proximoId = 1;

    // Carregar produtos
    if (ordem.itens_produtos && Array.isArray(ordem.itens_produtos)) {
      ordem.itens_produtos.forEach(itemProduto => {
        itensCarregados.push({
          id: proximoId++,
          tipo_item: 'produto',
          id_produto: itemProduto.id_produto,
          descricao: itemProduto.produto_nome || '',
          quantidade: parseFloat(itemProduto.quantidade) || 0,
          valorUnitario: parseFloat(itemProduto.valor_unitario) || 0,
          desconto: parseFloat(itemProduto.desconto) || 0,
          valorTotal: parseFloat(itemProduto.valor_total) || 0,
          id_os_item_produto: itemProduto.id_os_item_produto,
          custoUnitario: parseFloat(itemProduto.custo_unitario) || 0,
        });
      });
    }

    // Carregar serviços
    if (ordem.itens_servicos && Array.isArray(ordem.itens_servicos)) {
      ordem.itens_servicos.forEach(itemServico => {
        itensCarregados.push({
          id: proximoId++,
          tipo_item: 'servico',
          descricao: itemServico.descricao_servico || '',
          quantidade: parseFloat(itemServico.quantidade) || 0,
          valorUnitario: parseFloat(itemServico.valor_unitario) || 0,
          desconto: parseFloat(itemServico.desconto) || 0,
          valorTotal: parseFloat(itemServico.valor_total) || 0,
          id_tecnico_executante: itemServico.id_tecnico_executante,
          tecnico_nome: itemServico.tecnico_nome || '',
          id_os_item_servico: itemServico.id_os_item_servico,
        });
      });
    }

    setItens(itensCarregados);

    // Carregar descontos separados
    setDescontoProdutos(parseFloat(ordem.desconto_produtos) || 0);
    setTipoDescontoProdutos(ordem.tipo_desconto_produtos || 'valor');
    setDescontoServicos(parseFloat(ordem.desconto_servicos) || 0);
    setTipoDescontoServicos(ordem.tipo_desconto_servicos || 'valor');
    console.log(`📦 Itens carregados: ${itensCarregados.length} (${ordem.itens_produtos?.length || 0} produtos + ${ordem.itens_servicos?.length || 0} serviços)`, itensCarregados);

    setOpenDialog(true);
  };

  const limparFormulario = async () => {
    console.log('🧹 Limpando formulário e carregando parâmetros do usuário...');

    // Buscar parâmetros do usuário logado
    let idVendedorPadrao = '';
    let idOperacaoPadrao = '';

    try {
      const resUsuario = await axiosInstance.get('/usuarios/me/');
      console.log('✅ Dados do usuário:', resUsuario.data);
      console.log('📦 Parâmetros do usuário:', resUsuario.data.parametros);

      if (resUsuario.data.parametros) {
        // Usa id_vendedor_os e id_operacao_os (específicos para OS)
        idVendedorPadrao = resUsuario.data.parametros.id_vendedor_os ||
          resUsuario.data.parametros.id_vendedor_padrao || '';

        idOperacaoPadrao = resUsuario.data.parametros.id_operacao_os ||
          resUsuario.data.parametros.id_operacao_padrao || '';

        console.log('👤 Vendedor/Técnico padrão (OS):', idVendedorPadrao);
        console.log('⚙️ Operação padrão (OS):', idOperacaoPadrao);
      }
    } catch (err) {
      console.error('⚠️ Erro ao buscar parâmetros do usuário:', err);
    }

    setNumeroDocumento('');
    setDataDocumento(new Date().toISOString().split('T')[0]);
    setOperacao(idOperacaoPadrao);
    setOsBloqueadaParaEdicao(false);
    setCliente('');
    setVendedor(idVendedorPadrao);
    setObservacao('');
    setOcorrencia('');
    setSolicitante('');
    setDescontoProdutos(0);
    setTipoDescontoProdutos('valor');
    setDescontoServicos(0);
    setTipoDescontoServicos('valor');
    // Não reseta o tipoAtendimento - mantém o último selecionado
    // Definir status padrão (busca o que tem padrao=true)
    const statusPadrao = statusList.find(s => s.padrao);
    setStatus(statusPadrao ? statusPadrao.id_status : (statusList[0]?.id_status || ''));
    setItens([]);
    setAssinaturaBase64('');
    setNomeAssinante('');

    // Se houver operação padrão, buscar o próximo número do documento
    if (idOperacaoPadrao) {
      console.log('🔢 Buscando próximo número para operação:', idOperacaoPadrao);
      await buscarProximoNumero(idOperacaoPadrao);
    }

    console.log('✅ Formulário limpo com parâmetros aplicados!');
  };

  const adicionarItem = () => {
    if (!itemAtual.descricao) {
      setError('Informe a descrição do item');
      return;
    }

    // Se for produto (não serviço), verificar estoque se a operação exigir
    if (itemAtual.tipo_item === 'produto' && itemAtual.id_produto && operacao) {
      // Buscar o produto completo para verificar a classificação
      const produtoSelecionado = produtos.find(p => p.id_produto === itemAtual.id_produto);

      if (produtoSelecionado) {
        console.log('🔍 Produto selecionado:', produtoSelecionado);
        console.log('📋 Classificação:', produtoSelecionado.classificacao);

        // Se o produto NÃO for da classificação "Servico", validar estoque
        if (produtoSelecionado.classificacao !== 'Servico') {
          // Buscar operação selecionada para verificar se valida estoque
          const operacaoSelecionada = operacoes.find(op => op.id_operacao === operacao || op.id === operacao);

          if (operacaoSelecionada) {
            console.log('⚙️ Operação selecionada:', operacaoSelecionada);
            console.log('📊 Validar estoque:', operacaoSelecionada.validar_estoque);
            console.log('🎯 Ação estoque:', operacaoSelecionada.acao_estoque);

            // Se a operação valida estoque e tem ação configurada
            if (operacaoSelecionada.validar_estoque && operacaoSelecionada.acao_estoque && operacaoSelecionada.acao_estoque !== 'nao_validar') {
              // Calcular estoque disponível
              let estoqueDisponivel = 0;

              // Se a operação tem depósito de baixa específico
              if (operacaoSelecionada.id_deposito_baixa && produtoSelecionado.estoque_por_deposito) {
                const estoqueDeposito = produtoSelecionado.estoque_por_deposito.find(
                  est => est.id_deposito === operacaoSelecionada.id_deposito_baixa
                );
                estoqueDisponivel = parseFloat(estoqueDeposito?.quantidade_atual || estoqueDeposito?.quantidade || 0);
              } else {
                // Usar estoque total
                estoqueDisponivel = parseFloat(produtoSelecionado.estoque_total || 0);
              }

              const quantidadeSolicitada = parseFloat(itemAtual.quantidade || 0);

              console.log('📦 Estoque disponível:', estoqueDisponivel);
              console.log('📦 Quantidade solicitada:', quantidadeSolicitada);

              // Se não tem estoque suficiente
              if (estoqueDisponivel < quantidadeSolicitada) {
                const faltam = quantidadeSolicitada - estoqueDisponivel;

                if (operacaoSelecionada.acao_estoque === 'bloquear') {
                  setError(`❌ Estoque insuficiente! Disponível: ${estoqueDisponivel} | Solicitado: ${quantidadeSolicitada} | Faltam: ${faltam}`);
                  return;
                } else if (operacaoSelecionada.acao_estoque === 'alertar') {
                  const confirmar = window.confirm(
                    `⚠️ ATENÇÃO: Estoque insuficiente!\n\n` +
                    `Produto: ${produtoSelecionado.nome_produto || produtoSelecionado.descricao}\n` +
                    `Disponível: ${estoqueDisponivel}\n` +
                    `Solicitado: ${quantidadeSolicitada}\n` +
                    `Faltam: ${faltam}\n\n` +
                    `Deseja adicionar mesmo assim?`
                  );

                  if (!confirmar) {
                    return;
                  }
                }
                // Se for 'solicitar_senha', por enquanto só alerta (pode implementar modal de senha depois)
                else if (operacaoSelecionada.acao_estoque === 'solicitar_senha') {
                  const confirmar = window.confirm(
                    `⚠️ AUTORIZAÇÃO NECESSÁRIA\n\n` +
                    `Estoque insuficiente para este produto.\n` +
                    `Disponível: ${estoqueDisponivel} | Solicitado: ${quantidadeSolicitada}\n\n` +
                    `Confirmar adição?`
                  );

                  if (!confirmar) {
                    return;
                  }
                }
              }
            }
          }
        } else {
          console.log('ℹ️ Produto é classificado como Serviço - não valida estoque');
        }
      }
    }

    const subtotal = itemAtual.quantidade * itemAtual.valorUnitario;
    const desconto = parseFloat(itemAtual.desconto || 0);
    const valorTotal = subtotal - desconto;

    const novoItem = {
      ...itemAtual,
      id: Date.now(),
      desconto: desconto,
      valorTotal: valorTotal
    };

    // Proteção anti-duplicação: verifica se item semelhante foi adicionado recentemente
    const agora = Date.now();
    const existe = itens.find(it =>
      it.id_produto === novoItem.id_produto &&
      parseFloat(it.valorUnitario) === parseFloat(novoItem.valorUnitario) &&
      parseFloat(it.quantidade) === parseFloat(novoItem.quantidade) &&
      (agora - (it.id || 0)) < 2000
    );

    if (existe) {
      console.log('⚠️ OrdemServico: item possivelmente duplicado detectado; pulando adição');
    } else {
      setItens(prev => [...prev, novoItem]);
    }
    setItemAtual({
      tipo_item: 'produto',
      id_produto: null,
      descricao: '',
      quantidade: 1,
      valorUnitario: 0,
      desconto: 0,
      valorTotal: 0
    });
    setSuccess('Item adicionado');
    setTimeout(() => setSuccess(''), 2000);
  };

  const removerItem = (id) => {
    setItens(itens.filter(item => item.id !== id));
  };

  const calcularSubtotalProdutos = () => {
    return itens
      .filter(item => item.tipo_item === 'produto')
      .reduce((sum, item) => sum + (item.quantidade * item.valorUnitario), 0);
  };

  const calcularSubtotalServicos = () => {
    return itens
      .filter(item => item.tipo_item === 'servico')
      .reduce((sum, item) => sum + (item.quantidade * item.valorUnitario), 0);
  };

  const calcularDescontoRealProdutos = () => {
    const subtotal = calcularSubtotalProdutos();
    if (tipoDescontoProdutos === 'porcentagem') {
      return (subtotal * parseFloat(descontoProdutos || 0)) / 100;
    }
    return parseFloat(descontoProdutos || 0);
  };

  const calcularDescontoRealServicos = () => {
    const subtotal = calcularSubtotalServicos();
    if (tipoDescontoServicos === 'porcentagem') {
      return (subtotal * parseFloat(descontoServicos || 0)) / 100;
    }
    return parseFloat(descontoServicos || 0);
  };

  const calcularTotal = () => {
    const subtotalProdutos = calcularSubtotalProdutos();
    const subtotalServicos = calcularSubtotalServicos();
    const descontoRealProdutos = calcularDescontoRealProdutos();
    const descontoRealServicos = calcularDescontoRealServicos();
    return (subtotalProdutos - descontoRealProdutos) + (subtotalServicos - descontoRealServicos);
  };

  const calcularSubtotal = () => {
    return calcularSubtotalProdutos() + calcularSubtotalServicos();
  };

  const calcularCustoTotalProdutos = () => {
    return itens
      .filter(item => item.tipo_item === 'produto')
      .reduce((sum, item) => sum + ((item.custoUnitario || 0) * (item.quantidade || 0)), 0);
  };

  const calcularLucro = () => {
    return calcularTotal() - calcularCustoTotalProdutos();
  };

  const calcularMargem = () => {
    const total = calcularTotal();
    if (total <= 0) return 0;
    return (calcularLucro() / total) * 100;
  };

  const temDadosCusto = () => {
    return itens.some(item => item.tipo_item === 'produto' && (item.custoUnitario || 0) > 0);
  };

  // Distribui o desconto proporcionalmente nos itens conforme o usuário digita
  const distribuirDescontoProporcional = (valorDesconto, tipoDesconto, tipoItem) => {
    const itensDoTipo = itens.filter(item => item.tipo_item === tipoItem);
    if (itensDoTipo.length === 0) return;

    const subtotalDoTipo = itensDoTipo.reduce((sum, item) => {
      const valorSemDesconto = item.quantidade * item.valorUnitario;
      return sum + valorSemDesconto;
    }, 0);

    if (subtotalDoTipo === 0) return;

    const descontoReal = tipoDesconto === 'porcentagem'
      ? (subtotalDoTipo * parseFloat(valorDesconto || 0)) / 100
      : parseFloat(valorDesconto || 0);

    const itensAtualizados = itens.map(item => {
      if (item.tipo_item !== tipoItem) return item;

      const valorSemDesconto = item.quantidade * item.valorUnitario;
      const proporcao = valorSemDesconto / subtotalDoTipo;
      const descontoItem = descontoReal * proporcao;
      const valorTotal = valorSemDesconto - descontoItem;

      return {
        ...item,
        desconto: descontoItem,
        valorTotal: valorTotal
      };
    });

    setItens(itensAtualizados);
  };

  const salvarOrdem = async () => {
    try {
      // Validações
      if (!numeroDocumento) {
        setError('Informe o número do documento');
        return;
      }
      if (!cliente) {
        setError('Selecione um cliente');
        return;
      }

      setLoading(true);

      // Montar dados conforme a estrutura da tabela do banco
      const totalCalculado = calcularTotal();

      // Validar que cliente foi selecionado (obrigatório)
      if (!cliente) {
        alert('Por favor, selecione um cliente!');
        return;
      }

      // Mapear status do frontend para o formato do banco
      const reverseStatusMap = {
        'aberto': 'Aberta',
        'em_execucao': 'Em Andamento',
        'fechado': 'Finalizada',
        'cancelado': 'Cancelada'
      };

      // Separar itens em produtos e serviços
      console.log('📋 Total de itens:', itens.length, itens);

      const itensProdutos = itens
        .filter(item => item.tipo_item === 'produto')
        .map(item => ({
          id_produto: item.id_produto,
          quantidade: item.quantidade,
          valor_unitario: item.valorUnitario,
          desconto: item.desconto || 0,
          valor_total: item.valorTotal
        }));

      const itensServicos = itens
        .filter(item => item.tipo_item === 'servico')
        .map(item => ({
          descricao_servico: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valorUnitario,
          desconto: item.desconto || 0,
          valor_total: item.valorTotal,
          id_tecnico_executante: item.id_tecnico_executante || null
        }));

      console.log('📦 Itens produtos a enviar:', itensProdutos.length, itensProdutos);
      console.log('🔧 Itens serviços a enviar:', itensServicos.length, itensServicos);

      // Calcular totais separados por categoria
      const subtotalProdutos = calcularSubtotalProdutos();
      const subtotalServicos = calcularSubtotalServicos();
      const descontoRealProdutos = calcularDescontoRealProdutos();
      const descontoRealServicos = calcularDescontoRealServicos();

      // Soma dos valorTotal já com desconto aplicado em cada item
      const totalProdutos = itens
        .filter(item => item.tipo_item === 'produto')
        .reduce((sum, item) => sum + (parseFloat(item.valorTotal) || 0), 0);
      const totalServicos = itens
        .filter(item => item.tipo_item === 'servico')
        .reduce((sum, item) => sum + (parseFloat(item.valorTotal) || 0), 0);
      const totalGeral = totalProdutos + totalServicos;

      console.log('💰 Cálculos finais:', {
        subtotalProdutos,
        descontoRealProdutos,
        totalProdutos,
        subtotalServicos,
        descontoRealServicos,
        totalServicos,
        totalGeral
      });

      // Buscar informações do status selecionado
      const statusSelecionado = statusList.find(s => s.id_status === status);

      const dadosOrdem = {
        // data_abertura é gerado automaticamente pelo banco (TIMESTAMP)
        id_operacao: operacao || null,
        id_cliente: cliente,
        id_tecnico: vendedor || null,
        id_veiculo: (tipoAtendimento === 'veiculo' && veiculoAnimalEquipamento?.id_veiculo) ? veiculoAnimalEquipamento.id_veiculo : null,
        descricao_problema: observacao || '',
        laudo_tecnico: ocorrencia || '',
        solicitante: solicitante || '',
        id_status: status,  // Enviar ID do status
        status_os: statusSelecionado?.nome_status || 'Aberta',  // Manter compatibilidade com campo legado
        gera_financeiro: false,
        desconto_produtos: parseFloat(descontoProdutos) || 0,
        tipo_desconto_produtos: tipoDescontoProdutos,
        desconto_servicos: parseFloat(descontoServicos) || 0,
        tipo_desconto_servicos: tipoDescontoServicos,
        valor_desconto: descontoRealProdutos + descontoRealServicos,
        valor_total_produtos: totalProdutos,
        valor_total_servicos: totalServicos,
        valor_total_os: totalGeral,
        itens_produtos: itensProdutos,
        itens_servicos: itensServicos
      };

      // Adicionar informações do veículo/animal/equipamento na descrição
      console.log('🚗 Veículo/Animal/Equipamento:', veiculoAnimalEquipamento);

      if (veiculoAnimalEquipamento) {
        let info = '';
        if (tipoAtendimento === 'veiculo') {
          const veiculo = veiculoAnimalEquipamento;
          info = `Veículo: ${veiculo.placa || ''} - ${veiculo.marca || ''} ${veiculo.modelo || ''} ${veiculo.ano || ''}`;
          if (veiculo.combustivel) info += ` | Comb.: ${veiculo.combustivel}`;
          if (veiculo.motor) info += ` | Motor: ${veiculo.motor}`;
          if (veiculo.km_entrada) info += ` | KM Entrada: ${Number(veiculo.km_entrada).toLocaleString()} km`;
          if (veiculo.chassi) info += ` | Chassi: ${veiculo.chassi}`;
        } else if (tipoAtendimento === 'animais') {
          info = `Animal: ${veiculoAnimalEquipamento.nome || ''} - ${veiculoAnimalEquipamento.especie || ''} ${veiculoAnimalEquipamento.raca || ''}`;
        } else if (tipoAtendimento === 'equipamento') {
          info = `Equipamento: ${veiculoAnimalEquipamento.tipo || ''} - ${veiculoAnimalEquipamento.marca || ''} ${veiculoAnimalEquipamento.modelo || ''}`;
        }

        // Para veículo, incluir o checklist de inspeção no laudo técnico
        if (tipoAtendimento === 'veiculo') {
          const itensNOK = checklistItens.filter(i => checklistVeiculo[i.key] === 'NOK').map(i => i.label);
          const itensOK = checklistItens.filter(i => checklistVeiculo[i.key] === 'OK').map(i => i.label);
          let fichaInspacao = '\n\n--- FICHA DE INSPEÇÃO ---';
          if (itensOK.length) fichaInspacao += `\n✅ OK: ${itensOK.join(', ')}`;
          if (itensNOK.length) fichaInspacao += `\n❌ NOK: ${itensNOK.join(', ')}`;
          if (observacoesEntrada) fichaInspacao += `\nAvarias: ${observacoesEntrada}`;

          const laudoAtual = dadosOrdem.laudo_tecnico || '';
          dadosOrdem.laudo_tecnico = laudoAtual ? `${laudoAtual}${fichaInspacao}` : fichaInspacao.trim();
        }

        // Adicionar as informações do veículo/animal/equipamento na descrição do problema
        if (dadosOrdem.descricao_problema) {
          dadosOrdem.descricao_problema = `${info}\n\n${dadosOrdem.descricao_problema}`;
        } else {
          dadosOrdem.descricao_problema = info;
        }
      }

      console.log('📤 Enviando ordem de serviço:', dadosOrdem);
      console.log('📤 JSON stringify:', JSON.stringify(dadosOrdem, null, 2));

      if (modoEdicao && ordemAtual) {
        // Atualizar
        console.log('🔄 Modo edição - PUT para:', `/ordem-servico/${ordemAtual.id_os}/`);
        const resposta = await axiosInstance.put(`/ordem-servico/${ordemAtual.id_os}/`, dadosOrdem);
        console.log('✅ Ordem atualizada:', resposta.data);
        // Upload fotos pendentes e assinatura
        await uploadFotosParaServidor(ordemAtual.id_os);
        await uploadAssinaturaServidor(ordemAtual.id_os);
        setSuccess('Ordem de serviço atualizada com sucesso!');
      } else {
        // Criar nova
        console.log('➕ Modo criação - POST para:', '/ordem-servico/');
        const resposta = await axiosInstance.post('/ordem-servico/', dadosOrdem);
        console.log('✅ Ordem criada:', resposta.data);
        console.log('📦 Itens produtos retornados:', resposta.data.itens_produtos);
        console.log('🔧 Itens serviços retornados:', resposta.data.itens_servicos);
        // Migrar fotos temporárias para o id_os real e enviar ao servidor
        if (resposta.data?.id_os) {
          if (chaveOSFotos && chaveOSFotos !== String(resposta.data.id_os)) {
            await migrarFotosOS(chaveOSFotos, resposta.data.id_os);
            setChaveOSFotos(String(resposta.data.id_os));
          }
          await uploadFotosParaServidor(resposta.data.id_os);
          await uploadAssinaturaServidor(resposta.data.id_os);
        }
        setSuccess('Ordem de serviço criada com sucesso!');
      }

      setOpenDialog(false);
      carregarOrdens();
      limparFormulario();
    } catch (err) {
      // Se offline, salvar localmente
      if (!navigator.onLine) {
        const chave = chaveOSFotos || `temp_${Date.now()}`;
        await salvarOSPendente(chave, { ...dadosOrdem });
        const total = await contarOSPendentes();
        setOsPendentes(total);
        setSuccess('📴 Sem internet. OS salva localmente e será enviada quando voltar a conexão.');
        setTimeout(() => setSuccess(''), 5000);
        setOpenDialog(false);
        return;
      }
      console.error('❌ Erro ao salvar ordem:', err);
      console.error('📋 Resposta do servidor:', err.response?.data);
      console.error('📤 Dados enviados:', JSON.stringify(dadosOrdem, null, 2));

      // Formatar erros de validação
      let mensagemErro = 'Erro ao salvar ordem: ';
      if (err.response?.data) {
        const erros = err.response.data;
        const mensagensErro = Object.entries(erros).map(([campo, msgs]) => {
          return `${campo}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
        });
        mensagemErro += mensagensErro.join(' | ');
      } else {
        mensagemErro += err.message;
      }

      setError(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const excluirOrdem = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta ordem de serviço?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/ordem-servico/${id}/`);
      setSuccess('Ordem excluída com sucesso!');
      carregarOrdens();
    } catch (err) {
      console.error('Erro ao excluir ordem:', err);
      setError('Erro ao excluir ordem de serviço');
    }
  };

  const imprimirDPS = async (ordem) => {
    try {
      const response = await axiosInstance.get(`/ordem-servico/${ordem.id_os}/imprimir_dps/`, {
        responseType: 'blob'
      });
      
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error('Erro ao imprimir DPS:', err);
      setError('Erro ao gerar impressão do DPS');
    }
  };

  const confirmarPagamento = () => {
    // Validar se há formas de pagamento
    if (formasPagamentoSelecionadas.length === 0) {
      setError('Adicione pelo menos uma forma de pagamento');
      return;
    }

    // Validar se o total dos pagamentos bate com o valor da OS
    const totalPagamentos = formasPagamentoSelecionadas.reduce((sum, fp) => sum + parseFloat(fp.valor), 0);
    const valorOS = parseFloat(ordemAtual?.valor_total_os) || 0;
    const valorItens = itens.reduce((acc, item) => {
      const qtd = parseFloat(item.quantidade) || 0;
      const vlr = parseFloat(item.valorUnitario) || 0;
      return acc + (qtd * vlr);
    }, 0);
    const valorTotal = valorOS || valorItens;

    if (Math.abs(totalPagamentos - valorTotal) > 0.01) {
      setError(`O valor total dos pagamentos (R$ ${totalPagamentos.toFixed(2)}) deve ser igual ao valor da OS (R$ ${valorTotal.toFixed(2)})`);
      return;
    }

    // Fechar dialog de pagamento e abrir confirmação de financeiro
    setOpenPagamentoDialog(false);
    setOpenFinanceiroDialog(true);
  };

  const adicionarFormaPagamento = () => {
    if (!formaPagamentoTemp) {
      setError('Selecione uma forma de pagamento');
      return;
    }

    const valor = parseFloat(valorPagamentoTemp);
    if (!valor || valor <= 0) {
      setError('Informe um valor válido');
      return;
    }

    const parcelas = parseInt(parcelasTemp) || 1;
    if (parcelas < 1) {
      setError('Número de parcelas deve ser maior que zero');
      return;
    }

    const forma = formasPagamento.find(f => f.id_forma_pagamento === formaPagamentoTemp);
    if (!forma) {
      setError('Forma de pagamento não encontrada');
      return;
    }

    const novaForma = {
      id_forma_pagamento: forma.id_forma_pagamento,
      nome_forma: forma.nome_forma,
      valor: valor,
      parcelas: parcelas,
      nome_conta_padrao: forma.nome_conta_padrao,
      nome_departamento: forma.nome_departamento,
      nome_centro_custo: forma.nome_centro_custo,
      dias_vencimento: forma.dias_vencimento
    };

    setFormasPagamentoSelecionadas([...formasPagamentoSelecionadas, novaForma]);
    setFormaPagamentoTemp('');
    setValorPagamentoTemp('');
    setParcelasTemp(1);
  };

  const removerFormaPagamento = (index) => {
    const novasFormas = formasPagamentoSelecionadas.filter((_, i) => i !== index);
    setFormasPagamentoSelecionadas(novasFormas);
  };

  const calcularValorRestante = () => {
    const valorOS = parseFloat(ordemAtual?.valor_total_os) || 0;
    const valorItens = itens.reduce((acc, item) => {
      const qtd = parseFloat(item.quantidade) || 0;
      const vlr = parseFloat(item.valorUnitario) || 0;
      return acc + (qtd * vlr);
    }, 0);
    const valorTotal = valorOS || valorItens;

    const totalPagamentos = formasPagamentoSelecionadas.reduce((sum, fp) => sum + parseFloat(fp.valor), 0);
    return valorTotal - totalPagamentos;
  };

  const gerarFinanceiroOS = async () => {
    try {
      setLoading(true);

      const clienteInfo = clientes.find(c => c.id_cliente === cliente);
      const operacaoInfo = operacoes.find(op => op.id_operacao === operacao);

      const dataEmissao = new Date().toISOString().split('T')[0];

      // Gerar um financeiro (conta a receber) para cada forma de pagamento
      for (const formaPagamento of formasPagamentoSelecionadas) {
        const valorParcela = parseFloat(formaPagamento.valor) / formaPagamento.parcelas;

        // Criar uma conta a receber para cada parcela
        for (let i = 0; i < formaPagamento.parcelas; i++) {
          const dataVencimento = new Date();
          dataVencimento.setDate(dataVencimento.getDate() + (formaPagamento.dias_vencimento || 0) + (i * 30)); // Intervalo de 30 dias entre parcelas
          const dataVencimentoStr = dataVencimento.toISOString().split('T')[0];

          // Verificar se deve fazer baixa automática
          const fazBaixaAutomatica = operacaoInfo?.baixa_automatica && dataVencimentoStr === dataEmissao;

          const contaFinanceira = {
            tipo_conta: 'Receber',
            id_cliente_fornecedor: cliente,
            id_operacao: operacao,
            forma_pagamento: formaPagamento.nome_forma,
            documento_numero: ordemAtual?.id_os ? `OS-${ordemAtual.id_os}/${i + 1}` : `${numeroDocumento}/${i + 1}`,
            data_emissao: dataEmissao,
            data_vencimento: dataVencimentoStr,
            valor_original: valorParcela,
            valor_liquidado: fazBaixaAutomatica ? valorParcela : 0,
            valor_parcela: valorParcela,
            gerencial: true,
            descricao: `OS ${ordemAtual?.id_os || numeroDocumento} - ${clienteInfo?.nome_razao_social || 'Cliente'} - Parcela ${i + 1}/${formaPagamento.parcelas} - ${formaPagamento.nome_forma}`,
            observacao: `Gerado automaticamente pela Ordem de Serviço ${ordemAtual?.id_os || numeroDocumento}${fazBaixaAutomatica ? ' - BAIXA AUTOMÁTICA' : ''}`,
            status_conta: fazBaixaAutomatica ? 'Paga' : 'Pendente',
            data_pagamento: fazBaixaAutomatica ? dataEmissao : null,
            id_departamento: formaPagamento.id_departamento || null,
            id_centro_custo: formaPagamento.id_centro_custo || null,
            id_conta_baixa: formaPagamento.id_conta_padrao || null,
            id_conta_bancaria: formaPagamento.id_conta_padrao || null
          };

          console.log('💰 Criando conta a receber:', contaFinanceira);

          // Criar conta a receber
          try {
            await axiosInstance.post('/contas/', contaFinanceira);
          } catch (contaError) {
            console.error('❌ Erro ao criar conta:', contaError.response?.data);
            throw new Error(`Erro ao criar conta: ${JSON.stringify(contaError.response?.data)}`);
          }
        }
      }

      // Atualizar status da OS se estiver editando
      if (modoEdicao && ordemAtual) {
        await atualizarStatusOS(ordemAtual.id_os, status);

        // Marcar que financeiro foi gerado
        await axiosInstance.patch(`/ordem-servico/${ordemAtual.id_os}/`, { gera_financeiro: true });
      }

      setSuccess('Financeiro gerado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setOpenFinanceiroDialog(false);
      await carregarOrdens();

    } catch (error) {
      console.error('❌ Erro ao gerar financeiro:', error);
      setError(error.response?.data?.detail || 'Erro ao gerar financeiro');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const cancelarGeracaoFinanceiro = () => {
    // Voltar ao status anterior
    setStatus(statusAnterior);
    setOpenFinanceiroDialog(false);
    setOpenPagamentoDialog(false);
    // Limpar seleções
    setFormasPagamentoSelecionadas([]);
    setFormaPagamentoTemp('');
    setValorPagamentoTemp('');
    setParcelasTemp(1);
  };

  const cancelarOrdemServico = async (ordem = null) => {
    const ordemParaCancelar = ordem || ordemAtual;

    if (!ordemParaCancelar || !ordemParaCancelar.id_os) {
      setError('Nenhuma ordem de serviço selecionada');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Confirmar ação
    if (!window.confirm(`Deseja realmente cancelar o fechamento da OS-${ordemParaCancelar.id_os}?`)) {
      return;
    }

    try {
      setLoading(true);

      // Buscar contas financeiras relacionadas a esta OS
      const documentoFiltro = `OS-${ordemParaCancelar.id_os}`;
      console.log('🔍 Buscando contas com documento:', documentoFiltro);

      const response = await axiosInstance.get('/contas/', {
        params: { documento_numero__startswith: documentoFiltro }
      });

      const todasContas = response.data.results || response.data || [];
      console.log('📦 Total de contas retornadas da API:', todasContas.length);

      // Filtrar manualmente as contas desta OS (caso o filtro da API não funcione)
      const contasRelacionadas = todasContas.filter(conta =>
        conta.documento_numero && conta.documento_numero.startsWith(documentoFiltro)
      );

      console.log('💰 Contas financeiras da OS-' + ordemParaCancelar.id_os + ':', contasRelacionadas.length);
      if (contasRelacionadas.length > 0) {
        console.log('📄 Documentos encontrados:', contasRelacionadas.map(c => c.documento_numero));
      }

      // Verificar se alguma conta foi PAGA (recebida)
      const contasPagas = contasRelacionadas.filter(conta => {
        console.log(`Conta ${conta.id_conta}: status_conta = "${conta.status_conta}"`);
        return conta.status_conta === 'Paga';
      });

      console.log('💵 Contas Pagas:', contasPagas.length);
      console.log('📝 Contas Pendentes:', contasRelacionadas.length - contasPagas.length);

      if (contasPagas.length > 0) {
        setError('❌ Não é possível cancelar: Existem contas recebidas. É necessário fazer um estorno no financeiro!');
        setTimeout(() => setError(''), 5000);
        return;
      }

      // Se chegou aqui, todas as contas estão pendentes (a receber) - pode excluir
      const contasPendentes = contasRelacionadas.filter(conta => conta.status_conta === 'Pendente');

      if (contasPendentes.length > 0) {
        // Excluir todas as contas pendentes
        for (const conta of contasPendentes) {
          await axiosInstance.delete(`/contas/${conta.id_conta}/`);
          console.log(`🗑️ Conta ${conta.id_conta} excluída`);
        }
        console.log(`✅ ${contasPendentes.length} conta(s) a receber excluída(s)`);
      }

      // Buscar o status "Aberta" (geralmente é o primeiro ou id_status = 1)
      const statusAberta = statusList.find(s => s.nome_status.toLowerCase().includes('aberta')) || statusList[0];

      if (!statusAberta) {
        setError('Status "Aberta" não encontrado');
        return;
      }

      // Atualizar status da OS para "Aberta"
      await axiosInstance.patch(`/ordem-servico/${ordemParaCancelar.id_os}/`, {
        id_status: statusAberta.id_status,
        gera_financeiro: false
      });

      setSuccess(`✅ OS-${ordemParaCancelar.id_os} cancelada com sucesso! Status voltou para "Aberta"`);
      setTimeout(() => setSuccess(''), 3000);

      // Recarregar a lista
      await carregarOrdens();

    } catch (error) {
      console.error('❌ Erro ao cancelar ordem de serviço:', error);
      setError(error.response?.data?.detail || 'Erro ao cancelar ordem de serviço');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };


  const abrirNFeDialog = (ordem) => {
    // Validação: Verificar se existe pelo menos um produto com classificação 'Revenda'
    const itensProdutos = ordem.itens_produtos || [];
    const temProdutoRevenda = itensProdutos.some(item => {
        // Encontra o produto na lista geral de produtos carregados
        const produtoCadastrado = produtos.find(p => p.id_produto === item.id_produto);
        // Verifica se a classificação é 'Revenda'
        return produtoCadastrado && produtoCadastrado.classificacao === 'Revenda';
    });

    if (!temProdutoRevenda) {
        alert('Não é possível emitir NF-e (Modelo 55) para esta OS.\n\nMotivo: A OS não contém produtos com classificação "Revenda".\n(Serviços e outras classificações não são permitidos para este modelo de nota).');
        return;
    }

    setCurrentOrderForNFe(ordem);
    // Tenta pré-selecionar uma operação de venda (Modelo 55)
    // Usar todasOperacoes, pois operacoes (estado) só contém serviços
    const opVenda = todasOperacoes.find(op => op.modelo_documento === '55');
    if (opVenda) {
      setSelectedNFeOperation(opVenda.id_operacao);
    } else {
      setSelectedNFeOperation('');
    }
    setOpenNFeDialog(true);
  };

  const confirmarEmissaoNFe = async () => {
    if (!currentOrderForNFe || !selectedNFeOperation) {
        setError('Selecione uma operação para continuar.');
        return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post(`/ordem-servico/${currentOrderForNFe.id_os}/converter_para_nfe/`, { operacao_id: selectedNFeOperation });
      
      const { venda_id, message } = response.data;
      setSuccess(`✅ ${message || 'NF-e gerada!'} Venda #${venda_id}`);
      setOpenNFeDialog(false);
      
      if (window.confirm('Venda criada com sucesso! Deseja abrir a venda agora para emitir a nota?')) {
          window.location.href = `/vendas/editar/${venda_id}`;
      }
      
      setTimeout(() => setSuccess(''), 5000);
      carregarOrdens();
    } catch (error) {
      console.error('Erro ao gerar NF-e:', error);
      setError(error.response?.data?.error || error.response?.data?.detail || 'Erro ao gerar NF-e');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const emitirNFSe = async (ordem) => {
    if (!window.confirm(`Deseja emitir NFS-e para a OS-${ordem.id_os}?`)) return;
    try {
      setLoading(true); // Mostrar loading
      await axiosInstance.post(`/ordem-servico/${ordem.id_os}/emitir_nfse/`, {});
      setSuccess('✅ NFS-e emitida com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      carregarOrdens(); // Recarregar para atualizar status se houver
    } catch (error) {
      console.error('Erro ao emitir NFS-e:', error);
      setError(error.response?.data?.error || 'Erro ao emitir NFS-e');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const emitirNFe = async (ordem) => {
    if (!window.confirm(`Deseja gerar uma NF-e (Modelo 55) a partir da OS-${ordem.id_os}? Isso criará uma venda com os produtos desta OS.`)) return;
    try {
      setLoading(true);
      const response = await axiosInstance.post(`/ordem-servico/${ordem.id_os}/converter_para_nfe/`, {});
      
      const { venda_id, message } = response.data;
      setSuccess(`✅ ${message || 'NF-e gerada!'} Venda #${venda_id}`);
      
      if (window.confirm('Venda criada com sucesso! Deseja abrir a venda agora para emitir a nota?')) {
          window.location.href = `/vendas/editar/${venda_id}`;
      }
      
      setTimeout(() => setSuccess(''), 5000);
      carregarOrdens();
    } catch (error) {
      console.error('Erro ao gerar NF-e:', error);
      setError(error.response?.data?.error || error.response?.data?.detail || 'Erro ao gerar NF-e');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const baixarXML = async (ordem) => {
    try {
      const response = await axiosInstance.get(`/ordem-servico/${ordem.id_os}/download_xml/`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Tentar pegar nome do arquivo do header ou usar padrão
      const filename = `nfse_${ordem.id_os}.xml`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar XML:', error);
      setError('Erro ao baixar XML');
      setTimeout(() => setError(''), 3000);
    }
  };

  const enviarEmail = async (ordem) => {
    const email = prompt('Digite o e-mail de destino:', ordem.cliente_email || '');
    if (email === null) return;
    
    try {
      setLoading(true);
      await axiosInstance.post(`/ordem-servico/${ordem.id_os}/enviar_email/`, { email });
      setSuccess(`✅ E-mail enviado com sucesso para ${email}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      setError(error.response?.data?.error || 'Erro ao enviar e-mail');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const compartilharWhatsAppOS = async (ordem) => {
    const total = parseFloat(ordem.valor_total_os || 0).toFixed(2);
    let texto = `*🔧 ORDEM DE SERVIÇO*\n`;
    texto += `OS-${ordem.id_os}\n`;
    if (ordem.data_abertura) texto += `📅 ${new Date(ordem.data_abertura).toLocaleDateString('pt-BR')}\n`;
    if (ordem.cliente_nome) texto += `👤 Cliente: ${ordem.cliente_nome}\n`;
    const nomeStatus = ordem.status_info?.nome || ordem.status_os || '';
    if (nomeStatus) texto += `📊 Status: ${nomeStatus}\n`;
    if (ordem.descricao_problema) texto += `📝 Problema: ${ordem.descricao_problema}\n`;
    if (ordem.laudo_tecnico) texto += `🔍 Laudo: ${ordem.laudo_tecnico}\n`;

    const produtos = ordem.itens_produtos || [];
    if (produtos.length > 0) {
      texto += `\n*🛒 Produtos:*\n`;
      produtos.forEach(item => {
        const nome = item.produto_nome || `Produto #${item.id_produto}`;
        const qtd = parseFloat(item.quantidade || 1);
        const vtotal = parseFloat(item.valor_total || 0).toFixed(2);
        texto += `• ${nome} (${qtd}x) — R$ ${vtotal}\n`;
      });
    }

    const servicos = ordem.itens_servicos || [];
    if (servicos.length > 0) {
      texto += `\n*🔧 Serviços:*\n`;
      servicos.forEach(item => {
        const desc = item.descricao_servico || 'Serviço';
        const qtd = parseFloat(item.quantidade || 1);
        const vtotal = parseFloat(item.valor_total || 0).toFixed(2);
        texto += `• ${desc} (${qtd}x) — R$ ${vtotal}\n`;
      });
    }

    texto += `\n💰 *Total: R$ ${total}*`;

    const telBruto = ordem.cliente_telefone || '';
    const telLimpo = telBruto.replace(/\D/g, '');
    const telComPais = telLimpo ? (telLimpo.startsWith('55') ? telLimpo : `55${telLimpo}`) : '';

    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: `OS-${ordem.id_os}`,
        text: texto,
        dialogTitle: 'Compartilhar Ordem de Serviço',
      });
    } catch {
      const encoded = encodeURIComponent(texto);
      const url = telComPais
        ? `https://wa.me/${telComPais}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;
      window.open(url, '_blank');
    }
  };

  const imprimirOrdem = async (ordem) => {
    const tipoImpressao = configImpressao.tipo_impressora;
    const usarTermica = tipoImpressao === 'termica';
    const usarFotosAssinatura = tipoImpressao === 'a4_fotos';
    try {
      // Buscar dados completos da ordem incluindo financeiro
      const response = await axiosInstance.get(`/ordem-servico/${ordem.id_os}/`);
      const ordemCompleta = response.data;

      let conteudo;
      if (usarTermica) {
        conteudo = gerarConteudoImpressaoTermica(ordemCompleta);
      } else if (usarFotosAssinatura) {
        // Buscar fotos e assinatura do servidor
        let fotos = [];
        let assinatura = null;
        try {
          const respFotos = await axiosInstance.get(`/os-fotos/?id_os=${ordem.id_os}`);
          fotos = (respFotos.data?.results || respFotos.data || []).map(f => ({
            base64: f.imagem_base64,
            nomeArquivo: f.nome_arquivo,
          }));
        } catch (e) { console.warn('Fotos indisponíveis para impressão:', e); }
        try {
          const respAssin = await axiosInstance.get(`/os-assinaturas/?id_os=${ordem.id_os}`);
          const lista = respAssin.data?.results || respAssin.data || [];
          if (lista.length > 0) assinatura = lista[0].assinatura_base64;
        } catch (e) { console.warn('Assinatura indisponível para impressão:', e); }
        conteudo = gerarConteudoImpressaoComFotos(ordemCompleta, fotos, assinatura);
      } else {
        conteudo = gerarConteudoImpressao(ordemCompleta);
      }

      const janelaImpressao = window.open('', '_blank', usarTermica ? 'width=300,height=600' : '');
      janelaImpressao.document.write(conteudo);
      janelaImpressao.document.close();
      janelaImpressao.focus();
      setTimeout(() => janelaImpressao.print(), 250);
    } catch (err) {
      console.error('Erro ao buscar dados para impressão:', err);
      // Fallback: usar dados existentes (sem fotos/assinatura)
      const conteudo = usarTermica ? gerarConteudoImpressaoTermica(ordem) : gerarConteudoImpressao(ordem);
      const janelaImpressao = window.open('', '_blank', usarTermica ? 'width=300,height=600' : '');
      janelaImpressao.document.write(conteudo);
      janelaImpressao.document.close();
      janelaImpressao.focus();
      setTimeout(() => janelaImpressao.print(), 250);
    }
  };

  const gerarConteudoImpressao = (ordem) => {
    console.log('🖨️ Gerando conteúdo de impressão para ordem:', ordem);
    console.log('🔍 Desconto produtos:', ordem.desconto_produtos, 'Tipo:', ordem.tipo_desconto_produtos);
    console.log('🔍 Desconto serviços:', ordem.desconto_servicos, 'Tipo:', ordem.tipo_desconto_servicos);
    console.log('🔍 Valor desconto total:', ordem.valor_desconto);
    console.log('🔍 Itens produtos:', ordem.itens_produtos);
    console.log('🔍 Itens serviços:', ordem.itens_servicos);

    // Processar itens de produtos e serviços
    const itensHtml = [];

    // Adicionar produtos
    if (ordem.itens_produtos && Array.isArray(ordem.itens_produtos)) {
      ordem.itens_produtos.forEach(item => {
        const quantidade = parseFloat(item.quantidade || 0);
        const valorUnitario = parseFloat(item.valor_unitario || 0);
        const desconto = parseFloat(item.desconto || 0);
        const subtotal = quantidade * valorUnitario;
        const total = subtotal - desconto;

        console.log('📦 Produto:', item.produto_nome, '- Desconto:', desconto, '- Total:', total);

        itensHtml.push(`
          <tr>
            <td><span style="background-color: #4caf50; color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.85em;">PRODUTO</span></td>
            <td>${item.produto_nome || item.descricao || 'N/A'}</td>
            <td style="text-align: center;">${quantidade.toFixed(2)}</td>
            <td style="text-align: right;">R$ ${valorUnitario.toFixed(2)}</td>
            <td style="text-align: right;">${desconto > 0 ? `R$ ${desconto.toFixed(2)}` : '-'}</td>
            <td style="text-align: right;"><strong>R$ ${total.toFixed(2)}</strong></td>
          </tr>
        `);
      });
    }

    // Adicionar serviços
    if (ordem.itens_servicos && Array.isArray(ordem.itens_servicos)) {
      ordem.itens_servicos.forEach(item => {
        const quantidade = parseFloat(item.quantidade || 0);
        const valorUnitario = parseFloat(item.valor_unitario || 0);
        const desconto = parseFloat(item.desconto || 0);
        const subtotal = quantidade * valorUnitario;
        const total = subtotal - desconto;

        console.log('🔧 Serviço:', item.descricao_servico, '- Desconto:', desconto, '- Total:', total);

        // Buscar descrição do serviço com múltiplos fallbacks
        const descricaoServico = item.servico_nome ||
          item.produto_nome ||
          item.nome_produto ||
          item.descricao ||
          item.nome ||
          'Serviço não identificado';

        itensHtml.push(`
          <tr>
            <td><span style="background-color: #2196f3; color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.85em;">SERVIÇO</span></td>
            <td>${descricaoServico}</td>
            <td style="text-align: center;">${quantidade.toFixed(2)}</td>
            <td style="text-align: right;">R$ ${valorUnitario.toFixed(2)}</td>
            <td style="text-align: right;">${desconto > 0 ? `R$ ${desconto.toFixed(2)}` : '-'}</td>
            <td style="text-align: right;"><strong>R$ ${total.toFixed(2)}</strong></td>
          </tr>
        `);
      });
    }

    // Calcular totais com desconto
    let subtotalProdutos = 0;
    let subtotalServicos = 0;

    if (ordem.itens_produtos) {
      subtotalProdutos = ordem.itens_produtos.reduce((acc, item) => {
        const qtd = parseFloat(item.quantidade || 0);
        const vlrUnit = parseFloat(item.valor_unitario || 0);
        const desc = parseFloat(item.desconto || 0);
        return acc + ((qtd * vlrUnit) - desc);
      }, 0);
    }
    if (ordem.itens_servicos) {
      subtotalServicos = ordem.itens_servicos.reduce((acc, item) => {
        const qtd = parseFloat(item.quantidade || 0);
        const vlrUnit = parseFloat(item.valor_unitario || 0);
        const desc = parseFloat(item.desconto || 0);
        return acc + ((qtd * vlrUnit) - desc);
      }, 0);
    }

    // Total geral já com descontos dos itens aplicados
    const totalGeral = subtotalProdutos + subtotalServicos;

    // Buscar informações do cliente
    const nomeCliente = ordem.cliente_nome || ordem.nome_cliente || 'N/A';

    // Buscar informações do técnico/vendedor
    const nomeTecnico = ordem.tecnico_nome || ordem.nome_tecnico || ordem.vendedor_nome || 'N/A';

    // Buscar status
    const statusInfo = getStatusInfo(ordem);

    // Buscar informações de veículo/animal/equipamento
    let veiculoHtml = '';
    if (ordem.veiculo || ordem.id_veiculo) {
      const veiculo = ordem.veiculo || {};
      veiculoHtml = `
        <div style="margin: 20px 0; padding: 15px; border: 2px solid #ff9800; border-radius: 5px; background-color: #fff3e0;">
          <h3 style="margin-top: 0; color: #e65100; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5em;">🚗</span> Veículo
          </h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div><strong>Placa:</strong> ${veiculo.placa || 'N/A'}</div>
            <div><strong>Marca/Modelo:</strong> ${veiculo.marca || ''} ${veiculo.modelo || ''}</div>
            <div><strong>Ano:</strong> ${veiculo.ano || 'N/A'}</div>
            <div><strong>Cor:</strong> ${veiculo.cor || 'N/A'}</div>
            ${veiculo.km ? `<div><strong>KM:</strong> ${veiculo.km}</div>` : ''}
            ${veiculo.chassi ? `<div><strong>Chassi:</strong> ${veiculo.chassi}</div>` : ''}
          </div>
        </div>
      `;
    } else if (ordem.animal || ordem.id_animal) {
      const animal = ordem.animal || {};
      veiculoHtml = `
        <div style="margin: 20px 0; padding: 15px; border: 2px solid #4caf50; border-radius: 5px; background-color: #e8f5e9;">
          <h3 style="margin-top: 0; color: #2e7d32; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5em;">🐾</span> Animal
          </h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div><strong>Nome:</strong> ${animal.nome || 'N/A'}</div>
            <div><strong>Espécie:</strong> ${animal.especie || 'N/A'}</div>
            <div><strong>Raça:</strong> ${animal.raca || 'N/A'}</div>
            <div><strong>Idade:</strong> ${animal.idade || 'N/A'}</div>
            ${animal.cor ? `<div><strong>Cor:</strong> ${animal.cor}</div>` : ''}
            ${animal.peso ? `<div><strong>Peso:</strong> ${animal.peso} kg</div>` : ''}
          </div>
        </div>
      `;
    } else if (ordem.equipamento || ordem.id_equipamento) {
      const equipamento = ordem.equipamento || {};
      veiculoHtml = `
        <div style="margin: 20px 0; padding: 15px; border: 2px solid #9c27b0; border-radius: 5px; background-color: #f3e5f5;">
          <h3 style="margin-top: 0; color: #6a1b9a; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5em;">⚙️</span> Equipamento
          </h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div><strong>Tipo:</strong> ${equipamento.tipo || 'N/A'}</div>
            <div><strong>Marca/Modelo:</strong> ${equipamento.marca || ''} ${equipamento.modelo || ''}</div>
            ${equipamento.numero_serie ? `<div><strong>Nº Série:</strong> ${equipamento.numero_serie}</div>` : ''}
            ${equipamento.patrimonio ? `<div><strong>Patrimônio:</strong> ${equipamento.patrimonio}</div>` : ''}
          </div>
        </div>
      `;
    }

    // Buscar informações de financeiro
    let financeiroHtml = '';
    if (ordem.financeiro && Array.isArray(ordem.financeiro) && ordem.financeiro.length > 0) {
      const financeiroItens = ordem.financeiro.map(fin => {
        const valor = parseFloat(fin.valor_parcela || 0);
        const status = fin.status_conta || 'Pendente';
        const statusClass = status === 'Paga' ? 'pago' : status === 'Parcial' ? 'parcial' : 'pendente';
        const vencimento = fin.data_vencimento ? new Date(fin.data_vencimento).toLocaleDateString('pt-BR') : 'N/A';
        const formaPagamento = fin.forma_pagamento_nome || fin.forma_pagamento || 'N/A';

        return `
          <tr>
            <td style="text-align: center;">${fin.numero_parcela || 1}</td>
            <td>${formaPagamento}</td>
            <td style="text-align: center;">${vencimento}</td>
            <td style="text-align: right;">R$ ${valor.toFixed(2)}</td>
            <td style="text-align: center;">
              <span class="status-financeiro ${statusClass}">${status}</span>
            </td>
          </tr>
        `;
      }).join('');

      financeiroHtml = `
        <div style="margin: 20px 0;">
          <h3 style="color: #2196F3; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.3em;">💰</span> Financeiro
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
            <thead>
              <tr style="background-color: #2196F3; color: white;">
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center; width: 10%;">Parcela</th>
                <th style="border: 1px solid #ddd; padding: 10px; width: 25%;">Forma Pagamento</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center; width: 15%;">Vencimento</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: right; width: 20%;">Valor</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center; width: 15%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${financeiroItens}
            </tbody>
          </table>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ordem de Serviço ${ordem.id_os || 'N/A'}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 30px;
            font-size: 14px;
            line-height: 1.6;
          }
          h1 { 
            text-align: center; 
            color: #2196F3; 
            margin-bottom: 30px;
            font-size: 2.5em;
            text-transform: uppercase;
            border-bottom: 3px solid #2196F3;
            padding-bottom: 15px;
          }
          h3 {
            color: #2196F3;
            margin: 20px 0 10px 0;
            font-size: 1.3em;
          }
          .header-info { 
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
            padding: 20px;
            border: 2px solid #2196F3;
            border-radius: 8px;
            background-color: #e3f2fd;
          }
          .info-item {
            display: flex;
            gap: 10px;
          }
          .info-label { 
            font-weight: bold;
            min-width: 120px;
            color: #1976d2;
          }
          .info-value {
            flex: 1;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 12px;
          }
          th { 
            background-color: #2196F3; 
            color: white; 
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.9em;
          }
          tbody tr:nth-child(even) { 
            background-color: #f5f5f5; 
          }
          tbody tr:hover {
            background-color: #e3f2fd;
          }
          .total-box { 
            text-align: right; 
            font-weight: bold; 
            font-size: 1.5em; 
            margin-top: 20px; 
            padding: 15px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
          }
          .status-badge { 
            padding: 8px 15px; 
            border-radius: 20px; 
            display: inline-block; 
            font-weight: bold;
            font-size: 0.9em;
          }
          .status-financeiro {
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.85em;
            font-weight: bold;
          }
          .status-financeiro.pago {
            background-color: #4caf50;
            color: white;
          }
          .status-financeiro.parcial {
            background-color: #ff9800;
            color: white;
          }
          .status-financeiro.pendente {
            background-color: #f44336;
            color: white;
          }
          .section-box { 
            margin: 20px 0; 
            padding: 15px; 
            border: 1px solid #ddd; 
            border-radius: 8px; 
            background-color: #fafafa; 
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #424242;
            font-size: 1.1em;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 0.9em;
          }
          @media print {
            body { padding: 15px; }
            .no-print { display: none; }
            h1 { font-size: 2em; }
            tbody tr:hover { background-color: transparent; }
          }
        </style>
      </head>
      <body>
        <h1>📋 ORDEM DE SERVIÇO</h1>
        
        <div class="header-info">
          <div class="info-item">
            <span class="info-label">Número:</span>
            <span class="info-value"><strong style="font-size: 1.2em;">${ordem.id_os ? `OS-${ordem.id_os}` : 'N/A'}</strong></span>
          </div>
          <div class="info-item">
            <span class="info-label">Data Abertura:</span>
            <span class="info-value">${ordem.data_abertura ? new Date(ordem.data_abertura).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Cliente:</span>
            <span class="info-value"><strong>${nomeCliente}</strong></span>
          </div>
          <div class="info-item">
            <span class="info-label">Técnico:</span>
            <span class="info-value">${nomeTecnico}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Status:</span>
            <span class="info-value">
              <span class="status-badge" style="background-color: ${getStatusColor(statusInfo.cor)}; color: white;">
                ${statusInfo.nome}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Solicitante:</span>
            <span class="info-value">${ordem.solicitante || 'N/A'}</span>
          </div>
        </div>
        
        ${veiculoHtml}
        
        ${ordem.descricao_problema ? `
          <div class="section-box">
            <div class="section-title">📝 Descrição do Problema / Observações</div>
            <div style="white-space: pre-wrap;">${ordem.descricao_problema}</div>
          </div>
        ` : ''}
        
        ${ordem.laudo_tecnico ? `
          <div class="section-box" style="background-color: #fff3e0; border-color: #ff9800;">
            <div class="section-title" style="color: #e65100;">🔧 Laudo Técnico / Ocorrência</div>
            <div style="white-space: pre-wrap;">${ordem.laudo_tecnico}</div>
          </div>
        ` : ''}
        
        <h3 style="margin-top: 30px;">🛠️ Itens da Ordem de Serviço</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 13%;">Tipo</th>
              <th style="width: 35%;">Descrição</th>
              <th style="width: 8%; text-align: center;">Qtd</th>
              <th style="width: 14%; text-align: right;">Vlr. Unit.</th>
              <th style="width: 12%; text-align: right;">Desconto</th>
              <th style="width: 18%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itensHtml.length > 0 ? itensHtml.join('') : '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #999;">Nenhum item cadastrado</td></tr>'}
          </tbody>
        </table>
        
        ${(ordem.desconto_produtos && parseFloat(ordem.desconto_produtos) > 0) || (ordem.desconto_servicos && parseFloat(ordem.desconto_servicos) > 0) ? `
          <div style="text-align: right; margin-top: 20px; padding: 15px; background-color: #e3f2fd; border-radius: 8px; border: 2px solid #1976d2;">
            ${ordem.desconto_produtos && parseFloat(ordem.desconto_produtos) > 0 ? `
              <div style="display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 8px;">
                <span style="font-size: 0.95em;"><strong>Desconto Produtos:</strong></span>
                <span style="font-size: 0.95em; color: #1565c0;">
                  ${ordem.tipo_desconto_produtos === 'porcentagem' ? `${parseFloat(ordem.desconto_produtos).toFixed(2)}%` : `R$ ${parseFloat(ordem.desconto_produtos).toFixed(2)}`}
                </span>
              </div>
            ` : ''}
            ${ordem.desconto_servicos && parseFloat(ordem.desconto_servicos) > 0 ? `
              <div style="display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 8px;">
                <span style="font-size: 0.95em;"><strong>Desconto Serviços:</strong></span>
                <span style="font-size: 0.95em; color: #1565c0;">
                  ${ordem.tipo_desconto_servicos === 'porcentagem' ? `${parseFloat(ordem.desconto_servicos).toFixed(2)}%` : `R$ ${parseFloat(ordem.desconto_servicos).toFixed(2)}`}
                </span>
              </div>
            ` : ''}
            ${ordem.valor_desconto && parseFloat(ordem.valor_desconto) > 0 ? `
              <div style="display: flex; justify-content: flex-end; gap: 20px; padding-top: 8px; border-top: 1px solid #1976d2; color: #e65100;">
                <span style="font-size: 1em;"><strong>Desconto Total:</strong></span>
                <span style="font-size: 1em;"><strong>- R$ ${parseFloat(ordem.valor_desconto).toFixed(2)}</strong></span>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <div class="total-box">
          💰 VALOR TOTAL: R$ ${totalGeral.toFixed(2)}
        </div>
        
        ${financeiroHtml}
        
        <div class="footer">
          <p><strong>Impresso em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          ${configImpressao.observacao_rodape ? `<p style="margin-top: 6px;">${configImpressao.observacao_rodape}</p>` : ''}
          <p style="margin-top: 10px; font-size: 0.85em;">APERUS - Ordem de Serviço</p>
        </div>
      </body>
      </html>
    `;
  };

  // Template A4 com Fotos e Assinatura
  const gerarConteudoImpressaoComFotos = (ordem, fotos, assinatura) => {
    const rodapeTexto = configImpressao.observacao_rodape || '';
    const nomeCliente = ordem.cliente_nome || 'N/A';
    const nomeTecnico = ordem.tecnico_nome || 'N/A';
    const statusInfo = getStatusInfo(ordem);
    const empresa = ordem.empresa_info || {};

    const itensHtml = [];
    let subtotalProd = 0;
    let subtotalServ = 0;

    (ordem.itens_produtos || []).forEach(item => {
      const qty = parseFloat(item.quantidade || 0);
      const vlr = parseFloat(item.valor_unitario || 0);
      const desc = parseFloat(item.desconto || 0);
      const total = qty * vlr - desc;
      subtotalProd += total;
      itensHtml.push(`
        <tr>
          <td><span style="background:#4caf50;color:white;padding:2px 7px;border-radius:3px;font-size:.8em;">PRODUTO</span></td>
          <td>${item.produto_nome || 'N/A'}</td>
          <td style="text-align:center">${qty.toFixed(2)}</td>
          <td style="text-align:right">R$ ${vlr.toFixed(2)}</td>
          <td style="text-align:right">${desc > 0 ? `R$ ${desc.toFixed(2)}` : '-'}</td>
          <td style="text-align:right"><strong>R$ ${total.toFixed(2)}</strong></td>
        </tr>`);
    });

    (ordem.itens_servicos || []).forEach(item => {
      const qty = parseFloat(item.quantidade || 0);
      const vlr = parseFloat(item.valor_unitario || 0);
      const desc = parseFloat(item.desconto || 0);
      const total = qty * vlr - desc;
      subtotalServ += total;
      const descServico = item.descricao_servico || item.servico_nome || 'Serviço';
      itensHtml.push(`
        <tr>
          <td><span style="background:#2196f3;color:white;padding:2px 7px;border-radius:3px;font-size:.8em;">SERVIÇO</span></td>
          <td>${descServico}${item.tecnico_nome ? ` <span style="font-size:.8em;color:#666;">(${item.tecnico_nome})</span>` : ''}</td>
          <td style="text-align:center">${qty.toFixed(2)}</td>
          <td style="text-align:right">R$ ${vlr.toFixed(2)}</td>
          <td style="text-align:right">${desc > 0 ? `R$ ${desc.toFixed(2)}` : '-'}</td>
          <td style="text-align:right"><strong>R$ ${total.toFixed(2)}</strong></td>
        </tr>`);
    });

    const totalGeral = parseFloat(ordem.valor_total_os || 0) || (subtotalProd + subtotalServ);

    const fotosHtml = (fotos || []).length > 0 ? `
      <div style="margin:24px 0;">
        <h3 style="color:#2196F3;border-bottom:2px solid #2196F3;padding-bottom:6px;">📷 Fotos da OS</h3>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:10px;">
          ${fotos.map(f => `
            <div style="text-align:center;">
              <img src="${f.base64}" alt="${f.nomeArquivo || 'foto'}"
                style="max-width:200px;max-height:180px;border:2px solid #ddd;border-radius:6px;object-fit:cover;" />
              ${f.nomeArquivo ? `<div style="font-size:.75em;color:#666;margin-top:3px;">${f.nomeArquivo}</div>` : ''}
            </div>`).join('')}
        </div>
      </div>` : '';

    const assinaturaHtml = assinatura ? `
      <div style="margin:30px 0 10px 0;">
        <h3 style="color:#2196F3;border-bottom:2px solid #2196F3;padding-bottom:6px;">✍️ Assinatura do Cliente</h3>
        <div style="margin-top:14px;text-align:center;">
          <img src="${assinatura}" alt="Assinatura" style="max-width:340px;max-height:120px;border:1px solid #aaa;border-radius:4px;background:#fff;padding:6px;" />
          <div style="border-top:1px solid #333;width:340px;margin:8px auto 0;padding-top:4px;font-size:.85em;">
            Assinatura do Cliente / Responsável
          </div>
        </div>
      </div>` : `
      <div style="margin:30px 0 10px 0;page-break-inside:avoid;">
        <h3 style="color:#2196F3;border-bottom:2px solid #2196F3;padding-bottom:6px;">✍️ Assinatura</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:20px;">
          <div style="text-align:center;">
            <div style="border-top:1px solid #333;padding-top:6px;font-size:.85em;">Assinatura do Cliente / Responsável</div>
          </div>
          <div style="text-align:center;">
            <div style="border-top:1px solid #333;padding-top:6px;font-size:.85em;">Assinatura do Técnico Responsável</div>
          </div>
        </div>
      </div>`;

    return `<!DOCTYPE html>
<html><head>
  <title>OS-${ordem.id_os || ''} — Com Fotos</title>
  <meta charset="UTF-8">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',sans-serif;padding:28px;font-size:13px;line-height:1.55;color:#222;}
    h1{text-align:center;color:#2196F3;font-size:2em;text-transform:uppercase;border-bottom:3px solid #2196F3;padding-bottom:12px;margin-bottom:20px;}
    h3{color:#2196F3;margin:18px 0 8px;}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px;border:2px solid #2196F3;border-radius:8px;background:#e3f2fd;margin-bottom:16px;}
    .lbl{font-weight:bold;color:#1565c0;min-width:110px;display:inline-block;}
    table{width:100%;border-collapse:collapse;margin:12px 0;}
    th{background:#2196F3;color:white;padding:10px;font-size:.85em;text-transform:uppercase;}
    td{border:1px solid #ddd;padding:9px;}
    tbody tr:nth-child(even){background:#f5f5f5;}
    .total{text-align:right;font-weight:bold;font-size:1.4em;padding:14px;background:linear-gradient(135deg,#1565c0,#42a5f5);color:white;border-radius:8px;margin-top:14px;}
    .sec{margin:16px 0;padding:12px;border:1px solid #ddd;border-radius:6px;background:#fafafa;}
    .footer{margin-top:40px;padding-top:14px;border-top:2px solid #ddd;text-align:center;color:#666;font-size:.85em;}
    @media print{body{padding:14px;}@page{size:A4;margin:14mm;}}
  </style>
</head><body>
  ${empresa.nome ? `<div style="text-align:center;margin-bottom:16px;">
    <div style="font-size:1.3em;font-weight:bold;">${empresa.nome}</div>
    ${empresa.cnpj ? `<div style="font-size:.85em;">CNPJ: ${empresa.cnpj}</div>` : ''}
    ${empresa.telefone ? `<div style="font-size:.85em;">Tel: ${empresa.telefone}</div>` : ''}
    ${empresa.endereco ? `<div style="font-size:.8em;color:#555;">${empresa.endereco}</div>` : ''}
    <hr style="margin:10px 0;">
  </div>` : ''}

  <h1>📋 ORDEM DE SERVIÇO</h1>

  <div class="grid2">
    <div><span class="lbl">Número:</span> <strong style="font-size:1.1em;">OS-${ordem.id_os || 'N/A'}</strong></div>
    <div><span class="lbl">Data:</span> ${ordem.data_abertura ? new Date(ordem.data_abertura).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</div>
    <div><span class="lbl">Cliente:</span> <strong>${nomeCliente}</strong></div>
    <div><span class="lbl">Técnico:</span> ${nomeTecnico}</div>
    <div><span class="lbl">Status:</span> <span style="background:${getStatusColor(statusInfo.cor)};color:white;padding:3px 10px;border-radius:12px;font-size:.85em;">${statusInfo.nome}</span></div>
    ${ordem.solicitante ? `<div><span class="lbl">Solicitante:</span> ${ordem.solicitante}</div>` : ''}
    ${ordem.cliente_telefone ? `<div><span class="lbl">Telefone:</span> ${ordem.cliente_telefone}</div>` : ''}
    ${ordem.cliente_cpf_cnpj ? `<div><span class="lbl">CPF/CNPJ:</span> ${ordem.cliente_cpf_cnpj}</div>` : ''}
  </div>

  ${ordem.descricao_problema ? `<div class="sec"><strong>📝 Problema / Observações:</strong><div style="margin-top:6px;white-space:pre-wrap;">${ordem.descricao_problema}</div></div>` : ''}
  ${ordem.laudo_tecnico ? `<div class="sec" style="border-color:#ff9800;background:#fff3e0;"><strong style="color:#e65100;">🔧 Laudo Técnico:</strong><div style="margin-top:6px;white-space:pre-wrap;">${ordem.laudo_tecnico}</div></div>` : ''}

  <h3>🛠️ Itens da Ordem de Serviço</h3>
  <table>
    <thead><tr>
      <th style="width:11%">Tipo</th><th style="width:35%">Descrição</th>
      <th style="width:8%;text-align:center">Qtd</th><th style="width:14%;text-align:right">Vlr. Unit.</th>
      <th style="width:12%;text-align:right">Desc.</th><th style="width:17%;text-align:right">Total</th>
    </tr></thead>
    <tbody>${itensHtml.length > 0 ? itensHtml.join('') : '<tr><td colspan="6" style="text-align:center;color:#999;padding:16px;">Nenhum item</td></tr>'}</tbody>
  </table>

  <div class="total">💰 VALOR TOTAL: R$ ${totalGeral.toFixed(2)}</div>

  ${fotosHtml}
  ${assinaturaHtml}

  <div class="footer">
    Impresso em: ${new Date().toLocaleString('pt-BR')}
    ${rodapeTexto ? `<br>${rodapeTexto}` : ''}
  </div>
</body></html>`;
  };

  // Template térmico para Ordem de Serviço (papel estreito)
  const gerarConteudoImpressaoTermica = (ordem) => {
    const largura = configImpressao.largura_termica || '80mm';
    const rodapeTexto = configImpressao.observacao_rodape || '';
    const nomeCliente = ordem.cliente_nome || ordem.nome_cliente || 'N/A';
    const nomeTecnico = ordem.tecnico_nome || ordem.nome_tecnico || ordem.vendedor_nome || 'N/A';
    const statusInfo = getStatusInfo(ordem);
    const empresa = ordem.empresa_info || {};

    // Itens de Produtos
    const linhasProdutos = [];
    let subtotalProdutos = 0;
    if (ordem.itens_produtos && Array.isArray(ordem.itens_produtos)) {
      ordem.itens_produtos.forEach(item => {
        const qty = parseFloat(item.quantidade || 0);
        const vlr = parseFloat(item.valor_unitario || 0);
        const desc = parseFloat(item.desconto || 0);
        const total = qty * vlr - desc;
        subtotalProdutos += total;
        linhasProdutos.push(`<div class="item">
          <div class="item-nome">${item.produto_nome || item.descricao || 'Produto'}</div>
          <table><tr>
            <td class="item-detalhe">${qty.toFixed(2)} x ${vlr.toFixed(2)}</td>
            <td class="right bold">R$ ${total.toFixed(2)}</td>
          </tr></table>
          ${desc > 0 ? `<div class="item-desc">Desc: -R$ ${desc.toFixed(2)}</div>` : ''}
        </div>`);
      });
    }

    // Itens de Serviços
    const linhasServicos = [];
    let subtotalServicos = 0;
    if (ordem.itens_servicos && Array.isArray(ordem.itens_servicos)) {
      ordem.itens_servicos.forEach(item => {
        const qty = parseFloat(item.quantidade || 0);
        const vlr = parseFloat(item.valor_unitario || 0);
        const desc = parseFloat(item.desconto || 0);
        const total = qty * vlr - desc;
        subtotalServicos += total;
        const nomeServico = item.servico_nome || item.descricao_servico || item.produto_nome || item.descricao || 'Serviço';
        linhasServicos.push(`<div class="item">
          <div class="item-nome">${nomeServico}</div>
          ${item.tecnico_nome ? `<div class="item-desc">Téc: ${item.tecnico_nome}</div>` : ''}
          <table><tr>
            <td class="item-detalhe">${qty.toFixed(2)} x ${vlr.toFixed(2)}</td>
            <td class="right bold">R$ ${total.toFixed(2)}</td>
          </tr></table>
          ${desc > 0 ? `<div class="item-desc">Desc: -R$ ${desc.toFixed(2)}</div>` : ''}
        </div>`);
      });
    }

    const totalGeral = parseFloat(ordem.valor_total_os || 0) || (subtotalProdutos + subtotalServicos);
    const descontoTotal = parseFloat(ordem.valor_desconto || 0);

    return `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @media print {
            @page { size: ${largura} auto; margin: 0; }
            body { margin: 0; padding: 2mm 3mm; }
          }
          body { font-family: 'Courier New', monospace; font-size: 9pt; width: ${largura}; margin: 0 auto; padding: 2mm 3mm; line-height: 1.3; color: #000; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .right { text-align: right; }
          .linha { border-top: 1px dashed #000; margin: 2mm 0; }
          .linha-dupla { border-top: 2px solid #000; margin: 2mm 0; }
          .empresa-nome { font-size: 12pt; font-weight: bold; margin: 1mm 0; letter-spacing: 0.5px; }
          .empresa-detalhe { font-size: 7pt; margin: 0.3mm 0; color: #333; }
          .titulo-os { font-size: 11pt; font-weight: bold; margin: 1mm 0; letter-spacing: 1px; border: 1px solid #000; padding: 1mm 0; }
          .numero-os { font-size: 13pt; font-weight: bold; }
          .secao-titulo { font-size: 8pt; font-weight: bold; margin: 1.5mm 0 0.5mm 0; text-transform: uppercase; letter-spacing: 0.5px; background: #000; color: #fff; padding: 0.5mm 1mm; }
          .info { margin: 0.3mm 0; font-size: 8pt; }
          .info-label { font-weight: bold; }
          .item { margin: 1.5mm 0; padding-bottom: 1mm; border-bottom: 1px dotted #ccc; }
          .item:last-child { border-bottom: none; }
          .item-nome { font-weight: bold; font-size: 8.5pt; }
          .item-detalhe { font-size: 8pt; color: #333; }
          .item-desc { font-size: 7pt; color: #666; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 0; vertical-align: top; }
          .subtotal-row { font-size: 8pt; }
          .total-box { padding: 1.5mm 0; margin: 1mm 0; }
          .total-valor { font-size: 13pt; font-weight: bold; }
          .obs-box { font-size: 7.5pt; padding: 1mm; border: 1px dotted #999; margin: 1.5mm 0; white-space: pre-wrap; word-wrap: break-word; }
          .assinatura { margin-top: 6mm; }
          .assinatura-linha { border-top: 1px solid #000; margin: 0 5mm; padding-top: 0.5mm; font-size: 7pt; text-align: center; }
          .rodape { margin-top: 3mm; font-size: 7pt; color: #666; }
        </style>
      </head>
      <body>
        <!-- CABEÇALHO EMPRESA -->
        <div class="center">
          <div class="empresa-nome">${empresa.nome || ordem.empresa_nome || 'EMPRESA'}</div>
          ${empresa.cnpj ? `<div class="empresa-detalhe">CNPJ: ${empresa.cnpj}</div>` : ''}
          ${empresa.endereco ? `<div class="empresa-detalhe">${empresa.endereco}</div>` : ''}
          ${empresa.telefone ? `<div class="empresa-detalhe">Fone: ${empresa.telefone}</div>` : ''}
        </div>

        <div class="linha-dupla"></div>

        <!-- TÍTULO E NÚMERO DA OS -->
        <div class="center">
          <div class="titulo-os">ORDEM DE SERVIÇO</div>
          <div class="numero-os">Nº ${ordem.id_os || '---'}</div>
        </div>

        <div class="linha-dupla"></div>

        <!-- DADOS DA OS -->
        <div class="info"><span class="info-label">Data:</span> ${ordem.data_abertura ? new Date(ordem.data_abertura).toLocaleDateString('pt-BR') + ' ' + new Date(ordem.data_abertura).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('pt-BR')}</div>
        ${ordem.data_finalizacao ? `<div class="info"><span class="info-label">Previsão:</span> ${new Date(ordem.data_finalizacao + 'T00:00:00').toLocaleDateString('pt-BR')}</div>` : ''}
        <div class="info"><span class="info-label">Status:</span> ${statusInfo?.nome || ordem.status_os || 'N/A'}</div>
        ${ordem.solicitante ? `<div class="info"><span class="info-label">Solicitante:</span> ${ordem.solicitante}</div>` : ''}

        <div class="linha"></div>

        <!-- DADOS DO CLIENTE -->
        <div class="secao-titulo">CLIENTE</div>
        <div class="info"><span class="info-label">Nome:</span> ${nomeCliente}</div>
        ${ordem.cliente_cpf_cnpj ? `<div class="info"><span class="info-label">CPF/CNPJ:</span> ${ordem.cliente_cpf_cnpj}</div>` : ''}
        ${ordem.cliente_telefone ? `<div class="info"><span class="info-label">Fone:</span> ${ordem.cliente_telefone}</div>` : ''}
        ${ordem.cliente_endereco ? `<div class="info"><span class="info-label">End:</span> ${ordem.cliente_endereco}</div>` : ''}

        <div class="linha"></div>

        <!-- TÉCNICO -->
        <div class="info"><span class="info-label">Técnico:</span> ${nomeTecnico}</div>

        <!-- DESCRIÇÃO DO PROBLEMA -->
        ${ordem.descricao_problema ? `
          <div class="linha"></div>
          <div class="secao-titulo">PROBLEMA / DEFEITO</div>
          <div class="obs-box">${ordem.descricao_problema}</div>
        ` : ''}

        <!-- LAUDO TÉCNICO -->
        ${ordem.laudo_tecnico ? `
          <div class="secao-titulo">LAUDO TÉCNICO</div>
          <div class="obs-box">${ordem.laudo_tecnico}</div>
        ` : ''}

        <!-- PRODUTOS -->
        ${linhasProdutos.length > 0 ? `
          <div class="linha"></div>
          <div class="secao-titulo">PRODUTOS / MATERIAIS</div>
          ${linhasProdutos.join('')}
          <table class="subtotal-row"><tr>
            <td class="bold">Subtotal Produtos:</td>
            <td class="right bold">R$ ${subtotalProdutos.toFixed(2)}</td>
          </tr></table>
        ` : ''}

        <!-- SERVIÇOS -->
        ${linhasServicos.length > 0 ? `
          <div class="linha"></div>
          <div class="secao-titulo">SERVIÇOS</div>
          ${linhasServicos.join('')}
          <table class="subtotal-row"><tr>
            <td class="bold">Subtotal Serviços:</td>
            <td class="right bold">R$ ${subtotalServicos.toFixed(2)}</td>
          </tr></table>
        ` : ''}

        <!-- TOTAIS -->
        <div class="linha-dupla"></div>
        <div class="total-box">
          ${descontoTotal > 0 ? `
            <table><tr>
              <td class="info">Desconto:</td>
              <td class="right info">- R$ ${descontoTotal.toFixed(2)}</td>
            </tr></table>
          ` : ''}
          <table><tr>
            <td class="bold" style="font-size:10pt;">TOTAL:</td>
            <td class="right total-valor">R$ ${totalGeral.toFixed(2)}</td>
          </tr></table>
        </div>
        <div class="linha-dupla"></div>

        <!-- ASSINATURAS -->
        <div class="assinatura">
          <div class="assinatura-linha">Cliente</div>
        </div>
        <div class="assinatura" style="margin-top: 5mm;">
          <div class="assinatura-linha">Técnico Responsável</div>
        </div>

        <!-- RODAPÉ -->
        <div class="linha"></div>
        <div class="center rodape">
          Impresso em: ${new Date().toLocaleString('pt-BR')}
          ${rodapeTexto ? `<br>${rodapeTexto}` : ''}
        </div>
      </body>
      </html>
    `;
  };

  const getStatusInfo = (ordem) => {
    // Se tem status_info (vindo da API com informações completas)
    if (ordem.status_info) {
      return {
        nome: ordem.status_info.nome,
        cor: ordem.status_info.cor
      };
    }

    // Se tem id_status, buscar na lista
    if (ordem.id_status) {
      const statusEncontrado = statusList.find(s => s.id_status === ordem.id_status);
      if (statusEncontrado) {
        return {
          nome: statusEncontrado.nome_status,
          cor: statusEncontrado.cor
        };
      }
    }

    // Fallback: usar status_os (campo legado)
    if (ordem.status_os) {
      const statusEncontrado = statusList.find(s => s.nome_status === ordem.status_os);
      if (statusEncontrado) {
        return {
          nome: statusEncontrado.nome_status,
          cor: statusEncontrado.cor
        };
      }
      return {
        nome: ordem.status_os,
        cor: 'default'
      };
    }

    return { nome: 'Sem Status', cor: 'default' };
  };

  const getStatusColor = (cor) => {
    const coresMUI = {
      'primary': '#1976d2',
      'success': '#2e7d32',
      'error': '#d32f2f',
      'warning': '#ed6c02',
      'info': '#0288d1'
    };
    return coresMUI[cor] || '#9e9e9e';
  };

  // Verificar permissões
  if (authLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  if (!user?.is_staff && !permissions?.ordens_acessar) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Você não tem permissão para acessar esta página.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BuildIcon sx={{ fontSize: 40, color: '#2196F3' }} />
          <Typography variant="h4" fontWeight="bold">
            Ordem de Serviço
          </Typography>
        </Box>
        {abaPrincipal === 0 && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={novaOrdem}
            sx={{
              backgroundColor: '#2196F3',
              '&:hover': { backgroundColor: '#1976D2' }
            }}
          >
            Nova Ordem
          </Button>
        </Box>
        )}
      </Box>

      {/* Abas principais */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={abaPrincipal} onChange={(_, v) => setAbaPrincipal(v)}
          variant="fullWidth"
          sx={{ '& .MuiTab-root': { fontWeight: 600 } }}
        >
          <Tab icon={<BuildIcon />} iconPosition="start" label="Ordens de Serviço" />
          <Tab icon={<AnalyticsIcon />} iconPosition="start" label="Dashboard BI" />
        </Tabs>
      </Paper>

      {abaPrincipal === 1 && <DashboardBIOS />}

      {abaPrincipal === 0 && (<>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Filtros:
          </Typography>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="todos">📋 Todos</MenuItem>
              <MenuItem value="abertas">🔓 Abertas</MenuItem>
              <MenuItem value="fechadas">🔒 Fechadas</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              label="Período"
            >
              <MenuItem value={10}>📅 Últimos 10 dias</MenuItem>
              <MenuItem value={12}>📅 Últimos 12 dias</MenuItem>
              <MenuItem value={30}>📅 Últimos 30 dias</MenuItem>
              <MenuItem value={0}>📅 Todos os períodos</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Pesquisar por número, cliente..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Chip
            label={`${ordens.filter(ordem => {
              // Filtro de status
              if (filtroStatus === 'abertas') {
                const statusInfo = getStatusInfo(ordem);
                const statusNome = statusInfo.nome.toLowerCase();
                if (statusNome.includes('finalizada') || statusNome.includes('fechada') || statusNome.includes('cancelada')) {
                  return false;
                }
              } else if (filtroStatus === 'fechadas') {
                const statusInfo = getStatusInfo(ordem);
                const statusNome = statusInfo.nome.toLowerCase();
                if (!statusNome.includes('finalizada') && !statusNome.includes('fechada') && !statusNome.includes('cancelada')) {
                  return false;
                }
              }

              // Filtro de período
              if (filtroPeriodo > 0) {
                const dataOS = new Date(ordem.data_abertura || ordem.data_documento);
                const hoje = new Date();
                const diffTime = Math.abs(hoje - dataOS);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > filtroPeriodo) return false;
              }

              // Filtro de pesquisa
              if (pesquisa.trim()) {
                const termoPesquisa = pesquisa.toLowerCase();
                const numeroOS = `os-${ordem.id_os}`.toLowerCase();
                const cliente = (ordem.cliente_nome || '').toLowerCase();
                const vendedor = (ordem.vendedor_nome || ordem.tecnico_nome || '').toLowerCase();
                const observacao = (ordem.observacao || '').toLowerCase();
                const ocorrencia = (ordem.ocorrencia || '').toLowerCase();
                const solicitante = (ordem.solicitante || '').toLowerCase();

                if (!numeroOS.includes(termoPesquisa) &&
                  !cliente.includes(termoPesquisa) &&
                  !vendedor.includes(termoPesquisa) &&
                  !observacao.includes(termoPesquisa) &&
                  !ocorrencia.includes(termoPesquisa) &&
                  !solicitante.includes(termoPesquisa)) {
                  return false;
                }
              }

              return true;
            }).length} OS encontradas`}
            color="primary"
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* Lista de Ordens */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Número</strong></TableCell>
              <TableCell><strong>Data</strong></TableCell>
              <TableCell><strong>Cliente</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Total</strong></TableCell>
              {!!user?.parametros?.mostrar_lucratividade && (
                <TableCell align="right"><strong>Margem</strong></TableCell>
              )}
              <TableCell align="center"><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              const ordensFiltradas = ordens.filter(ordem => {
                // Filtro de status
                if (filtroStatus === 'abertas') {
                  const statusInfo = getStatusInfo(ordem);
                  const statusNome = statusInfo.nome.toLowerCase();
                  // Se contém palavras de finalização, não exibir
                  if (statusNome.includes('finalizada') || statusNome.includes('fechada') || statusNome.includes('cancelada')) {
                    return false;
                  }
                } else if (filtroStatus === 'fechadas') {
                  const statusInfo = getStatusInfo(ordem);
                  const statusNome = statusInfo.nome.toLowerCase();
                  // Se NÃO contém palavras de finalização, não exibir
                  if (!statusNome.includes('finalizada') && !statusNome.includes('fechada') && !statusNome.includes('cancelada')) {
                    return false;
                  }
                }

                // Filtro de período
                if (filtroPeriodo > 0) {
                  const dataOS = new Date(ordem.data_abertura || ordem.data_documento);
                  const hoje = new Date();
                  const diffTime = Math.abs(hoje - dataOS);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays > filtroPeriodo) return false;
                }

                // Filtro de pesquisa
                if (pesquisa.trim()) {
                  const termoPesquisa = pesquisa.toLowerCase();
                  const numeroOS = `os-${ordem.id_os}`.toLowerCase();
                  const cliente = (ordem.cliente_nome || '').toLowerCase();
                  const vendedor = (ordem.vendedor_nome || ordem.tecnico_nome || '').toLowerCase();
                  const observacao = (ordem.observacao || '').toLowerCase();
                  const ocorrencia = (ordem.ocorrencia || '').toLowerCase();
                  const solicitante = (ordem.solicitante || '').toLowerCase();

                  if (!numeroOS.includes(termoPesquisa) &&
                    !cliente.includes(termoPesquisa) &&
                    !vendedor.includes(termoPesquisa) &&
                    !observacao.includes(termoPesquisa) &&
                    !ocorrencia.includes(termoPesquisa) &&
                    !solicitante.includes(termoPesquisa)) {
                    return false;
                  }
                }

                return true;
              }).map((ordem) => (
                <TableRow key={ordem.id_os} hover>
                  <TableCell>OS-{ordem.id_os}</TableCell>
                  <TableCell>{ordem.data_abertura ? new Date(ordem.data_abertura).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  <TableCell>{ordem.cliente_nome || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusInfo(ordem).nome}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(getStatusInfo(ordem).cor),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">R$ {parseFloat(ordem.valor_total_os || 0).toFixed(2)}</TableCell>
                  {!!user?.parametros?.mostrar_lucratividade && (
                  <TableCell align="right">
                    {ordem.lucratividade && ordem.lucratividade.total_receita > 0 ? (
                      <Chip
                        label={`${parseFloat(ordem.lucratividade.margem_pct || 0).toFixed(1)}%`}
                        size="small"
                        sx={{
                          backgroundColor: (() => {
                            const m = parseFloat(ordem.lucratividade.margem_pct || 0);
                            if (m >= 30) return '#e8f5e9';
                            if (m >= 15) return '#fff8e1';
                            return '#fce4ec';
                          })(),
                          color: (() => {
                            const m = parseFloat(ordem.lucratividade.margem_pct || 0);
                            if (m >= 30) return '#2e7d32';
                            if (m >= 15) return '#f57f17';
                            return '#c62828';
                          })(),
                          fontWeight: 'bold',
                          border: '1px solid currentColor',
                        }}
                      />
                    ) : <Typography variant="caption" color="text.disabled">-</Typography>}
                  </TableCell>
                  )}
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => editarOrdem(ordem)}
                      title="Editar"
                      sx={{ color: '#2196F3' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => imprimirOrdem(ordem)}
                      title="Imprimir OS"
                      sx={{ color: '#2196F3' }}
                    >
                      <PrintIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => emitirNFSe(ordem)}
                      title="Emitir NFS-e"
                    >
                      <Avatar 
                        variant="rounded" 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          fontSize: '0.65rem', 
                          fontWeight: 'bold',
                          bgcolor: '#2e7d32',
                          color: 'white'
                        }}
                      >
                        NFS
                      </Avatar>
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => abrirNFeDialog(ordem)}
                      title="Emitir Nota Fiscal (NF-e)"
                    >
                      <Avatar 
                        variant="rounded" 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          fontSize: '0.65rem', 
                          fontWeight: 'bold',
                          bgcolor: '#1976d2',
                          color: 'white'
                        }}
                      >
                        NFe
                      </Avatar>
                    </IconButton>
                    <Tooltip title={ordem.status_nfse === 'Autorizada' ? 'Imprimir Nota de Serviço' : 'Emita a NFS-e primeiro para imprimir'}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => imprimirDPS(ordem)}
                          disabled={ordem.status_nfse !== 'Autorizada'}
                          title="Imprimir Nota de Serviço"
                          sx={{ 
                            color: ordem.status_nfse === 'Autorizada' ? '#ff9800' : '#ccc',
                          }}
                        >
                          <ReceiptIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={() => baixarXML(ordem)}
                      title="Baixar XML"
                      sx={{ color: '#607d8b' }}
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => enviarEmail(ordem)}
                      title="Enviar Email"
                      sx={{ color: '#0288d1' }}
                    >
                      <EmailIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => compartilharWhatsAppOS(ordem)}
                      title="Enviar via WhatsApp"
                      sx={{ color: '#25D366' }}
                    >
                      <WhatsAppIcon />
                    </IconButton>
                    {ordem.gera_financeiro && getStatusInfo(ordem).nome !== 'Aberta' && (
                      <IconButton
                        size="small"
                        onClick={() => cancelarOrdemServico(ordem)}
                        title="Cancelar Fechamento"
                        sx={{ color: '#FF9800' }}
                      >
                        <CancelIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => excluirOrdem(ordem.id_os)}
                      title="Excluir"
                      sx={{ color: '#F44336' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ));

              // Se não houver ordens ou se os filtros não retornarem nenhuma
              if (ordens.length === 0) {
                return (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        Nenhuma ordem de serviço cadastrada
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              } else if (ordensFiltradas.length === 0) {
                return (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        Nenhuma ordem encontrada com os filtros aplicados
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              }

              return ordensFiltradas;
            })()}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Criação/Edição */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#2196F3', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BuildIcon />
            {modoEdicao ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Tabs value={tabAtual} onChange={(e, v) => setTabAtual(v)} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
            <Tab label="Dados Principais" />
            <Tab label="Itens" />
            <Tab label="Observações" />
            <Tab
              label={
                <Badge badgeContent={fotosOS.length || null} color="primary">
                  📷 Fotos
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={assinaturaBase64 ? '✓' : null} color="success">
                  ✍️ Assinatura
                </Badge>
              }
            />
          </Tabs>

          {/* Tab 0 - Dados Principais */}
          {tabAtual === 0 && (
            <>
            <Grid container spacing={2}>
              {osBloqueadaParaEdicao && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <strong>⚠️ Ordem de Serviço Bloqueada</strong><br />
                    Esta OS não pode ser editada devido ao seu status atual. Somente visualização.
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Número do Documento"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  disabled={osBloqueadaParaEdicao}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Data do Documento"
                  type="date"
                  value={dataDocumento}
                  onChange={(e) => setDataDocumento(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={osBloqueadaParaEdicao}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status ?? ''}
                    onChange={handleStatusChange}
                    label="Status"
                    disabled={osBloqueadaParaEdicao}
                  >
                    {statusList.length > 0 ? (
                      statusList.map((st) => (
                        <MenuItem key={st.id_status} value={st.id_status}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={st.nome_status}
                              size="small"
                              color={st.cor || 'default'}
                              sx={{ minWidth: 100 }}
                            />
                            {st.gera_financeiro && (
                              <Chip
                                label="💰"
                                size="small"
                                color="success"
                                title="Gera financeiro"
                              />
                            )}
                          </Box>
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="">Carregando status...</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Operação</InputLabel>
                  <Select
                    value={operacao}
                    onChange={(e) => handleOperacaoChange(e.target.value)}
                    label="Operação"
                    disabled={osBloqueadaParaEdicao}
                  >
                    <MenuItem value="">Selecione...</MenuItem>
                    {operacoes.map((op) => (
                      <MenuItem key={op.id_operacao} value={op.id_operacao}>
                        {op.nome_operacao}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Cliente</InputLabel>
                  <Select
                    value={cliente}
                    onChange={(e) => handleClienteChange(e.target.value)}
                    label="Cliente"
                    disabled={osBloqueadaParaEdicao}
                  >
                    <MenuItem value="">Selecione...</MenuItem>
                    {clientes.map((cli) => (
                      <MenuItem key={cli.id_cliente} value={cli.id_cliente}>
                        {cli.nome_razao_social || cli.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {cliente && listaVeiculosCliente.length > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
                    <strong>Este cliente possui {listaVeiculosCliente.length} veículo(s)/animal(is)/equipamento(s) cadastrado(s).</strong>
                    <Button
                      size="small"
                      onClick={() => setOpenListaModal(true)}
                      sx={{ ml: 2 }}
                    >
                      Ver Lista
                    </Button>
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Técnico</InputLabel>
                  <Select
                    value={vendedor}
                    onChange={(e) => setVendedor(e.target.value)}
                    label="Técnico"
                    disabled={osBloqueadaParaEdicao}
                  >
                    <MenuItem value="">Selecione...</MenuItem>
                    {vendedores.map((tec) => (
                      <MenuItem key={tec.id_tecnico} value={tec.id_tecnico}>
                        {tec.nome_tecnico}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Solicitante"
                  value={solicitante}
                  onChange={(e) => setSolicitante(e.target.value)}
                  disabled={osBloqueadaParaEdicao}
                />
              </Grid>

              <Grid item xs={12} sm={10}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Atendimento</InputLabel>
                  <Select
                    value={tipoAtendimento}
                    onChange={(e) => setTipoAtendimento(e.target.value)}
                    label="Tipo de Atendimento"
                    disabled={osBloqueadaParaEdicao}
                  >
                    <MenuItem value="veiculo">Veículo</MenuItem>
                    <MenuItem value="animais">Animais</MenuItem>
                    <MenuItem value="equipamento">Equipamento</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, height: '56px' }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setOpenListaModal(true)}
                      disabled={!cliente || listaVeiculosCliente.length === 0}
                      sx={{ minWidth: '50px' }}
                      title="Ver lista de veículos/animais/equipamentos cadastrados"
                    >
                      📋
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => {
                        console.log('🔘 Botão + Novo clicado', { tipoAtendimento, cliente });
                        abrirCadastro(tipoAtendimento);
                      }}
                      disabled={!cliente}
                      sx={{
                        minWidth: '80px',
                        backgroundColor: !cliente ? '#ccc' : '#1976d2',
                        '&:hover': {
                          backgroundColor: !cliente ? '#ccc' : '#1565c0'
                        }
                      }}
                      title={!cliente ? 'Selecione um cliente primeiro' : 'Cadastrar novo veículo/animal/equipamento'}
                    >
                      + Novo
                    </Button>
                  </Box>
                  {!cliente && (
                    <Typography variant="caption" color="error" sx={{ textAlign: 'center', fontSize: '0.65rem' }}>
                      Selecione cliente
                    </Typography>
                  )}
                </Box>
              </Grid>

              {veiculoAnimalEquipamento && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, backgroundColor: tipoAtendimento === 'veiculo' ? '#e8f5e9' : '#e3f2fd', border: tipoAtendimento === 'veiculo' ? '1px solid #4caf50' : '1px solid #90caf9' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {veiculoAnimalEquipamento.tipo === 'veiculo' ? '🚗 Veículo Cadastrado' :
                          veiculoAnimalEquipamento.tipo === 'animais' ? '🐾 Animal Cadastrado' :
                            '🔧 Equipamento Cadastrado'}
                      </Typography>
                      <Button size="small" variant="outlined" onClick={() => setOpenListaModal(true)} sx={{ fontSize: '0.7rem' }}>
                        Trocar
                      </Button>
                    </Box>
                    <Grid container spacing={1}>
                      {veiculoAnimalEquipamento.tipo === 'veiculo' && (
                        <>
                          {/* Linha 1: identificação principal */}
                          <Grid item xs={6} sm={2}><Typography variant="body2"><strong>Placa:</strong> {veiculoAnimalEquipamento.placa || '—'}</Typography></Grid>
                          <Grid item xs={6} sm={2}><Typography variant="body2"><strong>Tipo:</strong> {veiculoAnimalEquipamento.tipo_veiculo || '—'}</Typography></Grid>
                          <Grid item xs={6} sm={2}><Typography variant="body2"><strong>Marca:</strong> {veiculoAnimalEquipamento.marca || '—'}</Typography></Grid>
                          <Grid item xs={6} sm={3}><Typography variant="body2"><strong>Modelo:</strong> {veiculoAnimalEquipamento.modelo || '—'}</Typography></Grid>
                          <Grid item xs={6} sm={1}><Typography variant="body2"><strong>Ano:</strong> {veiculoAnimalEquipamento.ano || '—'}</Typography></Grid>
                          <Grid item xs={6} sm={2}><Typography variant="body2"><strong>Cor:</strong> {veiculoAnimalEquipamento.cor || '—'}</Typography></Grid>
                          {/* Linha 2: dados técnicos */}
                          {(veiculoAnimalEquipamento.combustivel || veiculoAnimalEquipamento.motor || veiculoAnimalEquipamento.km_entrada) && (
                            <>
                              {veiculoAnimalEquipamento.combustivel && <Grid item xs={6} sm={3}><Typography variant="body2"><strong>Comb.:</strong> {veiculoAnimalEquipamento.combustivel}</Typography></Grid>}
                              {veiculoAnimalEquipamento.motor && <Grid item xs={6} sm={2}><Typography variant="body2"><strong>Motor:</strong> {veiculoAnimalEquipamento.motor}</Typography></Grid>}
                              {veiculoAnimalEquipamento.km_entrada && <Grid item xs={6} sm={3}><Typography variant="body2"><strong>KM Entrada:</strong> {Number(veiculoAnimalEquipamento.km_entrada).toLocaleString()} km</Typography></Grid>}
                              {veiculoAnimalEquipamento.km_saida && <Grid item xs={6} sm={2}><Typography variant="body2"><strong>KM Saída:</strong> {Number(veiculoAnimalEquipamento.km_saida).toLocaleString()} km</Typography></Grid>}
                              {veiculoAnimalEquipamento.chassi && <Grid item xs={12} sm={6}><Typography variant="body2"><strong>Chassi:</strong> {veiculoAnimalEquipamento.chassi}</Typography></Grid>}
                            </>
                          )}
                        </>
                      )}
                      {veiculoAnimalEquipamento.tipo === 'animais' && (
                        <>
                          <Grid item xs={12} sm={3}><Typography variant="body2"><strong>Nome:</strong> {veiculoAnimalEquipamento.nome}</Typography></Grid>
                          <Grid item xs={12} sm={3}><Typography variant="body2"><strong>Espécie:</strong> {veiculoAnimalEquipamento.especie}</Typography></Grid>
                          <Grid item xs={12} sm={3}><Typography variant="body2"><strong>Raça:</strong> {veiculoAnimalEquipamento.raca}</Typography></Grid>
                          <Grid item xs={12} sm={3}><Typography variant="body2"><strong>Idade:</strong> {veiculoAnimalEquipamento.idade}</Typography></Grid>
                        </>
                      )}
                      {veiculoAnimalEquipamento.tipo === 'equipamento' && (
                        <>
                          <Grid item xs={12} sm={3}><Typography variant="body2"><strong>Descrição:</strong> {veiculoAnimalEquipamento.descricao}</Typography></Grid>
                          <Grid item xs={12} sm={3}><Typography variant="body2"><strong>Fabricante:</strong> {veiculoAnimalEquipamento.fabricante}</Typography></Grid>
                          <Grid item xs={12} sm={3}><Typography variant="body2"><strong>Nº Série:</strong> {veiculoAnimalEquipamento.numeroSerie}</Typography></Grid>
                          <Grid item xs={12} sm={3}><Typography variant="body2"><strong>Patrimônio:</strong> {veiculoAnimalEquipamento.patrimonio}</Typography></Grid>
                        </>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              )}
            </Grid>

            {/* ── Checklist de Inspeção Visual (apenas quando for veículo) ── */}
            {tipoAtendimento === 'veiculo' && tabAtual === 0 && (
              <Box sx={{ mt: 2 }}>
                <Paper sx={{ p: 2, border: '1px solid #ff9800', backgroundColor: '#fff8e1' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#e65100', display: 'flex', alignItems: 'center', gap: 1 }}>
                    🔍 Ficha de Inspeção Visual do Veículo
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Marque cada item como <strong>OK</strong> (Conforme), <strong>NOK</strong> (Não Conforme) ou <strong>N/A</strong> (Não Aplicável)
                  </Typography>
                  <Grid container spacing={1}>
                    {checklistItens.map((item) => (
                      <Grid item xs={12} sm={6} key={item.key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #ffe082' }}>
                          <Typography variant="body2" sx={{ flex: 1 }}>{item.label}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {['OK', 'NOK', 'NA'].map((opcao) => (
                              <Button
                                key={opcao}
                                size="small"
                                variant={checklistVeiculo[item.key] === opcao ? 'contained' : 'outlined'}
                                onClick={() => setChecklistVeiculo(prev => ({ ...prev, [item.key]: opcao }))}
                                sx={{
                                  minWidth: 40,
                                  fontSize: '0.65rem',
                                  px: 0.5,
                                  color: checklistVeiculo[item.key] === opcao
                                    ? '#fff'
                                    : opcao === 'OK' ? '#2e7d32' : opcao === 'NOK' ? '#c62828' : '#616161',
                                  backgroundColor: checklistVeiculo[item.key] === opcao
                                    ? opcao === 'OK' ? '#2e7d32' : opcao === 'NOK' ? '#c62828' : '#616161'
                                    : 'transparent',
                                  borderColor: opcao === 'OK' ? '#2e7d32' : opcao === 'NOK' ? '#c62828' : '#bdbdbd',
                                  '&:hover': {
                                    backgroundColor: opcao === 'OK' ? '#388e3c' : opcao === 'NOK' ? '#d32f2f' : '#757575',
                                    color: '#fff',
                                  }
                                }}
                              >
                                {opcao}
                              </Button>
                            ))}
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Observações de Entrada / Avarias Visíveis"
                      value={observacoesEntrada}
                      onChange={(e) => setObservacoesEntrada(e.target.value)}
                      placeholder="Ex: Arranhado na porta dianteira esquerda, para-choque traseiro danificado..."
                      size="small"
                    />
                  </Box>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setChecklistVeiculo(checklistVazio())}
                      sx={{ fontSize: '0.72rem' }}
                    >
                      Limpar Checklist
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => setChecklistVeiculo(Object.fromEntries(checklistItens.map(i => [i.key, 'OK'])))}
                      sx={{ fontSize: '0.72rem' }}
                    >
                      Marcar Tudo OK
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}
            </>
          )}

          {/* Tab 1 - Itens */}
          {tabAtual === 1 && (
            <Box>
              <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Adicionar Item
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo</InputLabel>
                      <Select
                        value={itemAtual.tipo_item}
                        onChange={(e) => setItemAtual({ ...itemAtual, tipo_item: e.target.value, id_produto: null, descricao: '' })}
                        label="Tipo"
                      >
                        <MenuItem value="produto">Produto</MenuItem>
                        <MenuItem value="servico">Serviço</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    {itemAtual.tipo_item === 'produto' ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Produto</InputLabel>
                        <Select
                          value={itemAtual.descricao}
                          onChange={(e) => {
                            console.log('🛒 Produto selecionado:', e.target.value);
                            const produtoSelecionado = produtos.find(p => {
                              const descProduto = p.descricao || p.nome_produto || `Produto ${p.codigo_produto}`;
                              return descProduto === e.target.value;
                            });
                            console.log('📦 Produto encontrado:', produtoSelecionado);

                            // Pegar valor_venda do estoque (primeiro depósito com estoque)
                            let valorVenda = 0;
                            if (produtoSelecionado?.estoque_por_deposito && produtoSelecionado.estoque_por_deposito.length > 0) {
                              // Procurar depósito com estoque e valor
                              const estoqueComValor = produtoSelecionado.estoque_por_deposito.find(e => e.valor_venda > 0);
                              valorVenda = estoqueComValor?.valor_venda || produtoSelecionado.estoque_por_deposito[0].valor_venda || 0;
                              console.log('💰 Valor venda do estoque:', valorVenda);
                            }

                            setItemAtual({
                              ...itemAtual,
                              id_produto: produtoSelecionado?.id_produto || null,
                              descricao: e.target.value,
                              valorUnitario: valorVenda
                            });
                          }}
                          onOpen={() => {
                            console.log('📋 Lista de produtos aberta. Total:', produtos.length);
                            console.log('📦 Produtos:', produtos);
                            // Log detalhado dos 3 primeiros produtos
                            if (produtos.length > 0) {
                              console.log('📦 Exemplo produto 1:', produtos[0]);
                              console.log('  - descricao:', produtos[0].descricao);
                              console.log('  - nome_produto:', produtos[0].nome_produto);
                              console.log('  - codigo_produto:', produtos[0].codigo_produto);
                              console.log('  - estoque_por_deposito:', produtos[0].estoque_por_deposito);
                            }
                          }}
                          label="Produto"
                        >
                          <MenuItem value="">Selecione um produto...</MenuItem>
                          {produtos.length === 0 && (
                            <MenuItem disabled>
                              <em>Nenhum produto cadastrado</em>
                            </MenuItem>
                          )}
                          {produtos.map((prod) => {
                            const descricao = prod.descricao || prod.nome_produto || `Produto ${prod.codigo_produto}`;

                            // Pegar valor_venda do estoque
                            let valorVenda = 0;
                            let qtdEstoque = 0;
                            if (prod.estoque_por_deposito && prod.estoque_por_deposito.length > 0) {
                              const estoqueComValor = prod.estoque_por_deposito.find(e => e.valor_venda > 0);
                              valorVenda = estoqueComValor?.valor_venda || prod.estoque_por_deposito[0].valor_venda || 0;
                              qtdEstoque = prod.estoque_total || 0;
                            }

                            return (
                              <MenuItem key={prod.id_produto} value={descricao}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                  <span>
                                    {prod.codigo_produto && `[${prod.codigo_produto}] `}
                                    {descricao}
                                  </span>
                                  <Box sx={{ display: 'flex', gap: 2, ml: 2 }}>
                                    <Chip
                                      label={`Estoque: ${qtdEstoque}`}
                                      size="small"
                                      color={qtdEstoque > 0 ? 'success' : 'error'}
                                      sx={{ fontSize: '0.75rem' }}
                                    />
                                    <Chip
                                      label={`R$ ${(parseFloat(valorVenda) || 0).toFixed(2)}`}
                                      size="small"
                                      color="primary"
                                      sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                                    />
                                  </Box>
                                </Box>
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    ) : (
                      <FormControl fullWidth size="small">
                        <InputLabel>Serviço</InputLabel>
                        <Select
                          value={itemAtual.descricao}
                          onChange={(e) => {
                            console.log('🔧 Serviço selecionado:', e.target.value);
                            const servicoSelecionado = produtos.find(p => {
                              const descProduto = p.descricao || p.nome_produto || `Produto ${p.codigo_produto}`;
                              return descProduto === e.target.value;
                            });
                            console.log('📋 Serviço encontrado:', servicoSelecionado);

                            // Pegar valor_venda do estoque (primeiro depósito com estoque)
                            let valorVenda = 0;
                            if (servicoSelecionado?.estoque_por_deposito && servicoSelecionado.estoque_por_deposito.length > 0) {
                              const estoqueComValor = servicoSelecionado.estoque_por_deposito.find(e => e.valor_venda > 0);
                              valorVenda = estoqueComValor?.valor_venda || servicoSelecionado.estoque_por_deposito[0].valor_venda || 0;
                              console.log('💰 Valor serviço:', valorVenda);
                            }

                            setItemAtual({
                              ...itemAtual,
                              id_produto: servicoSelecionado?.id_produto || null,
                              descricao: e.target.value,
                              valorUnitario: valorVenda
                            });
                          }}
                          label="Serviço"
                        >
                          <MenuItem value="">Selecione um serviço...</MenuItem>
                          {produtos.filter(p => p.classificacao === 'Servico').length === 0 && (
                            <MenuItem disabled>
                              <em>Nenhum serviço cadastrado (produtos com classificação "servico")</em>
                            </MenuItem>
                          )}
                          {produtos
                            .filter(p => p.classificacao === 'Servico')
                            .map((prod) => {
                              const descricao = prod.descricao || prod.nome_produto || `Produto ${prod.codigo_produto}`;

                              // Calcular estoque total
                              let qtdEstoque = 0;
                              let valorVenda = 0;

                              if (prod.estoque_por_deposito && Array.isArray(prod.estoque_por_deposito)) {
                                qtdEstoque = prod.estoque_por_deposito.reduce((sum, est) => sum + (parseFloat(est.quantidade) || 0), 0);
                                const estoqueComValor = prod.estoque_por_deposito.find(e => e.valor_venda > 0);
                                valorVenda = estoqueComValor?.valor_venda || prod.estoque_por_deposito[0]?.valor_venda || 0;
                              }

                              return (
                                <MenuItem key={prod.id_produto} value={descricao}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <span>
                                      {prod.codigo_produto && `[${prod.codigo_produto}] `}
                                      {descricao}
                                    </span>
                                    <Chip
                                      label={`R$ ${(parseFloat(valorVenda) || 0).toFixed(2)}`}
                                      size="small"
                                      color="primary"
                                      sx={{ fontSize: '0.75rem', fontWeight: 'bold', ml: 2 }}
                                    />
                                  </Box>
                                </MenuItem>
                              );
                            })}
                        </Select>
                      </FormControl>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Quantidade"
                      type="number"
                      value={itemAtual.quantidade}
                      onChange={(e) => setItemAtual({ ...itemAtual, quantidade: parseFloat(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Vlr. Unitário"
                      type="number"
                      value={itemAtual.valorUnitario}
                      onChange={(e) => setItemAtual({ ...itemAtual, valorUnitario: parseFloat(e.target.value) || 0 })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Desconto"
                      type="number"
                      value={itemAtual.desconto}
                      onChange={(e) => setItemAtual({ ...itemAtual, desconto: parseFloat(e.target.value) || 0 })}
                      onFocus={(e) => {
                        if (parseFloat(e.target.value) === 0) {
                          setItemAtual({ ...itemAtual, desconto: '' });
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '' || e.target.value === null) {
                          setItemAtual({ ...itemAtual, desconto: 0 });
                        }
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>
                      }}
                      disabled={osBloqueadaParaEdicao}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#fff3e0',
                          '&:hover': { backgroundColor: '#ffe0b2' }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={adicionarItem}
                      sx={{ height: '40px' }}
                      disabled={osBloqueadaParaEdicao}
                    >
                      <AddIcon />
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Tipo</strong></TableCell>
                      <TableCell><strong>Descrição</strong></TableCell>
                      <TableCell align="center"><strong>Qtd</strong></TableCell>
                      <TableCell align="right"><strong>Vlr. Unit.</strong></TableCell>
                      <TableCell align="right"><strong>Desconto</strong></TableCell>
                      <TableCell align="right"><strong>Total</strong></TableCell>
                      <TableCell align="center"><strong>Ação</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itens.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="text.secondary">
                            Nenhum item adicionado
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Chip
                              label={item.tipo}
                              size="small"
                              color={item.tipo === 'produto' ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell align="center">{item.quantidade}</TableCell>
                          <TableCell align="right">R$ {(parseFloat(item.valorUnitario) || 0).toFixed(2)}</TableCell>
                          <TableCell align="right">R$ {(parseFloat(item.desconto) || 0).toFixed(2)}</TableCell>
                          <TableCell align="right">R$ {(parseFloat(item.valorTotal) || 0).toFixed(2)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => removerItem(item.id)}
                              sx={{ color: '#F44336' }}
                              disabled={osBloqueadaParaEdicao}
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

              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1" sx={{ minWidth: '180px', textAlign: 'right' }}>
                    <strong>Subtotal Produtos:</strong>
                  </Typography>
                  <Typography variant="h6">
                    R$ {calcularSubtotalProdutos().toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1" sx={{ minWidth: '180px', textAlign: 'right' }}>
                    <strong>Desconto Produtos:</strong>
                  </Typography>
                  <Select
                    size="small"
                    value={tipoDescontoProdutos}
                    onChange={(e) => {
                      setTipoDescontoProdutos(e.target.value);
                      distribuirDescontoProporcional(descontoProdutos, e.target.value, 'produto');
                    }}
                    disabled={osBloqueadaParaEdicao}
                    sx={{ width: '120px', mr: 1 }}
                  >
                    <MenuItem value="valor">R$ Valor</MenuItem>
                    <MenuItem value="porcentagem">% Porcentagem</MenuItem>
                  </Select>
                  <TextField
                    size="medium"
                    type="number"
                    value={descontoProdutos}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0;
                      setDescontoProdutos(valor);
                      distribuirDescontoProporcional(valor, tipoDescontoProdutos, 'produto');
                    }}
                    onFocus={(e) => {
                      if (parseFloat(e.target.value) === 0) {
                        setDescontoProdutos('');
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || e.target.value === null) {
                        setDescontoProdutos(0);
                        distribuirDescontoProporcional(0, tipoDescontoProdutos, 'produto');
                      }
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{tipoDescontoProdutos === 'valor' ? 'R$' : '%'}</InputAdornment>
                    }}
                    sx={{
                      width: '200px',
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#e3f2fd',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: '#bbdefb' },
                        '&.Mui-focused': { backgroundColor: '#90caf9' }
                      }
                    }}
                    disabled={osBloqueadaParaEdicao}
                  />
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    = R$ {calcularDescontoRealProdutos().toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1" sx={{ minWidth: '180px', textAlign: 'right' }}>
                    <strong>Subtotal Serviços:</strong>
                  </Typography>
                  <Typography variant="h6">
                    R$ {calcularSubtotalServicos().toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1" sx={{ minWidth: '180px', textAlign: 'right' }}>
                    <strong>Desconto Serviços:</strong>
                  </Typography>
                  <Select
                    size="small"
                    value={tipoDescontoServicos}
                    onChange={(e) => {
                      setTipoDescontoServicos(e.target.value);
                      distribuirDescontoProporcional(descontoServicos, e.target.value, 'servico');
                    }}
                    disabled={osBloqueadaParaEdicao}
                    sx={{ width: '120px', mr: 1 }}
                  >
                    <MenuItem value="valor">R$ Valor</MenuItem>
                    <MenuItem value="porcentagem">% Porcentagem</MenuItem>
                  </Select>
                  <TextField
                    size="medium"
                    type="number"
                    value={descontoServicos}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0;
                      setDescontoServicos(valor);
                      distribuirDescontoProporcional(valor, tipoDescontoServicos, 'servico');
                    }}
                    onFocus={(e) => {
                      if (parseFloat(e.target.value) === 0) {
                        setDescontoServicos('');
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || e.target.value === null) {
                        setDescontoServicos(0);
                        distribuirDescontoProporcional(0, tipoDescontoServicos, 'servico');
                      }
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{tipoDescontoServicos === 'valor' ? 'R$' : '%'}</InputAdornment>
                    }}
                    sx={{
                      width: '200px',
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f3e5f5',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: '#e1bee7' },
                        '&.Mui-focused': { backgroundColor: '#ce93d8' }
                      }
                    }}
                    disabled={osBloqueadaParaEdicao}
                  />
                  <Typography variant="h6" color="secondary" fontWeight="bold">
                    = R$ {calcularDescontoRealServicos().toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 2, borderTop: '2px solid #1976d2' }}>
                  <Typography variant="body1" sx={{ minWidth: '180px', textAlign: 'right' }}>
                    <strong>TOTAL:</strong>
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    R$ {calcularTotal().toFixed(2)}
                  </Typography>
                </Box>

                {/* Bloco de Lucratividade */}
                {modoEdicao && temDadosCusto() && !!user?.parametros?.mostrar_lucratividade && (
                  <Box sx={{
                    mt: 2, p: 2, borderRadius: 2,
                    backgroundColor: (() => {
                      const m = calcularMargem();
                      if (m >= 30) return '#e8f5e9';
                      if (m >= 15) return '#fff8e1';
                      return '#fce4ec';
                    })(),
                    border: (() => {
                      const m = calcularMargem();
                      if (m >= 30) return '1.5px solid #4caf50';
                      if (m >= 15) return '1.5px solid #ffc107';
                      return '1.5px solid #e91e63';
                    })()
                  }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                      📊 Lucratividade (produtos)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Custo Total Produtos</Typography>
                        <Typography variant="body1" fontWeight="bold" color="error.main">
                          R$ {calcularCustoTotalProdutos().toFixed(2)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Lucro Bruto</Typography>
                        <Typography variant="body1" fontWeight="bold" color={calcularLucro() >= 0 ? 'success.main' : 'error.main'}>
                          R$ {calcularLucro().toFixed(2)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Margem</Typography>
                        <Typography variant="h6" fontWeight="bold" color={(() => {
                          const m = calcularMargem();
                          if (m >= 30) return 'success.main';
                          if (m >= 15) return 'warning.main';
                          return 'error.main';
                        })()}>
                          {calcularMargem().toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Tab 2 - Observações */}
          {tabAtual === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observação"
                  multiline
                  rows={4}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Observações gerais sobre a ordem de serviço..."
                  disabled={osBloqueadaParaEdicao}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ocorrência"
                  multiline
                  rows={4}
                  value={ocorrencia}
                  onChange={(e) => setOcorrencia(e.target.value)}
                  placeholder="Descreva a ocorrência ou problema relatado..."
                  disabled={osBloqueadaParaEdicao}
                />
              </Grid>
            </Grid>
          )}

          {/* Tab 3 - Fotos */}
          {tabAtual === 3 && (
            <Box>
              {/* input file oculto - fallback web */}
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={aoSelecionarArquivo}
              />

              {/* Botões de ação */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={carregandoFoto ? <CircularProgress size={18} color="inherit" /> : <CameraAltIcon />}
                  onClick={tirarFoto}
                  disabled={carregandoFoto}
                  sx={{ backgroundColor: '#1976D2' }}
                >
                  Tirar Foto
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PhotoLibraryIcon />}
                  onClick={selecionarDaGaleria}
                  disabled={carregandoFoto}
                >
                  Galeria
                </Button>
              </Box>

              {/* Grade de fotos */}
              {fotosOS.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <CameraAltIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                  <Typography variant="body2" mt={1}>
                    Nenhuma foto. Tire fotos do objeto/veículo para documentar a OS.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {fotosOS.map((foto) => (
                    <Grid item xs={6} sm={4} md={3} key={foto.fotoId}>
                      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
                        <img
                          src={foto.base64}
                          alt={foto.nomeArquivo}
                          style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                          onClick={() => window.open(foto.base64, '_blank')}
                        />
                        <IconButton
                          size="small"
                          onClick={() => excluirFoto(foto.fotoId)}
                          sx={{
                            position: 'absolute', top: 4, right: 4,
                            backgroundColor: 'rgba(0,0,0,0.55)', color: 'white',
                            '&:hover': { backgroundColor: 'rgba(200,0,0,0.75)' }
                          }}
                        >
                          <DeleteForeverIcon fontSize="small" />
                        </IconButton>
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', p: 0.5, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.65rem' }}
                        >
                          {new Date(foto.dataCriacao).toLocaleString('pt-BR')}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Tab 4 - Assinatura */}
          {tabAtual === 4 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GestureIcon /> Assinatura do Cliente
              </Typography>

              <TextField
                fullWidth
                label="Nome do assinante"
                value={nomeAssinante}
                onChange={(e) => setNomeAssinante(e.target.value)}
                size="small"
                sx={{ mb: 2 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonPinIcon fontSize="small" /></InputAdornment> }}
              />

              {/* Canvas de assinatura */}
              <Box sx={{ border: '2px dashed #90CAF9', borderRadius: 2, backgroundColor: '#FAFAFA', mb: 2, touchAction: 'none', userSelect: 'none' }}>
                <canvas
                  ref={assinaturaCanvasRef}
                  width={600}
                  height={220}
                  style={{ display: 'block', width: '100%', height: 220, cursor: 'crosshair', borderRadius: 8 }}
                  onMouseDown={(e) => {
                    desenhando.current = true;
                    const canvas = assinaturaCanvasRef.current;
                    const ctx = canvas.getContext('2d');
                    const rect = canvas.getBoundingClientRect();
                    const scaleX = canvas.width / rect.width;
                    const scaleY = canvas.height / rect.height;
                    ctx.beginPath();
                    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                  }}
                  onMouseMove={(e) => {
                    if (!desenhando.current) return;
                    const canvas = assinaturaCanvasRef.current;
                    const ctx = canvas.getContext('2d');
                    const rect = canvas.getBoundingClientRect();
                    const scaleX = canvas.width / rect.width;
                    const scaleY = canvas.height / rect.height;
                    ctx.lineWidth = 2.5;
                    ctx.lineCap = 'round';
                    ctx.strokeStyle = '#1565C0';
                    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                    ctx.stroke();
                  }}
                  onMouseUp={() => {
                    desenhando.current = false;
                    setAssinaturaBase64(assinaturaCanvasRef.current.toDataURL('image/png'));
                  }}
                  onMouseLeave={() => {
                    if (desenhando.current) {
                      desenhando.current = false;
                      setAssinaturaBase64(assinaturaCanvasRef.current.toDataURL('image/png'));
                    }
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    desenhando.current = true;
                    const canvas = assinaturaCanvasRef.current;
                    const ctx = canvas.getContext('2d');
                    const rect = canvas.getBoundingClientRect();
                    const scaleX = canvas.width / rect.width;
                    const scaleY = canvas.height / rect.height;
                    const touch = e.touches[0];
                    ctx.beginPath();
                    ctx.moveTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    if (!desenhando.current) return;
                    const canvas = assinaturaCanvasRef.current;
                    const ctx = canvas.getContext('2d');
                    const rect = canvas.getBoundingClientRect();
                    const scaleX = canvas.width / rect.width;
                    const scaleY = canvas.height / rect.height;
                    const touch = e.touches[0];
                    ctx.lineWidth = 2.5;
                    ctx.lineCap = 'round';
                    ctx.strokeStyle = '#1565C0';
                    ctx.lineTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
                    ctx.stroke();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    desenhando.current = false;
                    setAssinaturaBase64(assinaturaCanvasRef.current.toDataURL('image/png'));
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    const canvas = assinaturaCanvasRef.current;
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                    setAssinaturaBase64('');
                  }}
                >
                  Limpar
                </Button>
                {assinaturaBase64 && (
                  <Chip icon={<GestureIcon />} label="Assinatura capturada ✓" color="success" />
                )}
              </Box>

              {assinaturaBase64 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">Prévia:</Typography>
                  <Box sx={{ border: '1px solid #E0E0E0', borderRadius: 1, p: 1, mt: 0.5, backgroundColor: '#fff' }}>
                    <img
                      src={assinaturaBase64}
                      alt="Assinatura"
                      style={{ maxWidth: '100%', maxHeight: 150, display: 'block' }}
                    />
                  </Box>
                  {nomeAssinante && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Assinado por: <strong>{nomeAssinante}</strong>
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {modoEdicao && ordemAtual?.id_os && (
                <Button
                  onClick={cancelarOrdemServico}
                  color="error"
                  variant="outlined"
                  disabled={loading}
                  startIcon={<CancelIcon />}
                >
                  Cancelar Fechamento
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Indicador offline */}
              {!isOnline && (
                <Chip
                  icon={<CloudOffIcon />}
                  label={osPendentes > 0 ? `${osPendentes} pendente(s)` : 'Offline'}
                  color="warning"
                  size="small"
                />
              )}
              {isOnline && osPendentes > 0 && (
                <Chip
                  icon={sincronizando ? <CircularProgress size={14} /> : <CloudDoneIcon />}
                  label={sincronizando ? 'Sincronizando...' : `${osPendentes} pendente(s)`}
                  color="info"
                  size="small"
                  onClick={sincronizarOSPendentes}
                />
              )}
              {/* Compartilhar via WhatsApp */}
              <Button
                onClick={compartilharWhatsApp}
                variant="outlined"
                startIcon={<WhatsAppIcon />}
                sx={{ color: '#25D366', borderColor: '#25D366', '&:hover': { backgroundColor: '#e8f5e9', borderColor: '#128C7E' } }}
              >
                WhatsApp
              </Button>
              <Button onClick={() => setOpenDialog(false)} startIcon={<CancelIcon />}>
                Fechar
              </Button>
              <Button
                onClick={salvarOrdem}
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading || osBloqueadaParaEdicao}
                sx={{
                  backgroundColor: '#4CAF50',
                  '&:hover': { backgroundColor: '#388E3C' }
                }}
              >
                {loading ? 'Salvando...' : osBloqueadaParaEdicao ? 'Somente Visualização' : (isOnline ? 'Salvar' : '💾 Salvar Offline')}
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Dialog de Cadastro de Veículo/Animal/Equipamento */}
      <Dialog
        open={openCadastroModal}
        onClose={() => setOpenCadastroModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {tipoCadastro === 'veiculo' ? '🚗 Cadastrar Veículo' :
            tipoCadastro === 'animais' ? '🐾 Cadastrar Animal' :
              '🔧 Cadastrar Equipamento'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Campo Cliente (sempre visível) */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cliente"
                  value={clientes.find(c => c.id_cliente === dadosCadastro.id_cliente)?.nome_razao_social ||
                    clientes.find(c => c.id_cliente === dadosCadastro.id_cliente)?.nome || ''}
                  disabled
                  sx={{ backgroundColor: '#f5f5f5' }}
                />
              </Grid>

              {tipoCadastro === 'veiculo' && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="info" icon={<SearchIcon />}>
                      <strong>Busca Automática:</strong> Digite a placa e clique em "Buscar". O sistema irá:
                      <br />
                      1️⃣ Buscar nos cadastros locais
                      <br />
                      2️⃣ Se não encontrar, consultar dados do veículo na internet
                    </Alert>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Placa *"
                      value={dadosCadastro.placa}
                      onChange={(e) => {
                        const novaPlaca = e.target.value.toUpperCase();
                        setDadosCadastro({ ...dadosCadastro, placa: novaPlaca });
                      }}
                      placeholder="ABC-1234"
                      inputProps={{ maxLength: 8 }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          buscarDadosPlaca(dadosCadastro.placa);
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => buscarDadosPlaca(dadosCadastro.placa)}
                      disabled={buscandoPlaca || !dadosCadastro.placa || dadosCadastro.placa.length < 7}
                      sx={{ height: '56px', backgroundColor: '#2196F3', '&:hover': { backgroundColor: '#1976D2' } }}
                      startIcon={buscandoPlaca ? null : <SearchIcon />}
                    >
                      {buscandoPlaca ? 'Buscando...' : 'Buscar'}
                    </Button>
                  </Grid>

                  {/* Tipo de veículo e Combustível */}
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Veículo</InputLabel>
                      <Select
                        value={dadosCadastro.tipo_veiculo}
                        onChange={(e) => setDadosCadastro({ ...dadosCadastro, tipo_veiculo: e.target.value })}
                        label="Tipo de Veículo"
                      >
                        <MenuItem value="">Selecione...</MenuItem>
                        <MenuItem value="carro">Carro</MenuItem>
                        <MenuItem value="moto">Moto</MenuItem>
                        <MenuItem value="caminhao">Caminhão</MenuItem>
                        <MenuItem value="van">Van / Utilitário</MenuItem>
                        <MenuItem value="pickup">Pickup / Caminhonete</MenuItem>
                        <MenuItem value="onibus">Ônibus / Micro-ônibus</MenuItem>
                        <MenuItem value="trator">Trator / Máquina</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Combustível</InputLabel>
                      <Select
                        value={dadosCadastro.combustivel}
                        onChange={(e) => setDadosCadastro({ ...dadosCadastro, combustivel: e.target.value })}
                        label="Combustível"
                      >
                        <MenuItem value="">Selecione...</MenuItem>
                        <MenuItem value="gasolina">Gasolina</MenuItem>
                        <MenuItem value="etanol">Etanol</MenuItem>
                        <MenuItem value="flex">Flex (Gasolina/Etanol)</MenuItem>
                        <MenuItem value="diesel">Diesel</MenuItem>
                        <MenuItem value="gnv">GNV (Gás Natural)</MenuItem>
                        <MenuItem value="eletrico">Elétrico</MenuItem>
                        <MenuItem value="hibrido">Híbrido</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Marca e Modelo */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Marca"
                      value={dadosCadastro.marca}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, marca: e.target.value })}
                      placeholder="Ex: Chevrolet, Fiat, Ford"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Modelo"
                      value={dadosCadastro.modelo}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, modelo: e.target.value })}
                      placeholder="Ex: Onix, Uno, Ka"
                    />
                  </Grid>

                  {/* Ano, Cor, Motor */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Ano"
                      value={dadosCadastro.ano}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, ano: e.target.value })}
                      placeholder="2020"
                      inputProps={{ maxLength: 9 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Cor"
                      value={dadosCadastro.cor}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, cor: e.target.value })}
                      placeholder="Ex: Preto, Branco"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Motor"
                      value={dadosCadastro.motor}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, motor: e.target.value })}
                      placeholder="Ex: 1.0, 2.0 Turbo"
                    />
                  </Grid>

                  {/* Chassi */}
                  <Grid item xs={12} sm={9}>
                    <TextField
                      fullWidth
                      label="Chassi (17 dígitos)"
                      value={dadosCadastro.chassi}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, chassi: e.target.value.toUpperCase() })}
                      placeholder="9BWZZZ377VT004251"
                      inputProps={{ maxLength: 17 }}
                    />
                  </Grid>

                  {/* KM Entrada e Saída */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="KM de Entrada"
                      type="number"
                      value={dadosCadastro.km_entrada}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, km_entrada: e.target.value })}
                      placeholder="Ex: 75000"
                      InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="KM de Saída"
                      type="number"
                      value={dadosCadastro.km_saida}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, km_saida: e.target.value })}
                      placeholder="Ex: 75020"
                      InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
                    />
                  </Grid>
                </>
              )}

              {tipoCadastro === 'animais' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nome *"
                      value={dadosCadastro.nome}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, nome: e.target.value })}
                      placeholder="Ex: Rex, Miau, Bob"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Espécie"
                      value={dadosCadastro.especie}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, especie: e.target.value })}
                      placeholder="Ex: Cachorro, Gato, Cavalo"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Raça"
                      value={dadosCadastro.raca}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, raca: e.target.value })}
                      placeholder="Ex: Labrador, Siamês, Mangalarga"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Idade"
                      value={dadosCadastro.idade}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, idade: e.target.value })}
                      placeholder="Ex: 3 anos, 6 meses"
                    />
                  </Grid>
                </>
              )}

              {tipoCadastro === 'equipamento' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Descrição *"
                      value={dadosCadastro.descricao}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, descricao: e.target.value })}
                      placeholder="Ex: Notebook Dell Inspiron"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Fabricante"
                      value={dadosCadastro.fabricante}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, fabricante: e.target.value })}
                      placeholder="Ex: Dell, HP, Lenovo"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Número de Série"
                      value={dadosCadastro.numeroSerie}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, numeroSerie: e.target.value.toUpperCase() })}
                      placeholder="Ex: SN123456789"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Número Patrimônio"
                      value={dadosCadastro.patrimonio}
                      onChange={(e) => setDadosCadastro({ ...dadosCadastro, patrimonio: e.target.value })}
                      placeholder="Ex: PAT-001"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCadastroModal(false)}>
            Cancelar
          </Button>
          <Button
            onClick={salvarCadastro}
            variant="contained"
            sx={{
              backgroundColor: '#4CAF50',
              '&:hover': { backgroundColor: '#388E3C' }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Lista de Veículos/Animais/Equipamentos do Cliente */}
      <Dialog
        open={openListaModal}
        onClose={() => setOpenListaModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          📋 Selecionar Veículo/Animal/Equipamento
          <Typography variant="body2" color="text.secondary">
            Cliente selecionado possui {listaVeiculosCliente.length} item(s) cadastrado(s)
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {listaVeiculosCliente.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                Nenhum veículo/animal/equipamento cadastrado para este cliente
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {listaVeiculosCliente.map((item) => (
                  <Grid item xs={12} key={item.id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: '2px solid transparent',
                        transition: 'all 0.3s',
                        '&:hover': {
                          border: '2px solid #2196F3',
                          backgroundColor: '#e3f2fd'
                        }
                      }}
                      onClick={() => selecionarVeiculoDaLista(item)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">
                          {item.tipo === 'veiculo' ? '🚗 Veículo' :
                            item.tipo === 'animais' ? '🐾 Animal' :
                              '🔧 Equipamento'}
                        </Typography>
                        <Chip
                          label={item.tipo}
                          size="small"
                          sx={{ ml: 2 }}
                          color={item.tipo === 'veiculo' ? 'primary' : item.tipo === 'animais' ? 'success' : 'warning'}
                        />
                      </Box>

                      <Grid container spacing={1}>
                        {item.tipo === 'veiculo' && (
                          <>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2">
                                <strong>Placa:</strong> {item.placa}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2">
                                <strong>Marca:</strong> {item.marca}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="body2">
                                <strong>Modelo:</strong> {item.modelo}
                              </Typography>
                            </Grid>
                            {item.ano && (
                              <Grid item xs={12} sm={4}>
                                <Typography variant="body2">
                                  <strong>Ano:</strong> {item.ano}
                                </Typography>
                              </Grid>
                            )}
                            {item.cor && (
                              <Grid item xs={12} sm={4}>
                                <Typography variant="body2">
                                  <strong>Cor:</strong> {item.cor}
                                </Typography>
                              </Grid>
                            )}
                          </>
                        )}

                        {item.tipo === 'animais' && (
                          <>
                            <Grid item xs={12} sm={3}>
                              <Typography variant="body2">
                                <strong>Nome:</strong> {item.nome}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Typography variant="body2">
                                <strong>Espécie:</strong> {item.especie}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Typography variant="body2">
                                <strong>Raça:</strong> {item.raca}
                              </Typography>
                            </Grid>
                            {item.idade && (
                              <Grid item xs={12} sm={3}>
                                <Typography variant="body2">
                                  <strong>Idade:</strong> {item.idade}
                                </Typography>
                              </Grid>
                            )}
                          </>
                        )}

                        {item.tipo === 'equipamento' && (
                          <>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2">
                                <strong>Descrição:</strong> {item.descricao}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2">
                                <strong>Fabricante:</strong> {item.fabricante}
                              </Typography>
                            </Grid>
                            {item.numeroSerie && (
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2">
                                  <strong>Nº Série:</strong> {item.numeroSerie}
                                </Typography>
                              </Grid>
                            )}
                            {item.patrimonio && (
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2">
                                  <strong>Patrimônio:</strong> {item.patrimonio}
                                </Typography>
                              </Grid>
                            )}
                          </>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenListaModal(false)}>
            Fechar
          </Button>
          <Button
            onClick={() => {
              setOpenListaModal(false);
              abrirCadastro(tipoAtendimento);
            }}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: '#4CAF50',
              '&:hover': { backgroundColor: '#388E3C' }
            }}
          >
            Cadastrar Novo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Seleção de Forma de Pagamento */}
      <Dialog
        open={openPagamentoDialog}
        onClose={cancelarGeracaoFinanceiro}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#2196F3', color: 'white' }}>
          💳 Formas de Pagamento
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Adicione uma ou mais formas de pagamento. O total deve ser igual ao valor da OS.
            </Alert>

            {/* Adicionar Nova Forma */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Adicionar Forma de Pagamento
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Forma de Pagamento *</InputLabel>
                    <Select
                      value={formaPagamentoTemp}
                      onChange={(e) => setFormaPagamentoTemp(e.target.value)}
                      label="Forma de Pagamento *"
                    >
                      <MenuItem value="">Selecione...</MenuItem>
                      {formasPagamento.map((forma) => (
                        <MenuItem key={forma.id_forma_pagamento} value={forma.id_forma_pagamento}>
                          {forma.nome_forma}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Valor *"
                    type="number"
                    value={valorPagamentoTemp}
                    onChange={(e) => setValorPagamentoTemp(e.target.value)}
                    onFocus={(e) => {
                      if (!valorPagamentoTemp) {
                        const valorRestante = calcularValorRestante();
                        if (valorRestante > 0) {
                          setValorPagamentoTemp(valorRestante.toFixed(2));
                        }
                      }
                    }}
                    placeholder={calcularValorRestante() > 0 ? calcularValorRestante().toFixed(2) : '0.00'}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 0.5 }}>R$</Typography>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                  />
                </Grid>

                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Parcelas"
                    type="number"
                    value={parcelasTemp}
                    onChange={(e) => setParcelasTemp(Math.max(1, parseInt(e.target.value) || 1))}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={adicionarFormaPagamento}
                    sx={{ height: '40px' }}
                  >
                    Adicionar
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Lista de Formas Adicionadas */}
            {formasPagamentoSelecionadas.length > 0 && (
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                      <TableCell><strong>Forma</strong></TableCell>
                      <TableCell><strong>Valor</strong></TableCell>
                      <TableCell><strong>Parcelas</strong></TableCell>
                      <TableCell align="center"><strong>Ações</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formasPagamentoSelecionadas.map((fp, index) => (
                      <TableRow key={index}>
                        <TableCell>{fp.nome_forma}</TableCell>
                        <TableCell>R$ {parseFloat(fp.valor).toFixed(2)}</TableCell>
                        <TableCell>
                          {fp.parcelas}x de R$ {(parseFloat(fp.valor) / fp.parcelas).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removerFormaPagamento(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Resumo de Valores */}
            <Paper sx={{ p: 2, bgcolor: calcularValorRestante() === 0 ? '#e8f5e9' : '#fff3e0' }}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Valor da OS:</Typography>
                  <Typography variant="h6">
                    R$ {(() => {
                      const valorOS = parseFloat(ordemAtual?.valor_total_os) || 0;
                      const valorItens = itens.reduce((acc, item) => {
                        const qtd = parseFloat(item.quantidade) || 0;
                        const vlr = parseFloat(item.valorUnitario) || 0;
                        return acc + (qtd * vlr);
                      }, 0);
                      return (valorOS || valorItens).toFixed(2);
                    })()}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Total Pago:</Typography>
                  <Typography variant="h6">
                    R$ {formasPagamentoSelecionadas.reduce((sum, fp) => sum + parseFloat(fp.valor), 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Restante:</Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: calcularValorRestante() === 0 ? 'success.main' : 'warning.main' }}
                  >
                    R$ {Math.abs(calcularValorRestante()).toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>


          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={cancelarGeracaoFinanceiro}
            color="inherit"
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmarPagamento}
            variant="contained"
            color="primary"
            disabled={formasPagamentoSelecionadas.length === 0 || calcularValorRestante() !== 0}
          >
            Continuar para Confirmação
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Geração de Financeiro */}
      <Dialog
        open={openFinanceiroDialog}
        onClose={cancelarGeracaoFinanceiro}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#4CAF50', color: 'white' }}>
          💰 Gerar Financeiro
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Este status está configurado para gerar financeiro automaticamente.
            </Alert>

            <Typography variant="body1" sx={{ mb: 2 }}>
              Deseja gerar o financeiro desta Ordem de Serviço agora?
            </Typography>

            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                <strong>Ordem de Serviço:</strong> {ordemAtual?.id_os ? `OS-${ordemAtual.id_os}` : numeroDocumento}
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                <strong>Cliente:</strong> {clientes.find(c => c.id_cliente === cliente)?.nome_razao_social || '-'}
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                <strong>Operação:</strong> {operacoes.find(op => op.id_operacao === operacao)?.nome_operacao || '-'}
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, color: '#4CAF50' }}>
                <strong>Valor Total:</strong> R$ {(() => {
                  const valorOS = parseFloat(ordemAtual?.valor_total_os) || 0;
                  const valorItens = itens.reduce((acc, item) => {
                    const qtd = parseFloat(item.quantidade) || 0;
                    const vlr = parseFloat(item.valorUnitario) || 0;
                    return acc + (qtd * vlr);
                  }, 0);
                  return (valorOS || valorItens).toFixed(2);
                })()}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={cancelarGeracaoFinanceiro}
            color="inherit"
            variant="outlined"
          >
            Não Gerar
          </Button>
          <Button
            onClick={gerarFinanceiroOS}
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Gerando...' : 'Sim, Gerar Financeiro'}
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
                  🚫 <strong>ORDEM DE SERVIÇO BLOQUEADA!</strong> Cliente não pode realizar serviços com títulos em atraso.
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
                setCliente('');
                setListaVeiculosCliente([]);
              }} color="error">
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  const senha = prompt('Digite a senha de supervisor para continuar:');
                  if (!senha) {
                    setOpenAtrasoModal(false);
                    setCliente('');
                    setListaVeiculosCliente([]);
                    return;
                  }

                  try {
                    const senhaResponse = await axiosInstance.post('/verificar-senha-supervisor/', { senha });
                    if (!senhaResponse.data.valida) {
                      alert('❌ Senha incorreta! OS cancelada.');
                      setOpenAtrasoModal(false);
                      setCliente('');
                      setListaVeiculosCliente([]);
                      return;
                    }
                    setSuccess('✅ Senha autorizada. Cliente em atraso aceito.');
                    setTimeout(() => setSuccess(''), 3000);
                    setOpenAtrasoModal(false);
                  } catch (err) {
                    alert('❌ Senha incorreta! OS cancelada.');
                    setOpenAtrasoModal(false);
                    setCliente('');
                    setListaVeiculosCliente([]);
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

      {/* Dialogo de Seleção de Operação para NFe */}
      <Dialog
        open={openNFeDialog}
        onClose={() => setOpenNFeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white' }}>
          📄 Emitir NF-e (Modelo 55)
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Isso criará uma Venda vinculada a esta OS para posterior emissão fiscal.
            </Alert>
            
            <Typography variant="subtitle1" gutterBottom>
              Selecione a Operação Fiscal:
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>Operação *</InputLabel>
              <Select
                value={selectedNFeOperation}
                onChange={(e) => setSelectedNFeOperation(e.target.value)}
                label="Operação *"
              >
                {/* Agora usa todasOperacoes para poder acessar Modelos 55, que não estão na lista 'operacoes' (apenas serviços) */}
                {todasOperacoes
                  .filter(op => op.modelo_documento === '55')
                  .map((op) => (
                    <MenuItem key={op.id_operacao} value={op.id_operacao}>
                      {op.nome_operacao} (NFe)
                    </MenuItem>
                  ))}
                  
                {todasOperacoes.filter(op => op.modelo_documento === '55').length === 0 && 
                  <MenuItem disabled>
                    Nenhuma operação de NFe (Modelo 55) encontrada.
                  </MenuItem>
                }
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNFeDialog(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={confirmarEmissaoNFe} 
            variant="contained" 
            color="primary"
            disabled={!selectedNFeOperation}
          >
            Confirmar e Gerar
          </Button>
        </DialogActions>
      </Dialog>
      </>)}
    </Box>
  );
};

export default OrdemServicoPage;
