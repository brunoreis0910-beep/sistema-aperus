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
  CircularProgress,
  Card,
  CardContent,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Discount as DiscountIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  Group as GroupIcon,
  Print as PrintIcon,
  Settings as SettingsIcon,
  Wallpaper as WallpaperIcon
} from '@mui/icons-material';
import promocaoService from '../services/promocaoService';
import balancaService from '../services/balancaService';
import { useAuth } from '../context/AuthContext';
import { useOfflineSync } from '../context/OfflineSyncContext';
import useTerminalCache from '../utils/useTerminalCache';
import { 
  salvarVendaOffline, 
  buscarTabelasComerciaisCache,
  salvarEstadoVendaRapida,
  carregarEstadoVendaRapida,
  limparEstadoVendaRapida
} from '../utils/terminalCacheDB';
import { logger } from '../components/DebugLogger';
import { useVendaRapida } from '../context/VendaRapidaContext';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CloudDoneIcon from '@mui/icons-material/CloudDone';

const VendaRapidaPage = () => {
  useEffect(() => {
    console.log('🚀🚀🚀 VendaRapidaPage CARREGADA - VERSÃO DEFINITIVA v4.0 - CACHE LIMPO');
  }, []);

  const {
    parametros, setParametros,
    usuario, setUsuario,
    vendedor, setVendedor,
    cliente, setCliente,
    itens, setItens,
    total, setTotal,
    subtotal, setSubtotal,
    descontoGeral, setDescontoGeral,
    valorDescontoGeral, setValorDescontoGeral,
    tabelasComerciais, setTabelasComerciais,
    tabelaComercial, setTabelaComercial,
    promocoesAtivas, setPromocoesAtivas,
    operacoes, setOperacoes,
    operacao, setOperacao,
    formasPagamento, setFormasPagamento,
    formaPagamento, setFormaPagamento,
    parcelas, setParcelas,
    dadosVenda, setDadosVenda,
    vendaFinalizadaInfo, setVendaFinalizadaInfo,
    isSubmitting, setIsSubmitting,
    numeroVenda, setNumeroVenda,
    // Adicione aqui todos os outros estados que foram movidos para o contexto
  } = useVendaRapida();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openPesquisaProduto, setOpenPesquisaProduto] = useState(false);
  const [produtosPesquisa, setProdutosPesquisa] = useState([]);
  const [codigoProduto, setCodigoProduto] = useState('');
  const [nomeProduto, setNomeProduto] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState(0);
  const [idProdutoSelecionado, setIdProdutoSelecionado] = useState(null);
  const [descontoItem, setDescontoItem] = useState(0);
  const [descontoItemEdit, setDescontoItemEdit] = useState(0);
  const [precoBaseProduto, setPrecoBaseProduto] = useState(0);
  const [produtoBalanca, setProdutoBalanca] = useState(null);
  const [controlaProdutoLote, setControlaProdutoLote] = useState(false);
  const [lotesDisponiveis, setLotesDisponiveis] = useState([]);
  const [lotePendente, setLotePendente] = useState(null);
  const [lotePreSelecionado, setLotePreSelecionado] = useState(null);
  const [produtoEmPromocao, setProdutoEmPromocao] = useState(null);
  const [mensagemPromocao, setMensagemPromocao] = useState('');
  const [filaValidacoes, setFilaValidacoes] = useState([]);
  const [limiteInfo, setLimiteInfo] = useState(null);
  const [acaoLimiteAtual, setAcaoLimiteAtual] = useState(null);
  const [senhaSupervisorLimite, setSenhaSupervisorLimite] = useState('');
  const [limiteAutorizado, setLimiteAutorizado] = useState(false);
  const [atrasoInfo, setAtrasoInfo] = useState(null);
  const [acaoAtrasoAtual, setAcaoAtrasoAtual] = useState(null);
  const [senhaSupervisorAtraso, setSenhaSupervisorAtraso] = useState('');
  const [atrasoAutorizado, setAtrasoAutorizado] = useState(false);
  const [estoqueInfo, setEstoqueInfo] = useState(null);
  const [acaoEstoqueAtual, setAcaoEstoqueAtual] = useState(null);
  const [senhaSupervisorEstoque, setSenhaSupervisorEstoque] = useState('');
  const [itemPendenteEstoque, setItemPendenteEstoque] = useState(null);
  const [estoqueAutorizado, setEstoqueAutorizado] = useState(false);
  const [condicoesSelecionadas, setCondicoesSelecionadas] = useState([]);
  const [formaPagamentoAtual, setFormaPagamentoAtual] = useState(null);
  const [valorCondicaoAtual, setValorCondicaoAtual] = useState('');
  const [valorRestante, setValorRestante] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);
  const [imagemFundo, setImagemFundo] = useState('');
  const [usarMercadoPago, setUsarMercadoPago] = useState(false);
  const [mpPointTransacaoUuid, setMpPointTransacaoUuid] = useState(null);
  const [mpPointStatus, setMpPointStatus] = useState('');
  const [mpPointDetalhe, setMpPointDetalhe] = useState('');
  const [mpPointAcaoAposAprovacao, setMpPointAcaoAposAprovacao] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [configImpressao, setConfigImpressao] = useState(null);
  const [caixaStatus, setCaixaStatus] = useState('VERIFICANDO');
  const [caixaInfo, setCaixaInfo] = useState(null);
  const [tabelaSelecionada, setTabelaSelecionada] = useState(null);

  const [openSelecionarTabela, setOpenSelecionarTabela] = useState(false);
  const [produtoPendenteTabela, setProdutoPendenteTabela] = useState(null);
  const [openPerguntarTabelaFinanceiro, setOpenPerguntarTabelaFinanceiro] = useState(false);
  const [openDesconto, setOpenDesconto] = useState(false);
  const [openDescontoItem, setOpenDescontoItem] = useState(false);
  const [openCondicoesPagamento, setOpenCondicoesPagamento] = useState(false);
  const [openFinalizar, setOpenFinalizar] = useState(false);
  const [openImpressao, setOpenImpressao] = useState(false);
  const [openReimprimir, setOpenReimprimir] = useState(false);
  const [dadosVendaCompleta, setDadosVendaCompleta] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [openSelecionarCliente, setOpenSelecionarCliente] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [openConfigFundo, setOpenConfigFundo] = useState(false);
  const [openMPPoint, setOpenMPPoint] = useState(false);
  const [openLimiteModal, setOpenLimiteModal] = useState(false);
  const [openAtrasoModal, setOpenAtrasoModal] = useState(false);
  const [openEstoqueModal, setOpenEstoqueModal] = useState(false);
  const [openAbrirCaixa, setOpenAbrirCaixa] = useState(false);
  const [openFecharCaixa, setOpenFecharCaixa] = useState(false);
  const [valorAbertura, setValorAbertura] = useState('');
  const [valorFechamento, setValorFechamento] = useState('');
  const [observacoesCaixa, setObservacoesCaixa] = useState('');
  const [justificativaFechamento, setJustificativaFechamento] = useState('');

  const codigoProdutoRef = useRef(null);
  const { user, permissions, isLoading: authLoading, axiosInstance } = useAuth();
  const { servidorOk, marcarServidorIndisponivel } = useOfflineSync();
  const servidorOkRef = useRef(servidorOk);
  const {
    buscarProdutos: buscarProdutosHook,
    buscarClientes: buscarClientesHook,
    obterFormasPagamento,
    carregarDadosIniciais: carregarDadosIniciaisCache,
  } = useTerminalCache(axiosInstance, servidorOk);

  // --- Funções de Caixa ---
  const checkCaixaStatus = async () => {
    try {
      const response = await axiosInstance.get('/caixa-venda/status/');
      if (response.data.status === 'ABERTO') {
        setCaixaStatus('ABERTO');
        setCaixaInfo(response.data);
      } else {
        setCaixaStatus('FECHADO');
        setOpenAbrirCaixa(true);
      }
    } catch (error) {
      console.error("Erro ao verificar caixa:", error);
    }
  };

  const handleAbrirCaixa = async () => {
    try {
      const val = parseFloat((valorAbertura || '0').toString().replace(',', '.'));
      await axiosInstance.post('/caixa-venda/abrir/', { valor_abertura: val });
      setOpenAbrirCaixa(false);
      checkCaixaStatus();
      setSuccess('Caixa aberto com sucesso!');
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.error || 'Erro ao abrir caixa.');
    }
  };

  const handleFecharCaixa = async () => {
    try {
      const val = parseFloat((valorFechamento || '0').toString().replace(',', '.'));
      
      await axiosInstance.post('/caixa-venda/fechar/', { 
        valor_fechamento: val,
        observacoes: justificativaFechamento
      });
      setOpenFecharCaixa(false);
      setCaixaStatus('FECHADO');
      setSuccess('Caixa fechado com sucesso!');
      setTimeout(() => window.location.reload(), 1500); 
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.error || 'Erro ao fechar caixa.');
    }
  };

  useEffect(() => {
    console.log('🚀 VendaRapidaPage montado. Carregando dados...');
    
    // 🔹 CARREGAR ESTADO SALVO DO INDEXEDDB (Persistência entre navegações)
    const restaurarEstadoSalvo = async () => {
      try {
        const estadoSalvo = await carregarEstadoVendaRapida();
        if (estadoSalvo) {
          console.log('✅ Restaurando estado salvo da Venda Rápida');
          
          // Restaurar todos os dados salvos
          if (estadoSalvo.usuario) setUsuario(estadoSalvo.usuario);
          if (estadoSalvo.parametros) setParametros(estadoSalvo.parametros);
          if (estadoSalvo.vendedor) setVendedor(estadoSalvo.vendedor);
          if (estadoSalvo.cliente) setCliente(estadoSalvo.cliente);
          if (estadoSalvo.operacao) setOperacao(estadoSalvo.operacao);
          if (estadoSalvo.empresa) setEmpresa(estadoSalvo.empresa);
          if (estadoSalvo.itens) setItens(estadoSalvo.itens);
          if (estadoSalvo.descontoGeral !== undefined) setDescontoGeral(estadoSalvo.descontoGeral);
          if (estadoSalvo.tabelaSelecionada) setTabelaSelecionada(estadoSalvo.tabelaSelecionada);
          if (estadoSalvo.condicoesSelecionadas) setCondicoesSelecionadas(estadoSalvo.condicoesSelecionadas);
          if (estadoSalvo.numeroDocumento) setNumeroDocumento(estadoSalvo.numeroDocumento);
          if (estadoSalvo.tabelasComerciais) setTabelasComerciais(estadoSalvo.tabelasComerciais);
          if (estadoSalvo.formasPagamento) setFormasPagamento(estadoSalvo.formasPagamento);
          
          setSuccess('✅ Venda restaurada! Você pode continuar de onde parou.');
          setLoading(false);
          return true; // Indica que restaurou o estado
        }
      } catch (err) {
        console.error('Erro ao restaurar estado salvo:', err);
      }
      return false; // Não restaurou
    };
    
    // Tentar restaurar primeiro, se não conseguir, carregar normalmente
    restaurarEstadoSalvo().then(restaurado => {
      if (!restaurado) {
        // Apenas carrega os dados se eles não estiverem no contexto ainda
        if (!parametros || !usuario) {
          carregarDadosUsuario();
        } else {
          console.log('[CONTEXTO] Dados de usuário já presentes. Pulando recarga inicial.');
          setLoading(false);
        }
      }
    });
    
    if (tabelasComerciais.length === 0) {
      carregarTabelasComerciais();
    }
    if (promocoesAtivas.dados && promocoesAtivas.dados.length === 0 && servidorOk) {
        carregarPromocoes().catch(err => console.error('Erro ao carregar promoções no mount:', err));
    }
    if (servidorOk) {
      checkCaixaStatus();
      axiosInstance.get('/configuracao-impressao/modulo/venda_rapida/')
        .then(res => setConfigImpressao(res.data))
        .catch(() => {});
      axiosInstance.get('/user-preferencias/')
        .then(res => {
          const bg = res.data['venda_rapida_bg'];
          if (bg) {
            setImagemFundo(bg);
            localStorage.setItem('vendaRapidaImagemFundo', bg);
          }
        })
        .catch(() => {});
    }
  }, []); // Roda apenas uma vez no mount

  // 🔹 AUTO-SAVE: Salva automaticamente o estado sempre que algo importante mudar
  useEffect(() => {
    // Não salvar se ainda está carregando os dados iniciais
    if (loading || !usuario) return;
    
    // Debounce: aguarda 1 segundo após a última mudança para salvar
    const timeoutId = setTimeout(async () => {
      try {
        await salvarEstadoVendaRapida({
          usuario,
          parametros,
          vendedor,
          cliente,
          operacao,
          empresa,
          itens,
          descontoGeral,
          tabelaSelecionada,
          condicoesSelecionadas,
          numeroDocumento,
          tabelasComerciais,
          formasPagamento,
        });
        console.log('💾 [AUTO-SAVE] Estado da Venda Rápida salvo automaticamente');
      } catch (err) {
        console.error('❌ [AUTO-SAVE] Erro ao salvar estado:', err);
      }
    }, 1000); // Aguarda 1 segundo de "silêncio" antes de salvar

    return () => clearTimeout(timeoutId); // Limpa o timeout ao desmontar ou re-renderizar
  }, [
    usuario, 
    parametros, 
    vendedor, 
    cliente, 
    operacao, 
    empresa, 
    itens, 
    descontoGeral, 
    tabelaSelecionada, 
    condicoesSelecionadas,
    numeroDocumento,
    tabelasComerciais,
    formasPagamento,
    loading
  ]); // Observa mudanças nessas variáveis

  // Mantém servidorOkRef sempre atualizado (evita stale closure em funções assíncronas)
  useEffect(() => { servidorOkRef.current = servidorOk; }, [servidorOk]);

  // Quando servidor volta online: recarregando configurações
  const servidorOkPrevRef = useRef(servidorOk);
  useEffect(() => {
    const voltou = !servidorOkPrevRef.current && servidorOk;
    servidorOkPrevRef.current = servidorOk;
    if (voltou) {
      console.log('[ONLINE] Servidor voltou — recarregando configurações...');
      carregarDadosUsuario();
      carregarTabelasComerciais();
    }
  }, [servidorOk]);

  const carregarDadosUsuario = async () => {
    // Se já temos os parâmetros no contexto, não precisamos carregar tudo de novo
    if (parametros && usuario) {
      console.log('[CONTEXTO] Usando dados de usuário já carregados no contexto.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const token = getToken();

      // ── OFFLINE: carregar tudo do cache local ──────────────────────────────
      if (!servidorOkRef.current) {
        const cached = await carregarDadosIniciaisCache();
        // Validar que o cache pertence ao usuário logado atualmente
        const cacheUsername = cached?.parametros?._username;
        const currentUsername = user?.username;
        if (cacheUsername && currentUsername && cacheUsername !== currentUsername) {
          console.warn(`[OFFLINE] Cache pertence ao usuário "${cacheUsername}", mas logado como "${currentUsername}". Recusando cache.`);
          setError(`Modo offline não disponível para "${currentUsername}": o cache pertence ao usuário "${cacheUsername}". Conecte-se à internet para ativar o modo offline para este usuário.`);
          setLoading(false);
          return;
        }
        if (cached) {
          if (cached.empresa)    setEmpresa(cached.empresa);
          if (cached.parametros) setParametros(cached.parametros);
          if (cached.usuario)    setUsuario(cached.usuario);
          if (cached.vendedor)   setVendedor(cached.vendedor);
          if (cached.operacao) {
            setOperacao(cached.operacao);
            if (cached.operacao.usa_auto_numeracao)
              setNumeroDocumento(String(cached.operacao.proximo_numero_nf || 1));
          }
          if (cached.cliente) await selecionarClienteVenda(cached.cliente);
          console.log('[OFFLINE] Dados carregados do cache local');
        } else {
          setError('Servidor offline. Faça login online ao menos uma vez para usar o modo offline.');
        }
        setLoading(false);
        return;
      }
      // ── FIM OFFLINE ────────────────────────────────────────────────────────

      // Buscar dados da empresa
      const resEmpresa = await axiosInstance.get('/empresa/');
      if (resEmpresa.data && resEmpresa.data.length > 0) {
        setEmpresa(resEmpresa.data[0]);
        console.log('🏢 Empresa carregada:', resEmpresa.data[0]);
      }

      // Buscar dados do usuário logado
      console.log('🔍 Buscando dados do usuário em /api/usuarios/me/');
      const resUsuario = await axiosInstance.get('/usuarios/me/');

      setUsuario(resUsuario.data);

      console.log('✅ Resposta da API /usuarios/me/:', resUsuario.data);
      console.log('📋 Dados do usuário:', resUsuario.data);
      console.log('📋 Parâmetros do usuário:', resUsuario.data.parametros);

      // Verificar se tem parâmetros de venda rápida
      if (resUsuario.data.parametros) {
        console.log('📦 Parâmetros do usuário:', resUsuario.data.parametros);
        console.log('   id_vendedor_venda_rapida:', resUsuario.data.parametros.id_vendedor_venda_rapida);
        console.log('   id_operacao_venda_rapida:', resUsuario.data.parametros.id_operacao_venda_rapida);
        console.log('   id_vendedor_padrao:', resUsuario.data.parametros.id_vendedor_padrao);
        console.log('   id_operacao_padrao:', resUsuario.data.parametros.id_operacao_padrao);
        setParametros(resUsuario.data.parametros);

        // Carregar cliente padrão
        if (resUsuario.data.parametros.id_cliente_padrao) {
          console.log('👥 Carregando cliente padrão:', resUsuario.data.parametros.id_cliente_padrao);
          const resCliente = await axiosInstance.get(
            `/clientes/${resUsuario.data.parametros.id_cliente_padrao}/`
          );
          console.log('✅ Cliente padrão carregado, chamando selecionarClienteVenda:', resCliente.data);
          // Chamar selecionarClienteVenda para executar todas as validações (limite, atraso, etc)
          await selecionarClienteVenda(resCliente.data);
        }

        // Carregar vendedor padrão para VENDA RÁPIDA (prioriza id_vendedor_venda_rapida, senão usa id_vendedor_venda, depois id_vendedor_padrao)
        const idVendedorVendaRapida = resUsuario.data.parametros.id_vendedor_venda_rapida || resUsuario.data.parametros.id_vendedor_venda || resUsuario.data.parametros.id_vendedor_padrao;
        if (idVendedorVendaRapida) {
          console.log('👤 Carregando vendedor (Venda Rápida):', idVendedorVendaRapida);
          const resVendedor = await axiosInstance.get(
            `/vendedores/${idVendedorVendaRapida}/`
          );
          setVendedor(resVendedor.data);
          console.log('✅ Vendedor VENDA RÁPIDA carregado:', resVendedor.data);
        } else {
          console.warn('⚠️ Nenhum vendedor padrão configurado nos parâmetros');
        }

        // Carregar operação padrão para VENDA RÁPIDA (usa id_operacao_venda_rapida, depois id_operacao_venda, depois id_operacao_padrao)
        const idOperacaoVendaRapida = resUsuario.data.parametros.id_operacao_venda_rapida || resUsuario.data.parametros.id_operacao_venda || resUsuario.data.parametros.id_operacao_padrao;
        if (idOperacaoVendaRapida) {
          const resOperacao = await axiosInstance.get(
            `/operacoes/${idOperacaoVendaRapida}/`
          );
          setOperacao(resOperacao.data);
          console.log('✅ Operação VENDA RÁPIDA carregada:', resOperacao.data);
          console.log('   📦 validar_estoque:', resOperacao.data.validar_estoque);
          console.log('   📦 acao_estoque:', resOperacao.data.acao_estoque);

          // Definir próximo número do documento
          if (resOperacao.data.usa_auto_numeracao) {
            setNumeroDocumento(String(resOperacao.data.proximo_numero_nf || 1));
          }
        }
      } else {
        setError('Usuário sem parâmetros de venda rápida configurados. Configure em Configurações > Usuários.');
      }

    } catch (err) {
      console.error('Erro ao carregar dados do servidor:', err);
      marcarServidorIndisponivel(); // Força o estado de offline no contexto
      // Servidor indisponível — tentar carregar do cache local como fallback
      try {
        const cached = await carregarDadosIniciaisCache();
        // Validar que o cache pertence ao usuário logado
        const cacheUsername = cached?.parametros?._username;
        const currentUsername = user?.username;
        if (cacheUsername && currentUsername && cacheUsername !== currentUsername) {
          console.warn(`[CACHE] Cache de "${cacheUsername}" recusado para "${currentUsername}"`);
          setError(`Modo offline não disponível para "${currentUsername}": cache pertence ao usuário "${cacheUsername}". Conecte-se à internet.`);
        } else if (cached && cached.parametros) {
          if (cached.empresa)    setEmpresa(cached.empresa);
          if (cached.parametros) setParametros(cached.parametros);
          if (cached.usuario)    setUsuario(cached.usuario);
          if (cached.vendedor)   setVendedor(cached.vendedor);
          if (cached.operacao) {
            setOperacao(cached.operacao);
            if (cached.operacao.usa_auto_numeracao)
              setNumeroDocumento(String(cached.operacao.proximo_numero_nf || 1));
          }
          if (cached.cliente) await selecionarClienteVenda(cached.cliente).catch(() => {});
          console.log('[CACHE] Configuração carregada do cache local (usuário:', currentUsername, ')');
          setSuccess('Operando em modo offline com dados de cache.');
        } else {
          setError('Servidor offline e sem cache local. Faça login online ao menos uma vez para ativar o modo offline.');
        }
      } catch (cacheErr) {
        console.error('Erro ao carregar cache:', cacheErr);
        setError('Servidor indisponível. Verifique sua conexão e tente recarregar a página.');
      }
    } finally {
      setLoading(false);
    }
  };

  const carregarClientes = async () => {
    try {
      setLoadingClientes(true);
      const token = getToken();

      const clientesArray = await buscarClientesHook('');
      setClientes(clientesArray);
      console.log('✅ Clientes carregados:', clientesArray.length, servidorOk ? '(servidor)' : '(cache local)');
    } catch (err) {
      console.error('❌ Erro ao carregar clientes:', err);
      setError('Erro ao carregar clientes');
    } finally {
      setLoadingClientes(false);
    }
  };

  const carregarTabelasComerciais = async () => {
    try {
      console.log('💰 Carregando tabelas comerciais...');
      const token = getToken();
      let tabelas = [];

      if (servidorOkRef.current) {
        const response = await axiosInstance.get('/tabelas-comerciais/?apenas_ativas=true');
        tabelas = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      } else {
        tabelas = await buscarTabelasComerciaisCache();
        console.log('[OFFLINE] Tabelas comerciais do cache:', tabelas.length);
      }
      setTabelasComerciais(tabelas);
      console.log('✅ Tabelas comerciais carregadas:', tabelas);

      // Tentar usar a tabela configurada nos parâmetros do usuário
      let tabelaParaSelecionar = null;

      console.log('🔍 Verificando tabela padrão do usuário:', {
        usuario: usuario ? 'existe' : 'null',
        parametros: usuario?.parametros,
        id_tabela_comercial: usuario?.parametros?.id_tabela_comercial
      });

      if (usuario?.parametros?.id_tabela_comercial) {
        tabelaParaSelecionar = tabelas.find(t => t.id_tabela_comercial === usuario.parametros.id_tabela_comercial);
        if (tabelaParaSelecionar) {
          console.log('✅ Tabela do usuário selecionada:', tabelaParaSelecionar);
        } else {
          console.log('⚠️ Tabela ID', usuario.parametros.id_tabela_comercial, 'não encontrada na lista de tabelas');
        }
      }

      // Se não encontrou a tabela do usuário, NÃO selecionar automaticamente
      // Deixar null para forçar seleção manual na primeira busca
      if (!tabelaParaSelecionar) {
        console.log('⚠️ Usuário sem tabela padrão configurada. Irá perguntar na primeira busca.');
        setTabelaSelecionada(null);
      } else {
        setTabelaSelecionada(tabelaParaSelecionar);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tabelas comerciais:', error);
    }
  };

  const confirmarTabelaEBuscarProduto = async (tabela) => {
    console.log('✅ Tabela selecionada pelo usuário:', tabela);
    console.log('🔍 Campo perguntar_ao_vender da tabela:', tabela.perguntar_ao_vender);
    console.log('🔍 Tipo do campo:', typeof tabela.perguntar_ao_vender);
    setTabelaSelecionada(tabela);
    setOpenSelecionarTabela(false);

    // Agora buscar o produto com a tabela selecionada
    if (produtoPendenteTabela) {
      const termoBusca = produtoPendenteTabela;
      setProdutoPendenteTabela(null);

      // Buscar produto
      try {
        const token = getToken();
        console.log('🔍 Buscando produto:', termoBusca);

        let produtos;
        if (servidorOkRef.current) {
          let response = await axiosInstance.get(`/produtos/?search=${termoBusca}`);
          produtos = Array.isArray(response.data) ? response.data : (response.data.results || []);
        } else {
          produtos = await buscarProdutosHook(termoBusca);
        }

        if (produtos && produtos.length > 0) {
          if (produtos.length === 1) {
            await selecionarProduto(produtos[0]);
          } else {
            const produtosComEstoque = await Promise.all(
              produtos.map(async (produto) => {
                let valorVenda = produto.valor_venda || 0;
                let quantidadeEstoque = 0;

                if (operacao && operacao.id_deposito_baixa) {
                  try {
                    const resEstoque = await axiosInstance.get(
                      `/estoque/?id_produto=${produto.id_produto}&id_deposito=${operacao.id_deposito_baixa}`
                    );

                    const estoqueData = Array.isArray(resEstoque.data) ? resEstoque.data : (resEstoque.data.results || []);

                    if (estoqueData && estoqueData.length > 0) {
                      valorVenda = estoqueData[0].valor_venda || valorVenda;
                      quantidadeEstoque = estoqueData[0].quantidade || 0;
                    }
                  } catch (err) {
                    console.error('Erro ao buscar estoque:', err);
                  }
                }

                return {
                  ...produto,
                  valor_venda: valorVenda,
                  quantidade_estoque: quantidadeEstoque
                };
              })
            );

            setProdutosPesquisa(produtosComEstoque);
            setOpenPesquisaProduto(true);
          }
        } else {
          setError('Nenhum produto encontrado');
        }
      } catch (err) {
        console.error('❌ Erro ao buscar produto:', err);
        setError(`Erro ao buscar produto: ${err.response?.data?.detail || err.message}`);
      }
    }
  };

  const carregarPromocoes = async () => {
    try {
      console.log('🔄 Iniciando carregamento de promoções...');
      const promos = await promocaoService.obterPromocjesAtivas();
      console.log('📦 Resposta bruta da API:', promos);
      console.log('📦 Tipo de resposta:', typeof promos);

      let promocoesFormatadas = [];
      if (Array.isArray(promos)) {
        console.log('✅ Resposta é um array com', promos.length, 'itens');
        promocoesFormatadas = promos;
      } else if (promos && promos.results) {
        console.log('✅ Resposta tem propriedade results com', promos.results.length, 'itens');
        promocoesFormatadas = promos.results;
      } else {
        console.log('⚠️ Resposta não é array nem tem results:', promos);
      }

      console.log('📋 Promoções formatadas:', JSON.stringify(promocoesFormatadas, null, 2));

      setPromocoes(promocoesFormatadas);
      console.log('✅ Estado de promoções atualizado. Total:', promocoesFormatadas.length);

      return Promise.resolve(promocoesFormatadas);
    } catch (err) {
      console.error('❌ Erro ao carregar promoções:', err);
      console.error('Detalhes do erro:', err.message, err.response?.data);
      return Promise.resolve([]);
    }
  };

  // Função para processar a próxima validação da fila
  const processarProximaValidacao = () => {
    console.log('🔄 Processando próxima validação da fila (Venda Rápida) - entrando');

    setFilaValidacoes(prevFila => {
      console.log('📋 Fila atual (dentro do setter):', prevFila);
      if (!prevFila || prevFila.length === 0) {
        console.log('✅ Fila vazia - Todas as validações processadas (Venda Rápida)');
        return prevFila || [];
      }

      const proximaValidacao = prevFila[0];
      console.log('🎯 Abrindo modal (Venda Rápida) para:', proximaValidacao.tipo, proximaValidacao.dados);

      // Abre o modal correspondente
      if (proximaValidacao.tipo === 'atraso') {
        setAtrasoInfo(proximaValidacao.dados);
        setAcaoAtrasoAtual(proximaValidacao.acao);
        setOpenAtrasoModal(true);
      } else if (proximaValidacao.tipo === 'limite') {
        setLimiteInfo(proximaValidacao.dados);
        setAcaoLimiteAtual(proximaValidacao.acao);
        setOpenLimiteModal(true);
      } else if (proximaValidacao.tipo === 'estoque') {
        setEstoqueInfo(proximaValidacao.dados);
        setItemPendenteEstoque(proximaValidacao.item);
        setAcaoEstoqueAtual(proximaValidacao.acao);
        setOpenEstoqueModal(true);
      }

      const restante = prevFila.slice(1);
      console.log('📋 Fila após remoção (restante):', restante);
      return restante;
    });
  };

  const selecionarClienteVenda = async (clienteSelecionado) => {
    console.log('🎯🎯🎯 selecionarClienteVenda CHAMADA:', clienteSelecionado);
    console.log('🔍 Operação atual:', operacao);
    console.log('🔍 validar_atraso:', operacao?.validar_atraso);
    console.log('🔍 acao_atraso:', operacao?.acao_atraso);
    console.log('🔍 atrasoAutorizado ANTES:', atrasoAutorizado);
    console.log('🔍 limiteAutorizado ANTES:', limiteAutorizado);
    console.log('🔍 estoqueAutorizado ANTES:', estoqueAutorizado);

    // RESETAR FLAGS ao trocar de cliente (mas não ao carregar cliente padrão pela primeira vez)
    // Se já tem um cliente selecionado e está trocando, resetar as autorizações
    if (cliente && cliente.id_cliente !== clienteSelecionado.id_cliente) {
      console.log('🔄 TROCANDO cliente - Resetando flags de autorização');
      setLimiteAutorizado(false);
      setAtrasoAutorizado(false);
      setEstoqueAutorizado(false);
    } else {
      console.log('ℹ️ Primeiro cliente ou mesmo cliente - Mantendo flags');
    }

    // Verificar se há operação configurada
    if (!operacao) {
      setCliente(clienteSelecionado);
      setOpenSelecionarCliente(false);
      setBuscaCliente('');
      return;
    }

    // ========================================
    // ETAPA 1: EXECUTAR TODAS AS VALIDAÇÕES
    // ========================================

    let temProblemaLimite = false;
    let temProblemaAtraso = false;
    let limiteInfo = null;
    let atrasoInfo = null;
    let validacaoLimite = 'nao_validar';
    let acaoAtraso = 'nao_validar';

    // Validar limite de crédito se configurado na operação
    validacaoLimite = operacao.validacao_limite_credito || 'nao_validar';
    console.log('💳 Verificando limite:', { validacaoLimite, gera_financeiro: operacao.gera_financeiro });
    if (validacaoLimite !== 'nao_validar' && operacao.gera_financeiro) {
      try {
        const limiteResponse = await axiosInstance.post('/verificar-limite-cliente/', {
          id_cliente: clienteSelecionado.id_cliente,
          valor_venda: 0 // Verifica apenas o limite atual sem considerar venda
        });

        const limiteData = limiteResponse.data;

        // Normaliza e armazena as informações de limite para exibição no UI
        const limiteInfoLocal = {
          limiteTotal: limiteData.cliente?.limite_credito ?? null,
          limiteUtilizado: limiteData.cliente?.saldo_devedor ?? 0,
          limiteDisponivel: limiteData.cliente?.credito_disponivel ?? (limiteData.cliente?.limite_credito ? (limiteData.cliente.limite_credito - (limiteData.cliente?.saldo_devedor || 0)) : 0),
          valorExcedente: limiteData.valor_excedente ?? 0
        };

        // Armazenar no estado sempre, para podermos exibir Limite/Utilizado/Disponível no painel
        setLimiteInfo(limiteInfoLocal);
        setAcaoLimiteAtual(validacaoLimite);

        // Se o cliente já está com limite negativo (sem considerar venda nova), marcar problema
        if ((limiteInfoLocal.limiteDisponivel ?? 0) < 0) {
          temProblemaLimite = true;
          console.log('⚠️ PROBLEMA DETECTADO: Limite excedido', limiteInfoLocal);
        }
      } catch (err) {
        console.error('Erro ao validar limite:', err);
      }
    }

    console.log('🚀 Chegou na parte de validação de atraso!');

    // Validar cliente em atraso se configurado na operação
    const validarAtraso = operacao.validar_atraso || false;
    const diasTolerancia = operacao.dias_atraso_tolerancia || 0;
    acaoAtraso = operacao.acao_atraso || 'alertar';

    console.log('🔍 Verificando validação de atraso:', {
      validarAtraso,
      acaoAtraso,
      atrasoAutorizado,
      'vai validar?': validarAtraso && acaoAtraso !== 'nao_validar' && !atrasoAutorizado
    });

    if (validarAtraso && acaoAtraso !== 'nao_validar' && !atrasoAutorizado) {
      try {
        console.log('🚀🚀🚀 CHAMANDO API DE VALIDAÇÃO DE ATRASO...');
        const atrasoResponse = await axiosInstance.post('/validar-cliente-atraso/', {
          id_cliente: clienteSelecionado.id_cliente,
          dias_tolerancia: diasTolerancia
        });

        console.log('🔍🔍🔍 RESPOSTA DA API DE ATRASO:');
        console.log('   em_atraso:', atrasoResponse.data.em_atraso);
        console.log('   valor_total_atraso:', atrasoResponse.data.valor_total_atraso);
        console.log('   qtd_titulos:', atrasoResponse.data.qtd_titulos);
        console.log('   Objeto completo:', JSON.stringify(atrasoResponse.data, null, 2));
        console.log('🔍 Parâmetros de validação atraso:', { validarAtraso, acaoAtraso, diasTolerancia, atrasoAutorizado });

        // Verificar se há atraso REAL.
        // Comportamento antigo: abrir alerta já quando `em_atraso` fosse true.
        // A condição mais estrita checava também valores > 0, mas isso causava
        // casos em que o modal não abria. Vamos admitir atraso real se a flag
        // `em_atraso` for true OU se houver valores positivos retornados.
        const temAtrasoRealStrict = atrasoResponse.data.em_atraso &&
          atrasoResponse.data.valor_total_atraso > 0 &&
          atrasoResponse.data.qtd_titulos > 0;

        const temAtrasoReal = atrasoResponse.data.em_atraso || temAtrasoRealStrict;

        console.log('💬💬💬 DECISÃO DE ATRASO:');
        console.log('   temAtrasoRealStrict:', temAtrasoRealStrict);
        console.log('   temAtrasoReal:', temAtrasoReal);
        console.log('   em_atraso da API:', atrasoResponse.data.em_atraso);

        if (temAtrasoReal) {
          temProblemaAtraso = true;
          atrasoInfo = atrasoResponse.data;
          console.log('⚠️⚠️⚠️ PROBLEMA DETECTADO: Cliente em atraso', atrasoInfo);
          // Armazenar no estado para uso posterior
          setAtrasoInfo(atrasoInfo);
          setAcaoAtrasoAtual(acaoAtraso);
        } else {
          console.log('✅✅✅ Cliente SEM atraso (ou valores zerados)');
        }
      } catch (err) {
        console.error('Erro ao validar atraso:', err);
      }
    } else {
      console.log('ℹ️ Validação de atraso não executada:', {
        validarAtraso,
        acaoAtraso,
        atrasoAutorizado,
        motivo: !validarAtraso ? 'validar_atraso desabilitado' :
          acaoAtraso === 'nao_validar' ? 'acao_atraso = nao_validar' :
            atrasoAutorizado ? 'já autorizado anteriormente' : 'desconhecido'
      });
    }

    // ========================================
    // ETAPA 2: COLETAR TODAS AS VALIDAÇÕES PENDENTES
    // Sistema de fila: todas as validações são coletadas e processadas em sequência
    // ========================================

    console.log('📊📊📊 RESUMO DAS VALIDAÇÕES:');
    console.log('   temProblemaAtraso:', temProblemaAtraso);
    console.log('   temProblemaLimite:', temProblemaLimite);
    console.log('   limiteAutorizado:', limiteAutorizado);
    console.log('   atrasoAutorizado:', atrasoAutorizado);
    console.log('   atrasoInfo:', atrasoInfo);
    console.log('   limiteInfo:', limiteInfo);

    const validacoesPendentes = [];

    // Verificar BLOQUEIOS primeiro (impedem a continuação)
    if (temProblemaAtraso && acaoAtraso === 'bloquear') {
      console.log('🚫 BLOQUEIO: Cliente em atraso');
      setError(`❌ Cliente com títulos em atraso. Operação bloqueada.`);
      return;
    }

    if (temProblemaLimite && validacaoLimite === 'bloquear') {
      console.log('🚫 BLOQUEIO: Limite de crédito excedido');
      setError(`❌ Cliente com limite excedido. Crédito disponível: R$ ${limiteInfo.limiteDisponivel.toFixed(2)}`);
      return;
    }

    // Coletar todas as validações que precisam de interação (alertar ou solicitar_senha)
    // Prioridade: 1) Atraso, 2) Limite, 3) Estoque

    if (temProblemaAtraso && (acaoAtraso === 'alertar' || acaoAtraso === 'solicitar_senha')) {
      console.log('📝 Adicionando ATRASO à fila de validações');
      validacoesPendentes.push({
        tipo: 'atraso',
        dados: atrasoInfo,
        acao: acaoAtraso
      });
    }

    if (temProblemaLimite && (validacaoLimite === 'alertar' || validacaoLimite === 'solicitar_senha')) {
      console.log('📝 Adicionando LIMITE à fila de validações');
      validacoesPendentes.push({
        tipo: 'limite',
        dados: limiteInfo,
        acao: validacaoLimite
      });
    }

    console.log('📋 Total de validações pendentes:', validacoesPendentes.length);
    console.log('📋 Validações:', validacoesPendentes.map(v => v.tipo).join(', '));

    if (validacoesPendentes.length > 0) {
      console.log('🚀 Iniciando processamento da fila de validações');
      // Armazenar a fila e processar a primeira
      setFilaValidacoes(validacoesPendentes);
      setCliente(clienteSelecionado);
      setOpenSelecionarCliente(false);
      setBuscaCliente('');

      // Processar a primeira validação imediatamente
      const primeiraValidacao = validacoesPendentes[0];
      console.log('🎯 Abrindo primeira validação:', primeiraValidacao.tipo);

      // Remove a primeira da fila (será processada agora)
      setFilaValidacoes(validacoesPendentes.slice(1));

      if (primeiraValidacao.tipo === 'atraso') {
        setOpenAtrasoModal(true);
      } else if (primeiraValidacao.tipo === 'limite') {
        setOpenLimiteModal(true);
      }
      return;
    }

    console.log('✅ Nenhuma validação pendente - Prosseguindo normalmente');

    // NÃO resetar flags aqui — elas devem persistir durante a sessão
    // O reset deve acontecer apenas ao limpar a venda

    setCliente(clienteSelecionado);
    setOpenSelecionarCliente(false);
    setBuscaCliente('');
  };

  const salvarImagemFundo = (url) => {
    setImagemFundo(url);
    localStorage.setItem('vendaRapidaImagemFundo', url);
    axiosInstance.patch('/user-preferencias/', { venda_rapida_bg: url }).catch(() => {});
    setOpenConfigFundo(false);
    console.log('✅ Imagem de fundo salva');
  };

  const removerImagemFundo = () => {
    setImagemFundo('');
    localStorage.removeItem('vendaRapidaImagemFundo');
    axiosInstance.patch('/user-preferencias/', { venda_rapida_bg: null }).catch(() => {});
    setOpenConfigFundo(false);
    console.log('✅ Imagem de fundo removida');
  };

  const handleImagemFundoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Verificar se é imagem
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.)');
        return;
      }

      // Converter para base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setImagemFundo(base64String);
        console.log('✅ Imagem carregada do computador');
      };
      reader.onerror = () => {
        alert('Erro ao carregar a imagem. Tente novamente.');
      };
      reader.readAsDataURL(file);
    }
  };

  const buscarProduto = async (termoBusca, abrirModalSeAlertar = false) => {
    // Verificar se há tabela selecionada OU se o usuário tem tabela padrão
    if (!tabelaSelecionada) {
      // Guardar o termo de busca e abrir modal
      setProdutoPendenteTabela(termoBusca);
      setOpenSelecionarTabela(true);
      return null;
    }

    try {
      const token = getToken();

      console.log('🔍 Buscando produto:', termoBusca);

      // ============================================
      // VERIFICAR SE É CÓDIGO DE BALANÇA
      // ============================================
      const resultadoBalanca = await balancaService.processarCodigoBarras(termoBusca);
      
      if (resultadoBalanca) {
        if (resultadoBalanca.sucesso) {
          console.log('⚖️ Produto de balança identificado:', resultadoBalanca);
          setSuccess(resultadoBalanca.mensagem);
          
          // Armazenar informações da balança
          setProdutoBalanca(resultadoBalanca);
          
          // Definir quantidade do produto de balança
          setQuantidade(resultadoBalanca.quantidade);
          
          // Selecionar o produto automaticamente
          return await selecionarProduto(resultadoBalanca.produto, abrirModalSeAlertar);
        } else {
          // Erro ao processar código de balança
          setError(resultadoBalanca.mensagem);
          return null;
        }
      }
      
      // Não é código de balança, fazer busca normal
      // Buscar produto usando search (funciona para código e nome)
      let url = `/produtos/?search=${termoBusca}`;
      console.log('📡 URL busca:', url);

      let produtos;
      if (servidorOkRef.current) {
        let response = await axiosInstance.get(url);
        console.log('✅ Resposta busca:', response.data);
        produtos = Array.isArray(response.data) ? response.data : (response.data.results || []);
      } else {
        console.log('[OFFLINE] Buscando produto no cache local:', termoBusca);
        produtos = await buscarProdutosHook(termoBusca);
      }

      if (produtos && produtos.length > 0) {
        console.log('✅ Encontrou', produtos.length, 'produto(s)');

        // Se encontrou apenas 1 produto, seleciona automaticamente
        if (produtos.length === 1) {
          return await selecionarProduto(produtos[0], abrirModalSeAlertar);
        } else {
          // Se encontrou múltiplos, abre diálogo de seleção
          // Carregar estoque de cada produto (apenas quando online)
          const produtosComEstoque = await Promise.all(
            produtos.map(async (produto) => {
              let valorVenda = produto.valor_venda || 0;
              let quantidadeEstoque = produto.quantidade_estoque || 0;

              if (servidorOkRef.current && operacao && operacao.id_deposito_baixa) {
                try {
                  const resEstoque = await axiosInstance.get(
                    `/estoque/?id_produto=${produto.id_produto}&id_deposito=${operacao.id_deposito_baixa}`
                  );

                  // A API de estoque também pode retornar array ou objeto
                  const estoqueData = Array.isArray(resEstoque.data) ? resEstoque.data : (resEstoque.data.results || []);

                  if (estoqueData && estoqueData.length > 0) {
                    valorVenda = estoqueData[0].valor_venda || valorVenda;
                    quantidadeEstoque = estoqueData[0].quantidade || 0;
                  }
                } catch (err) {
                  console.error('Erro ao buscar estoque:', err);
                }
              }

              return {
                ...produto,
                valor_venda: valorVenda,
                quantidade_estoque: quantidadeEstoque
              };
            })
          );

          setProdutosPesquisa(produtosComEstoque);
          setOpenPesquisaProduto(true);
          return null;
        }
      } else {
        console.log('❌ Nenhum produto encontrado');
        setError('Nenhum produto encontrado');
        return null;
      }
    } catch (err) {
      console.error('❌ Erro ao buscar produto:', err);
      console.error('Detalhes do erro:', err.response?.data);
      setError(`Erro ao buscar produto: ${err.response?.data?.detail || err.message}`);
      return null;
    }
  };

  const selecionarProduto = async (produto, abrirModalSeAlertar = false) => {
    try {
      const token = getToken();

      console.log('✅ Produto selecionado:', produto);

      // Buscar estoque do produto no depósito da operação
      let valorVenda = produto.valor_venda || 0;
      let estoqueDisponivel = 0;

      if (operacao && operacao.id_deposito_baixa && servidorOkRef.current) {
        console.log('🔍 Buscando estoque no depósito:', operacao.id_deposito_baixa);
        try {
          const resEstoque = await axiosInstance.get(
            `/estoque/?id_produto=${produto.id_produto}&id_deposito=${operacao.id_deposito_baixa}`
          );

          // Tratar resposta como array ou objeto com results
          const estoqueData = Array.isArray(resEstoque.data) ? resEstoque.data : (resEstoque.data.results || []);

          console.log('📦 Resposta do estoque:', estoqueData);

          if (estoqueData && estoqueData.length > 0) {
            valorVenda = estoqueData[0].valor_venda || valorVenda;
            estoqueDisponivel = parseFloat(estoqueData[0].quantidade || 0);
            console.log('📦 Estoque encontrado - Quantidade:', estoqueDisponivel);
          } else {
            console.log('⚠️ Nenhum registro de estoque encontrado para este depósito');
          }
        } catch (err) {
          console.warn('[OFFLINE] Falha ao buscar estoque — usando dados do cache:', err.message);
          estoqueDisponivel = parseFloat(produto.estoque_total || 0);
        }
      } else if (operacao && operacao.id_deposito_baixa && !servidorOkRef.current) {
        console.log('[OFFLINE] Servidor indisponível — usando estoque do cache do produto');
        // Tentar usar estoque do depósito específico se estiver no cache do produto
        const estoqueDeposito = produto.estoque_por_deposito?.find(
          d => String(d.id_deposito) === String(operacao.id_deposito_baixa)
        );
        estoqueDisponivel = estoqueDeposito
          ? parseFloat(estoqueDeposito.quantidade || 0)
          : parseFloat(produto.estoque_total || 0);
        console.log('[OFFLINE] Estoque usado do cache:', estoqueDisponivel);
      } else {
        console.log('⚠️ Operação sem depósito de baixa configurado');
      }

      // Guardar preço base (sem tabela)
      const precoBase = parseFloat(valorVenda);
      setPrecoBaseProduto(precoBase);

      // Aplicar tabela comercial no preço
      let precoFinal = precoBase;
      if (tabelaSelecionada && tabelaSelecionada.percentual !== 0) {
        const ajuste = precoFinal * (tabelaSelecionada.percentual / 100);
        precoFinal = precoFinal + ajuste;
        console.log(`💰 Tabela "${tabelaSelecionada.nome}": R$ ${valorVenda} → R$ ${precoFinal.toFixed(2)} (${tabelaSelecionada.percentual}%)`);
      }

      setValorUnitario(precoFinal);
      setCodigoProduto(produto.codigo_produto);
      setIdProdutoSelecionado(produto.id_produto);  // Armazenar ID do produto
      // Usar nome_produto ou descricao, o que estiver disponível
      setNomeProduto(produto.nome_produto || produto.descricao || produto.codigo_produto);
      setControlaProdutoLote(produto.controla_lote || false);
      setLotePreSelecionado(null);
      setOpenPesquisaProduto(false);

      // Se produto controla lote, buscar lotes e abrir seleção imediatamente
      if (produto.controla_lote) {
        if (!servidorOkRef.current) {
          console.warn('[OFFLINE] Produto controla lote mas servidor está offline — lote ignorado.');
        } else {
          try {
            const resLotes = await axiosInstance.get(`/lote-produto/por_produto/?id_produto=${produto.id_produto}`);
            const lotes = Array.isArray(resLotes.data) ? resLotes.data : (resLotes.data?.results || []);
            if (!lotes || lotes.length === 0) {
              setError('Este produto controla lote, mas não há lotes disponíveis com estoque. Cadastre um lote primeiro.');
              setCodigoProduto('');
              setIdProdutoSelecionado(null);
              setNomeProduto('');
              setValorUnitario(0);
              return null;
            }
            setLotesDisponiveis(lotes);
            setOpenSelecionarLote(true);
          } catch (err) {
            console.error('[LOTE] Erro ao buscar lotes ao selecionar produto:', err);
          }
        }
      }

      // ========================================
      // VALIDAR ESTOQUE ao selecionar produto
      // ========================================
      console.log('🔎 CHECKPOINT - Verificando validação de estoque:');
      console.log('   operacao existe?', !!operacao);
      console.log('   validar_estoque:', operacao?.validar_estoque);
      console.log('   acao_estoque:', operacao?.acao_estoque);
      console.log('   estoqueAutorizado:', estoqueAutorizado);
      console.log('   estoqueDisponivel:', estoqueDisponivel);
      console.log('   Vai validar?', operacao && operacao.validar_estoque && operacao.acao_estoque !== 'nao_validar' && !estoqueAutorizado);

      if (operacao && operacao.validar_estoque && operacao.acao_estoque !== 'nao_validar' && !estoqueAutorizado) {
        console.log('🔍🔍🔍 ENTROU NA VALIDAÇÃO DE ESTOQUE!');
        console.log('   validar_estoque:', operacao.validar_estoque);
        console.log('   acao_estoque:', operacao.acao_estoque);
        console.log('   estoqueAutorizado:', estoqueAutorizado);
        console.log('   estoqueDisponivel:', estoqueDisponivel);

        if (estoqueDisponivel <= 0) {
          console.log('⚠️ PRODUTO SEM ESTOQUE!');
          setEstoqueInfo({
            produto: produto.nome_produto || produto.descricao,
            disponivel: estoqueDisponivel,
            solicitado: 1,
            faltam: 1 - estoqueDisponivel
          });
          setAcaoEstoqueAtual(operacao.acao_estoque);

          if (operacao.acao_estoque === 'alertar') {
            console.log('⚠️ Produto sem estoque - ação é alertar');
            setEstoqueInfo({
              produto: produto.nome_produto || produto.descricao,
              disponivel: estoqueDisponivel,
              solicitado: 1,
              faltam: 1 - estoqueDisponivel
            });
            setAcaoEstoqueAtual(operacao.acao_estoque);

            if (abrirModalSeAlertar) {
              console.log('⚠️ Abrindo modal de estoque imediatamente por Enter/auto-seleção');
              setItemPendenteEstoque({
                codigoProduto: produto.codigo_produto || produto.codigo,
                idProdutoSelecionado: produto.id_produto,
                nomeProduto: produto.nome_produto || produto.descricao || produto.codigo_produto,
                quantidade: 1,
                valorUnitario: precoFinal || valorVenda,
                descontoItem: 0
              });
              setOpenEstoqueModal(true);
              return produto;
            }

            // Para 'alertar' sem pedir modal agora: permitir seleção (modal será aberto ao tentar adicionar)
            return produto;
          } else if (operacao.acao_estoque === 'bloquear') {
            console.log('🚫 Bloqueando por estoque insuficiente');
            setError(`❌ Produto sem estoque. Disponível: ${estoqueDisponivel.toFixed(3)}`);
            // Limpar seleção
            setCodigoProduto('');
            setIdProdutoSelecionado(null);
            setNomeProduto('');
            setValorUnitario(0);
            return null;
          } else if (operacao.acao_estoque === 'solicitar_senha') {
            console.log('🔐 Solicitando senha para estoque');
            setOpenEstoqueModal(true);
            return produto;
          }
        } else {
          console.log('✅ Produto com estoque disponível');
        }
      }

      // Focar no campo quantidade
      setTimeout(() => {
        document.getElementById('quantidade-input')?.focus();
      }, 100);

      return produto;
    } catch (err) {
      console.error('Erro ao selecionar produto:', err);
      return null;
    }
  };

  const handleCodigoProdutoKeyPress = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (!codigoProduto) return;

      await buscarProduto(codigoProduto, true);
    }
  };

  const handleQuantidadeKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Focar no campo de preço
      const precoInput = document.querySelector('input[type="number"][step="0.01"]');
      if (precoInput) {
        precoInput.focus();
      }
    }
  };

  const handlePrecoKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Adicionar o item automaticamente
      adicionarItem();
    }
  };

  const verificarPromocao = (idProduto, qtd) => {
    /**
     * Verifica se o produto tem promoção ativa
     * Retorna { desconto_percentual, desconto_valor, promocao_nome } ou null
     */
    if (!promocoesAtivas || promocoesAtivas.length === 0) {
      console.log('DEBUG: Nenhuma promoção ativa carregada');
      return null;
    }

    console.log('DEBUG: Verificando promoções para produto', idProduto, 'com quantidade', qtd);
    console.log('DEBUG: Promoções ativas:', JSON.stringify(promocoesAtivas, null, 2));

    for (const promo of promocoesAtivas) {
      console.log('DEBUG: Analisando promoção:', promo.nome_promocao, 'produtos:', promo.promocao_produtos);

      // Verificar se o produto está na promoção
      const produtoNaPromo = promo.promocao_produtos?.find(
        pp => {
          console.log('DEBUG: Comparando produto:', pp.id_produto, '(tipo:', typeof pp.id_produto, ') com', idProduto, '(tipo:', typeof idProduto, ')');
          return parseInt(pp.id_produto) === parseInt(idProduto);
        }
      );

      if (produtoNaPromo) {
        console.log('DEBUG: Produto encontrado em promoção! Verificando quantidade mínima:', produtoNaPromo.quantidade_minima);
        console.log('DEBUG: Tipos - qtd:', typeof qtd, 'valor:', qtd, 'quantidade_minima:', typeof produtoNaPromo.quantidade_minima, 'valor:', produtoNaPromo.quantidade_minima);

        // Converter ambos para número para comparação correta
        const qtdNum = parseFloat(qtd);
        const qtdMinNum = parseFloat(produtoNaPromo.quantidade_minima);

        console.log('DEBUG: Comparando - qtd numérica:', qtdNum, '>= qtd mínima:', qtdMinNum, '?', qtdNum >= qtdMinNum);

        // Verificar se a quantidade é >= quantidade_minima
        if (qtdNum >= qtdMinNum) {
          console.log('DEBUG: Quantidade OK! Aplicando desconto');

          // Usar desconto individual do produto se disponível
          let descontoFinal = parseFloat(promo.valor_desconto);
          if (produtoNaPromo.valor_desconto_produto) {
            descontoFinal = parseFloat(produtoNaPromo.valor_desconto_produto);
            console.log('DEBUG: Usando desconto individual do produto:', descontoFinal);
          }

          return {
            desconto_percentual: promo.tipo_desconto === 'percentual' ? descontoFinal : 0,
            desconto_valor: promo.tipo_desconto === 'valor' ? descontoFinal : 0,
            promocao_nome: promo.nome_promocao,
            tipo_desconto: promo.tipo_desconto,
            valor_desconto: descontoFinal,
            quantidade_minima: produtoNaPromo.quantidade_minima,
            valor
          };
        } else {
          console.log('DEBUG: Quantidade insuficiente. Mínima:', qtdMinNum, 'Informada:', qtdNum);
        }
      }
    }

    console.log('DEBUG: Nenhuma promoção encontrada');
    return null;
  };

  // Função auxiliar para adicionar item sem validação (após autorização)
  const efetivarAdicaoItem = async (itemData) => {
    const timestamp = Date.now();
    console.log(`✅ [${timestamp}] efetivarAdicaoItem chamado (via modal Continuar)`);
    const { codigoProduto: cod, idProdutoSelecionado: idProd, nomeProduto: nome, quantidade: qtd, valorUnitario: valor, descontoItem: desc } = itemData;

    // 🛡️ VERIFICAÇÃO ANTI-DUPLICAÇÃO: Verificar se este produto já foi adicionado recentemente
    const agora = Date.now();
    const itemJaExiste = itens.find(item =>
      item.id_produto === idProd &&
      item.quantidade === qtd &&
      item.valor_unitario === valor &&
      (agora - item.id) < 2000 // Se foi adicionado há menos de 2 segundos
    );

    if (itemJaExiste) {
      console.log('⚠️ DUPLICAÇÃO DETECTADA - Item já existe na lista, pulando adição');
      console.log('   Item existente ID:', itemJaExiste.id, 'Produto:', itemJaExiste.nome_produto);
      return; // NÃO adiciona novamente
    }

    console.log('ℹ️ Adicionando produto com tabela:', tabelaSelecionada?.nome || 'Nenhuma');

    let desconto = desc;
    let descricaoPromocao = '';

    console.log('🔍 Verificando promoção para produto:', idProd, 'com quantidade:', qtd);
    const promocao = verificarPromocao(idProd, qtd);
    console.log('📌 Resultado da verificação:', promocao);

    if (promocao) {
      console.log('✅ PROMOÇÃO ENCONTRADA:', promocao.promocao_nome);
      if (promocao.tipo_desconto === 'percentual') {
        desconto = promocao.desconto_percentual;
        console.log('📊 Desconto percentual:', desconto, '%');
      } else {
        // Para desconto em valor, converter para percentual
        const valorItem = qtd * valor;
        desconto = (promocao.valor_desconto / valorItem) * 100;
        console.log('[DESCONTO] Desconto em valor: R$', promocao.valor_desconto, '->', desconto.toFixed(2), '%');
      }
      descricaoPromocao = ` (${promocao.promocao_nome})`;
    } else {
      console.log('❌ Nenhuma promoção encontrada para este produto');
    }

    const valorItem = qtd * valor;
    const valorDesconto = (valorItem * desconto) / 100;
    const valorTotalItem = valorItem - valorDesconto;

    console.log('[DESCONTO] Valores calculados:', { valorItem, desconto: desconto.toFixed(2), valorDesconto: valorDesconto.toFixed(2), valorTotalItem: valorTotalItem.toFixed(2) });

    // Verificar se este produto exige seleção de lote
    if (controlaProdutoLote) {
      if (!lotePreSelecionado) {
        setError('Este produto exige seleção de lote. Selecione um lote antes de adicionar.');
        return;
      }
    }

    const novoItem = {
      id: Date.now(),
      id_produto: idProd,
      codigo: cod,
      nome: nome,
      quantidade: parseFloat(qtd),
      preco_base: precoBaseProduto || parseFloat(valor),
      valor_unitario: parseFloat(valor),
      desconto_percentual: parseFloat(desconto),
      desconto_valor: valorDesconto,
      valor_total: valorTotalItem,
      tem_promocao: !!promocao,
      id_lote: lotePreSelecionado?.id_lote || null,
      numero_lote: lotePreSelecionado?.numero_lote || '',
    };

    console.log('[DESCONTO] Item criado:', { id_produto: novoItem.id_produto, quantidade: novoItem.quantidade, desconto_valor: novoItem.desconto_valor });

    setItens(prevItens => [...prevItens, novoItem]);

    // Limpar campos
    setCodigoProduto('');
    setIdProdutoSelecionado(null);
    setNomeProduto('');
    setQuantidade(1);
    setValorUnitario(0);
    setPrecoBaseProduto(0);
    setDescontoItem(0);
    setProdutoBalanca(null);
    setControlaProdutoLote(false);
    setLotePreSelecionado(null);

    codigoProdutoRef.current?.focus();

    if (promocao) {
      setSuccess(`Item adicionado! Promocao: ${promocao.promocao_nome}`);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setSuccess('Item adicionado!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const adicionarItem = async () => {
    const timestamp = Date.now();
    console.log(`📥 [${timestamp}] adicionarItem chamado`);
    console.log('   codigoProduto:', codigoProduto);
    console.log('   idProdutoSelecionado:', idProdutoSelecionado);
    console.log('   quantidade:', quantidade);
    console.log('   valorUnitario:', valorUnitario);

    if (!codigoProduto || !idProdutoSelecionado || quantidade <= 0 || valorUnitario <= 0) {
      setError('Preencha todos os campos do produto');
      return;
    }

    // Se o modal de estoque estiver aberto e houver um item pendente, tratar Enter como confirmação
    if (openEstoqueModal && itemPendenteEstoque && acaoEstoqueAtual === 'alertar') {
      console.log('⏎ Enter detectado enquanto modal de estoque aberto - confirmando adição (Continuar Mesmo Assim)');
      setEstoqueAutorizado(true);
      setOpenEstoqueModal(false);
      // efetivarAdicaoItem já possui proteção anti-duplicação
      efetivarAdicaoItem(itemPendenteEstoque);
      setItemPendenteEstoque(null);
      // Processar próxima validação da fila caso exista
      setTimeout(() => processarProximaValidacao(), 100);
      return;
    }

    // Flag para controlar se deve prosseguir com a adição do item
    let deveProsseguir = true;

    // Validar estoque se configurado na operação
    if (operacao && operacao.validar_estoque && operacao.acao_estoque !== 'nao_validar') {
      try {
        const produtoResponse = await axiosInstance.get(`/produtos/${idProdutoSelecionado}/`);
        const produto = produtoResponse.data;

        // Atualizar flag de controle de lote com dados frescos da API
        if (produto.controla_lote !== undefined) {
          setControlaProdutoLote(!!produto.controla_lote);
        }

        let estoqueDisponivel = 0;
        if (operacao.id_deposito_baixa && produto.estoque_por_deposito) {
          const estoqueDeposito = produto.estoque_por_deposito.find(
            est => Number(est.id_deposito) === Number(operacao.id_deposito_baixa)
          );
          estoqueDisponivel = estoqueDeposito ? parseFloat(estoqueDeposito.quantidade_atual || estoqueDeposito.quantidade) : 0;
        } else {
          estoqueDisponivel = parseFloat(produto.estoque_atual || 0);
        }

        const quantidadeSolicitada = parseFloat(quantidade);

        if (estoqueDisponivel < quantidadeSolicitada) {
          const faltam = quantidadeSolicitada - estoqueDisponivel;
          setEstoqueInfo({
            produto: produto.nome_produto || nomeProduto,
            disponivel: estoqueDisponivel,
            solicitado: quantidadeSolicitada,
            faltam: faltam
          });
          setAcaoEstoqueAtual(operacao.acao_estoque);
          setItemPendenteEstoque({
            codigoProduto,
            idProdutoSelecionado,
            nomeProduto,
            quantidade,
            valorUnitario,
            descontoItem
          });

          if (operacao.acao_estoque === 'alertar') {
            console.log(`🚨 [${timestamp}] Alerta de estoque - abrindo modal e NÃO PROSSEGUINDO`);
            setOpenEstoqueModal(true);
            deveProsseguir = false; // NÃO adiciona o item - usuário precisa clicar em 'Continuar Mesmo Assim'
          } else if (operacao.acao_estoque === 'bloquear') {
            setError(`❌ Estoque insuficiente. Disponível: ${estoqueDisponivel.toFixed(3)}, Solicitado: ${quantidadeSolicitada.toFixed(3)}`);
            deveProsseguir = false;
          } else if (operacao.acao_estoque === 'solicitar_senha') {
            setOpenEstoqueModal(true);
            deveProsseguir = false; // Aguarda senha do supervisor
          }
        }
      } catch (err) {
        console.error('Erro ao validar estoque:', err);
      }
    }

    // 🛑 SÓ PROSSEGUE SE deveProsseguir === true
    if (!deveProsseguir) {
      console.log(`🛑 [${timestamp}] deveProsseguir=false - PARANDO AQUI (modal será usado)`);
      return;
    }

    console.log(`✅ [${timestamp}] deveProsseguir=true - Continuando com adição do item`);

    // Verificar se deve perguntar sobre tabela comercial ao adicionar produto
    // Só pergunta se NÃO tem tabela selecionada (null = sem tabela padrão configurada)
    if (itens.length === 0 && !tabelaSelecionada && tabelasComerciais.length > 0) {
      console.log('❓ Primeira adição de produto SEM tabela padrão - perguntando sobre tabela comercial');
      setOpenSelecionarTabela(true);
      return;
    }

    console.log('ℹ️ Adicionando produto com tabela:', tabelaSelecionada?.nome || 'Nenhuma');

    let desconto = descontoItem;
    let descricaoPromocao = '';

    console.log('🔍 Verificando promoção para produto:', idProdutoSelecionado, 'com quantidade:', quantidade);
    // Verificar promoção
    const promocao = verificarPromocao(idProdutoSelecionado, quantidade);
    console.log('📌 Resultado da verificação:', promocao);

    if (promocao) {
      console.log('✅ PROMOÇÃO ENCONTRADA:', promocao.promocao_nome);
      if (promocao.tipo_desconto === 'percentual') {
        desconto = promocao.desconto_percentual;
        console.log('📊 Desconto percentual:', desconto, '%');
      } else {
        // Para desconto em valor, converter para percentual
        const valorItem = quantidade * valorUnitario;
        desconto = (promocao.valor_desconto / valorItem) * 100;
        console.log('[DESCONTO] Desconto em valor: R$', promocao.valor_desconto, '->', desconto.toFixed(2), '%');
      }
      descricaoPromocao = ` (${promocao.promocao_nome})`;
    } else {
      console.log('❌ Nenhuma promoção encontrada para este produto');
    }

    const valorItem = quantidade * valorUnitario;
    const valorDesconto = (valorItem * desconto) / 100;
    const valorTotalItem = valorItem - valorDesconto;

    console.log('[DESCONTO] Valores calculados:', { valorItem, desconto: desconto.toFixed(2), valorDesconto: valorDesconto.toFixed(2), valorTotalItem: valorTotalItem.toFixed(2) });

    // Verificar se este produto exige seleção de lote
    if (controlaProdutoLote) {
      if (!lotePreSelecionado) {
        setError('Este produto exige seleção de lote. Selecione um lote antes de adicionar.');
        return;
      }
    }

    const novoItem = {
      id: Date.now(),
      id_produto: idProdutoSelecionado,  // Incluir ID do produto
      codigo: codigoProduto,
      nome: nomeProduto,  // Adicionar nome do produto
      quantidade: parseFloat(quantidade),
      preco_base: precoBaseProduto || parseFloat(valorUnitario),  // Usar preço base guardado
      valor_unitario: parseFloat(valorUnitario),
      desconto_percentual: parseFloat(desconto),
      desconto_valor: valorDesconto,
      valor_total: valorTotalItem,
      tem_promocao: !!promocao,
      id_lote: lotePreSelecionado?.id_lote || null,
      numero_lote: lotePreSelecionado?.numero_lote || '',
    };

    console.log('[DESCONTO] Item criado:', { id_produto: novoItem.id_produto, quantidade: novoItem.quantidade, desconto_valor: novoItem.desconto_valor });
    console.log(`➕ [${timestamp}] ADICIONANDO ITEM DIRETO (sem modal) - Produto: ${novoItem.nome_produto}`);

    setItens(prevItens => [...prevItens, novoItem]);

    // Limpar campos
    setCodigoProduto('');
    setIdProdutoSelecionado(null);
    setNomeProduto('');
    setQuantidade(1);
    setValorUnitario(0);
    setPrecoBaseProduto(0);
    setDescontoItem(0);
    setControlaProdutoLote(false);
    setLotePreSelecionado(null);

    // Focar no código do produto novamente
    codigoProdutoRef.current?.focus();

    // Mostrar mensagem com promoção se houver
    if (promocao) {
      setSuccess(`Item adicionado! Promocao: ${promocao.promocao_nome}`);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setSuccess('Item adicionado!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const removerItem = (id) => {
    setItens(itens.filter(item => item.id !== id));
  };

  const confirmarLoteSelecionado = (lote) => {
    // Modo pré-seleção: sem lotePendente, apenas guarda o lote escolhido
    if (!lotePendente) {
      setLotePreSelecionado(lote);
      setOpenSelecionarLote(false);
      setLotesDisponiveis([]);
      setSuccess(`Lote ${lote.numero_lote} selecionado!`);
      setTimeout(() => setSuccess(''), 2000);
      // Focar no campo quantidade
      setTimeout(() => document.getElementById('quantidade-input')?.focus(), 100);
      return;
    }
    // Modo legado: lotePendente existe, adicionar item direto
    const novoItem = {
      id: Date.now(),
      ...lotePendente,
      id_lote: lote.id_lote,
      numero_lote: lote.numero_lote,
    };
    setItens(prev => [...prev, novoItem]);
    setOpenSelecionarLote(false);
    setLotePendente(null);
    setLotesDisponiveis([]);
    setLotePreSelecionado(null);
    setCodigoProduto('');
    setIdProdutoSelecionado(null);
    setNomeProduto('');
    setQuantidade(1);
    setValorUnitario(0);
    setPrecoBaseProduto(0);
    setDescontoItem(0);
    setControlaProdutoLote(false);
    setSuccess('Item adicionado com lote!');
    setTimeout(() => setSuccess(''), 2000);
    codigoProdutoRef.current?.focus();
  };

  const abrirDescontoItem = (item) => {
    setItemSelecionado(item);
    setDescontoItemEdit(item.desconto_percentual || 0);
    setOpenDescontoItem(true);
  };

  const aplicarDescontoItem = () => {
    if (!itemSelecionado) return;

    const itensAtualizados = itens.map(item => {
      if (item.id === itemSelecionado.id) {
        const descontoPercentualNum = parseFloat(descontoItemEdit) || 0;
        const quantidadeNum = parseFloat(item.quantidade) || 0;
        const valorUnitarioNum = parseFloat(item.valor_unitario) || 0;

        const valorItem = quantidadeNum * valorUnitarioNum;
        const valorDesconto = (valorItem * descontoPercentualNum) / 100;
        const valorTotalItem = valorItem - valorDesconto;

        console.log('[DESCONTO-ITEM] Atualizando desconto:', {
          id_produto: item.id_produto,
          desconto_anterior: item.desconto_percentual,
          desconto_novo: descontoPercentualNum,
          valor_desconto_anterior: item.desconto_valor,
          valor_desconto_novo: valorDesconto.toFixed(2),
          valor_total_anterior: item.valor_total,
          valor_total_novo: valorTotalItem.toFixed(2)
        });

        return {
          ...item,
          desconto_percentual: descontoPercentualNum,
          desconto_valor: valorDesconto,
          valor_total: valorTotalItem
        };
      }
      return item;
    });

    setItens(itensAtualizados);
    setOpenDescontoItem(false);
    setItemSelecionado(null);
    setDescontoItemEdit(0);
  };

  const calcularTotal = () => {
    const subtotal = itens.reduce((acc, item) => acc + item.valor_total, 0);
    const valorDescontoGeral = (subtotal * descontoGeral) / 100;
    const totalCalculado = subtotal - valorDescontoGeral;
    console.log('🧮 CALCULANDO TOTAL:', {
      'itens.length': itens.length,
      'subtotal': subtotal,
      'descontoGeral': descontoGeral,
      'valorDescontoGeral': valorDescontoGeral,
      'totalCalculado': totalCalculado
    });
    setValorTotal(totalCalculado);
  };

  // Funções de Condições de Pagamento
  const abrirCondicoesPagamento = async (pularPerguntaTabela = false, totalRecalculado = null) => {
    try {
      console.log('🔓🔓🔓 ABRINDO CONDIÇÕES DE PAGAMENTO - INÍCIO');
      console.log('💰 Estado atual dos valores:', {
        'valorTotal (estado)': valorTotal,
        'totalRecalculado (parâmetro)': totalRecalculado,
        'itens.length': itens?.length,
        'itens': itens
      });

      if (itens.length === 0) {
        setError('Adicione pelo menos um item à venda');
        return;
      }

      if (!vendedor || !vendedor.id_vendedor) {
        setError('Vendedor é obrigatório. Configure um vendedor padrão em Configurações > Usuários');
        return;
      }

      // A validação de limite de crédito agora é feita ao adicionar condição de pagamento a prazo

      // Validar estoque de todos os itens antes de finalizar (se configurado)
      if (operacao && operacao.validar_estoque && operacao.acao_estoque !== 'nao_validar' && !estoqueAutorizado) {
        try {
          console.log('🔍 Iniciando validação de estoque para finalização - itens:', itens.length);
          const validacoesPendentes = [];

          for (const item of itens) {
            const produtoResponse = await axiosInstance.get(`/produtos/${item.id_produto}/`);
            const produto = produtoResponse.data;

            console.log('🔎 Checando item para validação de estoque:', {
              id_produto: item.id_produto,
              nome_item: item.nome || item.nome_produto || null,
              quantidadeSolicitada_raw: item.quantidade,
              tipo_quantidadeSolicitada: typeof item.quantidade
            });

            console.log('🔎 Dados do produto retornado pela API:', {
              id_produto_api: produto.id_produto || produto.id,
              nome_produto_api: produto.nome_produto || produto.descricao,
              estoque_por_deposito: produto.estoque_por_deposito,
              estoque_atual: produto.estoque_atual,
              tipos: {
                estoque_por_deposito: typeof produto.estoque_por_deposito,
                estoque_atual: typeof produto.estoque_atual
              }
            });

            let estoqueDisponivel = 0;
            if (operacao.id_deposito_baixa && produto.estoque_por_deposito) {
              const estoqueDeposito = produto.estoque_por_deposito.find(
                est => Number(est.id_deposito) === Number(operacao.id_deposito_baixa)
              );
              estoqueDisponivel = estoqueDeposito ? parseFloat(estoqueDeposito.quantidade_atual || estoqueDeposito.quantidade) : 0;
            } else {
              estoqueDisponivel = parseFloat(produto.estoque_atual || 0);
            }

            let quantidadeSolicitada = parseFloat(item.quantidade);

            console.log('   estoqueDisponivel (valor):', estoqueDisponivel, 'type:', typeof estoqueDisponivel);
            console.log('   quantidadeSolicitada (valor):', quantidadeSolicitada, 'type:', typeof quantidadeSolicitada);
            console.log('   Comparação: estoqueDisponivel < quantidadeSolicitada?', estoqueDisponivel < quantidadeSolicitada);

            if (isNaN(estoqueDisponivel)) {
              console.warn('⚠️ Estoque disponível é NaN para produto', produto.id_produto || produto.id, '- definindo 0');
              estoqueDisponivel = 0;
            }

            if (isNaN(quantidadeSolicitada)) {
              console.warn('⚠️ Quantidade solicitada é NaN para produto', produto.id_produto || produto.id, '- definindo 1');
              quantidadeSolicitada = 1;
            }

            // ✅ VALIDAÇÃO: Só adicionar à fila SE estoque for INSUFICIENTE
            if (estoqueDisponivel < quantidadeSolicitada) {
              const faltam = quantidadeSolicitada - estoqueDisponivel;
              console.log(`⚠️ ESTOQUE INSUFICIENTE DETECTADO para "${produto.nome_produto}": disponível ${estoqueDisponivel} < solicitado ${quantidadeSolicitada}`);

              // Se ação for bloquear, interrompe imediatamente
              if (operacao.acao_estoque === 'bloquear') {
                setError(`❌ Estoque insuficiente para "${produto.nome_produto}". Disponível: ${estoqueDisponivel.toFixed(3)} | Solicitado: ${quantidadeSolicitada.toFixed(3)}`);
                return; // Cancela a finalização
              }

              // Para alertar ou solicitar_senha, adicionar à fila de validações
              validacoesPendentes.push({
                tipo: 'estoque',
                dados: {
                  produto: produto.nome_produto,
                  disponivel: estoqueDisponivel,
                  solicitado: quantidadeSolicitada,
                  faltam
                },
                item,
                acao: operacao.acao_estoque
              });
            }
          }

          // Se há validações pendentes, processar a primeira
          if (validacoesPendentes.length > 0) {
            console.log('📋 Validações de estoque pendentes:', validacoesPendentes.length);
            setFilaValidacoes(validacoesPendentes.slice(1)); // Guardar o resto da fila
            const primeira = validacoesPendentes[0];
            setEstoqueInfo(primeira.dados);
            setItemPendenteEstoque(primeira.item);
            setAcaoEstoqueAtual(primeira.acao);
            setOpenEstoqueModal(true);
            return; // Aguarda resolução do modal
          }
        } catch (err) {
          console.error('Erro ao validar estoque:', err);
        }
      }

      // Calcular total (reutilizando cálculo ou usando o parâmetro se fornecido)
      let totalParaUsar = totalRecalculado;
      if (totalParaUsar === null) {
        const subtotalSync = itens.reduce((acc, item) => acc + (item.valor_total || 0), 0);
        const valorDescontoGeralSync = (subtotalSync * descontoGeral) / 100;
        totalParaUsar = subtotalSync - valorDescontoGeralSync;
      }

      console.log('💰 Total a ser usado:', totalParaUsar);
      setValorTotal(totalParaUsar);
      setValorRestante(totalParaUsar);

      // Perguntar sobre uso da tabela (se configurado) – apenas se não tiver pulado
      if (!pularPerguntaTabela && tabelaSelecionada && tabelaSelecionada.perguntar_ao_vender === true) {
        console.log('💬 Perguntando sobre uso da tabela:', tabelaSelecionada.nome);
        setOpenPerguntarTabelaFinanceiro(true);
        return;
      }

      // Carregar formas de pagamento se ainda não carregadas
      if (formasPagamento.length === 0) {
        const formas = await obterFormasPagamento();
        setFormasPagamento(formas);
        console.log('💳 Formas de pagamento carregadas:', formas.length);
      }

      setOpenCondicoesPagamento(true);
      console.log('✅ Modal de condições de pagamento aberto');
    } catch (err) {
      console.error('Erro ao abrir condições de pagamento:', err);
      setError(`Erro ao abrir condições de pagamento: ${err.message}`);
    }
  };

  const confirmarTabelaParaFinanceiro = async (tabela) => {
    console.log('✅ Tabela confirmada para financeiro:', tabela);

    // Atualizar tabela selecionada
    setTabelaSelecionada(tabela);

    // Recalcular valores de todos os itens com a nova tabela
    if (tabela) {
      console.log(`💰 Recalculando valores com tabela "${tabela.nome}" (${tabela.percentual}%)`);

      const itensRecalculados = itens.map(item => {
        // Usar preço base (original do produto) para recalcular
        const precoBase = item.preco_base || item.valor_unitario;

        // Aplicar percentual da tabela ao preço base
        const ajuste = precoBase * (tabela.percentual / 100);
        const novoValorUnitario = precoBase + ajuste;

        // Recalcular valores do item
        const valorItem = item.quantidade * novoValorUnitario;
        const valorDesconto = (valorItem * item.desconto_percentual) / 100;
        const valorTotalItem = valorItem - valorDesconto;

        console.log(`  📦 Item ${item.codigo}: Base R$ ${precoBase.toFixed(2)} → Novo R$ ${novoValorUnitario.toFixed(2)} (ajuste: ${tabela.percentual > 0 ? '+' : ''}${ajuste.toFixed(2)})`);

        return {
          ...item,
          valor_unitario: novoValorUnitario,
          valor_total: valorTotalItem,
          desconto_valor: valorDesconto
        };
      });

      setItens(itensRecalculados);
      console.log('✅ Todos os itens recalculados com sucesso!');

      // Forçar recálculo do total
      const novoSubtotal = itensRecalculados.reduce((acc, item) => acc + item.valor_total, 0);
      const valorDescontoGeral = (novoSubtotal * descontoGeral) / 100;
      const novoTotal = novoSubtotal - valorDescontoGeral;
      setValorTotal(novoTotal);
      console.log(`💵 Total recalculado: R$ ${novoTotal.toFixed(2)}`);
    }

    // Fechar modal de pergunta
    setOpenPerguntarTabelaFinanceiro(false);

    // Abrir condições de pagamento passando o total recalculado
    setTimeout(() => abrirCondicoesPagamento(true, novoTotal), 500);
  };

  const pularPerguntaTabelaFinanceiro = () => {
    console.log('⏭️ Usuário optou por não alterar a tabela comercial');
    setOpenPerguntarTabelaFinanceiro(false);

    // Abrir condições de pagamento (pular pergunta para não perguntar novamente)
    // Calcular total síncronamente e passar para evitar timing issues
    const subtotalSyncPular = itens.reduce((acc, item) => acc + (item.valor_total || 0), 0);
    const valorDescontoGeralPular = (subtotalSyncPular * descontoGeral) / 100;
    const totalSyncPular = subtotalSyncPular - valorDescontoGeralPular;
    setTimeout(() => abrirCondicoesPagamento(true, totalSyncPular), 300);
  };

  const adicionarCondicao = async (forcarAdicao = false) => {
    try {
      console.log('🎯🎯🎯 VERSÃO NOVA - FUNÇÃO ADICIONAR CONDIÇÃO CHAMADA!', {
        forcarAdicao,
        timestamp: new Date().toISOString(),
        versao: 'v2.0-limite-prazo',
        formaPagamentoAtual,
        valorCondicaoAtual,
        valorTotal
      });

      if (!formaPagamentoAtual) {
        console.log('❌ Erro: Nenhuma forma de pagamento selecionada');
        setError('Selecione uma forma de pagamento');
        return;
      }

      // Validar se a forma de pagamento tem os campos obrigatórios
      const forma = formasPagamento.find(f => f.id_forma_pagamento === parseInt(formaPagamentoAtual));
      if (!forma) {
        setError('Forma de pagamento não encontrada');
        return;
      }

      if (!forma.id_conta_padrao || !forma.id_centro_custo || !forma.id_departamento) {
        setError('Esta forma de pagamento está incompleta. Configure Conta, Centro de Custo e Departamento antes de usar.');
        return;
      }

      if (valorCondicaoAtual <= 0) {
        setError('Informe um valor válido');
        return;
      }

      const totalCondicoes = condicoesSelecionadas.reduce((acc, c) => acc + c.valor, 0);

      if (totalCondicoes + valorCondicaoAtual > valorTotal) {
        setError('O valor total das condições não pode ultrapassar o valor da venda');
        return;
      }

      // Verificar se é venda a prazo (data_vencimento > data_documento)
      const dataDocumento = new Date();
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + (forma?.dias_vencimento || 0));

      const dataDocStr = dataDocumento.toISOString().split('T')[0];
      const dataVencStr = dataVencimento.toISOString().split('T')[0];
      const ehVendaAPrazo = dataVencStr > dataDocStr;

      console.log('🔍 Verificando tipo de venda:', {
        forma: forma.nome_forma,
        dias_vencimento: forma.dias_vencimento,
        data_documento: dataDocStr,
        data_vencimento: dataVencStr,
        ehVendaAPrazo,
        forcarAdicao
      });

      console.log('🔍 Verificando condições para validação de limite:', {
        ehVendaAPrazo,
        operacao: operacao?.nome_operacao,
        cliente: cliente?.nome_razao_social,
        gera_financeiro: operacao?.gera_financeiro,
        validacao_limite_credito: operacao?.validacao_limite_credito,
        forcarAdicao,
        'DEVE VALIDAR?': ehVendaAPrazo && operacao && cliente && operacao.gera_financeiro && !forcarAdicao
      });

      // Validar limite de crédito apenas para vendas a prazo (se não for forçado)
      if (ehVendaAPrazo && operacao && cliente && operacao.gera_financeiro && !forcarAdicao) {
        const validacaoLimite = operacao.validacao_limite_credito || 'nao_validar';

        console.log('💡 Entrando na validação - validacaoLimite:', validacaoLimite);

        if (validacaoLimite !== 'nao_validar') {
          try {
            console.log('💳 Validando limite de crédito para venda a prazo...');

            const limiteResponse = await axiosInstance.post('/verificar-limite-cliente/', {
              id_cliente: cliente.id_cliente,
              valor_venda: valorTotal
            });

            const limiteData = limiteResponse.data;

            console.log('💰 Dados do Limite:', {
              limiteTotal: limiteData.cliente?.limite_credito,
              creditoDisponivel: limiteData.cliente?.credito_disponivel,
              totalVenda: valorTotal,
              ultrapassaLimite: limiteData.ultrapassa_limite
            });

            // Verificar se ultrapassa o limite
            if (limiteData.ultrapassa_limite) {
              console.warn('⚠️ LIMITE EXCEDIDO em venda a prazo!');

              // Adaptar dados para o formato esperado pelos componentes
              const limiteInfo = {
                limiteTotal: limiteData.cliente?.limite_credito,
                limiteUtilizado: limiteData.cliente?.saldo_devedor,
                limiteDisponivel: limiteData.cliente?.credito_disponivel,
                valorExcedente: limiteData.valor_excedente
              };

              setLimiteInfo(limiteInfo);
              setAcaoLimiteAtual(validacaoLimite);

              if (validacaoLimite === 'alertar') {
                setOpenLimiteModal(true);
                return;
              } else if (validacaoLimite === 'bloquear') {
                setError(`❌ Cliente sem limite de crédito disponível para venda a prazo. Crédito disponível: R$ ${limiteData.cliente?.credito_disponivel.toFixed(2)}, Valor da venda: R$ ${valorTotal.toFixed(2)}`);
                return;
              } else if (validacaoLimite === 'solicitar_senha') {
                setOpenLimiteModal(true);
                return;
              }
            } else {
              console.log('✅ Limite OK para venda a prazo');
            }
          } catch (err) {
            console.error('❌ Erro ao validar limite:', err);
          }
        }
      } else if (!ehVendaAPrazo) {
        console.log('ℹ️ Venda à vista - validação de limite não aplicada');
      }

      const novaCondicao = {
        id: Date.now(),
        forma: formaPagamentoAtual,
        valor: valorCondicaoAtual
      };

      const novasCondicoes = [...condicoesSelecionadas, novaCondicao];
      console.log('➕ ADICIONANDO CONDIÇÃO:', {
        'novaCondicao': novaCondicao,
        'condicoesSelecionadas (antes)': condicoesSelecionadas,
        'novasCondicoes (depois)': novasCondicoes,
        'novasCondicoes.length': novasCondicoes.length
      });
      setCondicoesSelecionadas(novasCondicoes);

      const novoRestante = valorTotal - novasCondicoes.reduce((acc, c) => acc + c.valor, 0);
      setValorRestante(novoRestante);
      console.log('✅ CONDIÇÃO ADICIONADA - Estado atualizado:', {
        'valorRestante': novoRestante,
        'condicoesSelecionadas.length': novasCondicoes.length
      });

      // Resetar campos
      setFormaPagamentoAtual(null);
      setValorCondicaoAtual(novoRestante > 0 ? novoRestante : 0);
      setError('');

    } catch (error) {
      console.error('💥 ERRO CRÍTICO em adicionarCondicao:', error);
      setError(`Erro ao adicionar condição: ${error.message}`);
    }
  };

  const removerCondicao = (id) => {
    const novasCondicoes = condicoesSelecionadas.filter(c => c.id !== id);
    setCondicoesSelecionadas(novasCondicoes);

    const novoRestante = valorTotal - novasCondicoes.reduce((acc, c) => acc + c.valor, 0);
    setValorRestante(novoRestante);
  };

  // ── Mercado Pago Point Tap ──────────────────────────────────────────────────

  const isMercadoPagoSelecionado = () => {
    // Verifica se a forma selecionada tem tipo_integracao === 'MERCADOPAGO'
    const forma = formasPagamento.find(
      f => f.id_forma_pagamento === parseInt(formaPagamentoAtual)
    );
    if (!forma) return false;
    if (forma.tipo_integracao === 'MERCADOPAGO') return true;
    return !!(forma.nome_forma && forma.nome_forma.toLowerCase().includes('mercado'));
  };

  // Verifica se alguma condição JÁ na lista é Mercado Pago (sem pagamento realizado)
  const obterCondicaoMercadoPago = () => {
    return condicoesSelecionadas.find(cond => {
      const forma = formasPagamento.find(f => f.id_forma_pagamento === parseInt(cond.forma));
      return forma?.tipo_integracao === 'MERCADOPAGO' ||
             !!(forma?.nome_forma?.toLowerCase().includes('mercado'));
    });
  };

  const iniciarCobrancaMPPoint = async (valorOverride = null, acaoAposAprovacao = 'adicionar_condicao') => {
    // Guard anti-duplo-tap: bloqueia chamadas concorrentes
    if (mpPointLoadingRef.current) {
      logger.warn('MP Point: Duplo-tap bloqueado', 'Chamada ignorada pois já existe uma em andamento');
      return;
    }
    mpPointLoadingRef.current = true;

    // Garante que valorOverride seja número (null/undefined) e não um Event do React
    const valorOverrideSafe = (typeof valorOverride === 'number') ? valorOverride : null;

    // Salva a ação que deve ocorrer após aprovação (via ref para funcionar dentro do intervalo)
    mpPointAcaoRef.current = acaoAposAprovacao;
    setMpPointAcaoAposAprovacao(acaoAposAprovacao);

    try {
      const valorCobrar = (valorOverrideSafe != null && valorOverrideSafe > 0)
        ? valorOverrideSafe
        : (valorCondicaoAtual > 0 ? valorCondicaoAtual : valorRestante > 0 ? valorRestante : valorTotal);
      const descricao = `Venda #${numeroDocumento || 'nova'} — R$ ${valorCobrar.toFixed(2)}`;

      logger.info('MP Point: Iniciando cobrança', {
        valorOverride,
        valorOverrideSafe,
        valorCondicaoAtual,
        valorTotal,
        valorCobrar,
        descricao,
        acaoAposAprovacao,
        numeroDocumento,
      });

      const resp = await axiosInstance.post('/mp-point/cobrar/', {
        valor: valorCobrar,
        descricao,
        parcelas: 1,
      });

      logger.success('MP Point: Intent criada', {
        httpStatus: resp.status,
        data: resp.data,
      });

      const { uuid } = resp.data;
      setMpPointTransacaoUuid(uuid);
      setMpPointStatus('PROCESSANDO');
      setMpPointDetalhe('');
      setOpenMPPoint(true);

      logger.info('MP Point: Polling iniciado', { uuid, intervalo: '3s' });

      // Inicia polling a cada 3 segundos
      let pollCount = 0;
      mpPointPollingRef.current = setInterval(async () => {
        pollCount++;
        try {
          const statusResp = await axiosInstance.get(`/mp-point/status/${uuid}/`);
          const { status: st, detalhe } = statusResp.data;
          setMpPointStatus(st);
          setMpPointDetalhe(detalhe || '');

          logger.network(`MP Point: Poll #${pollCount} → ${st}`, {
            uuid,
            status: st,
            detalhe: detalhe || '',
            httpStatus: statusResp.status,
          });

          if (['APROVADA', 'RECUSADA', 'CANCELADA', 'ERRO'].includes(st)) {
            clearInterval(mpPointPollingRef.current);
            mpPointPollingRef.current = null;

            if (st === 'APROVADA') {
              logger.success('MP Point: Pagamento APROVADO', { uuid, acao: mpPointAcaoRef.current });
              setTimeout(() => {
                setOpenMPPoint(false);
                if (mpPointAcaoRef.current === 'finalizar_venda') {
                  // Condição já estava na lista — só finalizar
                  finalizarVenda();
                } else {
                  // Fluxo normal: adiciona condição e habilita Finalizar
                  adicionarCondicao(true);
                }
              }, 1500);
            } else {
              logger.warn(`MP Point: Pagamento ${st}`, { uuid, detalhe: detalhe || '' });
            }
          }
        } catch (err) {
          logger.error('MP Point: Erro no polling', {
            poll: pollCount,
            uuid,
            message: err.message,
            httpStatus: err.response?.status,
            data: err.response?.data,
          });
          console.warn('[MP Point] Erro no polling:', err);
        }
      }, 3000);

    } catch (err) {
      const detalhe = err.response?.data?.detalhe || '';
      const msg = err.response?.data?.erro || 'Erro ao iniciar cobrança no terminal.';
      logger.error('MP Point: Falha ao iniciar cobrança', {
        message: err.message,
        httpStatus: err.response?.status,
        responseData: err.response?.data,
        detalhe,
        msg,
        stack: err.stack,
      });
      setError(detalhe ? `${msg} — ${detalhe}` : msg);
    } finally {
      mpPointLoadingRef.current = false;
    }
  };

  const cancelarCobrancaMPPoint = async () => {
    logger.warn('MP Point: Cancelamento solicitado pelo usuário', { uuid: mpPointTransacaoUuid });
    clearInterval(mpPointPollingRef.current);
    mpPointPollingRef.current = null;

    if (mpPointTransacaoUuid) {
      try {
        await axiosInstance.delete(`/mp-point/cancelar/${mpPointTransacaoUuid}/`);
        logger.info('MP Point: Cancelamento enviado ao backend', { uuid: mpPointTransacaoUuid });
      } catch (err) {
        logger.error('MP Point: Erro ao cancelar', {
          uuid: mpPointTransacaoUuid,
          message: err.message,
          httpStatus: err.response?.status,
          data: err.response?.data,
        });
        console.warn('[MP Point] Erro ao cancelar:', err);
      }
    }
    setOpenMPPoint(false);
    setMpPointTransacaoUuid(null);
  };

  // ── Fim MP Point ────────────────────────────────────────────────────────────

  /**
   * Monta o array de payloads para POST /contas/ a partir do estado atual.
   * Chamado antes de salvar offline para que a sync possa criar o financeiro depois.
   */
  const prepararDadosFinanceiros = (idVenda = null) => {
    if (!operacao?.gera_financeiro || condicoesSelecionadas.length === 0) return [];

    return condicoesSelecionadas.map((condicao, i) => {
      const formaId = parseInt(condicao.forma);
      const forma = formasPagamento.find(f => f.id_forma_pagamento === formaId);

      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + (forma?.dias_vencimento || 0));

      const dataVendaStr = new Date().toISOString().split('T')[0];
      const dataVencimentoStr = dataVencimento.toISOString().split('T')[0];
      const deveBaixar = operacao.baixa_automatica && (dataVendaStr === dataVencimentoStr);

      return {
        tipo_conta: 'receber',
        id_cliente_fornecedor: cliente?.id_cliente || null,
        descricao: `Venda #${numeroDocumento} - ${forma?.nome_forma || 'Pagamento'} ${condicoesSelecionadas.length > 1 ? `(${i + 1}/${condicoesSelecionadas.length})` : ''}`,
        valor_parcela: condicao.valor,
        valor_liquidado: deveBaixar ? condicao.valor : 0,
        valor_juros: 0,
        valor_multa: 0,
        valor_desconto: 0,
        data_vencimento: dataVencimentoStr,
        data_pagamento: deveBaixar ? dataVendaStr : null,
        status_conta: deveBaixar ? 'Paga' : 'Pendente',
        id_forma_pagamento: forma?.id_forma_pagamento || null,
        id_venda_origem: idVenda,  // null quando offline — preenchido na sync
        id_operacao: operacao.id_operacao,
        id_departamento: forma?.id_departamento || null,
        id_centro_custo: forma?.id_centro_custo || null,
        id_conta_cobranca: forma?.id_conta_padrao || null,
        id_conta_baixa: deveBaixar ? (forma?.id_conta_padrao || null) : null,
        documento_numero: numeroDocumento,
        parcela_numero: i + 1,
        parcela_total: condicoesSelecionadas.length,
        gerencial: 0,
      };
    });
  };

  const finalizarVenda = async () => {
    let dadosVenda = null; // declarado fora do try para ser acessível no catch
    try {
      setLoading(true);
      setError('');
      const token = getToken();

      console.log('[VENDA] Iniciando finalizacao da venda...');
      console.log('[VENDA] Vendedor atual:', vendedor);
      console.log('[VENDA] Vendedor ID:', vendedor?.id_vendedor);
      console.log('[VENDA] Parametros:', parametros);
      console.log('[VENDA] Operacao:', operacao);
      console.log('[VENDA] Cliente:', cliente);

      if (itens.length === 0) {
        setError('Adicione pelo menos um item à venda');
        setLoading(false);
        return;
      }

      // Validar vendedor obrigatório
      if (!vendedor || !vendedor.id_vendedor) {
        console.error('[VENDA] Vendedor nao configurado!');
        console.error('  - vendedor:', vendedor);
        console.error('  - parametros.id_vendedor_padrao:', parametros?.id_vendedor_padrao);
        setError('Vendedor é obrigatório. Configure um vendedor padrão em Configurações > Usuários');
        setLoading(false);
        return;
      }

      // Validar condições de pagamento
      const totalCondicoes = condicoesSelecionadas.reduce((acc, c) => acc + c.valor, 0);
      if (Math.abs(totalCondicoes - valorTotal) > 0.01) {
        setError(`O valor das condicoes (R$ ${totalCondicoes.toFixed(2)}) deve ser igual ao total da venda (R$ ${valorTotal.toFixed(2)})`);
        setLoading(false);
        return;
      }

      // Preparar itens para envio (formato esperado pela API)
      const itensParaEnvio = itens.map(item => {
        const desconto = (item.desconto_valor || 0).toString();
        console.log('[ENVIO] Item para API:', {
          id_produto: item.id_produto,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          desconto_valor: desconto,
          tem_promocao: item.tem_promocao
        });
        return {
          id_produto: item.id_produto,  // Já temos o ID do produto armazenado
          quantidade: item.quantidade.toString(),
          valor_unitario: item.valor_unitario.toString(),
          desconto_valor: desconto,
          id_lote: item.id_lote || null,
        };
      });

      console.log('[ESTOQUE] Itens para baixa de estoque:', itensParaEnvio.map(i => `Prod ${i.id_produto}: ${i.quantidade} unidades`).join(', '));

      // Criar venda com itens
      dadosVenda = {
        id_operacao: operacao.id_operacao,
        id_cliente: cliente?.id_cliente || null,
        id_vendedor: vendedor.id_vendedor,  // API espera id_vendedor (não id_vendedor1)
        numero_documento: numeroDocumento,
        data: new Date().toLocaleDateString('pt-BR'),
        itens: itensParaEnvio,  // Enviar itens junto
        desconto: descontoGeral.toString()
      };

      console.log('[VENDA] Dados da venda completa:', dadosVenda);

      // ── OFFLINE: salvar venda localmente e encerrar ────────────────────────
      if (!servidorOkRef.current) {
        const dadosFinanceiros = prepararDadosFinanceiros();
        const tempId = await salvarVendaOffline(dadosVenda, dadosFinanceiros);
        console.log('[OFFLINE] Venda salva localmente:', tempId, '| financeiros:', dadosFinanceiros.length);
        setSuccess('✅ Venda salva localmente! Será sincronizada automaticamente quando o servidor estiver disponível.');
        setItens([]);
        setCondicoesSelecionadas([]);
        setDescontoGeral(0);
        setCodigoProduto('');
        setNomeProduto('');
        setQuantidade(1);
        setValorUnitario(0);
        setIdProdutoSelecionado(null);
        setOpenFinalizar(false);
        setOpenCondicoesPagamento(false);
        
        // Limpar estado salvo do IndexedDB
        try {
          await limparEstadoVendaRapida();
          console.log('✅ [OFFLINE] Estado limpo do IndexedDB após venda offline');
        } catch (err) {
          console.error('❌ [OFFLINE] Erro ao limpar estado:', err);
        }
        
        setTimeout(() => setSuccess(''), 8000);
        setLoading(false);
        return;
      }
      // ── FIM OFFLINE ────────────────────────────────────────────────────────

      const resVenda = await axiosInstance.post('/vendas/', dadosVenda);

      console.log('[VENDA] Venda criada com sucesso:', resVenda.data);
      console.log('[ESTOQUE] Estoque foi baixado automaticamente pelo backend');

      const idVenda = resVenda.data.id_venda || resVenda.data.id;

      console.log('[VENDA] Atualizando proximo numero da operacao...');

      // Atualizar próximo número da operação
      if (operacao.usa_auto_numeracao) {
        await axiosInstance.patch(`/operacoes/${operacao.id_operacao}/`, {
          proximo_numero_nf: parseInt(numeroDocumento) + 1
        });
        console.log('✅ Número atualizado');
      }

      // Criar registros financeiros se a operação gera financeiro
      console.log('🔍 DEBUG OPERAÇÃO COMPLETA:', operacao);
      console.log('🔍 operacao.gera_financeiro:', operacao.gera_financeiro);
      console.log('🔍 condicoesSelecionadas.length:', condicoesSelecionadas.length);

      if (operacao.gera_financeiro && condicoesSelecionadas.length > 0) {
        console.log('💰 Criando registros financeiros...');
        console.log('📋 Operação - Baixa Automática:', operacao.baixa_automatica);
        console.log('📋 Tipo do campo baixa_automatica:', typeof operacao.baixa_automatica);

        for (let i = 0; i < condicoesSelecionadas.length; i++) {
          const condicao = condicoesSelecionadas[i];
          // Converter forma para número para garantir comparação correta
          const formaId = parseInt(condicao.forma);
          const forma = formasPagamento.find(f => f.id_forma_pagamento === formaId);

          // Calcular data de vencimento baseado nos dias da forma de pagamento
          const dataVencimento = new Date();
          dataVencimento.setDate(dataVencimento.getDate() + (forma?.dias_vencimento || 0));

          // Lógica de baixa automática: se data_venda == data_vencimento E baixa_automatica = true
          const dataVenda = new Date().toISOString().split('T')[0];
          const dataVencimentoStr = dataVencimento.toISOString().split('T')[0];
          const deveBaixarAutomaticamente = operacao.baixa_automatica && (dataVenda === dataVencimentoStr);

          console.log(`🔍 [PARCELA ${i + 1}] Verificando baixa automática:`, {
            baixaAutomatica: operacao.baixa_automatica,
            dataVenda,
            dataVencimentoStr,
            saoIguais: dataVenda === dataVencimentoStr,
            deveBaixar: deveBaixarAutomaticamente
          });

          const dadosFinanceiro = {
            tipo_conta: 'receber', // Venda gera contas a receber
            id_cliente_fornecedor: cliente?.id_cliente || null,
            descricao: `Venda #${numeroDocumento} - ${forma?.nome_forma || 'Pagamento'} ${condicoesSelecionadas.length > 1 ? `(${i + 1}/${condicoesSelecionadas.length})` : ''}`,
            valor_parcela: condicao.valor,
            valor_liquidado: deveBaixarAutomaticamente ? condicao.valor : 0,
            valor_juros: 0,
            valor_multa: 0,
            valor_desconto: 0,
            data_vencimento: dataVencimentoStr,
            data_pagamento: deveBaixarAutomaticamente ? dataVenda : null,
            status_conta: deveBaixarAutomaticamente ? 'Paga' : 'Pendente',
            id_forma_pagamento: forma?.id_forma_pagamento || null,
            // forma_pagamento: forma?.nome_forma || '', // REMOVIDO - backend deve popular isso
            id_venda_origem: idVenda,
            id_operacao: operacao.id_operacao,
            id_departamento: forma?.id_departamento || null,
            id_centro_custo: forma?.id_centro_custo || null,
            id_conta_cobranca: forma?.id_conta_padrao || null,
            id_conta_baixa: deveBaixarAutomaticamente ? (forma?.id_conta_padrao || null) : null,
            documento_numero: numeroDocumento,
            parcela_numero: i + 1,
            parcela_total: condicoesSelecionadas.length,
            gerencial: 0
          };

          console.log(`💳 Criando financeiro ${i + 1}/${condicoesSelecionadas.length}:`, dadosFinanceiro);
          console.log(`🔑 Campo id_forma_pagamento sendo enviado:`, dadosFinanceiro.id_forma_pagamento);
          console.log(`🔑 Tipo do campo:`, typeof dadosFinanceiro.id_forma_pagamento);

          const resFinanceiro = await axiosInstance.post('/contas/', dadosFinanceiro);

          console.log(`✅ Financeiro ${i + 1} criado. Resposta:`, resFinanceiro.data);
          console.log(`🔍 Verificar campo forma_pagamento salvo:`, resFinanceiro.data.forma_pagamento);
          console.log(`🔍 Verificar campo id_forma_pagamento salvo:`, resFinanceiro.data.id_forma_pagamento);
        }

        console.log('✅ Todos os registros financeiros criados');
      }

      console.log('✅ Venda finalizada com sucesso!');

      // Debug condições antes de preparar dados
      console.log('🔍 Condições selecionadas:', condicoesSelecionadas);
      console.log('🔍 Formas de pagamento disponíveis:', formasPagamento);

      // Preparar dados completos da venda para impressão
      const dadosCompletos = {
        id_venda: idVenda,
        numero_documento: numeroDocumento,
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR'),
        empresa: empresa,
        operacao: operacao,
        cliente: cliente,
        vendedor: vendedor,
        itens: itens,
        condicoesPagamento: condicoesSelecionadas.map((cond, i) => {
          const forma = formasPagamento.find(f => f.id_forma_pagamento === parseInt(cond.forma));
          console.log(`🔍 Processando condição ${i + 1}:`, cond);
          console.log(`🔍 Forma encontrada:`, forma);
          return {
            ...cond,
            forma_nome: forma?.nome_forma || 'Pagamento',
            parcela: `${i + 1}/${condicoesSelecionadas.length}`
          };
        }),
        subtotal: itens.reduce((sum, item) => sum + item.valor_total, 0),
        desconto: descontoGeral,
        total: valorTotal
      };

      console.log('📋 Dados completos preparados:', dadosCompletos);
      console.log('💳 Condições de pagamento processadas:', dadosCompletos.condicoesPagamento);

      setDadosVendaCompleta(dadosCompletos);
      setSuccess(`Venda #${numeroDocumento} finalizada com sucesso!`);
      setOpenCondicoesPagamento(false);
      setOpenFinalizar(false);

      // Abrir dialog de impressão
      setOpenImpressao(true);

    } catch (err) {
      console.error('❌ Erro ao finalizar venda:', err);
      console.error('Detalhes do erro:', err.response?.data);

      // ── FALLBACK OFFLINE: salva localmente se servidor retornar 5xx ou sem resposta ──
      const httpStatus = err?.response?.status;
      const isServerError = !err.response || httpStatus >= 500;
      if (isServerError && dadosVenda) {
        try {
          const dadosFinanceiros = prepararDadosFinanceiros();
          const tempId = await salvarVendaOffline(dadosVenda, dadosFinanceiros);
          console.log('[OFFLINE] Venda salva offline como fallback:', tempId, '| financeiros:', dadosFinanceiros.length);
          setSuccess('✅ Servidor indisponível — venda salva offline! Será sincronizada automaticamente.');
          setItens([]);
          setCondicoesSelecionadas([]);
          setDescontoGeral(0);
          setCodigoProduto('');
          setNomeProduto('');
          setQuantidade(1);
          setValorUnitario(0);
          setIdProdutoSelecionado(null);
          setOpenFinalizar(false);
          setOpenCondicoesPagamento(false);
          
          // Limpar estado salvo do IndexedDB
          try {
            await limparEstadoVendaRapida();
            console.log('✅ [FALLBACK] Estado limpo do IndexedDB');
          } catch (clearErr) {
            console.error('❌ [FALLBACK] Erro ao limpar estado:', clearErr);
          }
          
          setTimeout(() => setSuccess(''), 8000);
          setLoading(false);
          return;
        } catch (offlineErr) {
          console.error('[OFFLINE] Falha ao salvar offline:', offlineErr);
        }
      }
      // ─────────────────────────────────────────────────────────────────────────

      let mensagemErro = 'Erro ao finalizar venda';

      if (err.response?.data) {
        // Se houver detalhes do erro do backend
        if (typeof err.response.data === 'object') {
          // Mostrar todos os campos com erro
          const erros = Object.entries(err.response.data)
            .map(([campo, msg]) => `${campo}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
            .join('\n');
          mensagemErro = erros;
        } else {
          mensagemErro = err.response.data.detail || err.response.data;
        }
      } else {
        mensagemErro = err.message;
      }

      setError(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const limparVenda = async () => {
    setItens([]);
    setDescontoGeral(0);
    setNumeroDocumento(String(parseInt(numeroDocumento) + 1));
    setCondicoesSelecionadas([]);
    setSuccess('');
    setDadosVendaCompleta(null);
    setOpenImpressao(false);
    setCodigoProduto('');
    setNomeProduto('');
    setQuantidade(1);
    setValorUnitario(0);
    setDescontoItem(0);
    setIdProdutoSelecionado(null);
    // Resetar flags de autorização
    setLimiteAutorizado(false);
    setAtrasoAutorizado(false);
    setEstoqueAutorizado(false);
    
    // 🔹 Limpar estado salvo do IndexedDB após finalizar venda
    try {
      await limparEstadoVendaRapida();
      console.log('✅ Estado da venda limpo do IndexedDB');
    } catch (err) {
      console.error('❌ Erro ao limpar estado do IndexedDB:', err);
    }
  };

  // Função para gerar HTML de impressão (reutilizável)
  const gerarConteudoImpressao = (dados, config = {}) => {
    const largura = config.largura_termica || configImpressao.largura_termica || '80mm';
    const rodapeTexto = config.observacao_rodape ?? configImpressao.observacao_rodape ?? 'Obrigado pela preferência!';
    return `
      <html>
      <head>
        <style>
          @media print {
            @page {
              size: ${largura} auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 2mm 3mm;
              font-family: 'Courier New', monospace;
              font-size: 9pt;
              width: ${largura};
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 9pt;
            width: ${largura};
            margin: 0 auto;
            padding: 2mm 3mm;
            line-height: 1.3;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .linha { 
            border-top: 1px dotted #000; 
            margin: 2mm 0; 
          }
          .info { margin: 0.5mm 0; font-size: 9pt; }
          .item { margin: 1mm 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 0; vertical-align: top; }
          .right { text-align: right; }
          .empresa { font-size: 11pt; font-weight: bold; margin: 1mm 0; }
          .titulo { font-size: 10pt; font-weight: bold; margin: 2mm 0; }
          .secao { font-size: 8pt; margin: 1mm 0; }
        </style>
      </head>
      <body>
        <!-- CABEÇALHO EMPRESA -->
        <div class="center">
          <div class="empresa">${dados.empresa ? (dados.empresa.nome_fantasia || dados.empresa.nome_razao_social || 'EMPRESA') : 'EMPRESA'}</div>
          ${dados.empresa && dados.empresa.endereco ? `<div class="info">${dados.empresa.endereco}${dados.empresa.numero ? ', ' + dados.empresa.numero : ''}</div>` : ''}
          ${dados.empresa && dados.empresa.telefone ? `<div class="info">Tel: ${dados.empresa.telefone}</div>` : ''}
        </div>
        
        <div class="linha"></div>
        
        <!-- TIPO DE OPERAÇÃO E NÚMERO -->
        <div class="center">
          <div class="titulo">${dados.operacao ? (dados.operacao.nome_operacao || 'VENDA RÁPIDA' ) : 'VENDA RÁPIDA'}</div>
          <div class="bold">Nº ${dados.numero_documento}</div>
        </div>
        
        <div class="linha"></div>
        
        <!-- DADOS DA VENDA -->
        <div class="info">Data: ${dados.data} ${dados.hora}</div>
        <div class="info">Vendedor: ${dados.vendedor ? (dados.vendedor.nome || dados.vendedor.nome_vendedor || dados.vendedor.nome_reduzido || 'N/A') : 'N/A'}</div>
        ${dados.cliente ? `
        <div class="info">Cliente: ${dados.cliente.nome_razao_social || dados.cliente.nome_fantasia || dados.cliente.nome || 'N/A'}</div>
        ${dados.cliente.endereco ? `<div class="info">${dados.cliente.endereco}${dados.cliente.numero ? ', ' + dados.cliente.numero : ''}</div>` : ''}
        ${dados.cliente.cpf_cnpj ? `<div class="info">CPF/CNPJ: ${dados.cliente.cpf_cnpj}</div>` : ''}
        ` : '<div class="info">Cliente: N/A</div>'}
        
        <div class="linha"></div>
        
        <!-- ITENS -->
        <div class="bold secao">ITENS:</div>
        ${dados.itens.map((item, idx) => `
          <div class="item">
            <div>${idx + 1}. ${item.codigo || 'S/C'} - ${item.nome || 'Produto'} ${item.tem_promocao ? '<span style="color: #FF6B35; font-weight: bold;">✨ PROMOÇÃO</span>' : ''}</div>
            <table>
              <tr>
                <td style="width: 60%;">${item.quantidade} x R$ ${parseFloat(item.valor_unitario || 0).toFixed(2)}</td>
                <td class="right bold">R$ ${parseFloat(item.valor_total || 0).toFixed(2)}</td>
              </tr>
            </table>
            ${item.desconto_valor && item.desconto_valor > 0 ? `<div style="font-size: 8pt; margin-left: 2mm;">Desconto: R$ ${parseFloat(item.desconto_valor || 0).toFixed(2)}</div>` : ''}
          </div>
        `).join('')}
        
        <div class="linha"></div>
        
        <!-- TOTAIS -->
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="right bold">R$ ${parseFloat(dados.subtotal || 0).toFixed(2)}</td>
          </tr>
        </table>
        ${dados.desconto > 0 ? `
        <table>
          <tr>
            <td>Desconto Geral:</td>
            <td class="right bold">- R$ ${parseFloat(dados.desconto || 0).toFixed(2)}</td>
          </tr>
        </table>
        ` : ''}
        <table style="margin-top: 2mm;">
          <tr style="font-size: 11pt;">
            <td class="bold">TOTAL:</td>
            <td class="right bold">R$ ${parseFloat(dados.total || 0).toFixed(2)}</td>
          </tr>
        </table>
        
        <div class="linha"></div>
        
        <!-- PAGAMENTO -->
        <div class="bold secao">PAGAMENTO:</div>
        ${dados.condicoesPagamento && dados.condicoesPagamento.length > 0 ?
        dados.condicoesPagamento.map((cond, idx) => {
          const formaNome = cond.forma_nome || 'Pagamento';
          const parcela = dados.condicoesPagamento.length > 1 ? ` ${cond.parcela}` : '';
          const valor = parseFloat(cond.valor || 0).toFixed(2);
          return `
              <table style="margin-bottom: 1mm;">
                <tr>
                  <td>${formaNome}${parcela}</td>
                  <td class="right bold">R$ ${valor}</td>
                </tr>
              </table>
            `;
        }).join('')
        : '<div class="info">Não especificado</div>'
      }
        
        <div class="linha"></div>
        
        <div class="center" style="margin-top: 3mm; font-size: 8pt;">
          ${rodapeTexto || 'Obrigado pela preferência!'}
        </div>
      </body>
      </html>
    `;
  };

  // Gerador de impressão A4 para VendaRápida
  const gerarConteudoImpressaoA4 = (dados) => {
    const rodapeTexto = configImpressao.observacao_rodape || 'Obrigado pela preferência!';
    return `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @media print {
            @page { size: A4; margin: 10mm; }
            body { margin: 0; }
          }
          body { font-family: Arial, sans-serif; font-size: 10pt; color: #000; padding: 8mm; }
          h1 { font-size: 15pt; margin: 0 0 4mm 0; }
          h2 { font-size: 11pt; margin: 5mm 0 2mm 0; border-bottom: 1px solid #ccc; padding-bottom: 2mm; }
          .empresa-nome { font-size: 17pt; font-weight: bold; text-align: center; }
          .empresa-info { text-align: center; font-size: 9pt; margin-bottom: 4mm; }
          hr { margin: 3mm 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; margin: 3mm 0; font-size: 9pt; }
          .info-label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
          th { background: #f0f0f0; padding: 2mm 3mm; text-align: left; border: 1px solid #ccc; font-size: 9pt; }
          td { padding: 2mm 3mm; border: 1px solid #ccc; font-size: 9pt; }
          .right { text-align: right; }
          .total-row td { font-weight: bold; font-size: 11pt; background: #f9f9f9; }
          .rodape { margin-top: 8mm; text-align: center; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding-top: 3mm; }
        </style>
      </head>
      <body>
        <div class="empresa-nome">${dados.empresa ? (dados.empresa.nome_fantasia || dados.empresa.nome_razao_social || 'EMPRESA') : 'EMPRESA'}</div>
        <div class="empresa-info">
          ${dados.empresa && dados.empresa.endereco ? `${dados.empresa.endereco}${dados.empresa.numero ? ', ' + dados.empresa.numero : ''}` : ''}
          ${dados.empresa && dados.empresa.telefone ? ` &bull; Tel: ${dados.empresa.telefone}` : ''}
        </div>
        <hr>
        <h1>${dados.operacao ? (dados.operacao.nome_operacao || 'VENDA RÁPIDA') : 'VENDA RÁPIDA'} &ndash; Nº ${dados.numero_documento}</h1>
        <div class="info-grid">
          <div><span class="info-label">Data:</span> ${dados.data} ${dados.hora}</div>
          <div><span class="info-label">Vendedor:</span> ${dados.vendedor ? (dados.vendedor.nome || dados.vendedor.nome_vendedor || dados.vendedor.nome_reduzido || 'N/A') : 'N/A'}</div>
          <div><span class="info-label">Cliente:</span> ${dados.cliente ? (dados.cliente.nome_razao_social || dados.cliente.nome_fantasia || dados.cliente.nome || 'N/A') : 'N/A'}</div>
          ${dados.cliente && dados.cliente.cpf_cnpj ? `<div><span class="info-label">CPF/CNPJ:</span> ${dados.cliente.cpf_cnpj}</div>` : ''}
        </div>
        <h2>Itens</h2>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Código</th><th>Produto</th>
              <th class="right">Qtd</th><th class="right">Unit.</th>
              <th class="right">Desconto</th><th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${dados.itens.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.codigo || '-'}</td>
                <td>${item.nome || 'Produto'}</td>
                <td class="right">${parseFloat(item.quantidade || 0).toFixed(2)}</td>
                <td class="right">R$ ${parseFloat(item.valor_unitario || 0).toFixed(2)}</td>
                <td class="right">${item.desconto_valor > 0 ? 'R$ ' + parseFloat(item.desconto_valor).toFixed(2) : '-'}</td>
                <td class="right">R$ ${parseFloat(item.valor_total || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            ${dados.desconto > 0 ? `
              <tr><td colspan="6" class="right">Subtotal:</td><td class="right">R$ ${parseFloat(dados.subtotal || 0).toFixed(2)}</td></tr>
              <tr><td colspan="6" class="right">Desconto Geral:</td><td class="right">- R$ ${parseFloat(dados.desconto || 0).toFixed(2)}</td></tr>
            ` : ''}
            <tr class="total-row">
              <td colspan="6" class="right">TOTAL:</td>
              <td class="right">R$ ${parseFloat(dados.total || 0).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <h2>Pagamento</h2>
        <table>
          <thead>
            <tr><th>Forma</th><th>Parcela</th><th class="right">Valor</th></tr>
          </thead>
          <tbody>
            ${dados.condicoesPagamento && dados.condicoesPagamento.length > 0
              ? dados.condicoesPagamento.map(cond => `
                  <tr>
                    <td>${cond.forma_nome || 'Pagamento'}</td>
                    <td>${cond.parcela || '-'}</td>
                    <td class="right">R$ ${parseFloat(cond.valor || 0).toFixed(2)}</td>
                  </tr>
                `).join('')
              : '<tr><td colspan="3">Não especificado</td></tr>'
            }
          </tbody>
        </table>
        <div class="rodape">${rodapeTexto}</div>
      </body>
      </html>
    `;
  };

  const imprimirVenda = () => {
    if (!dadosVendaCompleta) return;

    const dados = dadosVendaCompleta;

    // Debug - verificar dados
    console.log('🖨️ Dados para impressão:', dados);
    console.log('🏢 Empresa:', dados.empresa);
    console.log('� Vendedor completo:', dados.vendedor);
    console.log('👤 Nome do vendedor:', dados.vendedor?.nome_vendedor);
    console.log('👥 Cliente completo:', dados.cliente);
    console.log('👥 Nome do cliente:', dados.cliente?.nome_razao);
    console.log('�📦 Itens:', dados.itens);
    console.log('💳 Formas de pagamento:', dados.condicoesPagamento);
    console.log('💳 Primeira forma:', dados.condicoesPagamento?.[0]);

    // Gerar conteúdo conforme tipo de impressora configurado
    const usarA4 = configImpressao.tipo_impressora === 'a4';
    const larguraJanela = usarA4 ? 'width=900,height=700' : 'width=300,height=600';
    const conteudo = usarA4 ? gerarConteudoImpressaoA4(dados) : gerarConteudoImpressao(dados);

    // Abrir janela de impressão
    const janelaImpressao = window.open('', '_blank', larguraJanela);
    janelaImpressao.document.write(conteudo);
    janelaImpressao.document.close();
    janelaImpressao.focus();

    setTimeout(() => {
      janelaImpressao.print();
      janelaImpressao.close();
    }, 250);

    // Limpar venda após impressão
    setTimeout(() => {
      limparVenda();
    }, 500);
  };

  const carregarVendas = async () => {
    try {
      setLoadingVendas(true);
      const token = getToken();

      // Buscar vendas do dia
      const hoje = new Date().toISOString().split('T')[0];
      const res = await axiosInstance.get(`/vendas/?data=${hoje}`);

      console.log('📋 Vendas carregadas (raw):', res.data);

      // Garantir que vendas seja sempre um array
      let vendasArray = Array.isArray(res.data) ? res.data : (res.data.results || []);

      // Log da primeira venda para verificar estrutura
      if (vendasArray.length > 0) {
        console.log('🔍 DEBUG Tabela - Primeira venda:', vendasArray[0]);
        console.log('🔍 DEBUG Tabela - Cliente:', vendasArray[0].cliente);
        console.log('🔍 DEBUG Tabela - Tipo cliente:', typeof vendasArray[0].cliente);
      }

      // Expandir dados do cliente se vier como ID
      const vendasComCliente = await Promise.all(
        vendasArray.map(async (venda) => {
          if (typeof venda.cliente === 'number') {
            try {
              const resCliente = await axiosInstance.get(`/clientes/${venda.cliente}/`);
              return { ...venda, cliente: resCliente.data };
            } catch (err) {
              console.error(`Erro ao buscar cliente ${venda.cliente}:`, err);
              return venda; // Retorna venda original se falhar
            }
          }
          return venda; // Cliente já é objeto
        })
      );

      console.log('✅ Vendas com clientes expandidos:', vendasComCliente);

      setVendas(vendasComCliente);
      setOpenReimprimir(true);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
      setError('Erro ao carregar vendas');
      setVendas([]); // Garantir que vendas seja array mesmo em caso de erro
    } finally {
      setLoadingVendas(false);
    }
  };

  const reimprimirVenda = async (venda) => {
    try {
      setLoading(true);
      const token = getToken();

      console.log('🖨️ Reimprimindo venda:', venda);
      console.log('🔑 Chaves da venda:', Object.keys(venda));

      // Buscar ID da venda (pode ser id_venda, id, ou pk)
      const vendaId = venda.id_venda || venda.id || venda.pk;

      if (!vendaId) {
        throw new Error('ID da venda não encontrado. Venda: ' + JSON.stringify(venda));
      }

      console.log('🆔 ID da venda encontrado:', vendaId);

      // Buscar detalhes completos da venda
      const resVenda = await axiosInstance.get(`/vendas/${vendaId}/`);

      const vendaCompleta = resVenda.data;
      console.log('📋 Venda completa:', vendaCompleta);
      console.log('👥 Cliente da venda (raw):', vendaCompleta.cliente);
      console.log('👥 Tipo do cliente:', typeof vendaCompleta.cliente);

      // Se o cliente vier como ID, buscar os dados completos
      let clienteCompleto = vendaCompleta.cliente;
      if (typeof vendaCompleta.cliente === 'number') {
        console.log('🔄 Cliente é ID, buscando dados completos...');
        try {
          const resCliente = await axiosInstance.get(`/clientes/${vendaCompleta.cliente}/`);
          clienteCompleto = resCliente.data;
          console.log('✅ Cliente completo carregado:', clienteCompleto);
        } catch (errCliente) {
          console.error('❌ Erro ao buscar cliente:', errCliente);
          clienteCompleto = cliente; // Usa cliente padrão como fallback
        }
      }

      // Buscar formas de pagamento da venda
      const resContas = await axiosInstance.get(`/contas/?id_venda_origem=${vendaId}`);

      console.log('💳 Contas encontradas (raw):', resContas.data);

      // Garantir que contas seja array
      const contasArray = Array.isArray(resContas.data) ? resContas.data : (resContas.data.results || []);

      console.log(`📊 Total de contas encontradas: ${contasArray.length}`);
      if (contasArray.length > 0) {
        console.log('🔍 Primeira conta (estrutura completa):', contasArray[0]);
        console.log('🔍 Chaves da primeira conta:', Object.keys(contasArray[0]));
        console.log('🔍 TODAS AS CHAVES E VALORES:');
        Object.keys(contasArray[0]).forEach(key => {
          console.log(`   ${key}: ${contasArray[0][key]}`);
        });
      }

      // Buscar nomes das formas de pagamento
      const condicoesComNomes = await Promise.all(
        contasArray.map(async (conta, i) => {
          console.log(`\n💳 Processando conta ${i + 1}:`, conta);

          let formaNome = 'Pagamento';

          // Verificar se tem forma_pagamento (pode ser ID ou nome direto)
          if (conta.forma_pagamento) {
            // Se for número, buscar da API
            if (!isNaN(conta.forma_pagamento)) {
              const formaId = parseInt(conta.forma_pagamento);
              console.log(`🔑 ID da forma de pagamento: ${formaId}`);

              try {
                const resForma = await axiosInstance.get(`/formas-pagamento/${formaId}/`);
                console.log(`📥 Resposta da API forma ${formaId}:`, resForma.data);
                formaNome = resForma.data.nome_forma || resForma.data.nome || 'Pagamento';
                console.log(`✅ Nome da forma de pagamento: "${formaNome}"`);
              } catch (errForma) {
                console.error(`❌ Erro ao buscar forma ${formaId}:`, errForma);
                formaNome = 'Pagamento';
              }
            } else {
              // É um nome direto (string)
              formaNome = conta.forma_pagamento;
              console.log(`✅ Nome da forma (direto): "${formaNome}"`);
            }
          } else {
            console.warn('⚠️ Conta sem forma_pagamento! Usando descrição como fallback...');
            // Tentar extrair da descrição "Venda #X - NomeDaForma"
            if (conta.descricao && conta.descricao.includes(' - ')) {
              const partes = conta.descricao.split(' - ');
              if (partes.length > 1) {
                formaNome = partes[1];
                console.log(`✅ Forma extraída da descrição: "${formaNome}"`);
              }
            }
          }

          return {
            forma_nome: formaNome,
            valor: parseFloat(conta.valor_parcela || conta.valor || 0),
            parcela: `${conta.parcela_numero || (i + 1)}/${conta.parcela_total || contasArray.length}`
          };
        })
      );

      console.log('💳 Condições com nomes (FINAL):', condicoesComNomes);

      // Preparar dados para impressão
      const dadosCompletos = {
        id_venda: vendaCompleta.id_venda || vendaCompleta.id,
        numero_documento: vendaCompleta.numero_documento,
        data: new Date(vendaCompleta.data).toLocaleDateString('pt-BR'),
        hora: new Date(vendaCompleta.data).toLocaleTimeString('pt-BR'),
        empresa: empresa,
        operacao: operacao,
        cliente: clienteCompleto,
        vendedor: vendaCompleta.vendedor || vendedor,
        itens: vendaCompleta.itens || [],
        condicoesPagamento: condicoesComNomes,
        subtotal: parseFloat(vendaCompleta.valor_total || 0),
        desconto: parseFloat(vendaCompleta.desconto || 0),
        total: parseFloat(vendaCompleta.valor_total || 0)
      };

      console.log('✅ Dados completos preparados:', dadosCompletos);

      setDadosVendaCompleta(dadosCompletos);
      setOpenReimprimir(false);

      // Aguardar state atualizar e imprimir
      setTimeout(() => {
        if (dadosCompletos) {
          // Imprimir diretamente com os dados preparados
          const usarA4 = configImpressao.tipo_impressora === 'a4';
          const printWindow = window.open('', '_blank', usarA4 ? 'width=900,height=700' : 'width=300,height=600');
          if (printWindow) {
            printWindow.document.write(usarA4 ? gerarConteudoImpressaoA4(dadosCompletos) : gerarConteudoImpressao(dadosCompletos));
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
            }, 250);
          }
        }
      }, 100);

    } catch (err) {
      console.error('❌ Erro ao reimprimir venda:', err);
      console.error('Detalhes do erro:', err.response?.data || err.message);
      setError(`Erro ao reimprimir venda: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!parametros && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Configure os parâmetros de venda rápida em Configurações {'>'} Usuários
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      backgroundImage: imagemFundo ? `url(${imagemFundo})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      p: 2,
      position: 'relative'
    }}>
      {/* ── Banner de status offline ── */}
      {!servidorOk && (
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
          action={null}
        >
          <strong>Modo Offline</strong> — Servidor indisponível. Produtos e clientes carregados do cache local. Vendas serão salvas e sincronizadas automaticamente quando a conexão voltar.
        </Alert>
      )}

      {/* Alerta de Vendedor Não Configurado */}
      {(!vendedor || !vendedor.id_vendedor) && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => window.location.href = '/#/configuracoes'}>
              CONFIGURAR
            </Button>
          }
        >
          <strong>Vendedor não configurado!</strong> Configure um vendedor padrão em Configurações {'>'} Usuários para poder finalizar vendas.
        </Alert>
      )}

      {/* Dica de Atalhos */}
      <Box sx={{
        display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center',
        mb: 2, p: '8px 14px', borderRadius: 2,
        background: 'linear-gradient(135deg, #e3f2fd 0%, #e8f5e9 100%)',
        border: '1px solid #90caf9', boxShadow: '0 1px 4px rgba(21,101,192,0.10)'
      }}>
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1565c0', fontSize: '0.82rem', mr: 0.5, whiteSpace: 'nowrap' }}>
          ⌨️ Atalhos:
        </Typography>
        {[
          { key: 'F1',  label: 'Cliente' },
          { key: 'F2',  label: 'Produto' },
          { key: 'F4',  label: 'Desconto' },
          { key: 'F6',  label: 'Cancelar' },
          { key: 'F8',  label: 'Pagamento' },
          { key: 'F10', label: 'Concluir' },
        ].map(({ key, label }) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Box component="span" sx={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 32, px: '6px', height: 24,
              background: '#1565c0', color: '#fff',
              borderRadius: '5px', fontWeight: 900, fontSize: '0.75rem',
              boxShadow: '0 2px 0 #0d3c7a', letterSpacing: '0.02em',
              fontFamily: 'monospace',
            }}>{key}</Box>
            <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#212121', whiteSpace: 'nowrap' }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Seleção de Tabela Comercial */}
      {tabelasComerciais.length > 0 && (
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>💰 Tabela de Preço</InputLabel>
                <Select
                  value={tabelaSelecionada?.id_tabela_comercial || ''}
                  onChange={(e) => {
                    const tabela = tabelasComerciais.find(t => t.id_tabela_comercial === e.target.value);
                    setTabelaSelecionada(tabela);
                    console.log('📋 Tabela comercial selecionada:', tabela);
                  }}
                  label="💰 Tabela de Preço"
                >
                  {tabelasComerciais.map((tabela) => (
                    <MenuItem key={tabela.id_tabela_comercial} value={tabela.id_tabela_comercial}>
                      {tabela.nome} ({tabela.percentual > 0 ? '+' : ''}{tabela.percentual}%)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {tabelaSelecionada && (
              <Grid item xs={12} md={6}>
                <Alert severity="info" icon={<MoneyIcon />}>
                  <strong>Exemplo:</strong> R$ 100,00 → R$ {(100 + (100 * tabelaSelecionada.percentual / 100)).toFixed(2)}
                  {tabelaSelecionada.percentual !== 0 && (
                    <Chip
                      label={`${tabelaSelecionada.percentual > 0 ? '+' : ''}${tabelaSelecionada.percentual}%`}
                      size="small"
                      color={tabelaSelecionada.percentual > 0 ? 'success' : 'error'}
                      sx={{ ml: 1 }}
                    />
                  )}
                </Alert>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Header Azul */}
      <Paper
        elevation={3}
        sx={{
          backgroundColor: '#2196F3',
          color: 'white',
          p: 3,
          mb: 2,
          borderRadius: 2
        }}
      >
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CartIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  GrandChef
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1">
                    Atendente: {usuario?.username || 'Admin'} | Caixa #{caixaInfo?.id_caixa || '-'} | {new Date().toLocaleDateString()}
                  </Typography>
                  <Button 
                      size="small" 
                      onClick={() => setOpenFecharCaixa(true)} 
                      sx={{ 
                        ml: 1, 
                        bgcolor: 'rgba(255,0,0,0.7)', 
                        color: 'white', 
                        fontSize: '0.7rem',
                        '&:hover': { bgcolor: 'rgba(255,0,0,0.9)' } 
                      }}
                  >
                      FECHAR CAIXA
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">
                {new Date().toLocaleDateString('pt-BR')}
              </Typography>
              <IconButton
                onClick={() => setOpenConfigFundo(true)}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
                title="Configurar imagem de fundo"
              >
                <WallpaperIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Produto Atual - Banner Azul */}
      <Paper
        elevation={3}
        sx={{
          backgroundColor: '#2196F3',
          color: 'white',
          p: 2,
          mb: 2,
          borderRadius: 2,
          textAlign: 'center'
        }}
      >
        <Typography variant="h3" fontWeight="bold">
          {nomeProduto || codigoProduto || 'Digite o código ou nome do produto'}
        </Typography>
        {nomeProduto && codigoProduto && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 1 }}>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Código: {codigoProduto}
            </Typography>
            {produtoBalanca && (
              <Chip
                icon={<ScaleIcon />}
                label={`Balança - ${produtoBalanca.metodo === 'balanca_integrada' ? 'Integrada' : 'Etiqueta'}`}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
            )}
          </Box>
        )}
      </Paper>

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

      {/* ════════════════════════════════════════════════════
          LAYOUT MOBILE — visível apenas em smartphones
          ════════════════════════════════════════════════════ */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1 }}>

        {/* ── Busca ── */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            value={codigoProduto}
            onChange={(e) => setCodigoProduto(e.target.value)}
            onKeyPress={handleCodigoProdutoKeyPress}
            inputRef={codigoProdutoRef}
            autoFocus
            placeholder="Código ou nome do produto"
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#2196F3' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                fontSize: '1rem',
                borderRadius: 2,
              }
            }}
          />
          <Button
            variant="contained"
            onClick={() => buscarProduto(codigoProduto)}
            disabled={!codigoProduto}
            sx={{
              minWidth: 64,
              height: 56,
              borderRadius: 2,
              backgroundColor: '#2196F3',
              '&:hover': { backgroundColor: '#1976D2' },
            }}
          >
            <SearchIcon />
          </Button>
        </Box>

        {/* ── Card do produto encontrado ── */}
        {nomeProduto && (
          <Paper
            elevation={3}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: '2px solid #2196F3',
            }}
          >
            {/* Cabeçalho do produto */}
            <Box sx={{ backgroundColor: '#2196F3', px: 2, py: 1.5 }}>
              <Typography variant="h6" fontWeight="bold" color="white" noWrap>
                {nomeProduto}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  Cód: {codigoProduto}
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="white">
                  R$ {parseFloat(valorUnitario || 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Controles */}
            <Box sx={{ p: 2 }}>
              {/* Quantidade com +/- */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                <IconButton
                  onClick={() => setQuantidade(q => Math.max(1, parseFloat(q) - 1))}
                  sx={{
                    width: 56, height: 56,
                    backgroundColor: '#f44336',
                    color: 'white',
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    '&:hover': { backgroundColor: '#d32f2f' },
                  }}
                >
                  <RemoveIcon sx={{ fontSize: 28 }} />
                </IconButton>
                <TextField
                  type="number"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  inputProps={{ min: 0.001, step: 1, style: { textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', padding: '8px 4px' } }}
                  sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <IconButton
                  onClick={() => setQuantidade(q => parseFloat(q) + 1)}
                  sx={{
                    width: 56, height: 56,
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    borderRadius: 2,
                    '&:hover': { backgroundColor: '#388E3C' },
                  }}
                >
                  <AddIcon sx={{ fontSize: 28 }} />
                </IconButton>
              </Box>

              {/* Total parcial */}
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Subtotal</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  R$ {(parseFloat(quantidade || 1) * parseFloat(valorUnitario || 0)).toFixed(2)}
                </Typography>
              </Box>

              {/* Botão ADICIONAR */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={adicionarItem}
                sx={{
                  height: 60,
                  backgroundColor: '#4CAF50',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: '#388E3C' },
                }}
                startIcon={<AddIcon sx={{ fontSize: 28 }} />}
              >
                ADICIONAR
              </Button>
            </Box>
          </Paper>
        )}

        {/* ── Lista de itens compacta ── */}
        {itens.length > 0 && (
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ backgroundColor: '#1565C0', px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" fontWeight="bold" color="white">
                {itens.length} {itens.length === 1 ? 'item' : 'itens'}
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="white">
                Total: R$ {valorTotal.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ maxHeight: 260, overflowY: 'auto' }}>
              {itens.map((item, index) => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 1.5,
                    py: 1,
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: index % 2 === 0 ? '#f8f9ff' : 'white',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight="bold" noWrap>
                      {item.nome || item.codigo}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {parseFloat(item.quantidade).toFixed(0)}x R$ {parseFloat(item.valor_unitario).toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="bold" color="primary" sx={{ mx: 1, whiteSpace: 'nowrap' }}>
                    R$ {parseFloat(item.valor_total || 0).toFixed(2)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removerItem(item.id)}
                    sx={{ color: '#f44336', p: 0.5 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* ── Rodapé mobile: Cancelar + Concluir ── */}
        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setOpenSelecionarCliente(true)}
              sx={{ height: 52, borderColor: '#2196F3', color: '#2196F3', borderRadius: 2 }}
              startIcon={<PersonIcon />}
            >
              Cliente
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                if (itens.length > 0 && window.confirm('Cancelar a venda atual?')) {
                  setItens([]);
                  setDescontoGeral(0);
                  setCondicoesSelecionadas([]);
                  setCodigoProduto('');
                  setNomeProduto('');
                  setQuantidade(1);
                  setValorUnitario(0);
                  setIdProdutoSelecionado(null);
                }
              }}
              disabled={itens.length === 0}
              sx={{ height: 52, borderColor: '#f44336', color: '#f44336', borderRadius: 2 }}
              startIcon={<CancelIcon />}
            >
              Cancelar
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                const subtotalSync = itens.reduce((acc, item) => acc + (item.valor_total || 0), 0);
                const totalSync = subtotalSync - (subtotalSync * descontoGeral / 100);
                abrirCondicoesPagamento(false, totalSync);
              }}
              disabled={itens.length === 0}
              sx={{
                height: 52,
                backgroundColor: '#4CAF50',
                fontWeight: 'bold',
                borderRadius: 2,
                '&:hover': { backgroundColor: '#388E3C' },
                '&:disabled': { backgroundColor: '#ccc' },
              }}
              startIcon={<CheckIcon />}
            >
              Concluir
            </Button>
          </Grid>
        </Grid>
      </Box>
      {/* ════ FIM LAYOUT MOBILE ════ */}

      {/* ════════════════════════════════════════════════════
          LAYOUT DESKTOP — visível apenas em md+
          ════════════════════════════════════════════════════ */}
      <Grid container spacing={2} sx={{ display: { xs: 'none', md: 'flex' } }}>
        {/* Coluna Esquerda - Entrada de Dados */}
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            {/* Código */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Código ou Nome:
              </Typography>
              <TextField
                fullWidth
                value={codigoProduto}
                onChange={(e) => setCodigoProduto(e.target.value)}
                onKeyPress={handleCodigoProdutoKeyPress}
                inputRef={codigoProdutoRef}
                autoFocus
                size="large"
                placeholder="Digite código ou nome do produto"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    fontSize: '1.2rem'
                  }
                }}
              />
              <Button
                fullWidth
                variant="outlined"
                onClick={() => buscarProduto(codigoProduto)}
                disabled={!codigoProduto}
                sx={{
                  mt: 1,
                  borderColor: '#2196F3',
                  color: '#2196F3',
                  '&:hover': {
                    borderColor: '#1976D2',
                    backgroundColor: '#E3F2FD'
                  }
                }}
              >
                <SearchIcon sx={{ mr: 1 }} />
                Buscar Produto
              </Button>
            </Box>

            {/* Indicador de Lote Selecionado */}
            {lotePreSelecionado && (
              <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, backgroundColor: '#E8F5E9', border: '1px solid #4CAF50' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                  Lote: {lotePreSelecionado.numero_lote}
                  {lotePreSelecionado.data_validade && ` — Val: ${new Date(lotePreSelecionado.data_validade + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                </Typography>
              </Box>
            )}

            {/* Quantidade */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Quantidade:
              </Typography>
              <TextField
                fullWidth
                type="number"
                id="quantidade-input"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                onKeyPress={handleQuantidadeKeyPress}
                inputProps={{ min: 0, step: 0.001 }}
                size="large"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CheckIcon color="success" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }
                }}
              />
            </Box>

            {/* Preço */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Preço:
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={valorUnitario}
                onChange={(e) => setValorUnitario(e.target.value)}
                onKeyPress={handlePrecoKeyPress}
                inputProps={{ min: 0, step: 0.01 }}
                size="large"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography variant="h6">R$</Typography>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }
                }}
              />
            </Box>

            {/* Subtotal */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Subtotal:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  textAlign: 'right'
                }}
              >
                <Typography variant="h4" fontWeight="bold" color="primary">
                  R$ {(quantidade * valorUnitario - (quantidade * valorUnitario * descontoItem / 100)).toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Botões de Ação */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<ReceiptIcon />}
                  onClick={() => {
                    // Funcionalidade de serviços a ser implementada
                    console.log('Botão Serviços clicado');
                  }}
                  sx={{
                    height: 60,
                    borderColor: '#9C27B0',
                    color: '#9C27B0',
                    '&:hover': {
                      borderColor: '#7B1FA2',
                      backgroundColor: '#F3E5F5'
                    }
                  }}
                >
                  Serviços
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<MoneyIcon />}
                  onClick={() => {
                    // Funcionalidade de pagamento parcial a ser implementada
                    console.log('Botão Parcial clicado');
                  }}
                  sx={{
                    height: 60,
                    borderColor: '#4CAF50',
                    color: '#4CAF50',
                    '&:hover': {
                      borderColor: '#388E3C',
                      backgroundColor: '#E8F5E9'
                    }
                  }}
                >
                  Parcial
                </Button>
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<PersonIcon />}
                  onClick={() => {
                    setOpenSelecionarCliente(true);
                    carregarClientes();
                  }}
                  sx={{
                    height: 60,
                    borderColor: '#2196F3',
                    color: '#2196F3',
                    '&:hover': {
                      borderColor: '#1976D2',
                      backgroundColor: '#E3F2FD'
                    }
                  }}
                >
                  Cliente
                  <Typography component="span" sx={{ ml: 1, fontSize: '0.75rem', opacity: 0.7 }}>
                    (F1)
                  </Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<GroupIcon />}
                  onClick={() => {
                    // Funcionalidade de agrupar itens a ser implementada
                    console.log('Botão Agrupar clicado');
                  }}
                  sx={{
                    height: 60,
                    borderColor: '#00BCD4',
                    color: '#00BCD4',
                    '&:hover': {
                      borderColor: '#0097A7',
                      backgroundColor: '#E0F7FA'
                    }
                  }}
                >
                  Agrupar
                </Button>
              </Grid>
            </Grid>

            {/* Botões Cancelar e Concluir */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    if (itens.length > 0 && window.confirm('Deseja cancelar a venda atual?')) {
                      setItens([]);
                      setDescontoGeral(0);
                      setCondicoesSelecionadas([]);
                      setCodigoProduto('');
                      setNomeProduto('');
                      setQuantidade(1);
                      setValorUnitario(0);
                      setIdProdutoSelecionado(null);
                    }
                  }}
                  disabled={itens.length === 0}
                  sx={{
                    height: 70,
                    borderColor: '#f44336',
                    color: '#f44336',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    '&:hover': {
                      borderColor: '#d32f2f',
                      backgroundColor: '#ffebee'
                    },
                    '&:disabled': {
                      borderColor: '#cccccc',
                      color: '#cccccc'
                    }
                  }}
                >
                  <CancelIcon sx={{ mr: 1, fontSize: 28 }} />
                  Cancelar
                  <Typography component="span" sx={{ ml: 1, fontSize: '0.75rem', opacity: 0.7 }}>
                    (F6)
                  </Typography>
                </Button>
              </Grid>

              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => {
                    const subtotalSync = itens.reduce((acc, item) => acc + (item.valor_total || 0), 0);
                    const valorDescontoGeralSync = (subtotalSync * descontoGeral) / 100;
                    const totalSync = subtotalSync - valorDescontoGeralSync;
                    abrirCondicoesPagamento(false, totalSync);
                  }}
                  disabled={itens.length === 0}
                  sx={{
                    height: 70,
                    backgroundColor: '#4CAF50',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#388E3C'
                    },
                    '&:disabled': {
                      backgroundColor: '#cccccc'
                    }
                  }}
                >
                  <CheckIcon sx={{ mr: 1, fontSize: 30 }} />
                  Concluir
                  <Typography component="span" sx={{ ml: 1, fontSize: '0.75rem', opacity: 0.9 }}>
                    (F10)
                  </Typography>
                </Button>
              </Grid>
            </Grid>

            {/* Botão Reimprimir */}
            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={carregarVendas}
                disabled={loadingVendas}
                startIcon={loadingVendas ? <CircularProgress size={20} /> : <PrintIcon />}
                sx={{
                  height: 60,
                  borderColor: '#9C27B0',
                  color: '#9C27B0',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  '&:hover': {
                    borderColor: '#7B1FA2',
                    backgroundColor: '#F3E5F5'
                  }
                }}
              >
                Reimprimir Venda
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Coluna Direita - Lista de Itens */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Itens:
            </Typography>

            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Item</TableCell>
                    <TableCell sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Descrição</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Preço</TableCell>
                    <TableCell align="center" sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Quantidade</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell align="center" sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itens.map((item, index) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#e3f2fd' : 'white',
                        '&:hover': { backgroundColor: '#bbdefb' }
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={index + 1}
                          size="small"
                          sx={{
                            backgroundColor: '#2196F3',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography fontWeight="bold">
                            {item.nome || item.codigo}
                          </Typography>
                          {item.tem_promocao && (
                            <Chip
                              icon={<span>✨</span>}
                              label="PROMOÇÃO"
                              size="small"
                              sx={{
                                backgroundColor: '#FF6B35',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.7rem'
                              }}
                            />
                          )}
                          {item.numero_lote && (
                            <Chip
                              label={`Lote: ${item.numero_lote}`}
                              size="small"
                              color="info"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          {parseFloat(item.valor_unitario || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="bold">
                          {parseFloat(item.quantidade || 0).toFixed(0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {parseFloat(item.valor_total || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => abrirDescontoItem(item)}
                          sx={{ color: '#FF9800' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => removerItem(item.id)}
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {itens.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <CartIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                        <Typography color="text.secondary" variant="h6">
                          Nenhum item adicionado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total - Destaque Laranja */}
            <Box
              sx={{
                mt: 3,
                p: 3,
                backgroundColor: '#2196F3',
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography variant="h4" fontWeight="bold" color="white">
                Total:
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="white">
                R$ {valorTotal.toFixed(2)}
              </Typography>
            </Box>

            {/* Informações do Cliente/Vendedor */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, backgroundColor: '#E3F2FD' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {cliente?.nome_razao_social || 'Não definido'}
                  </Typography>
                  {
                    // Mostrar informações de limite: prefere `limiteInfo` (busca via API), senão usa `cliente.limite_credito`
                  }
                  <Typography variant="caption" color="primary">
                    Limite: R$ {parseFloat(limiteInfo?.limiteTotal ?? cliente?.limite_credito ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Utilizado: R$ {parseFloat(limiteInfo?.limiteUtilizado ?? cliente?.saldo_devedor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — Disponível: R$ {parseFloat(limiteInfo?.limiteDisponivel ?? (cliente?.limite_credito ? (cliente.limite_credito - (cliente?.saldo_devedor || 0)) : 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, backgroundColor: '#E8F5E9' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vendedor
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {vendedor?.nome || 'Não definido'}
                  </Typography>
                  {vendedor && vendedor.percentual_comissao && (
                    <Typography variant="caption" color="success.main">
                      Comissão: {vendedor.percentual_comissao}%
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog Desconto Geral */}
      <Dialog
        open={openDesconto}
        onClose={() => setOpenDesconto(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#FF9800', color: 'white', fontWeight: 'bold' }}>
          <DiscountIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Desconto Geral
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Desconto %"
            type="number"
            value={descontoGeral}
            onChange={(e) => setDescontoGeral(e.target.value)}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }
            }}
            autoFocus
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Desconto será aplicado ao total da venda
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenDesconto(false)}
            variant="outlined"
            size="large"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => setOpenDesconto(false)}
            variant="contained"
            size="large"
            sx={{ backgroundColor: '#FF9800', '&:hover': { backgroundColor: '#F57C00' } }}
          >
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Desconto do Item */}
      <Dialog
        open={openDescontoItem}
        onClose={() => setOpenDescontoItem(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#2196F3', color: 'white', fontWeight: 'bold' }}>
          <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Desconto do Item
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Desconto %"
            type="number"
            value={descontoItemEdit}
            onChange={(e) => setDescontoItemEdit(e.target.value)}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }
            }}
            autoFocus
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Desconto será aplicado apenas a este item
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenDescontoItem(false)}
            variant="outlined"
            size="large"
          >
            Cancelar
          </Button>
          <Button
            onClick={aplicarDescontoItem}
            variant="contained"
            size="large"
            color="primary"
          >
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Finalizar Venda */}
      <Dialog open={openFinalizar} onClose={() => setOpenFinalizar(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#4CAF50', color: 'white', fontWeight: 'bold' }}>
          <CheckIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Finalizar Venda
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h4" gutterBottom>
              Total da venda:
            </Typography>
            <Typography variant="h2" fontWeight="bold" color="primary">
              R$ {valorTotal.toFixed(2)}
            </Typography>
            <Chip
              label={`${itens.length} ${itens.length === 1 ? 'item' : 'itens'}`}
              sx={{ mt: 2, fontSize: '1rem', fontWeight: 'bold' }}
              color="info"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Cliente:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {cliente?.nome_razao_social || 'Não definido'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Vendedor:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {vendedor?.nome || 'Não definido'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Operação:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {operacao?.nome_operacao || 'Não definido'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Documento:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  Nº {numeroDocumento}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenFinalizar(false)}
            variant="outlined"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={finalizarVenda}
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
            sx={{
              backgroundColor: '#4CAF50',
              minWidth: 120,
              '&:hover': { backgroundColor: '#388E3C' }
            }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Pesquisa de Produtos */}
      <Dialog
        open={openPesquisaProduto}
        onClose={() => setOpenPesquisaProduto(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#2196F3', color: 'white', fontWeight: 'bold' }}>
          <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Selecione o Produto
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', width: 80 }}>Imagem</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Descrição</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Estoque</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Valor</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {produtosPesquisa.map((produto, index) => {
                  const imagemUrl = produto.imagem_url || localStorage.getItem(`produto_imagem_${produto.codigo_produto}`);

                  return (
                    <TableRow
                      key={produto.id_produto}
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#e3f2fd' : 'white',
                        '&:hover': {
                          backgroundColor: '#bbdefb',
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => selecionarProduto(produto)}
                    >
                      <TableCell>
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
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
                              alt={produto.nome_produto}
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
                            <SearchIcon sx={{ fontSize: 32, color: '#bdbdbd' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="bold">
                          {produto.codigo_produto}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>
                          {produto.nome_produto || produto.descricao || 'Sem descrição'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={produto.quantidade_estoque ? parseFloat(produto.quantidade_estoque).toFixed(2) : '0.00'}
                          size="small"
                          color={parseFloat(produto.quantidade_estoque || 0) > 0 ? 'success' : 'error'}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold" color="primary">
                          R$ {produto.valor_venda ? parseFloat(produto.valor_venda).toFixed(2) : '0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            selecionarProduto(produto);
                          }}
                          sx={{
                            backgroundColor: '#4CAF50',
                            '&:hover': { backgroundColor: '#388E3C' }
                          }}
                        >
                          Selecionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {produtosPesquisa.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Nenhum produto encontrado
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenPesquisaProduto(false)}
            variant="outlined"
            size="large"
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Condições de Pagamento */}
      <Dialog
        open={openCondicoesPagamento}
        onClose={() => { setOpenCondicoesPagamento(false); setUsarMercadoPago(false); }}
        maxWidth="md"
        fullWidth
      >
        {openCondicoesPagamento && console.log('🎬 RENDERIZANDO MODAL DE CONDIÇÕES:', {
          'valorCondicaoAtual': valorCondicaoAtual,
          'valorTotal': valorTotal,
          'valorRestante': valorRestante
        })}
        <DialogTitle sx={{ backgroundColor: '#4CAF50', color: 'white', fontWeight: 'bold' }}>
          <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Condições de Pagamento
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {/* Resumo da Venda */}
          <Paper sx={{ p: 2, mb: 3, backgroundColor: '#E3F2FD' }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total da Venda:
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  R$ {valorTotal.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Valor Restante:
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={valorRestante > 0 ? 'error' : 'success.main'}
                >
                  R$ {valorRestante.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Adicionar Condição */}
          <Paper sx={{ p: 2, mb: 3, backgroundColor: '#FFF3E0' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Adicionar Condição de Pagamento
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" gutterBottom display="block">
                  Forma de Pagamento
                </Typography>
                <TextField
                  fullWidth
                  select
                  value={formaPagamentoAtual || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormaPagamentoAtual(val);
                    const forma = formasPagamento.find(f => f.id_forma_pagamento === parseInt(val));
                    const isMP = !!(forma?.tipo_integracao === 'MERCADOPAGO' || forma?.nome_forma?.toLowerCase().includes('mercado'));
                    setUsarMercadoPago(isMP);
                  }}
                  SelectProps={{
                    native: true,
                  }}
                  size="small"
                >
                  <option value="">Selecione...</option>
                  {formasPagamento.map((forma) => (
                    <option key={forma.id_forma_pagamento} value={forma.id_forma_pagamento}>
                      {forma.nome_forma}
                      {(!forma.id_conta_padrao || !forma.id_centro_custo || !forma.id_departamento) && ' ⚠️'}
                    </option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" gutterBottom display="block">
                  Valor
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={valorCondicaoAtual}
                  onChange={(e) => setValorCondicaoAtual(parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => adicionarCondicao(false)}
                  disabled={usarMercadoPago}
                  title={usarMercadoPago ? 'Use o botão "Cobrar no Point Tap" abaixo' : ''}
                  sx={{
                    height: '56px',
                    backgroundColor: '#FF9800',
                    '&:hover': { backgroundColor: '#F57C00' },
                    '&:disabled': { backgroundColor: '#ccc' }
                  }}
                >
                  <AddIcon />
                </Button>
              </Grid>
            </Grid>

            {/* Tag toggle Mercado Pago Point Tap */}
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="📱 Mercado Pago Point Tap"
                clickable
                color={usarMercadoPago ? 'primary' : 'default'}
                variant={usarMercadoPago ? 'filled' : 'outlined'}
                onClick={() => setUsarMercadoPago(v => !v)}
                sx={{ fontWeight: usarMercadoPago ? 'bold' : 'normal' }}
              />
              {usarMercadoPago && (
                <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic' }}>
                  ✓ Será cobrado pelo terminal Point Tap
                </Typography>
              )}
            </Box>

            {/* Botão Mercado Pago Point Tap — aparece só quando MP está marcado */}
            {usarMercadoPago && (
              <Box sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => iniciarCobrancaMPPoint()}
                  disabled={openMPPoint}
                  sx={{
                    backgroundColor: '#009EE3',
                    '&:hover': { backgroundColor: '#0077B5' },
                    '&:disabled': { backgroundColor: '#b0d6ee' },
                    py: 1.5,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                  }}
                >
                  📱 Cobrar R$ {(valorCondicaoAtual || valorTotal).toFixed(2)} no Point Tap
                </Button>
              </Box>
            )}

            {/* Detalhes da Forma Selecionada */}
            {formaPagamentoAtual && (() => {
              const formaSelecionada = formasPagamento.find(f => f.id_forma_pagamento === parseInt(formaPagamentoAtual));
              console.log('🔍 Forma selecionada:', formaSelecionada);
              console.log('  - id_conta_padrao:', formaSelecionada?.id_conta_padrao);
              console.log('  - nome_conta_padrao:', formaSelecionada?.nome_conta_padrao);
              console.log('  - id_centro_custo:', formaSelecionada?.id_centro_custo);
              console.log('  - nome_centro_custo:', formaSelecionada?.nome_centro_custo);
              console.log('  - id_departamento:', formaSelecionada?.id_departamento);
              console.log('  - nome_departamento:', formaSelecionada?.nome_departamento);

              return formaSelecionada && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#E3F2FD', borderRadius: 1 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" gutterBottom display="block">
                    Configuração da Forma de Pagamento:
                  </Typography>
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Conta:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color={formaSelecionada.id_conta_padrao ? 'success.main' : 'error.main'}
                        sx={{ display: 'block' }}
                      >
                        {formaSelecionada.nome_conta_padrao || '⚠️ Não configurada'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Centro de Custo:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color={formaSelecionada.id_centro_custo ? 'success.main' : 'error.main'}
                        sx={{ display: 'block' }}
                      >
                        {formaSelecionada.nome_centro_custo || '⚠️ Não configurado'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Departamento:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color={formaSelecionada.id_departamento ? 'success.main' : 'error.main'}
                        sx={{ display: 'block' }}
                      >
                        {formaSelecionada.nome_departamento || '⚠️ Não configurado'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Vencimento:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {formaSelecionada.dias_vencimento === 0 ? 'Hoje' : `${formaSelecionada.dias_vencimento} dias`}
                      </Typography>
                    </Grid>
                  </Grid>
                  {(!formaSelecionada.id_conta_padrao || !formaSelecionada.id_centro_custo || !formaSelecionada.id_departamento) && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      ⚠️ Esta forma de pagamento está incompleta. Configure os campos obrigatórios em Cadastros {'>'} Formas de Pagamento.
                    </Alert>
                  )}
                </Box>
              );
            })()}
          </Paper>

          {/* Lista de Condições Selecionadas */}
          {condicoesSelecionadas.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Condições Selecionadas
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Forma de Pagamento</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Conta/Depto/C.Custo</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Vencimento</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Valor</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ação</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {condicoesSelecionadas.map((condicao, index) => {
                      const forma = formasPagamento.find(f => f.id_forma_pagamento === parseInt(condicao.forma));
                      const dataVenc = new Date();
                      dataVenc.setDate(dataVenc.getDate() + (forma?.dias_vencimento || 0));

                      return (
                        <TableRow key={condicao.id}>
                          <TableCell>
                            <Typography fontWeight="bold">
                              {forma?.nome_forma || 'N/A'}
                            </Typography>
                            {condicoesSelecionadas.length > 1 && (
                              <Typography variant="caption" color="text.secondary">
                                Parcela {index + 1}/{condicoesSelecionadas.length}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" display="block" color="text.secondary">
                              Conta: {forma?.nome_conta_padrao || 'N/A'}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              Depto: {forma?.nome_departamento || 'N/A'}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              C.Custo: {forma?.nome_centro_custo || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={dataVenc.toLocaleDateString('pt-BR')}
                              size="small"
                              color={forma?.dias_vencimento === 0 ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="primary" fontWeight="bold">
                              R$ {parseFloat(condicao.valor || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => removerCondicao(condicao.id)}
                              sx={{ color: '#f44336' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow sx={{ backgroundColor: '#E3F2FD' }}>
                      <TableCell colSpan={3}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          TOTAL:
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          R$ {condicoesSelecionadas.reduce((acc, c) => acc + c.valor, 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setOpenCondicoesPagamento(false);
              setCondicoesSelecionadas([]);
              setFormaPagamentoAtual(null);
              setValorCondicaoAtual(0);
            }}
            variant="outlined"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              // Se há condição MP na lista e ainda não foi pago via Point Tap, iniciar pagamento
              const condMP = obterCondicaoMercadoPago();
              if (condMP && !mpPointTransacaoUuid) {
                iniciarCobrancaMPPoint(condMP.valor, 'finalizar_venda');
              } else {
                finalizarVenda();
              }
            }}
            variant="contained"
            size="large"
            disabled={loading || valorRestante !== 0}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
            sx={{
              backgroundColor: '#4CAF50',
              minWidth: 120,
              '&:hover': { backgroundColor: '#388E3C' }
            }}
          >
            Finalizar Venda
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal Mercado Pago Point Tap ────────────────────────────────────── */}
      <Dialog
        open={openMPPoint}
        onClose={() => {}}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{
          backgroundColor: '#009EE3',
          color: 'white',
          textAlign: 'center',
          fontWeight: 'bold',
        }}>
          📱 Mercado Pago Point Tap
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          {mpPointStatus === 'PROCESSANDO' && (
            <>
              <CircularProgress size={64} sx={{ color: '#009EE3', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Aguardando pagamento...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Apresente o cartão ou celular ao terminal Point Tap.
              </Typography>
            </>
          )}
          {mpPointStatus === 'APROVADA' && (
            <>
              <Typography variant="h1" sx={{ fontSize: 64 }}>✅</Typography>
              <Typography variant="h6" color="success.main" gutterBottom fontWeight="bold">
                Pagamento aprovado!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Finalizando venda automaticamente...
              </Typography>
            </>
          )}
          {(mpPointStatus === 'RECUSADA' || mpPointStatus === 'CANCELADA' || mpPointStatus === 'ERRO') && (
            <>
              <Typography variant="h1" sx={{ fontSize: 64 }}>
                {mpPointStatus === 'RECUSADA' ? '❌' : '🚫'}
              </Typography>
              <Typography variant="h6" color="error.main" gutterBottom fontWeight="bold">
                {mpPointStatus === 'RECUSADA' ? 'Pagamento recusado' :
                  mpPointStatus === 'CANCELADA' ? 'Pagamento cancelado' : 'Erro no terminal'}
              </Typography>
              {mpPointDetalhe && (
                <Typography variant="body2" color="text.secondary">
                  {mpPointDetalhe}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          {mpPointStatus !== 'APROVADA' && (
            <Button
              variant="outlined"
              color="error"
              onClick={cancelarCobrancaMPPoint}
              disabled={mpPointStatus === 'PROCESSANDO' ? false : false}
            >
              {mpPointStatus === 'PROCESSANDO' ? 'Cancelar cobrança' : 'Fechar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {/* ── Fim Modal MP Point ──────────────────────────────────────────────── */}

      {/* Dialog de Impressão */}
      <Dialog
        open={openImpressao}
        onClose={() => { }}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ mt: 2 }}>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h5" gutterBottom>
              Deseja imprimir a venda?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Venda #{dadosVendaCompleta?.numero_documento}
            </Typography>
            <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
              Total: R$ {dadosVendaCompleta?.total.toFixed(2)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
          <Button
            onClick={limparVenda}
            variant="outlined"
            size="large"
            sx={{ minWidth: 150 }}
          >
            Não Imprimir
          </Button>
          <Button
            onClick={imprimirVenda}
            variant="contained"
            size="large"
            startIcon={<PrintIcon />}
            sx={{
              backgroundColor: '#4CAF50',
              minWidth: 150,
              '&:hover': { backgroundColor: '#388E3C' }
            }}
          >
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Configuração de Imagem de Fundo */}
      <Dialog
        open={openConfigFundo}
        onClose={() => setOpenConfigFundo(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          backgroundColor: '#9C27B0',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <WallpaperIcon />
          Configurar Imagem de Fundo
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecione uma imagem do seu computador para usar como plano de fundo da tela de vendas.
          </Typography>

          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<WallpaperIcon />}
            sx={{
              mb: 2,
              height: 56,
              borderColor: '#9C27B0',
              color: '#9C27B0',
              '&:hover': {
                borderColor: '#7B1FA2',
                backgroundColor: '#F3E5F5'
              }
            }}
          >
            Escolher Imagem do Computador
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImagemFundoUpload}
            />
          </Button>

          {imagemFundo && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Pré-visualização:
              </Typography>
              <Box
                component="img"
                src={imagemFundo}
                alt="Preview"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 1,
                  border: '2px solid #9C27B0',
                  boxShadow: 2
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                ✓ Imagem carregada com sucesso!
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfigFundo(false)}>
            Cancelar
          </Button>
          {imagemFundo && (
            <Button
              onClick={removerImagemFundo}
              color="error"
              variant="outlined"
            >
              Remover Imagem
            </Button>
          )}
          <Button
            onClick={salvarImagemFundo}
            variant="contained"
            sx={{
              backgroundColor: '#9C27B0',
              '&:hover': { backgroundColor: '#7B1FA2' }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Seleção de Cliente */}
      <Dialog
        open={openSelecionarCliente}
        onClose={() => {
          setOpenSelecionarCliente(false);
          setBuscaCliente('');
        }}
        maxWidth="md"
        fullWidth
        onTransitionEnter={() => carregarClientes()}
      >
        <DialogTitle sx={{
          backgroundColor: '#2196F3',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <GroupIcon />
          Selecionar Cliente (F1)
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar por nome, CPF/CNPJ..."
            value={buscaCliente}
            onChange={(e) => setBuscaCliente(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
            autoFocus
          />

          {loadingClientes ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : clientes.length === 0 ? (
            <Alert severity="info">
              Nenhum cliente cadastrado.
            </Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Nome</strong></TableCell>
                    <TableCell><strong>CPF/CNPJ</strong></TableCell>
                    <TableCell><strong>Telefone</strong></TableCell>
                    <TableCell align="center"><strong>Ação</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientes
                    .filter(c => {
                      if (!buscaCliente) return true;
                      const busca = buscaCliente.toLowerCase();
                      const nome = (c.nome_razao_social || c.nome || '').toLowerCase();
                      const cpfCnpj = (c.cpf_cnpj || '').replace(/[^\d]/g, '');
                      const buscaNumeros = buscaCliente.replace(/[^\d]/g, '');
                      return nome.includes(busca) || cpfCnpj.includes(buscaNumeros);
                    })
                    .map((clienteItem) => (
                      <TableRow
                        key={clienteItem.id_cliente}
                        hover
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: cliente?.id_cliente === clienteItem.id_cliente ? '#E3F2FD' : 'inherit'
                        }}
                        onClick={() => selecionarClienteVenda(clienteItem)}
                      >
                        <TableCell>{clienteItem.nome_razao_social || clienteItem.nome || '-'}</TableCell>
                        <TableCell>{clienteItem.cpf_cnpj || '-'}</TableCell>
                        <TableCell>{clienteItem.telefone || clienteItem.whatsapp || '-'}</TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant={cliente?.id_cliente === clienteItem.id_cliente ? "contained" : "outlined"}
                            onClick={(e) => {
                              e.stopPropagation();
                              selecionarClienteVenda(clienteItem);
                            }}
                          >
                            {cliente?.id_cliente === clienteItem.id_cliente ? 'Selecionado' : 'Selecionar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenSelecionarCliente(false);
              setBuscaCliente('');
            }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Limite de Crédito */}
      <Dialog open={openLimiteModal} onClose={() => setOpenLimiteModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>
          ⚠️ Limite de Crédito Excedido
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {limiteInfo && (
            <Box>
              <Typography variant="body1" paragraph>
                <strong>Cliente:</strong> {limiteInfo.cliente}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Limite Total:</strong> R$ {limiteInfo.limiteTotal.toFixed(2)}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Limite Utilizado:</strong> R$ {limiteInfo.limiteUtilizado.toFixed(2)}
              </Typography>
              <Typography variant="body1" paragraph color="error">
                <strong>Limite Disponível:</strong> R$ {limiteInfo.limiteDisponivel.toFixed(2)}
              </Typography>

              {acaoLimiteAtual === 'solicitar_senha' && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Solicite autorização de um supervisor para prosseguir:
                  </Typography>
                  <TextField
                    fullWidth
                    label="Usuário Supervisor"
                    value={senhaSupervisorLimite.username}
                    onChange={(e) => setSenhaSupervisorLimite(prev => ({ ...prev, username: e.target.value }))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="Senha"
                    value={senhaSupervisorLimite.password}
                    onChange={(e) => setSenhaSupervisorLimite(prev => ({ ...prev, password: e.target.value }))}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenLimiteModal(false);
            setSenhaSupervisorLimite({ username: '', password: '' });
          }} color="error">
            {acaoLimiteAtual === 'alertar' ? 'Voltar' : 'Cancelar'}
          </Button>
          {acaoLimiteAtual === 'alertar' && (
            <Button onClick={() => {
              console.log('✅ Limite autorizado pelo usuário');
              setLimiteAutorizado(true);
              setOpenLimiteModal(false);

              // Processar próxima validação da fila
              console.log('🔄 Processando próxima validação após autorizar limite...');
              setTimeout(() => processarProximaValidacao(), 100);
            }} variant="contained" color="warning">
              Continuar Mesmo Assim
            </Button>
          )}
          {acaoLimiteAtual === 'solicitar_senha' && (
            <Button
              onClick={async () => {
                try {
                  await axiosInstance.post('/validar_senha_supervisor/', senhaSupervisorLimite);
                  setLimiteAutorizado(true);
                  setOpenLimiteModal(false);
                  setSenhaSupervisorLimite({ username: '', password: '' });
                  setSuccess('✅ Autorização concedida');

                  // Processar próxima validação da fila
                  console.log('🔄 Processando próxima validação após senha de limite...');
                  setTimeout(() => processarProximaValidacao(), 100);
                } catch (err) {
                  setError('❌ Senha de supervisor inválida');
                }
              }}
              variant="contained"
              color="success"
            >
              Autorizar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de Cliente em Atraso */}
      <Dialog open={openAtrasoModal} onClose={() => setOpenAtrasoModal(false)} maxWidth="sm" fullWidth>
        {openAtrasoModal && console.log('🎬 MODAL DE ATRASO ABERTO:', { atrasoInfo, acaoAtrasoAtual })}
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>
          ⏰ Cliente com Títulos em Atraso
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {atrasoInfo && (
            <Box>
              <Typography variant="body1" paragraph>
                <strong>Cliente:</strong> {atrasoInfo.cliente?.nome || atrasoInfo.cliente || 'N/A'}
              </Typography>
              <Typography variant="body1" paragraph color="error">
                <strong>Total em Atraso:</strong> R$ {(atrasoInfo.valor_total_atraso || 0).toFixed(2)}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Títulos em Atraso:</strong> {atrasoInfo.qtd_titulos || atrasoInfo.titulos_em_atraso || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {atrasoInfo.mensagem || ''}
              </Typography>

              {acaoAtrasoAtual === 'solicitar_senha' && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Solicite autorização de um supervisor para prosseguir:
                  </Typography>
                  <TextField
                    fullWidth
                    label="Usuário Supervisor"
                    value={senhaSupervisorAtraso.username}
                    onChange={(e) => setSenhaSupervisorAtraso(prev => ({ ...prev, username: e.target.value }))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="Senha"
                    value={senhaSupervisorAtraso.password}
                    onChange={(e) => setSenhaSupervisorAtraso(prev => ({ ...prev, password: e.target.value }))}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenAtrasoModal(false);
            setSenhaSupervisorAtraso({ username: '', password: '' });
          }} color="error">
            {acaoAtrasoAtual === 'alertar' ? 'Voltar' : 'Cancelar'}
          </Button>
          {acaoAtrasoAtual === 'alertar' && (
            <Button onClick={() => {
              console.log('✅ Atraso autorizado pelo usuário');
              setAtrasoAutorizado(true);
              setOpenAtrasoModal(false);

              // Processar próxima validação da fila
              console.log('🔄 Processando próxima validação após autorizar atraso...');
              setTimeout(() => processarProximaValidacao(), 100);
            }} variant="contained" color="warning">
              Continuar Mesmo Assim
            </Button>
          )}
          {acaoAtrasoAtual === 'solicitar_senha' && (
            <Button
              onClick={async () => {
                try {
                  await axiosInstance.post('/validar_senha_supervisor/', senhaSupervisorAtraso);
                  setAtrasoAutorizado(true);
                  setOpenAtrasoModal(false);
                  setSenhaSupervisorAtraso({ username: '', password: '' });
                  setSuccess('✅ Autorização concedida');

                  // Processar próxima validação da fila
                  console.log('🔄 Processando próxima validação após senha de atraso...');
                  setTimeout(() => processarProximaValidacao(), 100);
                } catch (err) {
                  setError('❌ Senha de supervisor inválida');
                }
              }}
              variant="contained"
              color="success"
            >
              Autorizar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de Estoque Insuficiente */}
      <Dialog open={openEstoqueModal} onClose={() => setOpenEstoqueModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'info.main', color: 'white' }}>
          📦 Estoque Insuficiente
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {estoqueInfo && (
            <Box>
              <Typography variant="body1" paragraph>
                <strong>Produto:</strong> {estoqueInfo.produto}
              </Typography>
              <Typography variant="body1" paragraph color="success.main">
                <strong>Disponível:</strong> {estoqueInfo.disponivel.toFixed(3)}
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Solicitado:</strong> {estoqueInfo.solicitado.toFixed(3)}
              </Typography>
              <Typography variant="body1" paragraph color="error">
                <strong>Faltam:</strong> {estoqueInfo.faltam.toFixed(3)}
              </Typography>

              {acaoEstoqueAtual === 'solicitar_senha' && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Solicite autorização de um supervisor para prosseguir:
                  </Typography>
                  <TextField
                    fullWidth
                    label="Usuário Supervisor"
                    value={senhaSupervisorEstoque.username}
                    onChange={(e) => setSenhaSupervisorEstoque(prev => ({ ...prev, username: e.target.value }))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="Senha"
                    value={senhaSupervisorEstoque.password}
                    onChange={(e) => setSenhaSupervisorEstoque(prev => ({ ...prev, password: e.target.value }))}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenEstoqueModal(false);
            setSenhaSupervisorEstoque({ username: '', password: '' });
            setItemPendenteEstoque(null);
          }} color="error">
            {acaoEstoqueAtual === 'alertar' ? 'Voltar' : 'Cancelar'}
          </Button>
          {acaoEstoqueAtual === 'alertar' && (
            <Button onClick={() => {
              console.log('✅ Estoque autorizado pelo usuário');
              setEstoqueAutorizado(true);
              setOpenEstoqueModal(false);
              if (itemPendenteEstoque) {
                if (itemPendenteEstoque.finalizacao) {
                  // Fluxo de finalização: não adicionar novamente, apenas processar próxima validação
                  setItemPendenteEstoque(null);
                  console.log('🔄 Finalização: confirmação recebida para item, processando próxima validação (Venda Rápida)');
                  setTimeout(() => processarProximaValidacao(), 100);
                } else {
                  // Fluxo normal: adicionar o item
                  efetivarAdicaoItem(itemPendenteEstoque);
                  setItemPendenteEstoque(null);

                  // Processar próxima validação da fila
                  console.log('🔄 Processando próxima validação após autorizar estoque...');
                  setTimeout(() => processarProximaValidacao(), 100);
                }
              }
            }} variant="contained" color="warning">
              Continuar Mesmo Assim
            </Button>
          )}
          {acaoEstoqueAtual === 'solicitar_senha' && (
            <Button
              onClick={async () => {
                try {
                  await axiosInstance.post('/validar_senha_supervisor/', senhaSupervisorEstoque);
                  setEstoqueAutorizado(true);
                  setOpenEstoqueModal(false);
                  setSenhaSupervisorEstoque({ username: '', password: '' });
                  if (itemPendenteEstoque) {
                    if (itemPendenteEstoque.finalizacao) {
                      setItemPendenteEstoque(null);
                      console.log('🔐 Finalização: senha autorizada para item, processando próxima validação (Venda Rápida)');
                      setTimeout(() => processarProximaValidacao(), 100);
                    } else {
                      efetivarAdicaoItem(itemPendenteEstoque);
                      setItemPendenteEstoque(null);
                      setSuccess('✅ Autorização concedida');
                      // Processar próxima validação da fila
                      console.log('🔄 Processando próxima validação após senha de estoque...');
                      setTimeout(() => processarProximaValidacao(), 100);
                    }
                  }
                } catch (err) {
                  setError('❌ Senha de supervisor inválida');
                }
              }}
              variant="contained"
              color="success"
            >
              Autorizar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de Reimpressão */}
      <Dialog
        open={openReimprimir}
        onClose={() => setOpenReimprimir(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{
          backgroundColor: '#9C27B0',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <PrintIcon />
          Reimprimir Venda
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {loadingVendas ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : vendas.length === 0 ? (
            <Alert severity="info">
              Nenhuma venda encontrada hoje.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Nº Doc</strong></TableCell>
                    <TableCell><strong>Data/Hora</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell align="right"><strong>Total</strong></TableCell>
                    <TableCell align="center"><strong>Ação</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vendas.map((venda, idx) => {
                    // Debug para entender estrutura do cliente
                    if (idx === 0) {
                      console.log('🔍 DEBUG Tabela - Primeira venda:', venda);
                      console.log('🔍 DEBUG Tabela - Cliente:', venda.cliente);
                      console.log('🔍 DEBUG Tabela - Tipo cliente:', typeof venda.cliente);
                      if (venda.cliente && typeof venda.cliente === 'object') {
                        console.log('🔍 DEBUG Tabela - Chaves cliente:', Object.keys(venda.cliente));
                      }
                    }

                    // Determinar nome do cliente
                    let nomeCliente = 'N/A';
                    if (venda.cliente) {
                      if (typeof venda.cliente === 'object') {
                        nomeCliente = venda.cliente.nome_razao_social ||
                          venda.cliente.nome_fantasia ||
                          venda.cliente.nome ||
                          venda.cliente.nome_razao ||
                          'Cliente ' + venda.cliente.id_cliente;
                      } else {
                        nomeCliente = 'ID: ' + venda.cliente;
                      }
                    }

                    return (
                      <TableRow key={venda.id_venda || venda.id || venda.pk} hover>
                        <TableCell>{venda.numero_documento}</TableCell>
                        <TableCell>
                          {new Date(venda.data).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {nomeCliente}
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold" color="primary">
                            R$ {parseFloat(venda.valor_total || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => reimprimirVenda(venda)}
                            startIcon={<PrintIcon />}
                            sx={{
                              backgroundColor: '#4CAF50',
                              '&:hover': { backgroundColor: '#388E3C' }
                            }}
                          >
                            Imprimir
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenReimprimir(false)}
            variant="outlined"
            size="large"
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Seleção de Tabela Comercial */}
      <Dialog
        open={openSelecionarTabela}
        onClose={() => {
          setOpenSelecionarTabela(false);
          setProdutoPendenteTabela(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyIcon />
          Selecione a Tabela de Preços
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Você não tem uma tabela de preços padrão configurada. Selecione qual tabela deseja usar para esta venda.
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            💡 Dica: Configure uma tabela padrão em <strong>Configurações → Usuários → Venda Rápida</strong>
          </Typography>

          <Grid container spacing={2}>
            {tabelasComerciais.map((tabela) => (
              <Grid item xs={12} key={tabela.id_tabela_comercial}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => confirmarTabelaEBuscarProduto(tabela)}
                  sx={{
                    p: 2,
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      bgcolor: 'primary.light',
                      color: 'white'
                    }
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="h6" component="div">
                      {tabela.nome}
                    </Typography>
                    <Typography variant="body1" color="primary" fontWeight="bold">
                      {tabela.percentual > 0 ? '+' : ''}{tabela.percentual}%
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Exemplo: R$ 100,00 → R$ {(100 + (100 * tabela.percentual / 100)).toFixed(2)}
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setOpenSelecionarTabela(false);
              setProdutoPendenteTabela(null);
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Pergunta - Alterar Tabela Comercial no Financeiro */}
      <Dialog
        open={openPerguntarTabelaFinanceiro}
        onClose={() => setOpenPerguntarTabelaFinanceiro(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#f57c00', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyIcon />
          Deseja Alterar a Tabela de Preços?
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              Você está usando a tabela <strong>"{tabelaSelecionada?.nome}"</strong> ({tabelaSelecionada?.percentual > 0 ? '+' : ''}{tabelaSelecionada?.percentual}%)
            </Typography>
            <Typography variant="body2">
              Deseja alterar para outra tabela de preços? Os valores serão recalculados.
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            {tabelasComerciais.map((tabela) => (
              <Grid item xs={12} key={tabela.id_tabela_comercial}>
                <Button
                  variant={tabelaSelecionada?.id_tabela_comercial === tabela.id_tabela_comercial ? 'contained' : 'outlined'}
                  fullWidth
                  onClick={() => confirmarTabelaParaFinanceiro(tabela)}
                  sx={{
                    p: 2,
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    }
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="h6" component="div">
                      {tabela.nome}
                      {tabelaSelecionada?.id_tabela_comercial === tabela.id_tabela_comercial && ' (Atual)'}
                    </Typography>
                    <Typography variant="body1" color={tabelaSelecionada?.id_tabela_comercial === tabela.id_tabela_comercial ? 'inherit' : 'primary'} fontWeight="bold">
                      {tabela.percentual > 0 ? '+' : ''}{tabela.percentual}%
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Exemplo: R$ 100,00 → R$ {(100 + (100 * tabela.percentual / 100)).toFixed(2)}
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={pularPerguntaTabelaFinanceiro}
            variant="outlined"
          >
            Não Alterar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Abrir Caixa */}
      <Dialog open={openAbrirCaixa} maxWidth="sm" fullWidth disableEscapeKeyDown>
        <DialogTitle>Abertura de Caixa</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Alert severity="info">
               Ops! O seu caixa está FECHADO. Informe o valor inicial (Fundo de Troco) para abrir o caixa e começar a vender.
            </Alert>
            <TextField 
              label="Valor de Abertura (R$)" 
              value={valorAbertura}
              onChange={(e) => setValorAbertura(e.target.value)}
              fullWidth
              autoFocus
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => window.location.href = '/dashboard'}>Voltar</Button>
            <Button onClick={handleAbrirCaixa} variant="contained">Abrir Caixa</Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog Fechar Caixa */}
      <Dialog open={openFecharCaixa} maxWidth="sm" fullWidth>
        <DialogTitle>Fechamento de Caixa</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
             <Alert severity="warning">
                Deseja realmente fechar o caixa?
                {caixaInfo && <Typography variant="body2" mt={1}>Data Abertura: {new Date(caixaInfo.data_abertura).toLocaleString()}</Typography>}
             </Alert>
             <TextField 
              label="Valor Conferido (R$)" 
              value={valorFechamento}
              onChange={(e) => setValorFechamento(e.target.value)}
              fullWidth
              autoFocus
              helperText="Informe o valor total em dinheiro na gaveta"
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />
            <TextField 
                label="Justificativa / Observações"
                value={justificativaFechamento}
                onChange={(e) => setJustificativaFechamento(e.target.value)}
                multiline
                rows={2}
                fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenFecharCaixa(false)}>Cancelar</Button>
            <Button onClick={handleFecharCaixa} variant="contained" color="error">Fechar Caixa</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Seleção de Lote */}
      <Dialog
        open={openSelecionarLote}
        onClose={() => {
          setOpenSelecionarLote(false);
          setLotesDisponiveis([]);
          if (lotePendente) {
            setLotePendente(null);
          } else {
            // Modo pré-seleção: cancelar limpa produto selecionado
            setCodigoProduto('');
            setIdProdutoSelecionado(null);
            setNomeProduto('');
            setQuantidade(1);
            setValorUnitario(0);
            setPrecoBaseProduto(0);
            setDescontoItem(0);
            setControlaProdutoLote(false);
            setLotePreSelecionado(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Selecionar Lote</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {lotePendente?.nome || nomeProduto} — Escolha o lote para este item:
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
            if (lotePendente) {
              setLotePendente(null);
            } else {
              setCodigoProduto('');
              setIdProdutoSelecionado(null);
              setNomeProduto('');
              setQuantidade(1);
              setValorUnitario(0);
              setPrecoBaseProduto(0);
              setDescontoItem(0);
              setControlaProdutoLote(false);
              setLotePreSelecionado(null);
            }
          }}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default VendaRapidaPage;




