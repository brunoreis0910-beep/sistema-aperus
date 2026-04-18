import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Chip,
  Alert,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  InputAdornment
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  FilterList as FilterListIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as PlayArrowIcon,
  ReceiptLong as ReceiptLongIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const FaturamentoPage = () => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();

  // Estados
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operacoes, setOperacoes] = useState([]);
  const [vendasSelecionadas, setVendasSelecionadas] = useState([]);
  
  // Filtros - REFORMULADOS
  const [filtrosAbertos, setFiltrosAbertos] = useState(true);
  
  // TIPOS DE DOCUMENTOS - Melhor organização
  const [incluirPedidos, setIncluirPedidos] = useState(true);   // Pedidos sem NF
  const [incluirCupons, setIncluirCupons] = useState(true);     // NFC-e/SAT  
  const [incluirNotas, setIncluirNotas] = useState(false);      // NF-e (raro como origem)
  
  // STATUS
  const [filtroStatus, setFiltroStatus] = useState('autorizados'); // 'todos', 'pendentes', 'autorizados'
  
  // SITUAÇÃO DE FATURAMENTO
  const [filtroFaturamento, setFiltroFaturamento] = useState('nao_faturados'); // 'nao_faturados', 'faturados', 'todos'
  
  // BUSCA E PERÍODO
  const [searchTerm, setSearchTerm] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Dialog de configuração inicial
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  
  // Dialog de conversão
  const [dialogOpen, setDialogOpen] = useState(false);
  const [operacaoSelecionada, setOperacaoSelecionada] = useState('');
  const [emitirAuto, setEmitirAuto] = useState(false);
  const [processando, setProcessando] = useState(false);
  
  // Expandir/colapsar vendas
  const [vendasExpandidas, setVendasExpandidas] = useState({});
  
  // Estoque fiscal (resultado da validação)
  const [validacaoEstoque, setValidacaoEstoque] = useState(null);
  const [divergenciasDialogOpen, setDivergenciasDialogOpen] = useState(false);
  const [produtos, setProdutos] = useState([]); // Lista de produtos para busca/substituição
  
  // Dialog de troca de produto
  const [trocarDialogOpen, setTrocarDialogOpen] = useState(false);
  const [divergenciaSelecionada, setDivergenciaSelecionada] = useState(null);
  const [produtoSubstituto, setProdutoSubstituto] = useState('');
  const [searchProduto, setSearchProduto] = useState('');
  const [loadingProdutos, setLoadingProdutos] = useState(false);

  // Funções de ajuste de estoque
  const ajustarQuantidade = async (divergencia) => {
    if (!divergencia.itens || divergencia.itens.length === 0) {
      showToast('Nenhum item encontrado para ajustar', 'error');
      return;
    }

    const ajustes = divergencia.itens.map(item => ({
      acao: 'trocar',
      id_item: item.id_item,
      id_produto_novo: divergencia.id_produto,
      quantidade_nova: divergencia.saldo_fiscal // Ajustar para o disponível
    }));

    try {
      const response = await axiosInstance.post('/faturamento/ajustar-itens/', {
        venda_ids: vendasSelecionadas,
        ajustes: ajustes
      });

      if (response.data.sucesso) {
        showToast(`Quantidade ajustada para ${divergencia.saldo_fiscal} unidades`, 'success');
        setDivergenciasDialogOpen(false);
        confirmarConversao(); // Revalidar
      } else {
        showToast(response.data.mensagem || 'Erro ao ajustar quantidade', 'error');
      }
    } catch (err) {
      console.error('Erro ao ajustar:', err);
      showToast(err.response?.data?.erro || 'Erro ao ajustar quantidade', 'error');
    }
  };

  const excluirItem = async (divergencia) => {
    if (!divergencia.itens || divergencia.itens.length === 0) {
      showToast('Nenhum item encontrado para excluir', 'error');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir ${divergencia.produto_nome}?`)) {
      return;
    }

    const ajustes = divergencia.itens.map(item => ({
      acao: 'excluir',
      id_item: item.id_item
    }));

    try {
      const response = await axiosInstance.post('/faturamento/ajustar-itens/', {
        venda_ids: vendasSelecionadas,
        ajustes: ajustes
      });

      if (response.data.sucesso) {
        showToast(`Item ${divergencia.produto_nome} excluído`, 'success');
        // Remover da lista de divergências
        setValidacaoEstoque(prev => ({
          ...prev,
          divergencias: prev.divergencias.filter(d => d.id_produto !== divergencia.id_produto)
        }));
        
        // Se não há mais divergências, fechar diálogo
        if (validacaoEstoque.divergencias.length <= 1) {
          setDivergenciasDialogOpen(false);
          confirmarConversao(); // Revalidar
        }
      } else {
        showToast(response.data.mensagem || 'Erro ao excluir item', 'error');
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
      showToast(err.response?.data?.erro || 'Erro ao excluir item', 'error');
    }
  };

  const carregarProdutos = async (busca = '') => {
    setLoadingProdutos(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.append('search', busca);
      params.append('limit', '50');
      params.append('ativo', 'true');
      
      const response = await axiosInstance.get(`/produtos/?${params.toString()}`);
      setProdutos(response.data.results || response.data || []);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      showToast('Erro ao carregar produtos', 'error');
    } finally {
      setLoadingProdutos(false);
    }
  };

  const abrirDialogoTroca = (divergencia) => {
    setDivergenciaSelecionada(divergencia);
    setProdutoSubstituto('');
    setSearchProduto('');
    carregarProdutos();
    setTrocarDialogOpen(true);
  };

  const confirmarTrocaProduto = async () => {
    if (!produtoSubstituto) {
      showToast('Selecione um produto substituto', 'warning');
      return;
    }

    if (!divergenciaSelecionada || !divergenciaSelecionada.itens || divergenciaSelecionada.itens.length === 0) {
      showToast('Nenhum item encontrado para trocar', 'error');
      return;
    }

    const ajustes = divergenciaSelecionada.itens.map(item => ({
      acao: 'trocar',
      id_item: item.id_item,
      id_produto_novo: parseInt(produtoSubstituto),
      quantidade_nova: item.quantidade // Manter quantidade original
    }));

    try {
      const response = await axiosInstance.post('/faturamento/ajustar-itens/', {
        venda_ids: vendasSelecionadas,
        ajustes: ajustes
      });

      if (response.data.sucesso) {
        const produtoNovo = produtos.find(p => p.id_produto === parseInt(produtoSubstituto));
        showToast(`Produto trocado por ${produtoNovo?.nome_produto || 'produto selecionado'}`, 'success');
        setTrocarDialogOpen(false);
        setDivergenciasDialogOpen(false);
        confirmarConversao(); // Revalidar
      } else {
        showToast(response.data.mensagem || 'Erro ao trocar produto', 'error');
      }
    } catch (err) {
      console.error('Erro ao trocar:', err);
      showToast(err.response?.data?.erro || 'Erro ao trocar produto', 'error');
    }
  };

  // Carregar operações de faturamento
  useEffect(() => {
    carregarOperacoes();
    calcularPeriodoPadrao();
  }, []);

  // Carregar vendas quando filtros mudam
  useEffect(() => {
    carregarVendas();
  }, [incluirPedidos, incluirCupons, incluirNotas, filtroStatus, filtroFaturamento, dataInicio, dataFim]);

  const calcularPeriodoPadrao = () => {
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    
    setDataInicio(trintaDiasAtras.toISOString().split('T')[0]);
    setDataFim(hoje.toISOString().split('T')[0]);
  };

  const carregarOperacoes = async () => {
    try {
      const response = await axiosInstance.get('/faturamento/operacoes/');
      const operacoesFaturamento = response.data?.operacoes_faturamento || [];
      setOperacoes(operacoesFaturamento);
      
      // Só setar automaticamente se não houver operação selecionada
      if (operacoesFaturamento.length > 0 && !operacaoSelecionada) {
        console.log('📋 Selecionando automaticamente primeira operação:', operacoesFaturamento[0]);
        setOperacaoSelecionada(operacoesFaturamento[0].id_operacao);
      } else if (operacaoSelecionada) {
        console.log('✅ Mantendo operação já selecionada:', operacaoSelecionada);
      }
    } catch (err) {
      console.error('Erro ao carregar operações:', err);
      showToast('Erro ao carregar operações de faturamento', 'error');
    }
  };

  const carregarClientes = async (busca = '') => {
    try {
      const params = new URLSearchParams();
      if (busca) params.append('search', busca);
      params.append('limit', '50');
      
      const response = await axiosInstance.get(`/clientes/?${params.toString()}`);
      setClientes(response.data.results || response.data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      showToast('Erro ao carregar clientes', 'error');
    }
  };

  const carregarVendas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // TIPOS DE DOCUMENTOS (lógica invertida - agora é "incluir" ao invés de "excluir")
      if (!incluirCupons) params.append('excluir_cupom', 'true');
      if (!incluirNotas) params.append('excluir_nota', 'true');
      if (!incluirPedidos) params.append('excluir_pedido', 'true');
      
      // STATUS
      if (filtroStatus === 'pendentes') params.append('apenas_pendentes', 'true');
      if (filtroStatus === 'autorizados') params.append('apenas_autorizadas', 'true');
      
      // FATURAMENTO
      if (filtroFaturamento === 'faturados') params.append('apenas_faturadas', 'true');
      if (filtroFaturamento === 'nao_faturados') params.append('apenas_nao_faturadas', 'true');
      if (filtroFaturamento === 'todos') params.append('incluir_faturadas', 'true');
      
      // PERÍODO
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      
      params.append('limit', '500');

      console.log('🔍 Carregando vendas com filtros:', {
        incluirPedidos,
        incluirCupons,
        incluirNotas,
        filtroStatus,
        filtroFaturamento,
        dataInicio,
        dataFim
      });

      const response = await axiosInstance.get(`/faturamento/listar-vendas/?${params.toString()}`);
      
      if (response.data.sucesso) {
        setVendas(response.data.vendas || []);
      } else {
        showToast('Erro ao carregar vendas', 'error');
      }
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
      showToast('Erro ao carregar vendas para faturamento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleVendaSelecionada = (idVenda) => {
    setVendasSelecionadas(prev => {
      if (prev.includes(idVenda)) {
        return prev.filter(id => id !== idVenda);
      } else {
        return [...prev, idVenda];
      }
    });
  };

  const toggleExpandirVenda = (idVenda) => {
    setVendasExpandidas(prev => ({
      ...prev,
      [idVenda]: !prev[idVenda]
    }));
  };

  const handleConverter = async () => {
    if (vendasSelecionadas.length === 0) {
      showToast('Selecione pelo menos uma venda para converter', 'warning');
      return;
    }
    
    // Recarregar operações para garantir dados atualizados (tipo_faturamento etc)
    await carregarOperacoes();
    
    // Identificar o cliente das vendas selecionadas
    const vendasParaConverter = vendas.filter(v => vendasSelecionadas.includes(v.id_venda));
    
    let clienteId = null;
    if (vendasParaConverter.length > 0) {
      // Verificar se todas as vendas são do mesmo cliente
      const clientesIds = [...new Set(vendasParaConverter.map(v => v.id_cliente))];
      
      if (clientesIds.length === 1 && clientesIds[0]) {
        // PRÉ-SELECIONAR o cliente da venda
        clienteId = clientesIds[0];
        setClienteSelecionado(clienteId);
      } else if (clientesIds.length > 1) {
        showToast('As vendas selecionadas são de clientes diferentes. Selecione um cliente final.', 'warning');
        setClienteSelecionado(''); // Limpar seleção
      } else {
        setClienteSelecionado(''); // Sem cliente
      }
    }
    
    // Carregar lista de clientes
    await carregarClientes();
    
    // Se há um cliente pré-selecionado, garantir que ele está na lista
    if (clienteId) {
      try {
        const response = await axiosInstance.get(`/clientes/${clienteId}/`);
        const clienteSelecionadoData = response.data;
        
        // Adicionar à lista se não estiver presente
        setClientes(prev => {
          const jaExiste = prev.some(c => c.id_cliente === clienteId);
          if (!jaExiste) {
            return [clienteSelecionadoData, ...prev];
          }
          return prev;
        });
      } catch (err) {
        console.error('Erro ao carregar cliente selecionado:', err);
      }
    }
    
    setConfigDialogOpen(true);
  };

  // Helper: verifica se há clientes diferentes sem cliente selecionado
  const faltaClienteFinal = () => {
    const vendasParaConverter = vendas.filter(v => vendasSelecionadas.includes(v.id_venda));
    const clientesIds = [...new Set(vendasParaConverter.map(v => v.id_cliente))];
    return clientesIds.length > 1 && !clienteSelecionado;
  };

  // Helper: verifica se a operação selecionada é incompatível com as vendas selecionadas
  const verificarIncompatibilidade = () => {
    if (!operacaoSelecionada || vendasSelecionadas.length === 0) return false;
    const operacao = operacoes.find(op => op.id_operacao === parseInt(operacaoSelecionada));
    console.log('🧐 verificarIncompatibilidade:', { operacaoSelecionada, operacao, tipo: operacao?.tipo_faturamento });
    if (!operacao?.tipo_faturamento) return false;
    const vendasParaConverter = vendas.filter(v => vendasSelecionadas.includes(v.id_venda));
    const temCupons = vendasParaConverter.some(v => v.e_cupom);
    const temPedidos = vendasParaConverter.some(v => v.e_pedido);
    console.log('🔍 Vendas:', { total: vendasParaConverter.length, temCupons, temPedidos });
    if (operacao.tipo_faturamento === 'cupom_para_nota' && temPedidos) return true;
    if (operacao.tipo_faturamento === 'pedido_para_nota' && temCupons) return true;
    if (operacao.tipo_faturamento === 'pedido_para_cupom' && temCupons) return true;
    return false;
  };

  const prosseguirParaConversao = () => {
    if (!operacaoSelecionada) {
      showToast('Selecione uma operação de faturamento', 'warning');
      return;
    }
    
    if (verificarIncompatibilidade()) {
      showToast('Operação incompatível com as vendas selecionadas. Verifique o tipo de faturamento.', 'error');
      return;
    }
    
    // Fechar diálogo de configuração e abrir diálogo de conversão
    setConfigDialogOpen(false);
    setDialogOpen(true);
  };

  // Helper: retorna o label do tipo de documento destino
  const getDestinoLabel = () => {
    const operacao = operacoes.find(op => op.id_operacao === parseInt(operacaoSelecionada));
    if (!operacao) return 'Documento Fiscal';
    if (operacao.tipo_faturamento === 'pedido_para_nota') return 'NF-e';
    if (operacao.tipo_faturamento === 'pedido_para_cupom') return 'NFC-e';
    if (operacao.tipo_faturamento === 'cupom_para_nota') return 'NF-e';
    // Fallback pelo modelo
    if (operacao.modelo_documento === '55') return 'NF-e';
    if (operacao.modelo_documento === '65') return 'NFC-e';
    return 'Documento Fiscal';
  };

  // Helper: retorna descrição do tipo de faturamento
  const getTipoFaturamentoDescricao = () => {
    const operacao = operacoes.find(op => op.id_operacao === parseInt(operacaoSelecionada));
    if (operacao?.tipo_faturamento === 'pedido_para_nota') return 'Pedido → NF-e';
    if (operacao?.tipo_faturamento === 'pedido_para_cupom') return 'Pedido → NFC-e';
    if (operacao?.tipo_faturamento === 'cupom_para_nota') return 'Cupom Fiscal → NF-e';
    // Fallback
    const destino = getDestinoLabel();
    const vendasParaConverter = vendas.filter(v => vendasSelecionadas.includes(v.id_venda));
    const temCupons = vendasParaConverter.some(v => v.e_cupom);
    const temPedidos = vendasParaConverter.some(v => v.e_pedido);
    if (temCupons && !temPedidos) return `Cupom Fiscal → ${destino}`;
    if (temPedidos && !temCupons) return `Pedido → ${destino}`;
    return `Faturamento → ${destino}`;
  };

  // Helper: retorna origens aceitas para a operação selecionada
  const getOrigensAceitas = () => {
    const operacao = operacoes.find(op => op.id_operacao === parseInt(operacaoSelecionada));
    if (operacao?.tipo_faturamento === 'cupom_para_nota') return 'Apenas Cupons Fiscais (NFC-e/SAT)';
    if (operacao?.tipo_faturamento === 'pedido_para_nota') return 'Apenas Pedidos';
    if (operacao?.tipo_faturamento === 'pedido_para_cupom') return 'Apenas Pedidos';
    return 'Pedidos ou Cupons';
  };

  const confirmarConversao = async () => {
    setProcessando(true);
    setValidacaoEstoque(null);
    
    try {
      // Validar incompatível antes de enviar ao backend
      if (verificarIncompatibilidade()) {
        showToast('Operação incompatível com as vendas selecionadas.', 'error');
        setProcessando(false);
        return;
      }

      // Validar se há vendas selecionadas
      if (!vendasSelecionadas || vendasSelecionadas.length === 0) {
        showToast('Nenhuma venda foi selecionada para conversão', 'error');
        setProcessando(false);
        return;
      }
      
      // Validar: se vendas de clientes diferentes, cliente final é obrigatório
      const vendasParaConverter = vendas.filter(v => vendasSelecionadas.includes(v.id_venda));
      const clientesIds = [...new Set(vendasParaConverter.map(v => v.id_cliente))];
      if (clientesIds.length > 1 && !clienteSelecionado) {
        showToast('As vendas são de clientes diferentes. Selecione um cliente final.', 'error');
        setProcessando(false);
        return;
      }
      
      // Buscar operação selecionada para verificar validar_estoque_fiscal
      const operacao = operacoes.find(op => op.id_operacao === parseInt(operacaoSelecionada));
      
      // Se a operação require validação de estoque, fazer antes
      if (operacao?.validar_estoque_fiscal) {
        showToast('Validando estoque fiscal...', 'info');
        
        console.log('🔍 Validando estoque:', {
          ids_vendas: vendasSelecionadas,
          id_operacao: parseInt(operacaoSelecionada),
          qtd_vendas: vendasSelecionadas.length
        });
        
        const validacaoResponse = await axiosInstance.post('/faturamento/validar-estoque-fiscal/', {
          ids_vendas: vendasSelecionadas,
          id_operacao: parseInt(operacaoSelecionada)
        });
        
        if (!validacaoResponse.data.sucesso) {
          setValidacaoEstoque(validacaoResponse.data);
          showToast('Divergências de estoque encontradas. Ajuste os itens.', 'warning');
          setProcessando(false);
          setDivergenciasDialogOpen(true); // Abrir diálogo de ajuste
          return;
        }
        
        if (validacaoResponse.data.avisos?.length > 0) {
          setValidacaoEstoque(validacaoResponse.data);
          showToast('Existem avisos de estoque. Verifique antes de continuar.', 'warning');
          setProcessando(false);
          return;
        }
        
        showToast('Estoque fiscal validado!', 'success');
      }
      
      // Converter cupom para NF-e
      const payload = {
        ids_cupons: vendasSelecionadas,
        id_operacao_nfe: parseInt(operacaoSelecionada),
        emitir_automaticamente: emitirAuto
      };
      
      // Se houver cliente selecionado, adiciona ao payload
      if (clienteSelecionado) {
        payload.id_cliente_destino = parseInt(clienteSelecionado);
      }
      
      const response = await axiosInstance.post('/faturamento/converter-cupom-nfe/', payload);
      
      if (response.data.sucesso) {
        if (response.data.emissao === 'erro') {
          showToast(`NF-e criada, mas erro na emissão automática: ${response.data.emissao_erro || 'Verifique na aba NF-e.'}`, 'warning');
        } else {
          showToast(response.data.mensagem || 'Conversão realizada com sucesso!', 'success');
        }
        setDialogOpen(false);
        setVendasSelecionadas([]);
        carregarVendas();
      } else {
        showToast(response.data.mensagem || 'Erro na conversão', 'error');
      }
    } catch (err) {
      console.error('Erro ao converter:', err);
      console.error('Detalhes do erro:', err.response?.data);
      const mensagemErro = err.response?.data?.erro || err.response?.data?.mensagem || 'Erro ao converter vendas';
      showToast(mensagemErro, 'error');
    } finally {
      setProcessando(false);
    }
  };

  const vendasFiltradas = vendas.filter(venda => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      venda.numero_documento?.toLowerCase().includes(term) ||
      venda.cliente?.toLowerCase().includes(term) ||
      venda.id_venda?.toString().includes(term)
    );
  });

  const getStatusColor = (status) => {
    const statusMap = {
      'PENDENTE': 'warning',
      'EMITIDA': 'success',
      'AUTORIZADA': 'success',
      'AUTORIZADO': 'success',
      'CANCELADA': 'error',
      'ERRO': 'error'
    };
    return statusMap[status] || 'default';
  };

  const getTipoIcon = (venda) => {
    if (venda.e_cupom) return <ReceiptIcon />;
    if (venda.e_nota) return <DescriptionIcon />;
    return <ShoppingCartIcon />;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          📄 Faturamento Avançado
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Atualizar lista">
            <IconButton onClick={carregarVendas} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleConverter}
            disabled={vendasSelecionadas.length === 0 || loading}
          >
            Faturar Selecionadas ({vendasSelecionadas.length})
          </Button>
        </Box>
      </Box>

      {/* Filtros - REFORMULADOS */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            mb: filtrosAbertos ? 2 : 0
          }}
          onClick={() => setFiltrosAbertos(!filtrosAbertos)}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon /> Filtros Avançados
          </Typography>
          <IconButton size="small">
            {filtrosAbertos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        {filtrosAbertos && (
          <>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              {/* BLOCO 1: TIPOS DE DOCUMENTOS */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: 'primary.main' }}>
                    📑 Tipos de Documentos
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={incluirPedidos}
                        onChange={(e) => setIncluirPedidos(e.target.checked)}
                      />
                    }
                    label="Pedidos/Orçamentos (sem fiscal)"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={incluirCupons}
                        onChange={(e) => setIncluirCupons(e.target.checked)}
                      />
                    }
                    label="Cupons Fiscais (NFC-e/SAT)"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={incluirNotas}
                        onChange={(e) => setIncluirNotas(e.target.checked)}
                      />
                    }
                    label="Notas Fiscais (NF-e)"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    💡 Selecione os tipos que deseja visualizar
                  </Typography>
                </Paper>
              </Grid>

              {/* BLOCO 2: STATUS DA NF-e */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: 'primary.main' }}>
                    📊 Status do Documento
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Filtrar por status</InputLabel>
                    <Select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      label="Filtrar por status"
                    >
                      <MenuItem value="todos">🔲 Todos os status</MenuItem>
                      <MenuItem value="pendentes">⏳ Apenas Pendentes</MenuItem>
                      <MenuItem value="autorizados">✅ Apenas Autorizados</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                    💡 Filtre pelo status da emissão fiscal
                  </Typography>
                </Paper>
              </Grid>

              {/* BLOCO 3: SITUAÇÃO DE FATURAMENTO */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: 'success.main' }}>
                    ✨ Situação de Faturamento
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Ver vendas...</InputLabel>
                    <Select
                      value={filtroFaturamento}
                      onChange={(e) => setFiltroFaturamento(e.target.value)}
                      label="Ver vendas..."
                    >
                      <MenuItem value="nao_faturados">🔴 Não Faturadas (pendentes)</MenuItem>
                      <MenuItem value="faturados">✅ Já Faturadas</MenuItem>
                      <MenuItem value="todos">🔲 Todas (faturadas + pendentes)</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                    💡 "Já Faturadas" mostra os documentos de origem
                  </Typography>
                </Paper>
              </Grid>

              {/* BLOCO 4: PERÍODO */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: 'primary.main' }}>
                    📅 Período
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Data Início"
                        type="date"
                        size="small"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Data Fim"
                        type="date"
                        size="small"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* BLOCO 5: BUSCA */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: 'primary.main' }}>
                    🔍 Busca Rápida
                  </Typography>
                  <TextField
                    fullWidth
                    label="Buscar"
                    placeholder="Número do documento, cliente, ID..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>

            {/* Resumo dos filtros */}
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                Filtros ativos:
              </Typography>
              <Chip 
                label={`${vendasFiltradas.length} vendas encontradas`} 
                color="primary" 
                size="small"
              />
              {vendasSelecionadas.length > 0 && (
                <Chip 
                  label={`${vendasSelecionadas.length} selecionadas`} 
                  color="success" 
                  size="small"
                />
              )}
              {!incluirPedidos && <Chip label="Sem pedidos" size="small" variant="outlined" onDelete={() => setIncluirPedidos(true)} />}
              {!incluirCupons && <Chip label="Sem cupons" size="small" variant="outlined" onDelete={() => setIncluirCupons(true)} />}
              {!incluirNotas && <Chip label="Sem NF-e" size="small" variant="outlined" onDelete={() => setIncluirNotas(true)} />}
              {filtroStatus !== 'todos' && <Chip label={`Status: ${filtroStatus}`} size="small" variant="outlined" onDelete={() => setFiltroStatus('todos')} />}
              {filtroFaturamento !== 'nao_faturados' && <Chip label={`Faturamento: ${filtroFaturamento}`} size="small" variant="outlined" onDelete={() => setFiltroFaturamento('nao_faturados')} />}
            </Box>
          </>
        )}
      </Paper>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Lista de Vendas */}
      {!loading && vendasFiltradas.length === 0 && (
        <Alert severity="info">
          Nenhuma venda encontrada com os filtros selecionados.
        </Alert>
      )}

      {!loading && vendasFiltradas.length > 0 && (
        <Grid container spacing={2}>
          {vendasFiltradas.map((venda) => (
            <Grid item xs={12} key={venda.id_venda}>
              <Card 
                sx={{ 
                  border: vendasSelecionadas.includes(venda.id_venda) ? 2 : 1,
                  borderColor: vendasSelecionadas.includes(venda.id_venda) ? 'primary.main' : 'divider',
                  opacity: venda.foi_faturada ? 0.6 : 1,  // Atenuar vendas faturadas
                  backgroundColor: venda.foi_faturada ? '#f5f5f5' : 'white'  // Fundo cinza claro
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
                      <Checkbox
                        checked={vendasSelecionadas.includes(venda.id_venda)}
                        onChange={() => toggleVendaSelecionada(venda.id_venda)}
                        disabled={venda.foi_faturada}  // Desabilitar se já foi faturada
                      />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTipoIcon(venda)}
                        <Box>
                          <Typography variant="h6">
                            {venda.numero_documento || `#${venda.id_venda}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {venda.tipo_documento}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Cliente
                        </Typography>
                        <Typography variant="body1">
                          {venda.cliente}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Data
                        </Typography>
                        <Typography variant="body1">
                          {new Date(venda.data_documento).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Valor
                        </Typography>
                        <Typography variant="h6" color="primary">
                          R$ {parseFloat(venda.valor_total).toFixed(2)}
                        </Typography>
                      </Box>

                      <Chip 
                        label={venda.status_nfe} 
                        color={getStatusColor(venda.status_nfe)}
                        size="small"
                      />

                      {venda.foi_faturada && (
                        <Chip 
                          label={venda.faturamento_info ? `JÁ FATURADA → ${venda.faturamento_info.tipo_label} ${venda.faturamento_info.numero_documento || ''}`.trim() : 'JÁ FATURADA'}
                          color="success"
                          size="small"
                          icon={<CheckCircleIcon />}
                        />
                      )}

                      {venda.qtd_itens > 0 && (
                        <Chip 
                          label={`${venda.qtd_itens} itens`} 
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    <IconButton
                      onClick={() => toggleExpandirVenda(venda.id_venda)}
                      size="small"
                    >
                      {vendasExpandidas[venda.id_venda] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>

                  {/* Detalhes expandidos */}
                  {vendasExpandidas[venda.id_venda] && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Operação
                          </Typography>
                          <Typography variant="body2">
                            {venda.operacao || 'N/A'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Modelo
                          </Typography>
                          <Typography variant="body2">
                            {venda.modelo_documento || 'N/A'}
                          </Typography>
                        </Grid>

                        {venda.chave_nfe && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Chave de Acesso
                            </Typography>
                            <Typography variant="body2" fontFamily="monospace">
                              {venda.chave_nfe}
                            </Typography>
                          </Grid>
                        )}

                        {/* Informações do faturamento - MELHORADO */}
                        {venda.foi_faturada && venda.faturamento_info && (
                          <Grid item xs={12}>
                            <Paper 
                              elevation={2}
                              sx={{
                                p: 2.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)',
                                border: '2px solid',
                                borderColor: 'success.main',
                              }}
                            >
                              <Typography 
                                variant="subtitle2" 
                                color="success.dark" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1,
                                  mb: 2
                                }}
                              >
                                <CheckCircleIcon fontSize="small" />
                                DOCUMENTO DE ORIGEM - JÁ FATURADO
                              </Typography>
                              
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                Esta venda foi utilizada como documento de origem e gerou:
                              </Typography>

                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={3}>
                                  <Box sx={{ 
                                    p: 1.5, 
                                    borderRadius: 1, 
                                    bgcolor: 'white',
                                    border: '1px solid',
                                    borderColor: 'success.200'
                                  }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                      Tipo do Documento Gerado
                                    </Typography>
                                    <Typography variant="h6" color="success.dark">
                                      {venda.faturamento_info.tipo_label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Modelo {venda.faturamento_info.modelo || '-'}
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid item xs={12} sm={3}>
                                  <Box sx={{ 
                                    p: 1.5, 
                                    borderRadius: 1, 
                                    bgcolor: 'white',
                                    border: '1px solid',
                                    borderColor: 'success.200'
                                  }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                      Nº do Documento Gerado
                                    </Typography>
                                    <Typography variant="h6" color="primary.main">
                                      {venda.faturamento_info.numero_documento || `#${venda.faturamento_info.id_venda}`}
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid item xs={12} sm={3}>
                                  <Box sx={{ 
                                    p: 1.5, 
                                    borderRadius: 1, 
                                    bgcolor: 'white',
                                    border: '1px solid',
                                    borderColor: 'success.200'
                                  }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                      Data de Emissão
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                      {venda.faturamento_info.data_documento 
                                        ? new Date(venda.faturamento_info.data_documento).toLocaleDateString('pt-BR') 
                                        : '-'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {venda.faturamento_info.data_documento 
                                        ? new Date(venda.faturamento_info.data_documento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
                                        : ''}
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid item xs={12} sm={3}>
                                  <Box sx={{ 
                                    p: 1.5, 
                                    borderRadius: 1, 
                                    bgcolor: 'white',
                                    border: '1px solid',
                                    borderColor: 'success.200'
                                  }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                      Status Atual
                                    </Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                      <Chip 
                                        label={venda.faturamento_info.status_nfe || 'PENDENTE'} 
                                        color={getStatusColor(venda.faturamento_info.status_nfe)} 
                                        size="small"
                                        sx={{ fontWeight: 'bold' }}
                                      />
                                    </Box>
                                  </Box>
                                </Grid>

                                {venda.faturamento_info.chave_nfe && (
                                  <Grid item xs={12}>
                                    <Box sx={{ 
                                      p: 1.5, 
                                      borderRadius: 1, 
                                      bgcolor: 'white',
                                      border: '1px solid',
                                      borderColor: 'success.200'
                                    }}>
                                      <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                        Chave de Acesso do Documento Gerado
                                      </Typography>
                                      <Typography 
                                        variant="body2" 
                                        fontFamily="monospace"
                                        sx={{ 
                                          mt: 0.5,
                                          wordBreak: 'break-all',
                                          fontSize: '0.85rem',
                                          color: 'primary.dark'
                                        }}
                                      >
                                        {venda.faturamento_info.chave_nfe}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )}
                              </Grid>

                              <Alert severity="info" sx={{ mt: 2, fontSize: '0.85rem' }}>
                                💡 <strong>Documento de Origem:</strong> {venda.tipo_documento} #{venda.numero_documento || venda.id_venda} de {new Date(venda.data_documento).toLocaleDateString('pt-BR')}
                              </Alert>
                            </Paper>
                          </Grid>
                        )}

                        {/* NOVO: Documentos que originaram esta nota (quando a venda é NF-e/NFC-e gerada por faturamento) */}
                        {venda.documentos_origem && venda.documentos_origem.length > 0 && (
                          <Grid item xs={12}>
                            <Paper 
                              elevation={2}
                              sx={{
                                p: 2.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)',
                                border: '2px solid',
                                borderColor: 'primary.main',
                              }}
                            >
                              <Typography 
                                variant="subtitle2" 
                                color="primary.dark" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1,
                                  mb: 2
                                }}
                              >
                                <ReceiptLongIcon fontSize="small" />
                                DOCUMENTOS DE ORIGEM QUE FORAM FATURADOS NESTA NOTA
                              </Typography>
                              
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                Esta nota fiscal foi gerada a partir do(s) seguinte(s) documento(s):
                              </Typography>

                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: 'primary.50' }}>
                                      <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Número</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Modelo</TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Valor</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {venda.documentos_origem.map((doc) => (
                                      <TableRow key={doc.id_venda} hover>
                                        <TableCell>#{doc.id_venda}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                          {doc.numero_documento || '-'}
                                        </TableCell>
                                        <TableCell>
                                          <Chip 
                                            label={doc.tipo_documento} 
                                            size="small" 
                                            color="primary" 
                                            variant="outlined"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {doc.modelo_documento || '-'}
                                        </TableCell>
                                        <TableCell>
                                          {doc.data_documento 
                                            ? new Date(doc.data_documento).toLocaleDateString('pt-BR') 
                                            : '-'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                                          R$ {parseFloat(doc.valor_total).toFixed(2)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>

                              <Alert severity="success" sx={{ mt: 2, fontSize: '0.85rem' }}>
                                ✅ <strong>Total de documentos faturados:</strong> {venda.documentos_origem.length} documento(s)
                              </Alert>
                            </Paper>
                          </Grid>
                        )}

                        {/* Produtos da venda */}
                        {venda.itens && venda.itens.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                              Produtos
                            </Typography>
                            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                              <Table size="small" stickyHeader>
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Código</TableCell>
                                    <TableCell>Produto</TableCell>
                                    <TableCell align="right">Qtd</TableCell>
                                    <TableCell align="right">Unit.</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {venda.itens.map((item, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{item.codigo || '-'}</TableCell>
                                      <TableCell>{item.produto}</TableCell>
                                      <TableCell align="right">{parseFloat(item.quantidade).toFixed(3)}</TableCell>
                                      <TableCell align="right">R$ {parseFloat(item.valor_unitario).toFixed(2)}</TableCell>
                                      <TableCell align="right">R$ {parseFloat(item.valor_total).toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog de Configuração */}
      <Dialog 
        open={configDialogOpen} 
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          ⚙️ Configurar Faturamento
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Configure a operação e o cliente final para as {vendasSelecionadas.length} venda(s) selecionada(s).
            </Alert>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Operação de Faturamento *</InputLabel>
              <Select
                value={operacaoSelecionada}
                onChange={(e) => {
                  console.log('🔄 [CONFIG] Trocando operação de', operacaoSelecionada, 'para', e.target.value);
                  const novaOp = operacoes.find(op => op.id_operacao === parseInt(e.target.value));
                  console.log('📝 [CONFIG] Operação selecionada:', novaOp);
                  setOperacaoSelecionada(e.target.value);
                }}
                label="Operação de Faturamento *"
              >
                {operacoes.length === 0 ? (
                  <MenuItem value="" disabled>
                    Nenhuma operação de faturamento configurada
                  </MenuItem>
                ) : (
                  operacoes.map((op) => {
                    const tipoLabel = {
                      'pedido_para_nota': '📦→📝 Pedido → NF-e',
                      'pedido_para_cupom': '📦→🧾 Pedido → NFC-e',
                      'cupom_para_nota': '🧾→📝 Cupom → NF-e',
                    }[op.tipo_faturamento] || (op.modelo_documento === '55' ? '📝 NF-e' : '🧾 NFC-e');
                    
                    return (
                      <MenuItem key={op.id_operacao} value={op.id_operacao}>
                        {op.nome_operacao} — {tipoLabel}
                        {op.validar_estoque_fiscal && ' 🔍'}
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </FormControl>

            {operacaoSelecionada && (() => {
              const op = operacoes.find(o => o.id_operacao === parseInt(operacaoSelecionada));
              const vendasParaConverter = vendas.filter(v => vendasSelecionadas.includes(v.id_venda));
              const temCupons = vendasParaConverter.some(v => v.e_cupom);
              const temPedidos = vendasParaConverter.some(v => v.e_pedido);
              
              // Validação baseada no tipo_faturamento
              let incompativel = false;
              let motivoErro = '';
              if (op?.tipo_faturamento === 'cupom_para_nota' && temPedidos) {
                incompativel = true;
                motivoErro = 'Esta operação aceita apenas cupons fiscais, mas há pedidos selecionados.';
              } else if (op?.tipo_faturamento === 'pedido_para_nota' && temCupons) {
                incompativel = true;
                motivoErro = 'Esta operação aceita apenas pedidos, mas há cupons fiscais selecionados.';
              } else if (op?.tipo_faturamento === 'pedido_para_cupom' && temCupons) {
                incompativel = true;
                motivoErro = 'Esta operação aceita apenas pedidos, mas há cupons fiscais selecionados.';
              }
              
              const tipoDesc = {
                'pedido_para_nota': { origem: 'Pedidos', destino: 'NF-e (Nota Fiscal)', cfop: 'CFOP da operação/produto' },
                'pedido_para_cupom': { origem: 'Pedidos', destino: 'NFC-e (Cupom Fiscal)', cfop: 'CFOP da operação/produto' },
                'cupom_para_nota': { origem: 'Cupons Fiscais (NFC-e/SAT)', destino: 'NF-e (Nota Fiscal)', cfop: 'CFOP 5929 + NFref' },
              }[op?.tipo_faturamento];

              return (
                <Alert severity={incompativel ? 'error' : 'info'} sx={{ mb: 2 }}>
                  {tipoDesc ? (
                    <>
                      <Typography variant="body2">
                        <strong>Fluxo:</strong> {tipoDesc.origem} → {tipoDesc.destino}
                      </Typography>
                      <Typography variant="body2">
                        <strong>CFOP:</strong> {tipoDesc.cfop}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Aceita:</strong> {getOrigensAceitas()}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2">
                      ⚠️ Tipo de faturamento não configurado na operação. Configure em Operações Fiscais.
                    </Typography>
                  )}
                  {incompativel && (
                    <Typography variant="body2" color="error" sx={{ mt: 0.5, fontWeight: 'bold' }}>
                      ❌ {motivoErro}
                    </Typography>
                  )}
                </Alert>
              );
            })()}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Cliente Final</InputLabel>
              <Select
                value={clienteSelecionado}
                onChange={(e) => setClienteSelecionado(e.target.value)}
                label="Cliente Final"
              >
                <MenuItem value="">
                  <em>Manter cliente original</em>
                </MenuItem>
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                    {cliente.nome_razao_social || cliente.nome} 
                    {cliente.cpf_cnpj && ` - ${cliente.cpf_cnpj}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {clienteSelecionado && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  ✓ Cliente da venda selecionado automaticamente. Você pode alterá-lo se necessário.
                </Typography>
              </Alert>
            )}

            <TextField
              fullWidth
              label="Buscar cliente"
              placeholder="Digite o nome ou CPF/CNPJ..."
              value={searchCliente}
              onChange={(e) => {
                setSearchCliente(e.target.value);
                carregarClientes(e.target.value);
              }}
              sx={{ mb: 2 }}
              size="small"
            />

            {operacoes.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Nenhuma operação de faturamento configurada. 
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Acesse <strong>Configurações → Operações Fiscais</strong> e marque uma operação como "Operação de Faturamento".
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={prosseguirParaConversao}
            disabled={!operacaoSelecionada || verificarIncompatibilidade()}
            startIcon={<PlayArrowIcon />}
          >
            Prosseguir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Conversão */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => !processando && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          📄 Faturar → {getDestinoLabel()}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>{getTipoFaturamentoDescricao()}</strong>
              </Typography>
              <Typography variant="body2">
                Você está prestes a faturar {vendasSelecionadas.length} venda(s) em {getDestinoLabel()}.
              </Typography>
            </Alert>

            {verificarIncompatibilidade() && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  ❌ Operação incompatível com as vendas selecionadas.
                </Typography>
                <Typography variant="body2">
                  {getOrigensAceitas()} — Troque a operação ou volte e selecione vendas compatíveis.
                </Typography>
              </Alert>
            )}

            {(() => {
              const vendasParaConverter = vendas.filter(v => vendasSelecionadas.includes(v.id_venda));
              const clientesIds = [...new Set(vendasParaConverter.map(v => v.id_cliente))];
              return clientesIds.length > 1 && !clienteSelecionado && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    ⚠️ As vendas são de {clientesIds.length} clientes diferentes.
                  </Typography>
                  <Typography variant="body2">
                    Selecione um cliente final abaixo antes de continuar.
                  </Typography>
                </Alert>
              );
            })()}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Operação de Faturamento</InputLabel>
              <Select
                value={operacaoSelecionada}
                onChange={(e) => {
                  console.log('🔄 Trocando operação de', operacaoSelecionada, 'para', e.target.value);
                  const novaOp = operacoes.find(op => op.id_operacao === parseInt(e.target.value));
                  console.log('📝 Operação selecionada:', novaOp);
                  setOperacaoSelecionada(e.target.value);
                }}
                label="Operação de Faturamento"
                disabled={processando}
              >
                {operacoes.map((op) => {
                    const tipoLabel = {
                      'pedido_para_nota': '📦→📝 Pedido → NF-e',
                      'pedido_para_cupom': '📦→🧾 Pedido → NFC-e',
                      'cupom_para_nota': '🧾→📝 Cupom → NF-e',
                    }[op.tipo_faturamento] || (op.modelo_documento === '55' ? '📝 NF-e' : '🧾 NFC-e');
                    return (
                      <MenuItem key={op.id_operacao} value={op.id_operacao}>
                        {op.nome_operacao} — {tipoLabel}
                        {op.validar_estoque_fiscal && ' 🔍'}
                      </MenuItem>
                    );
                  })}
              </Select>
            </FormControl>

              <FormControlLabel
              control={
                <Checkbox
                  checked={emitirAuto}
                  onChange={(e) => setEmitirAuto(e.target.checked)}
                  disabled={processando}
                />
              }
              label={`Emitir ${getDestinoLabel()} automaticamente após faturamento`}
            />

            {validacaoEstoque && (
              <Alert severity={validacaoEstoque.sucesso ? 'success' : 'error'} sx={{ mt: 2 }}>
                <Typography variant="subtitle2">
                  Validação de Estoque:
                </Typography>
                {validacaoEstoque.avisos?.map((aviso, idx) => (
                  <Typography key={idx} variant="body2">
                    • {aviso}
                  </Typography>
                ))}
                {validacaoEstoque.mensagem && (
                  <Typography variant="body2">
                    {validacaoEstoque.mensagem}
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={processando}>
            Cancelar
          </Button>
          <Button
            onClick={confirmarConversao}
            variant="contained"
            color="primary"
            disabled={processando || !operacaoSelecionada || verificarIncompatibilidade() || faltaClienteFinal()}
            startIcon={processando && <CircularProgress size={20} />}
          >
            {processando ? 'Faturando...' : `Faturar ${getDestinoLabel()}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Divergências de Estoque */}
      <Dialog 
        open={divergenciasDialogOpen} 
        onClose={() => setDivergenciasDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          ⚠️ Divergências de Estoque Fiscal
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                {validacaoEstoque?.mensagem}
              </Typography>
              <Typography variant="body2">
                Os produtos abaixo não possuem estoque fiscal suficiente. Você pode:
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '24px' }}>
                <li>Ajustar a quantidade para o disponível</li>
                <li>Trocar por outro produto</li>
                <li>Excluir o item da conversão</li>
              </ul>
            </Alert>

            {validacaoEstoque?.divergencias && validacaoEstoque.divergencias.length > 0 && (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Produto</strong></TableCell>
                      <TableCell align="center"><strong>Código</strong></TableCell>
                      <TableCell align="right"><strong>Qtd Pedida</strong></TableCell>
                      <TableCell align="right"><strong>Estoque</strong></TableCell>
                      <TableCell align="right"><strong>Diferença</strong></TableCell>
                      <TableCell><strong>Depósito</strong></TableCell>
                      <TableCell align="center"><strong>Ações</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {validacaoEstoque.divergencias.map((div, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{div.produto_nome}</TableCell>
                        <TableCell align="center">
                          <Chip label={div.codigo_produto} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Typography color="error" fontWeight="bold">
                            {div.quantidade_pedida}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography color="success.main">
                            {div.saldo_fiscal}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={div.diferenca} 
                            color="error" 
                            size="small"
                            icon={<ErrorIcon />}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {div.deposito_nome}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {div.saldo_fiscal > 0 && (
                              <Tooltip title={`Ajustar quantidade para ${div.saldo_fiscal}`}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => ajustarQuantidade(div)}
                                >
                                  Ajustar
                                </Button>
                              </Tooltip>
                            )}
                            <Tooltip title="Trocar por outro produto">
                              <Button
                                size="small"
                                variant="outlined"
                                color="info"
                                onClick={() => abrirDialogoTroca(div)}
                              >
                                Trocar
                              </Button>
                            </Tooltip>
                            <Tooltip title="Excluir item da conversão">
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => excluirItem(div)}
                              >
                                Excluir
                              </Button>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                💡 <strong>Dica:</strong> Após ajustar os itens, clique em "Validar Novamente" para verificar se ainda há divergências.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDivergenciasDialogOpen(false)}>
            Cancelar Conversão
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              setDivergenciasDialogOpen(false);
              confirmarConversao(); // Revalidar
            }}
          >
            Validar Novamente
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={validacaoEstoque?.divergencias?.length > 0}
            onClick={() => {
              setDivergenciasDialogOpen(false);
              confirmarConversao(); // Prosseguir com conversão
            }}
          >
            Prosseguir Mesmo Assim
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Troca de Produto */}
      <Dialog 
        open={trocarDialogOpen} 
        onClose={() => setTrocarDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          🔄 Trocar Produto
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {divergenciaSelecionada && (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Produto Original:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Cód: {divergenciaSelecionada.codigo_produto}</strong> — {divergenciaSelecionada.produto_nome}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Quantidade Pedida: <strong>{divergenciaSelecionada.quantidade_pedida}</strong> | 
                    Estoque Disponível: <strong style={{ color: divergenciaSelecionada.saldo_fiscal < divergenciaSelecionada.quantidade_pedida ? '#d32f2f' : '#2e7d32' }}>
                      {divergenciaSelecionada.saldo_fiscal}
                    </strong>
                  </Typography>
                </Alert>

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Selecione o produto substituto:
                </Typography>

                <TextField
                  fullWidth
                  label="Pesquisar produto"
                  placeholder="Digite o nome, código ou código de barras..."
                  value={searchProduto}
                  onChange={(e) => {
                    setSearchProduto(e.target.value);
                    carregarProdutos(e.target.value);
                  }}
                  size="small"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: loadingProdutos && <CircularProgress size={20} />
                  }}
                />

                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 350, mb: 2 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: '50px' }}></TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '100px' }}>Código</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Produto</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '80px' }}>Unidade</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '100px', textAlign: 'right' }}>Estoque</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '110px', textAlign: 'right' }}>Preço</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {produtos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                              {loadingProdutos ? 'Buscando produtos...' : 'Nenhum produto encontrado. Refine a pesquisa.'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        produtos.map((prod) => {
                          const estoqueTotal = prod.estoque_total != null ? parseFloat(prod.estoque_total) : null;
                          const isSelected = produtoSubstituto === prod.id_produto;
                          return (
                            <TableRow 
                              key={prod.id_produto} 
                              hover
                              selected={isSelected}
                              onClick={() => setProdutoSubstituto(prod.id_produto)}
                              sx={{ 
                                cursor: 'pointer',
                                '&.Mui-selected': { backgroundColor: '#e3f2fd' },
                                '&.Mui-selected:hover': { backgroundColor: '#bbdefb' }
                              }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox 
                                  checked={isSelected} 
                                  size="small"
                                  onChange={() => setProdutoSubstituto(isSelected ? '' : prod.id_produto)}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {prod.codigo_produto || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{prod.nome_produto}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {prod.unidade_medida || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={estoqueTotal != null ? estoqueTotal.toFixed(2) : '—'}
                                  size="small"
                                  color={estoqueTotal > 0 ? 'success' : 'error'}
                                  variant="outlined"
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">
                                  {prod.valor_venda ? `R$ ${parseFloat(prod.valor_venda).toFixed(2)}` : '—'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {produtoSubstituto && (() => {
                  const prodSel = produtos.find(p => p.id_produto === produtoSubstituto);
                  const estoqueTotal = prodSel?.estoque_total != null ? parseFloat(prodSel.estoque_total) : null;
                  return (
                    <Alert severity="success" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        ✓ Selecionado: <strong>Cód: {prodSel?.codigo_produto || '—'}</strong> — {prodSel?.nome_produto}
                        {estoqueTotal != null && <> | Estoque: <strong>{estoqueTotal.toFixed(2)}</strong></>}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        A quantidade será mantida ({divergenciaSelecionada.quantidade_pedida} unidades).
                      </Typography>
                    </Alert>
                  );
                })()}

                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    ⚠️ <strong>Atenção:</strong> Certifique-se de que o produto substituto possui:
                  </Typography>
                  <ul style={{ margin: '4px 0', paddingLeft: '24px' }}>
                    <li>Estoque suficiente no depósito de origem</li>
                    <li>Mesma unidade de medida</li>
                    <li>Tributação compatível</li>
                  </ul>
                </Alert>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrocarDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={confirmarTrocaProduto}
            disabled={!produtoSubstituto || loadingProdutos}
            startIcon={loadingProdutos && <CircularProgress size={20} />}
          >
            Confirmar Troca
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FaturamentoPage;
