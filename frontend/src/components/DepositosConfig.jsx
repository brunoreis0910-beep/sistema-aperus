import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005') + '/api';

export default function DepositosConfig() {
  const [depositos, setDepositos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDeposito, setEditingDeposito] = useState(null);
  const [formData, setFormData] = useState({
    nome_deposito: '',
    descricao: '',
    estoque_baixo: 0,
    estoque_incremento: 0
  });

  // Carregar depósitos
  const loadDepositos = async () => {
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/depositos/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Garantir que sempre seja um array
      const depositosData = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);
      setDepositos(depositosData);
    } catch (err) {
      console.error('Erro ao carregar depósitos:', err);
      setError(err.response?.data?.detail || err.message || 'Erro ao carregar depósitos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepositos();
  }, []);

  // Abrir dialog para criar/editar
  const handleOpenDialog = (deposito = null) => {
    if (deposito) {
      setEditingDeposito(deposito);
      setFormData({
        nome_deposito: deposito.nome_deposito,
        descricao: deposito.descricao || '',
        estoque_baixo: deposito.estoque_baixo || 0,
        estoque_incremento: deposito.estoque_incremento || 0
      });
    } else {
      setEditingDeposito(null);
      setFormData({
        nome_deposito: '',
        descricao: '',
        estoque_baixo: 0,
        estoque_incremento: 0
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDeposito(null);
    setFormData({
      nome_deposito: '',
      descricao: '',
      estoque_baixo: 0,
      estoque_incremento: 0
    });
  };

  // Salvar (criar ou editar)
  const handleSave = async () => {
    try {
      console.log('Dados enviados para salvar depósito:', formData);
      const token = sessionStorage.getItem('token');
      if (editingDeposito) {
        // Editar
        await axios.put(
          `${API_BASE_URL}/depositos/${editingDeposito.id_deposito}/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Criar
        await axios.post(
          `${API_BASE_URL}/depositos/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      handleCloseDialog();
      loadDepositos();
    } catch (err) {
      console.error('Erro ao salvar depósito:', err);
      console.error('Response Data:', err.response?.data);
      const errorDetail = err.response?.data 
        ? (typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data)
        : err.message;
      setError(`Erro: ${errorDetail}`);
    }
  };

  // Deletar
  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este depósito?')) {
      return;
    }
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/depositos/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadDepositos();
    } catch (err) {
      console.error('Erro ao deletar depósito:', err);
      setError(err.response?.data?.detail || err.message || 'Erro ao deletar depósito');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Gerenciar Depósitos</Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadDepositos}
            sx={{ mr: 1 }}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Depósito
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Descriçéo</TableCell>
                <TableCell>Estoque Baixo</TableCell>
                <TableCell>Incremento</TableCell>
                <TableCell>Criado em</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {depositos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Nenhum depósito cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                Array.isArray(depositos) && depositos.map((deposito) => (
                  <TableRow key={deposito.id_deposito}>
                    <TableCell>{deposito.id_deposito}</TableCell>
                    <TableCell>{deposito.nome_deposito}</TableCell>
                    <TableCell>{deposito.descricao || '-'}</TableCell>
                    <TableCell>{deposito.estoque_baixo}</TableCell>
                    <TableCell>{deposito.estoque_incremento}</TableCell>
                    <TableCell>
                      {new Date(deposito.data_criacao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(deposito)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(deposito.id_deposito)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog de Criar/Editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDeposito ? 'Editar Depósito' : 'Novo Depósito'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Nome do Depósito"
              value={formData.nome_deposito}
              onChange={(e) => setFormData({ ...formData, nome_deposito: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Descriçéo"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="Estoque Baixo (Alerta)"
              type="number"
              value={formData.estoque_baixo}
              onChange={(e) => setFormData({ ...formData, estoque_baixo: parseInt(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Incremento de Estoque"
              type="number"
              value={formData.estoque_incremento}
              onChange={(e) => setFormData({ ...formData, estoque_incremento: parseInt(e.target.value) || 0 })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.nome_deposito}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
