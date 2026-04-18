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
  ListItemIcon
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
  WhatsApp as WhatsAppIcon
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
            console.log("🔍 Buscando vendas NFC-e (modelo=65)...");
            
            const params = {
                ordering: '-id_venda',
                limit: 50,
                modelo: '65' 
            };

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
            // Aumentando timeout para 60 segundos (emissão pode ser lenta em homologação/SOAP)
            const response = await axiosInstance.post(`/vendas/${vendaId}/emitir_nfce/`, {}, { timeout: 60000 });
            
            console.log("✅ Emissão concluída:", response.data);
            
            const msg = response.data.message || 'NFC-e Emitida com Sucesso!';
            showToast(msg, 'success');
            
            // Recarrega a lista para atualizar status
            fetchVendas();
            
        } catch (err) {
            console.error("❌ Erro na emissão:", err);
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

    // Efeito inicial
    useEffect(() => {
        fetchVendas();
    }, []);

    return (
        <Box sx={{ p: 3, maxWidth: '100%', margin: '0 auto', bgcolor: '#f4f6f8', minHeight: 'calc(100vh - 64px)' }}>
            
            {/* Header */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff' }}>
                <Box>
                    <Typography variant="h5" component="h1" sx={{ color: '#1a237e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptIcon sx={{ fontSize: 32 }} />
                        Emissão de NFC-e
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerencie e emita suas Notas Fiscais de Consumidor Eletrônica (Modelo 65)
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
                                            Operação / NFC-e
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
                                            Nenhuma venda NFC-e encontrada recentement.
                                        </Typography>
                                        <Typography variant="body2" color="text.disabled">
                                            Verifique se as vendas estão cadastradas com a Operação correta (Modelo 65).
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
        </Box>
    );
};

export default NFCePage;
