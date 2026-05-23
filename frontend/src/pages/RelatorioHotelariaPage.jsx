import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Chip,
  Tooltip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import {
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  MeetingRoom as BedIcon,
  TrendingUp as TrendingUpIcon,
  MonetizationOn as RevenueIcon,
  People as PeopleIcon,
  Percent as PercentIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const RelatorioHotelariaPage = () => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  // Estados de dados
  const [loading, setLoading] = useState(false);
  const [reservas, setReservas] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [quartos, setQuartos] = useState([]);
  
  // Filtros
  const hoje = new Date().toISOString().split('T')[0];
  const primeiroDia = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [filtros, setFiltros] = useState({
    data_inicio: primeiroDia,
    data_fim: hoje,
    quarto_id: '',
    status: 'todos'
  });

  useEffect(() => {
    carregarQuartos();
    buscarDados();
  }, []);

  const carregarQuartos = async () => {
    try {
      const response = await axiosInstance.get('/hotel/quartos/');
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setQuartos(data);
    } catch (error) {
      console.error('Erro ao carregar quartos:', error);
      setQuartos([]);
    }
  };

  const buscarDados = async () => {
    setLoading(true);
    try {
      const params = {
        data_inicio: filtros.data_inicio,
        data_fim: filtros.data_fim,
        status: filtros.status
      };
      if (filtros.quarto_id) {
        params.quarto_id = filtros.quarto_id;
      }
      
      const response = await axiosInstance.get('/hotel/reservas/relatorio/', { params });
      
      setReservas(response.data.reservas || []);
      setKpis(response.data.kpis || null);
      
      if (response.data.reservas.length === 0) {
        showToast('Nenhuma reserva encontrada para o período e filtros selecionados', 'info');
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      showToast('Erro ao carregar relatório de hotelaria', 'error');
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setFiltros({
      data_inicio: primeiroDia,
      data_fim: hoje,
      quarto_id: '',
      status: 'todos'
    });
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    // Remove o T e a hora se existirem
    const data = new Date(dataStr.substring(0, 10) + 'T12:00:00');
    return data.toLocaleDateString('pt-BR');
  };

  const getStatusChip = (status) => {
    const statusMap = {
      'confirmada': { label: 'Confirmada', color: 'warning' },
      'checkin': { label: 'Check-in (Ativa)', color: 'info' },
      'finalizada': { label: 'Finalizada', color: 'success' },
      'cancelada': { label: 'Cancelada', color: 'error' },
      'noshow': { label: 'No-show', color: 'default' }
    };
    const mapped = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={mapped.label} color={mapped.color} size="small" sx={{ fontWeight: 'bold' }} />;
  };

  const verComprovante = (idReserva) => {
    // Redireciona para o endpoint HTML de comprovante
    const API_URL = axiosInstance.defaults.baseURL || '';
    window.open(`${API_URL}/hotel/reservas/${idReserva}/imprimir_comprovante/`, '_blank');
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <style>{`
        @media print {
          .no-print, button, header, nav, aside, .MuiButton-root, .MuiCard-root:has(.no-print) {
            display: none !important;
          }
          main, .MuiBox-root {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
          }
          .MuiPaper-root {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
        }
      `}</style>

      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} className="no-print">
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => navigate('/relatorios')} color="primary">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Relatório de Hospedagem (PMS)
          </Typography>
        </Stack>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            disabled={loading || reservas.length === 0}
            sx={{ mr: 1, textTransform: 'none', fontWeight: 'bold' }}
          >
            Imprimir Relatório
          </Button>
          <Tooltip title="Atualizar dados">
            <span>
              <IconButton onClick={buscarDados} disabled={loading} color="primary">
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Título de Impressão (Aparece apenas na impressão) */}
      <Box sx={{ display: 'none', mb: 3 }} className="print-title">
        <Typography variant="h5" align="center" sx={{ fontWeight: 'bold' }}>
          Relatório de Hospedagem - Hotel ERP
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          Período: {formatarData(filtros.data_inicio)} a {formatarData(filtros.data_fim)}
        </Typography>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }} className="no-print">
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.secondary' }}>
            Filtros de Busca
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Data Inicial"
                type="date"
                fullWidth
                size="small"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Data Final"
                type="date"
                fullWidth
                size="small"
                value={filtros.data_fim}
                onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Quarto</InputLabel>
                <Select
                  value={filtros.quarto_id}
                  onChange={(e) => setFiltros({ ...filtros, quarto_id: e.target.value })}
                  label="Quarto"
                >
                  <MenuItem value="">Todos os Quartos</MenuItem>
                  {quartos.map((quarto) => (
                    <MenuItem key={quarto.id_quarto} value={quarto.id_quarto}>
                      Quarto {quarto.numero_quarto} ({quarto.tipo_nome})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filtros.status}
                  onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="todos">Todos os Status</MenuItem>
                  <MenuItem value="confirmada">Confirmada</MenuItem>
                  <MenuItem value="checkin">Check-in (Ativa)</MenuItem>
                  <MenuItem value="finalizada">Finalizada (Check-out)</MenuItem>
                  <MenuItem value="cancelada">Cancelada</MenuItem>
                  <MenuItem value="noshow">No-show</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }} className="no-print">
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
              onClick={buscarDados}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              Filtrar
            </Button>
            <Button
              variant="outlined"
              onClick={limparFiltros}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              Limpar Filtros
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Painel de KPIs */}
      {kpis && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Card Receita Geral */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              boxShadow: 2,
              '&:hover': { boxShadow: 4 }
            }}>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 1.5, color: 'primary.main', display: 'flex' }}>
                    <RevenueIcon />
                  </Box>
                  <Box>
                    <Typography color="textSecondary" variant="caption" sx={{ fontWeight: 'bold' }}>
                      Receita Total Geral
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {formatarMoeda(kpis.total_geral)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      Diárias: {formatarMoeda(kpis.total_diarias)} | Consumo: {formatarMoeda(kpis.total_consumo)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Card Taxa de Ocupação */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              borderLeft: '4px solid',
              borderColor: 'success.main',
              boxShadow: 2,
              '&:hover': { boxShadow: 4 }
            }}>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1, bgcolor: 'success.light', borderRadius: 1.5, color: 'success.main', display: 'flex' }}>
                    <PercentIcon />
                  </Box>
                  <Box>
                    <Typography color="textSecondary" variant="caption" sx={{ fontWeight: 'bold' }}>
                      Taxa de Ocupação
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {kpis.taxa_ocupacao}%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Quarto-noites no período selecionado
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Card ADR */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              borderLeft: '4px solid',
              borderColor: 'warning.main',
              boxShadow: 2,
              '&:hover': { boxShadow: 4 }
            }}>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 1.5, color: 'warning.main', display: 'flex' }}>
                    <TrendingUpIcon />
                  </Box>
                  <Box>
                    <Typography color="textSecondary" variant="caption" sx={{ fontWeight: 'bold' }}>
                      ADR (Diária Média)
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {formatarMoeda(kpis.adr)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Total Diárias / Noites Vendidas ({kpis.total_noites_sold})
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Card Hóspedes Ativos */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              borderLeft: '4px solid',
              borderColor: 'info.main',
              boxShadow: 2,
              '&:hover': { boxShadow: 4 }
            }}>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1, bgcolor: 'info.light', borderRadius: 1.5, color: 'info.main', display: 'flex' }}>
                    <PeopleIcon />
                  </Box>
                  <Box>
                    <Typography color="textSecondary" variant="caption" sx={{ fontWeight: 'bold' }}>
                      Hóspedes Ativos
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {kpis.hospedes_ativos}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Hospedagens ativas hoje (Check-in)
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabela de Reservas */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Hóspede</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acomodação</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Previsto Entrada/Saída</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Total Diárias</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Consumo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Total Geral</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center" className="no-print">Comprovante</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                    Nenhuma hospedagem encontrada para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                reservas.map((r) => (
                  <TableRow key={r.id_reserva} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>#{r.id_reserva}</TableCell>
                    <TableCell>{r.hospede_nome}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BedIcon fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Quarto {r.quarto_numero} ({r.tipo_quarto_nome})
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatarData(r.data_entrada_prevista)} a {formatarData(r.data_saida_prevista)}
                      </Typography>
                      {r.data_checkin_real && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Check-in real: {new Date(r.data_checkin_real).toLocaleString('pt-BR')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{formatarMoeda(r.total_diarias)}</TableCell>
                    <TableCell align="right">{formatarMoeda(r.total_consumo)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {formatarMoeda(r.total_geral)}
                    </TableCell>
                    <TableCell align="center">{getStatusChip(r.status_reserva)}</TableCell>
                    <TableCell align="center" className="no-print">
                      <Tooltip title="Ver Comprovante / Voucher">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => verComprovante(r.id_reserva)}
                        >
                          <ReceiptIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};

export default RelatorioHotelariaPage;
