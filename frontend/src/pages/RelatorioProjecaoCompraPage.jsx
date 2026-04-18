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
  FormControlLabel,
  Switch,
  TextField,
  Stack
} from '@mui/material';
import {
  Download as DownloadIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const RelatorioProjecaoCompraPage = () => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState([]);
  const [totais, setTotais] = useState(null);
  const [depositos, setDepositos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    id_deposito: '',
    id_grupo: '',
    marca: '',
    categoria: '',
    somente_abaixo_minimo: 'true',
    dias_projecao: 30
  });

  useEffect(() => {
    carregarDepositos();
    carregarGrupos();
    carregarMarcas();
    carregarCategorias();
    buscarDados();
  }, []);

  const carregarDepositos = async () => {
    try {
      const response = await axiosInstance.get('/depositos/');
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setDepositos(data);
    } catch (error) {
      console.error('Erro ao carregar depósitos:', error);
      setDepositos([]);
    }
  };

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

  const carregarMarcas = async () => {
    try {
      const response = await axiosInstance.get('/produtos/marcas/');
      setMarcas(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar marcas:', error);
      setMarcas([]);
    }
  };

  const carregarCategorias = async () => {
    try {
      const response = await axiosInstance.get('/produtos/categorias/');
      setCategorias(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategorias([]);
    }
  };

  const buscarDados = async () => {
    setLoading(true);
    try {
      const params = {
        ...filtros,
        formato: 'json'
      };
      
      const response = await axiosInstance.get('/relatorios/projecao-compra/', { params });
      
      setDados(response.data.produtos || []);
      setTotais(response.data.totais || null);
      
      if (response.data.produtos.length === 0) {
        showToast('Nenhum produto necessita compra no momento', 'info');
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      showToast('Erro ao carregar relatório de projeção de compra', 'error');
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
      
      const response = await axiosInstance.get('/relatorios/projecao-compra/', {
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `projecao_compra_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToast('Relatório exportado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      showToast('Erro ao exportar relatório', 'error');
    }
  };

  const exportarPDF = async () => {
    try {
      const params = {
        ...filtros,
        formato: 'pdf'
      };
      
      const response = await axiosInstance.get('/relatorios/projecao-compra/', {
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `projecao_compra_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToast('Relatório PDF exportado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      showToast('Erro ao exportar relatório PDF', 'error');
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRÍTICO': return 'error';
      case 'URGENTE': return 'warning';
      case 'BAIXO': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CRÍTICO': return <ErrorIcon />;
      case 'URGENTE': return <WarningIcon />;
      default: return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Relatório de Projeção de Compra
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Produtos abaixo do estoque mínimo com sugestão de quantidade de compra
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="error"
            startIcon={<DownloadIcon />}
            onClick={exportarPDF}
            disabled={loading || dados.length === 0}
            sx={{ mr: 1 }}
          >
            Exportar PDF
          </Button>
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
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Depósito</InputLabel>
                <Select
                  value={filtros.id_deposito}
                  onChange={(e) => setFiltros({ ...filtros, id_deposito: e.target.value })}
                  label="Depósito"
                >
                  <MenuItem value="">Todos os Depósitos</MenuItem>
                  {depositos.map((deposito) => (
                    <MenuItem key={deposito.id_deposito} value={deposito.id_deposito}>
                      {deposito.nome_deposito}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Marca</InputLabel>
                <Select
                  value={filtros.marca}
                  onChange={(e) => setFiltros({ ...filtros, marca: e.target.value })}
                  label="Marca"
                >
                  <MenuItem value="">Todas as Marcas</MenuItem>
                  {marcas.map((marca) => (
                    <MenuItem key={marca} value={marca}>
                      {marca}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={filtros.categoria}
                  onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                  label="Categoria"
                >
                  <MenuItem value="">Todas as Categorias</MenuItem>
                  {categorias.map((categoria) => (
                    <MenuItem key={categoria} value={categoria}>
                      {categoria}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Dias de Projeção"
                type="number"
                fullWidth
                size="small"
                value={filtros.dias_projecao}
                onChange={(e) => setFiltros({ ...filtros, dias_projecao: parseInt(e.target.value) || 30 })}
                InputProps={{ inputProps: { min: 1, max: 365 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filtros.somente_abaixo_minimo === 'true'}
                    onChange={(e) => setFiltros({
                      ...filtros,
                      somente_abaixo_minimo: e.target.checked ? 'true' : 'false'
                    })}
                  />
                }
                label="Apenas Abaixo do Mínimo"
              />
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
                  Total de Produtos
                </Typography>
                <Typography variant="h5" component="div">
                  {totais.total_produtos}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
              <CardContent>
                <Typography gutterBottom sx={{ color: 'white' }}>
                  Produtos Críticos
                </Typography>
                <Typography variant="h5" component="div" sx={{ color: 'white' }}>
                  {totais.produtos_criticos}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
              <CardContent>
                <Typography gutterBottom sx={{ color: 'white' }}>
                  Produtos Urgentes
                </Typography>
                <Typography variant="h5" component="div" sx={{ color: 'white' }}>
                  {totais.produtos_urgentes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Valor Estimado Total
                </Typography>
                <Typography variant="h5" component="div" color="primary.main">
                  {formatarMoeda(totais.valor_total_estimado)}
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
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Código</TableCell>
                <TableCell sx={{ color: 'white' }}>Produto</TableCell>
                <TableCell sx={{ color: 'white' }}>Grupo</TableCell>
                <TableCell sx={{ color: 'white' }}>Depósito</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Atual</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Mínimo</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Consumo/Dia</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Dias p/ Acabar</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Qtd Sugerida</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Vlr Estimado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dados.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    Nenhum produto necessita compra no momento
                  </TableCell>
                </TableRow>
              ) : (
                dados.map((item) => (
                  <TableRow
                    key={`${item.id_produto}-${item.deposito}`}
                    hover
                    sx={{
                      bgcolor: item.status === 'CRÍTICO'
                        ? 'error.lighter'
                        : item.status === 'URGENTE'
                        ? 'warning.lighter'
                        : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                        icon={getStatusIcon(item.status)}
                      />
                    </TableCell>
                    <TableCell>{item.codigo}</TableCell>
                    <TableCell>{item.nome}</TableCell>
                    <TableCell>{item.grupo}</TableCell>
                    <TableCell>{item.deposito}</TableCell>
                    <TableCell align="right">
                      <Typography
                        sx={{
                          color: item.quantidade_atual <= 0 ? 'error.main' : 'inherit',
                          fontWeight: item.quantidade_atual <= 0 ? 'bold' : 'normal'
                        }}
                      >
                        {item.quantidade_atual.toFixed(3)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{item.quantidade_minima.toFixed(3)}</TableCell>
                    <TableCell align="right">{item.consumo_medio_diario.toFixed(3)}</TableCell>
                    <TableCell align="right">
                      {item.dias_ate_acabar !== null ? (
                        <Typography
                          sx={{
                            color: item.dias_ate_acabar <= 7 ? 'error.main' : item.dias_ate_acabar <= 14 ? 'warning.main' : 'inherit',
                            fontWeight: item.dias_ate_acabar <= 7 ? 'bold' : 'normal'
                          }}
                        >
                          {Math.floor(item.dias_ate_acabar)} dias
                        </Typography>
                      ) : (
                        <Typography color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="primary">
                        {item.quantidade_sugerida.toFixed(3)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">
                        {formatarMoeda(item.valor_estimado_compra)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Legenda */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Legenda de Status:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label="CRÍTICO - Sem estoque" color="error" size="small" />
          <Chip label="URGENTE - Abaixo de 50% do mínimo" color="warning" size="small" />
          <Chip label="BAIXO - Abaixo do mínimo" color="info" size="small" />
        </Box>
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          * Quantidade sugerida calculada para atingir o estoque máximo ou 3x o mínimo
        </Typography>
        <Typography variant="caption" color="textSecondary">
          * Consumo médio e dias para acabar baseados nos últimos {filtros.dias_projecao} dias de vendas
        </Typography>
      </Paper>
    </Box>
  );
};

export default RelatorioProjecaoCompraPage;
