import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Button, Alert,
  CircularProgress, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton
} from '@mui/material';
import { 
  Undo as UndoIcon, 
  CheckCircle as CheckCircleIcon,
  FilterList as FilterIcon  
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import FilterDrawer from './common/FilterDrawer';

const FinanceiroPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [contasReceber, setContasReceber] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const { axiosInstance } = useAuth();

  const [filtros, setFiltros] = useState({
    search: '',
    dataInicio: '',
    dataFim: '',
    limit: 100,
    tipo_conta: 'todas',
    status_conta: 'todas',
  });

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Construir parâmetros de filtro
      const params = new URLSearchParams();
      if (filtros.search) params.append('search', filtros.search);
      if (filtros.dataInicio) params.append('data_vencimento__gte', filtros.dataInicio);
      if (filtros.dataFim) params.append('data_vencimento__lte', filtros.dataFim);
      if (filtros.limit !== 'unlimited') params.append('limit', filtros.limit);
      if (filtros.tipo_conta !== 'todas') params.append('tipo_conta', filtros.tipo_conta);
      if (filtros.status_conta !== 'todas') params.append('status_conta', filtros.status_conta);

      // Buscar todas as contas com filtros
      const contasResponse = await axiosInstance.get(`/contas/?${params.toString()}`);
      const todasContas = contasResponse.data.results || contasResponse.data || [];

      console.log('📊 Total de contas carregadas:', todasContas.length);

      // Separar entre receber e pagar
      const contas_receber = todasContas.filter(c => c.tipo_conta === 'Receber');
      const contas_pagar = todasContas.filter(c => c.tipo_conta === 'Pagar');

      console.log('💰 Contas a Receber:', contas_receber.length);
      console.log('💸 Contas a Pagar:', contas_pagar.length);
      console.log('📋 Amostra contas a pagar:', contas_pagar.slice(0, 3));

      setContasReceber(contas_receber);
      setContasPagar(contas_pagar);
    } catch (err) {
      setError('Erro ao carregar dados financeiros');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [axiosInstance]);

  const filtrarContas = (contas, tipo) => {
    let resultado = [...contas];

    if (filtros.operacao !== 'todas') {
      if (filtros.operacao === 'receber') {
        resultado = resultado.filter(c => tipo === 'receber');
      } else if (filtros.operacao === 'pagar') {
        resultado = resultado.filter(c => tipo === 'pagar');
      }
    }

    if (filtros.dataVencimentoInicio) {
      resultado = resultado.filter(c => {
        if (!c.data_vencimento) return false;
        return new Date(c.data_vencimento) >= new Date(filtros.dataVencimentoInicio);
      });
    }

    if (filtros.dataVencimentoFim) {
      resultado = resultado.filter(c => {
        if (!c.data_vencimento) return false;
        return new Date(c.data_vencimento) <= new Date(filtros.dataVencimentoFim);
      });
    }

    if (filtros.dataDocumentoInicio) {
      const dataField = tipo === 'receber' ? 'data_documento' : 'data_emissao';
      resultado = resultado.filter(c => {
        const dataRef = c[dataField] || c.data_vencimento;
        if (!dataRef) return false;
        return new Date(dataRef) >= new Date(filtros.dataDocumentoInicio);
      });
    }

    if (filtros.dataDocumentoFim) {
      const dataField = tipo === 'receber' ? 'data_documento' : 'data_emissao';
      resultado = resultado.filter(c => {
        const dataRef = c[dataField] || c.data_vencimento;
        if (!dataRef) return false;
        return new Date(dataRef) <= new Date(filtros.dataDocumentoFim);
      });
    }

    return resultado;
  };

  const handleFiltroChange = (field, value) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  const darBaixaConta = async (conta) => {
    const dataPagamento = prompt('Data do pagamento (AAAA-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!dataPagamento) return;

    const valorPago = prompt('Valor pago:', conta.valor_parcela || conta.valor_original || conta.valor || 0);
    if (!valorPago) return;

    try {
      setLoading(true);

      await axiosInstance.patch(`/contas/${conta.id_conta}/`, {
        status_conta: 'Paga',
        data_pagamento: dataPagamento,
        valor_liquidado: parseFloat(valorPago),
        saldo_devedor: 0
      });

      setSuccess('✅ Baixa realizada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchFinancialData();

    } catch (err) {
      console.error('❌ Erro ao dar baixa:', err);
      setError(err.response?.data?.detail || 'Erro ao dar baixa');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const estornarConta = async (conta) => {
    if (!window.confirm(`Deseja realmente estornar a conta "${conta.descricao || conta.documento_numero}"?`)) {
      return;
    }

    try {
      setLoading(true);

      // Atualizar conta para status Pendente e remover data de pagamento
      await axiosInstance.patch(`/api/contas/${conta.id_conta}/`, {
        status_conta: 'Pendente',
        data_pagamento: null,
        valor_liquidado: 0
      });

      setSuccess(`✅ Conta estornada com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);

      // Recarregar dados
      await fetchFinancialData();

    } catch (err) {
      console.error('❌ Erro ao estornar conta:', err);
      setError(err.response?.data?.detail || 'Erro ao estornar conta');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setFiltros({
      operacao: 'todas',
      dataVencimentoInicio: '',
      dataVencimentoFim: '',
      dataDocumentoInicio: '',
      dataDocumentoFim: ''
    });
  };

  const getTotalizados = () => {
    const aReceber = filtrarContas((Array.isArray(contasReceber) ? contasReceber : []).filter(c => !c.data_pagamento), 'receber');
    const recebido = filtrarContas((Array.isArray(contasReceber) ? contasReceber : []).filter(c => c.data_pagamento), 'receber');
    const aPagar = filtrarContas((Array.isArray(contasPagar) ? contasPagar : []).filter(c => !c.data_pagamento), 'pagar');
    const pago = filtrarContas((Array.isArray(contasPagar) ? contasPagar : []).filter(c => c.data_pagamento), 'pagar');

    return {
      aReceber: { valor: Array.isArray(aReceber) ? aReceber.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) : 0, count: Array.isArray(aReceber) ? aReceber.length : 0 },
      recebido: { valor: Array.isArray(recebido) ? recebido.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) : 0, count: Array.isArray(recebido) ? recebido.length : 0 },
      aPagar: { valor: Array.isArray(aPagar) ? aPagar.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) : 0, count: Array.isArray(aPagar) ? aPagar.length : 0 },
      pago: { valor: Array.isArray(pago) ? pago.reduce((sum, c) => sum + parseFloat(c.valor || 0), 0) : 0, count: Array.isArray(pago) ? pago.length : 0 }
    };
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  }

  const totalizados = getTotalizados();

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>Financeiro</Typography>
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setFilterOpen(true)}
          size="large"
        >
          Filtros
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* TOTALIZADOS */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1565c0' }}>
          📊 Totalizados (Dados Exibidos)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#fff3e0' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>💰 A Receber</Typography>
                <Typography variant="h5" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                  R$ {totalizados.aReceber.valor.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">{totalizados.aReceber.count} conta(s)</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#e8f5e9' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>✅ Recebido</Typography>
                <Typography variant="h5" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                  R$ {totalizados.recebido.valor.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">{totalizados.recebido.count} conta(s)</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#ffebee' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>💸 A Pagar</Typography>
                <Typography variant="h5" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                  R$ {totalizados.aPagar.valor.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">{totalizados.aPagar.count} conta(s)</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#e0f2f1' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>✔️ Pago</Typography>
                <Typography variant="h5" sx={{ color: '#00796b', fontWeight: 'bold' }}>
                  R$ {totalizados.pago.valor.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">{totalizados.pago.count} conta(s)</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #90caf9' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ backgroundColor: '#f3e5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>Total Geral a Receber</Typography>
                <Typography variant="h6" sx={{ color: '#6a1b9a', fontWeight: 'bold' }}>
                  R$ {(totalizados.aReceber.valor + totalizados.aPagar.valor).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ backgroundColor: '#e0f7fa', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>Total Geral Recebido/Pago</Typography>
                <Typography variant="h6" sx={{ color: '#00838f', fontWeight: 'bold' }}>
                  R$ {(totalizados.recebido.valor + totalizados.pago.valor).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ backgroundColor: '#fce4ec', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>Saldo Líquido</Typography>
                <Typography variant="h6" sx={{ color: '#880e4f', fontWeight: 'bold' }}>
                  R$ {(
                    (totalizados.recebido.valor + totalizados.aReceber.valor) -
                    (totalizados.pago.valor + totalizados.aPagar.valor)
                  ).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* FILTROS */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>🔍 Filtros</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Operação</InputLabel>
              <Select value={filtros.operacao} label="Operação" onChange={(e) => handleFiltroChange('operacao', e.target.value)}>
                <MenuItem value="todas">Todas</MenuItem>
                <MenuItem value="receber">A Receber</MenuItem>
                <MenuItem value="pagar">A Pagar</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" label="Vencimento Início" type="date" InputLabelProps={{ shrink: true }}
              value={filtros.dataVencimentoInicio} onChange={(e) => handleFiltroChange('dataVencimentoInicio', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" label="Vencimento Fim" type="date" InputLabelProps={{ shrink: true }}
              value={filtros.dataVencimentoFim} onChange={(e) => handleFiltroChange('dataVencimentoFim', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button fullWidth variant="outlined" size="small" onClick={limparFiltros} sx={{ height: '40px' }}>
              Limpar Filtros
            </Button>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" label="Doc. Início" type="date" InputLabelProps={{ shrink: true }}
              value={filtros.dataDocumentoInicio} onChange={(e) => handleFiltroChange('dataDocumentoInicio', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" label="Doc. Fim" type="date" InputLabelProps={{ shrink: true }}
              value={filtros.dataDocumentoFim} onChange={(e) => handleFiltroChange('dataDocumentoFim', e.target.value)} />
          </Grid>
        </Grid>
      </Paper>

      {/* ABAS */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Fluxo de Caixa" />
          <Tab label={`A Receber (${contasReceber.filter(c => !c.data_pagamento).length})`} />
          <Tab label={`Recebidas (${contasReceber.filter(c => c.data_pagamento).length})`} />
          <Tab label={`A Pagar (${contasPagar.filter(c => !c.data_pagamento).length})`} />
          <Tab label={`Pagas (${contasPagar.filter(c => c.data_pagamento).length})`} />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 3 }}>
        {tabValue === 0 && <Box><Typography variant="h6" gutterBottom>Fluxo de Caixa</Typography><Typography variant="body1">Visualização do fluxo de caixa em desenvolvimento...</Typography></Box>}

        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Contas a Receber</Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Total a Receber: R$ {filtrarContas(contasReceber.filter(c => !c.data_pagamento), 'receber').reduce((sum, c) => sum + parseFloat(c.valor || 0), 0).toFixed(2)}
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtrarContas(contasReceber.filter(c => !c.data_pagamento), 'receber').map((conta) => (
                    <TableRow key={conta.id_conta}>
                      <TableCell>{conta.descricao || `Venda #${conta.id_venda}`}</TableCell>
                      <TableCell>{conta.cliente_nome || '-'}</TableCell>
                      <TableCell>{conta.data_vencimento ? new Date(conta.data_vencimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell align="right">R$ {parseFloat(conta.valor_parcela || conta.valor || 0).toFixed(2)}</TableCell>
                      <TableCell><Chip label="Pendente" color="warning" size="small" /></TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => darBaixaConta(conta)}
                          title="Dar Baixa"
                          sx={{ color: '#4CAF50' }}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Contas Recebidas</Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              Total Recebido: R$ {filtrarContas(contasReceber.filter(c => c.data_pagamento), 'receber').reduce((sum, c) => sum + parseFloat(c.valor || 0), 0).toFixed(2)}
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell>Data Pagamento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtrarContas(contasReceber.filter(c => c.data_pagamento), 'receber').map((conta) => (
                    <TableRow key={conta.id_conta}>
                      <TableCell>{conta.descricao || conta.documento_numero || `Conta #${conta.id_conta}`}</TableCell>
                      <TableCell>{conta.cliente_nome || '-'}</TableCell>
                      <TableCell>{conta.data_vencimento ? new Date(conta.data_vencimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell>{conta.data_pagamento ? new Date(conta.data_pagamento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell align="right">R$ {parseFloat(conta.valor_original || conta.valor || 0).toFixed(2)}</TableCell>
                      <TableCell><Chip label="Recebida" color="success" size="small" /></TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => estornarConta(conta)}
                          title="Estornar"
                          sx={{ color: '#FF9800' }}
                        >
                          <UndoIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>Contas a Pagar</Typography>
            <Alert severity="error" sx={{ mb: 2 }}>
              Total a Pagar: R$ {filtrarContas(contasPagar.filter(c => !c.data_pagamento), 'pagar').reduce((sum, c) => sum + parseFloat(c.valor || 0), 0).toFixed(2)}
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Fornecedor</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtrarContas(contasPagar.filter(c => !c.data_pagamento), 'pagar').map((conta) => (
                    <TableRow key={conta.id_conta}>
                      <TableCell>{conta.descricao || `Compra #${conta.id_compra}`}</TableCell>
                      <TableCell>{conta.fornecedor_nome || '-'}</TableCell>
                      <TableCell>{conta.data_vencimento ? new Date(conta.data_vencimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell align="right">R$ {parseFloat(conta.valor_parcela || conta.valor || 0).toFixed(2)}</TableCell>
                      <TableCell><Chip label="Pendente" color="error" size="small" /></TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => darBaixaConta(conta)}
                          title="Dar Baixa"
                          sx={{ color: '#4CAF50' }}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>Contas Pagas</Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              Total Pago: R$ {filtrarContas(contasPagar.filter(c => c.data_pagamento), 'pagar').reduce((sum, c) => sum + parseFloat(c.valor || 0), 0).toFixed(2)}
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Fornecedor</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell>Data Pagamento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtrarContas(contasPagar.filter(c => c.data_pagamento), 'pagar').map((conta) => (
                    <TableRow key={conta.id_conta}>
                      <TableCell>{conta.descricao || `Compra #${conta.id_compra}`}</TableCell>
                      <TableCell>{conta.fornecedor_nome || '-'}</TableCell>
                      <TableCell>{conta.data_vencimento ? new Date(conta.data_vencimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell>{conta.data_pagamento ? new Date(conta.data_pagamento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell align="right">R$ {parseFloat(conta.valor_parcela || conta.valor || 0).toFixed(2)}</TableCell>
                      <TableCell><Chip label="Paga" color="success" size="small" /></TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => estornarConta(conta)}
                          title="Estornar"
                          sx={{ color: '#FF9800' }}
                        >
                          <UndoIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}  
      </Paper>

      {/* FilterDrawer */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApplyFilters={() => {
          setFilterOpen(false);
          fetchFinancialData();
        }}
        filters={filtros}
        onFilterChange={setFiltros}
        title="Filtros de Contas"
      >
        {/* Filtro customizado: Tipo de Conta */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Tipo de Conta</InputLabel>
          <Select
            value={filtros.tipo_conta}
            onChange={(e) => setFiltros({ ...filtros, tipo_conta: e.target.value })}
            label="Tipo de Conta"
          >
            <MenuItem value="todas">Todas</MenuItem>
            <MenuItem value="Receber">Contas a Receber</MenuItem>
            <MenuItem value="Pagar">Contas a Pagar</MenuItem>
          </Select>
        </FormControl>

        {/* Filtro customizado: Status */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select
            value={filtros.status_conta}
            onChange={(e) => setFiltros({ ...filtros, status_conta: e.target.value })}
            label="Status"
          >
            <MenuItem value="todas">Todas</MenuItem>
            <MenuItem value="Pendente">Pendente</MenuItem>
            <MenuItem value="Paga">Paga</MenuItem>
          </Select>
        </FormControl>
      </FilterDrawer>
    </Box>
  );
};

export default FinanceiroPage;
