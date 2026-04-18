import React, { useState, useEffect } from 'react';
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
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const RelatorioLucratividadePage = () => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState([]);
  const [totais, setTotais] = useState(null);
  const [grupos, setGrupos] = useState([]);
  
  // Filtros
  const hoje = new Date().toISOString().split('T')[0];
  const primeiroDia = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [filtros, setFiltros] = useState({
    data_inicial: primeiroDia,
    data_final: hoje,
    id_grupo: ''
  });

  useEffect(() => {
    carregarGrupos();
    buscarDados();
  }, []);

  const carregarGrupos = async () => {
    try {
      const response = await axiosInstance.get('/grupos-produto/');
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setGrupos(data);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      setGrupos([]);
    }
  };

  const buscarDados = async () => {
    setLoading(true);
    try {
      const params = {
        ...filtros,
        formato: 'json'
      };
      
      const response = await axiosInstance.get('/relatorios/lucratividade/', { params });
      
      setDados(response.data.produtos || []);
      setTotais(response.data.totais || null);
      
      if (response.data.produtos.length === 0) {
        showToast('Nenhum dado encontrado para o período selecionado', 'info');
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      showToast('Erro ao carregar relatório de lucratividade', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    try {
      const params = {
        ...filtros,
        formato: 'excel'
      };
      
      const response = await axiosInstance.get('/relatorios/lucratividade/', {
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lucratividade_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToast('Relatório exportado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      showToast('Erro ao exportar relatório', 'error');
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusColor = (margem) => {
    if (margem >= 30) return 'success';
    if (margem >= 20) return 'info';
    if (margem >= 10) return 'warning';
    return 'error';
  };

  const getStatusLabel = (margem) => {
    if (margem >= 30) return 'Excelente';
    if (margem >= 20) return 'Bom';
    if (margem >= 10) return 'Regular';
    return 'Baixo';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Relatório de Lucratividade
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={exportarExcel}
            disabled={loading || dados.length === 0}
            sx={{ mr: 1 }}
          >
            Exportar Excel
          </Button>
          <Tooltip title="Atualizar">
            <span>
              <IconButton onClick={buscarDados} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                label="Data Inicial"
                type="date"
                fullWidth
                size="small"
                value={filtros.data_inicial}
                onChange={(e) => setFiltros({ ...filtros, data_inicial: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                label="Data Final"
                type="date"
                fullWidth
                size="small"
                value={filtros.data_final}
                onChange={(e) => setFiltros({ ...filtros, data_final: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Grupo de Produtos</InputLabel>
                <Select
                  value={filtros.id_grupo}
                  onChange={(e) => setFiltros({ ...filtros, id_grupo: e.target.value })}
                  label="Grupo de Produtos"
                >
                  <MenuItem value="">Todos os Grupos</MenuItem>
                  {grupos.map((grupo) => (
                    <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                      {grupo.nome_grupo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
              onClick={buscarDados}
              disabled={loading}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Resumo */}
      {totais && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Receita Total
                </Typography>
                <Typography variant="h5" component="div">
                  {formatarMoeda(totais.receita_total)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Custo Total
                </Typography>
                <Typography variant="h5" component="div">
                  {formatarMoeda(totais.custo_total)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Lucro Total
                </Typography>
                <Typography variant="h5" component="div" color={totais.lucro_total >= 0 ? 'success.main' : 'error.main'}>
                  {formatarMoeda(totais.lucro_total)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Margem Média
                </Typography>
                <Typography variant="h5" component="div">
                  {totais.margem_media.toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabela */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white' }}>Código</TableCell>
                <TableCell sx={{ color: 'white' }}>Produto</TableCell>
                <TableCell sx={{ color: 'white' }}>Grupo</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Qtd Vendida</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Receita</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Custo</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Lucro</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Margem</TableCell>
                <TableCell sx={{ color: 'white' }} align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dados.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Nenhum dado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                dados.map((item) => (
                  <TableRow key={item.id_produto} hover>
                    <TableCell>{item.codigo}</TableCell>
                    <TableCell>{item.nome}</TableCell>
                    <TableCell>{item.grupo}</TableCell>
                    <TableCell align="right">{item.quantidade_vendida.toFixed(3)}</TableCell>
                    <TableCell align="right">{formatarMoeda(item.receita_total)}</TableCell>
                    <TableCell align="right">{formatarMoeda(item.custo_total)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {item.lucro_bruto >= 0 ? (
                          <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                        ) : (
                          <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                        )}
                        <Typography
                          sx={{
                            color: item.lucro_bruto >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {formatarMoeda(item.lucro_bruto)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{item.margem_lucro_percentual.toFixed(2)}%</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusLabel(item.margem_lucro_percentual)}
                        color={getStatusColor(item.margem_lucro_percentual)}
                        size="small"
                      />
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

export default RelatorioLucratividadePage;
