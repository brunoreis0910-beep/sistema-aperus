// Em: src/pages/BancarioPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, CircularProgress,
  List, ListItem, ListItemText, Divider, Grid,
  Paper, Button, Chip, Stack,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Alert, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
// Ícones
import LockIcon from '@mui/icons-material/Lock';
import SearchIcon from '@mui/icons-material/Search';
import CalculateIcon from '@mui/icons-material/Calculate';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
// Helpers
import { useAuth } from '../context/AuthContext';
import useRelatorioBancario from '../hooks/useRelatorioBancario';
import useRelatorioExtrato from '../hooks/useRelatorioExtrato';

// função para formatar data para o input (YYYY-MM-DD)
const formatarDataInput = (data) => {
  if (!data) return '';
  try { return new Date(data).toISOString().split('T')[0]; }
  catch (e) { return ''; }
};

// Pega o primeiro e último dia do mês atual
const getPrimeiroDiaMes = () => {
  const data = new Date();
  return formatarDataInput(new Date(data.getFullYear(), data.getMonth(), 1));
};
const getUltimoDiaMes = () => {
  const data = new Date();
  return formatarDataInput(new Date(data.getFullYear(), data.getMonth() + 1, 0));
};

function BancarioPage() {
  const { user, permissions, axiosInstance, isLoading: authLoading } = useAuth();
  const { imprimirRelatorio, baixarPDFRelatorio, compartilharWhatsApp } = useRelatorioBancario();
  const { baixarPDFExtrato, imprimirExtrato } = useRelatorioExtrato();

  // --- Controle de abas ---
  const [abaAtiva, setAbaAtiva] = useState(0);

  // --- Estados da Página (aba Movimentações) ---
  const [movimentos, setMovimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState(null);

  // --- Estados dos Filtros (aba Movimentações) ---
  const [dataInicial, setDataInicial] = useState(getPrimeiroDiaMes());
  const [dataFinal, setDataFinal] = useState(getUltimoDiaMes());
  const [tipoMovimento, setTipoMovimento] = useState('Todos'); // Todos, Receita, Despesa
  const [contaBaixa, setContaBaixa] = useState(''); // id da conta de baixa selecionada

  // contas bancárias disponíveis para filtro
  const [contasBancarias, setContasBancarias] = useState([]);

  // --- Estados do Totalizador ---
  const [showTotalizador, setShowTotalizador] = useState(false);
  const [totais, setTotais] = useState({ receitas: 0, despesas: 0, saldo: 0 });
  const [loadingTotais, setLoadingTotais] = useState(false);

  // --- Estados da aba Extrato Bancário ---
  const [extratoContaBancaria, setExtratoContaBancaria] = useState('');
  const [extratoDataInicio, setExtratoDataInicio] = useState(getPrimeiroDiaMes());
  const [extratoDataFim, setExtratoDataFim] = useState(getUltimoDiaMes());
  const [extratoData, setExtratoData] = useState(null);
  const [loadingExtrato, setLoadingExtrato] = useState(false);
  const [extratoErro, setExtratoErro] = useState('');


  // --- Funções de Busca ---

  const fetchMovimentos = async () => {
    setLoading(true);
    try {
      // Monta a query string
      let queryParams = `?status_conta=Paga`; // <-- SEMPRE SÓ O QUE FOI PAGO

      if (tipoMovimento === 'Receita') {
        queryParams += `&tipo_conta=Receber`;
      } else if (tipoMovimento === 'Despesa') {
        queryParams += `&tipo_conta=Pagar`;
      }
      // (Se for 'Todos', não adiciona o filtro &tipo_conta)

      if (dataInicial) {
        queryParams += `&data_pagamento__gte=${dataInicial}`; // gte = Greater Than or Equal
      }
      if (dataFinal) {
        queryParams += `&data_pagamento__lte=${dataFinal}`; // lte = Less Than or Equal
      }

      if (contaBaixa) {
        queryParams += `&id_conta_baixa=${contaBaixa}`;
      }

      // Adiciona ordenação: data crescente, depois descriçéo, depois cliente
      queryParams += `&ordering=data_pagamento,descricao`;

      console.log('DEBUG - URL da requisi��o:', `/contas/${queryParams}`);
      const res = await axiosInstance.get(`/contas/${queryParams}`);
      setMovimentos(res.data);

    } catch (error) {
      console.error("Erro ao buscar movimentos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Busca os dados quando a página carrega ou os filtros mudam
  useEffect(() => {
    if (!authLoading) {
      if (permissions.financeiro_acessar || user.is_staff) {
        fetchMovimentos(); // Roda a busca inicial

        // busca contas bancárias para o filtro de conta de baixa
        (async () => {
          try {
            const res = await axiosInstance.get('/contas-bancarias/');
            setContasBancarias(res.data.results || res.data || []);
          } catch (err) {
            console.error('Erro ao buscar contas bancárias para filtro:', err);
            setContasBancarias([]);
          }
        })();

        // busca dados da empresa para o cabeçalho do PDF
        (async () => {
          try {
            const res = await axiosInstance.get('/empresa/');
            if (res.data && res.data.length > 0) {
              setEmpresa(res.data[0]);
            }
          } catch (err) {
            console.error('Erro ao buscar dados da empresa:', err);
          }
        })();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, user, permissions]); // Roda só na carga inicial

  const handleFiltrar = () => {
    fetchMovimentos();
  };

  // --- Busca do Extrato Bancário ---
  const fetchExtrato = useCallback(async () => {
    if (!extratoContaBancaria) {
      setExtratoErro('Selecione uma conta bancária para consultar o extrato.');
      return;
    }
    setLoadingExtrato(true);
    setExtratoErro('');
    setExtratoData(null);
    try {
      let params = `?conta_bancaria=${extratoContaBancaria}`;
      if (extratoDataInicio) params += `&data_inicio=${extratoDataInicio}`;
      if (extratoDataFim) params += `&data_fim=${extratoDataFim}`;
      const res = await axiosInstance.get(`/movimentacoes-bancarias/extrato/${params}`);
      setExtratoData(res.data);
    } catch (err) {
      console.error('Erro ao buscar extrato:', err);
      setExtratoErro('Erro ao buscar extrato bancário. Tente novamente.');
    } finally {
      setLoadingExtrato(false);
    }
  }, [extratoContaBancaria, extratoDataInicio, extratoDataFim, axiosInstance]);

  // função para calcular os totais (baseado nos filtros atuais)
  const handleCalcularTotalizador = () => {
    setLoadingTotais(true);
    setShowTotalizador(true);

    try {
      // Calcula totais a partir dos movimentos j� filtrados
      const totalReceitas = movimentos
        .filter(conta => conta.tipo_conta === 'Receber')
        .reduce((acc, conta) => acc + parseFloat(conta.valor_liquidado || 0), 0);

      const totalDespesas = movimentos
        .filter(conta => conta.tipo_conta === 'Pagar')
        .reduce((acc, conta) => acc + parseFloat(conta.valor_liquidado || 0), 0);

      const saldo = totalReceitas - totalDespesas;

      setTotais({
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldo: saldo
      });

    } catch (error) {
      console.error("Erro ao calcular totais:", error);
      alert("Erro ao calcular totais.");
    } finally {
      setLoadingTotais(false);
    }
  };

  // Funções de Relatório
  const handleImprimirRelatorio = async () => {
    if (movimentos.length === 0) {
      alert('não há movimentos para imprimir. Use os filtros para buscar dados.');
      return;
    }

    try {
      const contaBancariaNome = contaBaixa ?
        contasBancarias.find(cb => (cb.id_conta_bancaria || cb.id) === contaBaixa)?.nome_conta || '' : '';

      const filtros = {
        dataInicial,
        dataFinal,
        tipoMovimento,
        contaBancaria: contaBancariaNome
      };

      await imprimirRelatorio(movimentos, filtros, totais, empresa);
    } catch (error) {
      console.error('Erro ao imprimir relatório:', error);
      alert('Erro ao imprimir relatório.');
    }
  };

  const handleBaixarPDF = async () => {
    if (movimentos.length === 0) {
      alert('não há movimentos para exportar. Use os filtros para buscar dados.');
      return;
    }

    try {
      const contaBancariaNome = contaBaixa ?
        contasBancarias.find(cb => (cb.id_conta_bancaria || cb.id) === contaBaixa)?.nome_conta || '' : '';

      const filtros = {
        dataInicial,
        dataFinal,
        tipoMovimento,
        contaBancaria: contaBancariaNome
      };

      await baixarPDFRelatorio(movimentos, filtros, totais, empresa);
      alert('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      alert('Erro ao baixar PDF.');
    }
  };

  const handleCompartilharWhatsApp = async () => {
    if (movimentos.length === 0) {
      alert('não há movimentos para compartilhar. Use os filtros para buscar dados.');
      return;
    }

    try {
      const contaBancariaNome = contaBaixa ?
        contasBancarias.find(cb => (cb.id_conta_bancaria || cb.id) === contaBaixa)?.nome_conta || '' : '';

      const filtros = {
        dataInicial,
        dataFinal,
        tipoMovimento,
        contaBancaria: contaBancariaNome
      };

      await compartilharWhatsApp(movimentos, filtros, totais, empresa);
    } catch (error) {
      console.error('Erro ao compartilhar via WhatsApp:', error);
      alert('Erro ao compartilhar via WhatsApp.');
    }
  };


  // --- Renderização ---

  if (authLoading) {
    return <CircularProgress />;
  }

  if (!user.is_staff && !permissions.financeiro_acessar) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>
          <LockIcon sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
          Acesso Negado
        </Typography>
        <Typography variant="body1">
          Você não tem permissão para acessar o módulo Bancário/Financeiro.
        </Typography>
      </Box>
    )
  }

  const fmt = (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
  const fmtData = (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '';

  return (
    <>
      <Box sx={{ width: '100%' }}>
        {/* --- ABAS --- */}
        <Tabs
          value={abaAtiva}
          onChange={(_, v) => setAbaAtiva(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab icon={<ReceiptLongIcon />} iconPosition="start" label="Movimentações Pagas" />
          <Tab icon={<AccountBalanceIcon />} iconPosition="start" label="Extrato Bancário" />
        </Tabs>

        {/* ============ ABA 0: MOVIMENTAÇÕES ============ */}
        {abaAtiva === 0 && (
          <>
            {/* --- BARRA DE FILTROS --- */}
            <Paper elevation={2} sx={{ p: 2, mb: 3, width: '100%', bgcolor: 'grey.50' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Data Mov. Inicial"
                    type="date"
                    value={dataInicial}
                    onChange={(e) => setDataInicial(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Data Mov. Final"
                    type="date"
                    value={dataFinal}
                    onChange={(e) => setDataFinal(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel id="tipo-mov-label">Tipo</InputLabel>
                    <Select
                      labelId="tipo-mov-label"
                      value={tipoMovimento}
                      label="Tipo"
                      onChange={(e) => setTipoMovimento(e.target.value)}
                    >
                      <MenuItem value="Todos">Todos</MenuItem>
                      <MenuItem value="Receita">Receitas (Recebimentos)</MenuItem>
                      <MenuItem value="Despesa">Despesas (Pagamentos)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel id="conta-baixa-label">Conta de Baixa</InputLabel>
                    <Select
                      labelId="conta-baixa-label"
                      value={contaBaixa}
                      label="Conta de Baixa"
                      onChange={(e) => setContaBaixa(e.target.value)}
                    >
                      <MenuItem value=""><em>Todas</em></MenuItem>
                      {contasBancarias.map((cb) => (
                        <MenuItem key={cb.id_conta_bancaria || cb.id} value={cb.id_conta_bancaria || cb.id}>
                          {cb.nome_conta || cb.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={1.5}>
                  <Button
                    variant="contained"
                    onClick={handleFiltrar}
                    startIcon={<SearchIcon />}
                    fullWidth
                    sx={{ height: '56px' }}
                  >
                    Filtrar
                  </Button>
                </Grid>
                <Grid item xs={12} sm={1.5}>
                  <Button
                    variant="outlined"
                    onClick={handleCalcularTotalizador}
                    startIcon={<CalculateIcon />}
                    fullWidth
                    sx={{ height: '56px' }}
                  >
                    Totais
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* --- BOTÕES DE RELATÓRIO --- */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary" onClick={handleImprimirRelatorio}
                startIcon={<PrintIcon />} disabled={movimentos.length === 0}>
                Imprimir Relatório
              </Button>
              <Button variant="contained" color="secondary" onClick={handleBaixarPDF}
                startIcon={<PictureAsPdfIcon />} disabled={movimentos.length === 0}>
                Baixar PDF
              </Button>
              <Button variant="contained" color="success" onClick={handleCompartilharWhatsApp}
                startIcon={<WhatsAppIcon />} disabled={movimentos.length === 0}>
                Compartilhar WhatsApp
              </Button>
            </Box>

            {/* --- LISTA DE MOVIMENTOS --- */}
            {loading ? (<CircularProgress sx={{ mt: 2 }} />)
              : movimentos.length === 0
                ? (<Typography sx={{ mt: 2 }}>(Nenhuma movimentação encontrada para este período)</Typography>)
                : (
                  <List sx={{ width: '100%', bgcolor: 'background.paper', mt: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                    {movimentos.map((conta, index) => {
                      const isReceita = conta.tipo_conta === 'Receber';
                      const valor = parseFloat(conta.valor_liquidado);
                      const corValor = isReceita ? 'success.main' : 'error.main';
                      return (
                        <React.Fragment key={conta.id_conta}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body1">{conta.descricao}</Typography>
                                  <Typography variant="h6" sx={{ color: corValor }}>
                                    {isReceita ? '+' : '-'} R$ {valor.toFixed(2)}
                                  </Typography>
                                </Box>
                              }
                              secondary={`Movimento: ${new Date(conta.data_pagamento + 'T00:00:00-03:00').toLocaleDateString('pt-BR')} | Tipo: ${isReceita ? 'Receita' : 'Despesa'} | Forma Pgto: ${conta.forma_pagamento || 'N/A'}`}
                            />
                          </ListItem>
                          {index < movimentos.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                )}
          </>
        )}

        {/* ============ ABA 1: EXTRATO BANCÁRIO ============ */}
        {abaAtiva === 1 && (
          <>
            {/* --- FILTROS DO EXTRATO --- */}
            <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel id="extrato-conta-label">Conta Bancária *</InputLabel>
                    <Select
                      labelId="extrato-conta-label"
                      value={extratoContaBancaria}
                      label="Conta Bancária *"
                      onChange={(e) => setExtratoContaBancaria(e.target.value)}
                    >
                      <MenuItem value=""><em>Selecione...</em></MenuItem>
                      {contasBancarias.map((cb) => (
                        <MenuItem key={cb.id_conta_bancaria} value={cb.id_conta_bancaria}>
                          {cb.nome_conta}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Data Início"
                    type="date"
                    value={extratoDataInicio}
                    onChange={(e) => setExtratoDataInicio(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Data Fim"
                    type="date"
                    value={extratoDataFim}
                    onChange={(e) => setExtratoDataFim(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    variant="contained"
                    onClick={fetchExtrato}
                    startIcon={<SearchIcon />}
                    fullWidth
                    sx={{ height: '56px' }}
                    disabled={loadingExtrato}
                  >
                    {loadingExtrato ? <CircularProgress size={22} color="inherit" /> : 'Buscar'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {extratoErro && <Alert severity="error" sx={{ mb: 2 }}>{extratoErro}</Alert>}

            {extratoData && (
              <>
                {/* --- CARDS DE RESUMO --- */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Paper elevation={2} sx={{ p: 2, borderLeft: '4px solid #607d8b' }}>
                      <Typography variant="caption" color="text.secondary">Saldo Anterior</Typography>
                      <Typography variant="h6" fontWeight={700} color={extratoData.saldo_anterior >= 0 ? 'text.primary' : 'error.main'}>
                        R$ {fmt(extratoData.saldo_anterior)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper elevation={2} sx={{ p: 2, borderLeft: '4px solid #2e7d32' }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <TrendingUpIcon fontSize="small" color="success" />
                        <Typography variant="caption" color="text.secondary">Total Créditos</Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={700} color="success.dark">
                        + R$ {fmt(extratoData.total_creditos)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper elevation={2} sx={{ p: 2, borderLeft: '4px solid #c62828' }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <TrendingDownIcon fontSize="small" color="error" />
                        <Typography variant="caption" color="text.secondary">Total Débitos</Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={700} color="error.dark">
                        - R$ {fmt(extratoData.total_debitos)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper elevation={2} sx={{ p: 2, borderLeft: `4px solid ${extratoData.saldo_final >= 0 ? '#1565c0' : '#c62828'}` }}>
                      <Typography variant="caption" color="text.secondary">Saldo Final</Typography>
                      <Typography variant="h6" fontWeight={700} color={extratoData.saldo_final >= 0 ? 'primary.dark' : 'error.dark'}>
                        R$ {fmt(extratoData.saldo_final)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* --- BOTÕES PDF/IMPRESSÃO --- */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PrintIcon />}
                    onClick={() => imprimirExtrato(extratoData, empresa)}
                  >
                    Imprimir Extrato
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={() => baixarPDFExtrato(extratoData, empresa)}
                  >
                    Baixar PDF
                  </Button>
                </Box>

                {/* --- LANÇAMENTOS POR DIA --- */}
                {extratoData.dias.length === 0 ? (
                  <Typography color="text.secondary">Nenhum lançamento encontrado para o período.</Typography>
                ) : (
                  extratoData.dias.map((dia) => (
                    <Box key={dia.data} sx={{ mb: 3 }}>
                      {/* Cabeçalho do dia */}
                      <Box sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main', px: 2, py: 0.8, mb: 0.5, borderRadius: '0 4px 4px 0' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="primary.dark">
                          {fmtData(dia.data)}
                        </Typography>
                      </Box>
                      <Table size="small" sx={{ '& td, & th': { py: 0.8 } }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell width={40} align="center">Tipo</TableCell>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Cliente/Fornecedor</TableCell>
                            <TableCell>Documento</TableCell>
                            <TableCell align="right" sx={{ color: 'success.dark' }}>Crédito</TableCell>
                            <TableCell align="right" sx={{ color: 'error.dark' }}>Débito</TableCell>
                            <TableCell align="right" fontWeight={700}>Saldo</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dia.lancamentos.map((l) => (
                            <TableRow
                              key={l.id_movimento}
                              sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                            >
                              <TableCell align="center">
                                <Chip
                                  label={l.tipo_movimento === 'C' ? 'C' : 'D'}
                                  size="small"
                                  color={l.tipo_movimento === 'C' ? 'success' : 'error'}
                                  sx={{ fontWeight: 700, minWidth: 32 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{l.descricao}</Typography>
                                {l.forma_pagamento && (
                                  <Typography variant="caption" color="text.secondary">{l.forma_pagamento}</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{l.cliente_fornecedor}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{l.documento_numero}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                {l.tipo_movimento === 'C' && (
                                  <Typography variant="body2" color="success.dark" fontWeight={600}>
                                    + R$ {fmt(l.valor)}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                {l.tipo_movimento === 'D' && (
                                  <Typography variant="body2" color="error.dark" fontWeight={600}>
                                    - R$ {fmt(l.valor)}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  color={l.saldo_corrente >= 0 ? 'text.primary' : 'error.main'}
                                >
                                  R$ {fmt(l.saldo_corrente)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  ))
                )}
              </>
            )}
          </>
        )}
      </Box>

      {/* --- DIALOG DO TOTALIZADOR --- */}
      <Dialog open={showTotalizador} onClose={() => setShowTotalizador(false)} fullWidth maxWidth="xs">
        <DialogTitle>Totalizador do Período</DialogTitle>
        <DialogContent dividers>
          {loadingTotais ? <CircularProgress /> : (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'success.main' }}>
                <Typography variant="body1">Total de Receitas:</Typography>
                <Typography variant="h5" sx={{ color: 'success.dark', fontWeight: 'bold' }}>
                  R$ {totais.receitas.toFixed(2)}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'error.main' }}>
                <Typography variant="body1">Total de Despesas:</Typography>
                <Typography variant="h5" sx={{ color: 'error.dark', fontWeight: 'bold' }}>
                  - R$ {totais.despesas.toFixed(2)}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderColor: totais.saldo >= 0 ? 'primary.main' : 'error.main' }}>
                <Typography variant="body1">Saldo do Período:</Typography>
                <Typography variant="h5" sx={{ color: totais.saldo >= 0 ? 'primary.dark' : 'error.dark', fontWeight: 'bold' }}>
                  R$ {totais.saldo.toFixed(2)}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTotalizador(false)} startIcon={<CloseIcon />}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default BancarioPage;

