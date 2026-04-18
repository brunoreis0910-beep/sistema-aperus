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
  Alert,
  IconButton,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  DialogActions,
  Switch,
  FormControlLabel,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const StatusOrdemServicoConfig = () => {
  const { axiosInstance } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [statusList, setStatusList] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState({
    id_status: null,
    nome_status: '',
    descricao: '',
    cor: 'primary',
    ordem: 0,
    ativo: true,
    padrao: false,
    permite_editar: true,
    permite_excluir: true
  });

  const coresDisponiveis = [
    { value: 'primary', label: 'Azul (Primary)', color: '#1976d2' },
    { value: 'success', label: 'Verde (Success)', color: '#2e7d32' },
    { value: 'warning', label: 'Laranja (Warning)', color: '#ed6c02' },
    { value: 'error', label: 'Vermelho (Error)', color: '#d32f2f' },
    { value: 'info', label: 'Ciano (Info)', color: '#0288d1' },
    { value: 'default', label: 'Cinza (Default)', color: '#757575' },
  ];

  useEffect(() => {
    carregarStatus();
  }, []);

  const carregarStatus = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/status-ordem-servico/');
      console.log('📋 Status carregados:', response.data);
      // Garantir que sempre seja um array, tratando resposta paginada
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data?.value || []);
      setStatusList(data);
      setError(null);
    } catch (err) {
      console.error('❌ Erro ao carregar status:', err);
      setError('Erro ao carregar status');
      setStatusList([]); // Garantir que seja array em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentStatus(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!currentStatus.nome_status || currentStatus.nome_status.trim() === '') {
        setError('Nome do status é obrigatório');
        setLoading(false);
        return;
      }

      const dadosParaEnvio = {
        nome_status: currentStatus.nome_status,
        descricao: currentStatus.descricao || '',
        cor: currentStatus.cor,
        ordem: parseInt(currentStatus.ordem) || 0,
        ativo: currentStatus.ativo ? true : false,
        padrao: currentStatus.padrao ? true : false,
        permite_editar: currentStatus.permite_editar ? true : false,
        permite_excluir: currentStatus.permite_excluir ? true : false
      };

      console.log('📤 Dados que serão enviados:', dadosParaEnvio);

      if (isEditing && currentStatus.id_status) {
        await axiosInstance.patch(`/status-ordem-servico/${currentStatus.id_status}/`, dadosParaEnvio);
        console.log('💾 Status atualizado');
      } else {
        await axiosInstance.post('/status-ordem-servico/', dadosParaEnvio);
        console.log('💾 Novo status criado');
      }

      setOpenDialog(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setError(null);
      await carregarStatus();

    } catch (err) {
      console.error('❌ Erro ao salvar status:', err);
      console.error('❌ Detalhes:', err.response?.data);

      let errorMessage = 'Erro ao salvar status';
      if (err.response?.data?.nome_status) {
        errorMessage = 'Status com este nome já existe';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (status) => {
    console.log('📝 Editando status:', status);
    setCurrentStatus({
      ...status
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleNew = () => {
    const novaOrdem = (Array.isArray(statusList) && statusList.length > 0)
      ? Math.max(...statusList.map(s => s.ordem || 0)) + 1
      : 1;

    setCurrentStatus({
      id_status: null,
      nome_status: '',
      descricao: '',
      cor: 'primary',
      ordem: novaOrdem,
      ativo: true,
      padrao: false,
      gera_financeiro: false,
      permite_editar: true,
      permite_excluir: true
    });
    setIsEditing(false);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este status?')) {
      try {
        setLoading(true);
        await axiosInstance.delete(`/status-ordem-servico/${id}/`);
        console.log('🗑️ Status excluído');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        await carregarStatus();
      } catch (err) {
        console.error('❌ Erro ao excluir status:', err);
        setError(err.response?.data?.detail || 'Erro ao excluir status');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDefinirPadrao = async (id) => {
    try {
      setLoading(true);
      await axiosInstance.post(`/status-ordem-servico/${id}/definir_como_padrao/`);
      console.log('⭐ Status definido como padrão');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await carregarStatus();
    } catch (err) {
      console.error('❌ Erro ao definir padrão:', err);
      setError('Erro ao definir status como padrão');
    } finally {
      setLoading(false);
    }
  };

  const handleMoverOrdem = async (status, direcao) => {
    try {
      const listaOrdenada = [...statusList].sort((a, b) => a.ordem - b.ordem);
      const indiceAtual = listaOrdenada.findIndex(s => s.id_status === status.id_status);

      if (direcao === 'up' && indiceAtual === 0) return;
      if (direcao === 'down' && indiceAtual === listaOrdenada.length - 1) return;

      const novoIndice = direcao === 'up' ? indiceAtual - 1 : indiceAtual + 1;
      const statusParaTrocar = listaOrdenada[novoIndice];

      const ordemAtual = status.ordem;
      const novaOrdem = statusParaTrocar.ordem;

      await axiosInstance.patch(`/status-ordem-servico/${status.id_status}/`, { ordem: novaOrdem });
      await axiosInstance.patch(`/status-ordem-servico/${statusParaTrocar.id_status}/`, { ordem: ordemAtual });

      await carregarStatus();
    } catch (err) {
      console.error('❌ Erro ao reordenar:', err);
      setError('Erro ao reordenar status');
    }
  };

  const getCorChip = (cor) => {
    const corObj = coresDisponiveis.find(c => c.value === cor);
    return corObj?.color || '#757575';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ Operação realizada com sucesso!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <SettingsIcon />
            </Avatar>
          }
          title="Status de Ordem de Serviço"
          subheader="Gerencie os status disponíveis para ordens de serviço"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNew}
            >
              Novo Status
            </Button>
          }
        />

        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="50"><strong>Ordem</strong></TableCell>
                  <TableCell><strong>Nome do Status</strong></TableCell>
                  <TableCell><strong>Descrição</strong></TableCell>
                  <TableCell align="center"><strong>Cor</strong></TableCell>
                  <TableCell align="center"><strong>Padrão</strong></TableCell>
                  <TableCell align="center"><strong>Gera Financeiro</strong></TableCell>
                  <TableCell align="center"><strong>Ativo</strong></TableCell>
                  <TableCell align="center"><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(statusList) && statusList.map((status) => (
                  <TableRow key={status.id_status} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleMoverOrdem(status, 'up')}
                          disabled={!Array.isArray(statusList) || statusList.length === 0 || status.ordem === Math.min(...statusList.map(s => s.ordem))}
                        >
                          <ArrowUpIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" align="center">{status.ordem}</Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleMoverOrdem(status, 'down')}
                          disabled={!Array.isArray(statusList) || statusList.length === 0 || status.ordem === Math.max(...statusList.map(s => s.ordem))}
                        >
                          <ArrowDownIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {status.nome_status}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {status.descricao || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={status.cor}
                        size="small"
                        sx={{
                          bgcolor: getCorChip(status.cor),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={status.padrao ? "Status padrão" : "Definir como padrão"}>
                        <IconButton
                          size="small"
                          onClick={() => !status.padrao && handleDefinirPadrao(status.id_status)}
                          disabled={status.padrao}
                        >
                          {status.padrao ? (
                            <StarIcon sx={{ color: 'gold' }} />
                          ) : (
                            <StarBorderIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={status.gera_financeiro ? 'SIM' : 'NÃO'}
                        size="small"
                        color={status.gera_financeiro ? 'success' : 'default'}
                        sx={{ minWidth: 60 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={status.ativo ? 'Ativo' : 'Inativo'}
                        color={status.ativo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(status)}
                        size="small"
                        disabled={!status.permite_editar}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(status.id_status)}
                        size="small"
                        disabled={!status.permite_excluir}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {statusList.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Nenhum status cadastrado. Clique em "Novo Status" para adicionar.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Editar/Criar Status */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? '✏️ Editar Status' : '➕ Novo Status'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Nome do Status"
                value={currentStatus.nome_status}
                onChange={(e) => handleInputChange('nome_status', e.target.value)}
                variant="outlined"
                required
                placeholder="Ex: Em Atendimento"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Ordem"
                type="number"
                value={currentStatus.ordem}
                onChange={(e) => handleInputChange('ordem', e.target.value)}
                variant="outlined"
                helperText="Ordem de exibição"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                value={currentStatus.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                variant="outlined"
                multiline
                rows={2}
                placeholder="Descrição opcional do status"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Cor do Status</InputLabel>
                <Select
                  value={currentStatus.cor}
                  onChange={(e) => handleInputChange('cor', e.target.value)}
                  label="Cor do Status"
                >
                  {coresDisponiveis.map((cor) => (
                    <MenuItem key={cor.value} value={cor.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: 1,
                            bgcolor: cor.color
                          }}
                        />
                        {cor.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={currentStatus.nome_status || "Preview"}
                  sx={{
                    bgcolor: getCorChip(currentStatus.cor),
                    color: 'white',
                    fontSize: '1rem',
                    padding: '20px 10px'
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Configurações
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentStatus.ativo}
                    onChange={(e) => handleInputChange('ativo', e.target.checked)}
                  />
                }
                label="Status Ativo"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentStatus.padrao}
                    onChange={(e) => handleInputChange('padrao', e.target.checked)}
                  />
                }
                label="Status Padrão"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Para novas OS
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentStatus.gera_financeiro}
                    onChange={(e) => handleInputChange('gera_financeiro', e.target.checked)}
                  />
                }
                label="Gera Financeiro"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Abre tela de financeiro
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentStatus.permite_editar}
                    onChange={(e) => handleInputChange('permite_editar', e.target.checked)}
                  />
                }
                label="Permite Editar"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentStatus.permite_excluir}
                    onChange={(e) => handleInputChange('permite_excluir', e.target.checked)}
                  />
                }
                label="Permite Excluir"
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

export default StatusOrdemServicoConfig;
