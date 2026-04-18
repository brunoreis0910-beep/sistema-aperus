import React from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Button, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, MenuItem
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Print as PrintIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function AlugueisPage() {
  const [alugueis, setAlugueis] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogProrrogar, setDialogProrrogar] = React.useState(false);
  const [dialogFinanceiro, setDialogFinanceiro] = React.useState(false);
  const [aluguelSelecionado, setAluguelSelecionado] = React.useState(null);
  const [novaDataFim, setNovaDataFim] = React.useState('');
  const [formasPagamento, setFormasPagamento] = React.useState([]);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = React.useState('');
  const navigate = useNavigate();

  const carregarAlugueis = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/alugueis/');
      const data = res.data;
      if (Array.isArray(data)) {
        setAlugueis(data);
      } else if (Array.isArray(data.results)) {
        setAlugueis(data.results);
      } else {
        setAlugueis([]);
      }
    } catch (err) {
      console.error('Erro ao carregar aluguéis', err);
      setAlugueis([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    carregarAlugueis();
    carregarFormasPagamento();
  }, []);

  const carregarFormasPagamento = async () => {
    try {
      const res = await api.get('/api/formas-pagamento/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setFormasPagamento(data);
      if (data.length > 0) {
        setFormaPagamentoSelecionada(data[0].nome_forma || data[0].id_forma_pagamento);
      }
    } catch (err) {
      console.error('Erro ao carregar formas de pagamento', err);
    }
  };

  const handleFinalizar = async (aluguel) => {
    if (!confirm(`Finalizar aluguel ${aluguel.numero_aluguel}?`)) return;

    try {
      await api.post(`/api/alugueis/${aluguel.id_aluguel}/finalizar/`);
      alert('Aluguel finalizado com sucesso!');
      carregarAlugueis();
    } catch (err) {
      console.error('Erro ao finalizar', err);
      alert(err?.response?.data?.detail || 'Erro ao finalizar aluguel');
    }
  };

  const handleCancelar = async (aluguel) => {
    if (!confirm(`Cancelar aluguel ${aluguel.numero_aluguel}?`)) return;

    try {
      await api.post(`/api/alugueis/${aluguel.id_aluguel}/cancelar/`);
      alert('Aluguel cancelado com sucesso!');
      carregarAlugueis();
    } catch (err) {
      console.error('Erro ao cancelar', err);
      alert(err?.response?.data?.detail || 'Erro ao cancelar aluguel');
    }
  };

  const handleAbrirProrrogar = (aluguel) => {
    setAluguelSelecionado(aluguel);
    setNovaDataFim(aluguel.data_fim_prevista);
    setDialogProrrogar(true);
  };

  const handleProrrogar = async () => {
    if (!novaDataFim) {
      alert('Informe a nova data de fim');
      return;
    }

    try {
      await api.post(`/api/alugueis/${aluguelSelecionado.id_aluguel}/prorrogar/`, {
        nova_data_fim: novaDataFim
      });
      alert('Aluguel prorrogado com sucesso!');
      setDialogProrrogar(false);
      carregarAlugueis();
    } catch (err) {
      console.error('Erro ao prorrogar', err);
      alert(err?.response?.data?.detail || 'Erro ao prorrogar aluguel');
    }
  };

  const handleGerarFinanceiro = async (aluguel) => {
    setAluguelSelecionado(aluguel);
    setDialogFinanceiro(true);
  };

  const confirmarGerarFinanceiro = async () => {
    if (!formaPagamentoSelecionada) {
      alert('Selecione a forma de pagamento');
      return;
    }

    try {
      const res = await api.post(`/api/alugueis/${aluguelSelecionado.id_aluguel}/gerar_financeiro/`, {
        forma_pagamento: formaPagamentoSelecionada
      });
      alert(`Financeiro gerado com sucesso!\nConta ID: ${res.data.id_conta}`);
      setDialogFinanceiro(false);
      carregarAlugueis();
    } catch (err) {
      console.error('Erro ao gerar financeiro', err);
      alert(err?.response?.data?.error || err?.response?.data?.detail || 'Erro ao gerar financeiro');
    }
  };

  const handleImprimir = async (aluguel) => {
    try {
      const res = await api.get(`/api/alugueis/${aluguel.id_aluguel}/gerar_contrato/`);
      
      // Abre nova janela com o HTML do contrato
      const novaJanela = window.open('', '_blank', 'width=800,height=600');
      novaJanela.document.write(res.data.html);
      novaJanela.document.close();
      
      // Auto print após carregar
      setTimeout(() => {
        novaJanela.focus();
      }, 500);
    } catch (err) {
      console.error('Erro ao gerar contrato', err);
      alert('Erro ao gerar contrato para impressão');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo': return 'success';
      case 'finalizado': return 'default';
      case 'cancelado': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Aluguéis</Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/alugueis/nova')}>Novo Aluguel</Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nº Aluguel</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Equipamentos</TableCell>
                  <TableCell>Inicio</TableCell>
                  <TableCell>Fim Previsto</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Financeiro</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alugueis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">Nenhum aluguel cadastrado</TableCell>
                  </TableRow>
                ) : (
                  alugueis.map((a) => (
                    <TableRow key={`aluguel-${a.id_aluguel || a.numero_aluguel}`} hover>
                      <TableCell>{a.numero_aluguel}</TableCell>
                      <TableCell>{a.cliente_nome || '-'}</TableCell>
                      <TableCell>
                        {a.total_itens ? (
                          <>
                            {a.total_itens} item{a.total_itens !== 1 ? 's' : ''}
                            {a.itens_ativos > 0 && (
                              <Chip label={`${a.itens_ativos} ativo${a.itens_ativos !== 1 ? 's' : ''}`} color="info" size="small" sx={{ ml: 1 }} />
                            )}
                          </>
                        ) : (a.equipamento_nome || '-')}
                      </TableCell>
                      <TableCell>{a.data_inicio}</TableCell>
                      <TableCell>{a.data_fim_prevista}</TableCell>
                      <TableCell>
                        <Chip label={a.status} color={getStatusColor(a.status)} size="small" />
                      </TableCell>
                      <TableCell>
                        {a.tem_financeiro ? (
                          <Chip label="Gerado" color="success" size="small" variant="outlined" />
                        ) : (
                          <Chip label="Sem financeiro" color="default" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => navigate(`/alugueis/editar/${a.id_aluguel}`)} title="Editar">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="info" onClick={() => handleImprimir(a)} title="Imprimir Contrato">
                          <PrintIcon fontSize="small" />
                        </IconButton>
                        {a.status === 'ativo' && (
                          <>
                            <IconButton size="small" color="success" onClick={() => handleFinalizar(a)} title="Finalizar">
                              <CheckIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="primary" onClick={() => handleAbrirProrrogar(a)} title="Prorrogar">
                              <ScheduleIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="warning" onClick={() => handleGerarFinanceiro(a)} title="Gerar Financeiro">
                              <MoneyIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleCancelar(a)} title="Cancelar">
                              <CancelIcon fontSize="small" />
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
        )}
      </Paper>

      <Dialog open={dialogProrrogar} onClose={() => setDialogProrrogar(false)}>
        <DialogTitle>Prorrogar Aluguel</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="date"
            label="Nova Data de Fim"
            value={novaDataFim}
            onChange={(e) => setNovaDataFim(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogProrrogar(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleProrrogar}>Prorrogar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogFinanceiro} onClose={() => setDialogFinanceiro(false)}>
        <DialogTitle>Gerar Financeiro</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          {aluguelSelecionado && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Aluguel:</strong> {aluguelSelecionado.numero_aluguel}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Cliente:</strong> {aluguelSelecionado.cliente_nome}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Valor:</strong> R$ {parseFloat(aluguelSelecionado.valor_final || 0).toFixed(2)}
              </Typography>
              <TextField
                select
                fullWidth
                label="Forma de Pagamento"
                value={formaPagamentoSelecionada}
                onChange={(e) => setFormaPagamentoSelecionada(e.target.value)}
                sx={{ mt: 2 }}
              >
                {formasPagamento.map((fp) => (
                  <MenuItem key={fp.id_forma_pagamento} value={fp.nome_forma}>
                    {fp.nome_forma}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogFinanceiro(false)}>Cancelar</Button>
          <Button variant="contained" onClick={confirmarGerarFinanceiro}>Gerar Financeiro</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
