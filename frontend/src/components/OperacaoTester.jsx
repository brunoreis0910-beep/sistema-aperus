import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import axios from 'axios';

// Configurar base URL do axios
axios.defaults.baseURL = window.location.origin;

// Interceptor para incluir token
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken') ||
      sessionStorage.getItem('access_token') ||
      sessionStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const OperacaoTester = () => {
  const [loading, setLoading] = useState(false);
  const [operacoes, setOperacoes] = useState([]);
  const [operacaoSelecionada, setOperacaoSelecionada] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getTransacaoLabel = (transacao) => {
    switch (transacao) {
      case 'Entrada': return 'Entrada';
      case 'Saida': return 'Saída';
      case 'Devolucao': return 'Devolução';
      default: return transacao || 'N/A';
    }
  };

  const carregarOperacoes = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      console.log('🚀 Testando carregamento de operações...');

      const response = await axios.get('/api/operacoes/');
      console.log('✅ Resposta da API:', response);
      console.log('✅ Status:', response.status);
      console.log('✅ Headers:', response.headers);
      console.log('✅ Data:', response.data);

      const operacoesData = response.data.results || response.data;

      if (!Array.isArray(operacoesData)) {
        throw new Error(`Resposta inválida: esperado array, recebido ${typeof operacoesData}`);
      }

      setOperacoes(operacoesData);
      setSuccess(`✅ ${operacoesData.length} operações carregadas com sucesso!`);

    } catch (err) {
      console.error('❌ Erro ao carregar operações:', err);

      if (err.response?.status === 401) {
        setError('🔐 Token expirado ou inválido. Faça login novamente.');
      } else if (err.response?.status === 403) {
        setError('🚫 Sem permissão para acessar operações.');
      } else if (err.response?.status === 404) {
        setError('📭 Endpoint /api/operacoes/ não encontrado.');
      } else {
        setError(`❌ Erro: ${err.message}`);
      }

      setOperacoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOperacoes();
  }, []);

  const selecionarOperacao = (operacao) => {
    setOperacaoSelecionada(operacao);
    console.log('🔧 Operação selecionada:', operacao);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="h1">
            🧪 Testador de Operações
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={carregarOperacoes}
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Recarregar'}
          </Button>
        </Box>
      </Paper>

      {/* Mensagens */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Carregando operações...</Typography>
        </Box>
      )}

      {/* Resumo */}
      {!loading && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Resumo
                </Typography>
                <Typography variant="body1">
                  Total de operações: <strong>{operacoes.length}</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Fonte: tabela 'operacoes' via /api/operacoes/
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🔧 Teste de Seleçéo
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Selecionar Operação</InputLabel>
                  <Select
                    value={operacaoSelecionada?.id_operacao || ''}
                    onChange={(e) => {
                      const op = operacoes.find(o => o.id_operacao === e.target.value);
                      selecionarOperacao(op);
                    }}
                  >
                    <MenuItem value="">Nenhuma selecionada</MenuItem>
                    {operacoes.map(op => (
                      <MenuItem key={op.id_operacao} value={op.id_operacao}>
                        {op.nome_operacao}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Detalhes da operação selecionada */}
      {operacaoSelecionada && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🔍 Detalhes da Operação Selecionada
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography><strong>ID:</strong> {operacaoSelecionada.id_operacao}</Typography>
              <Typography><strong>Nome:</strong> {operacaoSelecionada.nome_operacao}</Typography>
              <Typography><strong>Empresa:</strong> {operacaoSelecionada.empresa || 'N/A'}</Typography>
              <Typography><strong>Transação:</strong> {getTransacaoLabel(operacaoSelecionada.transacao)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography><strong>Modelo Doc:</strong> {operacaoSelecionada.modelo_documento || 'N/A'}</Typography>
              <Typography><strong>Emitente:</strong> {operacaoSelecionada.emitente || 'N/A'}</Typography>
              <Typography><strong>Auto Numeração:</strong> {operacaoSelecionada.usa_auto_numeracao ? 'Sim' : 'não'}</Typography>
              <Typography><strong>Série NF:</strong> {operacaoSelecionada.serie_nf || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={`Baixa Estoque: ${operacaoSelecionada.tipo_estoque_baixa || 'Nenhum'}`}
                  color={operacaoSelecionada.tipo_estoque_baixa !== 'Nenhum' ? 'warning' : 'default'}
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={`Incremento Estoque: ${operacaoSelecionada.tipo_estoque_incremento || 'Nenhum'}`}
                  color={operacaoSelecionada.tipo_estoque_incremento !== 'Nenhum' ? 'success' : 'default'}
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={`Gera Financeiro: ${operacaoSelecionada.gera_financeiro ? 'Sim' : 'não'}`}
                  color={operacaoSelecionada.gera_financeiro ? 'primary' : 'default'}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabela de operações */}
      {!loading && operacoes.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            📋 Lista de Operações ({operacoes.length})
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Empresa</TableCell>
                  <TableCell>Transação</TableCell>
                  <TableCell>Baixa Estoque</TableCell>
                  <TableCell>Inc. Estoque</TableCell>
                  <TableCell>Gera Financeiro</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {operacoes.map((op) => (
                  <TableRow
                    key={op.id_operacao}
                    sx={{
                      backgroundColor: operacaoSelecionada?.id_operacao === op.id_operacao
                        ? 'rgba(25, 118, 210, 0.08)'
                        : 'inherit'
                    }}
                  >
                    <TableCell>{op.id_operacao}</TableCell>
                    <TableCell>
                      <strong>{op.nome_operacao}</strong>
                    </TableCell>
                    <TableCell>{op.empresa || '-'}</TableCell>
                    <TableCell>{op.transacao || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={op.tipo_estoque_baixa || 'Nenhum'}
                        size="small"
                        color={op.tipo_estoque_baixa !== 'Nenhum' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={op.tipo_estoque_incremento || 'Nenhum'}
                        size="small"
                        color={op.tipo_estoque_incremento !== 'Nenhum' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={op.gera_financeiro ? 'Sim' : 'não'}
                        size="small"
                        color={op.gera_financeiro ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<InfoIcon />}
                        onClick={() => selecionarOperacao(op)}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Estado vazio */}
      {!loading && operacoes.length === 0 && !error && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <StorageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            Nenhuma operação encontrada
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Verifique se a tabela 'operacoes' possui dados ou se você está logado.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default OperacaoTester;