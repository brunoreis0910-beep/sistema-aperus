import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DateRange as DateRangeIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const LotesComponent = ({ produtoId, produtoNome }) => {
  const { axiosInstance } = useAuth();
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  
  // Novo Lote State
  const [novoLote, setNovoLote] = useState({
    numero_lote: '',
    data_fabricacao: '',
    data_validade: '',
    quantidade: '',
    observacoes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (produtoId) {
      fetchLotes();
    }
  }, [produtoId]);

  const fetchLotes = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/lote-produto/?id_produto=${produtoId}`);
      setLotes(res.data);
    } catch (err) {
      console.error('Erro ao buscar lotes:', err);
      toast.error('Erro ao buscar lotes do produto');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!novoLote.numero_lote || !novoLote.data_validade) {
      toast.warning('Número do Lote e Data de Validade são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...novoLote,
        id_produto: produtoId,
        quantidade: novoLote.quantidade || 0,
        data_fabricacao: novoLote.data_fabricacao || null,
        observacoes: novoLote.observacoes || null
      };

      await axiosInstance.post('/lote-produto/', payload);
      toast.success('Lote adicionado com sucesso!');
      setOpenAdd(false);
      setNovoLote({
        numero_lote: '',
        data_fabricacao: '',
        data_validade: '',
        quantidade: '',
        observacoes: ''
      });
      fetchLotes();
    } catch (err) {
      console.error('Erro ao salvar lote:', err);
      toast.error('Erro ao salvar lote');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (lote) => {
    try {
      await axiosInstance.patch(`/lote-produto/${lote.id_lote}/`, {
        ativo: !lote.ativo
      });
      fetchLotes(); // Recarrega para atualizar
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Erro ao atualizar status do lote');
    }
  };

  // Calcula status de validade
  const getValidadeStatus = (dataValidade) => {
    const hoje = dayjs();
    const validade = dayjs(dataValidade);
    const diasParaVencer = validade.diff(hoje, 'day');

    if (diasParaVencer < 0) return { label: 'VENCIDO', color: 'error' };
    if (diasParaVencer <= 30) return { label: 'A VENCER', color: 'warning' };
    return { label: 'VÁLIDO', color: 'success' };
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Gerenciamento de Lotes
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setOpenAdd(true)}
        >
          Novo Lote
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : lotes.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Nenhum lote cadastrado para este produto.
        </Alert>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell>Status</TableCell>
                <TableCell>Nº Lote</TableCell>
                <TableCell>Validade</TableCell>
                <TableCell>Situação</TableCell>
                <TableCell align="right">Qtd.</TableCell>
                <TableCell>Obs</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lotes.map((lote) => {
                const status = getValidadeStatus(lote.data_validade);
                return (
                  <TableRow key={lote.id_lote} sx={{ opacity: lote.ativo ? 1 : 0.6 }}>
                    <TableCell>
                      {lote.ativo ? 
                        <Chip size="small" icon={<CheckCircleIcon />} label="Ativo" color="success" variant="outlined" /> : 
                        <Chip size="small" icon={<BlockIcon />} label="Inativo" color="default" variant="outlined" />
                      }
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{lote.numero_lote}</TableCell>
                    <TableCell>
                      {dayjs(lote.data_validade).format('DD/MM/YYYY')}
                    </TableCell>
                    <TableCell>
                       <Chip label={status.label} color={status.color} size="small" />
                    </TableCell>
                    <TableCell align="right">{Number(lote.quantidade).toFixed(3)}</TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lote.observacoes}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        color={lote.ativo ? "error" : "success"}
                        onClick={() => handleToggleStatus(lote)}
                        title={lote.ativo ? "Desativar" : "Ativar"}
                      >
                         {lote.ativo ? <BlockIcon /> : <CheckCircleIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Adicionar Lote */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Lote - {produtoNome}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Número do Lote"
              fullWidth
              required
              value={novoLote.numero_lote}
              onChange={(e) => setNovoLote({...novoLote, numero_lote: e.target.value})}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                 <TextField
                  label="Data Fabricação"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={novoLote.data_fabricacao}
                  onChange={(e) => setNovoLote({...novoLote, data_fabricacao: e.target.value})}
                />
              </Grid>
              <Grid item xs={6}>
                 <TextField
                  label="Data Validade"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={novoLote.data_validade}
                  onChange={(e) => setNovoLote({...novoLote, data_validade: e.target.value})}
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Quantidade Inicial"
              type="number"
              fullWidth
              value={novoLote.quantidade}
              onChange={(e) => setNovoLote({...novoLote, quantidade: e.target.value})}
            />
            
            <TextField
              label="Observações"
              multiline
              rows={2}
              fullWidth
              value={novoLote.observacoes}
              onChange={(e) => setNovoLote({...novoLote, observacoes: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LotesComponent;
