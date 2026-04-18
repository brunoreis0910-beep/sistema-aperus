import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, TextField, DialogActions,
  Chip
} from '@mui/material';
import { Delete, Add, Edit } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const AgroSafrasPage = () => {
  const { axiosInstance } = useAuth();
  const [safras, setSafras] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ descricao: '', data_inicio: '', data_fim: '', ativo: true });

  useEffect(() => {
    loadSafras();
  }, []);

  const loadSafras = async () => {
    try {
      const res = await axiosInstance.get('/safras/');
      // Backend retorna array direto (sem paginação)
      const data = res.data;
      setSafras(Array.isArray(data) ? data : (data.results ?? []));
    } catch (error) {
      console.error('Erro ao carregar safras:', error?.response?.data || error.message);
      toast.error('Erro ao carregar safras');
      setSafras([]);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Tem certeza?')) return;
    try {
      await axiosInstance.delete(`/safras/${id}/`);
      toast.success('Safra removida');
      loadSafras();
    } catch (error) {
      toast.error('Erro ao remover');
    }
  };

  const handleSubmit = async () => {
    try {
      await axiosInstance.post('/safras/', formData);
      toast.success('Safra criada com sucesso');
      setOpen(false);
      loadSafras();
      setFormData({ descricao: '', data_inicio: '', data_fim: '', ativo: true });
    } catch (error) {
      console.error('Erro ao salvar safra:', error?.response?.data || error.message);
      toast.error('Erro ao salvar: ' + (error?.response?.data ? JSON.stringify(error.response.data) : error.message));
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="primary">Gestão de Safras</Typography>
        <Button startIcon={<Add />} variant="contained" color="success" onClick={() => setOpen(true)}>
          Nova Safra
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Descrição</TableCell>
              <TableCell>Início</TableCell>
              <TableCell>Fim</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safras.map((row) => (
              <TableRow key={row.id_safra}>
                <TableCell>{row.descricao}</TableCell>
                <TableCell>{new Date(row.data_inicio).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(row.data_fim).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip label={row.ativo ? "Ativa" : "Inativa"} color={row.ativo ? "success" : "default"} size="small" />
                </TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => handleDelete(row.id_safra)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {safras.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">Nenhuma safra cadastrada</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Nova Safra</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              label="Descrição (Ex: Soja 24/25)" 
              fullWidth 
              value={formData.descricao}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
            />
            <TextField 
              label="Data Início" 
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth 
              value={formData.data_inicio}
              onChange={e => setFormData({...formData, data_inicio: e.target.value})}
            />
            <TextField 
              label="Data Fim" 
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth 
              value={formData.data_fim}
              onChange={e => setFormData({...formData, data_fim: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgroSafrasPage;
