import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, Table, TableBody, TableCell, TableHead, TableRow, IconButton,
  Tooltip, Alert, Tabs, Tab, Badge, Stack, Divider, Radio, RadioGroup,
  FormControlLabel, FormLabel, CircularProgress, Autocomplete, Avatar, ListItem,
  ListItemAvatar, ListItemText
} from '@mui/material';
import {
  TableRestaurant as MesaIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as TransferirIcon,
  Receipt as ComandaIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Restaurant as RestauranteIcon,
  AttachMoney as DinheiroIcon,
  Print as PrintIcon,
  PeopleAlt as PessoasIcon,
  Discount as DescontoIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Send as SendIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINT } from '../config/api';

const ComandasPage = () => {
  const [mesas, setMesas] = useState([]);
  const [comandas, setComandas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);  // NOVO: Formas de pagamento do banco
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Estados dos diálogos
  const [mesaDialog, setMesaDialog] = useState(false);
  const [comandaDialog, setComandaDialog] = useState(false);
  const [itemDialog, setItemDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [pagamentoDialog, setPagamentoDialog] = useState(false);  // NOVO: Diálogo de pagamento
  const [cozinhaDialog, setCozinhaDialog] = useState(false);      // NOVO: Enviar para cozinha

  // Formulários
  const [mesaForm, setMesaForm] = useState({
    numero: '', capacidade: 4, localizacao: '', status: 'Livre', ativa: true
  });

  const [comandaForm, setComandaForm] = useState({
    numero: '', mesa: '', cliente: '', taxa_servico: 0, desconto: 0
  });

  // Estados para busca de cliente
  const [buscarClienteDialog, setBuscarClienteDialog] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const [listaClientes, setListaClientes] = useState([]);
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);

  const [itemForm, setItemForm] = useState({
    produto: '', quantidade: 1, observacoes: ''
  });
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [buscaProduto, setBuscaProduto] = useState('');

  const [comandaSelecionada, setComandaSelecionada] = useState(null);
  const [mesaSelecionada, setMesaSelecionada] = useState(null);

  // Novos estados para funcionalidades adicionais
  const [resumoDialog, setResumoDialog] = useState(false);
  const [divisaoDialog, setDivisaoDialog] = useState(false);
  const [numeroPessoas, setNumeroPessoas] = useState(1);
  const [descontoDialog, setDescontoDialog] = useState(false);
  const [valorDesconto, setValorDesconto] = useState(0);
  const [tipoDesconto, setTipoDesconto] = useState('percentual'); // percentual ou valor
  const [buscarMesa, setBuscarMesa] = useState('');

  // NOVO: Estados para pagamento
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
  const [valorPago, setValorPago] = useState(0);
  const [itensPendentes, setItensPendentes] = useState([]);  // Itens para enviar à cozinha

  // Estados para múltiplas formas de pagamento
  const [pagamentos, setPagamentos] = useState([]);
  const [formaPagamentoAtual, setFormaPagamentoAtual] = useState('Dinheiro');
  const [valorPagamentoAtual, setValorPagamentoAtual] = useState(0);

  // NOVO: Estados para fechamento de caixa
  const [fechamentoCaixa, setFechamentoCaixa] = useState(null);
  const [dataFechamento, setDataFechamento] = useState(new Date().toISOString().split('T')[0]);
  const [loadingFechamento, setLoadingFechamento] = useState(false);

  const getToken = () => {
    return sessionStorage.getItem('accessToken') || sessionStorage.getItem('token');
  };

  const axiosInstance = axios.create({
    baseURL: API_ENDPOINT,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`
    }
  });

  const { user, permissions, isLoading: authLoading } = useAuth();

  // Buscar cliente CONSUMIDOR padrão
  const [clienteConsumidor, setClienteConsumidor] = useState(null);

  const buscarClienteConsumidor = async () => {
    try {
      const response = await axiosInstance.get('/clientes/', {
        params: { search: 'CONSUMIDOR' }
      });

      if (response.data && response.data.length > 0) {
        // Procura exatamente "CONSUMIDOR"
        const consumidor = response.data.find(c =>
          c.nome_razao_social?.toUpperCase() === 'CONSUMIDOR'
        );
        if (consumidor) {
          setClienteConsumidor(consumidor);
          console.log('✅ Cliente CONSUMIDOR encontrado:', consumidor.id_cliente);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar cliente CONSUMIDOR:', error);
    }
  };

  useEffect(() => {
    fetchMesas();
    fetchComandas();
    fetchProdutos();
    fetchFormasPagamento();  // NOVO: Carregar formas de pagamento
    buscarClienteConsumidor();
  }, []);

  useEffect(() => {
    if (tabValue === 3) {
      fetchFechamentoCaixa();
    }
  }, [tabValue, dataFechamento]);

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user?.is_staff && !permissions?.comandas_acessar) {
    return (
      <Box p={3}>
        <Alert severity="warning">Você não tem permissão para acessar Comandas.</Alert>
      </Box>
    );
  }

  const fetchMesas = async () => {
    try {
      const response = await axiosInstance.get('/comandas/mesas/');
      setMesas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar mesas:', error);
      setMesas([]);
    }
  };

  const fetchComandas = async () => {
    try {
      const response = await axiosInstance.get('/comandas/comandas/');
      setComandas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar comandas:', error);
      setComandas([]);
    }
  };

  const fetchProdutos = async () => {
    try {
      const response = await axiosInstance.get('/produtos/');
      console.log('🔍 Produtos retornados:', response.data);
      console.log('🔍 Primeiro produto:', response.data[0]);

      // DEBUG: Mostrar alerta com primeiro produto
      if (response.data && response.data.length > 0) {
        const primeiro = response.data[0];
        console.log('DEBUG - Primeiro produto completo:', JSON.stringify(primeiro, null, 2));
        console.log('DEBUG - valor_venda:', primeiro.valor_venda);
      }

      setProdutos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProdutos([]);
    }
  };

  const fetchFormasPagamento = async () => {
    try {
      const response = await axiosInstance.get('/formas-pagamento/');
      console.log('💳 Formas de pagamento do banco:', response.data);
      setFormasPagamento(Array.isArray(response.data) ? response.data : []);
      
      // Definir a primeira forma como padrão se existir
      if (response.data && response.data.length > 0) {
        setFormaPagamentoAtual(response.data[0].nome_forma);
      }
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento:', error);
      setFormasPagamento([]);
    }
  };

  const fetchFechamentoCaixa = async () => {
    try {
      setLoadingFechamento(true);
      const response = await axiosInstance.get(`/comandas/comandas/fechamento_caixa/?data=${dataFechamento}`);
      setFechamentoCaixa(response.data);
    } catch (error) {
      console.error('Erro ao buscar fechamento de caixa:', error);
      setFechamentoCaixa(null);
    } finally {
      setLoadingFechamento(false);
    }
  };

  const handleSaveMesa = async () => {
    try {
      setLoading(true);

      // Validação básica
      if (!mesaForm.numero || mesaForm.numero.trim() === '') {
        alert('Por favor, informe o número da mesa');
        setLoading(false);
        return;
      }

      if (!mesaForm.capacidade || mesaForm.capacidade < 1) {
        alert('Por favor, informe a capacidade da mesa (mínimo 1)');
        setLoading(false);
        return;
      }

      const dadosMesa = {
        numero: String(mesaForm.numero).trim(),
        capacidade: parseInt(mesaForm.capacidade),
        localizacao: mesaForm.localizacao || '',
        status: mesaForm.status || 'Livre',
        ativa: mesaForm.ativa !== false
      };

      if (mesaSelecionada) {
        await axiosInstance.put(`/comandas/mesas/${mesaSelecionada.id}/`, dadosMesa);
      } else {
        await axiosInstance.post('/comandas/mesas/', dadosMesa);
      }
      fetchMesas();
      setMesaDialog(false);
      resetMesaForm();
    } catch (error) {
      console.error('Erro ao salvar mesa:', error);
      console.error('Dados enviados:', dadosMesa);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);

      if (error.response?.data) {
        const erros = Object.entries(error.response.data)
          .map(([campo, msgs]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('\n');
        alert(`Erro ao salvar mesa:\n${erros}`);
      } else {
        alert('Erro ao salvar mesa. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirComanda = async () => {
    try {
      setLoading(true);

      // Preparar dados da comanda
      let dadosComanda = { ...comandaForm };

      // Gera número automático se não informado
      if (!dadosComanda.numero || dadosComanda.numero === '') {
        // Buscar a última comanda (aberta ou fechada) para gerar próximo número
        try {
          const todasComandas = await axiosInstance.get('/comandas/comandas/');
          const comandasOrdenadas = todasComandas.data.sort((a, b) => {
            const numA = parseInt(a.numero) || 0;
            const numB = parseInt(b.numero) || 0;
            return numB - numA;
          });

          const ultimaComanda = comandasOrdenadas[0];
          const proximoNumero = ultimaComanda
            ? String(parseInt(ultimaComanda.numero) + 1).padStart(6, '0')
            : '000001';
          dadosComanda.numero = proximoNumero;

          console.log('Última comanda:', ultimaComanda?.numero);
          console.log('Próximo número gerado:', proximoNumero);
        } catch (err) {
          console.error('Erro ao buscar comandas:', err);
          // Fallback: usar timestamp
          dadosComanda.numero = String(Date.now()).slice(-6);
        }
      }

      // Remove campos vazios (ForeignKeys devem ser null, não string vazia)
      if (!dadosComanda.cliente || dadosComanda.cliente === '') {
        delete dadosComanda.cliente;
      }
      if (!dadosComanda.garcom || dadosComanda.garcom === '') {
        delete dadosComanda.garcom;
      }

      console.log('Abrindo comanda:', dadosComanda);

      const response = await axiosInstance.post('/comandas/comandas/', dadosComanda);
      fetchComandas();
      fetchMesas(); // Atualiza status das mesas
      setComandaDialog(false);
      setComandaSelecionada(response.data);
      setItemDialog(true); // Abre diálogo para adicionar itens
      resetComandaForm();
    } catch (error) {
      console.error('Erro ao abrir comanda:', error);
      console.error('Detalhes do erro:', error.response?.data);
      console.error('Erro completo:', JSON.stringify(error.response?.data, null, 2));
      console.error('Dados enviados:', comandaForm);

      // Mostrar mensagem mais clara
      const erroMsg = error.response?.data?.numero
        ? `Número de comanda já existe: ${error.response.data.numero.join(', ')}`
        : JSON.stringify(error.response?.data || error.message);

      alert(`Erro ao abrir comanda: ${erroMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarItem = async () => {
    try {
      setLoading(true);
      const produto = produtos.find(p => p.id_produto === itemForm.produto);

      const itemData = {
        comanda: comandaSelecionada.id,
        produto: itemForm.produto,
        quantidade: itemForm.quantidade,
        valor_unitario: produto.valor_venda,
        observacoes: itemForm.observacoes
      };

      await axiosInstance.post('/comandas/itens-comanda/', itemData);

      // Atualiza comanda
      const response = await axiosInstance.get(`/comandas/comandas/${comandaSelecionada.id}/`);
      setComandaSelecionada(response.data);
      fetchComandas();
      resetItemForm();
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFecharComanda = async (comanda) => {
    if (!window.confirm(`Fechar comanda ${comanda.numero}?\nTotal: R$ ${comanda.total}`)) {
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post(`/comandas/comandas/${comanda.id}/fechar/`);
      fetchComandas();
      fetchMesas();
      setComandaSelecionada(null);
      setProdutoSelecionado(null);
      setBuscaProduto('');
      setItemDialog(false);
    } catch (error) {
      console.error('Erro ao fechar comanda:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferirMesa = async () => {
    try {
      setLoading(true);
      await axiosInstance.post(`/comandas/comandas/${comandaSelecionada.id}/transferir_mesa/`, {
        nova_mesa_id: mesaSelecionada
      });
      fetchComandas();
      fetchMesas();
      setTransferDialog(false);
      setComandaSelecionada(null);
      setMesaSelecionada(null);
    } catch (error) {
      console.error('Erro ao transferir mesa:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetMesaForm = () => {
    setMesaForm({ numero: '', capacidade: 4, localizacao: '', status: 'Livre', ativa: true });
    setMesaSelecionada(null);
  };

  const resetComandaForm = () => {
    // Define CONSUMIDOR como cliente padrão
    const clientePadrao = clienteConsumidor ? clienteConsumidor.id_cliente : '';
    setComandaForm({ numero: '', mesa: '', cliente: clientePadrao, taxa_servico: 0, desconto: 0 });
    setClienteSelecionado(clienteConsumidor);
  };

  const resetItemForm = () => {
    setItemForm({ produto: '', quantidade: 1, observacoes: '' });
  };

  // Buscar cliente por CPF/CNPJ, ID ou Nome
  const handleBuscarCliente = async () => {
    if (!buscaCliente.trim()) {
      alert('Digite um CPF/CNPJ, ID ou Nome do cliente');
      return;
    }

    setLoadingCliente(true);
    try {
      const valorBusca = buscaCliente.trim();
      const valorNumerico = valorBusca.replace(/[^\d]/g, '');

      // Determina o tipo de busca
      let params = {};
      if (valorNumerico && valorNumerico.length > 5) {
        // CPF/CNPJ (tem números e é longo)
        params = { cpf_cnpj: valorNumerico };
      } else if (valorNumerico && valorNumerico === valorBusca) {
        // ID (apenas números)
        params = { id: valorNumerico };
      } else {
        // Nome (tem letras)
        params = { nome: valorBusca };
      }

      const response = await axiosInstance.get('/comandas/comandas/buscar_cliente/', { params });

      // Verifica se retornou múltiplos clientes
      if (response.data.multiplos) {
        setListaClientes(response.data.clientes);
        setMostrarListaClientes(true);
      } else {
        // Cliente único encontrado
        setClienteSelecionado(response.data);
        setComandaForm({ ...comandaForm, cliente: response.data.id_cliente });
        setBuscarClienteDialog(false);
        setBuscaCliente('');
        setMostrarListaClientes(false);
        setListaClientes([]);

        alert(`Cliente encontrado: ${response.data.nome_razao_social}`);
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      alert(error.response?.data?.error || 'Cliente não encontrado');
      setMostrarListaClientes(false);
      setListaClientes([]);
    } finally {
      setLoadingCliente(false);
    }
  };

  // Selecionar cliente da lista
  const handleSelecionarClienteDaLista = (cliente) => {
    setClienteSelecionado(cliente);
    setComandaForm({ ...comandaForm, cliente: cliente.id_cliente });
    setBuscarClienteDialog(false);
    setBuscaCliente('');
    setMostrarListaClientes(false);
    setListaClientes([]);
    alert(`Cliente selecionado: ${cliente.nome_razao_social}`);
  };

  const handleRemoverCliente = () => {
    // Volta para CONSUMIDOR como padrão
    const clientePadrao = clienteConsumidor ? clienteConsumidor.id_cliente : '';
    setClienteSelecionado(clienteConsumidor);
    setComandaForm({ ...comandaForm, cliente: clientePadrao });
  };

  // Vincular cliente a uma comanda já aberta
  const handleVincularClienteComanda = async (comandaId, clienteId) => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/comandas/comandas/${comandaId}/`, {
        cliente: clienteId
      });

      fetchComandas();
      setBuscarClienteDialog(false);
      setBuscaCliente('');
      setComandaSelecionada(null);
      alert('Cliente vinculado à comanda com sucesso!');
    } catch (error) {
      console.error('Erro ao vincular cliente:', error);
      alert('Erro ao vincular cliente à comanda');
    } finally {
      setLoading(false);
    }
  };

  // Remover cliente de uma comanda
  const handleRemoverClienteComanda = async (comandaId) => {
    if (!window.confirm('Deseja remover o cliente desta comanda?')) return;

    try {
      setLoading(true);
      await axiosInstance.patch(`/comandas/comandas/${comandaId}/`, {
        cliente: null
      });

      fetchComandas();
      alert('Cliente removido da comanda!');
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      alert('Erro ao remover cliente da comanda');
    } finally {
      setLoading(false);
    }
  };

  // Buscar cliente para vincular a comanda aberta
  const handleBuscarClienteParaComanda = async () => {
    if (!buscaCliente.trim()) {
      alert('Digite um CPF/CNPJ, ID ou Nome do cliente');
      return;
    }

    setLoadingCliente(true);
    try {
      const valorBusca = buscaCliente.trim();
      const valorNumerico = valorBusca.replace(/[^\d]/g, '');

      // Determina o tipo de busca
      let params = {};
      if (valorNumerico && valorNumerico.length > 5) {
        params = { cpf_cnpj: valorNumerico };
      } else if (valorNumerico && valorNumerico === valorBusca) {
        params = { id: valorNumerico };
      } else {
        params = { nome: valorBusca };
      }

      const response = await axiosInstance.get('/comandas/comandas/buscar_cliente/', { params });

      // Verifica se retornou múltiplos clientes
      if (response.data.multiplos) {
        setListaClientes(response.data.clientes);
        setMostrarListaClientes(true);
      } else {
        // Vincula automaticamente à comanda selecionada
        if (comandaSelecionada?.id) {
          await handleVincularClienteComanda(comandaSelecionada.id, response.data.id_cliente);
          setMostrarListaClientes(false);
          setListaClientes([]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      alert(error.response?.data?.error || 'Cliente não encontrado');
      setMostrarListaClientes(false);
      setListaClientes([]);
    } finally {
      setLoadingCliente(false);
    }
  };

  // Selecionar cliente da lista para vincular à comanda
  const handleSelecionarClienteParaComanda = async (cliente) => {
    if (comandaSelecionada?.id) {
      await handleVincularClienteComanda(comandaSelecionada.id, cliente.id_cliente);
      setMostrarListaClientes(false);
      setListaClientes([]);
      setBuscaCliente('');
    }
  };

  const handleCancelarItem = async (itemId) => {
    if (!window.confirm('Deseja realmente cancelar este item?')) return;

    try {
      setLoading(true);
      await axiosInstance.delete(`/comandas/itens-comanda/${itemId}/`);
      // Atualiza comanda
      const response = await axiosInstance.get(`/comandas/comandas/${comandaSelecionada.id}/`);
      setComandaSelecionada(response.data);
      fetchComandas();
    } catch (error) {
      console.error('Erro ao cancelar item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAplicarDesconto = async () => {
    try {
      setLoading(true);
      const descontoCalculado = tipoDesconto === 'percentual'
        ? (comandaSelecionada.subtotal * valorDesconto) / 100
        : valorDesconto;

      await axiosInstance.patch(`/comandas/comandas/${comandaSelecionada.id}/`, {
        desconto: descontoCalculado
      });

      const response = await axiosInstance.get(`/comandas/comandas/${comandaSelecionada.id}/`);
      setComandaSelecionada(response.data);
      fetchComandas();
      setDescontoDialog(false);
      setValorDesconto(0);
    } catch (error) {
      console.error('Erro ao aplicar desconto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAplicarTaxaServico = async () => {
    try {
      setLoading(true);
      const taxa = comandaSelecionada.subtotal * 0.10; // 10%

      await axiosInstance.patch(`/comandas/comandas/${comandaSelecionada.id}/`, {
        taxa_servico: taxa
      });

      const response = await axiosInstance.get(`/comandas/comandas/${comandaSelecionada.id}/`);
      setComandaSelecionada(response.data);
      fetchComandas();
    } catch (error) {
      console.error('Erro ao aplicar taxa de serviço:', error);
    } finally {
      setLoading(false);
    }
  };

  // NOVO: Enviar pedido para cozinha
  const handleEnviarCozinha = async () => {
    try {
      setLoading(true);

      // Buscar itens pendentes
      const itensPendentes = comandaSelecionada.itens?.filter(
        item => item.status === 'Pendente'
      ) || [];

      if (itensPendentes.length === 0) {
        alert('Não há itens pendentes para enviar à cozinha!');
        setLoading(false);
        return;
      }

      // Atualizar status dos itens para "Preparando"
      for (const item of itensPendentes) {
        await axiosInstance.patch(`/comandas/itens-comanda/${item.id}/`, {
          status: 'Preparando'
        });
      }

      // Imprimir pedido para cozinha
      imprimirPedidoCozinha(itensPendentes);

      // Atualizar comanda
      const response = await axiosInstance.get(`/comandas/comandas/${comandaSelecionada.id}/`);
      setComandaSelecionada(response.data);
      fetchComandas();

      alert(`${itensPendentes.length} item(ns) enviado(s) para a cozinha!`);
    } catch (error) {
      console.error('Erro ao enviar para cozinha:', error);
      alert('Erro ao enviar pedido para cozinha!');
    } finally {
      setLoading(false);
    }
  };

  // NOVO: Imprimir pedido para cozinha
  const imprimirPedidoCozinha = (itens) => {
    const conteudo = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido Cozinha - Comanda ${comandaSelecionada.numero}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10mm; }
          h1 { text-align: center; font-size: 20px; margin: 10px 0; }
          h2 { text-align: center; font-size: 16px; margin: 5px 0; background: #000; color: #fff; padding: 5px; }
          .info { font-size: 12px; margin: 5px 0; }
          .linha { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { padding: 5px; text-align: left; }
          .obs { font-style: italic; font-size: 11px; margin-left: 20px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h2>*** PEDIDO COZINHA ***</h2>
        <h1>COMANDA ${comandaSelecionada.numero}</h1>
        <div class="info">
          Mesa: ${comandaSelecionada.mesa_numero || '-'}<br>
          Data/Hora: ${new Date().toLocaleString('pt-BR')}<br>
          ${comandaSelecionada.garcom_nome ? `Garçom: ${comandaSelecionada.garcom_nome}<br>` : ''}
        </div>
        <div class="linha"></div>
        <table>
          <thead>
            <tr>
              <th>QTD</th>
              <th>ITEM</th>
            </tr>
          </thead>
          <tbody>
            ${itens.map(item => `
              <tr>
                <td><strong>${item.quantidade}</strong></td>
                <td><strong>${item.produto_nome}</strong></td>
              </tr>
              ${item.observacoes ? `<tr><td colspan="2" class="obs">→ ${item.observacoes}</td></tr>` : ''}
            `).join('')}
          </tbody>
        </table>
        <div class="linha"></div>
        <p style="text-align: center; margin-top: 20px;">
          <strong>Total de itens: ${itens.length}</strong>
        </p>
        <button onclick="window.print()" style="margin: 20px auto; display: block; padding: 10px 20px;">
          Imprimir
        </button>
      </body>
      </html>
    `;

    const janela = window.open('', '_blank', 'width=400,height=600');
    janela.document.write(conteudo);
    janela.document.close();
    janela.print();
  };

  // NOVO: Abrir diálogo de pagamento
  const abrirPagamento = (comanda) => {
    setComandaSelecionada(comanda);
    setPagamentos([]);
    // Sugere o valor total como primeira forma de pagamento
    setValorPagamentoAtual(parseFloat(comanda?.total || 0));
    setFormaPagamentoAtual('Dinheiro');
    setPagamentoDialog(true);
  };

  // NOVO: Adicionar forma de pagamento
  const handleAdicionarPagamento = () => {
    if (valorPagamentoAtual <= 0) {
      alert('Valor deve ser maior que zero!');
      return;
    }

    const novosPagamentos = [...pagamentos, {
      forma: formaPagamentoAtual,
      valor: parseFloat(valorPagamentoAtual)
    }];

    setPagamentos(novosPagamentos);

    // Calcula o valor restante e sugere para próximo pagamento
    const totalPago = novosPagamentos.reduce((sum, p) => sum + p.valor, 0);
    const totalConta = parseFloat(comandaSelecionada?.total || 0);
    const restante = Math.max(0, totalConta - totalPago);

    setValorPagamentoAtual(restante);
  };

  // NOVO: Remover forma de pagamento
  const handleRemoverPagamento = (index) => {
    setPagamentos(pagamentos.filter((_, i) => i !== index));
  };

  // NOVO: Fechar comanda com pagamento
  const handleFecharComPagamento = async () => {
    try {
      setLoading(true);

      const total = parseFloat(comandaSelecionada.total || 0);
      const totalPago = pagamentos.reduce((sum, p) => sum + p.valor, 0);

      // Validação: total pago deve ser EXATAMENTE igual ao total
      if (totalPago !== total) {
        const diferenca = totalPago - total;
        if (diferenca < 0) {
          alert(`Valor pago (R$ ${totalPago.toFixed(2)}) é menor que o total (R$ ${total.toFixed(2)})!\nFaltam: R$ ${Math.abs(diferenca).toFixed(2)}`);
        } else {
          alert(`Valor pago (R$ ${totalPago.toFixed(2)}) é maior que o total (R$ ${total.toFixed(2)})!\nExcedente: R$ ${diferenca.toFixed(2)}\n\nO total das formas de pagamento deve ser exatamente igual ao valor da conta.`);
        }
        setLoading(false);
        return;
      }

      const troco = 0; // Sempre 0 pois validamos que seja exato

      // Preparar descrição das formas de pagamento
      const formasPagamento = pagamentos.map(p => `${p.forma}: R$ ${p.valor.toFixed(2)}`).join(', ');

      console.log('💰 Fechando comanda:', {
        id: comandaSelecionada.id,
        formasPagamento,
        total,
        totalPago,
        comandaCompleta: comandaSelecionada
      });

      // Atualizar forma de pagamento antes de fechar
      try {
        const dadosPatch = {
          forma_pagamento: formasPagamento
        };

        console.log('📤 Enviando PATCH:', dadosPatch);

        const patchResponse = await axiosInstance.patch(`/comandas/comandas/${comandaSelecionada.id}/`, dadosPatch);

        console.log('✅ PATCH bem-sucedido:', patchResponse.data);
      } catch (patchError) {
        console.error('❌ Erro no patch:', {
          status: patchError.response?.status,
          statusText: patchError.response?.statusText,
          data: patchError.response?.data,
          headers: patchError.response?.headers
        });
        throw patchError;
      }

      // Fechar comanda com pagamentos
      try {
        console.log('📤 Enviando pagamentos para fechar:', pagamentos);
        const response = await axiosInstance.post(`/comandas/comandas/${comandaSelecionada.id}/fechar/`, {
          pagamentos: pagamentos
        });
        console.log('✅ Resposta do fechamento:', response.data);
      } catch (fecharError) {
        console.error('❌ Erro ao fechar:', fecharError.response?.data);
        throw fecharError;
      }

      // Imprimir comprovante
      imprimirComprovantePagamento(troco, pagamentos);

      fetchComandas();
      fetchMesas();
      setPagamentoDialog(false);
      setItemDialog(false);
      setResumoDialog(false);
      setComandaSelecionada(null);
      setProdutoSelecionado(null);
      setBuscaProduto('');
      setPagamentos([]);
      setValorPagamentoAtual(0);

      alert(`Comanda fechada!\n${troco > 0 ? `Troco: R$ ${troco.toFixed(2)}` : 'Pagamento exato'}`);
    } catch (error) {
      console.error('Erro ao fechar comanda:', error);
      console.error('Detalhes do erro:', error.response?.data);

      const mensagemErro = error.response?.data?.detail
        || error.response?.data?.message
        || error.response?.data?.error
        || 'Erro desconhecido ao fechar comanda!';

      alert(`Erro ao fechar comanda:\n${mensagemErro}`);
    } finally {
      setLoading(false);
    }
  };

  // NOVO: Imprimir comprovante de pagamento
  const imprimirComprovantePagamento = (troco, formasPagamento) => {
    const total = parseFloat(comandaSelecionada.total || 0);
    const totalPago = formasPagamento.reduce((sum, p) => sum + p.valor, 0);

    const conteudo = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante - Comanda ${comandaSelecionada.numero}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10mm; }
          h1 { text-align: center; font-size: 18px; margin: 10px 0; }
          .info { font-size: 12px; margin: 5px 0; }
          .linha { border-top: 1px dashed #000; margin: 10px 0; }
          .total { font-size: 14px; font-weight: bold; }
          .troco { font-size: 16px; font-weight: bold; text-align: center; background: #000; color: #fff; padding: 10px; margin: 10px 0; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>COMPROVANTE DE PAGAMENTO</h1>
        <div class="info">
          Comanda: ${comandaSelecionada.numero}<br>
          Mesa: ${comandaSelecionada.mesa_numero || '-'}<br>
          Data: ${new Date().toLocaleString('pt-BR')}
        </div>
        <div class="linha"></div>
        <div class="total">
          Subtotal: R$ ${parseFloat(comandaSelecionada.subtotal || 0).toFixed(2)}<br>
          ${parseFloat(comandaSelecionada.desconto || 0) > 0 ? `Desconto: R$ ${parseFloat(comandaSelecionada.desconto).toFixed(2)}<br>` : ''}
          ${parseFloat(comandaSelecionada.taxa_servico || 0) > 0 ? `Taxa (10%): R$ ${parseFloat(comandaSelecionada.taxa_servico).toFixed(2)}<br>` : ''}
          <div class="linha"></div>
          TOTAL: R$ ${total.toFixed(2)}<br>
        </div>
        <div class="linha"></div>
        <div class="info">
          <strong>FORMAS DE PAGAMENTO:</strong><br>
          ${formasPagamento.map(p => `${p.forma}: R$ ${p.valor.toFixed(2)}`).join('<br>')}
          <div class="linha"></div>
          <strong>Total Pago: R$ ${totalPago.toFixed(2)}</strong>
        </div>
        ${troco > 0 ? `<div class="troco">TROCO: R$ ${troco.toFixed(2)}</div>` : '<div class="troco">PAGAMENTO EXATO</div>'}
        <p style="text-align: center; font-size: 10px; margin-top: 20px;">
          Obrigado e volte sempre!
        </p>
        <button onclick="window.print()" style="margin: 20px auto; display: block; padding: 10px 20px;">
          Imprimir
        </button>
      </body>
      </html>
    `;

    const janela = window.open('', '_blank');
    janela.document.write(conteudo);
    janela.document.close();
    janela.print();
  };

  const calcularDivisaoConta = () => {
    if (!comandaSelecionada || numeroPessoas <= 0) return 0;
    return parseFloat(comandaSelecionada.total || 0) / numeroPessoas;
  };

  const imprimirComanda = () => {
    if (!comandaSelecionada) return;

    const conteudo = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comanda ${comandaSelecionada.numero}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; }
          h1 { text-align: center; font-size: 18px; margin: 10px 0; }
          .info { margin: 10px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { text-align: left; padding: 5px; font-size: 11px; }
          .total { font-size: 14px; font-weight: bold; margin-top: 10px; }
          .linha { border-top: 1px dashed #000; margin: 10px 0; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>COMANDA ${comandaSelecionada.numero}</h1>
        <div class="info">
          Mesa: ${comandaSelecionada.mesa_numero || '-'}<br>
          Data: ${new Date(comandaSelecionada.data_abertura).toLocaleString('pt-BR')}<br>
          ${comandaSelecionada.cliente_nome ? `Cliente: ${comandaSelecionada.cliente_nome}<br>` : ''}
          ${comandaSelecionada.garcom_nome ? `Garçom: ${comandaSelecionada.garcom_nome}<br>` : ''}
        </div>
        <div class="linha"></div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qtd</th>
              <th>Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${comandaSelecionada.itens?.map(item => `
              <tr>
                <td>${item.produto_nome}</td>
                <td>${item.quantidade}</td>
                <td>R$ ${parseFloat(item.valor_unitario).toFixed(2)}</td>
                <td>R$ ${parseFloat(item.subtotal).toFixed(2)}</td>
              </tr>
              ${item.observacoes ? `<tr><td colspan="4" style="font-size: 10px; font-style: italic;">Obs: ${item.observacoes}</td></tr>` : ''}
            `).join('')}
          </tbody>
        </table>
        <div class="linha"></div>
        <div class="total">
          Subtotal: R$ ${parseFloat(comandaSelecionada.subtotal || 0).toFixed(2)}<br>
          ${parseFloat(comandaSelecionada.desconto || 0) > 0 ? `Desconto: R$ ${parseFloat(comandaSelecionada.desconto).toFixed(2)}<br>` : ''}
          ${parseFloat(comandaSelecionada.taxa_servico || 0) > 0 ? `Taxa Serviço (10%): R$ ${parseFloat(comandaSelecionada.taxa_servico).toFixed(2)}<br>` : ''}
          <div class="linha"></div>
          TOTAL: R$ ${parseFloat(comandaSelecionada.total || 0).toFixed(2)}
        </div>
        ${comandaSelecionada.formas_pagamento && comandaSelecionada.formas_pagamento.length > 0 ? `
        <div class="linha"></div>
        <div class="info">
          <strong>FORMAS DE PAGAMENTO:</strong><br>
          ${comandaSelecionada.formas_pagamento.map(p => `${p.forma_pagamento || p.forma}: R$ ${parseFloat(p.valor).toFixed(2)}`).join('<br>')}
        </div>
        ` : ''}
        <div class="linha"></div>
        <p style="text-align: center; font-size: 10px; margin-top: 20px;">
          Obrigado pela preferência!
        </p>
        <button onclick="window.print()" style="margin: 20px auto; display: block; padding: 10px 20px;">
          Imprimir
        </button>
      </body>
      </html>
    `;

    const janela = window.open('', '_blank');
    janela.document.write(conteudo);
    janela.document.close();
  };

  const imprimirFechamentoCaixa = () => {
    if (!fechamentoCaixa) return;

    const conteudo = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fechamento de Caixa - ${fechamentoCaixa.data_formatada}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            width: 72mm; 
            margin: 0 auto; 
            padding: 5mm;
            font-size: 11px;
          }
          h1 { 
            text-align: center; 
            font-size: 14px; 
            margin: 5px 0;
            font-weight: bold;
            border-bottom: 2px solid #000;
            padding-bottom: 3px;
          }
          .empresa { 
            text-align: center; 
            font-size: 12px; 
            margin: 5px 0;
            font-weight: bold;
          }
          .data { 
            text-align: center; 
            font-size: 11px; 
            margin: 8px 0;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
          }
          .linha { 
            border-top: 1px dashed #000; 
            margin: 8px 0; 
          }
          .linha-dupla { 
            border-top: 2px solid #000; 
            margin: 8px 0; 
          }
          .secao { 
            margin: 8px 0; 
          }
          .secao-titulo { 
            font-size: 11px; 
            font-weight: bold;
            margin: 8px 0 5px 0;
            text-align: center;
            background-color: #000;
            color: #fff;
            padding: 3px;
          }
          .item-linha {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            font-size: 10px;
          }
          .item-linha.destaque {
            font-weight: bold;
            font-size: 11px;
            margin-top: 3px;
          }
          .item-3col {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            font-size: 10px;
          }
          .item-3col > span:first-child {
            flex: 2;
            text-align: left;
          }
          .item-3col > span:nth-child(2) {
            flex: 1;
            text-align: center;
          }
          .item-3col > span:last-child {
            flex: 1;
            text-align: right;
          }
          .total-geral { 
            font-size: 13px; 
            font-weight: bold; 
            text-align: center;
            margin: 10px 0;
            padding: 8px;
            background-color: #000;
            color: #fff;
          }
          .alerta {
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            margin: 8px 0;
            padding: 5px;
            border: 1px solid #000;
          }
          .rodape {
            text-align: center;
            font-size: 9px;
            margin-top: 10px;
            padding-top: 5px;
            border-top: 1px dashed #000;
          }
          @media print { 
            button { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>FECHAMENTO DE CAIXA</h1>
        <div class="empresa">${fechamentoCaixa.empresa}</div>
        <div class="data">${fechamentoCaixa.data_formatada}</div>

        <div class="secao">
          <div class="item-linha destaque">
            <span>TOTAL VENDAS:</span>
            <span>R$ ${parseFloat(fechamentoCaixa.totais.vendas).toFixed(2)}</span>
          </div>
          <div class="item-linha">
            <span>Qtd. Comandas:</span>
            <span>${fechamentoCaixa.totais.quantidade_comandas}</span>
          </div>
          <div class="item-linha">
            <span>Subtotal:</span>
            <span>R$ ${parseFloat(fechamentoCaixa.totais.subtotal).toFixed(2)}</span>
          </div>
          <div class="item-linha">
            <span>Taxa Serviço:</span>
            <span>R$ ${parseFloat(fechamentoCaixa.totais.taxa_servico).toFixed(2)}</span>
          </div>
          <div class="item-linha">
            <span>Descontos:</span>
            <span>R$ ${parseFloat(fechamentoCaixa.totais.desconto).toFixed(2)}</span>
          </div>
        </div>

        <div class="linha-dupla"></div>

        <div class="secao">
          <div class="secao-titulo">FORMAS DE PAGAMENTO</div>
          ${fechamentoCaixa.pagamentos && Object.keys(fechamentoCaixa.pagamentos).length > 0 ? 
            Object.entries(fechamentoCaixa.pagamentos).map(([forma, dados]) => `
              <div class="item-3col">
                <span>${forma.length > 12 ? forma.substring(0, 12) + '.' : forma}</span>
                <span>${dados.quantidade || 0}x</span>
                <span>R$ ${parseFloat(dados.total || 0).toFixed(2)}</span>
              </div>
            `).join('')
            : `<div class="item-linha"><span style="text-align: center; width: 100%;">Nenhuma forma de pagamento registrada</span></div>`
          }
        </div>

        <div class="linha-dupla"></div>

        ${fechamentoCaixa.por_hora && fechamentoCaixa.por_hora.length > 0 ? `
        <div class="secao">
          <div class="secao-titulo">VENDAS POR HORÁRIO</div>
          ${fechamentoCaixa.por_hora.map(hora => `
            <div class="item-3col">
              <span>${hora.hora}</span>
              <span>${hora.quantidade}x</span>
              <span>R$ ${parseFloat(hora.total).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div class="linha"></div>
        ` : ''}

        <div class="total-geral">
          TOTAL: R$ ${parseFloat(fechamentoCaixa.totais.vendas).toFixed(2)}
        </div>

        ${fechamentoCaixa.comandas_abertas > 0 ? `
        <div class="alerta">
          ! ${fechamentoCaixa.comandas_abertas} COMANDA(S) ABERTA(S) !
        </div>
        ` : ''}

        <div class="rodape">
          ${new Date().toLocaleString('pt-BR')}<br>
          APERUS
        </div>
      </body>
      </html>
    `;

    const janela = window.open('', '_blank');
    janela.document.write(conteudo);
    janela.document.close();
    
    // Auto-imprime após carregar
    setTimeout(() => {
      janela.print();
    }, 250);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Livre': 'success',
      'Ocupada': 'error',
      'Reservada': 'warning',
      'Limpeza': 'info',
      'Aberta': 'primary',
      'Fechada': 'default',
      'Cancelada': 'error'
    };
    return colors[status] || 'default';
  };

  const mesasLivres = Array.isArray(mesas) ? mesas.filter(m => m.status === 'Livre' && m.ativa).length : 0;
  const mesasOcupadas = Array.isArray(mesas) ? mesas.filter(m => m.status === 'Ocupada').length : 0;
  const comandasAbertas = Array.isArray(comandas) ? comandas.filter(c => c.status === 'Aberta').length : 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestauranteIcon fontSize="large" />
          Controle de Mesas e Comandas
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Chip
            icon={<MesaIcon />}
            label={`${mesasLivres} Livres`}
            color="success"
            sx={{ fontSize: '1rem', py: 2.5, px: 1 }}
          />
          <Chip
            icon={<MesaIcon />}
            label={`${mesasOcupadas} Ocupadas`}
            color="error"
            sx={{ fontSize: '1rem', py: 2.5, px: 1 }}
          />
          <Chip
            icon={<ComandaIcon />}
            label={`${comandasAbertas} Comandas`}
            color="primary"
            sx={{ fontSize: '1rem', py: 2.5, px: 1 }}
          />
          <Chip
            icon={<DinheiroIcon />}
            label={`R$ ${comandas.filter(c => c.status === 'Fechada').reduce((sum, c) => sum + parseFloat(c.total || 0), 0).toFixed(2)}`}
            color="info"
            sx={{ fontSize: '1rem', py: 2.5, px: 1 }}
          />
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={`Mesas (${mesas.length})`} />
          <Tab label={`Comandas Abertas (${comandasAbertas})`} />
          <Tab label="Histórico" />
          <Tab label="Financeiro" />
        </Tabs>
      </Box>

      {/* Tab 0: Mesas */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Buscar mesa..."
              value={buscarMesa}
              onChange={(e) => setBuscarMesa(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
              sx={{ flexGrow: 1, maxWidth: 300 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setMesaDialog(true)}
              >
                Nova Mesa
              </Button>
              <Button
                variant="outlined"
                startIcon={<ComandaIcon />}
                onClick={() => {
                  resetComandaForm();
                  setComandaDialog(true);
                }}
              >
                Nova Comanda
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {mesas
              .filter(mesa =>
                !buscarMesa ||
                mesa.numero.toLowerCase().includes(buscarMesa.toLowerCase()) ||
                mesa.localizacao?.toLowerCase().includes(buscarMesa.toLowerCase())
              )
              .map((mesa) => {
                const comandaAtiva = comandas.find(c => c.mesa === mesa.id && c.status === 'Aberta');
                const isOcupada = mesa.status === 'Ocupada' && comandaAtiva;
                const tempoAberto = comandaAtiva
                  ? new Date() - new Date(comandaAtiva.data_abertura)
                  : 0;
                const horas = Math.floor(tempoAberto / 3600000);
                const minutos = Math.floor((tempoAberto % 3600000) / 60000);

                return (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={mesa.id}>
                    <Card
                      sx={{
                        height: 180,
                        cursor: 'pointer',
                        bgcolor: isOcupada ? '#2196F3' : '#4CAF50',
                        color: 'white',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: 6
                        },
                        opacity: mesa.ativa ? 1 : 0.5,
                        position: 'relative'
                      }}
                      onClick={() => {
                        if (isOcupada) {
                          setComandaSelecionada(comandaAtiva);
                          setItemDialog(true);
                        } else if (mesa.status === 'Livre') {
                          resetComandaForm();
                          setComandaForm(prev => ({ ...prev, mesa: mesa.id }));
                          setComandaDialog(true);
                        }
                      }}
                    >
                      <CardContent sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        p: 2
                      }}>
                        {/* Número da Mesa */}
                        <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                          {mesa.numero}
                        </Typography>

                        {isOcupada ? (
                          <>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                              TEMPO: {String(horas).padStart(2, '0')}h{String(minutos).padStart(2, '0')}m
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ mt: 0.5 }}>
                              TOTAL: R$ {parseFloat(comandaAtiva.total || 0).toFixed(2)}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', mt: 0.5, mb: 1 }}>
                              Comanda: {comandaAtiva.numero}
                            </Typography>

                            {/* Botões para mesa ocupada */}
                            <Stack direction="row" spacing={0.5} sx={{ mt: 'auto', pt: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirPagamento(comandaAtiva);
                                }}
                                sx={{ fontSize: '0.7rem', py: 0.5 }}
                              >
                                Fechar
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setComandaSelecionada(comandaAtiva);
                                  setResumoDialog(true);
                                }}
                                sx={{ fontSize: '0.7rem', py: 0.5, color: 'white', borderColor: 'white' }}
                              >
                                Resumo
                              </Button>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setComandaSelecionada(comandaAtiva);
                                  setTimeout(() => imprimirComanda(), 100);
                                }}
                                sx={{ color: 'white', p: 0.5 }}
                              >
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </>
                        ) : (
                          <>
                            <Typography variant="body2">
                              {mesa.capacidade} lugares
                            </Typography>
                            {mesa.localizacao && (
                              <Typography variant="caption" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                                {mesa.localizacao}
                              </Typography>
                            )}
                          </>
                        )}
                      </CardContent>

                      {/* Botão de editar mesa */}
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          color: 'white',
                          bgcolor: 'rgba(0,0,0,0.2)',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMesaSelecionada(mesa);
                          setMesaForm(mesa);
                          setMesaDialog(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </Box>
      )}

      {/* Tab 1: Comandas Abertas */}
      {tabValue === 1 && (
        <Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Comanda</TableCell>
                <TableCell>Mesa</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Itens</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell align="right">Taxa Serviço</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comandas.filter(c => c.status === 'Aberta').map((comanda) => (
                <TableRow key={comanda.id}>
                  <TableCell>
                    <Typography fontWeight="bold">{comanda.numero}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(comanda.data_abertura).toLocaleString('pt-BR')}
                    </Typography>
                  </TableCell>
                  <TableCell>Mesa {comanda.mesa_numero || '-'}</TableCell>
                  <TableCell>
                    {comanda.cliente_nome ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>{comanda.cliente_nome}</Typography>
                        <Tooltip title="Remover Cliente">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoverClienteComanda(comanda.id)}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PessoasIcon />}
                        onClick={() => {
                          setComandaSelecionada(comanda);
                          setBuscarClienteDialog(true);
                        }}
                      >
                        Adicionar
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>{comanda.itens?.length || 0}</TableCell>
                  <TableCell align="right">R$ {parseFloat(comanda.subtotal || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">R$ {parseFloat(comanda.taxa_servico || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="primary">
                      R$ {parseFloat(comanda.total || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Adicionar Item">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setComandaSelecionada(comanda);
                            setItemDialog(true);
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Imprimir Comanda">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => {
                            setComandaSelecionada(comanda);
                            setTimeout(() => imprimirComanda(), 100);
                          }}
                        >
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Transferir Mesa">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setComandaSelecionada(comanda);
                            setTransferDialog(true);
                          }}
                        >
                          <TransferirIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Fechar Comanda">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => abrirPagamento(comanda)}
                        >
                          <CheckIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Tab 2: Histórico */}
      {tabValue === 2 && (
        <Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Comanda</TableCell>
                <TableCell>Mesa</TableCell>
                <TableCell>Abertura</TableCell>
                <TableCell>Fechamento</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comandas.filter(c => c.status !== 'Aberta').map((comanda) => (
                <TableRow key={comanda.id}>
                  <TableCell>{comanda.numero}</TableCell>
                  <TableCell>Mesa {comanda.mesa_numero || '-'}</TableCell>
                  <TableCell>{new Date(comanda.data_abertura).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>
                    {comanda.data_fechamento ? new Date(comanda.data_fechamento).toLocaleString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip label={comanda.status} color={getStatusColor(comanda.status)} size="small" />
                  </TableCell>
                  <TableCell align="right">R$ {parseFloat(comanda.total || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Tooltip title="Reimprimir Comanda">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setComandaSelecionada(comanda);
                          setTimeout(() => imprimirComanda(), 100);
                        }}
                      >
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Tab 3: Fechamento de Caixa */}
      {tabValue === 3 && (
        <Box>
          {/* Controles superiores */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Fechamento de Caixa</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Data"
                type="date"
                value={dataFechamento}
                onChange={(e) => setDataFechamento(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={imprimirFechamentoCaixa}
                disabled={!fechamentoCaixa || loadingFechamento}
              >
                Imprimir Fechamento
              </Button>
            </Box>
          </Box>

          {loadingFechamento ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : fechamentoCaixa ? (
            <>
              {/* Cards de Resumo */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: '#4caf50', color: 'white', p: 2 }}>
                    <Typography variant="h6">Total de Vendas</Typography>
                    <Typography variant="h4">
                      R$ {parseFloat(fechamentoCaixa.totais.vendas).toFixed(2)}
                    </Typography>
                    <Typography variant="caption">
                      {fechamentoCaixa.totais.quantidade_comandas} comandas
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: '#2196f3', color: 'white', p: 2 }}>
                    <Typography variant="h6">Subtotal</Typography>
                    <Typography variant="h4">
                      R$ {parseFloat(fechamentoCaixa.totais.subtotal).toFixed(2)}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: '#ff9800', color: 'white', p: 2 }}>
                    <Typography variant="h6">Taxa de Serviço</Typography>
                    <Typography variant="h4">
                      R$ {parseFloat(fechamentoCaixa.totais.taxa_servico).toFixed(2)}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: '#9c27b0', color: 'white', p: 2 }}>
                    <Typography variant="h6">Descontos</Typography>
                    <Typography variant="h4">
                      R$ {parseFloat(fechamentoCaixa.totais.desconto).toFixed(2)}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Alerta de comandas abertas */}
              {fechamentoCaixa.comandas_abertas > 0 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <strong>Atenção:</strong> Existem {fechamentoCaixa.comandas_abertas} comanda(s) ainda aberta(s)
                </Alert>
              )}

              {/* Resumo por Forma de Pagamento */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumo por Forma de Pagamento
                  </Typography>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Forma de Pagamento</strong></TableCell>
                        <TableCell align="right"><strong>Quantidade</strong></TableCell>
                        <TableCell align="right"><strong>Total</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(fechamentoCaixa.pagamentos || {}).map(([forma, dados]) => (
                        <TableRow key={forma}>
                          <TableCell>
                            <Chip label={forma} color="primary" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1">{dados.quantidade}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight="bold" color="success.main">
                              R$ {parseFloat(dados.total).toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2} align="right">
                          <Typography variant="h6">TOTAL:</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" color="primary">
                            R$ {parseFloat(fechamentoCaixa.totais.vendas).toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Vendas por Horário */}
              {fechamentoCaixa.por_hora && fechamentoCaixa.por_hora.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Vendas por Horário
                    </Typography>
                    <Grid container spacing={1}>
                      {fechamentoCaixa.por_hora.map((hora, idx) => (
                        <Grid item xs={12} sm={6} md={3} key={idx}>
                          <Card variant="outlined" sx={{ p: 1.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {hora.hora}
                            </Typography>
                            <Typography variant="h6" color="primary">
                              R$ {parseFloat(hora.total).toFixed(2)}
                            </Typography>
                            <Typography variant="caption">
                              {hora.quantidade} comanda(s)
                            </Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Detalhes das Comandas */}
              <Typography variant="h6" sx={{ mb: 2 }}>Detalhes das Comandas</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Comanda</TableCell>
                    <TableCell>Mesa</TableCell>
                    <TableCell>Horário</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="right">Taxa 10%</TableCell>
                    <TableCell align="right">Desconto</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Forma Pgto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comandas
                    .filter(c => c.status === 'Fechada' &&
                      c.data_fechamento &&
                      new Date(c.data_fechamento).toDateString() === new Date().toDateString())
                    .map((comanda) => (
                      <TableRow key={comanda.id}>
                        <TableCell>
                          <Typography fontWeight="bold">{comanda.numero}</Typography>
                        </TableCell>
                        <TableCell>Mesa {comanda.mesa_numero || '-'}</TableCell>
                        <TableCell>
                          {new Date(comanda.data_fechamento).toLocaleTimeString('pt-BR')}
                        </TableCell>
                        <TableCell align="right">
                          R$ {parseFloat(comanda.subtotal || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          R$ {parseFloat(comanda.taxa_servico || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          R$ {parseFloat(comanda.desconto || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold" color="success.main">
                            R$ {parseFloat(comanda.total || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={comanda.forma_pagamento || 'Não informado'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              {fechamentoCaixa.detalhes_comandas && fechamentoCaixa.detalhes_comandas.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Nenhuma comanda fechada nesta data
                </Alert>
              )}
            </>
          ) : (
            <Alert severity="info">
              Selecione uma data para visualizar o fechamento de caixa
            </Alert>
          )}
        </Box>
      )}

      {/* Dialog: Nova/Editar Mesa */}
      <Dialog open={mesaDialog} onClose={() => { setMesaDialog(false); resetMesaForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle>{mesaSelecionada ? 'Editar Mesa' : 'Nova Mesa'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Número da Mesa"
              value={mesaForm.numero}
              onChange={(e) => setMesaForm({ ...mesaForm, numero: e.target.value })}
              fullWidth
            />
            <TextField
              label="Capacidade"
              type="number"
              value={mesaForm.capacidade}
              onChange={(e) => setMesaForm({ ...mesaForm, capacidade: parseInt(e.target.value) })}
              fullWidth
            />
            <TextField
              label="Localização"
              value={mesaForm.localizacao}
              onChange={(e) => setMesaForm({ ...mesaForm, localizacao: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={mesaForm.status}
                onChange={(e) => setMesaForm({ ...mesaForm, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="Livre">Livre</MenuItem>
                <MenuItem value="Ocupada">Ocupada</MenuItem>
                <MenuItem value="Reservada">Reservada</MenuItem>
                <MenuItem value="Limpeza">Em Limpeza</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setMesaDialog(false); resetMesaForm(); }}>Cancelar</Button>
          <Button onClick={handleSaveMesa} variant="contained" disabled={loading}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Abrir Comanda */}
      <Dialog open={comandaDialog} onClose={() => { setComandaDialog(false); resetComandaForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle>Abrir Comanda</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Número da Comanda"
              value={comandaForm.numero}
              onChange={(e) => setComandaForm({ ...comandaForm, numero: e.target.value })}
              helperText="Deixe em branco para gerar automaticamente"
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Mesa</InputLabel>
              <Select
                value={comandaForm.mesa}
                onChange={(e) => setComandaForm({ ...comandaForm, mesa: e.target.value })}
                label="Mesa"
              >
                {mesas.filter(m => m.status === 'Livre').map(m => (
                  <MenuItem key={m.id} value={m.id}>Mesa {m.numero}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Seção de Cliente */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>Cliente</Typography>
              {clienteSelecionado ? (
                <Card
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: clienteSelecionado.nome_razao_social === 'CONSUMIDOR' ? 'grey.100' : 'success.light'
                  }}
                >
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Nome:</strong> {clienteSelecionado.nome_razao_social}
                      {clienteSelecionado.nome_razao_social === 'CONSUMIDOR' && (
                        <Chip label="Padrão" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    {clienteSelecionado.nome_razao_social !== 'CONSUMIDOR' && (
                      <>
                        <Typography variant="body2">
                          <strong>CPF/CNPJ:</strong> {clienteSelecionado.cpf_cnpj}
                        </Typography>
                        {clienteSelecionado.telefone && (
                          <Typography variant="body2">
                            <strong>Telefone:</strong> {clienteSelecionado.telefone}
                          </Typography>
                        )}
                      </>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SearchIcon />}
                      onClick={() => setBuscarClienteDialog(true)}
                    >
                      {clienteSelecionado.nome_razao_social === 'CONSUMIDOR' ? 'Adicionar Cliente' : 'Trocar Cliente'}
                    </Button>
                  </Stack>
                </Card>
              ) : (
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<SearchIcon />}
                  onClick={() => setBuscarClienteDialog(true)}
                >
                  Buscar Cliente
                </Button>
              )}
            </Box>

            <TextField
              label="Taxa de Serviço (10%)"
              type="number"
              value={comandaForm.taxa_servico}
              onChange={(e) => setComandaForm({ ...comandaForm, taxa_servico: parseFloat(e.target.value) })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setComandaDialog(false); resetComandaForm(); }}>Cancelar</Button>
          <Button onClick={handleAbrirComanda} variant="contained" disabled={loading}>Abrir</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Buscar Cliente */}
      <Dialog
        open={buscarClienteDialog}
        onClose={() => {
          setBuscarClienteDialog(false);
          setBuscaCliente('');
          setComandaSelecionada(null);
          setMostrarListaClientes(false);
          setListaClientes([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {comandaSelecionada?.id ?
            `Adicionar Cliente - Comanda ${comandaSelecionada.numero}` :
            'Buscar Cliente'
          }
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Digite o CPF/CNPJ, ID ou Nome do cliente cadastrado no sistema
            </Alert>
            <TextField
              label="CPF/CNPJ, ID ou Nome do Cliente"
              value={buscaCliente}
              onChange={(e) => {
                setBuscaCliente(e.target.value);
                setMostrarListaClientes(false);
                setListaClientes([]);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (comandaSelecionada?.id) {
                    handleBuscarClienteParaComanda();
                  } else {
                    handleBuscarCliente();
                  }
                }
              }}
              placeholder="Ex: João Silva, 123.456.789-00 ou 1234"
              fullWidth
              autoFocus
              disabled={loadingCliente}
            />

            {/* Lista de clientes encontrados */}
            {mostrarListaClientes && listaClientes.length > 0 && (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Typography variant="subtitle2" gutterBottom>
                  {listaClientes.length} cliente(s) encontrado(s):
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>CPF/CNPJ</TableCell>
                      <TableCell>Telefone</TableCell>
                      <TableCell>Cidade</TableCell>
                      <TableCell>Ação</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {listaClientes.map((cliente) => (
                      <TableRow key={cliente.id_cliente} hover>
                        <TableCell>
                          <Typography variant="body2">{cliente.nome_razao_social}</Typography>
                          {cliente.nome_fantasia && (
                            <Typography variant="caption" color="text.secondary">
                              {cliente.nome_fantasia}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{cliente.cpf_cnpj}</TableCell>
                        <TableCell>{cliente.telefone || '-'}</TableCell>
                        <TableCell>{cliente.cidade || '-'}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              if (comandaSelecionada?.id) {
                                handleSelecionarClienteParaComanda(cliente);
                              } else {
                                handleSelecionarClienteDaLista(cliente);
                              }
                            }}
                          >
                            Selecionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setBuscarClienteDialog(false);
            setBuscaCliente('');
            setComandaSelecionada(null);
            setMostrarListaClientes(false);
            setListaClientes([]);
          }}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (comandaSelecionada?.id) {
                handleBuscarClienteParaComanda();
              } else {
                handleBuscarCliente();
              }
            }}
            variant="contained"
            disabled={loadingCliente || !buscaCliente.trim()}
            startIcon={loadingCliente ? <CircularProgress size={20} /> : <SearchIcon />}
          >
            {loadingCliente ? 'Buscando...' : 'Vincular Cliente'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Adicionar Item */}
      <Dialog open={itemDialog} onClose={() => { setItemDialog(false); setComandaSelecionada(null); setProdutoSelecionado(null); setBuscaProduto(''); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Typography variant="h6">
                Comanda {comandaSelecionada?.numero} - Mesa {comandaSelecionada?.mesa_numero}
              </Typography>
              {comandaSelecionada?.cliente_nome && (
                <Typography variant="body2" color="text.secondary">
                  Cliente: {comandaSelecionada.cliente_nome}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {/* Itens atuais */}
          {comandaSelecionada?.itens && comandaSelecionada.itens.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Itens da Comanda</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell>Qtd</TableCell>
                    <TableCell align="right">Valor Unit.</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comandaSelecionada.itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.produto_nome}
                        {item.observacoes && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {item.observacoes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{item.quantidade}</TableCell>
                      <TableCell align="right">R$ {parseFloat(item.valor_unitario).toFixed(2)}</TableCell>
                      <TableCell align="right">R$ {parseFloat(item.subtotal).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip label={item.status} size="small" />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleCancelarItem(item.id)}
                          title="Cancelar item"
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align="right"><strong>Total:</strong></TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary">
                        R$ {parseFloat(comandaSelecionada.total || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
              <Divider sx={{ my: 2 }} />
            </Box>
          )}

          {/* Adicionar novo item */}
          <Typography variant="h6" gutterBottom>Adicionar Item</Typography>
          <Stack spacing={2}>
            <Autocomplete
              fullWidth
              options={produtos}
              value={produtoSelecionado}
              onChange={(event, newValue) => {
                setProdutoSelecionado(newValue);
                setItemForm({ ...itemForm, produto: newValue?.id_produto || '' });
              }}
              inputValue={buscaProduto}
              onInputChange={(event, newInputValue) => {
                setBuscaProduto(newInputValue);
              }}
              getOptionLabel={(option) => option.nome_produto || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pesquisar Produto"
                  placeholder="Digite o nome ou código do produto"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <SearchIcon sx={{ color: 'action.active', mr: 1, ml: 1 }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <ListItem {...props} key={option.id_produto}>
                  <ListItemAvatar>
                    <Avatar
                      src={option.imagem_url}
                      alt={option.nome_produto}
                      sx={{ width: 50, height: 50, mr: 1 }}
                    >
                      {!option.imagem_url && option.nome_produto?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body1">
                        {option.codigo_produto} - {option.nome_produto}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        R$ {(option.valor_venda ? Number(option.valor_venda).toFixed(2) : '0.00')}
                      </Typography>
                    }
                  />
                </ListItem>
              )}
              noOptionsText="Nenhum produto encontrado"
              isOptionEqualToValue={(option, value) => option.id_produto === value.id_produto}
            />
            
            {/* Preview do Produto Selecionado */}
            {produtoSelecionado && (
              <Card sx={{ bgcolor: 'primary.light', p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={produtoSelecionado.imagem_url}
                    alt={produtoSelecionado.nome_produto}
                    sx={{ width: 60, height: 60 }}
                  >
                    {!produtoSelecionado.imagem_url && produtoSelecionado.nome_produto?.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {produtoSelecionado.nome_produto}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Código: {produtoSelecionado.codigo_produto}
                    </Typography>
                    <Typography variant="h6" color="primary.dark" fontWeight="bold">
                      R$ {(produtoSelecionado.valor_venda ? Number(produtoSelecionado.valor_venda).toFixed(2) : '0.00')}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            )}

            <TextField
              label="Quantidade"
              type="number"
              value={itemForm.quantidade}
              onChange={(e) => setItemForm({ ...itemForm, quantidade: parseFloat(e.target.value) })}
              fullWidth
            />
            <TextField
              label="Observações"
              value={itemForm.observacoes}
              onChange={(e) => setItemForm({ ...itemForm, observacoes: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ flexWrap: 'wrap', gap: 1, p: 2 }}>
          {/* Linha 1: Ações de modificação */}
          <Box sx={{ display: 'flex', gap: 1, width: '100%', flexWrap: 'wrap' }}>
            <Button
              onClick={handleAplicarTaxaServico}
              startIcon={<ReceiptIcon />}
              variant="outlined"
              size="small"
              disabled={loading || comandaSelecionada?.taxa_servico > 0}
            >
              Taxa 10%
            </Button>
            <Button
              onClick={handleEnviarCozinha}
              startIcon={<SendIcon />}
              variant="outlined"
              size="small"
              color="warning"
              disabled={loading}
            >
              Enviar Cozinha
            </Button>
            <Button
              onClick={imprimirComanda}
              startIcon={<PrintIcon />}
              variant="outlined"
              size="small"
              disabled={loading}
            >
              Imprimir
            </Button>
          </Box>

          {/* Linha 2: Ações principais */}
          <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between', mt: 1 }}>
            <Button
              onClick={() => { setItemDialog(false); setComandaSelecionada(null); setProdutoSelecionado(null); setBuscaProduto(''); }}
              size="small"
            >
              Fechar
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleAdicionarItem}
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                disabled={loading || !itemForm.produto}
              >
                Adicionar
              </Button>
              {comandaSelecionada && (
                <Button
                  onClick={() => abrirPagamento(comandaSelecionada)}
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<PaymentIcon />}
                >
                  Finalizar
                </Button>
              )}
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Dialog: Transferir Mesa */}
      <Dialog open={transferDialog} onClose={() => { setTransferDialog(false); setMesaSelecionada(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>Transferir Mesa</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Comanda {comandaSelecionada?.numero} está na Mesa {comandaSelecionada?.mesa_numero}
          </Alert>
          <FormControl fullWidth>
            <InputLabel>Nova Mesa</InputLabel>
            <Select
              value={mesaSelecionada || ''}
              onChange={(e) => setMesaSelecionada(e.target.value)}
              label="Nova Mesa"
            >
              {mesas.filter(m => m.status === 'Livre').map(m => (
                <MenuItem key={m.id} value={m.id}>Mesa {m.numero}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setTransferDialog(false); setMesaSelecionada(null); }}>Cancelar</Button>
          <Button onClick={handleTransferirMesa} variant="contained" disabled={loading || !mesaSelecionada}>
            Transferir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Resumo da Comanda */}
      <Dialog open={resumoDialog} onClose={() => setResumoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resumo da Comanda {comandaSelecionada?.numero}</DialogTitle>
        <DialogContent>
          {comandaSelecionada && (
            <Box>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Mesa:</Typography>
                  <Typography variant="h6">{comandaSelecionada.mesa_numero}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Tempo decorrido:</Typography>
                  <Typography variant="body1">
                    {(() => {
                      const tempo = new Date() - new Date(comandaSelecionada.data_abertura);
                      const h = Math.floor(tempo / 3600000);
                      const m = Math.floor((tempo % 3600000) / 60000);
                      return `${h}h ${m}min`;
                    })()}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>Itens ({comandaSelecionada.itens?.length || 0}):</Typography>
                  {comandaSelecionada.itens?.map(item => (
                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {item.quantidade}x {item.produto_nome}
                      </Typography>
                      <Typography variant="body2">
                        R$ {parseFloat(item.subtotal).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Divider />
                <Box>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Subtotal:</Typography>
                      <Typography>R$ {parseFloat(comandaSelecionada.subtotal || 0).toFixed(2)}</Typography>
                    </Box>
                    {parseFloat(comandaSelecionada.desconto || 0) > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}>
                        <Typography>Desconto:</Typography>
                        <Typography>- R$ {parseFloat(comandaSelecionada.desconto).toFixed(2)}</Typography>
                      </Box>
                    )}
                    {parseFloat(comandaSelecionada.taxa_servico || 0) > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Taxa de Serviço (10%):</Typography>
                        <Typography>R$ {parseFloat(comandaSelecionada.taxa_servico).toFixed(2)}</Typography>
                      </Box>
                    )}
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight="bold">TOTAL:</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        R$ {parseFloat(comandaSelecionada.total || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={imprimirComanda} startIcon={<PrintIcon />} variant="outlined">
            Imprimir
          </Button>
          <Button onClick={() => { setResumoDialog(false); setDivisaoDialog(true); }} startIcon={<PessoasIcon />} variant="outlined">
            Dividir Conta
          </Button>
          <Button onClick={() => { setResumoDialog(false); setDescontoDialog(true); }} startIcon={<DescontoIcon />} variant="outlined">
            Desconto
          </Button>
          <Button onClick={() => setResumoDialog(false)}>Fechar</Button>
          <Button
            onClick={() => {
              setResumoDialog(false);
              abrirPagamento(comandaSelecionada);
            }}
            variant="contained"
            color="success"
          >
            Fechar Comanda
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Divisão de Conta */}
      <Dialog open={divisaoDialog} onClose={() => setDivisaoDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Dividir Conta</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Número de Pessoas"
              type="number"
              value={numeroPessoas}
              onChange={(e) => setNumeroPessoas(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1 }}
              fullWidth
            />
            <Alert severity="info">
              <Typography variant="body2">
                Total: <strong>R$ {parseFloat(comandaSelecionada?.total || 0).toFixed(2)}</strong>
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                Valor por pessoa: <strong>R$ {calcularDivisaoConta().toFixed(2)}</strong>
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDivisaoDialog(false)}>Fechar</Button>
          <Button onClick={imprimirComanda} variant="contained" startIcon={<PrintIcon />}>
            Imprimir Divisão
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Aplicar Desconto */}
      <Dialog open={descontoDialog} onClose={() => setDescontoDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Aplicar Desconto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl component="fieldset">
              <FormLabel>Tipo de Desconto</FormLabel>
              <RadioGroup
                row
                value={tipoDesconto}
                onChange={(e) => setTipoDesconto(e.target.value)}
              >
                <FormControlLabel value="percentual" control={<Radio />} label="Percentual (%)" />
                <FormControlLabel value="valor" control={<Radio />} label="Valor (R$)" />
              </RadioGroup>
            </FormControl>

            <TextField
              label={tipoDesconto === 'percentual' ? 'Desconto (%)' : 'Desconto (R$)'}
              type="number"
              value={valorDesconto}
              onChange={(e) => setValorDesconto(parseFloat(e.target.value) || 0)}
              inputProps={{ min: 0, step: tipoDesconto === 'percentual' ? 1 : 0.01 }}
              fullWidth
            />

            <Alert severity="info">
              <Typography variant="body2">
                Subtotal: R$ {parseFloat(comandaSelecionada?.subtotal || 0).toFixed(2)}
              </Typography>
              <Typography variant="body2">
                Desconto: R$ {(tipoDesconto === 'percentual'
                  ? (parseFloat(comandaSelecionada?.subtotal || 0) * valorDesconto) / 100
                  : valorDesconto
                ).toFixed(2)}
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                Novo Total: R$ {(
                  parseFloat(comandaSelecionada?.subtotal || 0)
                  - (tipoDesconto === 'percentual'
                    ? (parseFloat(comandaSelecionada?.subtotal || 0) * valorDesconto) / 100
                    : valorDesconto)
                  + parseFloat(comandaSelecionada?.taxa_servico || 0)
                ).toFixed(2)}
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDescontoDialog(false); setValorDesconto(0); }}>Cancelar</Button>
          <Button onClick={handleAplicarDesconto} variant="contained" disabled={loading}>
            Aplicar Desconto
          </Button>
        </DialogActions>
      </Dialog>

      {/* NOVO: Dialog: Pagamento */}
      <Dialog open={pagamentoDialog} onClose={() => setPagamentoDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Finalizar Pagamento - Comanda {comandaSelecionada?.numero}
          {comandaSelecionada?.cliente_nome && (
            <Typography variant="body2" color="text.secondary">
              Cliente: {comandaSelecionada.cliente_nome}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Resumo da conta */}
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
              <Typography variant="body2">Subtotal: R$ {parseFloat(comandaSelecionada?.subtotal || 0).toFixed(2)}</Typography>
              {parseFloat(comandaSelecionada?.desconto || 0) > 0 && (
                <Typography variant="body2" color="error">
                  Desconto: - R$ {parseFloat(comandaSelecionada?.desconto || 0).toFixed(2)}
                </Typography>
              )}
              {parseFloat(comandaSelecionada?.taxa_servico || 0) > 0 && (
                <Typography variant="body2">
                  Taxa Serviço (10%): R$ {parseFloat(comandaSelecionada?.taxa_servico || 0).toFixed(2)}
                </Typography>
              )}
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" color="primary">
                TOTAL: R$ {parseFloat(comandaSelecionada?.total || 0).toFixed(2)}
              </Typography>
            </Box>

            {/* Pagamentos já adicionados */}
            {pagamentos.length > 0 && (
              <Box sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Formas de Pagamento:</Typography>
                <Stack spacing={1}>
                  {pagamentos.map((pag, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        {pag.forma}: R$ {pag.valor.toFixed(2)}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => handleRemoverPagamento(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Divider />
                  <Typography variant="body2" fontWeight="bold">
                    Total Pago: R$ {pagamentos.reduce((sum, p) => sum + p.valor, 0).toFixed(2)}
                  </Typography>
                  {(() => {
                    const totalConta = parseFloat(comandaSelecionada?.total || 0);
                    const totalPago = pagamentos.reduce((sum, p) => sum + p.valor, 0);
                    const diferenca = totalConta - totalPago;

                    if (diferenca === 0) {
                      return (
                        <Alert severity="success" sx={{ py: 0 }}>
                          ✓ Valor exato! Pode confirmar o pagamento.
                        </Alert>
                      );
                    } else if (diferenca > 0) {
                      return (
                        <Typography variant="body2" color="error.main" fontWeight="bold">
                          Falta: R$ {diferenca.toFixed(2)}
                        </Typography>
                      );
                    } else {
                      return (
                        <Typography variant="body2" color="warning.main" fontWeight="bold">
                          Excedente: R$ {Math.abs(diferenca).toFixed(2)} (ajuste necessário)
                        </Typography>
                      );
                    }
                  })()}
                </Stack>
              </Box>
            )}

            {/* Adicionar nova forma de pagamento */}
            <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Adicionar Forma de Pagamento:</Typography>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Forma de Pagamento</InputLabel>
                  <Select
                    value={formaPagamentoAtual}
                    onChange={(e) => setFormaPagamentoAtual(e.target.value)}
                    label="Forma de Pagamento"
                  >
                    {formasPagamento.map((forma) => (
                      <MenuItem key={forma.id_forma_pagamento} value={forma.nome_forma}>
                        {forma.nome_forma}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Valor"
                  type="number"
                  value={valorPagamentoAtual}
                  onChange={(e) => setValorPagamentoAtual(parseFloat(e.target.value) || 0)}
                  fullWidth
                  InputProps={{
                    startAdornment: 'R$'
                  }}
                />

                <Button
                  onClick={handleAdicionarPagamento}
                  variant="outlined"
                  startIcon={<AddIcon />}
                  disabled={valorPagamentoAtual <= 0}
                >
                  Adicionar
                </Button>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPagamentoDialog(false)}>Cancelar</Button>
          <Button
            onClick={imprimirComanda}
            variant="outlined"
            startIcon={<PrintIcon />}
            disabled={!comandaSelecionada}
          >
            Imprimir
          </Button>
          <Button
            onClick={handleFecharComPagamento}
            variant="contained"
            color="success"
            startIcon={<PaymentIcon />}
            disabled={
              loading ||
              pagamentos.length === 0 ||
              pagamentos.reduce((sum, p) => sum + p.valor, 0) !== parseFloat(comandaSelecionada?.total || 0)
            }
          >
            Confirmar Pagamento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComandasPage;
