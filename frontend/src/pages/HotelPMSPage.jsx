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
  Fab
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
  Edit
} from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function HotelPMSPage() {
  // Dados principais
  const [tiposQuarto, setTiposQuarto] = useState([]);
  const [quartos, setQuartos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);

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
    capacidade_criancas: 0
  });

  // Seleções para criação/gerenciamento
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [checkoutResult, setCheckoutResult] = useState(null);

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
      const [tiposRes, quartosRes, reservasRes, clientesRes, produtosRes] = await Promise.all([
        api.get('/api/hotel/tipos-quarto/'),
        api.get('/api/hotel/quartos/'),
        api.get('/api/hotel/reservas/'),
        api.get('/api/clientes/'),
        api.get('/api/produtos/')
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

  const getBookingForRoomAndDay = (roomId, dateStr) => {
    return reservas.find(res => {
      if (res.quarto !== roomId && res.quarto?.id_quarto !== roomId) return false;
      if (res.status_reserva === 'cancelada') return false;
      const startStr = res.data_entrada_prevista.split('T')[0];
      const endStr = res.data_saida_prevista.split('T')[0];
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
      capacidade_criancas: 0
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
      capacidade_criancas: room.capacidade_criancas
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
      if (roomForm.id_quarto) {
        await api.put(`/api/hotel/quartos/${roomForm.id_quarto}/`, {
          numero_quarto: roomForm.numero_quarto,
          tipo: roomForm.tipo,
          status_atual: roomForm.status_atual,
          capacidade_adultos: parseInt(roomForm.capacidade_adultos),
          capacidade_criancas: parseInt(roomForm.capacidade_criancas)
        });
        toast.success('Quarto atualizado com sucesso!');
      } else {
        await api.post('/api/hotel/quartos/', {
          numero_quarto: roomForm.numero_quarto,
          tipo: roomForm.tipo,
          status_atual: roomForm.status_atual,
          capacidade_adultos: parseInt(roomForm.capacidade_adultos),
          capacidade_criancas: parseInt(roomForm.capacidade_criancas)
        });
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
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao lançar consumo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (bookingId) => {
    if (!window.confirm('Confirma a saída do hóspede? Isso gerará a fatura de venda e finanças no ERP Aperus.')) return;
    try {
      setLoading(true);
      const res = await api.post(`/api/hotel/reservas/${bookingId}/checkout/`);
      setCheckoutResult(res.data);
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

  const handleSelectProduct = (prodId) => {
    const prod = produtos.find(p => p.id_produto === prodId);
    if (prod) {
      setConsumoForm(prev => ({
        ...prev,
        produto_id: prodId,
        valor_unitario: prod.preco_web || prod.preco_venda || '0.00'
      }));
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
                                  const startStr = booking.data_entrada_prevista.split('T')[0];
                                  const endStr = booking.data_saida_prevista.split('T')[0];

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
                  let statusColor = '#4caf50'; // disponivel
                  let statusText = 'Disponível';
                  let icon = <CheckCircle sx={{ color: '#fff', fontSize: 32 }} />;
                  
                  if (room.status_atual === 'ocupado') {
                    statusColor = '#f44336';
                    statusText = 'Ocupado';
                    icon = <Hotel sx={{ color: '#fff', fontSize: 32 }} />;
                  } else if (room.status_atual === 'sujo') {
                    statusColor = '#ff9800';
                    statusText = 'Sujo / Faxina';
                    icon = <CleaningServices sx={{ color: '#fff', fontSize: 32 }} />;
                  } else if (room.status_atual === 'manutencao') {
                    statusColor = '#9e9e9e';
                    statusText = 'Manutenção';
                    icon = <Build sx={{ color: '#fff', fontSize: 32 }} />;
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
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleOpenManageBooking(row)}
                            >
                              Ver Detalhes
                            </Button>
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
            <TextField
              select
              fullWidth
              label="Selecione o Hóspede (Cliente) *"
              value={bookingForm.hospede}
              onChange={e => setBookingForm(prev => ({ ...prev, hospede: e.target.value }))}
            >
              <MenuItem value="">Selecione...</MenuItem>
              {clientes.map(c => (
                <MenuItem key={c.id_cliente} value={c.id_cliente}>
                  {c.nome_razao_social}
                </MenuItem>
              ))}
            </TextField>

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
                    onClick={() => handleCheckout(selectedBooking.id_reserva)}
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
                      <TextField
                        select
                        fullWidth
                        label="Selecione o Produto *"
                        value={consumoForm.produto_id}
                        onChange={e => handleSelectProduct(e.target.value)}
                        size="small"
                      >
                        <MenuItem value="">Selecione...</MenuItem>
                        {produtos.map(p => (
                          <MenuItem key={p.id_produto} value={p.id_produto}>
                            {p.codigo_produto} - {p.nome_produto}
                          </MenuItem>
                        ))}
                      </TextField>
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
          
          <Paper elevation={0} sx={{ p: 2, bgColor: '#f5f5f5', my: 2, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
            <Typography variant="body2" color="text.secondary">Valor Total Faturado:</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32', my: 0.5 }}>
              R$ {parseFloat(checkoutResult?.faturamento_total || 0).toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              <strong>Venda ID:</strong> #{checkoutResult?.venda_id}
            </Typography>
          </Paper>

          <Typography variant="caption" color="text.secondary">
            O quarto foi marcado como "Sujo" e adicionado à fila da governança.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" color="primary" onClick={() => setOpenCheckoutSuccessModal(false)}>
            Ok, Voltar
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

            <TextField
              select
              fullWidth
              label="Tipo de Acomodação *"
              value={roomForm.tipo}
              onChange={e => setRoomForm(prev => ({ ...prev, tipo: e.target.value }))}
            >
              <MenuItem value="">Selecione...</MenuItem>
              {tiposQuarto.map(t => (
                <MenuItem key={t.id_tipo_quarto} value={t.id_tipo_quarto}>
                  {t.nome} (R$ {parseFloat(t.valor_diaria_padrao).toFixed(2)})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Status Atual *"
              value={roomForm.status_atual}
              onChange={e => setRoomForm(prev => ({ ...prev, status_atual: e.target.value }))}
            >
              <MenuItem value="disponivel">Disponível</MenuItem>
              <MenuItem value="ocupado">Ocupado</MenuItem>
              <MenuItem value="sujo">Sujo / Faxina</MenuItem>
              <MenuItem value="manutencao">Manutenção</MenuItem>
            </TextField>

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

    </Box>
  );
}
