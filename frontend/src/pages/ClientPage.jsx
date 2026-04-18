// Em: src/pages/ClientPage.jsx
// --- VERsão FINAL (Refatorada com "Pedaços") ---

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Fade, CircularProgress,
  List, ListItem, ListItemText, IconButton, Divider, 
  Avatar, Paper, Button, Tooltip
} from '@mui/material';
// Ícones
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person'; 
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock'; 
// Helpers
import { useAuth } from '../context/AuthContext';

// --- 1. Importa os "Pedaços" (Popups) ---
import ClientDialog from '../components/ClientDialog';
import SolicitacaoDialog from '../components/SolicitacaoDialog';

function ClientPage() {
  const { user, permissions, axiosInstance, isLoading: authLoading } = useAuth();

  // --- Estados da Página ---
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [supervisores, setSupervisores] = useState([]);

  // --- Estados de Controle dos Popups ---
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null); // Cliente para o form
  
  const [showSolicitacaoDialog, setShowSolicitacaoDialog] = useState(false);
  const [clienteParaSolicitar, setClienteParaSolicitar] = useState(null); // Cliente para a solicitação

  // --- Funções de Busca ---
  const fetchClients = async () => { 
    setLoadingClientes(true); 
    try { 
      const res = await axiosInstance.get('/clientes/'); 
      setClientes(res.data); 
    } catch (error) { 
      console.error("Erro ao buscar clientes:", error);
    } finally { 
      setLoadingClientes(false); 
    } 
  };
  
  const fetchSupervisores = async () => {
    try {
      const res = await axiosInstance.get('/usuarios/?is_staff=True');
      setSupervisores(res.data);
    } catch (error) {
      console.error("Erro ao buscar supervisores:", error);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (permissions.clientes_acessar || user.is_staff) {
        fetchClients();
        if (!user.is_staff) { // Só busca supervisores se não for admin
          fetchSupervisores();
        }
      } else {
        setLoadingClientes(false); // Para o loading se não tiver acesso
      }
    }
  }, [authLoading, user, permissions]); 

  // --- Funções de ação (Abrir Popups ou Excluir) ---
  
  const handleAddNewClick = () => { 
    setEditingClient(null); 
    setShowClientDialog(true); 
  };
  
  const handleEditClick = (c) => { 
    if (!(permissions.clientes_editar || user.is_staff)) {
        alert('Você não tem permissão para editar clientes.');
        return;
    }
    setEditingClient(c); 
    setShowClientDialog(true); 
  };
  
  const handleDeleteClick = async (id) => {
    if (!window.confirm('Excluir este cliente?')) return; 
    setLoadingClientes(true); 
    try { 
      await axiosInstance.delete(`/clientes/${id}/`); 
      alert('Cliente excluído!'); 
      fetchClients(); 
    } catch (error) { 
      alert('Erro ao excluir cliente.'); 
      setLoadingClientes(false); 
    }
  };

  const handleRequestExclusion = (cliente) => {
     // Adapta o objeto 'cliente' para o formato genérico do popup
     const itemFormatado = {
        id_cliente: cliente.id_cliente, // ID real
        nome_razao_social: cliente.nome_razao_social, // Nome a exibir
        cpf_cnpj: cliente.cpf_cnpj // Identificador extra
    };
    setClienteParaSolicitar(itemFormatado);
    setShowSolicitacaoDialog(true);
  };

  // --- Funções de Callback (O que acontece DEPOIS que o popup salva) ---
  
  const handleSaveSuccess = () => {
    setShowClientDialog(false);
    setEditingClient(null);
    fetchClients(); // Recarrega a lista
  };
  
  const handleCloseDialogs = () => {
    setShowClientDialog(false);
    setEditingClient(null);
    setShowSolicitacaoDialog(false);
    setClienteParaSolicitar(null);
  };
  
  // --- Renderização ---

  if (authLoading || loadingClientes) {
    return <CircularProgress />;
  }

  if (!user.is_staff && !permissions.clientes_acessar) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>
          <LockIcon sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
          Acesso Negado
        </Typography>
        <Typography variant="body1">
          Você não tem permissão para acessar o módulo de Clientes.
        </Typography>
      </Box>
    )
  }

  return (
    <React.Fragment> {/* <-- React.Fragment para envolver a página e os popups */}
      
      {/* Conteúdo Principal da Página */}
      <Box sx={{width: '100%'}}>
        
        {/* botão ADICIONAR Cliente */}
        {(permissions.clientes_criar || user.is_staff) && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleAddNewClick} 
            sx={{ mb: 3, alignSelf: 'flex-start' }}
            startIcon={<AddIcon />}
          >
              Adicionar Novo Cliente
          </Button>
        )}
        
        {/* Área da Lista de Clientes */}
        <Typography variant="h6" sx={{ mt: 1, alignSelf: 'flex-start' }}>Lista de Clientes:</Typography>
        {loadingClientes ? ( <CircularProgress sx={{ mt: 2 }} /> ) // Check de loadingClientes (embora já feito acima)
         : clientes.length === 0 ? ( <Typography sx={{ mt: 2 }}>(Nenhum cliente cadastrado)</Typography> )
         : (
            <List sx={{ width: '100%', bgcolor: 'background.paper', mt: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                {clientes.map((cliente, index) => (
                    <React.Fragment key={cliente.id_cliente}>
                        <ListItem secondaryAction={ 
                          <> 
                            {/* 1. botão EDITAR */}
                            {(permissions.clientes_editar || user.is_staff) && (
                              <IconButton edge="end" aria-label="edit" onClick={() => handleEditClick(cliente)}>
                                <EditIcon />
                              </IconButton> 
                            )}
                            
                            {/* 2. botão EXCLUIR/SOLICITAR */}
                            {(permissions.clientes_excluir || user.is_staff) ? (
                                // Tem permissão? Mostra o botão de exclusão direta
                                <IconButton edge="end" aria-label="delete" sx={{ ml: 1 }} onClick={() => handleDeleteClick(cliente.id_cliente)}>
                                  <DeleteIcon color="error"/>
                                </IconButton> 
                            ) : (
                                // não tem permissão? Mostra o botão de Solicitar
                                <Tooltip title="Solicitar Exclusão">
                                  <IconButton edge="end" aria-label="request-delete" sx={{ ml: 1 }} onClick={() => handleRequestExclusion(cliente)}>
                                    <LockIcon fontSize="small" color="error"/>
                                  </IconButton> 
                                </Tooltip>
                            )}
                          </> 
                        }>
                            <Avatar src={cliente.logo_url} alt="Logo" sx={{ mr: 2 }}>{!cliente.logo_url && <PersonIcon />}</Avatar>
                            <ListItemText primary={cliente.nome_razao_social} secondary={`CPF/CNPJ: ${cliente.cpf_cnpj} | Email: ${cliente.email || '-'}`}/>
                        </ListItem>
                        {index < clientes.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                ))}
            </List>
        )}
      </Box>
    
      {/* --- Renderiza os Popups (Dialogs) --- */}
      
      {/* Popup de Adicionar/Editar Cliente */}
      <ClientDialog
        open={showClientDialog}
        onClose={handleCloseDialogs}
        onSaveSuccess={handleSaveSuccess}
        clientToEdit={editingClient}
      />

      {/* Popup de Solicitação de Exclusão */}
      <SolicitacaoDialog
        open={showSolicitacaoDialog}
        onClose={handleCloseDialogs}
        itemParaSolicitar={clienteParaSolicitar}
        tipoAcao="EXCLUIR_CLIENTE"
        supervisores={supervisores}
      />
      
    </React.Fragment>
  );
}

export default ClientPage;