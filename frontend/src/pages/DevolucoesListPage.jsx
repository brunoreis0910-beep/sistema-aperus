import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Grid, Alert
} from '@mui/material';
import {
  Add, Visibility, CheckCircle, Cancel, FilterList
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const DevolucoesListPage = () => {
  const navigate = useNavigate();
  const { user, permissions, isLoading: authLoading } = useAuth();
  const [devolucoes, setDevolucoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: '',
    status: '',
    data_inicio: '',
    data_fim: ''
  });
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [devolucaoSelecionada, setDevolucaoSelecionada] = useState(null);
  const [dialogAprovar, setDialogAprovar] = useState(false);

  useEffect(() => {
    carregarDevolucoes();
  }, [filtros]);

  const carregarDevolucoes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtros.tipo) params.tipo = filtros.tipo;
      if (filtros.status) params.status = filtros.status;
      if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
      if (filtros.data_fim) params.data_fim = filtros.data_fim;

      const response = await axios.get('/api/devolucoes/', { params });
      setDevolucoes(response.data.results || response.data);
    } catch (err) {
      console.error('Erro ao carregar devoluções:', err);
    } finally {
      setLoading(false);
    }
  };

  const abrirDetalhes = async (id) => {
    try {
      const response = await axios.get(`/api/devolucoes/${id}/`);
      setDevolucaoSelecionada(response.data);
      setDialogDetalhes(true);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
    }
  };

  const aprovarDevolucao = async () => {
    try {
      await axios.post(`/api/devolucoes/${devolucaoSelecionada.id_devolucao}/aprovar/`);
      setDialogAprovar(false);
      setDialogDetalhes(false);
      carregarDevolucoes();
    } catch (err) {
      console.error('Erro ao aprovar devolução:', err);
      alert('Erro ao aprovar devolução');
    }
  };

  const cancelarDevolucao = async (id) => {
    if (!confirm('Deseja realmente cancelar esta devolução?')) return;

    try {
      await axios.post(`/api/devolucoes/${id}/cancelar/`);
      carregarDevolucoes();
    } catch (err) {
      console.error('Erro ao cancelar devolução:', err);
      alert('Erro ao cancelar devolução');
    }
  };

  const getStatusChip = (status) => {
    const configs = {
      pendente: { color: 'warning', label: 'Pendente' },
      aprovada: { color: 'success', label: 'Aprovada' },
      cancelada: { color: 'error', label: 'Cancelada' }
    };

    const config = configs[status] || {};
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getTipoChip = (tipo) => {
    return tipo === 'venda'
      ? <Chip label="Venda" color="primary" size="small" variant="outlined" />
      : <Chip label="Compra" color="secondary" size="small" variant="outlined" />;
  };

  // Verificar permissões
  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography>Carregando...</Typography>
      </Container>
    );
  }

  if (!user?.is_staff && !permissions?.devolucoes_acessar) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Você não tem permissão para acessar esta página.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Devoluções</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/api/devolucoes/nova')}
        >
          Nova Devolução
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterList />
          <Typography variant="h6">Filtros</Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Tipo"
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="venda">Vendas</MenuItem>
              <MenuItem value="compra">Compras</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Status"
              value={filtros.status}
              onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="pendente">Pendente</MenuItem>
              <MenuItem value="aprovada">Aprovada</MenuItem>
              <MenuItem value="cancelada">Cancelada</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Data Início"
              value={filtros.data_inicio}
              onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Data Fim"
              value={filtros.data_fim}
              onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Crédito</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devolucoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    Nenhuma devolução encontrada
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              devolucoes.map((dev) => (
                <TableRow key={dev.id_devolucao}>
                  <TableCell>{dev.numero_devolucao}</TableCell>
                  <TableCell>{getTipoChip(dev.tipo)}</TableCell>
                  <TableCell>
                    {new Date(dev.data_devolucao).toLocaleDateString()}
                  </TableCell>
                  <TableCell>R$ {parseFloat(dev.valor_total_devolucao).toFixed(2)}</TableCell>
                  <TableCell>{getStatusChip(dev.status)}</TableCell>
                  <TableCell>
                    {dev.gerar_credito ? (
                      <Chip label="Sim" color="success" size="small" />
                    ) : (
                      <Chip label="Não" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => abrirDetalhes(dev.id_devolucao)}
                      title="Ver detalhes"
                    >
                      <Visibility />
                    </IconButton>

                    {dev.status === 'pendente' && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => {
                            setDevolucaoSelecionada(dev);
                            setDialogAprovar(true);
                          }}
                          title="Aprovar"
                        >
                          <CheckCircle />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => cancelarDevolucao(dev.id_devolucao)}
                          title="Cancelar"
                        >
                          <Cancel />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Detalhes */}
      <Dialog
        open={dialogDetalhes}
        onClose={() => setDialogDetalhes(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalhes da Devolução {devolucaoSelecionada?.numero_devolucao}
        </DialogTitle>
        <DialogContent>
          {devolucaoSelecionada && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Tipo</Typography>
                  <Typography>{devolucaoSelecionada.tipo_display}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  {getStatusChip(devolucaoSelecionada.status)}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Data</Typography>
                  <Typography>
                    {new Date(devolucaoSelecionada.data_devolucao).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Valor Total</Typography>
                  <Typography>
                    R$ {parseFloat(devolucaoSelecionada.valor_total_devolucao).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Motivo</Typography>
                  <Typography>{devolucaoSelecionada.motivo}</Typography>
                </Grid>
                {devolucaoSelecionada.observacoes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Observações</Typography>
                    <Typography>{devolucaoSelecionada.observacoes}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Itens</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Produto</TableCell>
                          <TableCell align="right">Qtd</TableCell>
                          <TableCell align="right">Valor Unit.</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {devolucaoSelecionada.itens?.map((item) => (
                          <TableRow key={item.id_devolucao_item}>
                            <TableCell>{item.nome_produto}</TableCell>
                            <TableCell align="right">{item.quantidade_devolvida}</TableCell>
                            <TableCell align="right">
                              R$ {parseFloat(item.valor_unitario).toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              R$ {parseFloat(item.valor_total).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDetalhes(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Aprovar */}
      <Dialog
        open={dialogAprovar}
        onClose={() => setDialogAprovar(false)}
      >
        <DialogTitle>Aprovar Devolução</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Ao aprovar esta devolução, o estoque será atualizado automaticamente.
            {devolucaoSelecionada?.gerar_credito && (
              <Box sx={{ mt: 1 }}>
                Um crédito de R$ {parseFloat(devolucaoSelecionada?.valor_total_devolucao || 0).toFixed(2)} será gerado para o cliente.
              </Box>
            )}
          </Alert>
          <Typography>
            Deseja realmente aprovar a devolução {devolucaoSelecionada?.numero_devolucao}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAprovar(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={aprovarDevolucao}>
            Aprovar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DevolucoesListPage;
