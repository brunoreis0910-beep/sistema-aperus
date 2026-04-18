import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { format } from 'date-fns';

const RelatorioCashback = () => {
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState([]);
  const [totais, setTotais] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    cliente: '',
    utilizado: '',
    status: '',
    data_inicio: '',
    data_fim: '',
    vencimento_inicio: '',
    vencimento_fim: '',
  });

  useEffect(() => {
    carregarClientes();
    carregarRelatorio();
  }, []);

  const carregarClientes = async () => {
    try {
      const response = await api.get('/api/clientes/');
      const _d = response.data;
      setClientes(Array.isArray(_d) ? _d : Array.isArray(_d?.results) ? _d.results : []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const carregarRelatorio = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (filtros.cliente) params.cliente = filtros.cliente;
      if (filtros.utilizado) params.utilizado = filtros.utilizado;
      if (filtros.status) params.status = filtros.status;
      if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
      if (filtros.data_fim) params.data_fim = filtros.data_fim;
      if (filtros.vencimento_inicio) params.vencimento_inicio = filtros.vencimento_inicio;
      if (filtros.vencimento_fim) params.vencimento_fim = filtros.vencimento_fim;

      const response = await api.get('/api/relatorios/cashback/', { params });
      
      if (response.data.success) {
        setDados(response.data.dados);
        setTotais(response.data.totais);
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limparFiltros = () => {
    setFiltros({
      cliente: '',
      utilizado: '',
      status: '',
      data_inicio: '',
      data_fim: '',
      vencimento_inicio: '',
      vencimento_fim: '',
    });
    setClienteSelecionado(null);
  };

  const exportarExcel = () => {
    // TODO: Implementar exportação para Excel
    alert('Funcionalidade de exportação em desenvolvimento');
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  const formatarData = (dataISO) => {
    if (!dataISO) return '-';
    try {
      return format(new Date(dataISO), 'dd/MM/yyyy HH:mm');
    } catch {
      return '-';
    }
  };

  const formatarDataCurta = (dataISO) => {
    if (!dataISO) return '-';
    try {
      return format(new Date(dataISO), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Disponível':
        return 'success';
      case 'Parcialmente Utilizado':
        return 'warning';
      case 'Totalmente Utilizado':
        return 'default';
      case 'Expirado':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        relatório de Cashback
      </Typography>

      {/* Card de Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          
          <Grid container spacing={2}>
            {/* Cliente */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={clientes}
                getOptionLabel={(option) => option.nome_razao_social || ''}
                value={clienteSelecionado}
                onChange={(event, newValue) => {
                  setClienteSelecionado(newValue);
                  handleFiltroChange('cliente', newValue ? newValue.id_cliente : '');
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Cliente" size="small" />
                )}
              />
            </Grid>

            {/* Status de Utilização */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Utilizado</InputLabel>
                <Select
                  value={filtros.utilizado}
                  label="Utilizado"
                  onChange={(e) => handleFiltroChange('utilizado', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="sim">Totalmente Utilizado</MenuItem>
                  <MenuItem value="nao">Não Utilizado</MenuItem>
                  <MenuItem value="parcial">Parcialmente Utilizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filtros.status}
                  label="Status"
                  onChange={(e) => handleFiltroChange('status', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="disponivel">Disponível</MenuItem>
                  <MenuItem value="utilizado">Utilizado</MenuItem>
                  <MenuItem value="expirado">Expirado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Data Geração Início */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Data Geração (De)"
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Data Geração Fim */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Data Geração (Até©)"
                type="date"
                value={filtros.data_fim}
                onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Data Vencimento Início */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Vencimento (De)"
                type="date"
                value={filtros.vencimento_inicio}
                onChange={(e) => handleFiltroChange('vencimento_inicio', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Data Vencimento Fim */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Vencimento (Até©)"
                type="date"
                value={filtros.vencimento_fim}
                onChange={(e) => handleFiltroChange('vencimento_fim', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={carregarRelatorio}
              disabled={loading}
            >
              Buscar
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={limparFiltros}
            >
              Limpar
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportarExcel}
            >
              Exportar Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={imprimirRelatorio}
            >
              Imprimir
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Card de Totais */}
      {totais && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Total Gerado
                </Typography>
                <Typography variant="h5" color="primary">
                  {formatarValor(totais.total_gerado)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Total Utilizado
                </Typography>
                <Typography variant="h5" color="warning.main">
                  {formatarValor(totais.total_utilizado)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Total Disponível
                </Typography>
                <Typography variant="h5" color="success.main">
                  {formatarValor(totais.total_disponivel)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Quantidade de Registros
                </Typography>
                <Typography variant="h5">
                  {totais.quantidade}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Resultados */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : dados.length === 0 ? (
            <Alert severity="info">Nenhum registro encontrado</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell align="right"><strong>Valor Gerado</strong></TableCell>
                    <TableCell align="right"><strong>Valor Utilizado</strong></TableCell>
                    <TableCell align="right"><strong>Saldo Disponível</strong></TableCell>
                    <TableCell align="center"><strong>Data Geração</strong></TableCell>
                    <TableCell align="center"><strong>Data Vencimento</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dados.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {row.cliente_nome}
                        </Typography>
                        {row.cliente_apelido && (
                          <Typography variant="caption" color="text.secondary">
                            {row.cliente_apelido}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {formatarValor(row.valor_gerado)}
                      </TableCell>
                      <TableCell align="right">
                        {formatarValor(row.valor_utilizado)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={row.saldo > 0 ? 'success.main' : 'text.secondary'}
                        >
                          {formatarValor(row.saldo)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {formatarDataCurta(row.data_geracao)}
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          color={row.vencido ? 'error' : 'text.primary'}
                        >
                          {formatarDataCurta(row.data_validade)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.status}
                          color={getStatusColor(row.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RelatorioCashback;
