import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Chip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import VendedorDialog from './VendedorDialog';

const VendedoresConfig = () => {
  const { axiosInstance } = useAuth();
  const [vendedores, setVendedores] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [vendedorToEdit, setVendedorToEdit] = useState(null);

  useEffect(() => {
    fetchVendedores();
    fetchFuncoes();
  }, []);

  const fetchVendedores = async () => {
    try {
      const response = await axiosInstance.get('/vendedores/');
      // Garantir que sempre seja um array, tratando resposta paginada
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      setVendedores(data);
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
      setVendedores([]); // Em caso de erro, definir como array vazio
    } finally {
      setLoading(false);
    }
  };

  const fetchFuncoes = async () => {
    try {
      const response = await axiosInstance.get('/funcoes/');
      // Garantir que sempre seja um array, tratando resposta paginada
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      setFuncoes(data);
    } catch (error) {
      console.error('Erro ao buscar funções:', error);
      setFuncoes([]); // Em caso de erro, definir como array vazio
    }
  };

  const handleAddVendedor = () => {
    setVendedorToEdit(null);
    setOpenDialog(true);
  };

  const handleEditVendedor = (vendedor) => {
    setVendedorToEdit(vendedor);
    setOpenDialog(true);
  };

  const handleDeleteVendedor = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este vendedor?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/vendedores/${id}/`);
      alert('Vendedor excluído com sucesso!');
      fetchVendedores();
    } catch (error) {
      console.error('Erro ao excluir vendedor:', error);
      alert('Erro ao excluir vendedor. Verifique se não há vendas vinculadas.');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setVendedorToEdit(null);
  };

  const handleSaveSuccess = () => {
    fetchVendedores();
  };

  if (loading) {
    return <Typography>Carregando vendedores...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Vendedores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddVendedor}
        >
          Novo Vendedor
        </Button>
      </Box>

      {vendedores.length === 0 ? (
        <Alert severity="info">
          Nenhum vendedor cadastrado. Clique em "Novo Vendedor" para adicionar.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>CPF</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell align="center">Comissão (%)</TableCell>
                <TableCell>Funções</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendedores.map((vendedor) => (
                <TableRow key={vendedor.id_vendedor}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {vendedor.nome}
                    </Typography>
                    {vendedor.nome_reduzido && (
                      <Typography variant="caption" color="text.secondary">
                        {vendedor.nome_reduzido}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{vendedor.cpf}</TableCell>
                  <TableCell>{vendedor.telefone || '-'}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${vendedor.percentual_comissao || 0}%`}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {vendedor.funcoes && vendedor.funcoes.length > 0 ? (
                        vendedor.funcoes.map((funcao) => (
                          <Chip
                            key={funcao.id_funcao}
                            label={funcao.nome_funcao}
                            size="small"
                          />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Sem funções
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditVendedor(vendedor)}
                      title="Editar"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteVendedor(vendedor.id_vendedor)}
                      title="Excluir"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <VendedorDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSaveSuccess={handleSaveSuccess}
        vendedorToEdit={vendedorToEdit}
        funcoes={funcoes}
        vendedores={vendedores}
      />
    </Box>
  );
};

export default VendedoresConfig;
