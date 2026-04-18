import React, { useState, useEffect } from 'react';
import {
  Box, Typography, CircularProgress,
  List, ListItem, ListItemText, IconButton, Divider,
  Avatar, Paper, Button, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../context/AuthContext';
import FornecedorDialog from '../components/FornecedorDialog';
import SolicitacaoDialog from '../components/SolicitacaoDialog';

function FornecedorPage() {
  const { user, permissions, axiosInstance, isLoading: authLoading } = useAuth();

  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supervisores, setSupervisores] = useState([]);

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showSolicitacaoDialog, setShowSolicitacaoDialog] = useState(false);
  const [itemParaSolicitar, setItemParaSolicitar] = useState(null);

  const fetchFornecedores = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/fornecedores/');
      // Garantir que sempre seja um array
      const fornecedoresData = Array.isArray(res.data)
        ? res.data
        : (res.data?.results || []);
      setFornecedores(fornecedoresData);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisores = async () => {
    try {
      const res = await axiosInstance.get('/usuarios/?is_staff=True');
      // Garantir que sempre seja um array
      const supervisoresData = Array.isArray(res.data)
        ? res.data
        : (res.data?.results || []);
      setSupervisores(supervisoresData);
    } catch (error) {
      console.error('Erro ao buscar supervisores:', error);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (permissions.clientes_acessar || user.is_staff) {
        fetchFornecedores();
        if (!user.is_staff) fetchSupervisores();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, user, permissions]);

  const handleAddNewClick = () => { setEditing(null); setShowDialog(true); };
  const handleEditClick = (c) => { if (!(permissions.clientes_editar || user.is_staff)) { alert('Você não tem permissão para editar fornecedores.'); return; } setEditing(c); setShowDialog(true); };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Excluir este fornecedor?')) return;
    setLoading(true);
    try {
      await axiosInstance.delete(`/fornecedores/${id}/`);
      alert('Fornecedor excluído!');
      fetchFornecedores();
    } catch (error) {
      alert('Erro ao excluir fornecedor.');
      setLoading(false);
    }
  };

  const handleRequestExclusion = (item) => {
    const itemFormatado = { id_fornecedor: item.id_fornecedor, nome_razao_social: item.nome_razao_social, cpf_cnpj: item.cpf_cnpj };
    setItemParaSolicitar(itemFormatado);
    setShowSolicitacaoDialog(true);
  };

  const handleSaveSuccess = () => { setShowDialog(false); setEditing(null); fetchFornecedores(); };
  const handleCloseDialogs = () => { setShowDialog(false); setEditing(null); setShowSolicitacaoDialog(false); setItemParaSolicitar(null); };

  if (authLoading || loading) return <CircularProgress />;

  if (!user.is_staff && !permissions.clientes_acessar) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>
          <LockIcon sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
          Acesso Negado
        </Typography>
        <Typography variant="body1">Você não tem permissão para acessar o módulo de Fornecedores.</Typography>
      </Box>
    )
  }

  return (
    <React.Fragment>
      <Box sx={{width: '100%'}}>
        {(permissions.clientes_criar || user.is_staff) && (
          <Button variant="contained" color="primary" onClick={handleAddNewClick} sx={{ mb: 3, alignSelf: 'flex-start' }} startIcon={<AddIcon />}>Adicionar Novo Fornecedor</Button>
        )}

        <Typography variant="h6" sx={{ mt: 1, alignSelf: 'flex-start' }}>Lista de Fornecedores:</Typography>
        {loading ? ( <CircularProgress sx={{ mt: 2 }} /> )
         : fornecedores.length === 0 ? ( <Typography sx={{ mt: 2 }}>(Nenhum fornecedor cadastrado)</Typography> )
         : (
            <List sx={{ width: '100%', bgcolor: 'background.paper', mt: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                {Array.isArray(fornecedores) && fornecedores.map((f, index) => (
                    <React.Fragment key={f.id_fornecedor}>
                        <ListItem secondaryAction={(
                          <>
                            {(permissions.clientes_editar || user.is_staff) && (
                              <IconButton edge="end" aria-label="edit" onClick={() => handleEditClick(f)}><EditIcon /></IconButton>
                            )}
                            {(permissions.clientes_excluir || user.is_staff) ? (
                                <IconButton edge="end" aria-label="delete" sx={{ ml: 1 }} onClick={() => handleDeleteClick(f.id_fornecedor)}><DeleteIcon color="error"/></IconButton>
                            ) : (
                                <Tooltip title="Solicitar Exclusão"><IconButton edge="end" aria-label="request-delete" sx={{ ml: 1 }} onClick={() => handleRequestExclusion(f)}><LockIcon fontSize="small" color="error"/></IconButton></Tooltip>
                            )}
                          </>
                        )}>
                            <Avatar src={f.logo_url} alt="Logo" sx={{ mr: 2 }}>{!f.logo_url && <PersonIcon />}</Avatar>
                            <ListItemText primary={f.nome_razao_social} secondary={`CPF/CNPJ: ${f.cpf_cnpj} | Email: ${f.email || '-'}`}/>
                        </ListItem>
                        {index < fornecedores.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                ))}
            </List>
        )}
      </Box>

      <FornecedorDialog open={showDialog} onClose={handleCloseDialogs} onSaveSuccess={handleSaveSuccess} fornecedorToEdit={editing} />

      <SolicitacaoDialog open={showSolicitacaoDialog} onClose={handleCloseDialogs} itemParaSolicitar={itemParaSolicitar} tipoAcao="EXCLUIR_FORNECEDOR" supervisores={supervisores} />
    </React.Fragment>
  );
}

export default FornecedorPage;
