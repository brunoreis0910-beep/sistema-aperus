import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Grid,
  Typography,
  Alert,
  Checkbox,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const ConjuntoOperacoesDialog = ({ open, onClose, onSave }) => {
  const { axiosInstance } = useAuth();
  const [conjuntos, setConjuntos] = useState([]);
  const [operacoes, setOperacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentConjunto, setCurrentConjunto] = useState({
    id_conjunto: null,
    nome_conjunto: '',
    descricao: '',
    operacoes_ids: [],
    ativo: true
  });

  useEffect(() => {
    if (open) {
      carregarDados();
    }
  }, [open]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [conjuntosRes, operacoesRes] = await Promise.all([
        axiosInstance.get('/conjuntos-operacoes/'),
        axiosInstance.get('/operacoes/')
      ]);
      
      setConjuntos(Array.isArray(conjuntosRes.data) ? conjuntosRes.data : []);
      setOperacoes(Array.isArray(operacoesRes.data) ? operacoesRes.data : []);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar conjuntos e operações');
    } finally {
      setLoading(false);
    }
  };

  const handleNovo = () => {
    setCurrentConjunto({
      id_conjunto: null,
      nome_conjunto: '',
      descricao: '',
      operacoes_ids: [],
      ativo: true
    });
    setEditMode(true);
    setError(null);
  };

  const handleEditar = (conjunto) => {
    setCurrentConjunto({
      id_conjunto: conjunto.id_conjunto,
      nome_conjunto: conjunto.nome_conjunto,
      descricao: conjunto.descricao || '',
      operacoes_ids: conjunto.operacoes ? conjunto.operacoes.map(op => op.id_operacao) : [],
      ativo: conjunto.ativo !== false
    });
    setEditMode(true);
    setError(null);
  };

  const handleSalvar = async () => {
    if (!currentConjunto.nome_conjunto.trim()) {
      setError('Nome do conjunto é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const dadosParaEnvio = {
        nome_conjunto: currentConjunto.nome_conjunto,
        descricao: currentConjunto.descricao,
        operacoes_ids: currentConjunto.operacoes_ids,
        ativo: currentConjunto.ativo
      };

      if (currentConjunto.id_conjunto) {
        // Atualizar
        await axiosInstance.put(
          `/conjuntos-operacoes/${currentConjunto.id_conjunto}/`,
          dadosParaEnvio
        );
      } else {
        // Criar
        await axiosInstance.post('/conjuntos-operacoes/', dadosParaEnvio);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setEditMode(false);
      carregarDados();
      
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Erro ao salvar conjunto:', err);
      const msgErro = err.response?.data
        ? JSON.stringify(err.response.data)
        : (err.message || 'Erro ao salvar conjunto');
      setError(`Erro ao salvar: ${msgErro}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Deseja realmente excluir este conjunto de operações?')) {
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.delete(`/conjuntos-operacoes/${id}/`);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      carregarDados();
    } catch (err) {
      console.error('Erro ao excluir conjunto:', err);
      setError('Erro ao excluir conjunto');
    } finally {
      setLoading(false);
    }
  };

  const handleOperacoesChange = (event) => {
    const {
      target: { value },
    } = event;
    setCurrentConjunto({
      ...currentConjunto,
      operacoes_ids: typeof value === 'string' ? value.split(',') : value,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">🔗 Gerenciar Conjuntos de Operações</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Conjunto salvo com sucesso!
          </Alert>
        )}

        {!editMode ? (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">
                Liste e gerencie seus conjuntos de operações
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNovo}
                disabled={loading}
              >
                Novo Conjunto
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Nome do Conjunto</strong></TableCell>
                    <TableCell><strong>Descrição</strong></TableCell>
                    <TableCell><strong>Operações</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conjuntos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          Nenhum conjunto cadastrado. Clique em "Novo Conjunto" para começar.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    conjuntos.map((conjunto) => (
                      <TableRow key={conjunto.id_conjunto} hover>
                        <TableCell>{conjunto.id_conjunto}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {conjunto.nome_conjunto}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {conjunto.descricao || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {conjunto.operacoes && conjunto.operacoes.length > 0 ? (
                              conjunto.operacoes.slice(0, 3).map((op) => (
                                <Chip
                                  key={op.id_operacao}
                                  label={op.nome_operacao}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              ))
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                Nenhuma operação
                              </Typography>
                            )}
                            {conjunto.operacoes && conjunto.operacoes.length > 3 && (
                              <Chip
                                label={`+${conjunto.operacoes.length - 3}`}
                                size="small"
                                color="default"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={conjunto.ativo ? 'Ativo' : 'Inativo'}
                            color={conjunto.ativo ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditar(conjunto)}
                            disabled={loading}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleExcluir(conjunto.id_conjunto)}
                            disabled={loading}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Box component="form" noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Os conjuntos de operações permitem agrupar várias operações relacionadas para facilitar a gestão do sistema.
                </Alert>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Nome do Conjunto *"
                  value={currentConjunto.nome_conjunto}
                  onChange={(e) =>
                    setCurrentConjunto({ ...currentConjunto, nome_conjunto: e.target.value })
                  }
                  disabled={loading}
                  placeholder="Ex: Operações de Venda, Operações Fiscais, etc."
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={currentConjunto.ativo}
                    onChange={(e) =>
                      setCurrentConjunto({ ...currentConjunto, ativo: e.target.value })
                    }
                    label="Status"
                    disabled={loading}
                  >
                    <MenuItem value={true}>✅ Ativo</MenuItem>
                    <MenuItem value={false}>❌ Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Descrição"
                  value={currentConjunto.descricao}
                  onChange={(e) =>
                    setCurrentConjunto({ ...currentConjunto, descricao: e.target.value })
                  }
                  disabled={loading}
                  placeholder="Descreva o propósito deste conjunto de operações..."
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="operacoes-label">Operações do Conjunto</InputLabel>
                  <Select
                    labelId="operacoes-label"
                    multiple
                    value={currentConjunto.operacoes_ids}
                    onChange={handleOperacoesChange}
                    input={<OutlinedInput label="Operações do Conjunto" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const op = operacoes.find((o) => o.id_operacao === value);
                          return (
                            <Chip
                              key={value}
                              label={op ? op.nome_operacao : value}
                              size="small"
                              color="primary"
                            />
                          );
                        })}
                      </Box>
                    )}
                    MenuProps={MenuProps}
                    disabled={loading}
                  >
                    {operacoes.map((operacao) => (
                      <MenuItem key={operacao.id_operacao} value={operacao.id_operacao}>
                        <Checkbox
                          checked={currentConjunto.operacoes_ids.indexOf(operacao.id_operacao) > -1}
                        />
                        <ListItemText
                          primary={operacao.nome_operacao}
                          secondary={`ID: ${operacao.id_operacao} | ${operacao.transacao || 'N/A'}`}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="warning">
                  <strong>Dica:</strong> Selecione todas as operações que deseja agrupar neste conjunto. 
                  Você poderá editar esta seleção a qualquer momento.
                </Alert>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {editMode ? (
          <>
            <Button onClick={() => setEditMode(false)} disabled={loading}>
              Voltar
            </Button>
            <Button
              onClick={handleSalvar}
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              Salvar
            </Button>
          </>
        ) : (
          <Button onClick={onClose} disabled={loading}>
            Fechar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConjuntoOperacoesDialog;
