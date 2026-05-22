import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Badge,
  InputAdornment,
  Fab,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Menu,
  Autocomplete
} from '@mui/material';

import {
  Hotel,
  MeetingRoom,
  CleaningServices,
  Build,
  CheckCircle,
  Cancel,
  Save,
  Add,
  ShoppingCart,
  Chat,
  Send,
  Refresh,
  ArrowBack,
  ArrowForward,
  Close,
  PointOfSale,
  Person,
  CalendarMonth,
  RoomService,
  PlayArrow,
  Star,
  Warning,
  AccountBalanceWallet,
  Settings,
  Edit,
  Business as BusinessIcon,
  WhatsApp as WhatsAppIcon,
  Cake as CakeIcon,
  LocationOn as LocationIcon,
  CloudDownload as DownloadIcon,
  Block as BlockIcon,
  CreditCard as CreditCardIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Print,
  MoreVert
} from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';
import useImpressaoVenda from '../hooks/useImpressaoVenda';
import {
  buscarCNPJ,
  buscarCEP,
  formatCNPJ,
  formatCPF,
  formatTelefone,
  formatCEP,
  isValidEmail,
  isValidCNPJ,
  isValidCPF,
  ESTADOS_BRASIL
} from '../utils/cnpjCepUtils';

const DEFAULT_STATUS_OPTIONS = [
  { value: 'disponivel', label: 'Disponível', color: '#4caf50' },
  { value: 'ocupado', label: 'Ocupado', color: '#f44336' },
  { value: 'sujo', label: 'Sujo / Faxina', color: '#ff9800' },
  { value: 'manutencao', label: 'Manutenção', color: '#9e9e9e' }
];

export default function HotelPMSPage() {
  const { imprimirDireto } = useImpressaoVenda(api);

  // Dados principais
  const [tiposQuarto, setTiposQuarto] = useState([]);
  const [quartos, setQuartos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [comodidades, setComodidades] = useState([]);

  // Estados de controle e navegação
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Janela de datas do Mapa de Ocupação (15 dias por padrão)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3); // Inicia 3 dias atrás para ver retrospectiva
    return d;
  });

  const daysArray = useMemo(() => {
    const arr = [];
    let dt = new Date(startDate);
    // Exibe 15 dias no calendário
    for (let i = 0; i < 15; i++) {
      arr.push(new Date(dt));
      dt.setDate(dt.getDate() + 1);
    }
    return arr;
  }, [startDate]);

  const dateRangeLabel = useMemo(() => {
    if (daysArray.length === 0) return '';
    const first = daysArray[0];
    const last = daysArray[daysArray.length - 1];
    return `${first.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${last.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }, [daysArray]);

  // Modais
  const [openBookingModal, setOpenBookingModal] = useState(false);
  const [openManageModal, setOpenManageModal] = useState(false);
  const [openCheckoutSuccessModal, setOpenCheckoutSuccessModal] = useState(false);

  // Estados para Cadastro e Edição de Quartos
  const [openRoomModal, setOpenRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState({
    id_quarto: null,
    numero_quarto: '',
    tipo: '',
    status_atual: 'disponivel',
    capacidade_adultos: 2,
    capacidade_criancas: 0,
    comodidades: []
  });

  // Submodais auxiliares para cadastro rápido
  const [openTipoQuartoModal, setOpenTipoQuartoModal] = useState(false);
  const [tipoQuartoForm, setTipoQuartoForm] = useState({
    nome: '',
    descricao: '',
    valor_diaria_padrao: '',
    limite_adultos: 2,
    limite_criancas: 0
  });

  const [statusOptions, setStatusOptions] = useState(() => {
    const saved = localStorage.getItem('hotel_status_options');
    return saved ? JSON.parse(saved) : DEFAULT_STATUS_OPTIONS;
  });

  const [gruposProduto, setGruposProduto] = useState([]);

  const [openStatusModal, setOpenStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    label: '',
    color: '#1a73e8'
  });

  const [openClienteModal, setOpenClienteModal] = useState(false);
  const [clienteForm, setClienteForm] = useState({
    nome: '',
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: '',
    telefone: '',
    whatsapp: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'SP',
    data_aniversario: '',
    observacoes: '',
    limite_credito: 0,
    tipo_desconto: 'PERCENTUAL',
    valor_desconto: 0,
    percentual_arredondamento: 0,
    priorizar_desconto_cliente: false,
    grupos_excecao: [],
    sexo: ''
  });

  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [clienteWarning, setClienteWarning] = useState('');
  const [clienteError, setClienteError] = useState('');

  const [novaComodidadeNome, setNovaComodidadeNome] = useState('');

  // Seleções para criação/gerenciamento
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [checkoutResult, setCheckoutResult] = useState(null);

  // Estados para Impressão / Faturamento
  const [printAnchorEl, setPrintAnchorEl] = useState(null);
  const [printSelectedRow, setPrintSelectedRow] = useState(null);

  // Estados para Faturamento Financeiro no Checkout
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [contasBancarias, setContasBancarias] = useState([]);
  const [operacoes, setOperacoes] = useState([]);
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  const [checkoutForm, setCheckoutForm] = useState({
    id_operacao: '',
    id_forma_pagamento: '',
    id_conta_cobranca: '',
    data_vencimento: new Date().toISOString().split('T')[0],
    gerar_financeiro: true
  });

  // Formulário de Reserva
  const [bookingForm, setBookingForm] = useState({
    hospede: '',
    quarto: '',
    data_entrada_prevista: '',
    data_saida_prevista: '',
    valor_diaria_aplicada: '',
    observacoes: ''
  });

  // Formulário de Consumo
  const [consumoForm, setConsumoForm] = useState({
    produto_id: '',
    quantidade: 1,
    valor_unitario: '',
    observacao: ''
  });
  const [produtoSearch, setProdutoSearch] = useState(null); // produto selecionado no Autocomplete


  // Chat do Assistente IA (Gemini Mock)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'gemini',
      text: 'Olá! Sou o assistente inteligente do Aperus Hotel. Posso ajudar você com a governança, reservas ou lançar consumos no quarto. O que gostaria de fazer?'
    }
  ]);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        tiposRes,
        quartosRes,
        reservasRes,
        clientesRes,
        produtosRes,
        comodidadesRes,
        gruposRes,
        formasRes,
        contasRes,
        operacoesRes
      ] = await Promise.all([
        api.get('/api/hotel/tipos-quarto/'),
        api.get('/api/hotel/quartos/'),
        api.get('/api/hotel/reservas/'),
        api.get('/api/clientes/?page_size=1000'),
        api.get('/api/produtos/?page_size=1000'),
        api.get('/api/hotel/comodidades/'),
        api.get('/api/grupos-produto/').catch(err => {
          console.warn('Erro ao carregar grupos de produto:', err);
          return { data: [] };
        }),
        api.get('/api/formas-pagamento/').catch(err => {
          console.warn('Erro ao carregar formas de pagamento:', err);
          return { data: [] };
        }),
        api.get('/api/contas-bancarias/?page_size=1000').catch(err => {
          console.warn('Erro ao carregar contas bancárias:', err);
          return { data: [] };
        }),
        api.get('/api/operacoes/').catch(err => {
          console.warn('Erro ao carregar operações:', err);
          return { data: [] };
        })
      ]);

      const normalize = (res) => {
        if (!res || !res.data) return [];
        const d = res.data;
        if (Array.isArray(d)) return d;
        if (d.results && Array.isArray(d.results)) return d.results;
        return [];
      };

      setTiposQuarto(normalize(tiposRes));
      setQuartos(normalize(quartosRes));
      setReservas(normalize(reservasRes));
      setClientes(normalize(clientesRes));
      setProdutos(normalize(produtosRes));
      setComodidades(normalize(comodidadesRes));
      setGruposProduto(normalize(gruposRes));
      setFormasPagamento(normalize(formasRes));
      setContasBancarias(normalize(contasRes));
      setOperacoes(normalize(operacoesRes));
    } catch (err) {
      console.error('Erro ao carregar dados do PMS:', err);
      toast.error('Erro ao carregar dados do módulo hoteleiro.');
    } finally {
      setLoading(false);
    }
  };

  // Seed de demonstração
  const handleSeedData = async () => {
    setLoading(true);
    try {
      let tipos = tiposQuarto;
      if (tipos.length === 0) {
        const t1 = await api.post('/api/hotel/tipos-quarto/', {
          nome: 'Standard Casal',
          descricao: 'Quarto aconchegante com cama de casal, frigobar, ar condicionado e TV.',
          valor_diaria_padrao: 160.00,
          limite_adultos: 2,
          limite_criancas: 1
        });
        const t2 = await api.post('/api/hotel/tipos-quarto/', {
          nome: 'Deluxe Duplo',
          descricao: 'Quarto espaçoso com cama king, sacada, smart TV e frigobar cortesia.',
          valor_diaria_padrao: 260.00,
          limite_adultos: 2,
          limite_criancas: 2
        });
        const t3 = await api.post('/api/hotel/tipos-quarto/', {
          nome: 'Suíte Master Imperial',
          descricao: 'Suíte presidencial com banheira de hidromassagem, closet e sala de estar.',
          valor_diaria_padrao: 490.00,
          limite_adultos: 3,
          limite_criancas: 2
        });
        tipos = [t1.data, t2.data, t3.data];
      }

      if (quartos.length === 0) {
        const st = tipos.find(t => t.nome.includes('Standard')) || tipos[0];
        const dl = tipos.find(t => t.nome.includes('Deluxe')) || tipos[1] || tipos[0];
        const se = tipos.find(t => t.nome.includes('Suíte')) || tipos[2] || tipos[0];

        await api.post('/api/hotel/quartos/', { numero_quarto: '101', tipo: st.id_tipo_quarto, status_atual: 'disponivel', capacidade_adultos: 2, capacidade_criancas: 1 });
        await api.post('/api/hotel/quartos/', { numero_quarto: '102', tipo: st.id_tipo_quarto, status_atual: 'disponivel', capacidade_adultos: 2, capacidade_criancas: 1 });
        await api.post('/api/hotel/quartos/', { numero_quarto: '103', tipo: st.id_tipo_quarto, status_atual: 'sujo', capacidade_adultos: 2, capacidade_criancas: 1 });
        await api.post('/api/hotel/quartos/', { numero_quarto: '201', tipo: dl.id_tipo_quarto, status_atual: 'ocupado', capacidade_adultos: 2, capacidade_criancas: 2 });
        await api.post('/api/hotel/quartos/', { numero_quarto: '202', tipo: dl.id_tipo_quarto, status_atual: 'disponivel', capacidade_adultos: 2, capacidade_criancas: 2 });
        await api.post('/api/hotel/quartos/', { numero_quarto: '301', tipo: se.id_tipo_quarto, status_atual: 'disponivel', capacidade_adultos: 3, capacidade_criancas: 2 });
        await api.post('/api/hotel/quartos/', { numero_quarto: '302', tipo: se.id_tipo_quarto, status_atual: 'manutencao', capacidade_adultos: 3, capacidade_criancas: 2 });
      }

      toast.success('Ambiente demonstrativo do hotel inicializado com sucesso!');
      await loadData();
    } catch (err) {
      console.error('Erro ao gerar dados:', err);
      toast.error('Erro ao inicializar banco hoteleiro.');
    } finally {
      setLoading(false);
    }
  };

  // Navegação do calendário
  const handlePrevPeriod = () => {
    setStartDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextPeriod = () => {
    setStartDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    setStartDate(d);
  };

  // Formatação de datas
  const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getBookingDates = (res) => {
    if (!res) return { startStr: '', endStr: '' };
    // Início real ou previsto
    const startStr = (res.data_checkin_real || res.data_entrada_prevista).split('T')[0];
    
    // Fim real, previsto ou estendido (caso de check-in ativo sem check-out)
    let endStr;
    if (res.status_reserva === 'checkin') {
      const hojeObj = new Date();
      const hojeStr = formatDateKey(hojeObj);
      const previstaStr = res.data_saida_prevista.split('T')[0];
      
      // Estende até hoje se a saída prevista já passou e o cliente ainda está hospedado
      const maxStr = previstaStr > hojeStr ? previstaStr : hojeStr;
      
      // Adiciona 1 dia para que dateStr < endStr seja verdadeiro no último dia de hospedagem ativa
      const maxDate = new Date(maxStr + 'T00:00:00');
      maxDate.setDate(maxDate.getDate() + 1);
      endStr = formatDateKey(maxDate);
    } else if (res.status_reserva === 'finalizada' || res.data_checkout_real) {
      endStr = (res.data_checkout_real || res.data_saida_prevista).split('T')[0];
    } else {
      endStr = res.data_saida_prevista.split('T')[0];
    }

    // Garante intervalo mínimo de 1 dia se as datas forem iguais
    if (startStr === endStr) {
      const nextDay = new Date(startStr + 'T00:00:00');
      nextDay.setDate(nextDay.getDate() + 1);
      endStr = formatDateKey(nextDay);
    }

    return { startStr, endStr };
  };

  const getBookingForRoomAndDay = (roomId, dateStr) => {
    return reservas.find(res => {
      if (res.quarto !== roomId && res.quarto?.id_quarto !== roomId) return false;
      if (res.status_reserva === 'cancelada' || res.status_reserva === 'noshow') return false;

      const { startStr, endStr } = getBookingDates(res);
      return dateStr >= startStr && dateStr < endStr;
    });
  };

  // Modais e criação de reservas
  const handleOpenNewBooking = (room, date) => {
    setSelectedRoom(room);
    setSelectedDate(date);

    const checkinDateStr = formatDateKey(date);
    const checkoutDate = new Date(date);
    checkoutDate.setDate(checkoutDate.getDate() + 1); // 1 noite padrão
    const checkoutDateStr = formatDateKey(checkoutDate);

    // Preenche valor padrão com base no tipo
    const roomType = tiposQuarto.find(t => t.id_tipo_quarto === room.tipo);
    const defaultPrice = roomType ? roomType.valor_diaria_padrao : '100.00';

    setBookingForm({
      hospede: '',
      quarto: room.id_quarto,
      data_entrada_prevista: checkinDateStr + 'T14:00',
      data_saida_prevista: checkoutDateStr + 'T12:00',
      valor_diaria_aplicada: defaultPrice,
      observacoes: ''
    });
    setOpenBookingModal(true);
  };

  const handleOpenNewRoom = () => {
    setRoomForm({
      id_quarto: null,
      numero_quarto: '',
      tipo: tiposQuarto[0]?.id_tipo_quarto || '',
      status_atual: 'disponivel',
      capacidade_adultos: 2,
      capacidade_criancas: 0,
      comodidades: []
    });
    setOpenRoomModal(true);
  };

  const handleOpenEditRoom = (room) => {
    setRoomForm({
      id_quarto: room.id_quarto,
      numero_quarto: room.numero_quarto,
      tipo: room.tipo || room.tipo_id || '',
      status_atual: room.status_atual,
      capacidade_adultos: room.capacidade_adultos,
      capacidade_criancas: room.capacidade_criancas,
      comodidades: room.comodidades || []
    });
    setOpenRoomModal(true);
  };

  const handleSaveRoom = async () => {
    if (!roomForm.numero_quarto || !roomForm.tipo) {
      toast.warn('Número do quarto e Tipo são obrigatórios.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        numero_quarto: roomForm.numero_quarto,
        tipo: roomForm.tipo,
        status_atual: roomForm.status_atual,
        capacidade_adultos: parseInt(roomForm.capacidade_adultos),
        capacidade_criancas: parseInt(roomForm.capacidade_criancas),
        comodidades: roomForm.comodidades
      };
      if (roomForm.id_quarto) {
        await api.put(`/api/hotel/quartos/${roomForm.id_quarto}/`, payload);
        toast.success('Quarto atualizado com sucesso!');
      } else {
        await api.post('/api/hotel/quartos/', payload);
        toast.success('Quarto cadastrado com sucesso!');
      }
      setOpenRoomModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar quarto. Verifique se o número já existe.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComodidade = async () => {
    if (!novaComodidadeNome.trim()) return;
    try {
      setLoading(true);
      const res = await api.post('/api/hotel/comodidades/', { nome: novaComodidadeNome.trim() });
      toast.success('Comodidade cadastrada!');
      setComodidades(prev => [...prev, res.data]);
      setRoomForm(prev => ({
        ...prev,
        comodidades: [...prev.comodidades, res.data.id_comodidade]
      }));
      setNovaComodidadeNome('');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar comodidade. Talvez ela já exista.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTipoQuarto = async () => {
    if (!tipoQuartoForm.nome || !tipoQuartoForm.valor_diaria_padrao) {
      toast.warn('Nome e valor da diária são obrigatórios.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/api/hotel/tipos-quarto/', {
        ...tipoQuartoForm,
        valor_diaria_padrao: parseFloat(tipoQuartoForm.valor_diaria_padrao),
        limite_adultos: parseInt(tipoQuartoForm.limite_adultos),
        limite_criancas: parseInt(tipoQuartoForm.limite_criancas)
      });
      toast.success('Tipo de acomodação cadastrado com sucesso!');
      setTiposQuarto(prev => [...prev, res.data]);
      setRoomForm(prev => ({ ...prev, tipo: res.data.id_tipo_quarto }));
      setOpenTipoQuartoModal(false);
      setTipoQuartoForm({
        nome: '',
        descricao: '',
        valor_diaria_padrao: '',
        limite_adultos: 2,
        limite_criancas: 0
      });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar tipo de acomodação.');
    } finally {
      setLoading(false);
    }
  };

  const handleClienteCnpjChange = (value) => {
    const numbers = value.replace(/\D/g, '');
    let formatted = value;
    if (numbers.length <= 11) {
      formatted = formatCPF(value);
    } else {
      formatted = formatCNPJ(value);
    }
    setClienteForm(prev => ({ ...prev, cnpj: formatted }));
    setClienteWarning('');

    const checkNum = formatted.replace(/\D/g, '');
    if (checkNum.length === 11) {
      if (!isValidCPF(formatted)) {
        setClienteWarning('⚠️ CPF inválido');
      }
    } else if (checkNum.length === 14) {
      if (!isValidCNPJ(formatted)) {
        setClienteWarning('⚠️ CNPJ inválido');
      }
    } else if (checkNum.length > 0 && checkNum.length !== 11 && checkNum.length !== 14) {
      setClienteWarning('⚠️ CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos');
    }
  };

  const handleClienteBuscarCNPJ = async () => {
    if (!clienteForm.cnpj) {
      toast.error('Digite um CNPJ para buscar (CPF não possui busca automática)');
      return;
    }
    if (!isValidCNPJ(clienteForm.cnpj)) {
      setClienteWarning('⚠️ CNPJ inválido. A busca pode não funcionar corretamente.');
    }
    try {
      setLoadingCNPJ(true);
      setClienteError('');
      setClienteWarning('');
      const dados = await buscarCNPJ(clienteForm.cnpj);
      setClienteForm(prev => ({
        ...prev,
        cnpj: formatCNPJ(dados.cnpj),
        razao_social: dados.razao_social || '',
        nome_fantasia: dados.nome_fantasia || '',
        nome: dados.nome_fantasia || dados.razao_social || '',
        inscricao_estadual: dados.inscricao_estadual || '',
        email: dados.email || '',
        telefone: formatTelefone(dados.telefone || ''),
        cep: formatCEP(dados.cep || ''),
        endereco: dados.endereco || '',
        numero: dados.numero || '',
        complemento: dados.complemento || '',
        bairro: dados.bairro || '',
        cidade: dados.cidade || '',
        estado: dados.estado || 'SP'
      }));
      toast.success('Dados do CNPJ carregados com sucesso!');
    } catch (err) {
      setClienteError(`Erro ao buscar CNPJ: ${err.message}`);
      toast.error(`Erro ao buscar CNPJ: ${err.message}`);
    } finally {
      setLoadingCNPJ(false);
    }
  };

  const handleClienteBuscarCEP = async () => {
    if (!clienteForm.cep) {
      toast.error('Digite um CEP para buscar');
      return;
    }
    try {
      setLoadingCEP(true);
      setClienteError('');
      const dados = await buscarCEP(clienteForm.cep);
      setClienteForm(prev => ({
        ...prev,
        cep: formatCEP(dados.cep),
        endereco: dados.endereco || '',
        bairro: dados.bairro || '',
        cidade: dados.cidade || '',
        estado: dados.estado || 'SP',
        complemento: dados.complemento || ''
      }));
      toast.success('Endereço carregado com sucesso!');
    } catch (err) {
      setClienteError(`Erro ao buscar CEP: ${err.message}`);
      toast.error(`Erro ao buscar CEP: ${err.message}`);
    } finally {
      setLoadingCEP(false);
    }
  };

  const resetClienteForm = () => {
    setClienteForm({
      nome: '',
      razao_social: '',
      nome_fantasia: '',
      cnpj: '',
      inscricao_estadual: '',
      telefone: '',
      whatsapp: '',
      email: '',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: 'SP',
      data_aniversario: '',
      observacoes: '',
      limite_credito: 0,
      tipo_desconto: 'PERCENTUAL',
      valor_desconto: 0,
      percentual_arredondamento: 0,
      priorizar_desconto_cliente: false,
      grupos_excecao: [],
      sexo: ''
    });
    setClienteError('');
    setClienteWarning('');
  };

  const handleCreateCliente = async () => {
    if (!clienteForm.nome.trim()) {
      toast.warn('Nome é obrigatório');
      return;
    }
    try {
      setLoading(true);
      setClienteError('');
      const cleanCpfCnpj = clienteForm.cnpj ? clienteForm.cnpj.replace(/\D/g, '') : '';
      const dadosParaSalvar = {
        nome_razao_social: clienteForm.nome || clienteForm.razao_social || '',
        nome_fantasia: clienteForm.nome_fantasia || '',
        cpf_cnpj: cleanCpfCnpj,
        inscricao_estadual: clienteForm.inscricao_estadual || '',
        telefone: clienteForm.telefone ? clienteForm.telefone.replace(/\D/g, '') : '',
        whatsapp: clienteForm.whatsapp ? clienteForm.whatsapp.replace(/\D/g, '') : '',
        email: clienteForm.email || '',
        cep: clienteForm.cep ? clienteForm.cep.replace(/\D/g, '') : '',
        endereco: clienteForm.endereco || '',
        numero: clienteForm.numero || '',
        complemento: clienteForm.complemento || '',
        bairro: clienteForm.bairro || '',
        cidade: clienteForm.cidade || '',
        estado: clienteForm.estado || 'SP',
        data_nascimento: clienteForm.data_aniversario || null,
        observacoes: clienteForm.observacoes || '',
        limite_credito: parseFloat(clienteForm.limite_credito) || 0,
        sexo: clienteForm.sexo || null,
        tipo_desconto: clienteForm.tipo_desconto || 'PERCENTUAL',
        valor_desconto: parseFloat(clienteForm.valor_desconto) || 0,
        percentual_arredondamento: parseFloat(clienteForm.percentual_arredondamento) || 0,
        priorizar_desconto_cliente: Boolean(clienteForm.priorizar_desconto_cliente),
        grupos_excecao: Array.isArray(clienteForm.grupos_excecao) ? clienteForm.grupos_excecao : []
      };

      const res = await api.post('/api/clientes/', dadosParaSalvar);
      toast.success('Cliente cadastrado com sucesso!');
      
      const newCliente = res.data;
      setClientes(prev => [newCliente, ...prev]);
      setBookingForm(prev => ({ ...prev, hospede: newCliente.id_cliente || newCliente.id || '' }));
      setOpenClienteModal(false);
      resetClienteForm();
    } catch (err) {
      console.error('Erro ao cadastrar cliente:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Erro ao cadastrar cliente.';
      setClienteError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStatus = () => {
    if (!statusForm.label.trim()) {
      toast.warn('O nome do status é obrigatório.');
      return;
    }
    const value = statusForm.label.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9]/g, '_'); // sub caracteres especiais por _
      
    if (statusOptions.some(opt => opt.value === value)) {
      toast.warn('Um status com este nome já existe.');
      return;
    }

    const newStatus = {
      value,
      label: statusForm.label.trim(),
      color: statusForm.color
    };

    const updatedOptions = [...statusOptions, newStatus];
    setStatusOptions(updatedOptions);
    localStorage.setItem('hotel_status_options', JSON.stringify(updatedOptions));
    
    setRoomForm(prev => ({ ...prev, status_atual: value }));
    setOpenStatusModal(false);
    setStatusForm({ label: '', color: '#1a73e8' });
    toast.success('Status personalizado cadastrado!');
  };

  const handleCreateBooking = async () => {
    if (!bookingForm.hospede) {
      toast.warn('Por favor, selecione um hóspede/cliente.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/api/hotel/reservas/', {
        ...bookingForm,
        valor_diaria_aplicada: parseFloat(bookingForm.valor_diaria_aplicada)
      });
      toast.success('Reserva criada com sucesso!');
      setOpenBookingModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar reserva.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenManageBooking = (booking) => {
    setSelectedBooking(booking);
    setConsumoForm({
      produto_id: '',
      quantidade: 1,
      valor_unitario: '',
      observacao: ''
    });
    setProdutoSearch(null);
    setOpenManageModal(true);

  };

  // Operações de Hospedagem (Check-in, Lançar Consumo, Checkout)
  const handleCheckin = async (bookingId) => {
    try {
      setLoading(true);
      const res = await api.post(`/api/hotel/reservas/${bookingId}/checkin/`);
      toast.success('Check-in realizado! Quarto agora está Ocupado.');
      setOpenManageModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Erro ao realizar check-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleLancarConsumo = async (bookingId) => {
    if (!consumoForm.produto_id) {
      toast.warn('Selecione um produto.');
      return;
    }
    try {
      setLoading(true);
      await api.post(`/api/hotel/reservas/${bookingId}/lancar_consumo/`, {
        produto_id: consumoForm.produto_id,
        quantidade: parseFloat(consumoForm.quantidade),
        valor_unitario: parseFloat(consumoForm.valor_unitario),
        observacao: consumoForm.observacao
      });
      toast.success('Consumo adicionado com sucesso!');
      
      // Recarrega reserva selecionada e dados
      const updatedRes = await api.get(`/api/hotel/reservas/${bookingId}/`);
      setSelectedBooking(updatedRes.data);
      setConsumoForm({
        produto_id: '',
        quantidade: 1,
        valor_unitario: '',
        observacao: ''
      });
      setProdutoSearch(null);

      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao lançar consumo.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckout = (booking) => {
    // Tenta encontrar uma operação de venda padrão que gera financeiro
    const defaultOperacao = operacoes.find(o => o.transacao === 'Saida' && o.gera_financeiro) || 
                            operacoes.find(o => o.transacao === 'Venda') || 
                            operacoes[0] || '';
    
    // Tenta encontrar a forma de pagamento padrão (ex: DINHEIRO)
    const defaultForma = formasPagamento.find(f => f.nome_forma.toUpperCase().includes('DINHEIRO')) || 
                         formasPagamento[0] || '';
                         
    // Tenta encontrar a conta bancária padrão (ex: CAIXA)
    const defaultConta = contasBancarias.find(c => c.nome_conta.toUpperCase().includes('CAIXA')) || 
                         contasBancarias[0] || '';

    setCheckoutBooking(booking);
    setCheckoutForm({
      id_operacao: defaultOperacao ? defaultOperacao.id_operacao : '',
      id_forma_pagamento: defaultForma ? defaultForma.id_forma_pagamento : '',
      id_conta_cobranca: defaultConta ? defaultConta.id_conta_bancaria : '',
      data_vencimento: new Date().toISOString().split('T')[0],
      gerar_financeiro: true
    });
    setOpenCheckoutDialog(true);
  };

  const handleCheckout = async () => {
    if (!checkoutBooking) return;
    try {
      setLoading(true);
      const res = await api.post(`/api/hotel/reservas/${checkoutBooking.id_reserva}/checkout/`, {
        id_operacao: checkoutForm.id_operacao || undefined,
        id_forma_pagamento: checkoutForm.id_forma_pagamento || undefined,
        id_conta_cobranca: checkoutForm.id_conta_cobranca || undefined,
        data_vencimento: checkoutForm.data_vencimento,
        gerar_financeiro: checkoutForm.gerar_financeiro
      });
      setCheckoutResult(res.data);
      setOpenCheckoutDialog(false);
      setOpenManageModal(false);
      setOpenCheckoutSuccessModal(true);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Erro ao processar check-out.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintMenuOpen = (event, row) => {
    setPrintAnchorEl(event.currentTarget);
    setPrintSelectedRow(row);
  };

  const handlePrintMenuClose = () => {
    setPrintAnchorEl(null);
    setPrintSelectedRow(null);
  };

  const handlePrintComprovante = (reservaId) => {
    if (!reservaId) return;
    const url = `${api.defaults.baseURL || ''}/api/hotel/reservas/${reservaId}/imprimir_comprovante/`;
    window.open(url, '_blank');
    handlePrintMenuClose();
  };

  const handlePrintCupomVenda = async (vendaId) => {
    if (!vendaId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/vendas/${vendaId}/`);
      const dadosVenda = res.data;

      // Para vendas de hospedagem (origem HOTEL_PMS), filtrar o item de diária.
      // A hospedagem é faturada no financeiro mas não deve constar no cupom/nota fiscal.
      const CODIGOS_NAO_FISCAIS = ['DIARIA_HOTEL'];
      const itensFiscais = (dadosVenda.itens || []).filter(
        (item) => !CODIGOS_NAO_FISCAIS.includes(item.codigo_produto || item.id_produto?.codigo_produto)
      );
      const totalFiscal = itensFiscais.reduce((acc, item) => acc + parseFloat(item.valor_total || 0), 0);

      const dadosParaImprimir = {
        ...dadosVenda,
        itens: itensFiscais,
        valor_total: totalFiscal,
      };

      await imprimirDireto(dadosParaImprimir);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao buscar dados da venda para impressão.');
    } finally {
      setLoading(false);
      handlePrintMenuClose();
    }
  };


  const handleEmitFiscal = async (id, type) => {
    if (!id) return;
    try {
      setLoading(true);
      let endpoint = '';
      if (type === 'nfce') {
        endpoint = `/api/hotel/reservas/${id}/gerar_nfce/`;
      } else if (type === 'nfe') {
        endpoint = `/api/vendas/${id}/emitir_nfe/`;
      } else if (type === 'nfse') {
        endpoint = `/api/vendas/${id}/emitir_nfse/`;
      }

      const res = await api.post(endpoint);
      
      if (type === 'nfse') {
        if (res.data?.sucesso) {
          toast.success(res.data.mensagem || 'NFS-e emitida com sucesso!');
        } else {
          toast.error(res.data?.error || res.data?.mensagem || 'Erro na emissão da NFS-e.');
        }
      } else {
        toast.success(`${type.toUpperCase()} emitida com sucesso!`);
        const finalVendaId = type === 'nfce' ? res.data?.id_venda : id;
        if (finalVendaId) {
          const printUrl = type === 'nfce'
            ? `${api.defaults.baseURL || ''}/api/vendas/${finalVendaId}/imprimir_danfce/`
            : `${api.defaults.baseURL || ''}/api/vendas/${finalVendaId}/imprimir_danfe/`;
          window.open(printUrl, '_blank');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.mensagem || err.response?.data?.message || `Erro ao emitir ${type.toUpperCase()}.`);
    } finally {
      setLoading(false);
      handlePrintMenuClose();
    }
  };

  // Alterar status de limpeza do quarto
  const handleUpdateRoomStatus = async (roomId, status) => {
    try {
      setLoading(true);
      await api.post(`/api/hotel/quartos/${roomId}/alterar_status/`, { status });
      toast.success(`Quarto atualizado para ${status}.`);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao alterar status do quarto.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (prod) => {
    if (prod) {
      setProdutoSearch(prod);
      setConsumoForm(prev => ({
        ...prev,
        produto_id: prod.id_produto,
        valor_unitario: prod.preco_web || prod.preco_venda || '0.00'
      }));
    } else {
      setProdutoSearch(null);
      setConsumoForm(prev => ({ ...prev, produto_id: '', valor_unitario: '' }));
    }
  };

  // Processamento do Chat do Assistente IA
  const handleSendChatMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { sender: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      const query = text.toLowerCase();
      let reply = "";

      if (query.includes('sujo') || query.includes('limpeza')) {
        const dirtyRooms = quartos.filter(q => q.status_atual === 'sujo');
        if (dirtyRooms.length > 0) {
          reply = `Atualmente, temos ${dirtyRooms.length} quarto(s) precisando de limpeza: ${dirtyRooms.map(q => `**Quarto ${q.numero_quarto}**`).join(', ')}. Gostaria de marcar algum deles como limpo?`;
        } else {
          reply = "Todos os quartos estão limpos ou em ordem no momento! Nenhuma limpeza pendente.";
        }
      }
      else if (query.includes('livre') || query.includes('disponivel') || query.includes('disponíveis')) {
        const freeRooms = quartos.filter(q => q.status_atual === 'disponivel');
        if (freeRooms.length > 0) {
          reply = `Temos ${freeRooms.length} quarto(s) livre(s) para hospedagem: ${freeRooms.map(q => `**Quarto ${q.numero_quarto}**`).join(', ')}.`;
        } else {
          reply = "Infelizmente todos os quartos estão ocupados ou indisponíveis no momento.";
        }
      }
      else if (query.includes('ocupado') || query.includes('hospedado')) {
        const occupiedRooms = quartos.filter(q => q.status_atual === 'ocupado');
        if (occupiedRooms.length > 0) {
          reply = `Temos ${occupiedRooms.length} quarto(s) ocupado(s) agora: ${occupiedRooms.map(q => `**Quarto ${q.numero_quarto}**`).join(', ')}.`;
        } else {
          reply = "Não há hóspedes ativos em nenhum quarto no momento.";
        }
      }
      else if (query.includes('limpar quarto') || query.includes('limpar o quarto')) {
        const match = query.match(/\d+/);
        if (match) {
          const roomNum = match[0];
          const room = quartos.find(q => q.numero_quarto === roomNum);
          if (room) {
            handleUpdateRoomStatus(room.id_quarto, 'disponivel');
            reply = `Status do **Quarto ${roomNum}** alterado com sucesso para **Disponível**!`;
          } else {
            reply = `Não encontrei o Quarto ${roomNum}.`;
          }
        } else {
          reply = "Especifique o número do quarto. Exemplo: 'limpar quarto 103'.";
        }
      }
      else if (query.includes('lançar') || query.includes('lancar') || query.includes('consumo')) {
        const matchRoom = query.match(/quarto\s+(\d+)/);
        const roomNum = matchRoom ? matchRoom[0].replace('quarto ', '') : null;

        if (roomNum) {
          const room = quartos.find(q => q.numero_quarto === roomNum);
          const activeBooking = reservas.find(r => r.quarto === room?.id_quarto && r.status_reserva === 'checkin');

          if (activeBooking) {
            let prodName = "Água Mineral";
            let prodId = produtos.find(p => p.nome_produto?.toLowerCase().includes('água') || p.nome_produto?.toLowerCase().includes('agua'))?.id_produto || produtos[0]?.id_produto || 1;
            let val = 5.00;

            if (query.includes('coca') || query.includes('refrigerante') || query.includes('suco')) {
              prodName = "Refrigerante";
              prodId = produtos.find(p => p.nome_produto?.toLowerCase().includes('coca') || p.nome_produto?.toLowerCase().includes('refr'))?.id_produto || prodId;
              val = 8.00;
            } else if (query.includes('cerveja')) {
              prodName = "Cerveja Lata";
              prodId = produtos.find(p => p.nome_produto?.toLowerCase().includes('cerveja') || p.nome_produto?.toLowerCase().includes('chopp'))?.id_produto || prodId;
              val = 12.00;
            }

            api.post(`/api/hotel/reservas/${activeBooking.id_reserva}/lancar_consumo/`, {
              produto_id: prodId,
              quantidade: 1,
              valor_unitario: val,
              observacao: "Lançado via Inteligência Artificial"
            }).then(() => {
              loadData();
            });

            reply = `Lançamento efetuado! Adicionei **1x ${prodName} (R$ ${val.toFixed(2)})** na conta do quarto **${roomNum}** (Hóspede: ${activeBooking.hospede_nome}).`;
          } else {
            reply = `Não há nenhuma hospedagem ativa (check-in realizado) no **Quarto ${roomNum}** para lançar consumo.`;
          }
        } else {
          reply = "Especifique o número do quarto para o lançamento. Exemplo: 'lançar água no quarto 101'.";
        }
      }
      else if (query.includes('checkout') || query.includes('saem hoje') || query.includes('saindo')) {
        const hojeStr = new Date().toISOString().split('T')[0];
        const checkouts = reservas.filter(r => r.status_reserva === 'checkin' && r.data_saida_prevista.startsWith(hojeStr));

        if (checkouts.length > 0) {
          reply = `Temos ${checkouts.length} check-out(s) pendente(s) hoje:\n` +
            checkouts.map(r => `* **${r.hospede_nome}** no **Quarto ${r.quarto_numero}** (Extrato: R$ ${parseFloat(r.total_geral).toFixed(2)})`).join('\n');
        } else {
          reply = "Não há checkouts agendados ou ativos para hoje.";
        }
      }
      else {
        reply = `Desculpe, não consegui processar o comando "${text}". Aqui está o que eu sei fazer:\n` +
          `* Consultar quartos sujos (*"quartos sujos"*)\n` +
          `* Consultar quartos livres (*"quartos livres"*)\n` +
          `* Marcar quarto limpo (*"limpar quarto 103"*)\n` +
          `* Lançar bebidas/itens (*"lançar coca no quarto 201"*)\n` +
          `* Consultar partidas (*"quem faz checkout hoje?"*)`;
      }

      setChatMessages(prev => [...prev, { sender: 'gemini', text: reply }]);
    }, 800);
  };

  // Filtro de Reservas na aba Lista
  const filteredReservas = useMemo(() => {
    if (!searchQuery) return reservas;
    const q = searchQuery.toLowerCase();
    return reservas.filter(r =>
      r.hospede_nome?.toLowerCase().includes(q) ||
      r.quarto_numero?.includes(q) ||
      r.status_reserva?.toLowerCase().includes(q)
    );
  }, [reservas, searchQuery]);

  const renderBookingBlock = (booking, room) => {
    const isCheckin = booking.status_reserva === 'checkin';
    const isFinalizada = booking.status_reserva === 'finalizada';
    const blockBgColor = isCheckin 
      ? '#1976d2' 
      : isFinalizada 
        ? '#2e7d32' 
        : '#f57c00'; // Orange/Warning for confirmada
        
    const statusLabel = booking.status_reserva === 'checkin' 
      ? 'Hospedagem Ativa' 
      : booking.status_reserva === 'finalizada'
        ? 'Finalizada'
        : 'Reserva Confirmada';

    return (
      <Tooltip 
        title={
          <Box sx={{ p: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {booking.hospede_nome}
            </Typography>
            <Typography variant="caption" display="block">
              Quarto: {room.numero_quarto} | {room.tipo_nome}
            </Typography>
            <Typography variant="caption" display="block">
              Status: {statusLabel}
            </Typography>
            <Typography variant="caption" display="block">
              Período: {new Date(booking.data_entrada_prevista).toLocaleDateString('pt-BR')} a {new Date(booking.data_saida_prevista).toLocaleDateString('pt-BR')}
            </Typography>
          </Box>
        }
        arrow
      >
        <Box
          onClick={(e) => {
            e.stopPropagation();
            const fullBooking = reservas.find(r => r.id_reserva === booking.id_reserva);
            if (fullBooking) {
              handleOpenManageBooking(fullBooking);
            } else {
              handleOpenManageBooking(booking);
            }
          }}
          sx={{
            backgroundColor: blockBgColor,
            color: '#fff',
            p: 1,
            mx: 0.5,
            borderRadius: '6px',
            cursor: 'pointer',
            height: '80%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
            transition: 'all 0.2s ease-in-out',
            borderLeft: '4px solid rgba(255,255,255,0.4)',
            '&:hover': {
              opacity: 0.95,
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }
          }}
        >
          {booking.hospede_nome}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ display: 'flex', position: 'relative', height: '100%', overflow: 'hidden' }}>
      
      {/* Corpo Principal da Página */}
      <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* Cabeçalho */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Hotel fontSize="large" /> Módulo Hoteleiro (PMS)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerencie reservas, mapa de ocupação, governança e faturamento integrado ao Aperus.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Refresh />}
              onClick={loadData}
              disabled={loading}
            >
              Atualizar
            </Button>
            {quartos.length === 0 && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Settings />}
                onClick={handleSeedData}
                disabled={loading}
              >
                Gerar Demonstração
              </Button>
            )}
            <Button
              variant="contained"
              color="info"
              startIcon={<Chat />}
              onClick={() => setChatOpen(prev => !prev)}
            >
              Assistente IA
            </Button>
          </Box>
        </Box>

        {/* Abas */}
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Mapa de Ocupação" icon={<CalendarMonth />} iconPosition="start" />
          <Tab label="Quartos e Governança" icon={<CleaningServices />} iconPosition="start" />
          <Tab label="Listagem de Reservas" icon={<MeetingRoom />} iconPosition="start" />
        </Tabs>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <Box sx={{ flexGrow: 1 }}>
            {/* Aba 0: Mapa de Ocupação (Matrix Calendar) */}
            {activeTab === 0 && (
              <Box>
                {/* Controles de Período */}
                <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={handlePrevPeriod} color="primary">
                      <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: 200, textAlign: 'center' }}>
                      {dateRangeLabel}
                    </Typography>
                    <IconButton onClick={handleNextPeriod} color="primary">
                      <ArrowForward />
                    </IconButton>
                  </Box>
                  <Button variant="outlined" onClick={handleToday}>Ir para Hoje</Button>
                </Paper>

                {quartos.length === 0 ? (
                  <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Nenhum quarto cadastrado no sistema.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Gere os dados demonstrativos para visualizar a matriz de ocupação interativa.
                    </Typography>
                    <Button variant="contained" onClick={handleSeedData}>Gerar Dados de Demonstração</Button>
                  </Paper>
                ) : (
                  <TableContainer component={Paper} sx={{ maxHeight: 600, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 150, zIndex: 11, backgroundColor: '#f5f5f5' }}>Quarto</TableCell>
                          {daysArray.map((day, idx) => {
                            const isToday = new Date().toDateString() === day.toDateString();
                            return (
                              <TableCell
                                key={idx}
                                align="center"
                                sx={{
                                  fontWeight: 'bold',
                                  backgroundColor: isToday ? '#e3f2fd' : '#f5f5f5',
                                  color: isToday ? '#1976d2' : 'inherit',
                                  borderRight: '1px solid #e0e0e0',
                                  minWidth: 80,
                                  p: 1
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                  {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {day.getDate()}
                                </Typography>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {quartos.map((room) => (
                          <TableRow key={room.id_quarto} hover>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#fff', borderRight: '2px solid #e0e0e0' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  Quarto {room.numero_quarto}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {room.tipo_nome}
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* Células de reserva dinâmicas */}
                            {(() => {
                              const cells = [];
                              let i = 0;
                              while (i < daysArray.length) {
                                const day = daysArray[i];
                                const dateStr = formatDateKey(day);
                                const booking = getBookingForRoomAndDay(room.id_quarto, dateStr);

                                if (booking) {
                                  const { startStr, endStr } = getBookingDates(booking);

                                  // Se é a primeira aparição no calendário ou início
                                  const isFirstAppearance = (dateStr === startStr || i === 0);

                                  if (isFirstAppearance) {
                                    let colSpan = 0;
                                    let tempIdx = i;
                                    while (tempIdx < daysArray.length) {
                                      const tempDateStr = formatDateKey(daysArray[tempIdx]);
                                      if (tempDateStr >= startStr && tempDateStr < endStr) {
                                        colSpan++;
                                        tempIdx++;
                                      } else {
                                        break;
                                      }
                                    }

                                    if (colSpan === 0) colSpan = 1;

                                    cells.push(
                                      <TableCell
                                        key={booking.id_reserva}
                                        colSpan={colSpan}
                                        sx={{
                                          p: 0.5,
                                          height: 60,
                                          borderRight: '1px solid #e0e0e0',
                                          backgroundColor: 'transparent'
                                        }}
                                      >
                                        {renderBookingBlock(booking, room)}
                                      </TableCell>
                                    );
                                    i += colSpan;
                                  } else {
                                    i++;
                                  }
                                } else {
                                  cells.push(
                                    <TableCell
                                      key={dateStr}
                                      onClick={() => handleOpenNewBooking(room, day)}
                                      sx={{
                                        cursor: 'pointer',
                                        height: 60,
                                        borderRight: '1px solid rgba(224, 224, 224, 0.4)',
                                        textAlign: 'center',
                                        transition: 'background-color 0.2s',
                                        '&:hover': {
                                          backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                        }
                                      }}
                                    />
                                  );
                                  i++;
                                }
                              }
                              return cells;
                            })()}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* Aba 1: Quartos e Governança (Cards) */}
            {activeTab === 1 && (
              <Box>
                {/* Botão de Cadastro de Quarto */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={handleOpenNewRoom}
                  >
                    Cadastrar Novo Quarto
                  </Button>
                </Box>

                <Grid container spacing={3}>
                {quartos.map((room) => {
                  const statusOpt = statusOptions.find(opt => opt.value === room.status_atual);
                  let statusColor = statusOpt ? statusOpt.color : '#9e9e9e';
                  let statusText = statusOpt ? statusOpt.label : room.status_atual;
                  let icon = <CheckCircle sx={{ color: '#fff', fontSize: 32 }} />;
                  
                  if (room.status_atual === 'ocupado') {
                    icon = <Hotel sx={{ color: '#fff', fontSize: 32 }} />;
                  } else if (room.status_atual === 'sujo') {
                    icon = <CleaningServices sx={{ color: '#fff', fontSize: 32 }} />;
                  } else if (room.status_atual === 'manutencao') {
                    icon = <Build sx={{ color: '#fff', fontSize: 32 }} />;
                  } else if (statusOpt && statusOpt.value !== 'disponivel') {
                    icon = <MeetingRoom sx={{ color: '#fff', fontSize: 32 }} />;
                  }

                  // Encontra reserva ativa se ocupado
                  const activeBooking = room.status_atual === 'ocupado' 
                    ? reservas.find(r => r.quarto === room.id_quarto && r.status_reserva === 'checkin')
                    : null;

                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={room.id_quarto}>
                      <Card sx={{ borderTop: `6px solid ${statusColor}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                Quarto {room.numero_quarto}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditRoom(room)}
                                title="Editar Quarto"
                                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                              >
                                <Edit sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                            <Box sx={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {icon}
                            </Box>
                          </Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {room.tipo_nome}
                          </Typography>
                          <Chip label={statusText} size="small" sx={{ backgroundColor: `${statusColor}20`, color: statusColor, fontWeight: 'bold', mb: 2 }} />

                          {activeBooking && (
                            <Box sx={{ mt: 1, p: 1, backgroundColor: '#f9f9f9', borderRadius: '4px', borderLeft: '3px solid #1976d2' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Hóspede Atual:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{activeBooking.hospede_nome}</Typography>
                            </Box>
                          )}
                        </CardContent>
                        <Divider />
                        <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1, backgroundColor: '#fafafa', justifyContent: 'space-between' }}>
                          {room.status_atual === 'sujo' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => handleUpdateRoomStatus(room.id_quarto, 'disponivel')}
                              fullWidth
                            >
                              Concluir Limpeza
                            </Button>
                          )}
                          {room.status_atual === 'manutencao' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleUpdateRoomStatus(room.id_quarto, 'disponivel')}
                              fullWidth
                            >
                              Liberar Quarto
                            </Button>
                          )}
                          {room.status_atual === 'disponivel' && (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={() => handleUpdateRoomStatus(room.id_quarto, 'sujo')}
                              >
                                Bloquear Sujo
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                onClick={() => handleUpdateRoomStatus(room.id_quarto, 'manutencao')}
                              >
                                Manutenção
                              </Button>
                            </>
                          )}
                          {room.status_atual === 'ocupado' && activeBooking && (
                            <Button
                              size="small"
                              variant="contained"
                              color="info"
                              onClick={() => handleOpenManageBooking(activeBooking)}
                              fullWidth
                            >
                              Conta / Consumo
                            </Button>
                          )}
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

            {/* Aba 2: Listagem de Reservas (Tabela) */}
            {activeTab === 2 && (
              <Box>
                <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                  <TextField
                    label="Buscar reserva..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    sx={{ width: 300 }}
                  />
                </Box>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Cód</TableCell>
                        <TableCell>Hóspede</TableCell>
                        <TableCell>Quarto</TableCell>
                        <TableCell>Entrada Prevista</TableCell>
                        <TableCell>Saída Prevista</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Valor Diária</TableCell>
                        <TableCell align="right">Total Geral</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredReservas.map((row) => (
                        <TableRow key={row.id_reserva} hover>
                          <TableCell>{row.id_reserva}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{row.hospede_nome}</TableCell>
                          <TableCell>Qto {row.quarto_numero} ({row.tipo_quarto_nome})</TableCell>
                          <TableCell>{new Date(row.data_entrada_prevista).toLocaleString('pt-BR')}</TableCell>
                          <TableCell>{new Date(row.data_saida_prevista).toLocaleString('pt-BR')}</TableCell>
                          <TableCell>
                            {row.status_reserva === 'confirmada' && <Chip label="Confirmada" color="warning" size="small" />}
                            {row.status_reserva === 'checkin' && <Chip label="Check-in Realizado" color="info" size="small" />}
                            {row.status_reserva === 'finalizada' && <Chip label="Finalizada" color="success" size="small" />}
                            {row.status_reserva === 'cancelada' && <Chip label="Cancelada" color="error" size="small" />}
                          </TableCell>
                          <TableCell align="right">R$ {parseFloat(row.valor_diaria_aplicada).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>R$ {parseFloat(row.total_geral).toFixed(2)}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleOpenManageBooking(row)}
                              >
                                Ver Detalhes
                              </Button>
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={(e) => handlePrintMenuOpen(e, row)}
                                title="Opções de Impressão / Faturamento"
                              >
                                <Print />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredReservas.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} align="center">Nenhuma reserva localizada.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Janela Lateral do Assistente IA (Gemini Chat) */}
      {chatOpen && (
        <Paper
          elevation={4}
          sx={{
            width: 380,
            borderLeft: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: '#f8f9fa'
          }}
        >
          {/* Cabeçalho do Chat */}
          <Box sx={{ p: 2, backgroundColor: '#1976d2', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chat /> Assistente Aperus IA
            </Typography>
            <IconButton onClick={() => setChatOpen(false)} sx={{ color: '#fff' }}>
              <Close />
            </IconButton>
          </Box>

          {/* Mensagens */}
          <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {chatMessages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  backgroundColor: msg.sender === 'user' ? '#1976d2' : '#e0e0e0',
                  color: msg.sender === 'user' ? '#fff' : '#000',
                  borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                  p: 1.5,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Entrada de Texto */}
          <Divider />
          <Box sx={{ p: 1.5, backgroundColor: '#fff', display: 'flex', gap: 1 }}>
            <TextField
              placeholder="Pergunte ou comande..."
              size="small"
              fullWidth
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendChatMessage(chatInput); }}
            />
            <IconButton color="primary" onClick={() => handleSendChatMessage(chatInput)}>
              <Send />
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* Modal 1: Criar Nova Reserva */}
      <Dialog open={openBookingModal} onClose={() => setOpenBookingModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Nova Reserva - Quarto {selectedRoom?.numero_quarto}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
              <TextField
                select
                fullWidth
                label="Selecione o Hóspede (Cliente) *"
                value={bookingForm.hospede}
                onChange={e => setBookingForm(prev => ({ ...prev, hospede: e.target.value }))}
              >
                <MenuItem value="">Selecione...</MenuItem>
                {clientes.map(c => {
                  const cid = c.id_cliente || c.id;
                  return (
                    <MenuItem key={cid} value={cid}>
                      {c.nome_razao_social || c.nome}
                    </MenuItem>
                  );
                })}
              </TextField>
              <IconButton
                color="primary"
                onClick={() => {
                  resetClienteForm();
                  setOpenClienteModal(true);
                }}
                title="Cadastrar Novo Cliente"
              >
                <Add />
              </IconButton>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Data Entrada Prevista *"
                  value={bookingForm.data_entrada_prevista}
                  onChange={e => setBookingForm(prev => ({ ...prev, data_entrada_prevista: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Data Saída Prevista *"
                  value={bookingForm.data_saida_prevista}
                  onChange={e => setBookingForm(prev => ({ ...prev, data_saida_prevista: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              type="number"
              label="Valor Aplicado da Diária *"
              value={bookingForm.valor_diaria_aplicada}
              onChange={e => setBookingForm(prev => ({ ...prev, valor_diaria_aplicada: e.target.value }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observações da Reserva"
              value={bookingForm.observacoes}
              onChange={e => setBookingForm(prev => ({ ...prev, observacoes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBookingModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateBooking} disabled={loading}>Salvar Reserva</Button>
        </DialogActions>
      </Dialog>

      {/* Modal 2: Gerenciar Hospedagem (Check-in, Consumo, Checkout) */}
      <Dialog open={openManageModal} onClose={() => setOpenManageModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1976d2' }}>
          <span>Detalhamento da Hospedagem — Quarto {selectedBooking?.quarto_numero}</span>
          <Chip
            label={selectedBooking?.status_reserva === 'checkin' ? 'Hospedagem Ativa' : 'Confirmada / Reservado'}
            color={selectedBooking?.status_reserva === 'checkin' ? 'info' : 'warning'}
          />
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Resumo da Hospedagem */}
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Dados Gerais</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2"><strong>Hóspede:</strong> {selectedBooking?.hospede_nome}</Typography>
                <Typography variant="body2">
                  <strong>Entrada:</strong> {selectedBooking?.data_checkin_real ? new Date(selectedBooking.data_checkin_real).toLocaleString() : new Date(selectedBooking?.data_entrada_prevista).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Saída:</strong> {selectedBooking?.data_checkout_real ? new Date(selectedBooking.data_checkout_real).toLocaleString() : new Date(selectedBooking?.data_saida_prevista).toLocaleString()}
                </Typography>
                <Typography variant="body2"><strong>Valor Diária:</strong> R$ {parseFloat(selectedBooking?.valor_diaria_aplicada || 0).toFixed(2)}</Typography>
                {selectedBooking?.observacoes && (
                  <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    "{selectedBooking.observacoes}"
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Resumo de Extrato</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Diárias:</span>
                  <span>R$ {parseFloat(selectedBooking?.total_diarias || 0).toFixed(2)}</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Consumo:</span>
                  <span>R$ {parseFloat(selectedBooking?.total_consumo || 0).toFixed(2)}</span>
                </Typography>
                <Divider />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', color: '#1976d2' }}>
                  <span>Valor Geral:</span>
                  <span>R$ {parseFloat(selectedBooking?.total_geral || 0).toFixed(2)}</span>
                </Typography>
              </Box>

              {/* Botões de Ação do Fluxo */}
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {selectedBooking?.status_reserva === 'confirmada' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayArrow />}
                    onClick={() => handleCheckin(selectedBooking.id_reserva)}
                    fullWidth
                  >
                    Realizar Check-in
                  </Button>
                )}
                {selectedBooking?.status_reserva === 'checkin' && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<PointOfSale />}
                    onClick={() => handleOpenCheckout(selectedBooking)}
                    fullWidth
                  >
                    Realizar Check-out (Faturar)
                  </Button>
                )}
              </Box>
            </Grid>

            {/* Consumos do Quarto */}
            <Grid item xs={12} md={7} sx={{ borderLeft: { md: '1px solid #e0e0e0' } }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCart /> Lançar Consumos
              </Typography>

              {selectedBooking?.status_reserva !== 'checkin' ? (
                <Box sx={{ p: 3, backgroundColor: '#fff8e1', color: '#b78103', borderRadius: '4px', textAlign: 'center' }}>
                  <Typography variant="body2">
                    Lançamentos de frigobar/consumo só podem ser efetuados em hospedagens ativas (após check-in).
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={produtos}
                        value={produtoSearch}
                        onChange={(_, newValue) => handleSelectProduct(newValue)}
                        getOptionLabel={(option) =>
                          option ? `${option.codigo_produto} - ${option.nome_produto}` : ''
                        }
                        isOptionEqualToValue={(option, value) =>
                          option.id_produto === value?.id_produto
                        }
                        filterOptions={(options, { inputValue }) => {
                          const term = inputValue.toLowerCase();
                          return options.filter(
                            (p) =>
                              p.nome_produto?.toLowerCase().includes(term) ||
                              p.codigo_produto?.toLowerCase().includes(term)
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Buscar Produto *"
                            size="small"
                            placeholder="Digite o nome ou código do produto..."
                            InputProps={{
                              ...params.InputProps,
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props} key={option.id_produto}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {option.nome_produto}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Cód: {option.codigo_produto} &nbsp;|
                                R$ {parseFloat(option.preco_web || option.preco_venda || 0).toFixed(2)}
                              </Typography>
                            </Box>
                          </li>
                        )}
                        noOptionsText="Nenhum produto encontrado"
                        clearOnEscape
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Qtd *"
                        size="small"
                        value={consumoForm.quantidade}
                        onChange={e => setConsumoForm(prev => ({ ...prev, quantidade: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={8}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Valor Unitário *"
                        size="small"
                        value={consumoForm.valor_unitario}
                        onChange={e => setConsumoForm(prev => ({ ...prev, valor_unitario: e.target.value }))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Observação"
                        size="small"
                        value={consumoForm.observacao}
                        onChange={e => setConsumoForm(prev => ({ ...prev, observacao: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleLancarConsumo(selectedBooking.id_reserva)}
                        fullWidth
                      >
                        Adicionar Item à Conta
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>Itens Lançados</Typography>
              <TableContainer sx={{ maxHeight: 200 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell align="center">Qtd</TableCell>
                      <TableCell align="right">Unitário</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedBooking?.consumos && selectedBooking.consumos.length > 0 ? (
                      selectedBooking.consumos.map((c) => (
                        <TableRow key={c.id_consumo}>
                          <TableCell>{c.produto_nome}</TableCell>
                          <TableCell align="center">{parseFloat(c.quantidade).toFixed(0)}</TableCell>
                          <TableCell align="right">R$ {parseFloat(c.valor_unitario).toFixed(2)}</TableCell>
                          <TableCell align="right">R$ {parseFloat(c.valor_total).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" color="text.secondary">Nenhum consumo lançado.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenManageModal(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Faturamento & Confirmação de Checkout */}
      <Dialog open={openCheckoutDialog} onClose={() => setOpenCheckoutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5, color: '#2e7d32' }}>
          <PointOfSale sx={{ fontSize: 28 }} />
          <span>Faturamento de Checkout</span>
        </DialogTitle>
        <DialogContent dividers>
          {/* Extrato Simplificado */}
          <Paper elevation={0} sx={{ p: 2.5, backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '8px', mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
              Resumo da Hospedagem
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" color="text.secondary">Hóspede:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{checkoutBooking?.hospede_nome}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" color="text.secondary">Quarto:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Quarto {checkoutBooking?.quarto_numero}</Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Total Diárias:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  R$ {parseFloat(checkoutBooking?.total_diarias || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Total Consumos:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  R$ {parseFloat(checkoutBooking?.total_consumo || 0).toFixed(2)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>Valor Geral:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1b5e20' }}>
                  R$ {parseFloat(checkoutBooking?.total_geral || 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Opções Financeiras */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checkoutForm.gerar_financeiro}
                  onChange={(e) => setCheckoutForm(prev => ({ ...prev, gerar_financeiro: e.target.checked }))}
                  color="success"
                />
              }
              label={<strong>Gerar lançamento financeiro (Contas a Receber) no ERP?</strong>}
            />

            {checkoutForm.gerar_financeiro && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pl: 2, borderLeft: '3px solid #2e7d32', mt: 1 }}>
                <TextField
                  select
                  fullWidth
                  label="Operação *"
                  value={checkoutForm.id_operacao}
                  onChange={(e) => setCheckoutForm(prev => ({ ...prev, id_operacao: e.target.value }))}
                >
                  <MenuItem value="">Selecione...</MenuItem>
                  {operacoes.map(op => (
                    <MenuItem key={op.id_operacao} value={op.id_operacao}>
                      {op.nome_operacao} ({op.transacao})
                    </MenuItem>
                  ))}
                </TextField>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Forma de Pagamento *"
                      value={checkoutForm.id_forma_pagamento}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, id_forma_pagamento: e.target.value }))}
                    >
                      <MenuItem value="">Selecione...</MenuItem>
                      {formasPagamento.map(f => (
                        <MenuItem key={f.id_forma_pagamento} value={f.id_forma_pagamento}>
                          {f.nome_forma}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Conta Bancária (Cobrança) *"
                      value={checkoutForm.id_conta_cobranca}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, id_conta_cobranca: e.target.value }))}
                    >
                      <MenuItem value="">Selecione...</MenuItem>
                      {contasBancarias.map(c => (
                        <MenuItem key={c.id_conta_bancaria} value={c.id_conta_bancaria}>
                          {c.nome_conta}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  type="date"
                  label="Data de Vencimento *"
                  value={checkoutForm.data_vencimento}
                  onChange={(e) => setCheckoutForm(prev => ({ ...prev, data_vencimento: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />

                {checkoutForm.data_vencimento === new Date().toISOString().split('T')[0] ? (
                  <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                    <strong>Baixa Automática Ativada:</strong> Como o vencimento é hoje, esta conta será lançada diretamente como <strong>Paga</strong>.
                  </Alert>
                ) : (
                  <Alert severity="warning" variant="outlined" sx={{ mt: 1 }}>
                    <strong>Conta Pendente:</strong> Como o vencimento é futuro, a conta será registrada como <strong>Pendente</strong> no Contas a Receber.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenCheckoutDialog(false)} color="inherit">Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleCheckout}
            disabled={loading}
            startIcon={<CheckCircle />}
          >
            Finalizar Checkout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal 3: Sucesso do Check-out & Faturamento */}
      <Dialog open={openCheckoutSuccessModal} onClose={() => setOpenCheckoutSuccessModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
          <CheckCircle color="success" sx={{ fontSize: 60, mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Checkout Concluído!</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body1" gutterBottom>
            A hospedagem foi finalizada e o faturamento enviado ao Aperus ERP.
          </Typography>
          
          <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', my: 2, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
            <Typography variant="body2" color="text.secondary">Valor Total Faturado:</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32', my: 0.5 }}>
              R$ {parseFloat(checkoutResult?.faturamento_total || 0).toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              <strong>Venda ID:</strong> #{checkoutResult?.venda_id}
            </Typography>
          </Paper>

          {checkoutResult?.venda_id && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5, textAlign: 'left' }}>
                Opções de Impressão / Emissão:
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Print />}
                onClick={() => handlePrintComprovante(checkoutBooking?.id_reserva)}
                sx={{ textTransform: 'none' }}
              >
                Comprovante de Hospedagem
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Print />}
                onClick={() => handlePrintCupomVenda(checkoutResult.venda_id)}
                sx={{ textTransform: 'none' }}
              >
                Imprimir Cupom/Venda
              </Button>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={() => handleEmitFiscal(checkoutBooking?.id_reserva, 'nfce')}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  NFC-e
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => handleEmitFiscal(checkoutResult.venda_id, 'nfe')}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  NF-e
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="warning"
                  onClick={() => handleEmitFiscal(checkoutResult.venda_id, 'nfse')}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  NFS-e
                </Button>
              </Box>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            O quarto foi marcado como "Sujo" e adicionado à fila da governança.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" color="inherit" onClick={() => setOpenCheckoutSuccessModal(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Cadastrar / Editar Quarto */}
      <Dialog open={openRoomModal} onClose={() => setOpenRoomModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          {roomForm.id_quarto ? `Editar Quarto ${roomForm.numero_quarto}` : 'Cadastrar Novo Quarto'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
            <TextField
              fullWidth
              label="Número do Quarto *"
              value={roomForm.numero_quarto}
              onChange={e => setRoomForm(prev => ({ ...prev, numero_quarto: e.target.value }))}
              placeholder="Ex: 101"
            />

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
              <TextField
                select
                fullWidth
                label="Tipo de Acomodação *"
                value={roomForm.tipo}
                onChange={e => setRoomForm(prev => ({ ...prev, tipo: e.target.value }))}
                sx={{ flexGrow: 1 }}
              >
                <MenuItem value="">Selecione...</MenuItem>
                {tiposQuarto.map(t => (
                  <MenuItem key={t.id_tipo_quarto} value={t.id_tipo_quarto}>
                    {t.nome} (R$ {parseFloat(t.valor_diaria_padrao).toFixed(2)})
                  </MenuItem>
                ))}
              </TextField>
              <IconButton 
                color="primary" 
                onClick={() => setOpenTipoQuartoModal(true)}
                title="Cadastrar Novo Tipo de Acomodação"
              >
                <Add />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
              <TextField
                select
                fullWidth
                label="Status Atual *"
                value={roomForm.status_atual}
                onChange={e => setRoomForm(prev => ({ ...prev, status_atual: e.target.value }))}
                sx={{ flexGrow: 1 }}
              >
                {statusOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: opt.color }} />
                      {opt.label}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
              <IconButton 
                color="primary" 
                onClick={() => setOpenStatusModal(true)}
                title="Cadastrar Novo Status Personalizado"
              >
                <Add />
              </IconButton>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Lim. Adultos"
                  value={roomForm.capacidade_adultos}
                  onChange={e => setRoomForm(prev => ({ ...prev, capacidade_adultos: e.target.value }))}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Lim. Crianças"
                  value={roomForm.capacidade_criancas}
                  onChange={e => setRoomForm(prev => ({ ...prev, capacidade_criancas: e.target.value }))}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoomModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveRoom} disabled={loading}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Cadastrar Novo Tipo de Quarto */}
      <Dialog open={openTipoQuartoModal} onClose={() => setOpenTipoQuartoModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Cadastrar Tipo de Acomodação
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Nome do Tipo *"
              value={tipoQuartoForm.nome}
              onChange={e => setTipoQuartoForm(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Suíte Presidencial"
            />
            <TextField
              fullWidth
              label="Descrição"
              value={tipoQuartoForm.descricao}
              onChange={e => setTipoQuartoForm(prev => ({ ...prev, descricao: e.target.value }))}
              multiline
              rows={2}
              placeholder="Ex: Quarto com cama super king, jacuzzi e vista para o mar"
            />
            <TextField
              fullWidth
              type="number"
              label="Valor da Diária Padrão *"
              value={tipoQuartoForm.valor_diaria_padrao}
              onChange={e => setTipoQuartoForm(prev => ({ ...prev, valor_diaria_padrao: e.target.value }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Lim. Adultos"
                  value={tipoQuartoForm.limite_adultos}
                  onChange={e => setTipoQuartoForm(prev => ({ ...prev, limite_adultos: e.target.value }))}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Lim. Crianças"
                  value={tipoQuartoForm.limite_criancas}
                  onChange={e => setTipoQuartoForm(prev => ({ ...prev, limite_criancas: e.target.value }))}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTipoQuartoModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateTipoQuarto} disabled={loading}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Cadastrar Novo Status */}
      <Dialog open={openStatusModal} onClose={() => setOpenStatusModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Cadastrar Status Personalizado
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Nome do Status *"
              value={statusForm.label}
              onChange={e => setStatusForm(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Ex: Interditado"
            />
            <Typography variant="subtitle2" color="text.secondary">
              Selecione a Cor do Status:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['#4caf50', '#f44336', '#ff9800', '#9e9e9e', '#1a73e8', '#9c27b0', '#e91e63', '#00bcd4', '#3f51b5', '#ffeb3b'].map(color => (
                <IconButton
                  key={color}
                  onClick={() => setStatusForm(prev => ({ ...prev, color }))}
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: color,
                    border: statusForm.color === color ? '3px solid #000' : 'none',
                    '&:hover': {
                      backgroundColor: color,
                      opacity: 0.8
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateStatus} disabled={loading}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Cadastrar Novo Cliente */}
      <Dialog open={openClienteModal} onClose={() => setOpenClienteModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Cadastrar Novo Cliente
        </DialogTitle>
        <DialogContent dividers>
          {clienteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {clienteError}
            </Alert>
          )}
          {clienteWarning && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {clienteWarning}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Seção: CPF/CNPJ */}
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="CPF ou CNPJ"
                value={clienteForm.cnpj}
                onChange={e => handleClienteCnpjChange(e.target.value)}
                placeholder="00.000.000/0000-00 ou 000.000.000-00"
                inputProps={{ maxLength: 18 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClienteBuscarCNPJ}
                disabled={loadingCNPJ}
                startIcon={loadingCNPJ ? <CircularProgress size={20} /> : <DownloadIcon />}
                sx={{ height: '56px' }}
              >
                Buscar CNPJ
              </Button>
            </Grid>

            {/* Seção: Identificação */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Razão Social"
                value={clienteForm.razao_social}
                onChange={e => setClienteForm(prev => ({ ...prev, razao_social: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome Fantasia"
                value={clienteForm.nome_fantasia}
                onChange={e => setClienteForm(prev => ({ ...prev, nome_fantasia: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome do Hóspede (Cliente) *"
                value={clienteForm.nome}
                onChange={e => setClienteForm(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Inscrição Estadual"
                value={clienteForm.inscricao_estadual}
                onChange={e => setClienteForm(prev => ({ ...prev, inscricao_estadual: e.target.value }))}
              />
            </Grid>

            {/* Seção: Limite de Crédito */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CreditCardIcon />
                Limite de Crédito
              </Typography>
              <Divider />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Limite de Crédito"
                type="number"
                value={clienteForm.limite_credito}
                onChange={e => setClienteForm(prev => ({ ...prev, limite_credito: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Valor máximo em aberto para este cliente"
              />
            </Grid>

            {/* Seção: Descontos Inteligentes */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Send />
                Descontos Inteligentes
              </Typography>
              <Divider />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Desconto</InputLabel>
                <Select
                  value={clienteForm.tipo_desconto}
                  label="Tipo de Desconto"
                  onChange={e => setClienteForm(prev => ({ ...prev, tipo_desconto: e.target.value }))}
                >
                  <MenuItem value="PERCENTUAL">Percentual (%)</MenuItem>
                  <MenuItem value="FIXO">Fixo (R$)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Valor do Desconto"
                type="number"
                value={clienteForm.valor_desconto}
                onChange={e => setClienteForm(prev => ({ ...prev, valor_desconto: e.target.value }))}
                inputProps={{ min: 0, step: 0.01 }}
                helperText={clienteForm.tipo_desconto === 'PERCENTUAL' ? 'Valor em %' : 'Valor em R$'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Arredondamento (%)"
                type="number"
                value={clienteForm.percentual_arredondamento}
                onChange={e => setClienteForm(prev => ({ ...prev, percentual_arredondamento: e.target.value }))}
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Margem de ajuste permitida"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(clienteForm.priorizar_desconto_cliente)}
                    onChange={e => setClienteForm(prev => ({ ...prev, priorizar_desconto_cliente: e.target.checked }))}
                  />
                }
                label="Priorizar desconto do cliente"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Grupos de Exceção</InputLabel>
                <Select
                  multiple
                  value={clienteForm.grupos_excecao || []}
                  onChange={e => {
                    const val = Array.isArray(e.target.value) ? e.target.value : [];
                    setClienteForm(prev => ({ ...prev, grupos_excecao: val.map(Number) }));
                  }}
                  label="Grupos de Exceção"
                  renderValue={selected => {
                    const selectedArray = Array.isArray(selected) ? selected : [];
                    if (selectedArray.length === 0) return <em style={{ color: '#aaa' }}>Nenhum grupo selecionado</em>;
                    const nomes = gruposProduto
                      .filter(grupo => {
                        const gid = grupo.id_grupo || grupo.id;
                        return selectedArray.map(Number).includes(Number(gid));
                      })
                      .map(grupo => grupo.nome_grupo || grupo.nome);
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {nomes.map(nome => (
                          <Chip key={nome} label={nome} size="small" sx={{ backgroundColor: '#1565C0', color: 'white', fontSize: '0.75rem' }} />
                        ))}
                      </Box>
                    );
                  }}
                >
                  {gruposProduto.map(grupo => {
                    const gid = grupo.id_grupo || grupo.id;
                    const isChecked = Array.isArray(clienteForm.grupos_excecao) &&
                      clienteForm.grupos_excecao.map(Number).includes(Number(gid));
                    return (
                      <MenuItem key={gid} value={Number(gid)}>
                        <Checkbox checked={isChecked} readOnly />
                        <Typography>{grupo.nome_grupo || grupo.nome}</Typography>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              {Array.isArray(clienteForm.grupos_excecao) && clienteForm.grupos_excecao.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {clienteForm.grupos_excecao.map(gid => {
                    const grupo = gruposProduto.find(g => Number(g.id_grupo || g.id) === Number(gid));
                    const nome = grupo ? (grupo.nome_grupo || grupo.nome) : `Grupo #${gid}`;
                    return (
                      <Chip
                        key={gid}
                        label={nome}
                        size="small"
                        onDelete={() => {
                          setClienteForm(prev => ({
                            ...prev,
                            grupos_excecao: prev.grupos_excecao.filter(id => Number(id) !== Number(gid))
                          }));
                        }}
                        sx={{ backgroundColor: '#E3F2FD', color: '#1565C0', fontWeight: 'bold', border: '1px solid #90CAF9' }}
                      />
                    );
                  })}
                </Box>
              )}
            </Grid>

            {/* Seção: Contato */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon />
                Contato
              </Typography>
              <Divider />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={clienteForm.telefone}
                onChange={e => setClienteForm(prev => ({ ...prev, telefone: formatTelefone(e.target.value) }))}
                placeholder="(00) 0000-0000"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="WhatsApp"
                value={clienteForm.whatsapp}
                onChange={e => setClienteForm(prev => ({ ...prev, whatsapp: formatTelefone(e.target.value) }))}
                placeholder="(00) 00000-0000"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WhatsAppIcon color="success" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={clienteForm.email}
                onChange={e => setClienteForm(prev => ({ ...prev, email: e.target.value }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Data de Aniversário"
                type="date"
                value={clienteForm.data_aniversario}
                onChange={e => setClienteForm(prev => ({ ...prev, data_aniversario: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CakeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Sexo</InputLabel>
                <Select
                  value={clienteForm.sexo}
                  onChange={e => setClienteForm(prev => ({ ...prev, sexo: e.target.value }))}
                  label="Sexo"
                >
                  <MenuItem value="">Não informado</MenuItem>
                  <MenuItem value="M">Masculino</MenuItem>
                  <MenuItem value="F">Feminino</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Seção: Endereço */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon />
                Endereço
              </Typography>
              <Divider />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="CEP"
                value={clienteForm.cep}
                onChange={e => setClienteForm(prev => ({ ...prev, cep: formatCEP(e.target.value) }))}
                placeholder="00000-000"
                inputProps={{ maxLength: 9 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClienteBuscarCEP}
                disabled={loadingCEP}
                startIcon={loadingCEP ? <CircularProgress size={20} /> : <DownloadIcon />}
                sx={{ height: '56px' }}
              >
                Buscar CEP
              </Button>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Endereço"
                value={clienteForm.endereco}
                onChange={e => setClienteForm(prev => ({ ...prev, endereco: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Número"
                value={clienteForm.numero}
                onChange={e => setClienteForm(prev => ({ ...prev, numero: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Complemento"
                value={clienteForm.complemento}
                onChange={e => setClienteForm(prev => ({ ...prev, complemento: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bairro"
                value={clienteForm.bairro}
                onChange={e => setClienteForm(prev => ({ ...prev, bairro: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Cidade"
                value={clienteForm.cidade}
                onChange={e => setClienteForm(prev => ({ ...prev, cidade: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={clienteForm.estado}
                  label="Estado"
                  onChange={e => setClienteForm(prev => ({ ...prev, estado: e.target.value }))}
                >
                  {ESTADOS_BRASIL.map(estado => (
                    <MenuItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={clienteForm.observacoes}
                onChange={e => setClienteForm(prev => ({ ...prev, observacoes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenClienteModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateCliente} disabled={loading}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={printAnchorEl}
        open={Boolean(printAnchorEl)}
        onClose={handlePrintMenuClose}
      >
        <MenuItem onClick={() => handlePrintComprovante(printSelectedRow?.id_reserva)}>
          Imprimir Comprovante de Hospedagem
        </MenuItem>
        <MenuItem 
          onClick={() => handlePrintCupomVenda(printSelectedRow?.venda)}
          disabled={!printSelectedRow?.venda}
        >
          Imprimir Cupom/Venda
        </MenuItem>
        <MenuItem 
          onClick={() => handleEmitFiscal(printSelectedRow?.id_reserva, 'nfce')}
          disabled={!printSelectedRow?.venda}
        >
          Emitir/Imprimir NFC-e
        </MenuItem>
        <MenuItem 
          onClick={() => handleEmitFiscal(printSelectedRow?.venda, 'nfe')}
          disabled={!printSelectedRow?.venda}
        >
          Emitir/Imprimir NF-e
        </MenuItem>
        <MenuItem 
          onClick={() => handleEmitFiscal(printSelectedRow?.venda, 'nfse')}
          disabled={!printSelectedRow?.venda}
        >
          Emitir/Imprimir NFS-e
        </MenuItem>
      </Menu>

    </Box>
  );
}
