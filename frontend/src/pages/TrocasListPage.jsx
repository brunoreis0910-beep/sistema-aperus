import React, { useState, useEffect } from 'react';
import '../styles/print.css';
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
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  SwapHoriz as SwapIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';

const TrocasListPage = () => {
  const { axiosInstance, user, permissions, isLoading: authLoading } = useAuth();

  // Estados
  const [trocas, setTrocas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: '',
    status: '',
    cliente: ''
  });
  const [selectedTroca, setSelectedTroca] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Carregar trocas
  useEffect(() => {
    loadTrocas();
  }, []);

  const loadTrocas = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
      if (filtros.data_fim) params.data_fim = filtros.data_fim;
      if (filtros.status) params.status = filtros.status;
      if (filtros.cliente) params.cliente = filtros.cliente;

      const response = await axiosInstance.get('/trocas/', { params });
      setTrocas(response.data.trocas || []);
    } catch (error) {
      console.error('Erro ao carregar trocas:', error);
      showSnackbar('Erro ao carregar trocas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (troca) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/trocas/${troca.id_troca}/`);
      setSelectedTroca(response.data);
      setDetailDialog(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      showSnackbar('Erro ao carregar detalhes da troca', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (troca) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/trocas/${troca.id_troca}/`);
      setSelectedTroca(response.data);

      // Aguardar um pouco para garantir que os dados foram carregados
      setTimeout(() => {
        window.print();
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao preparar impressão:', error);
      showSnackbar('Erro ao preparar impressão', 'error');
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente':
        return 'warning';
      case 'concluida':
        return 'success';
      case 'cancelada':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'concluida':
        return 'Concluída';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  // Verificar permissões
  if (authLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  if (!user?.is_staff && !permissions?.trocas_acessar) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Você não tem permissão para acessar esta página.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Área de impressão - oculta na tela, visível apenas na impressão */}
      <Box className="print-only" sx={{ display: 'none', '@media print': { display: 'block' } }}>
        {selectedTroca && (
          <TrocaPrintView troca={selectedTroca} />
        )}
      </Box>

      {/* Conteúdo normal da página - oculto na impressão */}
      <Box className="no-print" sx={{ '@media print': { display: 'none' } }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SwapIcon /> Trocas Realizadas
            </Typography>

            {/* Filtros */}
            <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Data Início"
                  type="date"
                  value={filtros.data_inicio}
                  onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Data Fim"
                  type="date"
                  value={filtros.data_fim}
                  onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Status"
                  select
                  value={filtros.status}
                  onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                  SelectProps={{ native: true }}
                  size="small"
                >
                  <option value="">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={loadTrocas}
                  startIcon={<SearchIcon />}
                  sx={{ height: '40px' }}
                >
                  Buscar
                </Button>
              </Grid>
            </Grid>

            {/* Tabela de trocas */}
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : trocas.length === 0 ? (
              <Alert severity="info">Nenhuma troca encontrada</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Venda Original</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell align="right">Valor Retorno</TableCell>
                      <TableCell align="right">Valor Substituição</TableCell>
                      <TableCell align="right">Diferença</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trocas.map((troca) => {
                      const diferenca = troca.valor_total_substituicao - troca.valor_total_retorno;
                      return (
                        <TableRow key={troca.id_troca} hover>
                          <TableCell>{troca.id_troca}</TableCell>
                          <TableCell>{formatDate(troca.data_troca)}</TableCell>
                          <TableCell>#{troca.id_venda_original}</TableCell>
                          <TableCell>{troca.id_cliente || 'N/A'}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>
                            {formatCurrency(troca.valor_total_retorno)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'success.main' }}>
                            {formatCurrency(troca.valor_total_substituicao)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(Math.abs(diferenca))}
                            {diferenca > 0 && ' (Cobrar)'}
                            {diferenca < 0 && ' (Crédito)'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(troca.status)}
                              color={getStatusColor(troca.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Ver Detalhes">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleViewDetails(troca)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Imprimir">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handlePrint(troca)}
                              >
                                <PrintIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Detalhes */}
        <Dialog
          open={detailDialog}
          onClose={() => setDetailDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Detalhes da Troca #{selectedTroca?.id_troca}
          </DialogTitle>
          <DialogContent dividers>
            {selectedTroca && (
              <TrocaDetailsView troca={selectedTroca} />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialog(false)}>Fechar</Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => {
                setDetailDialog(false);
                handlePrint(selectedTroca);
              }}
            >
              Imprimir
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

// Componente para visualização de detalhes
const TrocaDetailsView = ({ troca }) => {
  const diferenca = troca.valor_total_substituicao - troca.valor_total_retorno;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="text.secondary">Informações Gerais</Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>

      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">Data da Troca:</Typography>
        <Typography variant="body1">{formatDate(troca.data_troca)}</Typography>
      </Grid>

      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">Status:</Typography>
        <Chip
          label={troca.status}
          color={troca.status === 'concluida' ? 'success' : 'warning'}
          size="small"
        />
      </Grid>

      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">Venda Original:</Typography>
        <Typography variant="body1">#{troca.id_venda_original}</Typography>
      </Grid>

      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">Cliente:</Typography>
        <Typography variant="body1">
          {troca.cliente_nome || troca.id_cliente || 'N/A'}
        </Typography>
      </Grid>

      {/* Itens de Retorno */}
      <Grid item xs={12} sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">Itens Devolvidos</Typography>
        <Divider sx={{ mb: 1 }} />
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Produto</TableCell>
                <TableCell align="right">Quantidade</TableCell>
                <TableCell align="right">Valor Unit.</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {troca.itens && troca.itens.filter(item => item.id_produto_retorno).map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    {item.nome_produto_retorno || `Produto #${item.id_produto_retorno}`}
                    {item.codigo_produto_retorno && ` (${item.codigo_produto_retorno})`}
                  </TableCell>
                  <TableCell align="right">{item.quantidade_retorno}</TableCell>
                  <TableCell align="right">{formatCurrency(item.valor_unit_retorno)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.valor_total_retorno)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      {/* Itens de Substituição */}
      <Grid item xs={12} sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">Itens de Substituição</Typography>
        <Divider sx={{ mb: 1 }} />
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Produto</TableCell>
                <TableCell align="right">Quantidade</TableCell>
                <TableCell align="right">Valor Unit.</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {troca.itens && troca.itens.filter(item => item.id_produto_substituicao).map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    {item.nome_produto_substituicao || `Produto #${item.id_produto_substituicao}`}
                    {item.codigo_produto_substituicao && ` (${item.codigo_produto_substituicao})`}
                  </TableCell>
                  <TableCell align="right">{item.quantidade_substituicao}</TableCell>
                  <TableCell align="right">{formatCurrency(item.valor_unit_substituicao)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.valor_total_substituicao)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      {/* Resumo Financeiro */}
      <Grid item xs={12} sx={{ mt: 2 }}>
        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography>Total Retorno:</Typography>
              <Typography fontWeight="bold" color="error.main">
                {formatCurrency(troca.valor_total_retorno)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography>Total Substituição:</Typography>
              <Typography fontWeight="bold" color="success.main">
                {formatCurrency(troca.valor_total_substituicao)}
              </Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight="bold">Diferença:</Typography>
              <Typography fontWeight="bold" color={diferenca > 0 ? 'warning.main' : diferenca < 0 ? 'info.main' : 'text.primary'}>
                {formatCurrency(Math.abs(diferenca))}
                {diferenca > 0 && ' (Cobrar Cliente)'}
                {diferenca < 0 && ' (Crédito ao Cliente)'}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Grid>

      {troca.observacao && (
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">Observações:</Typography>
          <Typography variant="body1">{troca.observacao}</Typography>
        </Grid>
      )}
    </Grid>
  );
};

// Componente para impressão
const TrocaPrintView = ({ troca }) => {
  const diferenca = troca.valor_total_substituicao - troca.valor_total_retorno;

  return (
    <Box sx={{ p: 4, fontFamily: 'Arial, sans-serif' }}>
      {/* Cabeçalho da Empresa */}
      <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #000', pb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          NOME DA EMPRESA
        </Typography>
        <Typography variant="body2">
          Endereço da Empresa - Telefone: (00) 0000-0000
        </Typography>
        <Typography variant="body2">
          CNPJ: 00.000.000/0000-00
        </Typography>
      </Box>

      {/* Título do Documento */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          COMPROVANTE DE TROCA
        </Typography>
        <Typography variant="h6">
          Nº {troca.id_troca}
        </Typography>
      </Box>

      {/* Informações da Troca */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography variant="body2"><strong>Data:</strong> {formatDate(troca.data_troca)}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2"><strong>Venda Original:</strong> #{troca.id_venda_original}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2"><strong>Cliente:</strong> {troca.cliente_nome || troca.id_cliente || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2"><strong>Status:</strong> {troca.status}</Typography>
        </Grid>
        {troca.cliente_documento && (
          <Grid item xs={12}>
            <Typography variant="body2"><strong>CPF/CNPJ:</strong> {troca.cliente_documento}</Typography>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 2, borderColor: '#000' }} />

      {/* Produtos Devolvidos */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          PRODUTOS DEVOLVIDOS
        </Typography>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Produto</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Qtd</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Valor Unit.</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {troca.itens && troca.itens.filter(item => item.id_produto_retorno).map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {item.nome_produto_retorno || `Produto #${item.id_produto_retorno}`}
                  {item.codigo_produto_retorno && <br />}
                  {item.codigo_produto_retorno && <small>Código: {item.codigo_produto_retorno}</small>}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{item.quantidade_retorno}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(item.valor_unit_retorno)}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(item.valor_total_retorno)}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>TOTAL DEVOLVIDO:</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(troca.valor_total_retorno)}</td>
            </tr>
          </tbody>
        </table>
      </Box>

      {/* Produtos de Substituição */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          PRODUTOS DE SUBSTITUIÇÃO
        </Typography>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Produto</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Qtd</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Valor Unit.</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {troca.itens && troca.itens.filter(item => item.id_produto_substituicao).map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {item.nome_produto_substituicao || `Produto #${item.id_produto_substituicao}`}
                  {item.codigo_produto_substituicao && <br />}
                  {item.codigo_produto_substituicao && <small>Código: {item.codigo_produto_substituicao}</small>}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{item.quantidade_substituicao}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(item.valor_unit_substituicao)}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(item.valor_total_substituicao)}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>TOTAL SUBSTITUIÇÃO:</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{formatCurrency(troca.valor_total_substituicao)}</td>
            </tr>
          </tbody>
        </table>
      </Box>

      {/* Resumo Financeiro */}
      <Box sx={{ mb: 4, p: 2, border: '2px solid #000', backgroundColor: '#f9f9f9' }}>
        <Grid container spacing={1}>
          <Grid item xs={8}>
            <Typography variant="body1"><strong>Total Devolvido:</strong></Typography>
          </Grid>
          <Grid item xs={4} sx={{ textAlign: 'right' }}>
            <Typography variant="body1">{formatCurrency(troca.valor_total_retorno)}</Typography>
          </Grid>

          <Grid item xs={8}>
            <Typography variant="body1"><strong>Total Substituição:</strong></Typography>
          </Grid>
          <Grid item xs={4} sx={{ textAlign: 'right' }}>
            <Typography variant="body1">{formatCurrency(troca.valor_total_substituicao)}</Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1, borderColor: '#000' }} />
          </Grid>

          <Grid item xs={8}>
            <Typography variant="h6"><strong>DIFERENÇA:</strong></Typography>
          </Grid>
          <Grid item xs={4} sx={{ textAlign: 'right' }}>
            <Typography variant="h6"><strong>{formatCurrency(Math.abs(diferenca))}</strong></Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body1" sx={{ textAlign: 'center', mt: 1 }}>
              <strong>
                {diferenca > 0 && '** VALOR A COBRAR DO CLIENTE **'}
                {diferenca < 0 && '** CRÉDITO GERADO PARA O CLIENTE **'}
                {diferenca === 0 && '** TROCA SEM DIFERENÇA DE VALORES **'}
              </strong>
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Observações */}
      {troca.observacao && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2"><strong>Observações:</strong></Typography>
          <Typography variant="body2">{troca.observacao}</Typography>
        </Box>
      )}

      {/* Assinaturas */}
      <Box sx={{ mt: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <Box sx={{ borderTop: '1px solid #000', pt: 1, textAlign: 'center' }}>
              <Typography variant="body2">Assinatura do Cliente</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ borderTop: '1px solid #000', pt: 1, textAlign: 'center' }}>
              <Typography variant="body2">Assinatura do Responsável</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Rodapé */}
      <Box sx={{ mt: 4, textAlign: 'center', fontSize: '10px' }}>
        <Typography variant="caption">
          Documento emitido em {new Date().toLocaleString('pt-BR')}
        </Typography>
      </Box>
    </Box>
  );
};

export default TrocasListPage;
