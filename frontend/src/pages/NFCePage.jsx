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
  Grid
} from '@mui/material';
import { 
  Receipt as ReceiptIcon, 
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
  Delete as DeleteIcon,
  Info as InfoIcon,
  CleaningServices as CleanIcon,
  WhatsApp as WhatsAppIcon,
  Article as ArticleIcon,
  ShoppingCart as ShoppingCartIcon,
  ViewList as ViewListIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import WhatsAppQuickSend, { useWhatsAppTemplates } from '../components/WhatsAppQuickSend';

const NFCePage = () => {
    const theme = useTheme();
    const { axiosInstance } = useAuth(); // Usando axiosInstance do contexto de autenticação
    const templates = useWhatsAppTemplates();
    const [vendas, setVendas] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Filtros
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [filterType, setFilterType] = useState('65'); // 'todos', 'pedido', '65', '55'

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

    // Estados para DIALOG de Expandir Cupom / Detalhes
    const [selectedVendaDetail, setSelectedVendaDetail] = useState(null);
    const [loadingDetailId, setLoadingDetailId] = useState(null);
    const [vendaDetailOpen, setVendaDetailOpen] = useState(false);

    // Estados para Edição de Impostos no Cupom
    const [isEditingTaxes, setIsEditingTaxes] = useState(false);
    const [editableItens, setEditableItens] = useState([]);
    const [savingTaxes, setSavingTaxes] = useState(false);

    const isVendaFinalized = (venda) => {
        if (!venda) return true;
        const status = (venda.status_nfe || 'PENDENTE').toUpperCase();
        return ['AUTORIZADA', 'AUTORIZADO', 'APROVADO', 'EMITIDA'].includes(status);
    };

    const handleStartEditingTaxes = () => {
        if (!selectedVendaDetail?.itens) return;
        setEditableItens(selectedVendaDetail.itens.map(item => ({
            id_item: item.id,
            nome_produto: item.nome_produto || item.produto,
            codigo_produto: item.codigo_produto || item.codigo,
            cfop: item.cfop || '',
            cst: item.icms_cst_csosn || '',
            pis_cst: item.pis_cst || '',
            pis_aliq: item.pis_aliq || 0,
            cofins_cst: item.cofins_cst || '',
            cofins_aliq: item.cofins_aliq || 0,
            ipi_cst: item.ipi_cst || '',
            ipi_aliq: item.ipi_aliq || 0,
        })));
        setIsEditingTaxes(true);
    };

    const handleCancelEditingTaxes = () => {
        setIsEditingTaxes(false);
        setEditableItens([]);
    };

    const handleSalvarImpostos = async () => {
        if (!selectedVendaDetail) return;
        setSavingTaxes(true);
        try {
            await axiosInstance.patch(`/vendas/${selectedVendaDetail.id}/atualizar_impostos_itens/`, {
                itens: editableItens
            });
            showToast('✅ Impostos atualizados com sucesso!', 'success');
            const detailResponse = await axiosInstance.get(`/vendas/${selectedVendaDetail.id}/`);
            setSelectedVendaDetail(detailResponse.data);
            setIsEditingTaxes(false);
            setEditableItens([]);
            fetchVendas();
        } catch (err) {
            console.error("Erro ao salvar impostos:", err);
            const errorMsg = err.response?.data?.detail || err.response?.data?.message || 'Erro ao salvar impostos.';
            showToast(errorMsg, 'error');
        } finally {
            setSavingTaxes(false);
        }
    };

    const handleMenuOpen = (event, venda) => {
        setAnchorEl(event.currentTarget);
        setMenuVenda(venda);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuVenda(null);
    };

    const handleExpandirCupom = async (vendaId) => {
        if (!vendaId) return;
        setLoadingDetailId(vendaId);
        handleMenuClose();
        try {
            const response = await axiosInstance.get(`/vendas/${vendaId}/`);
            setSelectedVendaDetail(response.data);
            setVendaDetailOpen(true);
        } catch (err) {
            console.error("Erro ao carregar detalhes da venda:", err);
            const errorMsg = err.response?.data?.details || err.response?.data?.error || err.response?.data?.message || 'Erro ao buscar detalhes da venda.';
            showToast(errorMsg, 'error');
        } finally {
            setLoadingDetailId(null);
        }
    };

    // Função principal de busca
    const fetchVendas = async () => {
        setLoading(true);
        setError(null);
        try {
            let logMessage = "🔍 Buscando vendas";
            const params = {
                ordering: '-id_venda',
                limit: 50,
            };

            if (filterType && filterType !== 'todos') {
                params.modelo = filterType;
                logMessage += ` (modelo=${filterType})`;
            } else {
                logMessage += " (todos os modelos)";
            }
            
            console.log(logMessage);

            if (filterDateStart) params.data_inicial = filterDateStart;
            if (filterDateEnd) params.data_final = filterDateEnd;

            // IMPORTANTE: URL relativa ao baseURL do axiosInstance (que já deve incluir /api)
            const response = await axiosInstance.get('/vendas/', { params });

            console.log("📦 Resposta recebida:", response.data);

            // Verificação se resposta é HTML (caso de erro de rota)
            if (typeof response.data === 'string' && response.data.trim().startsWith('<!doctype html>')) {
                 throw new Error("Recebido HTML em vez de JSON. Verifique a URL da API.");
            }

            // Tratamento flexível da resposta (pode vir paginada ou lista direta)
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
    const handleEmitirNFCe = async (vendaId) => {
        if (processingId) return;

        setProcessingId(vendaId);
        showToast('Solicitando emissão de NFC-e...', 'info');

        try {
            const requestData = {
                ...csosnConfig.isEnabled && {
                    observacoes: {
                        mensagem: csosnConfig.message,
                        csosns: csosnConfig.selectedCsosns
                    }
                }
            };

            const response = await axiosInstance.post(`/vendas/${vendaId}/emitir_nfce/`, requestData, { timeout: 60000 });

            console.log('✅ Emissão concluída:', response.data);
            const msg = response.data.message || 'NFC-e Emitida com Sucesso!';
            showToast(msg, 'success');

            fetchVendas();
        } catch (err) {
            console.error('❌ Erro na emissão:', err);
            const errorMsg = err.response?.data?.details || err.response?.data?.error || err.response?.data?.message || 'Erro desconhecido ao emitir';
            showToast(`Erro na emissão: ${errorMsg}`, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    // Função de impressão do DANFCE (NFC-e já emitida)
    const handleImprimirNFCe = (vendaId) => {
        try {
            const baseUrl = axiosInstance.defaults.baseURL;
            const url = `${baseUrl}/vendas/${vendaId}/imprimir_danfce/`;
            console.log('Abrindo impressão NFC-e:', url);
            
            const janela = window.open(url, '_blank');
            
            if (!janela || janela.closed || typeof janela.closed === 'undefined') {
                alert('Pop-up bloqueado! Por favor, permita pop-ups para este site e tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao abrir impressão NFC-e:', error);
            alert('Erro ao abrir impressão: ' + error.message);
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

        if (!window.confirm(`TEM CERTEZA QUE DESEJA EXCLUIR A VENDA #${id}?\n\nEsta ação apagará permanentemente o registro.\nSó é permitido para vendas PENDENTES (não emitidas).`)) {
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
                    `Número NFC-e ${response.data.numero_nfe} precisa ser inutilizado na SEFAZ antes de excluir. Preencha a justificativa.`,
                    'warning'
                );
                return;
            }
            showToast('✅ Venda excluída com sucesso!', 'success');
            // Recarrega lista
            fetchVendas();
        } catch (err) {
            console.error("Erro ao excluir venda:", err);
            const errorMsg = err.response?.data?.details || err.response?.data?.error || 'Erro ao processar exclusão.';
            showToast(`Erro ao excluir: ${errorMsg}`, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDownloadBatch = () => {
        let url = `${axiosInstance.defaults.baseURL}/vendas/download_lote_xml/?modelo=65`;
        if (filterDateStart) url += `&data_inicial=${filterDateStart}`;
        if (filterDateEnd) url += `&data_final=${filterDateEnd}`;
        
        window.open(url, '_blank');
    };

    // --- FUNÇÕES DE ERRO E LIMPEZA ---
    
    // Abrir Dialog de Erro
    const handleViewError = () => {
        if (!menuVenda) return;
        // Tenta pegar mensagem_nfe, ou mensagem_erro, ou um fallback
        const msg = menuVenda.mensagem_nfe || menuVenda.mensagem_erro || menuVenda.observacao_fisco || "Nenhuma mensagem de erro registrada.";
        setErrorDialog({ open: true, message: msg });
        handleMenuClose();
    };

    // Limpar XML/Erro
    const handleClearError = async () => {
        if (!menuVenda) return;
        const id = menuVenda.id_venda || menuVenda.id;
        
        handleMenuClose();
        
        if (!confirm(`Deseja limpar o status de erro da Venda #${id}?\nIsso permitirá tentar emitir novamente ou excluir.`)) {
            return;
        }

        setProcessingId(id);
        try {
            await axiosInstance.post(`/vendas/${id}/limpar_nfce_erro/`);
            showToast('✅ Status de erro limpo com sucesso!', 'success');
            fetchVendas();
        } catch (err) {
            console.error("Erro ao limpar venda:", err);
            showToast('Erro ao limpar status da venda.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    // Baixar XML Individual
    const handleDownloadXML = (venda) => {
        handleMenuClose();
        if (!venda.id_venda && !venda.id) return;
        const id = venda.id_venda || venda.id;
        // Abre em nova aba direto na API
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
            ? `/vendas/${id}/cancelar_nfce/` 
            : `/vendas/${id}/inutilizar_nfce/`;
        const autoDeleteAfter = actionDialog.autoDeleteAfter || false;

        setProcessingId(id);
        setActionDialog({ open: false, type: null, venda: null, autoDeleteAfter: false }); // Fecha dialog

        try {
            showToast(type === 'CANCELAR' ? 'Cancelando...' : 'Inutilizando...', 'info');
            
            const response = await axiosInstance.post(endpoint, { justificativa });
            
            if (autoDeleteAfter && type === 'INUTILIZAR') {
                // Após inutilizar, exclui a venda automaticamente
                try {
                    await axiosInstance.delete(`/vendas/${id}/`);
                    showToast('✅ Número inutilizado e venda excluída com sucesso!', 'success');
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

    // Função para verificar se pode cancelar (Regra 30 min)
    const canCancel = (venda) => {
        if (venda.status_nfe !== 'EMITIDA') return false;
        
        const dateStr = venda.data_emissao || venda.data_venda || venda.data || venda.data_documento;
        if (!dateStr) return false;

        try {
            const saleDate = new Date(dateStr);
            const now = new Date();
            const diffMs = now - saleDate;
            const diffMinutes = diffMs / (1000 * 60);
            return diffMinutes <= 30;
        } catch (e) {
            console.error("Erro ao validar data para cancelamento", e);
            return false;
        }
    };

    // Renderiza status com cores e ícones
    const renderStatus = (statusNfe) => {
        // Normaliza string (pode vir null ou undefined)
        const status = (statusNfe || 'PENDENTE').toUpperCase();
        
        if (status === 'EMITIDA' || status === 'AUTORIZADA') {
            return <Chip icon={<CheckCircleIcon />} label="EMITIDA" color="success" size="small" variant="outlined" />;
        }
        if (status === 'CONTINGENCIA') {
            return <Chip icon={<WarningIcon />} label="CONTINGÊNCIA OFF-LINE" color="warning" size="small" variant="outlined" />;
        }
        if (status === 'ERRO' || status === 'REJEITADA') {
            return <Chip icon={<ErrorIcon />} label="ERRO" color="error" size="small" variant="outlined" />;
        }
        if (status === 'CANCELADA') {
            return <Chip icon={<WarningIcon />} label="CANCELADA" color="warning" size="small" variant="outlined" />;
        }
        if (status === 'INUTILIZADA') {
            return <Chip icon={<BlockIcon />} label="INUTILIZADA" color="default" size="small" variant="outlined" />;
        }
        return <Chip label="PENDENTE" color="default" size="small" variant="outlined" />;
    };

    // Efeito inicial e ao mudar filtros
    useEffect(() => {
        fetchVendas();
    }, [filterType]);

    return (
        <Box sx={{ p: 3, maxWidth: '100%', margin: '0 auto', bgcolor: '#f4f6f8', minHeight: 'calc(100vh - 64px)' }}>
            
            {/* Header */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff' }}>
                <Box>
                    <Typography variant="h5" component="h1" sx={{ color: '#1a237e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptIcon sx={{ fontSize: 32 }} />
                        Consulta de Vendas e Documentos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerencie e emita suas Vendas, Pedidos, NFC-e (Modelo 65) e NF-e (Modelo 55)
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    
                    {/* Filtros de Data */}
                    <TextField
                        label="Início"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={filterDateStart}
                        onChange={(e) => setFilterDateStart(e.target.value)}
                    />
                     <TextField
                        label="Fim"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={filterDateEnd}
                        onChange={(e) => setFilterDateEnd(e.target.value)}
                    />

                    <Button 
                        variant="outlined" 
                        startIcon={<DownloadIcon />} 
                        onClick={handleDownloadBatch}
                        disabled={loading}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        XML Lote
                    </Button>

                    <Button 
                        variant="contained" 
                        startIcon={<RefreshIcon />} 
                        onClick={fetchVendas}
                        disabled={loading}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Atualizar
                    </Button>
                </Box>
            </Paper>

            {/* Filtros de Tipo */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant={filterType === 'todos' ? 'contained' : 'outlined'}
                        startIcon={<ViewListIcon />}
                        onClick={() => setFilterType('todos')}
                    >
                        Todas
                    </Button>
                    <Button
                        variant={filterType === 'pedido' ? 'contained' : 'outlined'}
                        startIcon={<ShoppingCartIcon />}
                        onClick={() => setFilterType('pedido')}
                    >
                        Pedidos
                    </Button>
                    <Button
                        variant={filterType === '65' ? 'contained' : 'outlined'}
                        startIcon={<ReceiptIcon />}
                        onClick={() => setFilterType('65')}
                    >
                        NFC-e (Cupons)
                    </Button>
                    <Button
                        variant={filterType === '55' ? 'contained' : 'outlined'}
                        startIcon={<ArticleIcon />}
                        onClick={() => setFilterType('55')}
                    >
                        NF-e
                    </Button>
                </Box>
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
                    <Typography sx={{ mt: 2, color: 'text.secondary' }}>Carregando vendas...</Typography>
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Table size="medium">
                        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#455a64' }}>Nº Venda</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#455a64' }}>Data / Hora</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#455a64' }}>Cliente</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#455a64' }}>Vendedor</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#455a64' }}>
                                    <Tooltip title="Apenas vendas configuradas com Modelo 65 são exibidas">
                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            Operação / Documento
                                            <SearchIcon fontSize="small" color="action" />
                                        </Box>
                                    </Tooltip>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#455a64' }}>Valor Total</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#455a64' }}>Status</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', color: '#455a64' }}>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {vendas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <Typography variant="h6" color="text.disabled">
                                            Nenhum documento encontrado para os filtros selecionados.
                                        </Typography>
                                        <Typography variant="body2" color="text.disabled">
                                            Tente alterar o tipo de documento ou o período da busca.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                vendas.map((venda) => (
                                    <TableRow key={venda.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ fontWeight: 500 }}>
                                            {/* Prioridade: NFC-e > Documento > ID */}
                                            {venda.numero_nfe ? (
                                                <Box component="span" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                                    NFC-e {venda.numero_nfe}
                                                </Box>
                                            ) : (venda.numero_documento ? (
                                                <Box component="span">
                                                   Doc. {venda.numero_documento}
                                                </Box>
                                            ) : (
                                                `#${venda.id}`
                                            ))}
                                            {/* Se tiver NFCe mas quiser mostrar o ID tb, pode descomentar: */}
                                            {/* <Typography variant="caption" display="block" color="text.secondary">ID: {venda.id}</Typography> */}
                                        </TableCell>
                                        <TableCell>
                                            {venda.data_venda 
                                                ? new Date(venda.data_venda).toLocaleString('pt-BR') 
                                                : (venda.data ? new Date(venda.data).toLocaleString('pt-BR') : '-')}
                                        </TableCell>
                                        <TableCell>
                                            {venda.cliente || venda.nome_cliente || 'Consumidor Final'}
                                            {venda.cpf_cnpj && <Box component="div" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{venda.cpf_cnpj}</Box>}
                                        </TableCell>
                                        <TableCell>{venda.vendedor || venda.nome_vendedor || '-'}</TableCell>
                                        <TableCell>
                                            <Box>
                                                {venda.operacao || venda.nome_operacao || '-'}
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    Mod. {venda.modelo_documento || '??'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                            {venda.valor_total 
                                                ? parseFloat(venda.valor_total).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})
                                                : 'R$ 0,00'}
                                        </TableCell>
                                        <TableCell>
                                            {renderStatus(venda.status_nfe)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                                                <Tooltip title="Expandir Cupom / Detalhes">
                                                    <span>
                                                        <IconButton 
                                                            color="primary" 
                                                            size="small" 
                                                            onClick={() => handleExpandirCupom(venda.id)}
                                                            disabled={loadingDetailId !== null || !!processingId}
                                                            sx={{ mr: 0.5 }}
                                                        >
                                                            {loadingDetailId === venda.id ? (
                                                                <CircularProgress size={20} color="inherit" />
                                                            ) : (
                                                                <VisibilityIcon />
                                                            )}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                {/* Botão Principal */}
                                                <Button 
                                                    variant="contained" 
                                                    color={venda.status_nfe === 'EMITIDA' ? "success" : (venda.status_nfe === 'CONTINGENCIA' ? "warning" : "primary")}
                                                    size="small"
                                                    startIcon={processingId === venda.id ? <CircularProgress size={20} color="inherit" /> : (venda.status_nfe === 'EMITIDA' || venda.status_nfe === 'CONTINGENCIA' ? <PrintIcon /> : <ReceiptIcon />)}
                                                    onClick={() => (venda.status_nfe === 'EMITIDA' || venda.status_nfe === 'CONTINGENCIA') ? handleImprimirNFCe(venda.id) : handleEmitirNFCe(venda.id)}
                                                    disabled={!!processingId || venda.status_nfe === 'CANCELADA'}
                                                    sx={{ minWidth: 130, mr: 0.5 }}
                                                >
                                                    {processingId === venda.id ? 'Processando...' : (
                                                        venda.status_nfe === 'EMITIDA' ? 'Imprimir' : 
                                                        (venda.status_nfe === 'CONTINGENCIA' ? 'Imprimir (Off)' : 'Emitir')
                                                    )}
                                                </Button>

                                                {(venda.status_nfe === 'EMITIDA' || venda.status_nfe === 'CONTINGENCIA') && (
                                                    <WhatsAppQuickSend
                                                        telefone={venda.whatsapp_cliente || venda.telefone_cliente || venda.telefone_celular || venda.telefone}
                                                        nome={venda.cliente || venda.nome_cliente}
                                                        mensagemPadrao={templates.nfce_emitida(
                                                            venda.cliente || venda.nome_cliente || 'Cliente',
                                                            venda.numero_nfe || venda.numero_documento,
                                                            parseFloat(venda.valor_total || 0).toFixed(2),
                                                            venda.chave_nfe || ''
                                                        )}
                                                        tipoEnvio="nfce"
                                                        idRelacionado={venda.id}
                                                        onSuccess={() => console.log('WhatsApp NFC-e enviado!')}
                                                    />
                                                )}

                                                {/* Menu de Mais Ações */}
                                                <IconButton 
                                                    size="small" 
                                                    onClick={(e) => handleMenuOpen(e, venda)}
                                                    disabled={!!processingId}
                                                >
                                                    <MoreVertIcon />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Menu Contextual */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleExpandirCupom(menuVenda?.id)} disabled={!menuVenda || loadingDetailId !== null}>
                    <ListItemIcon>
                        {loadingDetailId === menuVenda?.id ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <VisibilityIcon fontSize="small" />
                        )}
                    </ListItemIcon>
                    Expandir Cupom
                </MenuItem>
                <MenuItem onClick={() => handleDownloadXML(menuVenda)} disabled={!menuVenda?.tem_xml && !menuVenda?.chave_nfe}>
                    <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                    Baixar XML
                </MenuItem>
                
                {menuVenda && (
                    <MenuItem 
                        onClick={handleOpenCancel} 
                        sx={{ color: canCancel(menuVenda) ? 'error.main' : 'text.disabled' }}
                        disabled={!canCancel(menuVenda)}
                    >
                        <ListItemIcon>
                            <CancelIcon fontSize="small" color={canCancel(menuVenda) ? "error" : "disabled"} />
                        </ListItemIcon>
                        Cancelar NFC-e
                         {!canCancel(menuVenda) && menuVenda.status_nfe === 'EMITIDA' && (
                             <Typography variant="caption" sx={{ ml: 1, color: 'text.disabled' }}>
                                 (Prazo 30min Excedido)
                             </Typography>
                         )}
                    </MenuItem>
                )}
                
                {menuVenda?.status_nfe !== 'EMITIDA' && menuVenda?.status_nfe !== 'CANCELADA' && (
                     <MenuItem onClick={handleOpenInutilizar}>
                        <ListItemIcon><BlockIcon fontSize="small" /></ListItemIcon>
                        Inutilizar Numeração
                    </MenuItem>
                )}

                {/* Opção de Visualizar Erro (Se tiver erro ou status ERRO/REJEITADA) */}
                {menuVenda && (
                    (menuVenda.status_nfe === 'ERRO' || menuVenda.status_nfe === 'REJEITADA' || menuVenda.mensagem_nfe) 
                ) && (
                    <MenuItem onClick={handleViewError}>
                        <ListItemIcon><InfoIcon fontSize="small" color="info" /></ListItemIcon>
                        Visualizar Erro
                    </MenuItem>
                )}

                {/* Opção de Limpar XML (Apenas se tiver ERRO/REJEITADA) */}
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

            {/* Dialog de Justificativa */}
            <Dialog open={actionDialog.open} onClose={() => setActionDialog({...actionDialog, open: false})}>
                <DialogTitle>
                    {actionDialog.type === 'CANCELAR' ? 'Cancelar NFC-e' : 'Inutilizar Numeração'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {actionDialog.type === 'CANCELAR' 
                            ? 'Deseja realmente cancelar esta NFC-e autorizada? Esta ação não pode ser desfeita.'
                            : 'Deseja inutilizar a numeração desta tentativa? Use apenas se o número foi perdido ou pulado.'
                        }
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Justificativa (Mínimo 15 caracteres)"
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

            {/* Dialog de Detalhes do Cupom / Expandir Cupom */}
            <Dialog
                open={vendaDetailOpen}
                onClose={() => { if (!savingTaxes) { handleCancelEditingTaxes(); setVendaDetailOpen(false); } }}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    }
                }}
            >
                <DialogTitle 
                    sx={{ 
                        m: 0, 
                        p: 3, 
                        bgcolor: '#1a237e', 
                        color: 'white', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ReceiptIcon sx={{ fontSize: 28 }} />
                        <Box>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                Detalhes do Cupom (Venda #{selectedVendaDetail?.id})
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                                Operação: {selectedVendaDetail?.operacao?.nome_operacao || 'N/A'} | Doc: {selectedVendaDetail?.numero_documento || 'N/A'}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {selectedVendaDetail && renderStatus(selectedVendaDetail.status_nfe)}
                        <IconButton
                            aria-label="close"
                            onClick={() => { if (!savingTaxes) { handleCancelEditingTaxes(); setVendaDetailOpen(false); } }}
                            disabled={savingTaxes}
                            sx={{
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            <CancelIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 3, bgcolor: '#fbfcfd' }}>
                    {/* Seção 1: Dados do Cliente */}
                    <Paper elevation={0} variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: '#fff' }}>
                        <Typography variant="subtitle1" sx={{ color: '#1a237e', fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InfoIcon fontSize="small" />
                            Dados do Cliente
                        </Typography>
                        
                        {selectedVendaDetail?.cliente_detalhes ? (
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" color="text.secondary" display="block">Nome / Razão Social</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {selectedVendaDetail.cliente_detalhes.nome_razao_social || 'Consumidor Final'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" color="text.secondary" display="block">CPF / CNPJ</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {selectedVendaDetail.cliente_detalhes.cpf_cnpj || 'Não Informado'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" color="text.secondary" display="block">Inscrição Estadual</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {selectedVendaDetail.cliente_detalhes.inscricao_estadual || 'Isento / Não Informado'}
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" color="text.secondary" display="block">Endereço</Typography>
                                    <Typography variant="body2">
                                        {selectedVendaDetail.cliente_detalhes.endereco 
                                            ? `${selectedVendaDetail.cliente_detalhes.endereco}${selectedVendaDetail.cliente_detalhes.numero ? `, ${selectedVendaDetail.cliente_detalhes.numero}` : ''}`
                                            : 'Não cadastrado'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" color="text.secondary" display="block">Bairro / CEP</Typography>
                                    <Typography variant="body2">
                                        {selectedVendaDetail.cliente_detalhes.bairro || 'N/A'} {selectedVendaDetail.cliente_detalhes.cep ? ` | CEP: ${selectedVendaDetail.cliente_detalhes.cep}` : ''}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" color="text.secondary" display="block">Cidade / UF</Typography>
                                    <Typography variant="body2">
                                        {selectedVendaDetail.cliente_detalhes.cidade ? `${selectedVendaDetail.cliente_detalhes.cidade} - ${selectedVendaDetail.cliente_detalhes.estado || ''}` : 'N/A'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" color="text.secondary" display="block">Telefone / Celular</Typography>
                                    <Typography variant="body2">
                                        {selectedVendaDetail.cliente_detalhes.telefone || 'Não Informado'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" color="text.secondary" display="block">Email</Typography>
                                    <Typography variant="body2">
                                        {selectedVendaDetail.cliente_detalhes.email || 'Não Informado'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" color="text.secondary" display="block">WhatsApp</Typography>
                                    {selectedVendaDetail.cliente_detalhes.whatsapp ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#25d366' }}>
                                                {selectedVendaDetail.cliente_detalhes.whatsapp}
                                            </Typography>
                                            <Tooltip title="Conversar no WhatsApp">
                                                <IconButton 
                                                    size="small" 
                                                    color="success"
                                                    onClick={() => window.open(`https://wa.me/55${selectedVendaDetail.cliente_detalhes.whatsapp.replace(/\D/g, '')}`, '_blank')}
                                                >
                                                    <WhatsAppIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2">Não Informado</Typography>
                                    )}
                                </Grid>
                            </Grid>
                        ) : (
                            selectedVendaDetail?.cliente ? (
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="text.secondary" display="block">Nome / Razão Social</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {selectedVendaDetail.cliente || 'Consumidor Final'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="text.secondary" display="block">CPF / CNPJ</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {selectedVendaDetail.cpf_cnpj || 'Não Informado'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="text.secondary" display="block">Endereço / Contatos</Typography>
                                        <Typography variant="body2">
                                            {selectedVendaDetail.telefone_cliente ? `Tel: ${selectedVendaDetail.telefone_cliente}` : ''} 
                                            {selectedVendaDetail.email_cliente ? ` | Email: ${selectedVendaDetail.email_cliente}` : ''}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Consumidor Final (Sem cadastro associado)
                                </Typography>
                            )
                        )}
                    </Paper>

                    {/* Seção 2: Produtos e Tributação */}
                    <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
                        <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ShoppingCartIcon sx={{ color: '#1a237e' }} />
                            <Typography variant="subtitle1" sx={{ color: '#1a237e', fontWeight: 600 }}>
                                Itens do Cupom & Tributação
                            </Typography>
                        </Box>
                        
                        <TableContainer sx={{ maxHeight: 400 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fff', zIndex: 1 }}>Cod / Produto</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#fff', zIndex: 1 }}>Qtd</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#fff', zIndex: 1 }}>Vl. Unit</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#fff', zIndex: 1 }}>Subtotal</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#fff', zIndex: 1 }}>CFOP</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#fff', zIndex: 1 }}>CSOSN/CST</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#fff', zIndex: 1 }}>IPI</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#fff', zIndex: 1 }}>PIS</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#fff', zIndex: 1 }}>COFINS</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#fff', zIndex: 1 }}>Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedVendaDetail?.itens && selectedVendaDetail.itens.length > 0 ? (
                                        selectedVendaDetail.itens.map((item, index) => {
                                            const vUnit = parseFloat(item.valor_unitario || 0);
                                            const qty = parseFloat(item.quantidade || 0);
                                            const sub = parseFloat(item.subtotal || item.valor_total || (vUnit * qty));
                                            const totalItem = parseFloat(item.valor_total || (vUnit * qty));
                                            
                                            const editableItem = isEditingTaxes 
                                                ? editableItens.find(it => it.id_item === item.id) 
                                                : null;

                                            const handleChangeItemField = (field, val) => {
                                                setEditableItens(prev => prev.map(it => {
                                                    if (it.id_item === item.id) {
                                                        return { ...it, [field]: val };
                                                    }
                                                    return it;
                                                }));
                                            };
                                            
                                            return (
                                                <TableRow key={item.id || index} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {item.nome_produto || item.produto}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Cód: {item.codigo_produto || item.codigo || 'N/A'} {item.ncm_codigo ? `| NCM: ${item.ncm_codigo}` : ''}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">{qty.toLocaleString('pt-BR')}</TableCell>
                                                    <TableCell align="right">
                                                        {vUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {sub.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {isEditingTaxes && editableItem ? (
                                                            <TextField
                                                                value={editableItem.cfop || ''}
                                                                onChange={(e) => handleChangeItemField('cfop', e.target.value)}
                                                                size="small"
                                                                variant="standard"
                                                                inputProps={{ style: { textAlign: 'center', fontSize: '0.85rem' } }}
                                                                sx={{ width: 60 }}
                                                            />
                                                        ) : item.cfop ? (
                                                            <Chip label={item.cfop} size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.75rem' }} />
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {isEditingTaxes && editableItem ? (
                                                            <TextField
                                                                value={editableItem.cst || ''}
                                                                onChange={(e) => handleChangeItemField('cst', e.target.value)}
                                                                size="small"
                                                                variant="standard"
                                                                inputProps={{ style: { textAlign: 'center', fontSize: '0.85rem' } }}
                                                                sx={{ width: 60 }}
                                                            />
                                                        ) : item.icms_cst_csosn ? (
                                                            <Chip label={item.icms_cst_csosn} size="small" variant="outlined" color="secondary" sx={{ height: 20, fontSize: '0.75rem' }} />
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {isEditingTaxes && editableItem ? (
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                                                                <TextField
                                                                    label="CST"
                                                                    value={editableItem.ipi_cst || ''}
                                                                    onChange={(e) => handleChangeItemField('ipi_cst', e.target.value)}
                                                                    size="small"
                                                                    variant="standard"
                                                                    inputProps={{ style: { textAlign: 'center', fontSize: '0.75rem' } }}
                                                                    sx={{ width: 45 }}
                                                                />
                                                                <TextField
                                                                    label="Aliq%"
                                                                    type="number"
                                                                    value={editableItem.ipi_aliq}
                                                                    onChange={(e) => handleChangeItemField('ipi_aliq', e.target.value)}
                                                                    size="small"
                                                                    variant="standard"
                                                                    inputProps={{ style: { textAlign: 'center', fontSize: '0.75rem' }, step: "0.01" }}
                                                                    sx={{ width: 55 }}
                                                                />
                                                            </Box>
                                                        ) : (
                                                            <Box sx={{ fontSize: '0.75rem', lineHeight: 1.1 }}>
                                                                <div>CST: {item.ipi_cst || '-'}</div>
                                                                {parseFloat(item.ipi_aliq || 0) > 0 && <div>{parseFloat(item.ipi_aliq).toFixed(2)}%</div>}
                                                                {parseFloat(item.valor_ipi || 0) > 0 && <div style={{color: '#2e7d32'}}>R$ {parseFloat(item.valor_ipi).toFixed(2)}</div>}
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {isEditingTaxes && editableItem ? (
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                                                                <TextField
                                                                    label="CST"
                                                                    value={editableItem.pis_cst || ''}
                                                                    onChange={(e) => handleChangeItemField('pis_cst', e.target.value)}
                                                                    size="small"
                                                                    variant="standard"
                                                                    inputProps={{ style: { textAlign: 'center', fontSize: '0.75rem' } }}
                                                                    sx={{ width: 45 }}
                                                                />
                                                                <TextField
                                                                    label="Aliq%"
                                                                    type="number"
                                                                    value={editableItem.pis_aliq}
                                                                    onChange={(e) => handleChangeItemField('pis_aliq', e.target.value)}
                                                                    size="small"
                                                                    variant="standard"
                                                                    inputProps={{ style: { textAlign: 'center', fontSize: '0.75rem' }, step: "0.01" }}
                                                                    sx={{ width: 55 }}
                                                                />
                                                            </Box>
                                                        ) : (
                                                            <Box sx={{ fontSize: '0.75rem', lineHeight: 1.1 }}>
                                                                <div>CST: {item.pis_cst || '-'}</div>
                                                                {parseFloat(item.pis_aliq || 0) > 0 && <div>{parseFloat(item.pis_aliq).toFixed(2)}%</div>}
                                                                {parseFloat(item.valor_pis || 0) > 0 && <div style={{color: '#2e7d32'}}>R$ {parseFloat(item.valor_pis).toFixed(2)}</div>}
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {isEditingTaxes && editableItem ? (
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                                                                <TextField
                                                                    label="CST"
                                                                    value={editableItem.cofins_cst || ''}
                                                                    onChange={(e) => handleChangeItemField('cofins_cst', e.target.value)}
                                                                    size="small"
                                                                    variant="standard"
                                                                    inputProps={{ style: { textAlign: 'center', fontSize: '0.75rem' } }}
                                                                    sx={{ width: 45 }}
                                                                />
                                                                <TextField
                                                                    label="Aliq%"
                                                                    type="number"
                                                                    value={editableItem.cofins_aliq}
                                                                    onChange={(e) => handleChangeItemField('cofins_aliq', e.target.value)}
                                                                    size="small"
                                                                    variant="standard"
                                                                    inputProps={{ style: { textAlign: 'center', fontSize: '0.75rem' }, step: "0.01" }}
                                                                    sx={{ width: 55 }}
                                                                />
                                                            </Box>
                                                        ) : (
                                                            <Box sx={{ fontSize: '0.75rem', lineHeight: 1.1 }}>
                                                                <div>CST: {item.cofins_cst || '-'}</div>
                                                                {parseFloat(item.cofins_aliq || 0) > 0 && <div>{parseFloat(item.cofins_aliq).toFixed(2)}%</div>}
                                                                {parseFloat(item.valor_cofins || 0) > 0 && <div style={{color: '#2e7d32'}}>R$ {parseFloat(item.valor_cofins).toFixed(2)}</div>}
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                        {totalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                                                Nenhum produto cadastrado nesta venda.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Seção 3: Resumo Financeiro & Pagamentos */}
                    <Grid container spacing={3}>
                        {/* Formas de Pagamento */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#fff', height: '100%' }}>
                                <Typography variant="subtitle1" sx={{ color: '#1a237e', fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ViewListIcon fontSize="small" />
                                    Formas de Pagamento
                                </Typography>
                                
                                {selectedVendaDetail?.pagamentos && selectedVendaDetail.pagamentos.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {selectedVendaDetail.pagamentos.map((pag, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px dashed #e0e0e0' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#455a64' }}>
                                                    {pag.nome_forma_pagamento || pag.forma_pagamento || 'Outro'}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                                    {parseFloat(pag.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    selectedVendaDetail?.forma_pagamento ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px dashed #e0e0e0' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#455a64' }}>
                                                {selectedVendaDetail.forma_pagamento}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                                {parseFloat(selectedVendaDetail.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Nenhum registro de pagamento encontrado.
                                        </Typography>
                                    )
                                )}
                            </Paper>
                        </Grid>

                        {/* Totais do Documento */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#fff', height: '100%' }}>
                                <Typography variant="subtitle1" sx={{ color: '#1a237e', fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ShoppingCartIcon fontSize="small" />
                                    Resumo de Valores
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {/* Total de Itens */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">Subtotal dos Produtos</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {selectedVendaDetail?.itens
                                                ? selectedVendaDetail.itens.reduce((acc, it) => acc + parseFloat(it.valor_unitario || 0) * parseFloat(it.quantidade || 0), 0)
                                                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                : parseFloat(selectedVendaDetail?.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                            }
                                        </Typography>
                                    </Box>
                                    
                                    {/* Desconto */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">Descontos</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'error.main' }}>
                                            {selectedVendaDetail?.itens
                                                ? selectedVendaDetail.itens.reduce((acc, it) => acc + parseFloat(it.desconto_valor || it.desconto || 0), 0)
                                                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                : 'R$ 0,00'
                                            }
                                        </Typography>
                                    </Box>

                                    {/* Tributos */}
                                    {selectedVendaDetail?.itens && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">Total Tributos (Aprox.)</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                                                {selectedVendaDetail.itens.reduce((acc, it) => acc + parseFloat(it.valor_total_tributos || 0), 0)
                                                    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                }
                                            </Typography>
                                        </Box>
                                    )}
                                    
                                    <Box sx={{ borderTop: '1px solid #e0e0e0', my: 1 }} />
                                    
                                    {/* Total Geral */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Valor Total</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                            {parseFloat(selectedVendaDetail?.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2.5, bgcolor: '#f8f9fa', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {isEditingTaxes ? (
                            <>
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleSalvarImpostos}
                                    disabled={savingTaxes}
                                >
                                    {savingTaxes ? <CircularProgress size={20} color="inherit" /> : 'Salvar'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={handleCancelEditingTaxes}
                                    disabled={savingTaxes}
                                >
                                    Cancelar
                                </Button>
                            </>
                        ) : (
                            <>
                                {!isVendaFinalized(selectedVendaDetail) && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleStartEditingTaxes}
                                    >
                                        Editar Impostos
                                    </Button>
                                )}
                                {(selectedVendaDetail?.status_nfe === 'EMITIDA' || selectedVendaDetail?.status_nfe === 'CONTINGENCIA') && (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<PrintIcon />}
                                        onClick={() => handleImprimirNFCe(selectedVendaDetail.id)}
                                    >
                                        Imprimir Cupom
                                    </Button>
                                )}
                                {selectedVendaDetail && (
                                    <WhatsAppQuickSend
                                        telefone={selectedVendaDetail.whatsapp_cliente || selectedVendaDetail.telefone_cliente || selectedVendaDetail.telefone_celular || selectedVendaDetail.telefone || selectedVendaDetail.cliente_detalhes?.whatsapp || selectedVendaDetail.cliente_detalhes?.telefone}
                                        nome={selectedVendaDetail.cliente || selectedVendaDetail.nome_cliente}
                                        mensagemPadrao={templates.nfce_emitida(
                                            selectedVendaDetail.cliente || selectedVendaDetail.nome_cliente || 'Cliente',
                                            selectedVendaDetail.numero_nfe || selectedVendaDetail.numero_documento,
                                            parseFloat(selectedVendaDetail.valor_total || 0).toFixed(2),
                                            selectedVendaDetail.chave_nfe || ''
                                        )}
                                        tipoEnvio="nfce"
                                        idRelacionado={selectedVendaDetail.id}
                                        onSuccess={() => console.log('WhatsApp NFC-e enviado de dentro dos detalhes!')}
                                    />
                                )}
                            </>
                        )}
                    </Box>
                    <Button 
                        onClick={() => {
                            if (isEditingTaxes) {
                                handleCancelEditingTaxes();
                            }
                            setVendaDetailOpen(false);
                        }}
                        variant="outlined"
                        color="primary"
                        disabled={savingTaxes}
                    >
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default NFCePage;
