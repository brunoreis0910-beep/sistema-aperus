import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  IconButton,
  Avatar,
  CircularProgress,
  Backdrop,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DepartamentosConfig = () => {
  const { axiosInstance } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [departamentos, setDepartamentos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDepartamento, setCurrentDepartamento] = useState({
    id_departamento: null,
    nome_departamento: ''
  });

  useEffect(() => {
    carregarDepartamentos();
  }, []);

  const carregarDepartamentos = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/departamentos/');
      console.log('📡 Resposta da API departamentos:', response.data);

      let departamentosData = [];
      if (Array.isArray(response.data)) {
        departamentosData = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        departamentosData = response.data.results;
      } else if (response.data?.value && Array.isArray(response.data.value)) {
        departamentosData = response.data.value;
      }

      setDepartamentos(departamentosData);
      setError(null);
    } catch (err) {
      console.error('❌ Erro ao carregar departamentos:', err);
      setError('Erro ao carregar departamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentDepartamento(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const dadosParaEnvio = {
        nome_departamento: currentDepartamento.nome_departamento
      };

      console.log('📤 Dados do departamento que seréo enviados:', dadosParaEnvio);

      if (isEditing && currentDepartamento.id_departamento) {
        await axiosInstance.patch(`/departamentos/${currentDepartamento.id_departamento}/`, dadosParaEnvio);
        console.log('💾 Departamento atualizado via API');
      } else {
        await axiosInstance.post('/departamentos/', dadosParaEnvio);
        console.log('💾 Novo departamento criado via API');
      }

      setOpenDialog(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setError(null);

      await carregarDepartamentos();

    } catch (err) {
      console.error('❌ Erro ao salvar departamento:', err);
      console.error('❌ Detalhes do erro:', err.response?.data);
      setError('Erro ao salvar departamento: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (departamento) => {
    setCurrentDepartamento(departamento);
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleNew = () => {
    setCurrentDepartamento({
      id_departamento: null,
      nome_departamento: ''
    });
    setIsEditing(false);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este departamento?')) {
      try {
        setLoading(true);
        await axiosInstance.delete(`/departamentos/${id}/`);
        console.log('🗑️ Departamento excluído');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        await carregarDepartamentos();
      } catch (err) {
        console.error('❌ Erro ao excluir departamento:', err);
        setError('Erro ao excluir departamento: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Departamento salvo com sucesso!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <BusinessIcon />
            </Avatar>
          }
          title="Configuração de Departamentos"
          subheader="Gerencie os departamentos do sistema"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNew}
            >
              Novo Departamento
            </Button>
          }
        />

        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Nome do Departamento</strong></TableCell>
                  <TableCell><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(departamentos) && departamentos.map((departamento) => (
                  <TableRow key={departamento.id_departamento} hover>
                    <TableCell>{departamento.id_departamento}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {departamento.nome_departamento}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(departamento)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(departamento.id_departamento)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog para Editar/Criar Departamento */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Departamento' : 'Novo Departamento'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Departamento"
                value={currentDepartamento.nome_departamento}
                onChange={(e) => handleInputChange('nome_departamento', e.target.value)}
                variant="outlined"
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartamentosConfig;