import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, CircularProgress, Chip, Alert,
  IconButton, Tooltip, Menu, MenuItem, ListItemIcon,
  Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions,
  InputAdornment, Card, CardContent, Grid
} from '@mui/material';
import { 
  LocalShipping as TruckIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  CleaningServices as CleanIcon,
  Info as InfoIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import CTeForm from '../components/CTe/CTeForm';
import WhatsAppQuickSend, { useWhatsAppTemplates } from '../components/WhatsAppQuickSend';
import EmailDocumentoDialog from '../components/EmailDocumentoDialog';

const CTePage = () => {
    const { axiosInstance } = useAuth();
    const { showToast } = useToast();
    const templates = useWhatsAppTemplates();
    
    // Data States
    const [ctes, setCtes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    
    // Filters
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Dialogs States
    const [openNewDialog, setOpenNewDialog] = useState(false);
    const [actionDialog, setActionDialog] = useState({ open: false, type: null, cte: null });
    const [justificativa, setJustificativa] = useState('');
    const [errorDialog, setErrorDialog] = useState({ open: false, message: '' });
    const [emailDialog, setEmailDialog] = useState({ open: false, cte: null });

    // Menu States
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuCte, setMenuCte] = useState(null);

    useEffect(() => {
        fetchCTes();
    }, []);

    // --- Data Fetching ---

    const fetchCTes = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                ordering: '-id_cte', 
                limit: 50,
                modelo: '57'
            };
            if (filterDateStart) params.data_inicial = filterDateStart;
            if (filterDateEnd) params.data_final = filterDateEnd;
            if (searchTerm) params.search = searchTerm;

            const response = await axiosInstance.get('ctes/', { params });
            
            // Normalize response
            let data = [];
            if (response.data && Array.isArray(response.data.results)) {
                data = response.data.results;
            } else if (Array.isArray(response.data)) {
                data = response.data;
            }

            setCtes(data);
        } catch (err) {
            console.error("Erro ao buscar CTe:", err);
            setError("Não foi possível carregar a lista. Verifique sua conexão.");
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const handleEmitir = async (cte) => {
        const id = cte.id_cte || cte.id;
        if (processingId === id) return;
        
        setProcessingId(id);
        showToast('Enviando para SEFAZ...', 'info');
        
        try {
            const response = await axiosInstance.post(`ctes/${id}/emitir_cte/`);
            showToast(response.data.message || 'CT-e Autorizado!', 'success');
            fetchCTes();
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Erro ao emitir.';
            showToast(`Falha: ${msg}`, 'error');
        } finally {
            setProcessingId(null);
            handleMenuClose();
        }
    };

    const handleAction = async () => {
        const { type, cte } = actionDialog;
        const id = cte.id_cte || cte.id;
        
        if (!justificativa || justificativa.length < 15) {
            showToast('Justificativa muito curta (min 15 caracteres).', 'warning');
            return;
        }

        setProcessingId(id);
        setActionDialog({ ...actionDialog, open: false });

        let endpoint = '';
        if (type === 'CANCELAR') endpoint = `ctes/${id}/cancelar_cte/`;
        else if (type === 'INUTILIZAR') endpoint = `ctes/${id}/inutilizar_cte/`;
        else if (type === 'CCE') endpoint = `ctes/${id}/carta_correcao_cte/`;

        try {
            const payload = type === 'CCE' ? { correcao: justificativa } : { justificativa };
            await axiosInstance.post(endpoint, payload);
            showToast('Evento registrado com sucesso!', 'success');
            fetchCTes();
        } catch (err) {
            console.error(err);
            showToast('Erro ao registrar evento.', 'error');
        } finally {
            setProcessingId(null);
            setJustificativa('');
        }
    };

    const handleDownloadXML = async (cte) => {
        const id = cte.id_cte || cte.id;
        handleMenuClose();
        
        try {
            showToast('Baixando XML...', 'info');
            const response = await axiosInstance.get(`ctes/${id}/baixar_xml/`, {
                responseType: 'blob'
            });
            
            // Create Blob URL
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Extract filename from header if possible, else default
            const contentDisp = response.headers['content-disposition'];
            let filename = `cte_${cte.numero_cte || id}.xml`;
            if (contentDisp && contentDisp.indexOf('filename=') !== -1) {
                filename = contentDisp.split('filename=')[1].replace(/"/g, '');
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            showToast('Download concluído', 'success');
        } catch (err) {
            console.error(err);
            showToast('Erro ao baixar XML. Tente novamente.', 'error');
        }
    };

    // --- Handling Errors and Cleaning ---

    const handleViewError = () => {
        if (!menuCte) return;
        const msg = menuCte.xmotivo || menuCte.mensagem_erro || "Sem detalhes do erro.";
        setErrorDialog({ open: true, message: msg });
        handleMenuClose();
    };

    const handleClearError = async () => {
        if (!menuCte) return;
        const id = menuCte.id_cte || menuCte.id;
        handleMenuClose();

        if (!window.confirm("Deseja limpar o status de ERRO deste CT-e?\n\nIsso permitirá editá-lo ou excluí-lo.")) return;

        setProcessingId(id);
        try {
            await axiosInstance.post(`ctes/${id}/limpar_erro/`);
            showToast('Status de erro limpo com sucesso.', 'success');
            fetchCTes();
        } catch (err) {
            console.error(err);
            showToast('Erro ao limpar status de erro.', 'error');
        } finally {
            setProcessingId(null);
        }
    };
    
    const handleDelete = async (cte) => {
        const id = cte.id_cte || cte.id;
        
        // Validation Strict
        const status = (cte.status_cte || 'PENDENTE').toUpperCase();
        if (status !== 'PENDENTE') {
             showToast('Apenas CT-e com status PENDENTE pode ser excluído.', 'warning');
             handleMenuClose();
             return;
        }

        if (!window.confirm(`CONFIRMAÇÃO:\nDeseja realmente excluir este CT-e #${cte.numero_cte || id}?\nAção irreversível.`)) return;
        
        try {
            await axiosInstance.delete(`ctes/${id}/`);
            showToast('CT-e Excluído com sucesso.', 'success');
            fetchCTes();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || "Erro ao excluir CT-e.";
            showToast(msg, 'error');
        } finally {
            handleMenuClose();
        }
    };

    const handlePrintDACTE = async (cte) => {
        const id = cte.id_cte || cte.id;
        handleMenuClose();
        
        try {
            showToast('Gerando DACTE...', 'info');
            const response = await axiosInstance.get(`ctes/${id}/imprimir_dacte/`, {
                responseType: 'blob'
            });
            
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
            
        } catch (err) {
            console.error(err);
            showToast('Erro ao gerar DACTE.', 'error');
        }
    };

    // --- UI Helpers ---

    const handleMenuOpen = (event, cte) => { setAnchorEl(event.currentTarget); setMenuCte(cte); };
    const handleMenuClose = () => { setAnchorEl(null); setMenuCte(null); };

    const getStatusChip = (status) => {
        const s = (status || 'PENDENTE').toUpperCase();
        if (s === 'AUTORIZADA' || s === 'EMITIDO' || s === 'AUTORIZADO') return <Chip icon={<CheckCircleIcon />} label="AUTORIZADO" color="success" size="small" variant="filled" />;
        if (s === 'CANCELADO' || s === 'CANCELADA') return <Chip icon={<CancelIcon />} label="CANCELADO" color="error" size="small" variant="filled" />;
        if (s === 'INUTILIZADO' || s === 'INUTILIZADA') return <Chip icon={<BlockIcon />} label="INUTILIZADO" color="default" size="small" variant="filled" />;
        if (s === 'ERRO' || s === 'REJEITADO' || s === 'REJEITADA') return <Chip icon={<ErrorIcon />} label="REJEITADO" color="error" size="small" variant="outlined" />;
        return <Chip label={s} color="warning" size="small" variant="outlined" />;
    };

    // --- Render ---

    return (
        <Box sx={{ p: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
            
            {/* Full Screen Form Dialog */}
            <Dialog 
                open={openNewDialog} 
                onClose={() => setOpenNewDialog(false)} 
                fullScreen
                TransitionProps={{ mountOnEnter: true, unmountOnExit: true }}
            >
                <CTeForm 
                    onClose={() => setOpenNewDialog(false)}
                    onSaveSuccess={() => {
                        setOpenNewDialog(false);
                        fetchCTes();
                    }}
                />
            </Dialog>

            {/* Action Dialog (Cancel/CCe) */}
            <Dialog open={actionDialog.open} onClose={() => setActionDialog({...actionDialog, open: false})}>
                <DialogTitle>{actionDialog.type === 'CCE' ? 'Carta de Correção' : 'Justificativa'}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        {actionDialog.type === 'CANCELAR' ? 'Informe o motivo do cancelamento (ex: Erro na emissão).' : 
                         actionDialog.type === 'CCE' ? 'Descreva a correção necessária.' : 'Motivo da inutilização.'}
                    </DialogContentText>
                    <TextField
                        autoFocus
                        multiline
                        rows={3}
                        fullWidth
                        label="Descrição (min. 15 caracteres)"
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialog({...actionDialog, open: false})}>Voltar</Button>
                    <Button onClick={handleAction} variant="contained" color="primary">Confirmar</Button>
                </DialogActions>
            </Dialog>

            {/* Header Section */}
            <Box mb={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <TruckIcon fontSize="large" /> Gestão de CT-e
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Conhecimentos de Transporte Eletrônicos
                        </Typography>
                    </Box>
                    <Button 
                        variant="contained" 
                        size="large" 
                        startIcon={<AddIcon />} 
                        onClick={() => setOpenNewDialog(true)}
                        sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', boxShadow: 3 }}
                    >
                        Novo CT-e
                    </Button>
                </Box>

                {/* Filters Card */}
                <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <CardContent sx={{ py: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                             <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Buscar por Número, Chave ou Cliente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    label="De"
                                    value={filterDateStart}
                                    onChange={(e) => setFilterDateStart(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                             <Grid item xs={6} md={3}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    label="Até"
                                    value={filterDateEnd}
                                    onChange={(e) => setFilterDateEnd(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    onClick={fetchCTes}
                                    startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                                >
                                    Filtrar
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>

            {/* Data Table */}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Número</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Emissão</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Tomador / Destinatário</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Motorista</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Valor Total</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Chave Acesso</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading && ctes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : ctes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                                        <FileIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                                        <Typography color="text.secondary">Nenhum CT-e encontrado para os filtros selecionados.</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            ctes.map((cte) => (
                                <TableRow key={cte.id_cte} hover>
                                    <TableCell>
                                        <Typography fontWeight="bold" color="primary">
                                            {cte.numero_cte || '---'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Série {cte.serie_cte || '1'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(cte.data_emissao).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" flexDirection="column">
                                            <Typography variant="body2" fontWeight="500">
                                                {cte.remetente_detail?.nome_razao_social || '---'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {cte.cidade_destino_nome ? `Destino: ${cte.cidade_destino_nome} - ${cte.cidade_destino_uf}` : ''}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {cte.condutor_nome || '---'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontWeight="bold" color="success.main">
                                            R$ {parseFloat(cte.valor_total_servico || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={cte.chave_cte || ''}>
                                            <Box sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 0.5, borderRadius: 1 }}>
                                                {cte.chave_cte || '---'}
                                            </Box>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusChip(cte.status_cte)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
                                            {cte.status_cte === 'AUTORIZADA' && (
                                                <WhatsAppQuickSend
                                                    telefone={cte.whatsapp_tomador || cte.whatsapp_remetente || cte.telefone_tomador || cte.telefone_remetente}
                                                    nome={cte.nome_tomador || cte.remetente_detail?.nome_razao_social}
                                                    mensagemPadrao={templates.cte_emitido(
                                                        cte.nome_tomador || cte.remetente_detail?.nome_razao_social || 'Cliente',
                                                        cte.numero_cte,
                                                        cte.cidade_destino_nome ? `${cte.cidade_destino_nome} - ${cte.cidade_destino_uf}` : 'Destino'
                                                    )}
                                                    tipoEnvio="cte"
                                                    idRelacionado={cte.id_cte}
                                                    onSuccess={() => console.log('WhatsApp CT-e enviado!')}
                                                />
                                            )}
                                            <IconButton onClick={(e) => handleMenuOpen(e, cte)}>
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

            {/* Menu Ações */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    elevation: 3,
                    sx: { minWidth: 200 }
                }}
            >
                <Box px={2} py={1} borderBottom="1px solid #eee">
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        CT-e {menuCte?.numero_cte}
                    </Typography>
                </Box>
                
                {/* Actions based on Status */}
                {/* 1. Transmitir (Só se PENDENTE ou ERRO, mas ERRO agora pede limpar antes para evitar loop, embora aqui deixaremos transmitir direto se usuario quiser tentar de novo) */}
                {(!menuCte?.status_cte || menuCte?.status_cte === 'PENDENTE' || menuCte?.status_cte === 'ERRO' || menuCte?.status_cte === 'REJEITADO') && [
                    <MenuItem key="emitir" onClick={() => handleEmitir(menuCte)}>
                        <ListItemIcon><SendIcon fontSize="small" color="primary" /></ListItemIcon>
                        Transmitir SEFAZ
                    </MenuItem>
                ]}
                
                {/* 2. Visualizar Erro e Limpar Erro (Só se ERRO/REJEITADO) */}
                {(menuCte?.status_cte === 'ERRO' || menuCte?.status_cte === 'REJEITADO' || menuCte?.xmotivo) && [
                    <MenuItem key="view_erro" onClick={handleViewError}>
                        <ListItemIcon><InfoIcon fontSize="small" color="info" /></ListItemIcon>
                        Visualizar Erro
                    </MenuItem>
                ]}
                
                 {(menuCte?.status_cte === 'ERRO' || menuCte?.status_cte === 'REJEITADO') && [
                    <MenuItem key="clean_erro" onClick={handleClearError} sx={{ color: 'warning.main' }}>
                        <ListItemIcon><CleanIcon fontSize="small" color="warning" /></ListItemIcon>
                        Limpar Erro
                    </MenuItem>
                ]}

                {/* 3. Excluir (SÓ SE PENDENTE) */}
                {(!menuCte?.status_cte || menuCte?.status_cte === 'PENDENTE') && [
                    <MenuItem key="excluir" onClick={() => handleDelete(menuCte)} sx={{ color: 'error.main' }}>
                        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                        Excluir
                    </MenuItem>
                ]}
                
                {/* Permite baixar XML em ERRO para debug */}
                {(menuCte?.status_cte === 'AUTORIZADO' || menuCte?.status_cte === 'EMITIDO' || menuCte?.status_cte === 'ERRO' || menuCte?.status_cte === 'REJEITADO') && [
                    <MenuItem key="pdf" onClick={() => handlePrintDACTE(menuCte)} disabled={menuCte?.status_cte === 'ERRO' || menuCte?.status_cte === 'REJEITADO'}>
                        <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
                        Imprimir DACTE
                    </MenuItem>,
                    <MenuItem key="xml" onClick={() => handleDownloadXML(menuCte)}>
                        <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                        Baixar XML
                    </MenuItem>,
                    <MenuItem key="email" onClick={() => { setEmailDialog({ open: true, cte: menuCte }); handleMenuClose(); }} disabled={menuCte?.status_cte === 'ERRO' || menuCte?.status_cte === 'REJEITADO'}>
                        <ListItemIcon><EmailIcon fontSize="small" color="primary" /></ListItemIcon>
                        Enviar por E-mail
                    </MenuItem>,
                    <MenuItem key="cce" onClick={() => { setActionDialog({ open: true, type: 'CCE', cte: menuCte }); handleMenuClose(); }} disabled={menuCte?.status_cte === 'ERRO' || menuCte?.status_cte === 'REJEITADO'}>
                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                        Carta de Correção
                    </MenuItem>,
                    <MenuItem key="cancel" onClick={() => { setActionDialog({ open: true, type: 'CANCELAR', cte: menuCte }); handleMenuClose(); }} disabled={menuCte?.status_cte === 'ERRO' || menuCte?.status_cte === 'REJEITADO'}>
                        <ListItemIcon><CancelIcon fontSize="small" color="error" /></ListItemIcon>
                        Cancelar CT-e
                    </MenuItem>
                ]}
                
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

            {/* Dialog: Enviar por E-mail */}
            <EmailDocumentoDialog
                open={emailDialog.open}
                onClose={() => setEmailDialog({ open: false, cte: null })}
                tipo="cte"
                documentoId={emailDialog.cte?.id_cte}
                numero={emailDialog.cte?.numero_cte}
                chave={emailDialog.cte?.chave_cte}
                emailDestinatario={emailDialog.cte?.destinatario_detail?.email || emailDialog.cte?.remetente_detail?.email || ''}
                nomeDestinatario={emailDialog.cte?.destinatario_detail?.nome_razao_social || emailDialog.cte?.nome_tomador || ''}
                valorTotal={emailDialog.cte?.valor_total_servico}
                temXml={!!emailDialog.cte?.chave_cte}
                temPdf={!!emailDialog.cte?.chave_cte}
                onSuccess={(msg) => showToast(msg, 'success')}
                onError={(msg) => showToast(msg, 'error')}
            />
        </Box>
    );
};

export default CTePage;
