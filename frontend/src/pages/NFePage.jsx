import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  CircularProgress, 
  Chip, 
  Alert,
  IconButton,
  Tooltip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  AppBar,
  Toolbar,
  Slide,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { 
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  CleaningServices as CleanIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  LocalShipping as SaidaIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  FilterList as FilterListIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { useNavigate } from 'react-router-dom';
import Vendas from '../components/Vendas';
import WhatsAppQuickSend, { useWhatsAppTemplates } from '../components/WhatsAppQuickSend';
import CartaCorrecaoDialog from '../components/CartaCorrecaoDialog';
import ComplementoICMSDialog from '../components/ComplementoICMSDialog';
import EmailDocumentoDialog from '../components/EmailDocumentoDialog';

const NFePage = () => {
    const theme = useTheme();
    const { axiosInstance } = useAuth();
    const navigate = useNavigate();
    const templates = useWhatsAppTemplates();
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Carregar período salvo do localStorage ou usar 30 dias como padrão
    const _hoje = new Date();
    const _pad = (n) => String(n).padStart(2, '0');
    const _fmtDate = (d) => `${d.getFullYear()}-${_pad(d.getMonth()+1)}-${_pad(d.getDate())}`;
    
    const periodoSalvo = String(localStorage.getItem('nfe_periodo_rapido') || '30');
    const calcularDatas = (dias) => {
        const diasStr = String(dias || '30');
        const hoje = new Date();
        if (diasStr === 'tudo') {
            return { inicio: '2020-01-01', fim: _fmtDate(hoje) };
        }
        const inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - parseInt(diasStr, 10));
        return { inicio: _fmtDate(inicio), fim: _fmtDate(hoje) };
    };
    
    const datasIniciais = calcularDatas(periodoSalvo);
    
    // Filtros
    const [filterDateStart, setFilterDateStart] = useState(datasIniciais.inicio);
    const [filterDateEnd, setFilterDateEnd] = useState(datasIniciais.fim);
    const [searchTerm, setSearchTerm] = useState('');
    const [periodoRapido, setPeriodoRapido] = useState(String(periodoSalvo));
    const [filtrosExpanded, setFiltrosExpanded] = useState(false);

    // Filtra localmente por nome, número do documento ou valor
    const filteredVendas = vendas.filter((v) => {
        if (!searchTerm || !String(searchTerm).trim()) return true;
        const term = String(searchTerm).toLowerCase().trim();
        const nome = String(v.cliente || v.nome_cliente || '').toLowerCase();
        const numDoc = String(v.numero_documento || v.numero_nfe || v.id || '').toLowerCase();
        const valor = parseFloat(v.valor_total || 0).toFixed(2);
        return nome.includes(term) || numDoc.includes(term) || valor.includes(term);
    });

    // Aplica período rápido: calcula datas, salva no localStorage e recarrega
    const handlePeriodoRapido = (dias) => {
        const diasStr = String(dias || '30');
        setPeriodoRapido(diasStr);
        localStorage.setItem('nfe_periodo_rapido', diasStr); // Salvar preferência
        const datas = calcularDatas(diasStr);
        setFilterDateStart(datas.inicio);
        setFilterDateEnd(datas.fim);
    };

    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState(null);
    const { showToast } = useToast();

    // Estados para DIALOG de Cancelamento/Inutilização
    const [actionDialog, setActionDialog] = useState({ open: false, type: null, venda: null });
    const [justificativa, setJustificativa] = useState('');

    // Estado para Dialog de Erro
    const [errorDialog, setErrorDialog] = useState({ open: false, message: '' });

    // Estado para Menu de Ações
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuVenda, setMenuVenda] = useState(null);
    const [openNewDialog, setOpenNewDialog] = useState(false);
    
    // Estados para Carta de Correção e Complemento ICMS
    const [cartaCorrecaoDialog, setCartaCorrecaoDialog] = useState({ open: false, venda: null });
    const [complementoICMSDialog, setComplementoICMSDialog] = useState({ open: false, venda: null });
    const [emailDialog, setEmailDialog] = useState({ open: false, venda: null });
    const [expandedRows, setExpandedRows] = useState(new Set());
    const toggleRow = (id) => setExpandedRows(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const handleMenuOpen = (event, venda) => {
        setAnchorEl(event.currentTarget);
        setMenuVenda(venda);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuVenda(null);
    };

    // Função principal de busca
    const fetchVendas = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("🔍 Buscando vendas NF-e (modelo=55)...");
            
            const params = {
                ordering: '-id_venda',
                page_size: 100,
                page: 1,
                modelo: '55' 
            };

            if (filterDateStart) params.data_inicial = filterDateStart;
            if (filterDateEnd) params.data_final = filterDateEnd;

            const response = await axiosInstance.get('/vendas/', { params });

            console.log("📦 Resposta recebida:", response.data);

            if (typeof response.data === 'string' && response.data.trim().startsWith('<!doctype html>')) {
                 throw new Error("Recebido HTML em vez de JSON. Verifique a URL da API.");
            }

            let data = [];
            if (response.data && Array.isArray(response.data.results)) {
                data = response.data.results;
            } else if (Array.isArray(response.data)) {
                data = response.data;
            } else {
                console.warn("⚠️ Formato de resposta inesperado:", response.data);
            }

            setVendas(data);
            
            if (data.length === 0) {
                console.log("ℹ️ Nenhuma venda retornada pelo backend.");
            }

        } catch (err) {
            console.error("❌ Erro ao buscar vendas:", err);
            const msg = err.message || "Erro desconhecido";
            setError(`Não foi possível carregar a lista de vendas. (${msg})`);
            showToast('Erro ao carregar vendas', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Função de emissão
    const handleEmitirNFe = async (vendaId) => {
        if (processingId) return;
        
        setProcessingId(vendaId);
        showToast('Solicitando emissão de NF-e...', 'info');
        
        try {
            const response = await axiosInstance.post(`/vendas/${vendaId}/emitir_nfe/`);
            
            console.log("✅ Emissão concluída:", response.data);
            
            const msg = response.data.message || 'NF-e Emitida com Sucesso!';
            showToast(msg, 'success');
            
            fetchVendas();
            
        } catch (err) {
            console.error("❌ Erro na emissão:", err);
            const errorMsg = err.response?.data?.details || err.response?.data?.error || err.response?.data?.message || 'Erro desconhecido ao emitir';
            showToast(`Erro na emissão: ${errorMsg}`, 'error');
            fetchVendas();
        } finally {
            setProcessingId(null);
        }
    };

    // --- FUNÇÕES DE ERRO E LIMPEZA ---
    
    // Abrir Dialog de Erro
    const handleViewError = () => {
        if (!menuVenda) return;
        const msg = menuVenda.mensagem_nfe || menuVenda.mensagem_erro || menuVenda.observacao_fisco || "Nenhuma mensagem de erro registrada.";
        setErrorDialog({ open: true, message: msg });
        handleMenuClose();
    };

    // Limpar XML/Erro
    const handleClearError = async () => {
        if (!menuVenda) return;
        const id = menuVenda.id_venda || menuVenda.id;
        
        handleMenuClose();
        
        if (!confirm(`Deseja limpar o status de erro da NF-e #${id}?\nIsso permitirá tentar emitir novamente ou excluir.\nStatus Erro/Rejeição será removido.`)) {
            return;
        }

        setProcessingId(id);
        try {
            await axiosInstance.post(`/vendas/${id}/limpar_nfe_erro/`);
            showToast('✅ Status de erro da NF-e limpo com sucesso!', 'success');
            fetchVendas();
        } catch (err) {
            console.error("Erro ao limpar venda:", err);
            showToast('Erro ao limpar status da venda.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    // Função de Exclusão de Venda (Apenas Pendente)
    const handleDeleteVenda = async () => {
        if (!menuVenda) return;
        
        // Validação de Status
        const status = (menuVenda.status_nfe || 'PENDENTE').toUpperCase();
        if (status !== 'PENDENTE') {
             showToast('Ação Bloqueada: Apenas vendas com status PENDENTE podem ser excluídas.', 'warning');
             handleMenuClose();
             return;
        }

        const id = menuVenda.id_venda || menuVenda.id;

        if (!window.confirm(`TEM CERTEZA QUE DESEJA EXCLUIR A NF-E #${id}?\n\nEsta ação apagará permanentemente o registro.\nSó é permitido para vendas PENDENTES.`)) {
            handleMenuClose();
            return;
        }

        handleMenuClose();
        setProcessingId(id);

        try {
            const response = await axiosInstance.delete(`/vendas/${id}/`);
            // Backend retorna 200 com precisa_inutilizar quando o número não é o último
            if (response.status === 200 && response.data?.precisa_inutilizar) {
                setJustificativa('');
                setActionDialog({ open: true, type: 'INUTILIZAR', venda: menuVenda, autoDeleteAfter: true });
                showToast(
                    `Número NF-e ${response.data.numero_nfe} precisa ser inutilizado na SEFAZ antes de excluir. Preencha a justificativa.`,
                    'warning'
                );
                return;
            }
            showToast('✅ NF-e excluída com sucesso!', 'success');
            fetchVendas();
        } catch (err) {
            console.error("Erro ao excluir venda:", err);
            const errorMsg = err.response?.data?.details || err.response?.data?.error || 'Erro ao processar exclusão.';
            showToast(`Erro ao excluir: ${errorMsg}`, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    // Baixar XML em Lote (ZIP)
    const handleDownloadBatch = () => {
        let url = `${axiosInstance.defaults.baseURL}/vendas/download_lote_xml/?modelo=55`;
        if (filterDateStart) url += `&data_inicial=${filterDateStart}`;
        if (filterDateEnd) url += `&data_final=${filterDateEnd}`;
        
        window.open(url, '_blank');
    };

    // Imprimir DANFE (PDF)
    const handleImprimirDanfe = (venda) => {
        handleMenuClose();
        if (!venda) {
            toast.error('Venda não encontrada');
            return;
        }
        if (!venda?.chave_nfe) {
            toast.warning('Esta nota não possui chave de acesso. Verifique se foi transmitida corretamente.');
            return;
        }
        const id = venda.id_venda || venda.id;
        if (!id) {
            toast.error('ID da venda não encontrado');
            return;
        }
        const url = `${axiosInstance.defaults.baseURL}/vendas/${id}/imprimir_danfe/`;
        console.log('Abrindo DANFE:', url, 'Venda:', venda);
        window.open(url, '_blank');
    };

    // Baixar XML Individual
    const handleDownloadXML = (venda) => {
        handleMenuClose();
        if (!venda.id_venda && !venda.id) return;
        const id = venda.id_venda || venda.id;
        const url = `${axiosInstance.defaults.baseURL}/vendas/${id}/download_xml/`;
        window.open(url, '_blank');
    };

    // Abrir Dialog Cancelar
    const handleOpenCancel = () => {
        if (!menuVenda) return;
        setActionDialog({ open: true, type: 'CANCELAR', venda: menuVenda });
        setJustificativa('');
        handleMenuClose();
    };

    // Abrir Dialog Inutilizar
    const handleOpenInutilizar = () => {
        if (!menuVenda) return;
        setActionDialog({ open: true, type: 'INUTILIZAR', venda: menuVenda, autoDeleteAfter: false });
        setJustificativa('');
        handleMenuClose();
    };

    // Executar Ação (Cancelar ou Inutilizar)
    const handleExecuteAction = async () => {
        const { type, venda } = actionDialog;
        if (!venda || !justificativa || justificativa.length < 15) {
            showToast('A justificativa deve ter pelo menos 15 caracteres.', 'warning');
            return;
        }

        const id = venda.id_venda || venda.id;
        const endpoint = type === 'CANCELAR' 
            ? `/vendas/${id}/cancelar_nfe/` 
            : `/vendas/${id}/inutilizar_nfe/`;
        const autoDeleteAfter = actionDialog.autoDeleteAfter || false;

        setProcessingId(id);
        setActionDialog({ open: false, type: null, venda: null, autoDeleteAfter: false });

        try {
            showToast(type === 'CANCELAR' ? 'Cancelando...' : 'Inutilizando...', 'info');
            
            const response = await axiosInstance.post(endpoint, { justificativa });
            
            if (autoDeleteAfter && type === 'INUTILIZAR') {
                // Após inutilizar, exclui a venda automaticamente
                try {
                    await axiosInstance.delete(`/vendas/${id}/`);
                    showToast('✅ Número inutilizado e NF-e excluída com sucesso!', 'success');
                } catch (errDel) {
                    showToast(response.data.message || 'Número inutilizado com sucesso (exclua a venda manualmente).', 'info');
                }
            } else {
                showToast(response.data.message || 'Operação realizada com sucesso!', 'success');
            }
            fetchVendas();
        } catch (err) {
            console.error(`Erro ao ${type}:`, err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Erro ao processar solicitação.';
            showToast(`Erro: ${errorMsg}`, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const canCancel = (venda) => {
        // Para NF-e (modelo 55), o prazo de cancelamento varia por estado
        // Deixamos o backend (ACBr) validar o prazo correto
        // Aqui apenas verificamos se está EMITIDA
        return venda.status_nfe === 'EMITIDA';
    };

    const renderStatus = (statusNfe) => {
        const status = (statusNfe || 'PENDENTE').toUpperCase();
        
        if (status === 'EMITIDA' || status === 'AUTORIZADA') {
            return <Chip icon={<CheckCircleIcon />} label="AUTORIZADA" color="success" size="small" variant="outlined" />;
        }
        if (status === 'CONTINGENCIA') {
            return <Chip icon={<WarningIcon />} label="CONTINGÊNCIA" color="warning" size="small" variant="outlined" />;
        }
        if (status === 'ERRO' || status === 'REJEITADA') {
            return <Chip icon={<ErrorIcon />} label="REJEITADA" color="error" size="small" variant="outlined" />;
        }
        if (status === 'CANCELADA') {
            return <Chip icon={<WarningIcon />} label="CANCELADA" color="warning" size="small" variant="outlined" />;
        }
        if (status === 'INUTILIZADA') {
            return <Chip icon={<BlockIcon />} label="INUTILIZADA" color="default" size="small" variant="outlined" />;
        }
        return <Chip label="PENDENTE" color="default" size="small" variant="outlined" />;
    };

    // Sempre que filterDateStart/filterDateEnd mudar, rebusca (período rápido)
    useEffect(() => {
        fetchVendas();
    }, [filterDateStart, filterDateEnd]); // eslint-disable-line

    const handleNewNFe = () => {
        setOpenNewDialog(true);
    };

    return (
        <Box sx={{ p: 1.5, maxWidth: '100%', margin: '0 auto', bgcolor: '#f4f6f8', minHeight: 'calc(100vh - 48px)' }}>
            
            {/* ========== JANELA DE INCLUSÃO NF-e ========== */}
            <Dialog
                open={openNewDialog}
                onClose={() => setOpenNewDialog(false)}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        height: '94vh',
                        maxHeight: '94vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.25)'
                    }
                }}
            >
                {/* Barra de título da janela */}
                <Box sx={{
                    background: 'linear-gradient(135deg, #1a237e 0%, #283593 60%, #1565c0 100%)',
                    px: 3, py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            bgcolor: 'rgba(255,255,255,0.15)',
                            borderRadius: 2,
                            p: 1,
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <DescriptionIcon sx={{ color: '#fff', fontSize: 28 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
                                Nova NF-e — Modelo 55
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                                <SaidaIcon sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }} />
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                                    Nota Fiscal Eletrônica de Saída · Apenas operações Modelo 55
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            label="MOD. 55 · SAÍDA"
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: '0.72rem', border: '1px solid rgba(255,255,255,0.3)' }}
                        />
                        <IconButton
                            onClick={() => setOpenNewDialog(false)}
                            sx={{
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.1)',
                                '&:hover': { bgcolor: 'rgba(255,0,0,0.25)' },
                                ml: 1
                            }}
                            size="small"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* Conteúdo da janela */}
                <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f5f7fa' }}>
                    <Vendas 
                        embedded={true} 
                        initialMode="nova" 
                        initialModel="55"
                        onClose={() => setOpenNewDialog(false)}
                        onSaveSuccess={() => {
                            setOpenNewDialog(false);
                            fetchVendas();
                            showToast('Nota fiscal salva com sucesso! Pronta para envio.', 'success');
                        }}
                    />
                </Box>

                {/* Rodapé da janela */}
                <Box sx={{
                    px: 3, py: 1.5,
                    bgcolor: '#f0f0f0',
                    borderTop: '1px solid #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0
                }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DescriptionIcon sx={{ fontSize: 14 }} />
                        NF-e Modelo 55 · Operação de Saída
                    </Typography>
                    <Button
                        size="small"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => setOpenNewDialog(false)}
                        sx={{ textTransform: 'none', color: 'text.secondary' }}
                    >
                        Fechar
                    </Button>
                </Box>
            </Dialog>

            {/* Header */}
            <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 2, bgcolor: '#fff' }}>
                {/* Linha 1: título + botões de ação */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <Box>
                        <Typography variant="h5" component="h1" sx={{ color: '#1a237e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DescriptionIcon sx={{ fontSize: 32 }} />
                            Emissão de NF-e
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Nota Fiscal Eletrônica (Modelo 55) · {filteredVendas.length} nota{filteredVendas.length !== 1 ? 's' : ''} exibida{filteredVendas.length !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button 
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={<AddIcon />} 
                            onClick={handleNewNFe}
                            sx={{ textTransform: 'none', borderRadius: 2, px: 3, py: 1.2, fontWeight: 600 }}
                        >
                            Incluir NF-e
                        </Button>
                        <Button 
                            variant="outlined"
                            size="large"
                            startIcon={<DownloadIcon />} 
                            onClick={handleDownloadBatch}
                            disabled={loading}
                            sx={{ textTransform: 'none', borderRadius: 2, px: 2.5, py: 1.2, fontWeight: 600 }}
                        >
                            XML Lote
                        </Button>
                        <Button 
                            variant="contained" 
                            color="secondary"
                            size="large"
                            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />} 
                            onClick={fetchVendas}
                            disabled={loading}
                            sx={{ textTransform: 'none', borderRadius: 2, px: 2.5, py: 1.2, fontWeight: 600 }}
                        >
                            Atualizar
                        </Button>
                    </Box>
                </Box>

                {/* Linha 2: busca + botão para expandir filtros */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Campo de busca */}
                    <TextField
                        placeholder="Buscar por nome, nº documento ou valor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        sx={{ minWidth: 280, flex: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* Accordion para filtros de período */}
                <Accordion 
                    expanded={filtrosExpanded} 
                    onChange={() => setFiltrosExpanded(!filtrosExpanded)}
                    elevation={0}
                    sx={{ 
                        mt: 2, 
                        '&:before': { display: 'none' },
                        bgcolor: '#f8f9fa',
                        borderRadius: 1
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ 
                            minHeight: 48,
                            '& .MuiAccordionSummary-content': { my: 1 }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FilterListIcon fontSize="small" color="action" />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                Filtros de Período {periodoRapido && periodoRapido !== 'tudo' ? `(últimos ${periodoRapido} dias)` : periodoRapido === 'tudo' ? '(todos os períodos)' : ''}
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Período rápido */}
                            <Box sx={{ flex: 1, minWidth: 300 }}>
                                <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600, color: 'text.secondary' }}>
                                    Período Rápido:
                                </Typography>
                                <ToggleButtonGroup
                                    value={periodoRapido}
                                    exclusive
                                    size="small"
                                    fullWidth
                                >
                                    {[['10','10 dias'], ['30','30 dias'], ['40','40 dias'], ['60','60 dias'], ['tudo','Todos']].map(([val, label]) => (
                                        <ToggleButton
                                            key={val}
                                            value={val}
                                            onClick={() => handlePeriodoRapido(val)}
                                            sx={{
                                                px: 1.5,
                                                fontWeight: periodoRapido === val ? 700 : 400,
                                                bgcolor: periodoRapido === val ? '#1a237e !important' : undefined,
                                                color: periodoRapido === val ? '#fff !important' : undefined,
                                            }}
                                        >
                                            {label}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                            </Box>

                            {/* Datas manuais */}
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600, color: 'text.secondary' }}>
                                        Período Personalizado:
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                            label="Início"
                                            type="date"
                                            InputLabelProps={{ shrink: true }}
                                            value={filterDateStart}
                                            onChange={(e) => { setPeriodoRapido(''); setFilterDateStart(e.target.value); }}
                                            size="small"
                                            sx={{ minWidth: 145 }}
                                        />
                                        <TextField
                                            label="Fim"
                                            type="date"
                                            InputLabelProps={{ shrink: true }}
                                            value={filterDateEnd}
                                            onChange={(e) => { setPeriodoRapido(''); setFilterDateEnd(e.target.value); }}
                                            size="small"
                                            sx={{ minWidth: 145 }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Paper>

            {/* Error Message */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Content */}
            {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                    <CircularProgress size={48} thickness={4} />
                    <Typography sx={{ mt: 2, color: 'text.secondary' }}>Carregando notas...</Typography>
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                            <TableRow>
                                <TableCell sx={{ width: 40 }} />
                                <TableCell sx={{ fontWeight: 'bold', color: '#455a64' }}>Nº Nota</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#455a64' }}>Data Emissão</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#455a64' }}>Destinatário</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#455a64' }}>Valor Total</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#455a64' }}>Chave de Acesso</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#455a64' }}>Status</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#455a64', minWidth: '150px' }}>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredVendas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <Typography variant="h6" color="text.disabled">
                                            {searchTerm ? 'Nenhuma NF-e encontrada para a busca.' : 'Nenhuma NF-e encontrada.'}
                                        </Typography>
                                        <Typography variant="body2" color="text.disabled">
                                            {searchTerm ? 'Tente outro termo ou limpe a busca.' : 'Clique em "Incluir NF-e" para iniciar um novo faturamento.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredVendas.map((venda) => (
                                    <React.Fragment key={venda.id}>
                                    <TableRow hover>
                                        <TableCell sx={{ width: 40, p: 0.5 }}>
                                            <Tooltip title={expandedRows.has(venda.id) ? 'Fechar produtos' : 'Ver produtos'}>
                                                <IconButton size="small" onClick={() => toggleRow(venda.id)}>
                                                    {expandedRows.has(venda.id) ? <KeyboardArrowUpIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>
                                            {venda.numero_nfe ? (
                                                <Typography color="primary" fontWeight="bold">
                                                    NF-e {venda.numero_nfe}
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">Thinking...</Typography>
                                            )}
                                             <Typography variant="caption" display="block" color="text.secondary">ID: {venda.id}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {venda.data_emissao 
                                                ? new Date(venda.data_emissao).toLocaleString('pt-BR') 
                                                : (venda.data_venda ? new Date(venda.data_venda).toLocaleString('pt-BR') : '-')}
                                        </TableCell>
                                        <TableCell>
                                            {venda.cliente || venda.nome_cliente || 'Destinatário Desconhecido'}
                                            {venda.cpf_cnpj && <Box component="div" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Doc: {venda.cpf_cnpj}</Box>}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            {venda.valor_total 
                                                ? parseFloat(venda.valor_total).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})
                                                : 'R$ 0,00'}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <Tooltip title={venda.chave_nfe || 'Não gerada'}>
                                                <span>{venda.chave_nfe || '-'}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            {renderStatus(venda.status_nfe)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'center', 
                                                alignItems: 'center', 
                                                gap: 0.5,
                                                flexWrap: 'nowrap',
                                                minWidth: 'fit-content'
                                            }}>
                                                {/* Botão de Transmitir NF-e (só aparece quando NÃO emitida) */}
                                                {venda.status_nfe !== 'EMITIDA' && venda.status_nfe !== 'CANCELADA' && venda.status_nfe !== 'INUTILIZADA' && (
                                                    <Tooltip title="Transmitir NF-e">
                                                        <span>
                                                            <IconButton
                                                                color="primary"
                                                                size="small"
                                                                onClick={() => handleEmitirNFe(venda.id)}
                                                                disabled={!!processingId}
                                                            >
                                                                {processingId === venda.id ? (
                                                                    <CircularProgress size={20} color="inherit" />
                                                                ) : (
                                                                    <DescriptionIcon fontSize="small" />
                                                                )}
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                )}

                                                {/* Botão WhatsApp - só aparece se emitida */}
                                                {venda.status_nfe === 'EMITIDA' && (
                                                    <WhatsAppQuickSend
                                                        telefone={venda.whatsapp_cliente || venda.telefone_cliente || venda.telefone_celular || venda.telefone}
                                                        nome={venda.cliente || venda.nome_cliente}
                                                        mensagemPadrao={templates.nfe_emitida(
                                                            venda.cliente || venda.nome_cliente || 'Cliente',
                                                            venda.numero_nfe || venda.numero_documento,
                                                            parseFloat(venda.valor_total || 0).toFixed(2)
                                                        )}
                                                        tipoEnvio="nfe"
                                                        idRelacionado={venda.id}
                                                        linkPDF={venda.link_danfe || venda.link_pdf || (venda.id ? `${axiosInstance.defaults.baseURL}/vendas/${venda.id}/imprimir_danfe/` : null)}
                                                        linkXML={venda.link_xml || (venda.id ? `${axiosInstance.defaults.baseURL}/vendas/${venda.id}/download_xml/` : null)}
                                                        onSuccess={() => console.log('WhatsApp NF-e enviado!')}
                                                    />
                                                )}

                                                {/* Menu de opções */}
                                                <Tooltip title="Mais opções">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={(e) => handleMenuOpen(e, venda)}
                                                        disabled={!!processingId}
                                                    >
                                                        <MoreVertIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={8} sx={{ p: 0, borderBottom: expandedRows.has(venda.id) ? undefined : 'none' }}>
                                            <Collapse in={expandedRows.has(venda.id)} unmountOnExit>
                                                <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                                        Produtos da NF-e {venda.numero_nfe || `#${venda.id}`}
                                                    </Typography>
                                                    {(venda.itens || []).length > 0 ? (
                                                        <Table size="small">
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell><strong>Produto</strong></TableCell>
                                                                    <TableCell align="right"><strong>Qtd</strong></TableCell>
                                                                    <TableCell align="right"><strong>Unit.</strong></TableCell>
                                                                    <TableCell align="right"><strong>Total</strong></TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {(venda.itens || []).map((item, idx) => (
                                                                    <TableRow key={idx}>
                                                                        <TableCell>{item.produto_nome}</TableCell>
                                                                        <TableCell align="right">{parseFloat(item.quantidade || 0).toLocaleString('pt-BR')}</TableCell>
                                                                        <TableCell align="right">{parseFloat(item.valor_unitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                                                        <TableCell align="right">{parseFloat(item.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">Nenhum produto encontrado.</Typography>
                                                    )}
                                                    {venda.mensagem_nfe && (
                                                        <Alert severity="error" sx={{ mt: 1 }}>
                                                            <strong>Erro NF-e:</strong> {venda.mensagem_nfe}
                                                        </Alert>
                                                    )}
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {/* Imprimir DANFE - só para NFe EMITIDA */}
                {menuVenda?.status_nfe === 'EMITIDA' && (
                    <MenuItem onClick={() => handleImprimirDanfe(menuVenda)}>
                        <ListItemIcon><PrintIcon fontSize="small" color="secondary" /></ListItemIcon>
                        Imprimir DANFE
                    </MenuItem>
                )}
                
                <MenuItem onClick={() => handleDownloadXML(menuVenda)} disabled={!menuVenda?.chave_nfe}>
                    <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                    Baixar XML
                </MenuItem>
                
                {menuVenda?.status_nfe === 'EMITIDA' && (
                    <MenuItem onClick={() => { setEmailDialog({ open: true, venda: menuVenda }); handleMenuClose(); }}>
                        <ListItemIcon><EmailIcon fontSize="small" color="primary" /></ListItemIcon>
                        Enviar por E-mail
                    </MenuItem>
                )}
                
                <Divider />
                
                {menuVenda && (
                    <MenuItem 
                        onClick={handleOpenCancel} 
                        sx={{ color: canCancel(menuVenda) ? 'error.main' : 'text.disabled' }}
                        disabled={!canCancel(menuVenda)}
                    >
                        <ListItemIcon>
                            <CancelIcon fontSize="small" color={canCancel(menuVenda) ? "error" : "disabled"} />
                        </ListItemIcon>
                        Cancelar NF-e
                    </MenuItem>
                )}
                
                {menuVenda?.status_nfe !== 'EMITIDA' && menuVenda?.status_nfe !== 'CANCELADA' && (
                     <MenuItem onClick={handleOpenInutilizar}>
                        <ListItemIcon><BlockIcon fontSize="small" /></ListItemIcon>
                        Inutilizar Numeração
                    </MenuItem>
                )}

                {menuVenda && (
                    (menuVenda.status_nfe === 'ERRO' || menuVenda.status_nfe === 'REJEITADA' || menuVenda.mensagem_nfe) 
                ) && (
                    <MenuItem onClick={handleViewError}>
                        <ListItemIcon><InfoIcon fontSize="small" color="info" /></ListItemIcon>
                        Visualizar Erro
                    </MenuItem>
                )}
                
                <Divider />

                {/* Carta de Correção - só para NFe EMITIDA */}
                {menuVenda && (
                    <MenuItem 
                        onClick={() => {
                            setCartaCorrecaoDialog({ open: true, venda: menuVenda });
                            handleMenuClose();
                        }}
                        disabled={menuVenda.status_nfe !== 'EMITIDA'}
                        sx={{ color: menuVenda.status_nfe === 'EMITIDA' ? 'primary.main' : 'text.disabled' }}
                    >
                        <ListItemIcon>
                            <DescriptionIcon fontSize="small" color={menuVenda.status_nfe === 'EMITIDA' ? 'primary' : 'disabled'} />
                        </ListItemIcon>
                        Carta de Correção (CC-e)
                    </MenuItem>
                )}

                {/* Complemento de ICMS - só para NFe EMITIDA */}
                {menuVenda && (
                    <MenuItem 
                        onClick={() => {
                            setComplementoICMSDialog({ open: true, venda: menuVenda });
                            handleMenuClose();
                        }}
                        disabled={menuVenda.status_nfe !== 'EMITIDA'}
                        sx={{ color: menuVenda.status_nfe === 'EMITIDA' ? 'secondary.main' : 'text.disabled' }}
                    >
                        <ListItemIcon>
                            <AddIcon fontSize="small" color={menuVenda.status_nfe === 'EMITIDA' ? 'secondary' : 'disabled'} />
                        </ListItemIcon>
                        Complemento de ICMS
                    </MenuItem>
                )}
                
                <Divider />

                {/* Opção de Limpar XML */}
                {menuVenda && (menuVenda.status_nfe === 'ERRO' || menuVenda.status_nfe === 'REJEITADA') && (
                    <MenuItem onClick={handleClearError} sx={{ color: 'warning.main' }}>
                        <ListItemIcon><CleanIcon fontSize="small" color="warning" /></ListItemIcon>
                        Limpar XML / Erro
                    </MenuItem>
                )}

                 {/* Opção de EXCLUIR Venda (Apenas Pendente) */}
                {menuVenda && (!menuVenda.status_nfe || menuVenda.status_nfe.toUpperCase() === 'PENDENTE') && (
                    <MenuItem onClick={handleDeleteVenda} sx={{ color: 'error.main' }}>
                        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                        Excluir Venda
                    </MenuItem>
                )}
            </Menu>

            {/* Dialog de Erro */}
            <Dialog 
                open={errorDialog.open} 
                onClose={() => setErrorDialog({ ...errorDialog, open: false })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                    <ErrorIcon color="error" />
                    Detalhes do Erro
                </DialogTitle>
                <DialogContent>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff0f0', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                             {errorDialog.message}
                        </Typography>
                    </Paper>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setErrorDialog({ ...errorDialog, open: false })}>
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Ação (Cancelar/Inutilizar/Carta) */}
            <Dialog 
                open={actionDialog.open} 
                onClose={() => setActionDialog({...actionDialog, open: false})}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {actionDialog.type === 'CANCELAR' && 'Cancelar NF-e'}
                    {actionDialog.type === 'INUTILIZAR' && 'Inutilizar Numeração'}
                    {actionDialog.type === 'CARTA_CORRECAO' && 'Carta de Correção'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Informe a justificativa (Mínimo 15 caracteres):
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Justificativa"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialog({...actionDialog, open: false})}>Voltar</Button>
                    <Button 
                        onClick={handleExecuteAction} 
                        color="error" 
                        variant="contained"
                        disabled={justificativa.length < 15}
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Dialog: Carta de Correção */}
            <CartaCorrecaoDialog
                open={cartaCorrecaoDialog.open}
                onClose={() => setCartaCorrecaoDialog({ open: false, venda: null })}
                venda={cartaCorrecaoDialog.venda}
            />
            
            {/* Dialog: Complemento de ICMS */}
            <ComplementoICMSDialog
                open={complementoICMSDialog.open}
                onClose={() => setComplementoICMSDialog({ open: false, venda: null })}
                venda={complementoICMSDialog.venda}
                onSuccess={() => {
                    // Recarregar lista de vendas após criar complemento
                    fetchVendas();
                }}
            />

            {/* Dialog: Enviar por E-mail */}
            <EmailDocumentoDialog
                open={emailDialog.open}
                onClose={() => setEmailDialog({ open: false, venda: null })}
                tipo="nfe"
                documentoId={emailDialog.venda?.id_venda || emailDialog.venda?.id}
                numero={emailDialog.venda?.numero_nfe}
                chave={emailDialog.venda?.chave_nfe}
                emailDestinatario={emailDialog.venda?.email_cliente || ''}
                nomeDestinatario={emailDialog.venda?.nome_cliente || emailDialog.venda?.cliente || ''}
                valorTotal={emailDialog.venda?.valor_total}
                temXml={!!emailDialog.venda?.chave_nfe}
                temPdf={!!emailDialog.venda?.chave_nfe}
                onSuccess={(msg) => showToast(msg, 'success')}
                onError={(msg) => showToast(msg, 'error')}
            />
        </Box>
    );
};

export default NFePage;
