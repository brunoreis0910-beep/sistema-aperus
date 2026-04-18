// Em: src/pages/AprovacoesPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Fade, CircularProgress,
  List, ListItem, ListItemText, IconButton, Divider, Grid,
  Paper, Button, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
// Grid from @mui/material is used (Unstable_Grid2 not available in this environment)
// Ícones
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock'; 
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close'; // <-- Importação CORRIGIDA
// Contexto de Autenticação
import { useAuth } from '../context/AuthContext'; 

function AprovacoesPage() {
  // Pega o usuário, permissões e o axiosInstance do Contexto
  const { user, axiosInstance, isLoading: authLoading } = useAuth();

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);

  // função para buscar as solicitações PENDENTES
  const fetchSolicitacoes = async () => {
    setLoading(true);
    try {
      // Busca apenas solicitações pendentes para o supervisor
      const res = await axiosInstance.get('/solicitacoes/pendentes/');
      setSolicitacoes(res.data);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
    } finally {
      setLoading(false);
    }
  };

  // Busca as solicitações quando a página carrega
  useEffect(() => {
    if (!authLoading) {
        // A página só carrega se o usuário for Admin.
        // Se não for Admin, ele verá a tela de Acesso Negado.
        if (user && user.is_staff) { 
            fetchSolicitacoes();
        }
    }
  }, [authLoading, user]);

  // função para lidar com a APROVação ou REJEIÇéO
  const handleDecisao = async (id, decisao) => {
    if (!user.is_staff) {
      alert("Apenas supervisores podem tomar decisões sobre solicitações.");
      return;
    }
    
    let observacao = '';
    let promptMessage = decisao === 'Aprovada' ? 'Observação para a aprovação (Opcional):' : 'Motivo da Rejeiçéo (Obrigatório):';

    observacao = prompt(promptMessage);
    
    if (decisao === 'Rejeitada' && (!observacao || observacao.trim() === '')) {
      alert("A observação é obrigatória ao rejeitar.");
      return;
    }

    setLoading(true); 
    
    try {
      const data = {
        status: decisao,
        observacao_supervisor: observacao || '',
        id_usuario_supervisor: user.id, 
        data_aprovacao: new Date().toISOString(), 
      };

      await axiosInstance.patch(`/solicitacoes/${id}/`, data);

      alert(`Solicitação ${decisao.toLowerCase()} com sucesso!`);
      fetchSolicitacoes(); // Recarrega a lista

    } catch (error) {
      console.error(`Erro ao ${decisao.toLowerCase()} solicitação:`, error);
      alert(`Erro ao ${decisao.toLowerCase()} solicitação.`);
      setLoading(false);
    }
  };

  // Se o usuário (do AuthContext) ainda não foi carregado, mostra um loading
  if (authLoading) {
    return <CircularProgress />;
  }
  
  // VERIFICação DE PERMISsão (NÍVEL DA PÁGINA)
  if (!user || !user.is_staff) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>
          <LockIcon sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
          Acesso Negado
        </Typography>
        <Typography variant="body1">
          Apenas Administradores podem acessar o módulo de Aprovações.
        </Typography>
      </Box>
    );
  }
  
  // --- Renderização ---
  return (
    <Fade in={true} timeout={500}>
      <Box sx={{width: '100%'}}>
        <Typography variant="h5" sx={{ mb: 3, alignSelf: 'flex-start' }}>
          Central de Aprovações Pendentes
        </Typography>
        
        {loading ? ( <CircularProgress sx={{ mt: 2 }} /> )
         : solicitacoes.length === 0 ? ( <Typography sx={{ mt: 2 }}>(Nenhuma solicitação pendente no momento)</Typography> )
         : (
            <List sx={{ width: '100%', bgcolor: 'background.paper', mt: 1, border: '1px solid #ddd', borderRadius: 1 }}>
              {solicitacoes.map((req, index) => (
                <React.Fragment key={req.id_solicitacao}>
                  <ListItem 
                    secondaryAction={
                      <Box>
                        <Tooltip title="Ver Detalhes">
                          <IconButton onClick={() => { setSelectedSolicitacao(req); setShowDetail(true); }}><VisibilityIcon fontSize="small"/></IconButton>
                        </Tooltip>
                        <Tooltip title="Aprovar">
                          <IconButton edge="end" aria-label="aprovar" sx={{ mr: 1 }} onClick={() => handleDecisao(req.id_solicitacao, 'Aprovada')}>
                            <CheckCircleIcon color="success" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rejeitar">
                          <IconButton edge="end" aria-label="rejeitar" onClick={() => handleDecisao(req.id_solicitacao, 'Rejeitada')}>
                            <CancelIcon color="error"/>
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={`[${req.tipo_solicitacao}] - Solicitado por: ${req.solicitante_nome}`}
                      secondary={
                        <React.Fragment>
                          <Typography component="span" variant="body2" color="text.primary">
                            {`Justificativa: ${req.observacao_solicitante || "N/A"}`}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="text.secondary">
                            {`ID: ${req.id_registro || "N/A"} | Data: ${new Date(req.data_solicitacao).toLocaleDateString('pt-BR')}`}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  {index < solicitacoes.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
         )}
         
        {/* Diálogo de Detalhes da Solicitação (Modal) */}
        <Dialog open={showDetail} onClose={() => setShowDetail(false)} fullWidth maxWidth="sm">
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
            <DialogContent dividers>
                {selectedSolicitacao && (
                    <Grid container spacing={2}>
                        <Grid item xs={12}><Typography variant="subtitle1">**ação Requerida:** {selectedSolicitacao.tipo_solicitacao}</Typography></Grid>
                        <Grid item xs={12}><Typography variant="subtitle1">**Registro ID:** {selectedSolicitacao.id_registro || 'N/A'}</Typography></Grid>
                        <Grid item xs={12}><Typography variant="subtitle1">**Solicitante:** {selectedSolicitacao.solicitante_nome}</Typography></Grid>
                        <Grid item xs={12}><Typography variant="subtitle1">**Data do Pedido:** {new Date(selectedSolicitacao.data_solicitacao).toLocaleString('pt-BR')}</Typography></Grid>
                        
                        <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                        <Grid item xs={12}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Justificativa:</Typography>
                            <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: '#f5f5f5' }}>
                                {selectedSolicitacao.observacao_solicitante || "Nenhuma justificativa fornecida."}
                            </Paper>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Dados Adicionais (JSON):</Typography>
                            <TextField
                                multiline
                                rows={4}
                                fullWidth
                                value={selectedSolicitacao.dados_solicitacao || 'N/A'}
                                InputProps={{ readOnly: true }}
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowDetail(false)} startIcon={<CloseIcon />}>Fechar</Button>
                <Button onClick={() => handleDecisao(selectedSolicitacao.id_solicitacao, 'Aprovada')} color="success" variant="contained" startIcon={<CheckCircleIcon />}>Aprovar</Button>
                <Button onClick={() => handleDecisao(selectedSolicitacao.id_solicitacao, 'Rejeitada')} color="error" variant="outlined" startIcon={<CancelIcon />}>Rejeitar</Button>
            </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
}

export default AprovacoesPage;