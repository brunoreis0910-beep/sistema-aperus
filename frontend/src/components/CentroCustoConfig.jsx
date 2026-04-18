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
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const CentroCustoConfig = () => {
  const { axiosInstance } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [centrosCusto, setCentrosCusto] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCentroCusto, setCurrentCentroCusto] = useState({
    id_centro_custo: null,
    nome_centro_custo: ''
  });

  useEffect(() => {
    carregarCentrosCusto();
  }, []);

  const carregarCentrosCusto = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/centro-custo/');
      console.log('📡 Resposta da API centro-custo:', response.data);

      let centrosCustoData = [];
      if (Array.isArray(response.data)) {
        centrosCustoData = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        centrosCustoData = response.data.results;
      } else if (response.data?.value && Array.isArray(response.data.value)) {
        centrosCustoData = response.data.value;
      }

      setCentrosCusto(centrosCustoData);
      setError(null);
    } catch (err) {
      console.error('❌ Erro ao carregar centros de custo:', err);
      setError('Erro ao carregar centros de custo');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentCentroCusto(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const dadosParaEnvio = {
        nome_centro_custo: currentCentroCusto.nome_centro_custo
      };

      console.log('📤 Dados do centro de custo que seréo enviados:', dadosParaEnvio);

      if (isEditing && currentCentroCusto.id_centro_custo) {
        await axiosInstance.patch(`/centro-custo/${currentCentroCusto.id_centro_custo}/`, dadosParaEnvio);
        console.log('💾 Centro de custo atualizado via API');
      } else {
        await axiosInstance.post('/centro-custo/', dadosParaEnvio);
        console.log('💾 Novo centro de custo criado via API');
      }

      setOpenDialog(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setError(null);

      await carregarCentrosCusto();

    } catch (err) {
      console.error('❌ Erro ao salvar centro de custo:', err);
      console.error('❌ Detalhes do erro:', err.response?.data);
      setError('Erro ao salvar centro de custo: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (centroCusto) => {
    setCurrentCentroCusto(centroCusto);
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleNew = () => {
    setCurrentCentroCusto({
      id_centro_custo: null,
      nome_centro_custo: ''
    });
    setIsEditing(false);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este centro de custo?')) {
      try {
        setLoading(true);
        await axiosInstance.delete(`/centro-custo/${id}/`);
        console.log('🗑️ Centro de custo excluído');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        await carregarCentrosCusto();
      } catch (err) {
        console.error('❌ Erro ao excluir centro de custo:', err);
        setError('Erro ao excluir centro de custo: ' + (err.response?.data?.detail || err.message));
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
          Centro de custo salvo com sucesso!
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
              <AccountBalanceIcon />
            </Avatar>
          }
          title="Configuração de Centros de Custo"
          subheader="Gerencie os centros de custo do sistema"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNew}
            >
              Novo Centro de Custo
            </Button>
          }
        />

        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Nome do Centro de Custo</strong></TableCell>
                  <TableCell><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(centrosCusto) && centrosCusto.map((centroCusto) => (
                  <TableRow key={centroCusto.id_centro_custo} hover>
                    <TableCell>{centroCusto.id_centro_custo}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {centroCusto.nome_centro_custo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(centroCusto)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(centroCusto.id_centro_custo)}
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

      {/* Dialog para Editar/Criar Centro de Custo */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Centro de Custo"
                value={currentCentroCusto.nome_centro_custo}
                onChange={(e) => handleInputChange('nome_centro_custo', e.target.value)}
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

export default CentroCustoConfig;